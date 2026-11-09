"use strict";
// Runs the real widget and real advisor handler against a read-only public snapshot.
// All network requests stay on this temporary localhost server; writes are rejected.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { getCountries, getCountryCallingCode } = require("libphonenumber-js/max");
const { askAdvisor } = require("../real-estate-advisor");
const root = path.resolve(__dirname, "..");
const snapshotFile = path.resolve(process.env.PCC_PUBLIC_SNAPSHOT || path.join(root, "../qa-http/nov9-public-after.json"));
const snapshot = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
const output = path.resolve(process.env.PCC_QA_OUTPUT || path.join(root, "../../output/advisor-integrated-qa"));
const report = { snapshotFile, inventoryCount: snapshot.properties.length, checks: [], pageErrors: [], rejectedWrites: 0 };
fs.mkdirSync(output, { recursive: true });
const app = express(); app.use(express.json({ limit: "64kb" }));
app.post("/api/advisor/chat", async (req, res) => {
  try { res.json(await askAdvisor(req.body, { properties: snapshot.properties, areas: snapshot.directory?.areas })); }
  catch (error) { res.status(error.status || 500).json({ error: error.message }); }
});
app.get("/api/inquiries/options", (_req, res) => res.json({ countries: getCountries().map(country => ({ country, prefix: "+" + getCountryCallingCode(country) })), featuredCountry: "MX", channels: { email: false, whatsapp: false } }));
app.use((req, res, next) => { if (req.method !== "GET") { report.rejectedWrites++; return res.status(403).json({ error: "QA is read-only" }); } next(); });
for (const file of ["styles.css", "advisor-widget.css", "advisor-widget.js", "contextual-contact.css", "contextual-contact.js"]) app.get("/" + file, (_req, res) => res.sendFile(path.join(root, file)));
app.get("/", (req, res) => {
  const lang = req.query.lang === "en" ? "en" : "es";
  res.type("html").send(`<!doctype html><html lang="${lang}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/contextual-contact.css"><link rel="stylesheet" href="/advisor-widget.css"></head><body data-page="home"><main><h1>Puerto Cancún Center · QA local</h1></main><script>
  window.__responses=[]; window.__requests=[];
  window.api=async function(url,options){window.__requests.push({url,body:structuredClone(options.body)});const response=await fetch(url,{method:options.method||'GET',headers:{'Content-Type':'application/json'},body:options.body?JSON.stringify(options.body):undefined});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error),{status:response.status});window.__responses.push(data);return data;};
  window.PccInquiryRequest=(url,body)=>window.api(url,{method:'POST',body});
  </script><script src="/contextual-contact.js"></script><script src="/advisor-widget.js"></script></body></html>`);
});
const server = http.createServer(app);

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
  try {
    for (const width of [320, 390, 1440]) for (const lang of ["es", "en"]) {
      const en = lang === "en", page = await browser.newPage({ viewport: { width, height: width < 400 ? 844 : 1000 } });
      page.on("pageerror", error => report.pageErrors.push(error.message));
      const turns = [];
      const last = () => page.evaluate(() => window.__responses.at(-1));
      const summarize = async (message, result) => {
        const value = { message, phase: result.phase, pendingField: result.pendingField, reply: result.reply, filters: result.state.filters, preferences: result.state.preferences, cards: result.cards.map(card => card.title), alternatives: result.alternatives.map(card => ({ title: card.title, differences: card.differences })), total: result.total };
        turns.push(value);
        const fits = await page.evaluate(() => { const d = document.querySelector('.advisor-dialog'), c = document.querySelector('.advisor-compose'); return document.documentElement.scrollWidth <= innerWidth + 1 && d.scrollWidth <= d.clientWidth + 1 && c.scrollWidth <= c.clientWidth + 1; });
        assert.ok(fits, lang + width + " overflow after " + message);
        assert.equal(await page.locator('[data-advisor-contact]').count(), 1);
        return result;
      };
      const send = async message => {
        const count = await page.evaluate(() => window.__responses.length);
        await page.locator('#advisor-message').fill(message);
        await page.locator('.advisor-compose [type="submit"]').click();
        await page.waitForFunction(count => window.__responses.length > count && document.querySelector('.advisor-dialog').getAttribute('aria-busy') === 'false', count);
        return summarize(message, await last());
      };
      await page.goto(base + "?lang=" + lang, { waitUntil: "load" });
      await page.locator('.advisor-launch').click();
      await page.waitForFunction(() => window.__responses.length === 1 && document.querySelector('.advisor-dialog').getAttribute('aria-busy') === 'false');
      let result = await summarize(en ? "hello" : "hola", await last());
      assert.equal(result.phase, 'collecting'); assert.equal(result.pendingField, 'operation');
      result = await send(en ? "housing" : "vivienda");
      assert.equal(result.phase, 'collecting'); assert.equal(result.total, null); assert.equal(result.cards.length, 0);
      assert.equal(await page.locator('.advisor-next-actions button').count(), 0);
      result = await send(en ? "sea" : "mar");
      assert.equal(result.pendingField, 'coastal'); assert.equal(result.phase, 'clarification');
      assert.equal(await page.locator('.advisor-suggestions button').count(), 3);
      assert.equal(await page.locator('.advisor-next-actions button').count(), 0);
      await page.screenshot({ path: path.join(output, `${lang}-${width}-coastal.png`) });
      result = await send(en ? "ocean view" : "vista al mar");
      assert.ok(result.state.preferences.includes('sea_view'));
      assert.equal(result.pendingField, 'operation');
      result = await send(en ? "buy" : "comprar");
      assert.equal(result.state.filters.operation, 'sale'); assert.notEqual(result.pendingField, 'operation');
      result = await send(en ? "apartment" : "departamento");
      assert.equal(result.state.filters.operation, 'sale'); assert.equal(result.state.filters.type, 'Departamento');
      result = await send("Puerto Cancun");
      assert.ok(result.state.filters.locations.includes('puerto-cancun'));
      assert.equal(result.state.filters.type, 'Departamento');
      result = await send(en ? "2 million" : "2 millones");
      assert.equal(result.state.filters.max, 2000000); assert.equal(result.pendingField, 'currency');
      assert.equal(result.canSaveSearch, false); assert.equal(await page.locator('.advisor-next-actions button').count(), 0);
      result = await send("USD");
      assert.equal(result.state.filters.max, 2000000); assert.equal(result.state.filters.currency, 'USD');
      assert.equal(result.state.filters.operation, 'sale'); assert.ok(result.state.preferences.includes('sea_view'));
      assert.ok(result.cards.length || result.alternatives.length, 'Expected real options in the public snapshot');
      assert.equal(result.phase, 'results');
      assert.doesNotMatch(result.state.filters.text || '', /vivienda|housing|\bmar\b|\bsea\b/);
      const ids = new Set(snapshot.properties.map(property => property.id));
      assert.ok([...result.cards, ...result.alternatives].every(card => ids.has(card.id)));
      await page.screenshot({ path: path.join(output, `${lang}-${width}-results.png`) });
      await page.locator('[data-advisor-contact]').click();
      await page.waitForSelector('.contextual-inquiry[open]');
      assert.equal(await page.locator('.contextual-inquiry [name="intent"]').inputValue(), 'buy');
      assert.equal(await page.locator('.contextual-inquiry [name="budget"]').inputValue(), '2000000');
      assert.equal(await page.locator('.contextual-inquiry [name="currency"]').inputValue(), 'USD');
      assert.match(await page.locator('.contextual-inquiry [name="preferences"]').inputValue(), en ? /(?:ocean|sea) view/i : /vista al mar/i);
      await page.screenshot({ path: path.join(output, `${lang}-${width}-contact.png`) });
      await page.locator('[data-inquiry-close]').click();
      const contextCount = await page.evaluate(() => window.__responses.length);
      await page.evaluate(propertyId => window.PccAdvisor.open({ propertyId }), result.cards[0].id);
      await page.waitForFunction(count => window.__responses.length > count && document.querySelector('.advisor-dialog').getAttribute('aria-busy') === 'false', contextCount);
      assert.equal((await last()).phase, 'context');
      const reset = await send(en ? 'new search' : 'nueva búsqueda');
      assert.equal(reset.conversationReset, true);
      const restarted = await send(en ? 'housing' : 'vivienda');
      assert.equal(restarted.state.contextId, '');
      assert.deepEqual(await page.evaluate(() => window.__requests.at(-1).body.context), {}, 'A conversation reset clears the selected listing on the next request');
      report.checks.push({ width, lang, passed: true, turns });
      await page.close();
    }
    assert.equal(report.rejectedWrites, 0); assert.deepEqual(report.pageErrors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ passed: report.checks.length, inventoryCount: report.inventoryCount, screenshotDirectory: output, finalResults: report.checks.map(check => { const final = check.turns.find(turn => turn.message === 'USD'); return { width: check.width, lang: check.lang, total: final.total, cards: final.cards, alternatives: final.alternatives.length }; }), rejectedWrites: report.rejectedWrites, pageErrors: report.pageErrors }) + '\n');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: error.stack, report }, null, 2)); console.error(error); process.exitCode = 1; });
