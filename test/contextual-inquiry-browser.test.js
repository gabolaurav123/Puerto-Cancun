"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createHarness } = require("./helpers/public-inquiry-harness");

test("one-step inquiries preserve channel, context, focus and retry identity in mobile and desktop ES/EN", {
  skip: process.env.PCC_LAYOUT_BROWSER !== "1",
}, async t => {
  const { chromium } = require(process.env.PCC_PLAYWRIGHT_MODULE || "playwright");
  const h = await createHarness({ browser: true, channels: { email: true, whatsapp: false } }); t.after(h.close);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCC_LAYOUT_CHROMIUM || undefined });
  t.after(() => browser.close());
  const contexts = [];
  for (const [lang, width] of [["es", 360], ["en", 360], ["es", 1366], ["en", 1366]]) {
    const context = await browser.newContext({ viewport: { width, height: width === 360 ? 740 : 900 }, isMobile: width === 360, hasTouch: width === 360 });
    contexts.push(context);
    await context.route("**/*", route => route.request().url().startsWith(h.base + "/") ? route.continue() : route.abort());
    const page = await context.newPage();
    const origin = h.base + (lang === "en" ? "/en/catalog" : "/catalogo") + "?zone=puerto-cancun&view=map&priceMode=public-usd";
    await page.goto(origin);
    await page.locator("#openInquiry").click();
    const dialog = page.locator("dialog.contextual-inquiry[open]");
    const field = name => dialog.locator('[name="' + name + '"]');
    await field("contactChannel").waitFor();
    assert.equal(await field("contactChannel").evaluate(node => document.activeElement === node), true);
    assert.equal(await dialog.locator("[data-inquiry-next]").count(), 0);
    assert.equal(await field("intent").inputValue(), "buy");
    assert.equal(await field("propertyType").count(), 0); assert.equal(await field("zone").count(), 0);
    assert.match(await dialog.innerText(), /QA100/);
    await field("contactChannel").selectOption("email");
    assert.equal(await field("phone").isVisible(), false); assert.equal(await field("phone").isDisabled(), true);
    assert.equal(await field("email").isVisible(), true); assert.equal(await field("email").getAttribute("type"), "email");
    assert.equal(await field("email").evaluate(node => node.required), true);
    assert.equal(await field("name").evaluate(node => node.required), false);
    await field("email").fill(`buyer-${lang}-${width}@example.test`);
    await dialog.locator("[data-inquiry-close]").click();
    assert.equal(page.url(), origin); assert.equal(await page.locator("#openInquiry").evaluate(node => document.activeElement === node), true);
    await page.locator("#openInquiry").click(); await field("contactChannel").waitFor();
    assert.equal(await field("contactChannel").inputValue(), "email"); assert.equal(await field("email").inputValue(), `buyer-${lang}-${width}@example.test`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await field("consent").check();
    await page.waitForTimeout(1100);
    const responsePromise = page.waitForResponse(response => response.url().endsWith("/api/inquiries") && response.request().method() === "POST");
    await dialog.locator('[type="submit"]').click();
    const response = await responsePromise; assert.equal(response.status(), 201);
    const submitted = response.request().postDataJSON(); assert.equal(submitted.contactChannel, "email"); assert.equal(submitted.phone, undefined); assert.equal(submitted.country, undefined);
    await dialog.locator("[data-inquiry-success]").waitFor({ state: "visible" });
    assert.equal(await dialog.locator("[data-inquiry-success]").evaluate(node => document.activeElement === node), true);
    await dialog.locator("[data-inquiry-done]").click(); assert.equal(page.url(), origin);
  }

  const page = await contexts[1].newPage();
  const open = async (values, lang = "en") => {
    await page.goto(h.base + (lang === "en" ? "/en/contact" : "/contacto") + "?" + new URLSearchParams({ inquiry: "1", origin: "browser-" + randomUUID(), ...values }));
    const dialog = page.locator("dialog.contextual-inquiry[open]"); await dialog.locator('[name="contactChannel"]').waitFor(); return dialog;
  };
  for (const [propertyId, intent, heading] of [["fixture-rent", "rent", "Request information"], ["fixture-presale", "buy", "Presale information"], ["fixture-land", "buy", "Request information"]]) {
    const dialog = await open({ propertyId, intent: intent === "rent" ? "buy" : "rent" });
    assert.equal(await dialog.locator('[name="intent"]').inputValue(), intent);
    assert.equal(await dialog.locator("h2").innerText(), heading);
    assert.equal(await dialog.locator('select[name="intent"]').count(), 0);
    if (propertyId === "fixture-land") assert.match(await dialog.innerText(), /Cozumel/);
    await dialog.locator("[data-inquiry-close]").click();
  }

  const visit = await open({ propertyId: "fixture-sale", intent: "buy", service: "visit" });
  assert.equal(await visit.locator('[name="visitPreferredAt"]').evaluate(node => node.required), false);
  await visit.locator('[name="contactChannel"]').selectOption("email"); await visit.locator('[name="email"]').fill("visit@example.test"); await visit.locator('[name="consent"]').check();
  await page.waitForTimeout(1100); await visit.locator('[type="submit"]').click(); await visit.locator("[data-inquiry-success]").waitFor({ state: "visible" });
  assert.equal(h.tours.at(-1).preferredDate, null); assert.equal(h.tours.at(-1).preferredTime, null);

  const watch = await open({ intent: "buy", service: "search-watch", searchFilters: JSON.stringify({ entity: "properties", operation: "sale", currency: "MXN", max: 20000000 }) });
  await watch.locator('[name="contactChannel"]').selectOption("whatsapp");
  assert.equal(await watch.locator("[data-alert-option]").isVisible(), false);
  await watch.locator('[name="contactChannel"]').selectOption("email");
  assert.equal(await watch.locator("[data-alert-option]").isVisible(), true);
  assert.equal(await watch.locator('[name="alertConsent"]').isChecked(), false);
  await watch.locator("[data-inquiry-close]").click();

  const legacyFilters = { entity: "properties", operation: "sale", currency: "MXN", min: 10000000, max: 20000000 };
  for (const edited of [false, true]) {
    let legacy = await open({ intent: "buy", budget: "20000000", currency: "MXN", searchFilters: JSON.stringify(legacyFilters) });
    assert.equal(await legacy.locator('[name="budget"]').inputValue(), "");
    if (edited) {
      await legacy.locator('[name="budget"]').evaluate(node => node.closest("details").open = true);
      await legacy.locator('[name="budget"]').fill("800000");
      await legacy.locator("[data-inquiry-close]").click();
      await page.evaluate(() => { const values = Object.fromEntries(new URLSearchParams(location.search)); values.searchFilters = JSON.parse(values.searchFilters); void window.PccInquiry.open(values); });
      legacy = page.locator("dialog.contextual-inquiry[open]"); await legacy.locator('[name="contactChannel"]').waitFor();
      assert.equal(await legacy.locator('[name="budget"]').inputValue(), "800000");
    }
    await legacy.locator('[name="contactChannel"]').selectOption("email");
    await legacy.locator('[name="email"]').fill(edited ? "legacy-edited@example.test" : "legacy-kept@example.test");
    await legacy.locator('[name="consent"]').check(); await page.waitForTimeout(1100);
    const request = page.waitForResponse(r => r.url().endsWith("/api/inquiries") && r.request().method() === "POST");
    await legacy.locator('[type="submit"]').click(); const result = await request; assert.equal(result.status(), 201);
    const body = result.request().postDataJSON(), stored = h.records.get((await result.json()).id).payload;
    assert.deepEqual(body.searchFilters, legacyFilters);
    if (edited) {
      assert.equal(body.budget, "800000"); assert.equal(stored.searchFilters.max, 800000);
      assert.equal(stored.searchFilters.currency, "USD"); assert.equal(stored.searchFilters.priceMode, "public-usd");
    } else {
      assert.equal(Object.hasOwn(body, "budget"), false);
      assert.equal(stored.searchFilters.min, 10000000); assert.equal(stored.searchFilters.max, 20000000);
      assert.equal(stored.searchFilters.currency, "MXN"); assert.equal(stored.searchFilters.priceMode, undefined);
    }
    await legacy.locator("[data-inquiry-success]").waitFor({ state: "visible" });
    await legacy.locator("[data-inquiry-done]").click();
  }

  const owner = await open({ developmentId: "fixture-development", intent: "sell" });
  assert.equal(await owner.locator('[name="zone"]').count(), 0);
  assert.match(await owner.locator(".inquiry-context").innerText(), /Puerto Cancún/);
  await owner.locator('[name="propertyType"]').selectOption("Departamento");
  await owner.locator('[name="contactChannel"]').selectOption("email");
  await owner.locator('[name="email"]').fill("owner@example.test"); await owner.locator('[name="consent"]').check();
  await page.waitForTimeout(1100); await owner.locator('[type="submit"]').click();
  await owner.locator("[data-inquiry-success]").waitFor({ state: "visible" });
  assert.equal([...h.records.values()].find(row => row.email === "owner@example.test").payload.zone, "Puerto Cancún");
  await owner.locator("[data-inquiry-done]").click();

  let releaseOldContext, oldContextReached;
  const delayedContext = new Promise(resolve => { releaseOldContext = resolve; });
  const contextReached = new Promise(resolve => { oldContextReached = resolve; });
  await page.route("**/api/inquiries/context?**", async route => {
    if (new URL(route.request().url()).searchParams.get("propertyId") !== "fixture-sale") return route.continue();
    oldContextReached(); await delayedContext; await route.continue();
  }, { times: 1 });
  await page.evaluate(() => { void window.PccInquiry.open({ propertyId: "fixture-sale", intent: "buy" }); });
  await contextReached;
  await page.locator("dialog[open] [data-inquiry-close]").click();
  await page.evaluate(() => { void window.PccInquiry.open({ propertyId: "fixture-rent", intent: "rent" }); });
  const currentDialog = page.locator("dialog.contextual-inquiry[open]");
  await currentDialog.locator('[name="contactChannel"]').waitFor();
  assert.equal(await currentDialog.locator('[name="intent"]').inputValue(), "rent");
  const previousResponse = page.waitForResponse(r => r.url().includes("/api/inquiries/context?") && new URL(r.url()).searchParams.get("propertyId") === "fixture-sale");
  releaseOldContext(); await previousResponse; await page.waitForTimeout(50);
  assert.equal(await currentDialog.locator('[name="intent"]').inputValue(), "rent");
  assert.match(await currentDialog.locator(".inquiry-context").innerText(), /1877/);
  await currentDialog.locator("[data-inquiry-close]").click();

  const retryDialog = await open({ propertyId: "fixture-sale", intent: "buy" });
  await retryDialog.locator('[name="contactChannel"]').selectOption("email");
  await retryDialog.locator('[name="email"]').fill("lost-response@example.test"); await retryDialog.locator('[name="consent"]').check();
  let committed;
  await page.route("**/api/inquiries", async route => {
    const response = await route.fetch(); assert.equal(response.status(), 201); committed = await response.json(); await route.abort("failed");
  }, { times: 1 });
  await page.waitForTimeout(1100); await retryDialog.locator('[type="submit"]').click();
  await retryDialog.getByText("We could not confirm your request. Your details are still here; you can retry without duplicating the inquiry.").waitFor();
  assert.equal(await retryDialog.locator('[name="email"]').inputValue(), "lost-response@example.test");
  const repeated = page.waitForResponse(response => response.url().endsWith("/api/inquiries") && response.request().method() === "POST");
  await retryDialog.locator('[type="submit"]').click();
  const response = await repeated; assert.equal(response.status(), 200); assert.equal((await response.json()).id, committed.id);
  await retryDialog.locator("[data-inquiry-success]").waitFor({ state: "visible" });
  assert.equal([...h.records.values()].filter(row => row.email === "lost-response@example.test").length, 1);
});
