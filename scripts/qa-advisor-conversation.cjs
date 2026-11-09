"use strict";
// Isolated browser QA: requests are mocked in-page; no production or database writes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const output = path.resolve(process.env.PCC_QA_OUTPUT || path.join(root, "../../output/advisor-conversation-qa"));
const report = { checks: [], errors: [] };
fs.mkdirSync(output, { recursive: true });
const files = new Map(["advisor-widget.js", "advisor-widget.css", "styles.css"].map(file => ["/" + file, path.join(root, file)]));
const server = http.createServer((req, res) => {
  if (files.has(req.url)) { res.setHeader("Content-Type", req.url.endsWith(".js") ? "text/javascript" : "text/css"); res.end(fs.readFileSync(files.get(req.url))); return; }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/advisor-widget.css"></head><body data-page="home"><main><h1>Puerto Cancún Center · QA local</h1></main><script src="/advisor-widget.js"></script></body></html>');
});

function response(patch = {}) {
  return { reply: "Te ayudo a encontrar una propiedad. ¿Buscas comprar o rentar?", state: { filters: {}, preferences: [] }, cards: [], alternatives: [], total: null, canSaveSearch: false, phase: "collecting", pendingField: "operation", provider: "guided", inquiryContext: { origin: "web-advisor" }, ...patch };
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
  try {
    for (const width of [320, 390, 1440]) for (const lang of ["es", "en"]) {
      const en = lang === "en", tr = (es, english) => en ? english : es;
      const page = await browser.newPage({ viewport: { width, height: width < 400 ? 844 : 1000 } });
      page.on("pageerror", error => report.errors.push(error.message));
      await page.addInitScript(({ lang, greeting }) => {
        document.addEventListener("DOMContentLoaded", () => document.documentElement.lang = lang);
        window.__calls = []; window.__next = greeting;
        window.PccInquiry = { open: data => { window.__inquiry = data; } };
        window.api = async (url, options) => {
          window.__calls.push({ url, body: structuredClone(options.body) });
          if (window.__defer) {
            window.__defer = false;
            return new Promise((resolve, reject) => { window.__complete = { resolve, reject }; });
          }
          return structuredClone(window.__next);
        };
      }, { lang, greeting: response({ reply: tr("¿Buscas comprar o rentar?", "Are you looking to buy or rent?") }) });
      await page.goto(base, { waitUntil: "load" });
      await page.locator(".advisor-launch").click();
      await page.waitForFunction(() => document.querySelector('.advisor-dialog').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator(".advisor-suggestions button").count(), 2);
      assert.equal(await page.locator("[data-advisor-contact]").count(), 1);
      assert.equal(await page.locator(".advisor-next-actions").count(), 0);
      assert.equal(await page.locator(".advisor-message-user").count(), 0, "Opening does not invent a user greeting");

      const buyingState = { filters: { operation: "sale" }, preferences: [] };
      await page.evaluate(value => window.__next = value, response({ reply: tr("¿Qué zona o desarrollo te interesa?", "Which zone or development interests you?"), state: buyingState, pendingField: "location", suggestions: [{ label: "Puerto Cancún", message: "Puerto Cancún" }, { label: tr("Zona Hotelera", "Hotel Zone"), message: tr("Zona Hotelera", "Hotel Zone") }] }));
      await page.locator(".advisor-suggestions button").first().focus();
      await page.locator(".advisor-suggestions button").first().press("Enter");
      await page.waitForFunction(() => document.querySelector('label[for="advisor-message"]').textContent.includes('zona') || document.querySelector('label[for="advisor-message"]').textContent.includes('zone'));
      assert.equal(await page.locator(".advisor-suggestions").count(), 1);
      assert.equal(await page.locator("[data-advisor-contact]").count(), 1);

      await page.evaluate(value => window.__next = value, response({ reply: tr("¿Buscas vista al mar, frente al mar o cerca de la playa?", "Do you mean an ocean view, beachfront or near the beach?"), state: buyingState, pendingField: "coastal" }));
      await page.locator("#advisor-message").fill(tr("mar", "sea"));
      await page.locator('.advisor-compose [type="submit"]').click();
      await page.waitForFunction(() => document.querySelector('.advisor-suggestions')?.children.length === 3);
      assert.equal(await page.locator(".advisor-next-actions").count(), 0, "Sea preference is not an empty search");
      assert.equal((await page.evaluate(() => window.__calls.at(-1).body.state.filters.operation)), "sale", "Operation survives the follow-up");
      const layout = await page.evaluate(() => {
        const dialog = document.querySelector('.advisor-dialog'), compose = document.querySelector('.advisor-compose'), input = document.querySelector('#advisor-message');
        const bounds = dialog.getBoundingClientRect();
        return { documentWidth: document.documentElement.scrollWidth, dialogWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth, left: bounds.left, right: bounds.right, composeFits: compose.scrollWidth <= compose.clientWidth + 1, inputSize: getComputedStyle(input).fontSize, touchHeights: Array.from(document.querySelectorAll('.advisor-suggestions button')).map(button => button.getBoundingClientRect().height) };
      });
      assert.ok(layout.documentWidth <= width + 1, JSON.stringify(layout));
      assert.ok(layout.dialogWidth <= layout.clientWidth + 1 && layout.left >= 0 && layout.right <= width + 1, JSON.stringify(layout));
      assert.ok(layout.composeFits);
      assert.ok(layout.touchHeights.every(height => height >= 44));
      assert.equal(layout.inputSize, "16px");
      await page.screenshot({ path: path.join(output, `${lang}-${width}-coastal.png`) });

      const defined = { filters: { operation: "sale", type: "Departamento", locations: ["puerto-cancun"], max: 700000, currency: "USD" }, preferences: [] };
      await page.evaluate(value => window.__next = value, response({ reply: tr("No hay opciones con estos criterios.", "No listings match these criteria."), state: defined, phase: "no_results", pendingField: "", total: 0, canSaveSearch: true, inquiryContext: { intent: "buy", searchFilters: defined.filters, summary: "saved criteria" } }));
      await page.locator(".advisor-suggestions button").first().click();
      await page.waitForSelector(".advisor-next-actions button");
      assert.equal(await page.locator(".advisor-suggestions").count(), 0);
      await page.locator(".advisor-next-actions button").click();
      const inquiry = await page.evaluate(() => window.__inquiry);
      assert.equal(inquiry.service, "search-watch"); assert.equal(inquiry.searchFilters.max, 700000);
      await page.locator(".advisor-launch").click();
      assert.equal(await page.locator('.advisor-dialog').getAttribute('data-phase'), 'no_results');

      await page.evaluate(() => window.__defer = true);
      await page.locator("#advisor-message").fill(tr("Ahora con dos baños", "Now with two bathrooms"));
      await page.locator('.advisor-compose [type="submit"]').click();
      await page.waitForFunction(() => Boolean(window.__complete));
      await page.locator("#advisor-message").fill(tr("Otro dato que quiero añadir", "Another detail I want to add"));
      const pendingCalls = await page.evaluate(() => window.__calls.length);
      await page.locator('[data-advisor-close]').click();
      await page.locator('.advisor-launch').click();
      assert.equal(await page.evaluate(() => window.__calls.length), pendingCalls, "Reopening during a request cannot start a second conversation");
      await page.evaluate(() => window.__complete.reject(new Error('fixture network error')));
      await page.waitForSelector('[data-advisor-retry]:not([hidden])');
      assert.equal(await page.locator("#advisor-message").inputValue(), tr("Otro dato que quiero añadir", "Another detail I want to add"), "A failed response does not erase a new draft");
      const userCount = await page.locator(".advisor-message-user").count();
      await page.locator('[data-advisor-retry]').click();
      await page.waitForFunction(() => document.querySelector('.advisor-dialog').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator(".advisor-message-user").count(), userCount, "Retry does not duplicate the chat bubble");
      assert.equal((await page.evaluate(() => window.__calls.at(-1).body.state.filters.max)), 700000);

      await page.evaluate(value => window.__next = value, { ...response({ state: { filters: {} }, total: 0, canSaveSearch: true, questions: [tr("¿Buscas comprar o rentar?", "Are you looking to buy or rent?")] }), phase: undefined, pendingField: undefined, reply: "No hay resultados" });
      await page.locator("#advisor-message").fill("vivienda");
      await page.locator('.advisor-compose [type="submit"]').click();
      await page.waitForFunction(() => document.querySelector('.advisor-dialog').dataset.phase === 'collecting');
      assert.equal(await page.locator(".advisor-next-actions").count(), 0, "Legacy incomplete searches cannot expose save alerts");
      assert.doesNotMatch(await page.locator('.advisor-message-assistant').last().innerText(), /No hay resultados/);
      assert.equal(await page.locator("[data-advisor-contact]").count(), 1);
      report.checks.push({ lang, width, passed: true, layout });
      await page.close();
    }
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ passed: report.checks.length, screenshots: output, errors: report.errors }) + "\n");
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { fs.writeFileSync(path.join(output, "failure.json"), JSON.stringify({ error: error.stack, report }, null, 2)); console.error(error); process.exitCode = 1; });
