"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { savedCatalogQuery: saved, parseInitialCatalogSearch: initial } = require("../saved-catalog-search");
const { interpretCatalogSearch } = require("../catalog-search");
const { parseQuery, queryInventory } = require("../inventory-contract");
const expected = (filters = {}) => ({ ...parseQuery(filters).query, errors: [] });
const purchase = { type: "Casa", operation: "sale", currency: "USD", max: 700000 };

test("API flat compatible y queryText se interpreta, no es decoracion", () => {
  const result = saved({ queryText: "Comprar casa en Puerto Cancun hasta700000USD" });
  assert.deepEqual(result, expected({ ...purchase, locations: ["puerto-cancun"] }));
  assert.equal("query" in result, false);
});

for (const [name, invoke] of [
  ["query_text", () => saved({ query_text: "Buy house under 700000 USD" })],
  ["options.queryText", () => saved({}, { queryText: "Buy house under 700000 USD" })],
  ["string overload", () => saved({}, "Buy house under 700000 USD")],
  ["filters envelope", () => saved({ filters: {}, query_text: "Buy house under 700000 USD" })],
  ["query envelope", () => saved({ query: {}, errors: [], queryText: "Buy house under 700000 USD" })],
  ["server helper", () => initial("Buy house under 700000 USD")],
]) test(`texto inicial soportado: ${name}`, () => assert.deepEqual(invoke(), expected(purchase)));

test("remapeo legacy exacto sin inventar moneda, operacion ni periodo", () => {
  assert.deepEqual(saved({ propertyType: "Casa", operation: "sale", currency: "USD", maxPrice: 700000, location: "Puerto Cancun", bedrooms: 2, sort: "price_asc" }),
    expected({ ...purchase, locations: ["puerto-cancun"], beds: 2, sort: "price-asc" }));
  assert.ok(saved({ maxPrice: 700000 }).errors.length);
  assert.ok(saved({ maxPrice: 5000, operation: "rent", currency: "USD" }).errors.length);
});

test("texto puede completar dimensiones faltantes en filtros legacy", () => {
  assert.deepEqual(initial("USD comprar", { propertyType: "Casa", maxPrice: 700000 }), expected(purchase));
  assert.deepEqual(initial("Monthly USD", { operation: "rent", maxPrice: 5000 }), expected({ operation: "rent", rentPeriod: "month", max: 5000, currency: "USD" }));
});

test("un campo canonico aislado no cae en rama legacy ni se pierde", () => {
  assert.deepEqual(saved({ type: "Casa", modality: "resale", development: "fixture-dev" }), expected({ type: "Casa", modality: "resale", development: "fixture-dev" }));
});

for (const patch of [{}, { entity: "properties" }, { contractVersion: "2026-10-29.2" }, { locations: [] }]) {
  for (const [key, value] of [["bathrooms", 2], ["minArea", 200], ["amenities", ["pool"]], ["features", ["sea view"]]]) {
    test(`criterios legacy no soportados ${key} ${JSON.stringify(patch)}`, () => {
      const result = saved({ ...patch, ...purchase, [key]: value }, { lang: "en" });
      assert.match(result.errors.join(" "), /unsupported criterion/);
      assert.equal(result.max, 700000);
      assert.equal(queryInventory([{ id: "fixture", ...purchase, price: 100 }], result).total, 0);
    });
  }
}

for (const text of [
  "Buy house with sea view under 700000 USD",
  "Buy house within 20 minutes of the airport under 700000 USD",
  "Buy house with 3 bathrooms under 700000 USD",
  "Buy house of 200 m2 under 700000 USD",
  "Buy house with exactly 2 bedrooms under 700000 USD",
  "Buy house under 700000",
  "Rent under 5000 USD",
  "Buy house in Cancun",
  "Buy house in Punta Sam and Costa Mujeres",
  "Buy commercial land",
  "Buy condo preferably sea view",
]) test(`queryText no pierde restriccion: ${text}`, () => {
  const result = initial(text, {}, { lang: "en" });
  assert.ok(result.errors.length);
  assert.equal(result.errors.some((error) => /Elige|no se|no tiene|requiere/.test(error)), false);
});

test("min/max/beds combinan por interseccion nunca amplian limites", () => {
  assert.deepEqual(initial("Buy house under 900000 USD with 2 bedrooms", { ...purchase, min: 300000, beds: 3 }), expected({ ...purchase, min: 300000, beds: 3 }));
  assert.deepEqual(initial("Buy house under 600000 USD with 4 bedrooms", { ...purchase, min: 300000, beds: 3 }), expected({ ...purchase, min: 300000, max: 600000, beds: 4 }));
  const inverted = initial("Buy house under 200000 USD", { ...purchase, min: 300000 }, { lang: "en" });
  assert.match(inverted.errors.join(" "), /minimum price exceeds/);
  assert.equal(inverted.min, 300000);
  assert.equal(inverted.max, 200000);
});

for (const [field, base, text] of [
  ["type", { type: "Casa" }, "Apartments"],
  ["operation", { operation: "sale" }, "Monthly rent"],
  ["currency", { currency: "USD" }, "MXN"],
  ["modality", { modality: "resale" }, "Presale"],
  ["rentPeriod", { operation: "rent", rentPeriod: "month" }, "Daily rent"],
  ["entity", { entity: "properties" }, "Developments"],
  ["locations", { locations: ["puerto-cancun"] }, "Cancun City"],
  ["zone", { zone: "Punta Sam" }, "Costa Mujeres"],
  ["priceBasis", { priceBasis: "sqm" }, "Total price"],
]) test(`texto contradictorio pide eleccion: ${field}`, () => {
  const result = initial(text, base, { language: "en" });
  assert.match(result.errors.join(" "), new RegExp(`Conflicting ${field}`));
  assert.deepEqual(result[field], base[field]);
});

test("texto libre y bounds estructurados no se diluyen", () => {
  const result = initial("MLS 1707", { text: "oasis", bounds: [-87, 20, -86, 22], featured: true });
  assert.deepEqual(result, expected({ text: "oasis 1707", bounds: [-87, 20, -86, 22], featured: true }));
});

test("nombres reales opcionales resuelven selector solo con fixture autorizado", () => {
  const properties = [{ id: "fixture-dev", titleEs: "Proyecto Ejemplo", type: "Desarrollo" }];
  const result = initial("Monthly rent in Proyecto Ejemplo", {}, { properties });
  assert.deepEqual(result, expected({ operation: "rent", rentPeriod: "month", development: "fixture-dev" }));
});

test("reset y clear en texto inicial no descartan restricciones guardadas", () => {
  for (const text of ["New search", "Remove budget", "All locations", "Clear text", "All properties"]) {
    const result = initial(text, { ...purchase, text: "oasis", locations: ["puerto-cancun"], featured: true, bounds: [-87, 20, -86, 22] });
    assert.ok(result.errors.length, text);
    assert.equal(result.max, 700000);
    assert.equal(result.text, "oasis");
    assert.deepEqual(result.locations, ["puerto-cancun"]);
    assert.deepEqual(result.bounds, [-87, 20, -86, 22]);
  }
});

test("conflictos legacy/canonico y dos textos no se deciden por orden de claves", () => {
  for (const input of [
    { ...purchase, maxPrice: 900000 }, { type: "Casa", propertyType: "Departamento" },
    { locations: ["puerto-cancun"], location: "Cancun City" },
    { queryText: "Buy", query_text: "Rent" },
    { query: {}, filters: {} },
  ]) assert.ok(saved(input).errors.length);
});

test("estado de conversacion completo sigue bloqueando al guardar tras elegir moneda", () => {
  const pending = interpretCatalogSearch("Buy house with sea view under 700000");
  const result = initial("USD", pending, { language: "en" });
  assert.equal(result.currency, "USD");
  assert.match(result.errors.join(" "), /Sea views/);
});

test("errores previos siguen bloqueando tras normalizar y serializar", () => {
  const first = initial("Buy house with pool under 700000 USD");
  const next = saved(JSON.parse(JSON.stringify(first)));
  assert.deepEqual(next, first);
  assert.ok(parseQuery(next).errors.length);
});

test("resultados validos son idempotentes y no mutan entradas", () => {
  const input = { propertyType: "Casa", location: "Puerto Cancun", operation: "sale", currency: "USD", maxPrice: 700000 };
  const before = JSON.stringify(input);
  const result = saved(input);
  assert.deepEqual(saved(JSON.parse(JSON.stringify(result))), result);
  assert.equal(JSON.stringify(input), before);
});

test("sin base explicita no se vuelve filtro total involuntario", () => {
  const result = saved({ type: "Terreno" });
  assert.equal(result.priceBasisExplicit, false);
  assert.equal(saved(result).priceBasisExplicit, false);
  assert.equal(initial("Total price", result).priceBasisExplicit, true);
});

for (const input of [null, [], "Buy house", { filters: "oops" }, { errors: null }, { errors: [42] }, { queryText: {} }, { queryText: "a".repeat(601) }, { max: "oops" }, { type: "invented" }, { unknownRestriction: true }]) {
  test(`entrada invalida produce errors sin consulta amplia: ${JSON.stringify(input).slice(0, 70)}`, () => {
    const result = saved(input, { lang: "en" });
    assert.ok(result.errors.length);
    assert.equal("query" in result, false);
    assert.deepEqual(queryInventory([], result).all, []);
  });
}

test("mensajes ES/EN siguen language/lang incluyendo contrato", () => {
  assert.match(saved({ maxPrice: 100 }, { language: "en-US" }).errors.join(" "), /Choose a currency/);
  assert.match(saved({ maxPrice: 100, lang: "es-MX" }).errors.join(" "), /Elige una moneda/);
  assert.match(saved({ queryText: "Buy house with sea view", lang: "en" }).errors.join(" "), /Sea views/);
});

test("texto largo con prefijo valido debe llegar completo al helper", () => {
  const queryText = "Buy house under 700000 USD".padEnd(600, " ") + "with sea view";
  const result = initial(queryText, {}, { lang: "en" });
  assert.match(result.errors.join(" "), /exceeds 600 characters/);
  assert.ok(parseQuery(result).errors.length);
});

test("demanda integrada distingue query_text no soportado de demanda insatisfecha", () => {
  const { analyzeDemand } = require("../demand-analysis");
  const properties = [{ id: "fixture-demand", titleEs: "Casa prueba", type: "Casa", operation: "sale", currency: "USD", price: 100, status: "active", isPublic: true }];
  const result = analyzeDemand([
    { id: "valid", filters: {}, query_text: "Buy house under 500 USD" },
    { id: "review", filters: {}, query_text: "Buy house with sea view under 500 USD" },
  ], properties);
  assert.equal(result.matched, 1);
  assert.equal(result.unmatched, 0);
  assert.deepEqual(result.needsReview.map((item) => item.id), ["review"]);
  assert.deepEqual(result.groups, []);
});

test("demanda integrada conserva limite de query_text sin inventar coincidencias", () => {
  const { analyzeDemand } = require("../demand-analysis");
  const result = analyzeDemand([{ id: "limited", filters: {}, query_text: "Buy house under 500 USD" }], [
    { id: "fixture-too-expensive", type: "Casa", operation: "sale", currency: "USD", price: 501, status: "active", isPublic: true },
  ]);
  assert.equal(result.matched, 0);
  assert.equal(result.unmatched, 1);
  assert.deepEqual(result.needsReview, []);
  assert.equal(result.groups[0].criteria.max, 500);
  assert.equal(result.groups[0].criteria.currency, "USD");
  assert.equal(result.groups[0].criteria.type, "Casa");
});
