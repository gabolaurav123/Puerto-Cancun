const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

test("a mobile inquiry preserves contact details and retries a committed request after a lost response", {
  skip: !(process.env.PCC_INQUIRY_TEST_URL && process.env.PCC_LAYOUT_BROWSER === "1"),
}, async () => {
  const base = new URL(process.env.PCC_INQUIRY_TEST_URL);
  assert.ok(["localhost", "127.0.0.1"].includes(base.hostname));
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCC_LAYOUT_CHROMIUM || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await context.route("**/*", route => route.request().url().startsWith(base.origin + "/") ? route.continue() : route.abort());
    const page = await context.newPage();
    const url = new URL("/en/contact",base);
    url.search = new URLSearchParams({ intent: "buy", propertyType: "Terreno", zone: "Puerto Cancún", development: "Original development", project: "Original project", reference: "QA-ORIG", origin: "browser-"+randomUUID() });
    await page.goto(url.href);
    const dialog = page.locator("dialog.contextual-inquiry[open]");
    const field = name => dialog.locator('[name="' + name + '"]');
    await field("zone").fill("New area");
    await field("zone").press("Tab");
    assert.equal(await field("development").inputValue(),"");
    assert.ok(await field("keepOrigin").isVisible());
    assert.equal(await field("keepOrigin").isChecked(),false);
    await dialog.locator("[data-inquiry-next]").tap();
    await field("country").locator('option[value="CA"]').waitFor({ state: "attached" });
    assert.equal(await field("country").inputValue(),"MX");
    await field("country").selectOption("CA");
    await field("phone").fill("4165550174");
    await field("consent").check();
    let committed;
    await page.route("**/api/inquiries", async route => {
      const response = await route.fetch();
      assert.equal(response.status(),201);
      committed = await response.json();
      await route.abort("failed");
    }, { times: 1 });
    await page.waitForTimeout(1100); // Minimum time accepted by the public form.
    await dialog.locator('[type="submit"]').tap();
    await dialog.getByText("We could not confirm your request. Your answers are here so you can try again.").waitFor();
    assert.equal(await field("phone").inputValue(),"4165550174");
    const retry = page.waitForResponse(r => r.url().endsWith("/api/inquiries") && r.request().method() === "POST");
    await dialog.locator('[type="submit"]').tap();
    const response = await retry;
    assert.equal(response.status(),200);
    assert.equal((await response.json()).id,committed.id);
    const whatsapp = dialog.locator("[data-inquiry-whatsapp]");
    await whatsapp.waitFor();
    const message = new URL(await whatsapp.getAttribute("href")).searchParams.get("text");
    assert.match(message,/New area/);
    assert.doesNotMatch(message,/Presale: Original project|Project reference: QA-ORIG|Development: Original development/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    url.pathname = "/contacto";
    await page.goto(url.href);
    await dialog.locator("[data-inquiry-next]").tap();
    await page.waitForFunction(() => document.querySelector('dialog.contextual-inquiry [name="country"]')?.value === "CA");
    assert.equal(await field("phone").inputValue(),"4165550174");
    assert.match(await dialog.innerText(),/Cómo te contactamos/);
  } finally { await browser.close(); }
});
