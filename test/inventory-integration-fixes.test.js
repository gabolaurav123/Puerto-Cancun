const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const inventory = require("../inventory-contract");
const { publicProperty } = require("../inventory-metadata");
const { savedCatalogQuery } = require("../saved-catalog-search");
const server = fs.readFileSync(require.resolve("../server.js"), "utf8");
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));

// Execute only the selected real functions; never import server.js or initialize its services.
function extract(source, names, bindings) {
  const snippets = names.map((name) => {
    const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, `missing function ${name}`);
    return match[0];
  });
  return vm.runInNewContext(`${snippets.join("\n")}\n({${names.join(",")}})`, bindings, { timeout: 1000 });
}

function property(patch = {}) {
  return {
    id: "fixture-unit", titleEs: "Casa de prueba", descriptionEs: "Descripcion de prueba.",
    type: "Casa", publicationSection: "properties", status: "active", isPublic: true,
    zone: "Puerto Cancun", city: "Cancun", state: "Quintana Roo", operation: "sale",
    price: 100, currency: "USD", priceUnit: "total", beds: 3, catalogData: {},
    longitude: -86.5, latitude: 21, locationPrecision: "exact",
    createdAt: "2026-10-01T00:00:00Z", images: [], ...patch,
  };
}

function row(patch = {}) {
  return {
    id: "fixture-row", title_es: "Casa de prueba", type: "Casa", publication_section: "properties",
    zone: "Puerto Cancun", city: "Cancun", state: "Quintana Roo", operation: "sale",
    price_amount: 100, price_currency: "USD", price_unit: "total", status: "active", is_public: true,
    latitude: 21, longitude: -86.5, images: [], ...patch,
  };
}

function mapper() {
  return extract(server, ["toProperty"], {
    inventoryContract: inventory, propertyQuality: inventory.quality,
    mergeLegacyImages: () => [], publicMediaUrls: () => [], normalizeImageMetadata: () => [],
    propertyEnglishFallback: () => ({ title: "", description: "" }),
    safeJsonArray: (value) => Array.isArray(value) ? value : [], propertySlug: () => "fixture",
  }).toProperty;
}

function alerts(publicRows, searches, { inserted = true, enabled = true, queryTexts = [] } = {}) {
  const calls = { projections: 0, queries: [], deliveries: [] };
  const runtime = extract(server, ["createSavedSearchAlertsForProperty"], {
    featureEnabled: () => enabled, process: { env: {} },
    PUBLIC_PROPERTY_STATUSES: new Set(["active", "featured"]), inventoryContract: inventory,
    savedCatalogQuery,
    getPublicProperties: async () => { calls.projections++; return publicRows; },
    query: async (sql) => {
      assert.equal(sql, "SELECT * FROM saved_searches WHERE alerts_enabled = TRUE");
      calls.queries.push(sql);
      return { rows: searches.map((filters, index) => ({ id: `fixture-search-${index}`, filters, query_text: queryTexts[index] || "" })) };
    },
    createSavedSearchMatch: async (search, item) => {
      calls.deliveries.push({ search: plain(search), property: plain(item) });
      return inserted ? { id: "fixture-only-notification" } : null;
    },
  });
  return { run: runtime.createSavedSearchAlertsForProperty, calls };
}

function ui({ rows = [], filters = {}, budget = 0, beds = 0, lang = "es", page = "catalog", sort = "low", contract = inventory } = {}) {
  const state = {
    properties: rows, filters: { type: "", zone: "", operation: "", text: "", featured: false, ...filters },
    guided: { budget, beds }, intelligentSearch: { active: false, ids: [] },
    favorites: [], compare: [], lang,
  };
  const nodes = new Map([
    ["#propertyGrid", { innerHTML: "" }], ["#resultCount", { textContent: "" }],
    ["#sortSelect", { value: sort }], ["#propertiesTitle", { textContent: "" }],
  ]);
  const calls = { compareTray: 0, icons: 0 };
  const runtime = extract(app, [
    "formatCurrencyLine", "propertyPriceUnitLabel", "localizedPropertyPrice", "formatPriceLines",
    "formatPriceSummary", "propertyMatches", "renderProperties",
  ], {
    state, window: { PccInventory: contract }, document: { body: { dataset: { page } } },
    $: (selector) => nodes.get(selector) || null,
    t: (key) => ({ resultText: "propiedades", allProperties: "Todas", noResults: "Sin resultados" })[key] || key,
    escapeHtml: (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]),
    syncFilterControls() {}, updateActiveFilterSummary() {}, renderCategoryPage() {},
    updateHomeEditorialImages() {}, renderPublicInventoryStatus: () => false,
    refreshIcons: () => { calls.icons++; }, renderCompareTray: () => { calls.compareTray++; },
    updatePropertyJsonLd() {}, localizedTitle: (p) => p.titleEs,
    localizedDescription: (p) => p.descriptionEs || "", truncateText: (value) => value,
    displayLocation: (p) => p.zone, displayType: (value) => value,
    primaryImage: () => "/fixture-only.jpg", optimizedMediaUrl: (value) => value, fallbackImage: "/fixture-only.jpg",
    sortedProperties: () => { throw new Error("legacy sort must not be used by renderProperties"); },
    comparablePrice: () => { throw new Error("guided budgets must use the shared price contract"); },
  });
  const ids = () => [...nodes.get("#propertyGrid").innerHTML.matchAll(/id="property-([^"]+)"/g)].map((match) => match[1]);
  return { ...runtime, state, nodes, calls, ids };
}

test("scoped integration source provenance; no real server or DB is initialized", (t) => {
  for (const [name, source] of [["server.js", server], ["app.js", app]]) {
    t.diagnostic(`${name} SHA256=${createHash("sha256").update(source).digest("hex")}`);
  }
});

test("I01: hidden coordinates do not trigger a geographic alert", async () => {
  const hidden = property({ locationPrecision: "hidden", address: "Private address", googleMapsUrl: "https://private.example/" });
  const filters = { ...inventory.parseQuery({ bounds: [-86.51, 20.99, -86.49, 21.01] }), contractVersion: inventory.VERSION };
  const api = alerts([publicProperty(hidden)], [filters]);
  assert.equal(await api.run(hidden), 0);
  assert.equal(api.calls.deliveries.length, 0);
  assert.equal(api.calls.projections, 1);
  assert.equal(inventory.queryInventory([publicProperty(hidden)], filters).total, 0);
});

test("I01: approximate coordinates use the same rounded point as the public query", async () => {
  const original = property({ longitude: -86.51234, latitude: 21.12345, locationPrecision: "approximate" });
  const bounds = [-86.513, 21.123, -86.512, 21.124];
  const filters = inventory.parseQuery({ bounds });
  const publicRow = publicProperty(original);
  assert.equal(inventory.queryInventory([original], filters).total, 1);
  const api = alerts([publicRow], [filters]);
  assert.equal(await api.run(original), 0);
  assert.equal(api.calls.deliveries.length, 0);
});

test("I01: exact public coordinates still trigger a valid alert", async () => {
  const original = property();
  const filters = inventory.parseQuery({ bounds: [-87, 20, -86, 22], operation: "sale", currency: "USD", max: 200 });
  const api = alerts([publicProperty(original)], [filters]);
  assert.equal(await api.run(original), 1);
  assert.equal(api.calls.deliveries[0].property.id, original.id);
});

test("I01: unbounded hidden-location alerts deliver only the public projection", async () => {
  const original = property({ locationPrecision: "hidden", address: "Private address", googleMapsUrl: "https://private.example/", verifiedBy: "private-user" });
  const before = plain(original);
  const api = alerts([publicProperty(original)], [inventory.parseQuery({ type: "Casa" })]);
  assert.equal(await api.run(original), 1);
  const delivered = api.calls.deliveries[0].property;
  assert.equal(delivered.latitude, null);
  assert.equal(delivered.longitude, null);
  assert.doesNotMatch(JSON.stringify(delivered), /private-user|Private address|private\.example/);
  assert.deepEqual(plain(original), before);
});

test("I01: private development relationships cannot satisfy immediate alert filters", async () => {
  const original = property({ developmentId: "private-project", parentDevelopment: { id: "private-project", nameEs: "Secret project" } });
  const visible = publicProperty({ ...original, developmentId: null, parentDevelopment: null, developmentImages: [] });
  const api = alerts([visible], [inventory.parseQuery({ development: "private-project" }), inventory.parseQuery({ q: "Secret project" })]);
  assert.equal(await api.run(original), 0);
  assert.equal(api.calls.deliveries.length, 0);
});

test("I01: an ID no longer present in the public inventory never creates an alert", async () => {
  const api = alerts([], [inventory.parseQuery({})]);
  assert.equal(await api.run(property()), 0);
  assert.deepEqual(api.calls.queries, []);
});

test("I01: disabled alerts and non-public editorial states short-circuit without any I/O", async () => {
  for (const patch of [{ isPublic: false }, { status: "draft" }, { status: "archived" }]) {
    const p = property(patch);
    const api = alerts([p], [inventory.parseQuery({})]);
    assert.equal(await api.run(p), 0);
    assert.equal(api.calls.projections, 0);
    assert.equal(api.calls.queries.length, 0);
  }
  const api = alerts([property()], [], { enabled: false });
  assert.equal(await api.run(property()), 0);
  assert.equal(api.calls.projections, 0);
});

test("I01: legacy ambiguity and existing-match dedupe remain unchanged", async () => {
  const p = property();
  const invalid = alerts([publicProperty(p)], [{ propertyType: "Casa", maxPrice: 200 }]);
  assert.equal(await invalid.run(p), 0);
  assert.equal(invalid.calls.deliveries.length, 0);
  const duplicate = alerts([publicProperty(p)], [inventory.parseQuery({})], { inserted: false });
  assert.equal(await duplicate.run(p), 0);
});

test("I01: separately stored query_text constrains immediate alerts", async () => {
  const queryTexts = ["Comprar casa hasta 200 USD"];
  for (const [price, expected] of [[100, 1], [300, 0]]) {
    const p = property({ price });
    const api = alerts([publicProperty(p)], [{}], { queryTexts });
    assert.equal(await api.run(p), expected);
  }
  const p = property();
  const ambiguous = alerts([publicProperty(p)], [{}], { queryTexts: ["Comprar casa hasta 200"] });
  assert.equal(await ambiguous.run(p), 0);
});

test("I01: saved query_text resolves development names against the public catalog", async () => {
  const project = publicProperty(property({ id: "project", type: "Desarrollo", publicationSection: "developments", titleEs: "SLS Harbour Beach", developmentData: { id: "fixture-sls" } }));
  const queryTexts = ["Renta mensual en SLS Harbour Beach"];
  for (const [developmentId, expected] of [["fixture-sls", 1], ["other-project", 0]]) {
    const p = property({ operation: "rent", developmentId, catalogData: { rentPeriod: "month" } });
    const api = alerts([publicProperty(p), project], [{}], { queryTexts });
    assert.equal(await api.run(p), expected);
  }
});

test("I02: absent or empty source geography stays absent or empty", () => {
  const toProperty = mapper();
  for (const absent of [null, undefined, ""]) {
    const input = row({ zone: "Colosio", city: absent, state: absent });
    const before = plain(input);
    const dto = toProperty(input);
    assert.equal(dto.city, absent ?? null);
    assert.equal(dto.state, absent ?? null);
    assert.equal(inventory.resolveLocation(dto).id, "");
    assert.equal(dto.commercialLocation.id, "");
    assert.deepEqual(plain(input), before);
  }
});

test("I02: documented city/state and reviewed commercial assignment are preserved", () => {
  const toProperty = mapper();
  for (const input of [
    row({ zone: "Colosio", city: "Playa del Carmen" }),
    row({ zone: "Colosio", city: "Benito Juarez", state: "Quintana Roo" }),
    row({ zone: "Colosio", city: null, state: null, catalog_data: { locationId: "fuera-de-cancun" } }),
  ]) {
    const dto = toProperty(input);
    assert.equal(dto.city, input.city);
    assert.equal(dto.state, input.state);
    assert.equal(inventory.resolveLocation(dto).id, inventory.resolveLocation(input).id);
    assert.equal(dto.commercialLocation.id, inventory.resolveLocation(dto).id);
  }
});

test("I03: unknown/null bases do not become total through toProperty", () => {
  const toProperty = mapper();
  for (const price_unit of [null, "from", "invalid", ""]) {
    const input = row({ price_unit });
    const dto = toProperty(input);
    assert.equal(dto.priceUnit, inventory.priceOf(input).basis);
    const filter = { currency: "USD", operation: "sale", max: 1000 };
    assert.equal(inventory.queryInventory([input], filter).total, 0);
    assert.equal(inventory.queryInventory([dto], filter).total, 0);
  }
});

test("I03: valid prices/bases and explicit null survive the DTO mapping", () => {
  const toProperty = mapper();
  for (const input of [row({ price_unit: "sqm", price_currency: "MXN", price_amount: "4200.50" }), row({ price_amount: null, price_usd: 900 }), row({ price_currency: null, price_amount: 100 })]) {
    const before = inventory.priceOf(input);
    const dto = toProperty(input);
    assert.deepEqual(plain(inventory.priceOf(dto)), plain(before));
  }
});

test("I04: price helpers never revive a canonical null or invent a currency", () => {
  const api = ui();
  for (const p of [
    property({ price: null, priceUsd: 900 }), property({ price: null, priceMxn: 900, currency: "MXN" }),
    property({ price: 100, currency: null }), property({ price: 100, currency: "EUR" }),
    property({ price: 100, priceUnit: "from" }), property({ price: 0 }),
    property({ price: true }), property({ price: Infinity }),
  ]) {
    assert.equal(api.localizedPropertyPrice(p), null);
    assert.deepEqual(Array.from(api.formatPriceLines(p)), []);
    assert.equal(api.formatPriceSummary(p), "Precio por confirmar");
  }
});

test("I04: supported legacy named amounts and canonical decimal amounts still display", () => {
  const api = ui();
  for (const [p, expected] of [[{ price_usd: 250 }, ["USD", 250]], [{ price_mxn: 4500 }, ["MXN", 4500]], [property({ price: 123.45 }), ["USD", 123.45]]]) {
    assert.deepEqual(Array.from(api.localizedPropertyPrice(p)), expected);
    assert.match(api.formatPriceSummary(p), new RegExp(expected[0]));
  }
  assert.equal(api.localizedPropertyPrice({ price_usd: 250, price_mxn: 4500 }), null);
});

test("I04: consult-price policy and missing engine do not produce fabricated amounts", () => {
  assert.equal(ui().formatPriceSummary(property({ price: null, catalogData: { priceOnRequest: true } })), "Consultar precio");
  assert.equal(ui({ lang: "en" }).formatPriceSummary(property({ price: null, catalogData: { priceOnRequest: true } })), "Price on request");
  assert.equal(ui({ lang: "en" }).formatPriceSummary(property({ price: null })), "Price to be confirmed");
  const missing = ui({ contract: null });
  assert.equal(missing.localizedPropertyPrice(property()), null);
});

for (const [lang, labels] of [["es", { month: " / mes", day: " / d\u00eda", year: " / a\u00f1o" }], ["en", { month: " / month", day: " / day", year: " / year" }]]) {
  test(`I06: ${lang} rental labels follow the actual documented period`, () => {
    const api = ui({ lang });
    for (const [rentPeriod, suffix] of Object.entries(labels)) {
      const p = property({ operation: "rent", catalogData: { rentPeriod } });
      assert.ok(api.formatPriceSummary(p).endsWith(suffix));
    }
    for (const rentPeriod of [undefined, "unclassified", "invalid"]) {
      const summary = api.formatPriceSummary(property({ operation: "rent", catalogData: { rentPeriod } }));
      assert.match(summary, lang === "en" ? /period to be confirmed/ : /periodo por confirmar/);
      assert.ok(!summary.includes(labels.month));
    }
    assert.equal(api.formatPriceSummary(property()), "USD 100");
    assert.match(api.formatCurrencyLine("USD", 100, "rent"), lang === "en" ? /period to be confirmed/ : /periodo por confirmar/);
  });
}

test("I06: snake-case price metadata preserves rent period and square-meter basis", () => {
  const summary = ui().formatPriceSummary({ price_amount: 4200, price_currency: "MXN", price_unit: "sqm", operation: "rent", catalog_data: { rentPeriod: "day" } });
  assert.match(summary, /MXN/);
  assert.match(summary, /d\u00eda/);
  assert.match(summary, /por m\u00b2/);
});

test("I05: guided budgets reject missing prices, other currencies, sqm and over-budget records", () => {
  const api = ui({ filters: { operation: "sale" }, budget: 1000 });
  assert.equal(api.propertyMatches(property({ price: 1000 })), true);
  for (const patch of [{ price: null }, { price: null, priceUsd: 500 }, { currency: "MXN" }, { currency: null }, { priceUnit: "sqm" }, { priceUnit: "from" }, { price: 1001 }, { operation: "rent" }]) {
    assert.equal(api.propertyMatches(property(patch)), false, JSON.stringify(patch));
  }
});

test("I05: guided budgets require operation and a known rental period", () => {
  const missingOperation = ui({ budget: 1000 });
  assert.equal(missingOperation.propertyMatches(property()), false);
  const missingPeriod = ui({ filters: { operation: "rent" }, budget: 1000 });
  assert.equal(missingPeriod.propertyMatches(property({ operation: "rent", catalogData: { rentPeriod: "month" } })), false);
  const monthly = ui({ filters: { operation: "rent", rentPeriod: "month" }, budget: 1000 });
  assert.equal(monthly.propertyMatches(property({ operation: "rent", catalogData: { rentPeriod: "month" } })), true);
  assert.equal(monthly.propertyMatches(property({ operation: "rent", catalogData: { rentPeriod: "day" } })), false);
});

test("I05: all existing filters intersect with guided budget/bedrooms without mutation", () => {
  const api = ui({ filters: { operation: "sale", locations: ["puerto-cancun"], type: "Casa", currency: "USD", min: 200, max: 900, bounds: [-87, 20, -86, 22], featured: true }, budget: 500, beds: 3 });
  const before = plain(api.state);
  const p = property({ price: 400, featured: true });
  assert.equal(api.propertyMatches(p), true);
  for (const patch of [{ price: 600 }, { price: 100 }, { zone: "Punta Sam" }, { type: "Departamento" }, { longitude: -90 }, { featured: false }, { beds: 2 }, { isPublic: false }, { status: "draft" }]) {
    assert.equal(api.propertyMatches({ ...p, ...patch }), false);
  }
  assert.deepEqual(plain(api.state), before);
});

test("shared filtering retains legacy Location aliases, canonical subzones and separate entities", () => {
  assert.equal(ui({ filters: { zone: "Puerto Canc\u00fan" } }).propertyMatches(property()), true);
  assert.equal(ui({ filters: { locations: ["zona-hotelera"], zone: "Punta Sam" } }).propertyMatches(property({ zone: "Costa Mujeres" })), false);
  const project = property({ type: "Desarrollo", publicationSection: "developments" });
  assert.equal(ui({ filters: { entity: "developments" } }).propertyMatches(project), true);
  assert.equal(ui({ filters: { entity: "developments" } }).propertyMatches(property()), false);
  assert.equal(ui().propertyMatches(project), false);
  const intelligent = ui();
  intelligent.state.intelligentSearch = { active: true, ids: ["other"] };
  assert.equal(intelligent.propertyMatches(property()), false);
  assert.equal(ui({ filters: { location: "Atlantis" } }).propertyMatches(property()), false);
});

for (const [sort, expectedSort] of [["low", "price-asc"], ["high", "price-desc"], ["new", "recent"]]) {
  test(`I07: rendered ${sort} order uses the full shared query and deterministic tie-break`, () => {
    const rows = [
      property({ id: "b", price: 100, mls: "1707" }), property({ id: "a", price: 100, mls: "1707" }),
      property({ id: "mxn", price: 10, currency: "MXN" }), property({ id: "sqm", price: 5, priceUnit: "sqm" }),
      property({ id: "rent-month", operation: "rent", catalogData: { rentPeriod: "month" } }),
      property({ id: "rent-day", operation: "rent", catalogData: { rentPeriod: "day" } }),
      property({ id: "missing", price: null }), property({ id: "a", price: 100, mls: "1707" }),
    ];
    const api = ui({ rows, sort });
    const before = plain(rows);
    api.renderProperties();
    assert.deepEqual(api.ids(), inventory.queryInventory(rows, { sort: expectedSort }).all.map((p) => p.id));
    assert.deepEqual(plain(rows), before);
    assert.equal(api.ids().filter((id) => id === "a").length, 1);
    assert.ok(api.ids().includes("b"), "MLS collisions remain separate");
    assert.equal(api.calls.compareTray, 1, "existing comparison rendering is still invoked");
    for (const attribute of ["data-favorite", "data-compare-id", "data-detail", "data-tour", "data-contact"]) assert.ok(api.nodes.get("#propertyGrid").innerHTML.includes(attribute));
  });
}

test("I07: catalog rendering does not truncate query.all to the first 24 records", () => {
  const rows = Array.from({ length: 35 }, (_, index) => property({ id: `unit-${String(index).padStart(2, "0")}` }));
  const api = ui({ rows });
  api.renderProperties();
  assert.equal(api.ids().length, 35);
  assert.match(api.nodes.get("#resultCount").textContent, /^35 /);
});

test("home retains editorial order, six-item limit and public featured eligibility", () => {
  const rows = Array.from({ length: 9 }, (_, index) => property({ id: `unit-${index}`, featured: true, catalogData: { homeOrder: 9 - index } }));
  rows.push(property({ id: "private", featured: true, isPublic: false, catalogData: { homeOrder: 0 } }));
  rows.push(property({ id: "not-featured", featured: false, catalogData: { homeOrder: 0 } }));
  const api = ui({ rows, page: "home" });
  api.renderProperties();
  assert.deepEqual(api.ids(), ["unit-8", "unit-7", "unit-6", "unit-5", "unit-4", "unit-3"]);
  assert.match(api.nodes.get("#resultCount").textContent, /^6 de 9 /);
});

test("invalid guided criteria render an error rather than a false zero-results message", () => {
  for (const options of [{ budget: 1000 }, { budget: 1000, filters: { operation: "rent" } }, { budget: NaN, filters: { operation: "sale" } }, { filters: { bounds: "invalid" } }]) {
    const api = ui({ rows: [property()], ...options });
    api.renderProperties();
    assert.match(api.nodes.get("#propertyGrid").innerHTML, /role="alert"/);
    assert.deepEqual(api.ids(), []);
    assert.equal(api.nodes.get("#resultCount").textContent, "");
  }
});

test("missing contract fails closed with an explicit render error", () => {
  const api = ui({ rows: [property()], contract: null });
  assert.equal(api.propertyMatches(property()), false);
  api.renderProperties();
  assert.match(api.nodes.get("#propertyGrid").innerHTML, /role="alert"/);
  assert.deepEqual(api.ids(), []);
});
