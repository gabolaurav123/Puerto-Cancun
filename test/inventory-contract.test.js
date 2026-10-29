const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { createHash } = require("node:crypto");

const sourcePath = require.resolve("../inventory-contract.js");
const source = fs.readFileSync(sourcePath, "utf8");
const nodeApi = require(sourcePath);
const browserContext = vm.createContext({ URLSearchParams });
vm.runInContext(source, browserContext, { filename: sourcePath, timeout: 1000 });
const browserApi = browserContext.PccInventory;
const runtimes = [["Node", nodeApi], ["browser-global", browserApi]];
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (result) => Array.from(result.items, (item) => item.id);
const allIds = (result) => Array.from(result.all, (item) => item.id);
const fields = (result) => Array.from(result.missingFields, (item) => item.field);
const description = "Vivienda de prueba con espacios interiores documentados, terraza privada y acceso a las areas comunes del conjunto residencial.";

// Synthetic, in-memory records only. Nothing imports the server or opens a DB.
function property(overrides = {}) {
  return {
    id: "fixture-unit", publicationSection: "properties", type: "Casa",
    titleEs: "Casa de prueba", descriptionEs: description,
    zone: "Puerto Canc\u00fan", city: "Canc\u00fan", address: "Direccion de prueba",
    operation: "sale", price: 450000, currency: "USD", priceUnit: "total",
    beds: 3, baths: 2, area: 150, lot: 0,
    image: "/fixture-only/cover.jpg", images: ["/fixture-only/cover.jpg"],
    status: "active", isPublic: true, featured: false,
    createdAt: "2026-10-01T12:00:00Z", catalogData: {}, ...overrides,
  };
}

function development(overrides = {}) {
  return property({
    id: "fixture-project", publicationSection: "developments", type: "Desarrollo",
    titleEs: "Proyecto de prueba", price: null, currency: undefined,
    operation: undefined, area: null, lot: null, beds: null, baths: null,
    catalogData: { salesModality: "presale" },
    developmentData: { stage: "Preventa", paymentPlan: "Condiciones documentadas de prueba" },
    ...overrides,
  });
}

function contractTest(name, check) {
  for (const [runtime, api] of runtimes) test(`${runtime}: ${name}`, () => check(api));
}

function validQuery(api, input, defaults) {
  const parsed = api.parseQuery(input, defaults);
  assert.deepEqual(plain(parsed.errors), [], "the fixture query must be valid");
  return parsed.query;
}

function expectInvalid(api, input) {
  const result = api.queryInventory([property()], input);
  assert.ok(result.errors.length > 0, "invalid criteria must report validation errors");
  assert.deepEqual(ids(result), []);
  assert.deepEqual(allIds(result), []);
  assert.equal(result.total, 0);
  assert.equal(result.pages, 0);
}

test("shared module loads without Node globals or a DOM and records its tested revision", (t) => {
  assert.equal(vm.runInContext("typeof require", browserContext), "undefined");
  assert.equal(vm.runInContext("typeof module", browserContext), "undefined");
  assert.equal(vm.runInContext("typeof document", browserContext), "undefined");
  assert.deepEqual(Object.keys(browserApi).sort(), Object.keys(nodeApi).sort());
  assert.equal(browserApi.VERSION, nodeApi.VERSION);
  t.diagnostic(`inventory-contract.js VERSION=${nodeApi.VERSION} SHA256=${createHash("sha256").update(source).digest("hex")}`);
});

contractTest("four Locations and four physical types have the agreed order", (api) => {
  assert.deepEqual(Array.from(api.LOCATIONS, (item) => item.id), [
    "zona-hotelera", "puerto-cancun", "cancun-city", "fuera-de-cancun",
  ]);
  assert.deepEqual(Array.from(api.TYPES), ["Casa", "Departamento", "Terreno", "Comercial"]);
  assert.ok(api.LOCATIONS.every((item) => item.description && item.descriptionEn));
  assert.equal(api.locationId("Preventa"), "");
});

contractTest("public visibility excludes private, draft and archived records in both entities", (api) => {
  for (const make of [property, development]) {
    const rows = [
      make({ id: "active" }), make({ id: "featured-status", status: "featured" }),
      make({ id: "private", isPublic: false }),
      make({ id: "private-snake", isPublic: undefined, is_public: false }),
      ...["draft", "pending", "disabled", "sold", "rented", "archived"].map((status) => make({ id: status, status, featured: true })),
    ];
    const entity = api.entityOf(rows[0]);
    assert.deepEqual(allIds(api.queryInventory(rows, { entity })).sort(), ["active", "featured-status"]);
    assert.equal(api.queryInventory(rows, { entity }, { includePrivate: true }).total, rows.length);
    assert.equal(api.queryInventory(rows, { entity, includePrivate: true }).total, 2, "query input is not an authorization option");
  }
});

contractTest("featured is an editorial flag, not a consequence of completeness or status", (api) => {
  for (const make of [property, development]) {
    const rows = [
      make({ id: "editorial", featured: true }),
      make({ id: "complete", featured: false }),
      make({ id: "status-only", status: "featured", featured: false }),
      make({ id: "draft-featured", status: "draft", featured: true }),
    ];
    const entity = api.entityOf(rows[0]);
    assert.deepEqual(ids(api.queryInventory(rows, { entity, featured: true })), ["editorial"]);
    assert.deepEqual(allIds(api.queryInventory(rows, { entity, featured: true }, { includePrivate: true })).sort(), ["draft-featured", "editorial"]);
  }
});

contractTest("properties and developments remain separate, including legacy and snake-case records", (api) => {
  const rows = [
    property({ id: "unit", developmentId: "project" }),
    development({ id: "project", units: 400, images: ["one", "two", "three"] }),
    development({ id: "legacy", publicationSection: undefined }),
    development({ id: "snake", publicationSection: undefined, publication_section: "developments", type: "Departamento" }),
  ];
  assert.deepEqual(ids(api.queryInventory(rows)), ["unit"]);
  assert.deepEqual(allIds(api.queryInventory(rows, { entity: "developments" })).sort(), ["legacy", "project", "snake"]);
  assert.equal(api.entityOf(property({ type: "Preventa" })), "properties");
});

contractTest("development filters return linked units, not their parent project", (api) => {
  const rows = [
    property({ id: "camel", developmentId: "project" }),
    property({ id: "snake", development_id: "project" }),
    property({ id: "nested-id", parentDevelopment: { id: "project" } }),
    property({ id: "nested-property", parentDevelopment: { propertyId: "project" } }),
    property({ id: "other", developmentId: "other" }), development({ id: "project" }),
  ];
  assert.deepEqual(allIds(api.queryInventory(rows, { development: "project" })).sort(), ["camel", "nested-id", "nested-property", "snake"]);
});

contractTest("R09: raw parent_development_id uses the same unit relationship as developmentId", (api) => {
  const rows = [property({ id: "unit", parent_development_id: "project" }), development({ id: "project" })];
  assert.deepEqual(ids(api.queryInventory(rows, { development: "project" })), ["unit"]);
});

const locationCases = [
  ["Zona Hotelera", "Cancun", "zona-hotelera"],
  ["Zona Hotelera de Canc\u00fan", "Cancun", "zona-hotelera"],
  ["Costa Mujeres", "Isla Mujeres", "zona-hotelera"],
  ["Punta Sam", "Isla Mujeres", "zona-hotelera"],
  ["  PUERTO   CANC\u00daN  ", "Cancun", "puerto-cancun"],
  ["Puerto Cancun", "Cancun", "puerto-cancun"],
  ["Av. Huayac\u00e1n", "Cancun", "cancun-city"],
  ["Corredor Colosio", "Cancun", "cancun-city"],
  ["Colosio", "Benito Ju\u00e1rez, Canc\u00fan", "cancun-city"],
  ["Colosio", "Playa del Carmen", "fuera-de-cancun"],
  ["Aldea Zama", "Tulum", "fuera-de-cancun"],
  ["", "Playa del Carmen", "fuera-de-cancun"],
  ["", "M\u00e9rida", "fuera-de-cancun"],
  ["", "Ciudad de M\u00e9xico", "fuera-de-cancun"],
];
for (const [zone, city, expected] of locationCases) {
  contractTest(`Location mapping: ${zone || city} (${city})`, (api) => {
    const row = property({ zone, city });
    const before = plain(row);
    assert.equal(api.resolveLocation(row).id, expected);
    assert.deepEqual(plain(row), before, "commercial grouping must not rewrite physical geography");
    assert.deepEqual(ids(api.queryInventory([row], { location: expected })), [row.id]);
  });
}

contractTest("unresolved Colosio, broad Cancun and titles do not invent a Location", (api) => {
  for (const row of [
    property({ zone: "Colosio", city: "", titleEs: "Casa en Cancun" }),
    property({ zone: "Colosio", city: "Quintana Roo" }),
    property({ zone: "", city: "Canc\u00fan", titleEs: "Puerto Cancun, Zona Hotelera" }),
    property({ zone: "Por confirmar", city: "Benito Juarez", descriptionEs: "Casa en Puerto Cancun" }),
  ]) {
    assert.equal(api.resolveLocation(row).id, "");
    assert.equal(api.resolveLocation(row).status, "pending");
    assert.equal(api.queryInventory([row], { location: "puerto-cancun" }).total, 0);
  }
});

contractTest("reviewed commercial classification has precedence without changing source fields", (api) => {
  for (const metadata of [
    { catalogData: { locationId: "puerto-cancun" } },
    { catalogData: undefined, catalog_data: { locationId: "puerto-cancun" } },
    { commercialLocationId: "puerto-cancun" },
  ]) {
    const row = property({ zone: "Zona Hotelera", ...metadata });
    const before = plain(row);
    assert.equal(api.resolveLocation(row).id, "puerto-cancun");
    assert.equal(api.resolveLocation(row).status, "confirmed");
    assert.deepEqual(plain(row), before);
  }
});

contractTest("R01: explicit Playa del Carmen prevents a Colosio street alias from becoming Cancun City", (api) => {
  const row = property({ zone: "Boulevard Colosio", city: "Playa del Carmen" });
  const location = api.resolveLocation(row);
  assert.notEqual(location.id, "cancun-city", "resolve as outside or pending review, never Cancun by alias alone");
  assert.equal(api.queryInventory([row], { location: "cancun-city" }).total, 0);
});

contractTest("R02: the master alias P Cancun resolves to Puerto Cancun", (api) => {
  assert.equal(api.locationId("P Cancun"), "puerto-cancun");
  assert.equal(api.resolveLocation(property({ zone: "P Cancun" })).id, "puerto-cancun");
});

contractTest("each physical type filters independently of entity, operation and modality", (api) => {
  const rows = Array.from(api.TYPES, (type) => property({ id: type, type }));
  rows.push(development());
  for (const type of api.TYPES) assert.deepEqual(ids(api.queryInventory(rows, { type })), [type]);
});

contractTest("sale modalities preserve Casa and do not classify legacy sales by title", (api) => {
  const rows = [
    ...["presale", "direct", "resale"].map((salesModality) => property({ id: salesModality, catalogData: { salesModality } })),
    property({ id: "unknown", titleEs: "Casa en preventa para reventa" }),
    property({ id: "rent", operation: "rent", catalogData: { rentPeriod: "month" } }),
    property({ id: "department", type: "Departamento", salesModality: "presale" }),
  ];
  assert.equal(api.modalityOf(rows[3]), "unclassified");
  for (const modality of ["presale", "direct", "resale", "unclassified"]) {
    const query = validQuery(api, { type: "Casa", modality });
    assert.equal(query.operation, "sale");
    assert.equal(query.type, "Casa");
    assert.deepEqual(ids(api.queryInventory(rows, { type: "Casa", modality })), [modality === "unclassified" ? "unknown" : modality]);
  }
  assert.deepEqual(ids(api.queryInventory(rows, { type: "Casa", operation: "rent" })), ["rent"]);
  expectInvalid(api, { type: "Casa", operation: "rent", modality: "presale" });
});

contractTest("legacy Preventa and Desarrollo selectors are translated without adding physical types", (api) => {
  const presale = validQuery(api, { type: "Preventa" });
  assert.equal(presale.entity, "properties");
  assert.equal(presale.type, "");
  assert.equal(presale.modality, "presale");
  assert.equal(presale.operation, "sale");
  assert.equal(api.modalityOf(property({ type: "Preventa" })), "presale");
  assert.equal(validQuery(api, { type: "Desarrollo" }).entity, "developments");
});

contractTest("text search folds accents, combines terms and includes linked development names", (api) => {
  const row = property({ titleEs: "Departamento en Canc\u00fan", parentDevelopment: { nameEs: "Jard\u00edn del Mar" }, keywords: ["Terraza"] });
  assert.equal(api.fold("  CANC\u00daN   jardi\u0301n "), "cancun jardin");
  assert.deepEqual(ids(api.queryInventory([row], { q: "JARDIN Cancun terraza" })), [row.id]);
  assert.equal(api.queryInventory([row], { q: "jardin inexistente" }).total, 0);
  assert.deepEqual(ids(api.queryInventory([row], { zone: "  PUERTO CANCUN " })), [row.id]);
});

contractTest("exact MLS collisions stay separate and rank before substring/title matches", (api) => {
  const rows = [
    property({ id: "fixture-1707-a", mls: "1707", titleEs: "Penthouse de prueba", zone: "Punta Sam", source: "fixture-A" }),
    property({ id: "fixture-1707-b", mls: " 1707 ", titleEs: "Casa de prueba", zone: "Aldea Zama", city: "Tulum", source: "fixture-B" }),
    property({ id: "a-title", mls: "other", titleEs: "1707 en el titulo" }),
    property({ id: "b-partial", mls: "17070" }),
    property({ id: "hidden", mls: "1707", status: "draft" }),
  ];
  const result = api.queryInventory(rows, { q: "1707", sort: "title" });
  assert.deepEqual(ids(result).slice(0, 2).sort(), ["fixture-1707-a", "fixture-1707-b"]);
  assert.equal(result.total, 4);
  assert.equal(new Set(ids(result)).size, 4);
  const report = api.reconcile(rows.slice(0, 4));
  for (const record of report.records.slice(0, 2)) assert.deepEqual(Array.from(record.duplicateMlsIds).sort(), ["fixture-1707-a", "fixture-1707-b"]);
  assert.deepEqual(plain(report.records[2].duplicateMlsIds), []);
});

contractTest("budget bounds are inclusive and compare only one currency, operation and price basis", (api) => {
  const rows = [
    property({ id: "lower", price: 100 }), property({ id: "upper", price: 200 }),
    property({ id: "cheap", price: 99 }), property({ id: "expensive", price: 201 }),
    property({ id: "mxn", price: 150, currency: "MXN" }),
    property({ id: "rent", price: 150, operation: "rent", catalogData: { rentPeriod: "month" } }),
    property({ id: "sqm", price: 150, priceUnit: "sqm" }),
    property({ id: "missing", price: null }), development({ price: 150, currency: "USD" }),
  ];
  assert.deepEqual(ids(api.queryInventory(rows, { min: 100, max: 200, operation: "sale", currency: "usd" })), ["lower", "upper"]);
  assert.deepEqual(ids(api.queryInventory(rows, { min: 100, max: 200, operation: "sale", currency: "USD", priceBasis: "sqm" })), ["sqm"]);
});

contractTest("monthly, daily and annual rental budgets remain separate", (api) => {
  const rows = ["month", "day", "year"].map((rentPeriod) => property({ id: rentPeriod, price: 1000, operation: "rent", catalogData: { rentPeriod } }));
  rows.push(property({ id: "unknown", operation: "rent", price: 1000 }));
  rows.push(property({ id: "sale", price: 1000 }));
  for (const rentPeriod of ["month", "day", "year"]) {
    assert.deepEqual(ids(api.queryInventory(rows, { operation: "rent", rentPeriod, currency: "USD", min: 500, max: 1500 })), [rentPeriod]);
  }
  assert.deepEqual(ids(api.queryInventory(rows, { operation: "rent", rentPeriod: "unclassified" })), ["unknown"]);
});

const invalidQueries = [
  ["unknown entity", { entity: "contacts" }],
  ["unknown location", { location: "Atlantis" }],
  ["partly invalid location union", { locations: ["puerto-cancun", "Atlantis"] }],
  ["unknown type", { type: "Condominio" }],
  ["unknown operation", { operation: "swap" }],
  ["unknown modality", { modality: "premium" }],
  ["unsupported currency", { currency: "EUR" }],
  ["unsupported basis", { priceBasis: "weekly" }],
  ["unknown period", { rentPeriod: "minute" }],
  ["negative budget", { min: -1, operation: "sale", currency: "USD" }],
  ["non-numeric budget", { min: "abc", operation: "sale", currency: "USD" }],
  ["non-finite budget", { max: Infinity, operation: "sale", currency: "USD" }],
  ["inverted budget", { min: 200, max: 100, operation: "sale", currency: "USD" }],
  ["budget without currency", { max: 100, operation: "sale" }],
  ["budget without operation", { max: 100, currency: "USD" }],
  ["rent budget without period", { max: 100, operation: "rent", currency: "USD" }],
  ["negative bedrooms", { beds: -1 }],
  ["unknown order", { sort: "random" }],
  ["zero page", { page: 0 }],
  ["fractional page", { page: 1.5 }],
  ["unbounded page", { page: 10001 }],
  ["non-numeric page", { page: "abc" }],
];
for (const [name, input] of invalidQueries) contractTest(`invalid query does not return all: ${name}`, (api) => expectInvalid(api, input));

contractTest("R03: null JSON limits stay absent, not zero", (api) => {
  const query = validQuery(api, { operation: "sale", currency: "USD", min: null, max: null, beds: null });
  assert.equal(query.min, null);
  assert.equal(query.max, null);
  assert.equal(query.beds, null);
  assert.deepEqual(ids(api.queryInventory([property()], plain(query))), ["fixture-unit"]);
});

contractTest("R03: parsing the normalized JSON query is idempotent", (api) => {
  const first = validQuery(api, { location: "puerto-cancun" });
  const second = api.parseQuery(plain(first));
  assert.deepEqual(plain(second.errors), []);
  assert.deepEqual(plain(second.query), plain(first));
});

for (const featured of ["banana", "2", [], {}]) {
  contractTest(`R04: invalid featured ${JSON.stringify(featured)} cannot silently clear the filter`, (api) => expectInvalid(api, { featured }));
}

contractTest("valid featured boolean encodings survive URL/JSON parsing", (api) => {
  for (const featured of [true, "true", "1"]) assert.equal(validQuery(api, { featured }).featured, true);
  for (const featured of [false, "false", "0", ""]) assert.equal(validQuery(api, { featured }).featured, false);
});

contractTest("R05: an unclassified rental period is not a comparable budget period", (api) => {
  expectInvalid(api, { operation: "rent", currency: "USD", rentPeriod: "unclassified", max: 10000 });
});

contractTest("missing and invalid prices are null, never fabricated zero values", (api) => {
  for (const price of [undefined, null, "", " ", 0, "0", -1, "Consultar precio", NaN, Infinity]) {
    const row = property({ price });
    assert.equal(api.priceOf(row).amount, null, `price=${String(price)}`);
    assert.equal(api.queryInventory([row], { operation: "sale", currency: "USD", min: 0 }).total, 0);
  }
});

contractTest("camel/snake money fields preserve currency, decimals and sqm without inventing a total", (api) => {
  assert.deepEqual(plain(api.priceOf({ price_amount: "4200.50", price_currency: "MXN", price_unit: "sqm", operation: "sale", lot: 100 })), {
    amount: 4200.5, currency: "MXN", basis: "sqm", operation: "sale", period: "",
  });
  assert.equal(api.priceOf({ price_usd: "123.45", operation: "sale" }).currency, "USD");
  assert.equal(api.priceOf({ price_mxn: "123.45", operation: "sale" }).amount, 123.45);
  assert.equal(api.priceOf({ price: 100, currency: "USD", priceMxn: 1800, operation: "sale" }).amount, 100);
  assert.equal(api.priceOf({ price_amount: 100, price_currency: "USD", operation: "rent", catalog_data: { rentPeriod: "month" } }).period, "month");
});

contractTest("R06: amount without a documented currency cannot satisfy an MXN budget", (api) => {
  const row = property({ price: 100, currency: undefined });
  assert.equal(api.queryInventory([row], { operation: "sale", currency: "MXN", min: 50, max: 150 }).total, 0);
});

contractTest("R06: missing operation is not reported as a sale price", (api) => {
  assert.notEqual(api.priceOf(property({ operation: undefined })).operation, "sale");
});

for (const priceUnit of ["from", "invalid-basis"]) {
  contractTest(`R07: ${priceUnit} cannot silently become a total-price comparison`, (api) => {
    const row = property({ price: 100, priceUnit });
    assert.equal(api.queryInventory([row], { operation: "sale", currency: "USD", max: 200, priceBasis: "total" }).total, 0);
    assert.notEqual(api.priceOf(row).basis, "total");
  });
}

contractTest("Location unions accept JSON arrays, comma lists and repeated query-string keys", (api) => {
  const rows = [
    property({ id: "puerto", zone: "Puerto Cancun", featured: true }),
    property({ id: "sam", zone: "Punta Sam", featured: true }),
    property({ id: "city", zone: "Huayacan", featured: true }),
    property({ id: "not-featured", zone: "Puerto Cancun" }),
    development({ id: "project", zone: "Punta Sam", featured: true }),
  ];
  const inputs = [
    { locations: ["Puerto Canc\u00fan", "Punta Sam", "puerto-cancun"], featured: true },
    { location: "puerto-cancun,zona-hotelera", featured: "1" },
    new URLSearchParams("location=puerto-cancun&location=Punta+Sam&featured=1"),
  ];
  for (const input of inputs) {
    const result = api.queryInventory(rows, input);
    assert.deepEqual(plain(result.errors), []);
    assert.deepEqual(ids(result), ["puerto", "sam"]);
    assert.equal(result.query.locations.length, 2);
    const encoded = api.toSearchParams(result.query);
    assert.deepEqual(ids(api.queryInventory(rows, new URLSearchParams(encoded.toString()))), ids(result));
  }
});

contractTest("a full shared URL preserves every filter, stable order and page", (api) => {
  const input = { entity: "properties", q: "Casa jard\u00edn", locations: ["puerto-cancun", "zona-hotelera"], zone: "Puerto Cancun", development: "project", type: "Casa", operation: "sale", modality: "resale", currency: "USD", priceBasis: "sqm", min: 0, max: 10000, beds: 2, featured: true, sort: "price-asc", page: 2 };
  const parsed = validQuery(api, input);
  const params = api.toSearchParams(parsed);
  const restored = validQuery(api, new URLSearchParams(params.toString()));
  assert.deepEqual(plain(restored), plain(parsed));
  const rows = Array.from({ length: 5 }, (_, index) => property({ id: `unit-${index}`, titleEs: "Casa jardin", zone: "Puerto Cancun", developmentId: "project", price: 100 + index, priceUnit: "sqm", featured: true, salesModality: "resale" }));
  const original = api.queryInventory(rows, input, { pageSize: 2 });
  const roundTrip = api.queryInventory(rows, new URLSearchParams(params.toString()), { pageSize: 2 });
  assert.deepEqual(ids(original), ["unit-2", "unit-3"]);
  assert.deepEqual(plain(roundTrip), plain(original));
});

contractTest("R08: explicit query-string Location overrides normalized default locations", (api) => {
  const query = validQuery(api, new URLSearchParams("location=zona-hotelera"), { entity: "properties", locations: ["puerto-cancun"] });
  assert.deepEqual(Array.from(query.locations), ["zona-hotelera"]);
});

contractTest("R08: an invalid explicit Location cannot hide behind default locations", (api) => {
  const result = api.queryInventory([property()], new URLSearchParams("location=Atlantis"), { defaults: { locations: ["puerto-cancun"] } });
  assert.ok(result.errors.length > 0);
  assert.deepEqual(ids(result), []);
});

contractTest("dedupe uses internal IDs only and pagination counts unique records", (api) => {
  const a = property({ id: "a", mls: "1707" });
  const b = property({ id: "b", mls: "1707" });
  const rows = [a, { ...a }, b, { ...b }, property({ id: "c" })];
  const first = api.queryInventory(rows, { page: 1 }, { pageSize: 2 });
  const second = api.queryInventory(rows, { page: 2 }, { pageSize: 2 });
  assert.deepEqual(ids(first), ["a", "b"]);
  assert.deepEqual(ids(second), ["c"]);
  assert.equal(first.total, 3);
  assert.equal(second.total, 3);
  assert.equal(first.pages, 2);
  assert.equal(api.reconcile(rows).total, 3);
});

contractTest("all sort modes have a stable ID tie-break across input orders and pages", (api) => {
  const rows = ["c", "a", "d", "b", "e"].map((id) => property({ id }));
  for (const sort of ["recent", "oldest", "title", "price-asc", "price-desc"]) {
    const orders = [rows, [...rows].reverse(), [...rows.slice(2), ...rows.slice(0, 2)]];
    for (const order of orders) {
      const pages = [1, 2, 3].map((page) => api.queryInventory(order, { sort, page }, { pageSize: 2 }));
      assert.deepEqual(pages.flatMap(ids), ["a", "b", "c", "d", "e"]);
      for (const page of pages) {
        assert.equal(page.total, 5);
        assert.equal(page.pages, 3);
      }
    }
  }
});

contractTest("date sorting understands camel/snake timestamps and caps an out-of-range page", (api) => {
  const rows = [
    property({ id: "older", createdAt: "2026-09-01T00:00:00Z" }),
    property({ id: "newer", createdAt: undefined, created_at: "2026-10-02T00:00:00Z" }),
  ];
  assert.deepEqual(ids(api.queryInventory(rows, { sort: "recent" })), ["newer", "older"]);
  assert.deepEqual(ids(api.queryInventory(rows, { sort: "oldest" })), ["older", "newer"]);
  const capped = api.queryInventory(rows, { page: 99 }, { pageSize: 1 });
  assert.equal(capped.page, 2);
  assert.deepEqual(ids(capped), ["older"]);
  const empty = api.queryInventory([], { page: 99 });
  assert.deepEqual([empty.total, empty.pages, empty.page], [0, 0, 1]);
});

contractTest("price sorting keeps currency/operation/basis/period groups contiguous and nulls last", (api) => {
  const rows = [];
  for (const currency of ["USD", "MXN"]) {
    for (const operation of ["sale", "rent"]) {
      for (const priceUnit of ["total", "sqm"]) {
        for (const rentPeriod of operation === "rent" ? ["day", "month", "year"] : [""]) {
          for (const price of [100, 500]) rows.push(property({ id: `${currency}-${operation}-${priceUnit}-${rentPeriod}-${price}`, currency, operation, priceUnit, price, catalogData: { rentPeriod } }));
        }
      }
    }
  }
  rows.push(property({ id: "null-price", price: null }));
  for (const sort of ["price-asc", "price-desc"]) {
    const result = api.queryInventory(rows.reverse(), { sort }, { pageSize: 100 });
    assert.equal(result.items.at(-1).id, "null-price");
    const groups = new Map();
    const seen = new Set();
    let previous;
    for (const row of result.items.slice(0, -1)) {
      const price = api.priceOf(row);
      const key = [price.currency, price.operation, price.basis, price.period].join("|");
      if (key !== previous) {
        assert.ok(!seen.has(key), "incompatible price groups must not be interleaved");
        seen.add(key);
      }
      groups.set(key, [...(groups.get(key) || []), price.amount]);
      previous = key;
    }
    for (const values of groups.values()) assert.deepEqual(values, sort === "price-asc" ? [100, 500] : [500, 100]);
  }
});

contractTest("quality is deterministic by entity and land does not require bedrooms or postal code", (api) => {
  const land = property({ type: "Terreno", titleEs: "Terreno de prueba", lot: 1000, area: null, beds: null, baths: null, postalCode: undefined });
  const project = development();
  for (const row of [property(), land, project]) {
    const result = api.quality(row);
    assert.equal(result.complete, true);
    assert.equal(result.level, "ready");
    assert.equal(result.score, 100);
    assert.equal(result.fulfilled, result.required);
    assert.deepEqual(plain(result.missingFields), []);
    assert.deepEqual(plain(api.quality(row)), plain(result));
    assert.doesNotMatch(JSON.stringify(result), /premium/i);
    assert.equal(result.version, api.VERSION);
  }
  assert.ok(fields(api.quality({ ...land, lot: null })).includes("lot"));
  assert.ok(fields(api.quality(property({ type: "Departamento", titleEs: "Departamento de prueba", lot: 262, area: null }))).includes("area"));
  assert.ok(!fields(api.quality(project)).some((field) => ["beds", "area", "lot", "price", "operation"].includes(field)));
});

contractTest("missing fields have labels and an honest fulfilled/required denominator", (api) => {
  const result = api.quality(property({ titleEs: "", descriptionEs: "", zone: "", city: "", price: null, area: null, images: [], image: null }));
  assert.equal(result.complete, false);
  assert.equal(result.level, "incomplete");
  assert.deepEqual(fields(result).sort(), ["area", "description", "images", "price", "title", "zone"]);
  assert.equal(result.fulfilled + result.missingFields.length, result.required);
  assert.equal(result.score, Math.round(100 * result.fulfilled / result.required));
  assert.ok(result.missingFields.every((item) => item.field && item.label));
  assert.deepEqual(Array.from(result.missing), Array.from(result.missingFields, (item) => item.label));
});

contractTest("explicit price-on-request does not invent a zero price or change visibility", (api) => {
  const row = property({ price: null, catalogData: { priceOnRequest: true }, status: "draft" });
  assert.equal(api.priceOf(row).amount, null);
  assert.equal(api.quality(row).complete, true);
  assert.equal(api.isPublic(row), false);
  assert.equal(api.queryInventory([row]).total, 0);
  assert.equal(api.quality(property({ price: null, catalogData: {} })).complete, false);
});

for (const marker of ["POR DEFINIR", " pendiente. ", "Por completar", "To be defined", "Pending", "Sin descripci\u00f3n", "N/A"]) {
  contractTest(`placeholder description is incomplete: ${marker}`, (api) => {
    assert.equal(api.isPlaceholder(marker), true);
    for (const make of [property, development]) {
      const row = make({ descriptionEs: marker });
      const result = api.quality(row);
      assert.equal(result.complete, false);
      assert.ok(fields(result).includes("description"));
      assert.ok(result.issues.some((issue) => issue.code === "placeholder-description"));
      assert.equal(row.descriptionEs, marker);
    }
  });
}

contractTest("real prose mentioning pendiente is not a placeholder", (api) => {
  const text = "La vivienda tiene una terraza en pendiente con jardineras y acceso privado; sus espacios interiores estan descritos en la ficha del conjunto.";
  assert.equal(api.isPlaceholder(text), false);
  assert.equal(api.quality(property({ descriptionEs: text })).complete, true);
});

contractTest("R10: repeated placeholder-only prose cannot satisfy the length threshold", (api) => {
  const text = "POR DEFINIR. ".repeat(8);
  assert.ok(text.length >= 80);
  const result = api.quality(development({ descriptionEs: text }));
  assert.equal(result.complete, false);
  assert.ok(result.issues.some((issue) => issue.code === "placeholder-description"));
});

contractTest("R11: blank image entries cannot count as a valid cover", (api) => {
  const result = api.quality(property({ image: null, images: [""] }));
  assert.equal(result.complete, false);
  assert.ok(fields(result).includes("images"));
});

contractTest("R11: a null image_count cannot erase a supplied cover", (api) => {
  assert.ok(!fields(api.quality(property({ image_count: null }))).includes("images"));
});

for (const currency of [undefined, "", "EUR", "INVALID"]) {
  contractTest(`R12: quality rejects undocumented or unsupported currency ${String(currency)}`, (api) => {
    const result = api.quality(property({ currency }));
    assert.equal(result.complete, false);
    assert.ok(result.missingFields.length > 0 || result.issues.length > 0);
  });
}

contractTest("R13: a rental with no documented period is not ready", (api) => {
  const result = api.quality(property({ operation: "rent", catalogData: {} }));
  assert.equal(result.complete, false);
  assert.ok(result.missingFields.length > 0 || result.issues.length > 0);
});

contractTest("R14: a project without documented commercialization is not complete", (api) => {
  const result = api.quality(development({ catalogData: {}, developmentData: {} }));
  assert.equal(result.complete, false);
  assert.ok(result.missingFields.length > 0 || result.issues.length > 0);
});

contractTest("type/title and area contradictions are reported without blind corrections", (api) => {
  const row = property({ titleEs: "DEPARTAMENTO EN VENTA EN X TOWERS", mls: "fixture-N1412", type: "Casa", operation: "rent", price: 5000, currency: "USD", catalogData: { rentPeriod: "month" } });
  const before = plain(row);
  assert.ok(api.quality(row).issues.some((issue) => issue.code === "type-conflict"));
  assert.equal(api.priceOf(row).operation, "rent", "title cannot change the documented operation");
  assert.equal(api.priceOf(row).amount, 5000, "suspicious prices require source review, not guessed corrections");
  assert.equal(api.queryInventory([row], { type: "Departamento" }).total, 0);
  assert.deepEqual(plain(row), before);
  const apartment = property({ type: "Departamento", titleEs: "Departamento", lot: 262, area: null });
  assert.ok(api.quality(apartment).issues.some((issue) => issue.code === "area-concept"));
  assert.equal(apartment.lot, 262);
  assert.equal(apartment.area, null);
});

contractTest("R15: a description/type contradiction also produces a review issue", (api) => {
  const row = property({ titleEs: "Unidad de prueba X Towers", type: "Casa", descriptionEs: `Departamento en venta. ${description}` });
  const before = plain(row);
  assert.ok(api.quality(row).issues.some((issue) => issue.field === "type"), "master A06 requires title/type/description consistency");
  assert.deepEqual(plain(row), before);
});

contractTest("reconciliation separates entity, Location, public/private and pending records by unique ID", (api) => {
  const a = property({ id: "a" });
  const rows = [a, { ...a }, property({ id: "private", isPublic: false }), property({ id: "pending", zone: "", city: "Cancun" }), property({ id: "zh", zone: "Punta Sam" }), development({ id: "project" }), development({ id: "draft-project", status: "draft" })];
  const before = plain(rows);
  const report = api.reconcile(rows);
  assert.equal(report.total, 6);
  assert.equal(report.records.length, 6);
  assert.deepEqual(Array.from(report.counts, (item) => [item.entity, item.total]), [["properties", 4], ["developments", 2]]);
  for (const count of report.counts) {
    assert.equal(count.locations.length, 5);
    assert.equal(count.locations.reduce((sum, location) => sum + location.total, 0), count.total);
    for (const location of count.locations) {
      const expected = report.records.filter((row) => row.entity === count.entity && row.location.id === location.id);
      assert.equal(location.total, expected.length);
      const filtered = api.queryInventory(rows, { entity: count.entity, ...(location.id ? { location: location.id } : {}) });
      assert.equal(location.public, expected.filter((row) => row.public).length);
      if (location.id) assert.equal(location.public, filtered.total);
    }
  }
  const pending = report.counts[0].locations.find((item) => item.id === "");
  assert.equal(pending.total, 1);
  assert.equal(pending.public, 1);
  assert.deepEqual(plain(rows), before);
});

contractTest("querying and diagnostics do not mutate records or filter inputs", (api) => {
  const rows = [property({ id: "b" }), property({ id: "a" }), development()];
  const input = { locations: ["Puerto Cancun", "Puerto Canc\u00fan"], featured: false, sort: "title" };
  const before = plain({ rows, input });
  api.queryInventory(rows, input);
  api.reconcile(rows);
  for (const row of rows) { api.resolveLocation(row); api.priceOf(row); api.quality(row); }
  assert.deepEqual(plain({ rows, input }), before);
});

contractTest("R16: an explicit sqm filter is effective even without budget bounds", (api) => {
  const rows = [property({ id: "total", priceUnit: "total" }), property({ id: "sqm", priceUnit: "sqm" })];
  const result = api.queryInventory(rows, { priceBasis: "sqm", currency: "USD", operation: "sale" });
  assert.deepEqual(plain(result.errors), []);
  assert.deepEqual(ids(result), ["sqm"]);
});

contractTest("the exported API retains exactly the existing functions and constants", (api) => {
  assert.deepEqual(Object.keys(api).sort(), [
    "VERSION", "LOCATIONS", "TYPES", "fold", "entityOf", "isPublic", "locationId",
    "resolveLocation", "modalityOf", "priceOf", "parseQuery", "matches",
    "queryInventory", "toSearchParams", "quality", "isPlaceholder", "reconcile",
  ].sort());
});

contractTest("R03: JSON null and whitespace leave optional numeric filters absent", (api) => {
  for (const value of [null, undefined, "", "  "]) {
    const query = validQuery(api, { min: value, max: value, beds: value });
    assert.deepEqual([query.min, query.max, query.beds], [null, null, null]);
    assert.deepEqual(ids(api.queryInventory([property()], plain(query))), ["fixture-unit"]);
  }
  for (const value of [true, false, [], {}]) expectInvalid(api, { operation: "sale", currency: "USD", min: value });
});

contractTest("R06: explicit null or invalid amounts never resurrect legacy prices", (api) => {
  for (const price of [null, "", " ", 0, -1, "Consultar precio", false, true, [], {}, NaN, Infinity]) {
    for (const row of [
      { price, price_amount: 999, currency: "USD", priceUsd: 250, operation: "sale" },
      { price_amount: price, price_currency: "USD", price_usd: 250, operation: "sale" },
    ]) assert.equal(api.priceOf(row).amount, null, `canonical price=${String(price)}`);
  }
});

contractTest("R06: legacy money inference needs exactly one named positive amount and no canonical value", (api) => {
  assert.deepEqual(plain(api.priceOf({ price_usd: 250, price_mxn: 4500 })), { amount: null, currency: null, basis: "total", operation: null, period: "" });
  assert.equal(api.priceOf({ price_usd: 250 }).currency, "USD");
  assert.equal(api.priceOf({ price_mxn: 4500 }).currency, "MXN");
  assert.equal(api.priceOf({ price: 250, priceUsd: 250 }).currency, null, "an amount in an unnamed currency does not inherit a converted column's currency");
  assert.equal(api.priceOf({ price_currency: null, price_usd: 250 }).currency, null);
  assert.equal(api.priceOf({ price_currency: "", price_usd: 250 }).amount, null);
  assert.equal(api.priceOf({ currency: "MXN", priceUsd: 250, priceMxn: 4500 }).amount, 4500);
  assert.equal(api.priceOf({ priceUsd: null, priceMxn: 0 }).currency, null);
});

contractTest("R07: explicit null price basis stays unknown but omitted legacy basis remains total", (api) => {
  assert.equal(api.priceOf({ price: 100, currency: "USD" }).basis, "total");
  const row = property({ priceUnit: null, price_unit: "total" });
  assert.equal(api.priceOf(row).basis, null);
  assert.equal(api.quality(row).complete, false);
  assert.equal(api.queryInventory([row], { currency: "USD", operation: "sale", max: 500000 }).total, 0);
});

contractTest("R16: default base, explicit total and sqm preserve their different scopes through JSON and URL", (api) => {
  const rows = [property({ id: "total" }), property({ id: "sqm", priceUnit: "sqm" }), property({ id: "unknown", priceUnit: null })];
  for (const [input, expected] of [[{}, ["sqm", "total", "unknown"]], [{ priceBasis: "total" }, ["total"]], [{ priceBasis: "sqm" }, ["sqm"]]]) {
    const query = validQuery(api, input);
    assert.equal(query.priceBasisExplicit, Boolean(input.priceBasis));
    const params = api.toSearchParams(query);
    assert.equal(params.has("priceBasis"), Boolean(input.priceBasis));
    for (const restored of [plain(query), new URLSearchParams(params.toString())]) {
      assert.deepEqual(plain(validQuery(api, restored)), plain(query));
      assert.deepEqual(allIds(api.queryInventory(rows, restored)).sort(), expected);
    }
  }
  const defaults = validQuery(api, {});
  assert.equal(validQuery(api, { priceBasis: "total" }, defaults).priceBasisExplicit, true);
  const changed = { ...plain(defaults), priceBasis: "sqm" };
  assert.deepEqual(ids(api.queryInventory(rows, changed)), ["sqm"], "a stale default marker cannot suppress sqm");
  assert.equal(api.toSearchParams(changed).get("priceBasis"), "sqm");
});

contractTest("R08: both Location spellings compose within explicit input and do not inherit defaults", (api) => {
  const defaults = { locations: ["cancun-city"], location: "fuera-de-cancun" };
  const query = validQuery(api, { location: "puerto-cancun", locations: ["zona-hotelera"] }, defaults);
  assert.deepEqual(Array.from(query.locations), ["puerto-cancun", "zona-hotelera"]);
  for (const input of [{ locations: [] }, { location: "" }, { location: null }]) {
    assert.deepEqual(Array.from(validQuery(api, input, defaults).locations), []);
  }
  expectInvalid(api, { location: "Atlantis", locations: ["puerto-cancun"] });
  expectInvalid(api, { location: {}, locations: ["puerto-cancun"] });
  const repeated = validQuery(api, new URLSearchParams("locations=puerto-cancun&locations=zona-hotelera"));
  assert.deepEqual(Array.from(repeated.locations), ["puerto-cancun", "zona-hotelera"]);
});

contractTest("Location aliases cannot resolve inherited JavaScript object properties", (api) => {
  for (const zone of ["constructor", "__proto__", "toString"]) {
    assert.equal(api.locationId(zone), "");
    assert.equal(api.resolveLocation({ zone }).id, "");
    expectInvalid(api, { location: zone });
  }
});

contractTest("R01: Colosio aliases require unambiguous city context, not a municipality name alone", (api) => {
  for (const zone of ["Colosio", "Corredor Colosio", "Boulevard Colosio", "Blvd. Luis Donaldo Colosio"]) {
    for (const city of ["", "Benito Juarez", "Cancun / Playa del Carmen"]) {
      const location = api.resolveLocation({ zone, city });
      assert.equal(location.id, "");
      assert.equal(location.status, "pending");
    }
    assert.equal(api.resolveLocation({ zone, city: "Benito Juarez", state: "Quintana Roo" }).id, "cancun-city");
    assert.equal(api.resolveLocation({ zone, city: "Canc\u00fan" }).id, "cancun-city");
  }
});

contractTest("R11: cover references take priority over derived counts; count-only projections remain supported", (api) => {
  assert.ok(!fields(api.quality(property({ image_count: 0 }))).includes("images"));
  assert.ok(fields(api.quality(property({ images: ["", " "], image: null, image_count: 2 }))).includes("images"));
  assert.ok(!fields(api.quality(property({ images: undefined, image: undefined, image_count: "2" }))).includes("images"));
  for (const image_count of [undefined, null, "", false, [], 0, -1, 1.5, Infinity]) {
    assert.ok(fields(api.quality(property({ images: undefined, image: undefined, image_count }))).includes("images"));
  }
});

contractTest("R14: project commercial evidence uses actual metadata and development fields, not invented fields", (api) => {
  const base = development({ catalogData: {}, developmentData: {} });
  for (const extra of [
    { catalogData: { salesModality: "direct" } },
    { catalogData: { priceOnRequest: true } },
    { developmentData: { stage: "Entrega inmediata" } },
    { developmentData: { paymentPlan: "Anticipo de prueba y saldo contra entrega" } },
    { developmentData: undefined, development_data: { paymentPlanEn: "Documented payment schedule" } },
    { developmentData: undefined, development_data: {}, development_record: { stage: "Preventa" } },
  ]) assert.equal(api.quality({ ...base, ...extra }).complete, true);
  for (const extra of [
    { operation: "sale" },
    { developmentData: { commercialStatus: "presale" } },
    { developmentData: { stage: "POR DEFINIR", paymentPlan: "Pending" } },
    { catalogData: { salesModality: "unclassified" } },
    { developmentData: { units: 400, availableUnits: 100, developer: "Fixture" } },
  ]) {
    const result = api.quality({ ...base, ...extra });
    assert.equal(result.complete, false);
    assert.ok(fields(result).includes("commercialization"));
  }
});

contractTest("R13: a known period is required for rent even with an explicit consult-price policy", (api) => {
  const row = property({ operation: "rent", price: null, catalogData: { priceOnRequest: true } });
  assert.ok(fields(api.quality(row)).includes("rentPeriod"));
  assert.equal(api.quality({ ...row, catalogData: { ...row.catalogData, rentPeriod: "month" } }).complete, true);
});

contractTest("R15: amenities and business departments are not advertised physical types", (api) => {
  const rows = [
    property({ type: "Departamento", titleEs: "Departamento con casa club", descriptionEs: `Casa club y alberca disponibles. ${description}` }),
    property({ titleEs: "Casa de prueba", descriptionEs: `Departamento de ventas disponible. ${description}` }),
    property({ titleEs: "Casa junto a departamentos", descriptionEs: description }),
  ];
  for (const row of rows) assert.ok(!api.quality(row).issues.some((issue) => issue.code === "type-conflict"));
  const row = property({ titleEs: "Unidad de prueba", descriptionEs: `Se vende un departamento. ${description}` });
  assert.ok(api.quality(row).issues.some((issue) => issue.code === "type-conflict"));
});

contractTest("bounds normalize JSON and query-string input and survive every round trip", (api) => {
  const expected = [-87, 20, -86, 22];
  for (const input of [
    { bounds: "-87,20,-86,22" },
    { bounds: [-87, 20, -86, 22] },
    new URLSearchParams("bounds=-87%2C20%2C-86%2C22"),
  ]) {
    const query = validQuery(api, input);
    assert.deepEqual(Array.from(query.bounds), expected);
    const params = api.toSearchParams(query);
    assert.equal(params.get("bounds"), "-87,20,-86,22");
    assert.deepEqual(plain(validQuery(api, new URLSearchParams(params.toString()))), plain(query));
    assert.deepEqual(plain(validQuery(api, plain(query))), plain(query));
  }
  assert.deepEqual(Array.from(validQuery(api, { bounds: [-180, -90, 180, 90] }).bounds), [-180, -90, 180, 90]);
  for (const bounds of [undefined, null, ""]) {
    const query = validQuery(api, { bounds });
    assert.equal(query.bounds, null);
    assert.equal(api.toSearchParams(query).has("bounds"), false);
  }
});

const invalidBounds = [
  ["short", "-87,20,-86"], ["long", "-87,20,-86,22,23"],
  ["empty coordinate", "-87,,-86,22"], ["whitespace coordinate", "-87, ,-86,22"],
  ["non-numeric", "west,20,-86,22"], ["infinite", "-Infinity,20,-86,22"],
  ["NaN", [-87, NaN, -86, 22]], ["null coordinate", [-87, null, -86, 22]],
  ["boolean coordinate", [-87, false, -86, 22]], ["nested coordinate", [-87, [20], -86, 22]],
  ["object", { west: -87, south: 20, east: -86, north: 22 }], ["number", 1],
  ["empty array", []], ["west range", [-181, 20, -86, 22]],
  ["east range", [-87, 20, 181, 22]], ["south range", [-87, -91, -86, 22]],
  ["north range", [-87, 20, -86, 91]], ["east lower bound", [-180, 20, -181, 22]],
  ["north lower bound", [-87, -89, -86, -91]], ["reversed longitude", [-86, 20, -87, 22]],
  ["reversed latitude", [-87, 22, -86, 20]], ["equal longitude", [-87, 20, -87, 22]],
  ["equal latitude", [-87, 20, -86, 20]], ["antimeridian crossing", [170, -20, -170, 20]],
];
for (const [label, bounds] of invalidBounds) {
  contractTest(`invalid map bounds: ${label}`, (api) => {
    const parsed = api.parseQuery({ bounds });
    assert.ok(parsed.errors.some((error) => /mapa/i.test(error)), "bounds failures must name the map criterion");
    expectInvalid(api, { bounds });
  });
}

contractTest("map bounds are inclusive, accept finite coordinate strings and exclude missing or invalid coordinates", (api) => {
  const rows = [
    property({ id: "center", longitude: -86.5, latitude: 21 }),
    property({ id: "southwest", longitude: -87, latitude: 20 }),
    property({ id: "northeast", longitude: "-86", latitude: "22" }),
    property({ id: "outside-west", longitude: -87.01, latitude: 21 }),
    property({ id: "outside-north", longitude: -86.5, latitude: 22.01 }),
    ...[undefined, null, "", " ", NaN, Infinity, false, [], {}, 181].map((longitude, index) => property({ id: `invalid-longitude-${index}`, longitude, latitude: 21 })),
    ...[undefined, null, "", " ", NaN, Infinity, false, [], {}, 91].map((latitude, index) => property({ id: `invalid-latitude-${index}`, longitude: -86.5, latitude })),
  ];
  const input = { bounds: "-87,20,-86,22" };
  const query = validQuery(api, input);
  assert.deepEqual(allIds(api.queryInventory(rows, input)), ["center", "northeast", "southwest"]);
  for (const row of rows) assert.equal(api.matches(row, query), ["center", "southwest", "northeast"].includes(row.id));
  const atZero = property({ longitude: 0, latitude: 0 });
  assert.equal(api.queryInventory([atZero], { bounds: [-1, -1, 1, 1] }).total, 1, "zero is a valid coordinate, not a missing one");
  assert.equal(api.queryInventory([property({ longitude: null, latitude: null })], { bounds: [-1, -1, 1, 1] }).total, 0);
});

contractTest("the map uses the same entity, permissions, Location, type, budget, featured and paginated result", (api) => {
  const inside = property({ id: "inside", longitude: -86.5, latitude: 21, featured: true, price: 100 });
  const rows = [
    inside, { ...inside }, { ...inside, id: "second" },
    { ...inside, id: "private", isPublic: false },
    { ...inside, id: "draft", status: "draft" },
    { ...inside, id: "outside", longitude: -90 },
    { ...inside, id: "other-zone", zone: "Huayacan" },
    { ...inside, id: "not-featured", featured: false },
    { ...inside, id: "other-type", type: "Terreno" },
    { ...inside, id: "too-expensive", price: 999 },
    { ...inside, id: "rent", operation: "rent", catalogData: { rentPeriod: "month" } },
    development({ ...inside, id: "project", type: "Desarrollo", publicationSection: "developments" }),
  ];
  const before = plain(rows);
  const input = { bounds: [-87, 20, -86, 22], location: "puerto-cancun", type: "Casa", operation: "sale", currency: "USD", min: 50, max: 200, featured: true, sort: "title", page: 2 };
  const first = api.queryInventory(rows, input, { pageSize: 1 });
  assert.deepEqual(allIds(first), ["inside", "second"]);
  assert.deepEqual(ids(first), ["second"]);
  assert.deepEqual([first.total, first.pages, first.page], [2, 2, 2]);
  const shared = new URLSearchParams(api.toSearchParams(first.query).toString());
  assert.deepEqual(plain(api.queryInventory(rows, shared, { pageSize: 1 })), plain(first));
  assert.equal(api.queryInventory(rows, input, { pageSize: 1, includePrivate: true }).total, 4);
  const projects = api.queryInventory(rows, { bounds: input.bounds, entity: "developments" });
  assert.deepEqual(ids(projects), ["project"]);
  assert.deepEqual(plain(rows), before);
});

contractTest("bounds can be explicitly cleared or replaced without dropping other default filters", (api) => {
  const defaults = validQuery(api, { bounds: [-87, 20, -86, 22], type: "Casa", location: "puerto-cancun" });
  for (const bounds of [null, ""]) {
    const query = validQuery(api, { bounds }, defaults);
    assert.equal(query.bounds, null);
    assert.equal(query.type, "Casa");
    assert.deepEqual(Array.from(query.locations), ["puerto-cancun"]);
  }
  const query = validQuery(api, new URLSearchParams("bounds=-88,19,-85,23"), defaults);
  assert.deepEqual(Array.from(query.bounds), [-88, 19, -85, 23]);
  assert.equal(query.type, "Casa");
  assert.equal(api.queryInventory([property()], { bounds: "invalid" }, { defaults }).total, 0);
});

contractTest("typologies are explicitly pending and never counted as units or projects", (api) => {
  const typologies = [
    property({ id: "typology-camel", publicationSection: "typologies" }),
    property({ id: "typology-snake", publicationSection: undefined, publication_section: "typologies" }),
    property({ id: "typology-type", type: "Tipolog\u00eda" }),
  ];
  const rows = [property({ id: "unit" }), development({ id: "project", developmentData: { stage: "Preventa", unitTypes: [{ name: "Modelo A", units: 300 }] } }), ...typologies];
  for (const row of typologies) {
    assert.equal(api.entityOf(row), "typologies");
    assert.equal(api.isPublic(row), false);
    assert.equal(api.quality(row).complete, false);
    assert.ok(api.quality(row).issues.some((issue) => issue.code === "unsupported-entity"));
  }
  for (const includePrivate of [false, true]) {
    assert.deepEqual(ids(api.queryInventory(rows, {}, { includePrivate })), ["unit"]);
    assert.deepEqual(ids(api.queryInventory(rows, { entity: "developments" }, { includePrivate })), ["project"]);
  }
  expectInvalid(api, { entity: "typologies" });
  assert.ok(api.parseQuery({ entity: "typologies" }).errors.some((error) => /pendientes de soporte/.test(error)));
  const report = api.reconcile(rows);
  assert.equal(report.total, 2);
  assert.deepEqual(Array.from(report.counts, (item) => item.total), [1, 1]);
  assert.deepEqual(Array.from(report.pendingRecords, (item) => item.id), typologies.map((item) => item.id));
  assert.ok(report.pendingRecords.every((item) => item.entity === "typologies" && item.public === false));
});

contractTest("essential surface values must be positive finite numbers, not coerced booleans", (api) => {
  for (const value of [null, undefined, "", true, false, [], {}, NaN, Infinity, -1, 0]) {
    assert.ok(fields(api.quality(property({ area: value }))).includes("area"));
    assert.ok(fields(api.quality(property({ type: "Terreno", lot: value }))).includes("lot"));
  }
});

contractTest("saved alerts accept contractVersion and idempotent normalized queries or parse envelopes", (api) => {
  const inputs = [
    { bounds: [-87, 20, -86, 22], locations: ["puerto-cancun", "zona-hotelera"] },
    { bounds: [-87, 20, -86, 22], locations: ["puerto-cancun"], operation: "sale", currency: "USD", min: 50, max: 200, priceBasis: "total" },
    { operation: "rent", currency: "MXN", min: 0, max: 1000, rentPeriod: "month", bounds: [-180, -90, 180, 90] },
  ];
  for (const input of inputs) {
    const parsed = api.parseQuery(input);
    assert.deepEqual(plain(parsed.errors), []);
    for (const stored of [
      { ...plain(parsed.query), contractVersion: api.VERSION },
      { ...plain(parsed.query), errors: [], contractVersion: api.VERSION },
      { ...plain(parsed), contractVersion: api.VERSION },
    ]) {
      const before = plain(stored);
      const restored = api.parseQuery(stored);
      assert.deepEqual(plain(restored), plain(parsed));
      assert.deepEqual(plain(api.parseQuery(plain(restored))), plain(parsed));
      assert.ok(Array.isArray(restored.query.bounds));
      assert.deepEqual(plain(stored), before);
      assert.deepEqual(plain(validQuery(api, new URLSearchParams(api.toSearchParams(stored).toString()))), plain(parsed.query));
    }
  }
});

contractTest("stored parse envelopes work through inventory filtering, direct matches and URLs", (api) => {
  const parsed = api.parseQuery({ type: "Casa", bounds: [-87, 20, -86, 22], operation: "sale", currency: "USD", max: 500000 });
  const stored = { ...plain(parsed), contractVersion: api.VERSION };
  const inside = property({ id: "inside", longitude: -86.5, latitude: 21 });
  const outside = property({ id: "outside", longitude: -90, latitude: 21 });
  assert.equal(api.matches(inside, stored), true);
  assert.equal(api.matches(outside, stored), false);
  assert.deepEqual(ids(api.queryInventory([inside, outside], stored)), ["inside"]);
  assert.equal(api.toSearchParams(stored).get("bounds"), "-87,20,-86,22");
});

contractTest("saved errors stay explicit and never become a broader successful alert", (api) => {
  const cases = [
    api.parseQuery({ operation: "sale", max: 1000 }),
    api.parseQuery({ currency: "USD", max: 1000 }),
    api.parseQuery({ operation: "rent", currency: "USD", max: 1000 }),
    api.parseQuery({ operation: "rent", currency: "USD", rentPeriod: "unclassified", max: 1000 }),
    api.parseQuery({ bounds: "-87,,-86,22" }),
    { query: plain(api.parseQuery({}).query), errors: ["Criterio legacy no soportado"] },
  ];
  for (const original of cases) {
    const stored = { ...plain(original), contractVersion: "legacy" };
    const parsed = api.parseQuery(stored);
    assert.deepEqual(plain(parsed.errors), plain(original.errors));
    assert.deepEqual(plain(api.parseQuery(plain(parsed)).errors), plain(parsed.errors));
    expectInvalid(api, stored);
    assert.equal(api.matches(property(), stored), false);
    assert.throws(() => api.toSearchParams(stored), { name: "TypeError" });
    const flat = { ...plain(original.query), errors: plain(original.errors), contractVersion: "legacy" };
    expectInvalid(api, flat);
    assert.equal(api.matches(property(), flat), false);
    assert.throws(() => api.toSearchParams(flat), { name: "TypeError" });
  }
});

contractTest("legacy budgets require savedCatalogQuery remapping before this contract accepts them", (api) => {
  for (const input of [{ maxPrice: 1000 }, { minPrice: 0 }, { maxPrice: 1000, contractVersion: "legacy" }]) {
    expectInvalid(api, input);
    assert.ok(api.parseQuery(input).errors.some((error) => /remapeo/.test(error)));
  }
  expectInvalid(api, { max: 1000, operation: "sale" });
  expectInvalid(api, { max: 1000, currency: "USD" });
  assert.deepEqual(plain(api.parseQuery({ max: 1000, currency: "USD", operation: "sale", contractVersion: "legacy" }).errors), []);
});

contractTest("malformed saved envelopes fail explicitly instead of restoring an empty catalog filter", (api) => {
  for (const input of [{ query: null, errors: [] }, { query: [], errors: [] }, { query: {}, errors: "invalid" }, { query: {}, errors: [null] }, { query: {}, contractVersion: api.VERSION }, { query: { query: {} }, errors: [] }]) {
    expectInvalid(api, input);
    assert.equal(api.matches(property(), input), false);
    assert.throws(() => api.toSearchParams(input), { name: "TypeError" });
  }
});
