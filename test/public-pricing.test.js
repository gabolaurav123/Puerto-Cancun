"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const pricing = require("../public-pricing");
const inventory = require("../inventory-contract");
const { savedCatalogQuery } = require("../saved-catalog-search");
const { interpretCatalogSearch } = require("../catalog-search");

const now = Date.parse("2026-11-15T18:00:00Z");
const snapshot = { base: "USD", quote: "MXN", rate: 20, date: "2026-11-13", checkedAt: "2026-11-15T17:00:00Z", status: "available", source: { provider: "BANXICO" } };
const options = { now, exchangeRate: snapshot, publicPricing: true };
const row = (id, price, currency = "USD", changes = {}) => ({ id, type: "Departamento", titleEs: id, operation: "sale", price, currency, priceUnit: "total", status: "active", isPublic: true, zone: "Puerto Cancún", ...changes });
const rows = [row("usd-million", 1000000), row("mxn-low", 18000000, "MXN"), row("usd-middle", 950000), row("mxn-high", 22000000, "MXN"), row("unknown", null)];
const ids = result => result.all.map(p => p.id);

test("public USD projection preserves the original listing and never converts USD twice", () => {
  const original = row("original", 18000000, "MXN");
  const frozen = JSON.stringify(original);
  const converted = inventory.publicPriceOf(original, snapshot, { now });
  assert.equal(converted.amount, 900000);
  assert.equal(converted.currency, "USD");
  assert.equal(converted.originalAmount, 18000000);
  assert.equal(converted.originalCurrency, "MXN");
  assert.equal(converted.approximate, true);
  assert.equal(converted.date, "2026-11-13");
  assert.equal(JSON.stringify(original), frozen);
  assert.equal(inventory.priceOf(original).amount, 18000000);
  assert.equal(inventory.priceOf(original).currency, "MXN");
  assert.deepEqual(pricing.price(converted, snapshot, { now }), converted);
  assert.equal(pricing.price(converted, { ...snapshot, rate: 18 }, { now }).amount, 1000000);
  const usd = inventory.publicPriceOf(rows[0], null, { now });
  assert.equal(usd.amount, 1000000);
  assert.equal(usd.approximate, false);
  assert.equal(usd.rate, null);
});

test("only recent, dated BANXICO USD/MXN observations can convert a public amount", () => {
  const invalid = [null, { rate: 20 }, { ...snapshot, base: "EUR" }, { ...snapshot, quote: "USD" }, { ...snapshot, rate: "20" },
    { ...snapshot, rate: 0 }, { ...snapshot, rate: Infinity }, { ...snapshot, date: "2026-02-30" }, { ...snapshot, date: "2026-11-16" },
    { ...snapshot, date: "2026-10-30" }, { ...snapshot, status: "unavailable" }, { ...snapshot, checkedAt: "2026-11-16T00:00:00Z" },
    { ...snapshot, checkedAt: "2026-11-12T00:00:00Z" }, { ...snapshot, source: { provider: "manual" } }];
  for (const rate of invalid) {
    const converted = inventory.publicPriceOf(rows[1], rate, { now });
    assert.equal(converted.amount, null, JSON.stringify(rate));
    assert.equal(converted.status, "rate_unavailable");
    assert.match(pricing.format(converted, "es"), /USD por confirmar/);
    assert.match(pricing.format(converted, "en"), /USD price to be confirmed/);
  }
  const stale = inventory.publicPriceOf(rows[1], { ...snapshot, status: "stale" }, { now });
  assert.equal(stale.amount, 900000);
  assert.match(pricing.rateNote(stale, "es"), /Última cotización disponible/);
  assert.match(pricing.rateNote(stale, "en"), /Last available rate/);
});

test("missing, on-request, contradictory legacy and unknown-base prices never become zero or a fake USD amount", () => {
  for (const record of [row("null", null, "MXN", { priceUsd: 123 }), row("currency", 10, ""), row("unit", 10, "USD", { priceUnit: null }),
    row("request", 500000, "USD", { catalogData: { priceOnRequest: true } })]) {
    const projected = inventory.publicPriceOf(record, snapshot, { now });
    assert.equal(projected.amount, null);
    assert.equal(pricing.format(projected), "Precio a consultar");
  }
  assert.equal(pricing.convert(Number.MAX_VALUE, "MXN", { ...snapshot, rate: .01 }, { now }).amount, null);
});

test("cards, detail and map callers receive identical dated text in both languages", () => {
  for (const lang of ["es", "en"]) {
    const descriptor = inventory.publicPriceOf(rows[1], snapshot, { now });
    const central = pricing.format(descriptor, lang);
    const listing = inventory.publicPriceText(rows[1], snapshot, lang, { now });
    assert.equal(listing, central);
    assert.match(central, /≈ USD \$900,000/);
    assert.match(central, /2026/);
    assert.match(central, /13/);
    assert.doesNotMatch(central, /MXN|18,000,000/);
  }
});

test("USD budgets and sorting compare the same converted values across source currencies", () => {
  const query = { operation: "sale", currency: "USD", priceMode: "public-usd", min: 900000, max: 1000000, sort: "price-asc" };
  const result = inventory.queryInventory(rows, query, options);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(ids(result), ["mxn-low", "usd-middle", "usd-million"]);
  assert.deepEqual(ids(inventory.queryInventory(rows, { ...query, sort: "price-desc" }, options)), ["usd-million", "usd-middle", "mxn-low"]);
  const all = inventory.queryInventory(rows, { sort: "price-asc" }, options);
  assert.deepEqual(ids(all), ["mxn-low", "usd-middle", "usd-million", "mxn-high", "unknown"]);
  assert.deepEqual(inventory.publicPriceRange(rows, snapshot, { now }), [{ currency: "USD", operation: "sale", basis: "total", period: "", min: 900000, max: 1100000, approximate: true, date: "2026-11-13", count: 4 }]);
});

test("an unavailable FX rate retains USD listings and unpriced rows but excludes unverifiable MXN budget matches", () => {
  const result = inventory.queryInventory(rows, { operation: "sale", priceMode: "public-usd", max: 1000000, sort: "price-asc" }, { ...options, exchangeRate: null });
  assert.deepEqual(ids(result), ["usd-middle", "usd-million"]);
  const withoutBudget = inventory.queryInventory(rows, { priceMode: "public-usd", sort: "price-asc" }, { ...options, exchangeRate: null });
  assert.equal(withoutBudget.total, 5);
  assert.deepEqual(ids(withoutBudget).slice(0, 2), ["usd-middle", "usd-million"]);
});

test("historical MXN and USD queries retain their original currency semantics", () => {
  const mxn = { operation: "sale", currency: "MXN", max: 20000000, sort: "price-asc" };
  const original = JSON.stringify(mxn);
  assert.deepEqual(ids(inventory.queryInventory(rows, mxn, options)), ["mxn-low"]);
  assert.deepEqual(ids(inventory.queryInventory(rows, { operation: "sale", currency: "USD", max: 1000000, sort: "price-asc" }, options)), ["usd-middle", "usd-million"]);
  const saved = savedCatalogQuery(mxn);
  assert.deepEqual(saved.errors, []);
  assert.equal(saved.priceMode, undefined);
  assert.equal(saved.currency, "MXN");
  assert.equal(saved.max, 20000000);
  assert.deepEqual(ids(inventory.queryInventory(rows, saved, options)), ["mxn-low"]);
  assert.equal(JSON.stringify(mxn), original);
  const display = pricing.budgetInUsd(mxn, snapshot, { now });
  assert.equal(display.max, 1000000);
  assert.equal(display.approximate, true);
  assert.equal(display.priceMode, "public-usd");
});

test("new public USD search semantics survive URL, saved search and interpreter round trips", () => {
  const parsed = inventory.parseQuery({ operation: "sale", priceMode: "public-usd", max: 1000000, sort: "price-asc" });
  assert.equal(parsed.query.currency, "USD");
  const params = inventory.toSearchParams(parsed.query);
  assert.equal(params.get("priceMode"), "public-usd");
  const saved = savedCatalogQuery(inventory.parseQuery(params).query);
  assert.deepEqual(saved.errors, []);
  assert.equal(saved.priceMode, "public-usd");
  assert.deepEqual(ids(inventory.queryInventory(rows, saved, options)), ["mxn-low", "usd-middle", "usd-million"]);
  const interpreted = interpretCatalogSearch("departamento", { filters: saved });
  assert.equal(interpreted.filters.priceMode, "public-usd");
  assert.ok(inventory.parseQuery({ priceMode: "public-usd", currency: "MXN", operation: "sale", max: 100 }).errors.length);
  assert.ok(inventory.parseQuery({ priceMode: "convert-whatever" }).errors.length);
});

test("total, square-metre and rental-period amounts remain distinct, including MLS 1877", () => {
  const land = row("land", 20000, "MXN", { type: "Terreno", priceUnit: "sqm", lot: 500 });
  const monthly = row("monthly", 40000, "MXN", { operation: "rent", catalogData: { rentPeriod: "month" } });
  // Verified read-only public listing on 2026-11-15: USD 7,200; no rental period.
  const unknown = row("prop-14132f12-1ce6-4ef3-b47a-e25d6169db61", 7200, "USD", { mls: "1877", operation: "rent", catalogData: {} });
  assert.match(inventory.publicPriceText(land, snapshot, "es", { now }), /USD \$1,000 \/ m²/);
  assert.match(inventory.publicPriceText(monthly, snapshot, "en", { now }), /USD \$2,000 \/ month/);
  assert.match(inventory.publicPriceText(unknown, snapshot, "es", { now }), /periodo por confirmar/);
  assert.match(inventory.publicPriceText(unknown, snapshot, "en", { now }), /rental period unconfirmed/);
  assert.equal(inventory.publicPriceOf(unknown, snapshot, { now }).amount, 7200);
  assert.equal(inventory.publicPriceOf(unknown, snapshot, { now }).approximate, false);
  assert.doesNotMatch(inventory.publicPriceText(unknown, snapshot, "es", { now }), /mensual|mes|día|año/);
  assert.deepEqual(ids(inventory.queryInventory([monthly, unknown], { priceMode: "public-usd", operation: "rent", rentPeriod: "month", max: 5000 }, options)), ["monthly"]);
  assert.deepEqual(ids(inventory.queryInventory([land, rows[0]], { priceMode: "public-usd", operation: "sale", priceBasis: "sqm", max: 1500 }, options)), ["land"]);
  assert.equal(inventory.publicPriceRange([land, monthly, unknown, rows[0]], snapshot, { now }).length, 4);
});

test("browser and server share identical conversions, budget matches and formatted prices", () => {
  const context = vm.createContext({ URLSearchParams });
  vm.runInContext(fs.readFileSync(require.resolve("../public-pricing"), "utf8"), context);
  vm.runInContext(fs.readFileSync(require.resolve("../inventory-contract"), "utf8"), context);
  const browser = context.PccInventory;
  const query = { operation: "sale", priceMode: "public-usd", max: 1000000, sort: "price-asc" };
  assert.equal(JSON.stringify(browser.queryInventory(rows, query, options)), JSON.stringify(inventory.queryInventory(rows, query, options)));
  for (const lang of ["es", "en"]) assert.equal(browser.publicPriceText(rows[1], snapshot, lang, { now }), inventory.publicPriceText(rows[1], snapshot, lang, { now }));
});
