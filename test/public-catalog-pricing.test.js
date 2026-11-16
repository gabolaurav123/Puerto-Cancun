"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const http = require("node:http");
const express = require("express");
const inventory = require("../inventory-contract");
const { queryPublicInventory } = require("../public-inventory-query");
const { renderCatalog } = require("../catalog-view");
const { prepareItems } = require("../catalog-map");
const { interpretCatalogSearch, localizeCatalogError } = require("../catalog-search");
const { savedCatalogQuery } = require("../saved-catalog-search");

const snapshot = () => ({ base: "USD", quote: "MXN", rate: 20, date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), checkedAt: new Date(Date.now() - 1000).toISOString(), status: "available", source: { provider: "BANXICO" } });
const row = (id, price, currency = "USD", extra = {}) => ({ id, titleEs: "Ficha de prueba " + id, titleEn: "Test listing " + id, price, currency, priceUnit: "total", operation: "sale", type: "Departamento", isPublic: true, status: "active", zone: "Puerto Cancún", latitude: 21.16, longitude: -86.8, locationPrecision: "exact", urlEs: "/propiedades/" + id, urlEn: "/en/properties/" + id, ...extra });
const rows = [row("mxn", 18000000, "MXN"), row("usd", 950000), row("unknown", null)];
const appSource = fs.readFileSync(require.resolve("../app"), "utf8");
const serverSource = fs.readFileSync(require.resolve("../server"), "utf8");
function appFunction(name) { const start = appSource.indexOf("function " + name + "("); return appSource.slice(start, appSource.indexOf("\nfunction ", start + 1)); }
const moneyFunctions = ["localizedPropertyPrice", "selectedPrice", "comparablePrice", "propertyMatches", "sortedProperties"];
const runtime = (page, rate = snapshot()) => {
  const state = { config: { currencyExchange: rate }, filters: { operation: "sale" }, guided: { budget: 1000000, beds: 0 }, intelligentSearch: { active: false } };
  const api = vm.runInNewContext(moneyFunctions.map(appFunction).join("\n") + "\n({" + moneyFunctions.join(",") + "})", {
    state, document: { body: { dataset: { page } } }, window: { PccInventory: inventory }, $: () => ({ value: "low" }),
  });
  return { ...api, state };
};

test("browser public helpers and guided budgets use USD while admin helpers retain original values", () => {
  const api = runtime("home");
  assert.deepEqual(Array.from(api.localizedPropertyPrice(rows[0])), ["USD", 900000]);
  assert.deepEqual(Array.from(api.selectedPrice(rows[0])), ["USD", 900000]);
  assert.equal(api.comparablePrice(rows[2]), null);
  assert.equal(api.propertyMatches(rows[0]), true); assert.equal(api.propertyMatches(rows[1]), true);
  assert.deepEqual(Array.from(api.sortedProperties(rows), item => item.id), ["mxn", "usd", "unknown"]);
  assert.equal(runtime("home", null).localizedPropertyPrice(rows[0]), null);
  assert.equal(runtime("home", null).propertyMatches(rows[0]), false);
  for (const page of ["admin", "panel", "seller"]) assert.deepEqual(Array.from(runtime(page).localizedPropertyPrice(rows[0])), ["MXN", 18000000]);
});

test("catalog chips display converted USD and map JSON shares the same dated price as cards", () => {
  const rate = snapshot();
  for (const lang of ["es", "en"]) {
    const page = { lang, path: lang === "en" ? "/en/properties" : "/propiedades", category: {}, currencyExchange: rate };
    const text = inventory.publicPriceText(rows[0], rate, lang);
    const html = renderCatalog(page, rows, { operation: "sale", currency: "MXN", max: 20000000 }, records => records.map(record => '<article>' + inventory.publicPriceText(record, rate, lang) + '</article>').join(""));
    const help = html.match(/<div class="catalog-demand">([\s\S]*?)<\/div><\/div>/)[1];
    assert.doesNotMatch(help, /data-budget=|[?&](?:amp;)?budget=/);
    assert.match(help, /search-filters/);
    const chips = html.match(/<div class="catalog-active-filters">([\s\S]*?)<\/div>/)[1];
    assert.match(chips, /≈ USD \$1,000,000/); assert.doesNotMatch(chips.replace(/<[^>]+>/g, ""), /20000000|20,000,000|MXN/);
    assert.match(chips, /20\d\d/);
    const map = JSON.parse(html.match(/data-catalog-map-data>([\s\S]*?)<\/script>/)[1]);
    assert.equal(map[0].priceText, text); assert.ok(html.includes('<article>' + text + '</article>'));
    assert.equal(prepareItems(map).items[0].priceText, text);
    const unknown = renderCatalog({ ...page, currencyExchange: null }, rows, { operation: "sale", currency: "MXN", max: 20000000 }, () => "");
    assert.match(unknown, lang === "en" ? /USD budget to be confirmed/ : /Presupuesto USD por confirmar/);
  }
});

test("public catalog and intelligent API queries use the same FX snapshot and retain old MXN filters", async () => {
  let catalog, intelligent, saved;
  const begin = serverSource.indexOf('app.post("/api/search/intelligent"');
  const end = serverSource.indexOf('app.get("/api/location-options"', begin);
  const savedStart = serverSource.indexOf("async function evaluateSavedSearch(");
  const savedEnd = serverSource.indexOf("\nasync function createSavedSearchAlertsForProperty", savedStart);
  const context = { app: { get: (_path, fn) => { catalog = fn; }, post: (_path, fn) => { intelligent = fn; } }, inventoryContract: inventory, queryPublicInventory,
    interpretCatalogSearch, localizeCatalogError, getPublicProperties: async () => rows, publicPropertyCache: {}, exchangeRateService: { getSnapshot: snapshot },
    query: async () => ({ rows: [] }), savedCatalogQuery, createSavedSearchMatch: async () => { throw Error("read-only test"); },
  };
  vm.runInNewContext(serverSource.slice(begin, end), context);
  saved = vm.runInNewContext(serverSource.slice(savedStart, savedEnd) + "\nevaluateSavedSearch", context);
  const response = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.data = value; return this; } });
  for (const [query, expected] of [[{ operation: "sale", priceMode: "public-usd", max: 1000000, sort: "price-asc" }, ["mxn", "usd"]], [{ operation: "sale", currency: "MXN", max: 20000000 }, ["mxn"]]]) {
    const res = response(); await catalog({ query }, res, error => { throw error; });
    assert.equal(res.statusCode, 200); assert.deepEqual(Array.from(res.data.items, item => item.id), expected);
    const search = await saved({ id: "saved-fixture", filters: query });
    assert.deepEqual(Array.from(search.matches, item => item.id), expected);
  }
  const res = response(); await intelligent({ body: { query: "comprar departamento hasta 1000000 USD", filters: { filters: { priceMode: "public-usd" } } } }, res, error => { throw error; });
  assert.equal(res.statusCode, 200); assert.equal(res.data.total, 2); assert.match(res.data.url, /priceMode=public-usd/);
});

test("AJAX catalog keeps legacy budgets until changed, clears them across operations and remounts location maps", { skip: process.env.PCC_LAYOUT_BROWSER !== "1" }, async t => {
  const { chromium } = require(process.env.PCC_PLAYWRIGHT_MODULE || "playwright");
  const app = express(), requests = [];
  app.get("/catalog-ui.js", (_req, res) => res.type("application/javascript").send(fs.readFileSync(require.resolve("../catalog-ui"), "utf8")));
  app.get("/propiedades", (req, res) => {
    requests.push(new URLSearchParams(req.query));
    const catalog = renderCatalog({ lang: "es", path: "/propiedades", category: {}, currencyExchange: null }, rows, req.query,
      () => '<div data-public-location><div data-location-canvas></div></div>');
    res.type("html").send('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Catálogo</title></head><body>' + catalog + '<script>window.mapMounts=0;window.mapDisposals=0;window.PccCatalogMap={dispose(){window.mapDisposals++},mountListingLocationMaps(){window.mapMounts++},open(){},hide(){}};</script><script src="/catalog-ui.js"></script></body></html>');
  });
  const server = http.createServer(app); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCC_LAYOUT_CHROMIUM || undefined }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route("**/*", route => route.request().url().startsWith(base + "/") ? route.continue() : route.abort());
  await page.goto(base + "/propiedades?operation=sale&currency=MXN&max=20000000");
  await page.locator(".catalog-filter-panel > summary").click();
  assert.equal(await page.locator('[name="max"]').inputValue(), "");
  await page.locator('[name="type"]').selectOption("Departamento");
  await page.waitForFunction(() => window.mapMounts === 1);
  assert.equal(requests.at(-1).get("currency"), "MXN"); assert.equal(requests.at(-1).get("max"), "20000000"); assert.equal(requests.at(-1).has("priceMode"), false);
  await page.locator('[name="operation"]').selectOption("rent");
  await page.waitForFunction(() => window.mapMounts === 2);
  assert.equal(requests.at(-1).get("operation"), "rent"); assert.equal(requests.at(-1).has("max"), false); assert.equal(requests.at(-1).has("min"), false);
  assert.equal(requests.at(-1).get("currency"), "USD"); assert.equal(requests.at(-1).get("priceMode"), "public-usd");
  assert.equal(await page.evaluate(() => window.mapDisposals), 2);
  assert.match(await page.locator(".catalog-request-status").innerText(), /Se quitó el presupuesto anterior/);
});
