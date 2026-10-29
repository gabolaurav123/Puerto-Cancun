"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const comparison = require("../comparison-ui");
const contract = require("../inventory-contract");

const property = (id, patch = {}) => ({ id, titleEs: `Residencia ${id}`, slug: `residencia-${id}`, isPublic: true, status: "active",
  publicationSection: "properties", type: "Casa", zone: "Puerto Cancun", city: "Cancun", operation: "sale", currency: "USD", priceUnit: "total",
  price: 650000, area: 200, lot: 300, beds: 3, image: "/assets/cancun-hotel-zone-hero-768.webp", ...patch });
const pair = (left = {}, right = {}) => comparison.buildComparison([property("a", left), property("b", right)], ["a", "b"]);

test("selection supports 2-4 internal IDs, never MLS identity", () => {
  const records = ["a", "b", "c", "d", "e"].map((id) => property(id, { mls: "1707" }));
  assert.equal(comparison.buildComparison(records, ["a"]).ready, false);
  const result = comparison.buildComparison(records, ["a", "a", "b", "c", "d", "e"]);
  assert.deepEqual(result.ids, ["a", "b", "c", "d"]);
  assert.equal(result.pairs.length, 6);
  assert.equal(result.limitExceeded, true);
  assert.equal(comparison.buildComparison(records, ["a", "b"]).items.length, 2);
  assert.deepEqual(comparison.buildComparison(records, ["1707"]).ids, []);
});

test("public visibility fails closed even when the contract permits legacy defaults", () => {
  const records = [property("a"), property("private", { isPublic: false }), property("draft", { status: "draft" }),
    property("archived", { status: "archived" }), property("unknown", { isPublic: undefined }), property("no-status", { status: undefined }),
    property("contradiction", { is_public: false }), property("false-string", { isPublic: "false" }), property("zero", { isPublic: 0 }),
    property("snake", { isPublic: undefined, is_public: true })];
  assert.deepEqual(comparison.buildComparison(records, records.map((p) => p.id)).ids, ["a", "snake"]);
});

test("duplicate private or conflicting copies cannot resurrect an ID", () => {
  for (const records of [[property("a"), property("a", { isPublic: false })], [property("a", { isPublic: false }), property("a")], [property("a"), property("a", { price: 100 })]]) {
    assert.deepEqual(comparison.buildComparison(records, ["a"]).ids, []);
  }
  assert.deepEqual(comparison.buildComparison([property("a"), property("a")], ["a"]).ids, ["a"]);
});

test("parse and share only validated public IDs and the canonical route", () => {
  assert.deepEqual(comparison.parseIds("/propiedades?compare=a,b,a&compare=c,%3Cscript%3E&email=private@example.test#fragment"), ["a", "b", "c"]);
  const records = [property("a"), property("b"), property("private", { isPublic: false })];
  assert.equal(comparison.sharePath(records, ["private", "missing", "a", "b"]), "/propiedades?compare=a,b");
  assert.equal(comparison.sharePath(records, ["a", "private"]), "");
  assert.deepEqual(comparison.parseIds("/propiedades?compare="), []);
  assert.equal(comparison.parseIds(`/propiedades?compare=${"a".repeat(129)}`).length, 0);
});

test("compatible original prices retain the contract amounts without conversion", () => {
  const result = pair({}, { price: 700000 });
  assert.equal(result.pairs[0].price.compatible, true);
  assert.equal(result.items[0].price.amount, contract.priceOf(property("a")).amount);
  assert.equal(result.items[1].price.amount, 700000);
});

for (const [name, patch, reason] of [
  ["currency", { currency: "MXN" }, "Moneda distinta"],
  ["basis", { priceUnit: "sqm", price: 4200 }, "Base de precio distinta"],
  ["operation", { operation: "rent", catalogData: { rentPeriod: "month" } }, "Operaci\u00f3n distinta"],
  ["entity", { type: "Desarrollo", publicationSection: "developments" }, "Entidad distinta: propiedad y desarrollo"],
  ["missing currency", { currency: undefined }, "Moneda sin confirmar"],
  ["missing operation", { operation: undefined }, "Operaci\u00f3n sin confirmar"],
  ["missing basis", { priceUnit: undefined }, "Base de precio sin confirmar"],
  ["from price", { priceUnit: "from" }, "Base de precio sin confirmar"],
]) test(`price incompatibility: ${name}`, () => {
  const result = pair({}, patch);
  assert.equal(result.pairs[0].price.compatible, false);
  assert.ok(result.pairs[0].price.reasons.includes(reason));
});

test("rent periods must be explicit and equal, with no temporal conversion", () => {
  const monthly = { operation: "rent", price: 5000, catalogData: { rentPeriod: "month" } };
  assert.equal(pair(monthly, monthly).pairs[0].price.compatible, true);
  assert.ok(pair(monthly, { ...monthly, catalogData: { rentPeriod: "day" } }).pairs[0].price.reasons.includes("Periodo de renta distinto"));
  const missing = pair(monthly, { operation: "rent", price: 5000 });
  assert.ok(missing.pairs[0].price.reasons.includes("Periodo de renta sin confirmar"));
  assert.match(comparison.priceText(missing.items[1]), /periodo sin confirmar/);
});

test("price and surface missing values remain unavailable, bedrooms zero is real zero", () => {
  for (const value of [null, undefined, "", " ", false, -1, NaN, Infinity, 0]) {
    const result = pair({ price: value, area: value, lot: value }, {});
    assert.equal(result.items[0].price.amount, null);
    assert.equal(result.items[0].area.value, null);
    assert.equal(result.items[0].lot.value, null);
    assert.equal(result.pairs[0].price.compatible, false);
  }
  assert.equal(pair({ beds: 0 }).items[0].beds, 0);
  assert.equal(pair({ beds: null }).items[0].beds, null);
  assert.equal(pair({ price: 5000, catalogData: { priceOnRequest: true } }).items[0].price.amount, null);
});

test("unknown currency never revives a contradictory legacy currency", () => {
  for (const currency of [null, "", undefined]) {
    const record = property("a", { currency, price: 123, priceUsd: 900, priceMxn: 18000 });
    const result = comparison.buildComparison([record, property("b")], ["a", "b"]);
    assert.equal(result.items[0].price.amount, 123);
    assert.equal(result.items[0].price.currency, "");
    assert.equal(result.pairs[0].price.compatible, false);
  }
});

test("legacy presale is a modality, not a physical type or confirmed land surface", () => {
  const result = pair({ type: "Preventa", lot: 300 });
  assert.equal(result.items[0].modality, "presale");
  assert.notEqual(result.items[0].type, "Preventa");
  assert.equal(result.items[0].lot.confirmed, false);
  assert.equal(result.pairs[0].lot.compatible, false);
});

test("surfaces retain concept and units; apartments' lot is not relabeled as built area", () => {
  const result = pair({ area: 0, lot: 262, type: "Departamento" }, { area: 0, lot: 378, type: "Departamento" });
  assert.equal(result.items[0].area.value, null);
  assert.equal(result.items[0].lot.value, 262);
  assert.equal(result.pairs[0].lot.compatible, false);
  assert.match(comparison.surfaceText(result.items[0].lot), /concepto por confirmar/);
  assert.equal(pair({ areaUnit: "m\u00b2" }, { areaUnit: "sqm" }).pairs[0].area.compatible, true);
  assert.ok(pair({}, { areaUnit: "ft2" }).pairs[0].area.reasons.includes("Unidad de superficie distinta"));
  assert.ok(pair({}, { areaUnit: "unknown" }).pairs[0].area.reasons.includes("Unidad de superficie sin confirmar"));
});

test("Location and entities are resolved by the shared inventory contract", () => {
  const result = pair({ zone: "Punta Sam", city: "Isla Mujeres" }, { type: "Desarrollo", publicationSection: "developments", beds: 50 });
  assert.equal(result.items[0].location.id, contract.resolveLocation(property("a", { zone: "Punta Sam", city: "Isla Mujeres" })).id);
  assert.equal(result.items[1].entity, "developments");
  assert.equal(result.items[1].beds, null);
  assert.equal(pair({ zone: "Unconfirmed", city: "Cancun" }).items[0].location.id, "");
});

test("rendering escapes untrusted strings and never copies private/admin metadata", () => {
  const title = '<img src=x onerror="window.injected=true">';
  const result = pair({ titleEs: title, ownerEmail: "private@example.test", sourceRequestId: "SECRET", developmentData: { password: "SECRET" }, descriptionEs: "SECRET", image: "javascript:alert(1)", slug: "../panel" }, {});
  const html = comparison.renderTable(result);
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!JSON.stringify(result).includes("SECRET"));
  assert.ok(!html.includes("private@example.test"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("../panel"));
  for (const image of ["/uploads/%2e%2e/panel/image", "//example.test/image", "https://user:secret@example.test/image", "data:image/svg+xml,<svg/>"]) {
    assert.equal(pair({ image }).items[0].image, "");
  }
  assert.match(html, /scope="row"/);
  assert.match(html, /Rec\u00e1maras/);
});

test("public DTO media paths retain listing images without admitting private media or traversal", () => {
  const id = "property-dto_1707";
  for (const patch of [{ image: `/media/properties/${id}/0` }, { image: null, images: [`/media/properties/${id}/12`] }]) {
    const state = comparison.buildComparison([property(id, patch), property("b")], [id, "b"]);
    assert.equal(state.items[0].image, patch.image || patch.images[0]);
    assert.ok(comparison.renderTable(state).includes(`src="${state.items[0].image}"`));
  }
  for (const image of ["/media/requests/private/0", "/media/guest-requests/private/0", "/media/users/private/0",
    "/media/properties/another-private-id/0", `/media/properties/${id}/video`, `/media/properties/${id}/-1`,
    `/media/properties/${id}/1.5`, `/media/properties/${id}/0?private=true`, `/media/properties/${id}/0#private`,
    `/media/properties/${id}/../private/0`, `/media/properties/${id}/%2e%2e/private/0`,
    `/media/properties/${id}/%30`, `//private.example.test/media/properties/${id}/0`]) {
    const state = comparison.buildComparison([property(id, { image }), property("b")], [id, "b"]);
    assert.equal(state.items[0].image, "", image);
  }
  assert.equal(comparison.buildComparison([property(id, { isPublic: false, image: `/media/properties/${id}/0` })], [id]).items.length, 0);
});

test("public input objects are not mutated", () => {
  const original = property("a", { catalogData: { rentPeriod: "month" } });
  const before = JSON.stringify(original);
  comparison.buildComparison([original, property("b")], ["a", "b"]);
  assert.equal(JSON.stringify(original), before);
});

test("English projection localizes titles, type, Location, links, prices and reasons without conversion", () => {
  const records = [property("a", { titleEn: "Marina apartment", type: "Departamento", zone: "Punta Sam", operation: "rent", price: 5000.25, catalogData: { rentPeriod: "month" }, urlEn: "/en/properties/marina-apartment" }),
    property("b", { title_en: "Beach home", currency: "MXN", areaUnit: "ft2" })];
  const result = comparison.buildComparison(records, ["a", "b"], { lang: "en-US" });
  assert.equal(result.items[0].title, "Marina apartment");
  assert.equal(result.items[0].type, "Apartment");
  assert.equal(result.items[0].location.name, "Hotel Zone (HZ)");
  assert.equal(result.items[0].href, "/en/properties/marina-apartment");
  assert.equal(comparison.priceText(result.items[0]), "USD 5,000.25 total / month");
  assert.ok(result.pairs[0].price.reasons.includes("Different currencies"));
  assert.ok(result.pairs[0].area.reasons.includes("Different area units"));
  const html = comparison.renderTable(result);
  for (const value of ["Bedrooms", "For rent", "Original price", "Favorite", "Request a visit", "/en/contact?propertyId=a"]) assert.ok(html.includes(value), value);
  assert.ok(!/Rec\u00e1maras|Consultar|Favorito|Renta|Moneda distinta/.test(html));
  assert.equal(comparison.sharePath(records, ["a", "b"], { lang: "en-GB" }), "/en/properties?compare=a,b");
  assert.equal(comparison.sharePath(records, ["a", "b"], { lang: "es" }), "/propiedades?compare=a,b");
});

test("missing English title and unsafe or Spanish English URLs use honest local fallbacks", () => {
  const result = comparison.buildComparison([property("a", { urlEn: "/propiedades/spanish-title" }), property("b", { titleEn: '<script>private@example.test</script>', urlEn: "https://evil.test/path" })], ["a", "b"], { lang: "en" });
  assert.equal(result.items[0].title, "Listing a (English title pending)");
  assert.equal(result.items[0].href, "/en/properties/residencia-a");
  assert.equal(result.items[1].href, "/en/properties/residencia-b");
  assert.ok(!comparison.renderTable(result).includes("private@example.test"));
  assert.ok(!comparison.renderTable(result).includes("<script>"));
  assert.match(comparison.priceText(comparison.buildComparison([property("a", { price: null, catalogData: { priceOnRequest: true } })], ["a"], "en").items[0]), /Price on request/);
});

test("additional facts are explicit, dates are not inferred, and private metadata is excluded", () => {
  const result = comparison.buildComparison([property("a", { baths: 2.5, parking: 0, maintenance: { amount: 1200, currency: "MXN", period: "month", owner: "SECRET" },
    catalogData: { salesModality: "presale" }, developmentData: { deliveryDate: "2027-02-28", owner: "SECRET" }, lastVerifiedAt: "2026-10-29T23:10:00Z", verifiedBy: "SECRET" }),
  property("b", { updatedAt: "2026-10-29", maintenance: 99, developmentData: { deliveryDate: "2027-02-30" }, catalogData: { salesModality: "unknown" } })], ["a", "b"], { lang: "en" });
  const [a, b] = result.items;
  assert.equal(a.baths, 2.5); assert.equal(a.parking, 0);
  assert.equal(a.modality, "presale"); assert.equal(a.delivery, "2027-02-28"); assert.equal(a.verified, "2026-10-29");
  assert.equal(b.baths, null); assert.equal(b.parking, null); assert.equal(b.maintenance.amount, null); assert.equal(b.delivery, null); assert.equal(b.verified, null); assert.equal(b.modality, "");
  const html = comparison.renderTable(result);
  for (const value of ["Bathrooms", "Parking spaces", "Maintenance fee", "MXN 1,200 / month", "Presale", "Feb 28, 2027", "Oct 29, 2026"]) assert.ok(html.includes(value), value);
  assert.ok(!JSON.stringify(result).includes("SECRET"));
});

test("only differences uses semantic values, retains warnings and leaves listing actions available", () => {
  const same = pair();
  const sameHtml = comparison.renderTable(same, [], "en", true);
  assert.match(sameHtml, /No differences in these fields/);
  assert.ok(sameHtml.includes('data-pcc-action="favorite"'));
  const differing = pair({ baths: 2 }, { baths: 3 });
  const html = comparison.renderTable(differing, [], "en", true);
  assert.ok(html.includes("Bathrooms"));
  assert.ok(!html.includes('scope="row">Bedrooms'));
  const unknown = pair({ priceUnit: undefined }, { priceUnit: undefined });
  assert.match(comparison.renderTable(unknown, [], "en", true), /Price basis unconfirmed/);
});

const browserModule = process.env.PCC_PLAYWRIGHT_MODULE;
test("browser: mobile, keyboard, URLs, privacy, lifecycle, favorites and CTA", { skip: !browserModule, timeout: 90000 }, async (t) => {
  const { chromium } = require(browserModule);
  const repo = path.resolve(__dirname, "..");
  const browser = await chromium.launch({ headless: true, ...(process.env.PCC_BROWSER_CHANNEL ? { channel: process.env.PCC_BROWSER_CHANNEL } : {}) });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = [], errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const fixture = [property("a", { titleEs: "Departamento con terraza y vista a la marina", mls: "1707" }), property("b", { titleEs: "Residencia frente al mar", mls: "1707" }),
    property("c", { currency: "MXN" }), property("d", { operation: "rent", catalogData: { rentPeriod: "month" } }), property("e"),
    property("private", { titleEs: "PRIVATE TITLE MUST NEVER APPEAR", isPublic: false, status: "draft" })];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url()); requests.push({ path: url.pathname, method: route.request().method() });
    if (url.origin !== "http://comparison.test") return route.abort();
    if (["/inventory-contract.js", "/comparison-ui.js", "/comparison.css"].includes(url.pathname)) return route.fulfill({ contentType: url.pathname.endsWith("css") ? "text/css" : "text/javascript", body: fs.readFileSync(path.join(repo, url.pathname.slice(1))) });
    if (["/assets/cancun-hotel-zone-hero-768.webp", "/media/properties/a/0"].includes(url.pathname)) return route.fulfill({ contentType: "image/webp", body: fs.readFileSync(path.join(repo, "assets/cancun-hotel-zone-hero-768.webp")) });
    if (["/propiedades", "/en/properties"].includes(url.pathname)) return route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${url.pathname.startsWith("/en") ? "en" : "es"}"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/comparison.css"><body><main><h1>Inventario publico</h1><button data-compare="legacy">Comparador existente</button><button data-favorite="legacy">Favorito existente</button><a href="/contacto" id="legacy-contact">Contacto existente</a><button data-compare-id="a">Comparar A</button><button data-compare-id="c">Comparar C</button><button data-compare-id="d">Comparar D</button><button data-compare-id="e">Comparar E</button></main><script src="/inventory-contract.js"></script><script src="/comparison-ui.js"></script></body></html>` });
    return route.abort();
  });
  await page.goto("http://comparison.test/propiedades?compare=a,b,private,missing&zone=Puerto%20Cancun&email=not-to-share@example.test");
  await page.evaluate((properties) => {
    window.records = properties;
    localStorage.setItem("pcc.compare", '["legacy"]');
    localStorage.setItem("pcc.favorites", '["legacy-favorite"]');
    window.actions = [];
    window.toggleFavorite = async (id) => { window.actions.push(["favorite", id]); const ids = JSON.parse(localStorage.getItem("pcc.favorites")); localStorage.setItem("pcc.favorites", JSON.stringify(ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id])); };
    window.contactAdvisor = (id) => window.actions.push(["contact", id]);
    window.openTourRequest = (id) => window.actions.push(["tour", id]);
    window.controller = PccComparison.mount({ properties });
  }, fixture);

  await t.test("deep link drops private and missing IDs without revealing details", async () => {
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["a", "b"]);
    assert.ok(!(await page.locator("body").innerText()).includes("PRIVATE TITLE"));
    assert.equal(new URL(page.url()).searchParams.get("compare"), "a,b");
    assert.equal(new URL(page.url()).searchParams.get("zone"), "Puerto Cancun");
    assert.equal(await page.evaluate(() => controller.shareUrl()), "http://comparison.test/propiedades?compare=a,b");
    assert.equal(await page.locator("[data-compare='legacy']").count(), 1);
    assert.equal(await page.evaluate(() => localStorage.getItem("pcc.compare")), '["legacy"]');
  });

  await t.test("new controls add up to four and keep existing functionality visible", async () => {
    await page.locator("[data-compare-id='c']").click();
    await page.locator("[data-compare-id='d']").click();
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["a", "b", "c", "d"]);
    assert.equal(await page.locator("[data-compare-id='e']").getAttribute("aria-disabled"), "true");
    assert.equal(await page.evaluate(() => controller.add("e")), false);
    assert.equal(await page.locator(".pcc-comparison-table thead th").count(), 5);
    assert.ok((await page.locator(".pcc-comparison-table").innerText()).includes("Moneda distinta"));
    assert.equal(await page.locator("#legacy-contact").isVisible(), true);
  });

  await t.test("desktop and mobile avoid page overflow and retain usable controls", async () => {
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
        images: [...document.querySelectorAll(".pcc-comparison-photo")].every((img) => img.tagName !== "IMG" || img.complete && img.naturalWidth > 0),
        controls: [...document.querySelectorAll(".pcc-comparison button, .pcc-comparison-actions a")].every((el) => el.getBoundingClientRect().height >= 43),
        fullColumnFits: document.querySelector(".pcc-comparison-table thead th:nth-child(2)").getBoundingClientRect().width <= document.querySelector(".pcc-comparison-scroll").clientWidth - document.querySelector(".pcc-comparison-table th:first-child").getBoundingClientRect().width,
      }));
      assert.ok(layout.scroll <= layout.width + 1, `overflow at ${width}: ${JSON.stringify(layout)}`);
      assert.ok(layout.images);
      assert.ok(layout.controls);
      assert.ok(layout.fullColumnFits, `partially inaccessible column at ${width}`);
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.locator(".pcc-comparison-scroll").focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector(".pcc-comparison-scroll").scrollLeft > 0);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  await t.test("favorites and CTA invoke existing handlers exactly once", async () => {
    await page.locator("[data-pcc-action='favorite'][data-pcc-id='a']").click();
    assert.equal(await page.locator("[data-pcc-action='favorite'][data-pcc-id='a']").getAttribute("aria-pressed"), "true");
    await page.locator("[data-pcc-action='contact'][data-pcc-id='a']").click();
    await page.locator("[data-pcc-action='tour'][data-pcc-id='a']").click();
    assert.deepEqual(await page.evaluate(() => window.actions), [["favorite", "a"], ["contact", "a"], ["tour", "a"]]);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("pcc.favorites"))), ["legacy-favorite", "a"]);
    assert.equal(await page.locator("[data-favorite='legacy']").count(), 1);
  });

  await t.test("keyboard removal restores focus and sharing survives denied clipboard", async () => {
    await page.locator("[data-pcc-action='remove'][data-pcc-id='a']").focus();
    await page.keyboard.press("Enter");
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["b", "c", "d"]);
    assert.notEqual(await page.evaluate(() => document.activeElement.tagName), "BODY");
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw Error("denied"); } } }));
    await page.locator("[data-pcc-action='share']").click();
    assert.equal(await page.locator("#pcc-comparison-link").inputValue(), "http://comparison.test/propiedades?compare=b,c,d");
    assert.equal(await page.locator("#pcc-comparison-link").evaluate((el) => el === document.activeElement), true);
  });

  await t.test("back/forward and updateProperties invalidate revoked publications", async () => {
    await page.evaluate(() => { history.pushState({}, "", "/propiedades?compare=a,b"); dispatchEvent(new PopStateEvent("popstate")); });
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["a", "b"]);
    await page.evaluate(() => controller.updateProperties(records.map((p) => p.id === "a" ? { ...p, isPublic: false, status: "draft" } : p)));
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["b"]);
    assert.ok(!(await page.locator(".pcc-comparison").innerText()).includes("Departamento con terraza"));
    assert.equal(new URL(page.url()).searchParams.get("compare"), "b");
    assert.equal(await page.evaluate(() => controller.shareUrl()), "");
  });

  await t.test("remount, dynamic controls and destroy do not leave duplicate listeners", async () => {
    await page.evaluate(() => { window.controller = PccComparison.mount({ properties: records, ids: ["a", "b"] }); const button = document.createElement("button"); button.setAttribute("data-compare-id", "b"); button.id = "dynamic-compare"; button.textContent = "Compare B"; document.body.append(button); });
    assert.equal(await page.locator(".pcc-comparison").count(), 1);
    assert.equal(await page.locator(".pcc-comparison-tray").count(), 1);
    await page.waitForFunction(() => document.querySelector("#dynamic-compare").getAttribute("aria-pressed") === "true");
    await page.locator("#dynamic-compare").click();
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["a"]);
    await page.evaluate(() => controller.destroy());
    assert.equal(await page.locator(".pcc-comparison").count(), 0);
    assert.equal(await page.locator(".pcc-comparison-tray").count(), 0);
    assert.equal(await page.locator("[data-compare-id='a']").getAttribute("aria-pressed"), null);
    assert.equal(await page.locator("[data-compare='legacy']").count(), 1);
  });
  await t.test("English document language, overrides and live language changes localize all comparator surfaces", async () => {
    await page.goto("http://comparison.test/en/properties?compare=a,d");
    await page.evaluate((properties) => {
      window.records = properties.map((p) => ({ ...p, titleEn: `English listing ${p.id}` }));
      window.controller = PccComparison.mount({ properties: records });
    }, fixture);
    assert.equal(await page.locator("#pcc-comparison-heading").innerText(), "Compare listings");
    assert.equal(await page.locator(".pcc-comparison").getAttribute("lang"), "en");
    assert.equal(await page.locator(".pcc-comparison-tray").getAttribute("lang"), "en");
    assert.equal(await page.locator('[data-pcc-tray-action="open"]').innerText(), "Compare");
    assert.ok((await page.locator(".pcc-comparison").innerText()).includes("USD 650,000 total / month"));
    assert.equal(await page.locator(".pcc-comparison-title").first().getAttribute("href"), "/en/properties/residencia-a");
    assert.equal(await page.locator("[data-pcc-action='contact']").first().getAttribute("href"), "/en/contact?propertyId=a");
    assert.equal(await page.evaluate(() => controller.shareUrl()), "http://comparison.test/en/properties?compare=a,d");
    await page.evaluate(() => { document.documentElement.lang = "es-MX"; });
    await page.waitForFunction(() => document.querySelector("#pcc-comparison-heading").textContent === "Comparar inmuebles");
    assert.equal(await page.locator('[data-pcc-tray-action="open"]').innerText(), "Comparar");
    await page.evaluate(() => controller.update({ lang: "en-GB" }));
    assert.equal(await page.locator("#pcc-comparison-heading").innerText(), "Compare listings");
    await page.evaluate(() => { document.documentElement.lang = "es"; });
    assert.equal(await page.locator("#pcc-comparison-heading").innerText(), "Compare listings");
    await page.evaluate(() => { controller.add("missing"); });
    assert.equal(await page.locator("[role=status]").innerText(), "Listing unavailable for comparison.");
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw Error("denied"); } } }));
    await page.locator("[data-pcc-action='share']").click();
    assert.match(await page.locator("[role=status]").innerText(), /Could not copy automatically/);
    assert.equal(await page.locator("#pcc-comparison-link").inputValue(), "http://comparison.test/en/properties?compare=a,d");
    await page.evaluate(() => controller.setLang(null));
    assert.equal(await page.locator("#pcc-comparison-heading").innerText(), "Comparar inmuebles");
  });

  await t.test("adapter echo and public refresh do not loop or notify unchanged IDs", async () => {
    await page.evaluate(() => {
      controller.destroy(); window.changes = [];
      window.controller = PccComparison.mount({ properties: records, ids: ["a", "b"], lang: "en", onChange(ids) {
        changes.push(ids); if (window.echoController) { echoController.setIds(ids); echoController.updateProperties(records); }
      } });
      window.echoController = controller;
      controller.setIds(["a", "b"]); controller.updateProperties(records); controller.update({ lang: "es" });
    });
    assert.equal(await page.evaluate(() => changes.length), 1);
    await page.evaluate(() => controller.add("c"));
    assert.equal(await page.evaluate(() => changes.length), 2);
    await page.evaluate(() => controller.update({ ids: ["b", "c"], notify: false, lang: "en" }));
    assert.equal(await page.evaluate(() => changes.length), 2);
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["b", "c"]);
    await page.evaluate(() => { window.echoController = null; records = records.map((p) => p.id === "c" ? { ...p, isPublic: false } : p); controller.updateProperties(records); });
    assert.equal(await page.evaluate(() => changes.length), 3);
    assert.deepEqual(await page.evaluate(() => changes.at(-1)), ["b"]);
  });

  await t.test("only differences is keyboard accessible and updates after data refresh", async () => {
    await page.evaluate((properties) => { window.records = properties; controller.update({ properties, ids: ["a", "b"], lang: "en" }); }, [property("a", { baths: 2 }), property("b", { baths: 3 })]);
    await page.locator("#pcc-comparison-differences").focus(); await page.keyboard.press("Space");
    assert.equal(await page.locator("#pcc-comparison-differences").isChecked(), true);
    assert.equal(await page.locator("#pcc-comparison-differences").evaluate((el) => el === document.activeElement), true);
    assert.match(await page.locator("tbody").innerText(), /Bathrooms/);
    assert.ok(!(await page.locator("tbody").innerText()).includes("Bedrooms"));
    await page.evaluate(() => controller.updateProperties(records.map((p) => ({ ...p, baths: 2 }))));
    assert.match(await page.locator("tbody").innerText(), /No differences in these fields/);
    assert.equal(await page.locator("[data-pcc-action='favorite']").count(), 2);
  });

  await t.test("named selections persist locally, reload safely and never enter a shared URL", async () => {
    await page.locator("#pcc-comparison-name").fill('Private selection <client@example.test>');
    await page.locator("[data-pcc-action='save-selection']").click();
    assert.match(await page.locator("[role=status]").innerText(), /saved on this device/);
    assert.match(await page.locator("#pcc-comparison-local").innerText(), /Only on this device/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pcc.comparison.selections.v1")));
    assert.deepEqual(Object.keys(saved[0]), ["name", "ids"]);
    assert.equal(await page.evaluate(() => controller.shareUrl()), "http://comparison.test/en/properties?compare=a,b");
    await page.reload();
    await page.evaluate((properties) => { window.controller = PccComparison.mount({ properties, ids: [], lang: "en" }); }, [property("a"), property("b")]);
    assert.equal(await page.locator(".pcc-comparison").isVisible(), true);
    assert.equal(await page.locator(".pcc-comparison-tray").isVisible(), false);
    await page.locator("#pcc-comparison-saved").selectOption('Private selection <client@example.test>');
    await page.locator("[data-pcc-action='load-selection']").click();
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), ["a", "b"]);
    assert.ok(!page.url().includes("client"));
    await page.evaluate(() => controller.updateProperties([{ id: "a", status: "draft", isPublic: false }]));
    await page.locator("[data-pcc-action='load-selection']").click();
    assert.deepEqual(await page.evaluate(() => controller.getState().ids), []);
    assert.equal(await page.evaluate(() => controller.shareUrl()), "");
    assert.match(await page.locator("[role=status]").innerText(), /Some listings are unavailable/);
    await page.locator("[data-pcc-action='delete-selection']").click();
    assert.deepEqual(await page.evaluate(() => controller.getSavedSelections()), []);
  });

  await t.test("storage failure is honest and long English controls fit mobile", async () => {
    await page.evaluate((properties) => {
      controller.update({ properties, ids: ["a", "b"], lang: "en" });
      window.originalStorageSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function () { throw Error("blocked"); };
    }, [property("a"), property("b")]);
    assert.equal(await page.evaluate(() => controller.saveSelection("Test")), false);
    assert.match(await page.locator("[role=status]").innerText(), /Could not save the change/);
    await page.evaluate(() => { Storage.prototype.setItem = originalStorageSet; });
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `English overflow at ${width}`);
    }
  });

  await t.test("empty default section is hidden; explicit opening still reveals and focuses it", async () => {
    await page.goto("http://comparison.test/propiedades?zone=Puerto%20Cancun#catalog");
    await page.evaluate((properties) => {
      localStorage.removeItem("pcc.comparison.selections.v1");
      window.records = properties;
      window.controller = PccComparison.mount({ properties });
      const catalog = document.createElement("div"); catalog.id = "catalog"; catalog.style.height = "2200px";
      document.querySelector(".pcc-comparison").before(catalog);
    }, fixture);
    assert.equal(await page.locator(".pcc-comparison").isVisible(), false);
    assert.equal(await page.locator(".pcc-comparison-tray").isVisible(), false);
    assert.equal(await page.locator(".pcc-comparison").evaluate((el) => el.getBoundingClientRect().height), 0);
    await page.evaluate(() => controller.open());
    assert.equal(await page.locator(".pcc-comparison").isVisible(), true);
    assert.equal(await page.locator("#pcc-comparison-add").evaluate((el) => el === document.activeElement), true);
    assert.ok(await page.evaluate(() => scrollY > 1000));
  });

  await t.test("tray appears on first selection without scrolling and opens with keyboard focus", async () => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.evaluate(() => {
      window.controller = PccComparison.mount({ properties: records, ids: [] });
      scrollTo({ top: 0, behavior: "instant" });
      window.scrollCalls = 0; window.nativeScrollIntoView = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (...args) { scrollCalls++; return nativeScrollIntoView.apply(this, args); };
    });
    const before = await page.evaluate(() => scrollY);
    await page.locator('[data-compare-id="a"]').click();
    assert.equal(await page.locator(".pcc-comparison-tray").isVisible(), true);
    assert.equal(await page.locator(".pcc-comparison-tray-count").innerText(), "1 de 4");
    assert.equal(await page.locator('[data-pcc-tray-action="open"]').getAttribute("aria-controls"), "pcc-comparison");
    assert.equal(await page.locator('[data-pcc-tray-action="open"] [data-lucide="git-compare-arrows"]').count(), 1);
    assert.equal(await page.evaluate(() => scrollY), before);
    assert.equal(await page.locator('[data-compare-id="a"]').evaluate((el) => el === document.activeElement), true);
    await page.locator('[data-compare-id="c"]').click();
    assert.equal(await page.locator(".pcc-comparison-tray-count").innerText(), "2 de 4");
    assert.equal(await page.evaluate(() => scrollY), before);
    assert.equal(await page.evaluate(() => scrollCalls), 0);
    await page.locator('[data-pcc-tray-action="open"]').focus(); await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => scrollCalls), 1);
    assert.equal(await page.locator(".pcc-comparison-scroll").evaluate((el) => el === document.activeElement), true);
    const top = await page.locator(".pcc-comparison").evaluate((el) => el.getBoundingClientRect().top);
    assert.ok(top >= 0 && top <= 100, `section not scrolled into view: ${top}`);
    await page.evaluate(() => { Element.prototype.scrollIntoView = nativeScrollIntoView; });
  });

  await t.test("tray clears once through an echoing adapter and returns focus without losing URL filters", async () => {
    await page.evaluate(() => {
      window.changes = []; window.echoController = null;
      window.controller = PccComparison.mount({ properties: records, ids: ["a", "c"], onChange(ids) {
        changes.push(ids); if (window.echoController) { echoController.setIds(ids); echoController.updateProperties(records); }
      } });
      window.echoController = controller;
    });
    await page.locator('[data-pcc-tray-action="clear"]').focus(); await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => changes.length), 2);
    assert.deepEqual(await page.evaluate(() => changes.at(-1)), []);
    assert.equal(await page.locator(".pcc-comparison-tray").isVisible(), false);
    assert.equal(await page.locator(".pcc-comparison").isVisible(), false);
    assert.equal(await page.locator('[data-compare-id="a"]').evaluate((el) => el === document.activeElement), true);
    assert.equal(new URL(page.url()).searchParams.has("compare"), false);
    assert.equal(new URL(page.url()).searchParams.get("zone"), "Puerto Cancun");
    assert.equal(new URL(page.url()).hash, "#catalog");
    await page.evaluate(() => { window.echoController = null; });
    await page.locator('[data-compare-id="a"]').click();
    await page.locator('[data-compare-id="a"]').click();
    assert.equal(await page.locator(".pcc-comparison").isVisible(), false);
  });

  await t.test("invalid shared selections retain a generic visible message through refresh and language changes", async () => {
    for (const compare of ["private,missing", "%3Cprivate%3E", ""]) {
      await page.evaluate((value) => {
        history.replaceState({}, "", `/propiedades?compare=${value}`);
        window.controller = PccComparison.mount({ properties: records });
        controller.setIds([]); controller.updateProperties(records); controller.refreshFavorites();
      }, compare);
      assert.equal(await page.locator(".pcc-comparison").isVisible(), true);
      assert.equal(await page.locator(".pcc-comparison-tray").isVisible(), false);
      assert.match(await page.locator("[role=status]").innerText(), /Algunos inmuebles no/);
      assert.ok(!(await page.locator(".pcc-comparison").innerText()).includes("PRIVATE TITLE"));
      await page.evaluate(() => controller.update({ lang: "en" }));
      assert.equal(await page.locator("[role=status]").innerText(), "Some listings are unavailable for comparison.");
      await page.evaluate(() => { history.pushState({}, "", "/propiedades"); dispatchEvent(new PopStateEvent("popstate")); });
      assert.equal(await page.locator(".pcc-comparison").isVisible(), false);
    }
  });

  await t.test("tray stays inside mobile and desktop viewports, clear of the real WhatsApp styles", async () => {
    const stylesheet = await page.addStyleTag({ content: fs.readFileSync(path.join(repo, "styles.css"), "utf8") });
    await stylesheet.evaluate((el) => document.querySelector('link[rel="stylesheet"]').before(el));
    await page.evaluate(() => {
      const whatsapp = document.createElement("a"); whatsapp.className = "whatsapp-float"; whatsapp.href = "#"; whatsapp.textContent = "WA"; document.body.append(whatsapp);
      window.controller = PccComparison.mount({ properties: records, ids: ["a", "c", "d", "e"] });
    });
    for (const lang of ["es", "en"]) {
      await page.evaluate((value) => controller.update({ lang: value }), lang);
      for (const width of [320, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const layout = await page.evaluate(() => {
          const tray = document.querySelector(".pcc-comparison-tray"), box = tray.getBoundingClientRect(), wa = document.querySelector(".whatsapp-float").getBoundingClientRect();
          return { fixed: getComputedStyle(tray).position === "fixed", fits: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
            pageFits: document.documentElement.scrollWidth <= innerWidth,
            overlap: box.left < wa.right && box.right > wa.left && box.top < wa.bottom && box.bottom > wa.top,
            controlsFit: [...tray.querySelectorAll("button")].every((el) => { const b = el.getBoundingClientRect(); return b.height >= 44 && b.width >= 44 && b.left >= box.left && b.right <= box.right && el.scrollWidth <= el.clientWidth; }) };
        });
        assert.deepEqual(layout, { fixed: true, fits: true, pageFits: true, overlap: false, controlsFit: true }, `${lang} at ${width}`);
      }
      assert.equal(await page.locator('[data-pcc-tray-action="open"]').innerText(), lang === "en" ? "Compare" : "Comparar");
      assert.equal(await page.locator('[data-pcc-tray-action="clear"]').innerText(), lang === "en" ? "Clear" : "Vaciar");
      assert.equal(await page.evaluate(() => controller.shareUrl()), `http://comparison.test/${lang === "en" ? "en/properties" : "propiedades"}?compare=a,c,d,e`);
    }
  });

  await t.test("public DTO image route renders an actual image in the browser", async () => {
    await page.evaluate(() => controller.update({ properties: records.map((p) => p.id === "a" ? { ...p, image: "/media/properties/a/0" } : p), ids: ["a", "c"] }));
    const photo = page.locator('.pcc-comparison-photo[src="/media/properties/a/0"]');
    await photo.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const img = document.querySelector('.pcc-comparison-photo[src="/media/properties/a/0"]'); return img?.complete && img.naturalWidth > 0; });
    assert.equal(await photo.isVisible(), true);
  });
  assert.deepEqual(errors, []);
  assert.ok(requests.every((r) => r.method === "GET" && !r.path.startsWith("/api")));
});
