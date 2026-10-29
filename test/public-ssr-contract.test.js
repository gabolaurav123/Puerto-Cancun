const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const inventory = require("../inventory-contract");
const { publicProperty } = require("../inventory-metadata");
const seo = require("../seo-pages");
const serverSource = fs.readFileSync(require.resolve("../server.js"), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));

function property(patch = {}) {
  return {
    id: "fixture-unit", slug: "fixture-unit", titleEs: "Casa fixture", titleEn: "Fixture home",
    descriptionEs: "Descripcion documentada de prueba.", descriptionEn: "Documented fixture description.",
    type: "Casa", publicationSection: "properties", status: "active", isPublic: true,
    operation: "sale", price: 100, currency: "USD", priceUnit: "total", catalogData: {},
    zone: "Colosio", city: null, state: null, address: "", images: [], amenities: [],
    locationPrecision: "hidden", latitude: null, longitude: null, ...patch,
  };
}

function row(patch = {}) {
  return {
    id: "fixture-unit", slug: "fixture-unit", title_es: "Casa fixture", type: "Casa",
    publication_section: "properties", status: "active", is_public: true, operation: "sale",
    price_amount: 100, price_currency: "USD", price_unit: "total", catalog_data: {},
    zone: "Colosio", city: null, state: null, address: "Private address", images: [],
    location_precision: "hidden", latitude: 21.123456, longitude: -86.754321, ...patch,
  };
}

function listingSchema(p, lang = "es") {
  const head = seo.renderPropertyHead(p, "https://fixture.example", lang);
  const schemas = [...head.jsonLd.matchAll(/<script[^>]*>([^]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const listing = schemas.find((item) => item["@type"] === "RealEstateListing");
  assert.ok(listing);
  return listing;
}

function cardPrice(p, lang = "es") {
  const html = seo.renderCategoryPage(seo.getPageByPath(lang === "en" ? "/en/properties" : "/propiedades"), [p]);
  return html.match(/class="seo-property-price">([^<]*)</)?.[1];
}

// Only these two real functions execute; DB, media I/O and application startup are absent.
function publicInventory(rows) {
  const snippets = ["toProperty", "getPublicProperties"].map((name) => {
    const match = serverSource.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, name);
    return match[0];
  });
  let reads = 0;
  const get = vm.runInNewContext(`${snippets.join("\n")}\ngetPublicProperties`, {
    inventoryContract: inventory, publicProperty, propertyQuality: inventory.quality,
    publicPropertyCache: { expiresAt: 0, items: [] },
    PUBLIC_PROPERTY_STATUSES: new Set(["active", "featured"]), PROPERTY_SUMMARY_COLUMNS: "fixture_columns",
    query: async (sql, values) => {
      assert.match(sql, /p\.is_public = TRUE AND p\.status = ANY/);
      assert.deepEqual(plain(values), [["active", "featured"]]);
      reads++;
      return { rows };
    },
    withPropertyMediaPlaceholders: (value) => value,
    mergeLegacyImages: () => [], publicMediaUrls: () => [], normalizeImageMetadata: () => [],
    propertyEnglishFallback: () => ({ title: "Fixture", description: "Fixture description" }),
    safeJsonArray: (value) => Array.isArray(value) ? value : [], propertySlug: (value) => value.id,
  });
  return { get, reads: () => reads };
}

for (const [name, patch] of [
  ["null basis", { priceUnit: null }], ["empty basis", { priceUnit: "" }],
  ["from basis", { priceUnit: "from" }], ["unknown basis", { priceUnit: "range" }],
  ["missing currency", { currency: null }], ["unsupported currency", { currency: "EUR" }],
  ["canonical null", { price: null, priceUsd: 900 }], ["zero", { price: 0 }],
  ["negative", { price: -1 }], ["NaN", { price: NaN }], ["infinite", { price: Infinity }],
]) {
  test(`SSR and JSON-LD never manufacture a price: ${name}`, () => {
    const p = property(patch);
    assert.equal(seo.localizedListingPrice(p), null);
    assert.equal(cardPrice(p), "Precio por confirmar");
    assert.equal(cardPrice(p, "en"), "Price to be confirmed");
    assert.match(seo.renderPropertyPage(p).html, /class="property-page-price">Precio por confirmar</);
    assert.equal(Object.hasOwn(listingSchema(p), "offers"), false);
  });
}

test("explicit consult-price policy is distinguished from unknown price", () => {
  const p = property({ price: null, catalogData: { priceOnRequest: true } });
  assert.equal(cardPrice(p), "Precio a consultar");
  assert.equal(cardPrice(p, "en"), "Price on request");
  assert.equal(Object.hasOwn(listingSchema(p), "offers"), false);
  assert.equal(cardPrice(property({ price: null, catalogData: { priceOnRequest: "true" } })), "Precio por confirmar");
});

for (const currency of ["USD", "MXN"]) {
  test(`valid ${currency} total keeps the exported helper shape and Offer`, () => {
    const p = property({ currency, price: 1234.5 });
    assert.deepEqual(seo.localizedListingPrice(p), { amount: 1234.5, currency });
    const offer = listingSchema(p).offers;
    assert.equal(offer.price, 1234.5);
    assert.equal(offer.priceCurrency, currency);
    assert.equal(Object.hasOwn(offer, "priceSpecification"), false);
    assert.match(cardPrice(p), new RegExp(currency));
  });
}

test("canonical null does not revive legacy amounts; unambiguous legacy still works", () => {
  assert.equal(seo.localizedListingPrice({ price: null, currency: "USD", priceUsd: 900 }), null);
  assert.deepEqual(seo.localizedListingPrice({ price_usd: 900 }), { amount: 900, currency: "USD" });
  assert.equal(seo.localizedListingPrice({ price_usd: 900, price_mxn: 16000 }), null);
  assert.equal(listingSchema(property({ priceUnit: undefined })).offers.price, 100);
});

test("snake-case square-meter prices remain unit prices in rendering and JSON-LD", () => {
  const p = property({ price: undefined, currency: undefined, priceUnit: undefined, price_amount: "4200.5", price_currency: "MXN", price_unit: "sqm" });
  assert.match(cardPrice(p), /MXN \$4,201 por m\u00b2/);
  const offer = listingSchema(p).offers;
  assert.equal(Object.hasOwn(offer, "price"), false);
  assert.equal(offer.priceSpecification.price, 4200.5);
  assert.equal(offer.priceSpecification.priceCurrency, "MXN");
  assert.equal(offer.priceSpecification.referenceQuantity.unitCode, "MTK");
});

test("SSR rental suffix uses the canonical period without assuming a month", () => {
  for (const [rentPeriod, suffix] of [["day", " / d\u00eda"], ["month", " / mes"], ["year", " / a\u00f1o"]]) {
    const p = property({ operation: "rent", catalogData: undefined, catalog_data: { rentPeriod } });
    assert.ok(cardPrice(p).endsWith(suffix));
  }
  assert.match(cardPrice(property({ operation: "rent" })), /periodo por confirmar/);
  assert.match(cardPrice(property({ operation: "rent" }), "en"), /period unconfirmed/);
});

for (const [name, missing] of [["null", null], ["undefined", undefined], ["empty", ""], ["whitespace", "   "]]) {
  test(`JSON-LD omits ${name} source geography and does not assign a country`, () => {
    const p = property({ city: missing, state: missing, address: missing });
    const listing = listingSchema(p);
    assert.equal(Object.hasOwn(listing.mainEntity, "address"), false);
    assert.equal(inventory.resolveLocation(p).id, "");
  });
}

test("documented geography is retained independently without mutating input", () => {
  for (const fields of [{ city: "Playa del Carmen" }, { state: "Yucatan" }, { address: "Calle documentada 123" }, { city: "Cancun", state: "Quintana Roo", address: "Calle documentada 123" }]) {
    const p = property(fields), before = plain(p);
    const address = listingSchema(p).mainEntity.address;
    assert.equal(address.addressLocality, p.city || undefined);
    assert.equal(address.addressRegion, p.state || undefined);
    assert.equal(address.streetAddress, p.address || undefined);
    assert.equal(Object.hasOwn(address, "addressCountry"), false);
    assert.deepEqual(plain(p), before);
  }
});

test("property and development introductions never substitute Cancun for absent geography", () => {
  for (const patch of [{}, { type: "Desarrollo", publicationSection: "developments" }]) {
    const rendered = seo.renderPropertyPage(property({ zone: "", ...patch }));
    assert.doesNotMatch(rendered.page.intro, /Cancun|Canc\u00fan/);
  }
  assert.match(seo.renderPropertyPage(property({ zone: "", city: "Merida" })).page.intro, /Merida/);
});

for (const patch of [
  { publication_section: "typologies" }, { type: "Tipologia" }, { type: "Tipolog\u00eda" }, { type: "Typology" },
]) {
  test(`public projection excludes unsupported typologies: ${JSON.stringify(patch)}`, async () => {
    const api = publicInventory([row(patch)]);
    assert.deepEqual(plain(await api.get()), []);
    assert.equal(api.reads(), 1);
  });
}

test("shared eligibility keeps public units/projects separate and does not merge repeated MLS", async () => {
  const api = publicInventory([
    row({ id: "unit-a", mls: "1707" }), row({ id: "unit-b", mls: "1707", status: "featured" }),
    row({ id: "project", type: "Desarrollo", publication_section: "developments" }),
    row({ id: "private", is_public: false }), row({ id: "draft", status: "draft" }), row({ id: "archived", status: "archived" }),
  ]);
  const result = await api.get();
  assert.deepEqual(plain(result.map((p) => p.id)), ["unit-a", "unit-b", "project"]);
  assert.ok(result.every(inventory.isPublic));
  assert.equal(inventory.queryInventory(result, { entity: "properties" }).total, 2);
  assert.equal(inventory.queryInventory(result, { entity: "developments" }).total, 1);
});

test("excluded parent eligibility also removes its public relationship and media", async () => {
  const source = [
    row({ id: "pending-parent", publication_section: "typologies" }),
    row({ parent_development_id: "pending-dev", parent_development_record: { id: "pending-dev", propertyId: "pending-parent", nameEs: "Pending project", imageCount: 2 } }),
  ];
  const before = plain(source), api = publicInventory(source), result = await api.get();
  assert.equal(result.length, 1);
  assert.equal(result[0].parentDevelopment, null);
  assert.equal(result[0].developmentId, null);
  assert.deepEqual(plain(result[0].developmentImages), []);
  assert.deepEqual(plain(source), before);
});

test("eligible parent relations survive and projection still honors coordinate privacy", async () => {
  const api = publicInventory([
    row({ id: "project", type: "Desarrollo", publication_section: "developments" }),
    row({ parent_development_id: "dev-1", parent_development_record: { id: "dev-1", propertyId: "project", nameEs: "Public project", imageCount: 2 } }),
    row({ id: "approximate", location_precision: "approximate" }),
    row({ id: "exact", location_precision: "exact" }),
  ]);
  const rows = await api.get(), unit = rows.find((p) => p.id === "fixture-unit");
  assert.equal(unit.developmentId, "dev-1");
  assert.equal(unit.parentDevelopment.propertyId, "project");
  assert.equal(unit.developmentImages.length, 2);
  assert.equal(unit.latitude, null);
  assert.equal(unit.longitude, null);
  assert.equal(unit.address, "");
  assert.equal(rows.find((p) => p.id === "approximate").latitude, 21.12);
  assert.equal(rows.find((p) => p.id === "exact").latitude, 21.123456);
});

test("cache contains only eligible public records and reuses the existing TTL behavior", async () => {
  const api = publicInventory([row(), row({ id: "pending", publication_section: "typologies" })]);
  const first = await api.get(), second = await api.get();
  assert.strictEqual(second, first);
  assert.deepEqual(plain(second.map((p) => p.id)), ["fixture-unit"]);
  assert.equal(api.reads(), 1);
});
