"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const inventory = require("../inventory-contract");
const { normalizeCatalogData } = require("../inventory-metadata");
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const server = fs.readFileSync(require.resolve("../server.js"), "utf8");
const copy = value => JSON.parse(JSON.stringify(value));

function extract(source, names, bindings) {
  const code = names.map(name => {
    const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, name);
    return match[0];
  }).join("\n");
  return vm.runInNewContext(`${code}\n({${names.join(",")}})`, bindings);
}

const stored = (patch = {}) => ({
  id: "fixture", title_es: "Original", type: "Casa", publication_section: "properties",
  state: "Quintana Roo", city: "Cancun", zone: "Puerto Cancun", operation: "sale",
  price_amount: null, price_currency: null, price_unit: null, price_usd: "900.00", price_mxn: "18000.00",
  catalog_data: {}, status: "active", is_public: true, images: ["fixture.jpg"],
  updated_at: "2026-10-29T10:00:00.000Z", ...patch,
});

function dto(row) {
  const price = inventory.priceOf(row);
  return { id: row.id, titleEs: row.title_es, type: row.type, publicationSection: row.publication_section,
    state: row.state, city: row.city, zone: row.zone, operation: row.operation,
    price: price.amount, currency: price.currency, priceUnit: price.basis,
    priceUsd: row.price_usd, priceMxn: row.price_mxn, catalogData: row.catalog_data,
    status: row.status, isPublic: row.is_public, latitude: null, longitude: null,
    images: row.images, updatedAt: row.updated_at };
}

function editor(property) {
  const fields = new Map(), requests = [], messages = [];
  const field = name => {
    if (!fields.has(name)) {
      let value = "";
      const options = name === "currency" ? [{ value: "USD" }, { value: "MXN" }] : name === "priceUnit" ? [{ value: "total" }, { value: "sqm" }] : [];
      fields.set(name, { name, options, checked: false, required: ["price", "currency", "priceUnit"].includes(name), files: [],
        get value() { return value; }, set value(next) { value = String(next ?? ""); },
        append(option) { options.push(option); }, closest: () => null });
    }
    return fields.get(name);
  };
  const submit = { dataset: {} }, message = {}, dialog = { open: false };
  const form = { dataset: {}, querySelector: selector => selector === '[type="submit"]' ? submit : null,
    querySelectorAll: () => [], scrollIntoView() {}, setAttribute() {}, removeAttribute() {},
    reportValidity: () => [...fields.values()].every(item => !item.required || item.value !== "") };
  const state = { properties: property ? [property] : [], adminSection: "new-property", lang: "es", session: { id: "admin" }, adminListingFilters: {} };
  const bindings = {
    state, Option: function (text, value) { return { text, value }; },
    $: selector => ({ "#listingForm": form, "#listingSubmitButton": submit, "#listingFormMessage": message, "#listingPublishDialog": dialog })[selector] || null,
    formField: (_, name) => field(name), canManageListings: () => true,
    setAdminSection: section => { state.adminSection = section; }, developmentRecordId: p => p.id, displayLocation: p => p.zone,
    selectedDevelopmentPropertyIds: () => [],
    listingFormRecordId: () => form.dataset.recordId || "", setListingFormRecordId: (_, id) => { form.dataset.recordId = id; },
    listingFormIsDevelopment: () => field("publicationSection").value === "developments",
    setLocationFormValues: (_, p) => ["state", "city", "zone"].forEach(key => { field(key).value = p[key]; }),
    storedImages: p => p.images || [], normalizedImageMetadata: () => [],
    formImagesReady: () => true, DESCRIPTION_MAX_LENGTH: 10000, parseKeywordInput: () => [],
    confirmListingPublication: async () => true, getListingImagePayload: async () => ({ preserveImages: true }),
    beginOperation: () => ({ remove() {} }), window: { setTimeout: () => 1, clearTimeout() {} },
    setFormMessage: (_, text, error) => messages.push({ text, error }), t: key => key,
    api: async (url, options) => { if (!options) return {}; requests.push({ url, ...copy(options) }); return { property: property || { id: "created", status: "draft" } }; },
  };
  for (const name of ["resetListingForm", "setSelectedDevelopmentPropertyIds", "updateMapPickerForForm", "updateListingImagePreview", "clearListingVideoObjectUrl", "renderListingVideoPreview", "renderListingKeywordChips", "updateListingDescriptionCounter", "setListingQualityPreview", "restoreListingDraft", "saveListingDraft", "setButtonLoading", "updateFormProgress", "clearListingDraft", "renderAdminListingFilters", "renderAdminListings", "renderProperties", "renderStats", "showToast", "restoreListingReturnContext", "renderDevelopmentPropertyLinker"]) bindings[name] = () => {};
  const runtime = extract(app, ["editListing", "listingSubmit", "configureListingFormMode", "listingEditorTitle"], bindings);
  if (property) runtime.editListing(property.id);
  return { ...runtime, field, form, state, requests, messages,
    submit: () => runtime.listingSubmit({ preventDefault() {}, currentTarget: form, submitter: submit }) };
}

function normalizer() {
  return extract(server, ["normalizePropertyInput", "parseOptionalPrice", "parseOptionalCoordinate", "parseNonNegativeInteger", "parseNonNegativeNumber"], {
    inventoryContract: inventory, normalizeCatalogData, DESCRIPTION_MAX_LENGTH: 10000,
    PROPERTY_STATUSES: new Set(["active", "draft"]), PUBLIC_PROPERTY_STATUSES: new Set(["active"]),
    parseUploadedImages: (_, images) => images, normalizeImageMetadata: () => [], normalizeKeywords: () => [], normalizeStatus: value => value || "active",
  }).normalizePropertyInput;
}

function body(patch = {}) {
  return { title: "Changed title", type: "Casa", publicationSection: "properties", state: "Quintana Roo", city: "Cancun", zone: "Puerto Cancun", operation: "sale", status: "active", isPublic: true, catalogData: {}, ...patch };
}

const commercial = p => [p.price, p.currency, p.priceUnit, p.priceUsd, p.priceMxn];
const columns = row => [row.price_amount, row.price_currency, row.price_unit, row.price_usd, row.price_mxn];

for (const patch of [
  {}, { price_currency: "USD" }, { price_currency: "USD", price_unit: "total" }, { price_amount: "123.45" },
  { price_amount: "123.45", price_unit: "total" },
  { price_amount: "123.45", price_currency: "USD" },
  { price_amount: "123.45", price_currency: "USD", price_unit: "total" },
  { price_amount: "123.45", price_currency: "MXN", price_unit: "sqm" },
  { price_amount: "0", price_currency: "EUR", price_unit: "from" },
  { price_amount: "9007199254740993.123456", price_currency: "USD", price_unit: "total" },
  { publication_section: "developments", type: "Desarrollo" },
]) {
  test(`title-only edit preserves every stored price column: ${JSON.stringify(patch)}`, async () => {
    const row = stored(patch), property = dto(row), h = editor(property);
    assert.equal(h.field("price").value, String(property.price ?? ""));
    assert.equal(h.field("price").step, "any", "legacy precision must not block an unrelated edit");
    assert.equal(h.field("currency").value, property.currency ?? "");
    assert.equal(h.field("priceUnit").value, property.priceUnit ?? "");
    h.field("title").value = "Changed title";
    await h.submit();
    assert.equal(h.requests.length, 1, JSON.stringify(h.messages));
    const payload = h.requests[0].body;
    assert.equal(payload.title, "Changed title");
    for (const key of ["price", "currency", "priceUnit", "priceUsd", "priceMxn"]) assert.equal(Object.hasOwn(payload, key), false, key);
    assert.deepEqual(commercial(normalizer()(payload, row.id, row.images, row)), columns(row));
  });
}

test("unknown select options are visible and native validity allows title-only saves", () => {
  const h = editor(dto(stored()));
  for (const key of ["currency", "priceUnit"]) {
    assert.ok(h.field(key).options.some(option => option.value === "" && /confirm/i.test(option.text)));
    assert.equal(h.field(key).required, false);
  }
  assert.equal(h.field("price").required, false);
  assert.equal(h.form.reportValidity(), true);
  h.configureListingFormMode("new-property");
  assert.equal(h.field("price").required, false, "draft restoration must not make the unchanged missing price mandatory");
  for (const key of ["currency", "priceUnit"]) assert.equal(h.field(key).options.filter(option => option.value === "").length, 1);
});

test("new listing keeps required price dimensions after editing an incomplete record", () => {
  const h = editor(dto(stored()));
  h.form.dataset.recordId = "";
  h.configureListingFormMode("new-property");
  for (const key of ["price", "currency", "priceUnit"]) assert.equal(h.field(key).required, true, key);
  assert.equal(h.field("price").step, "0.01");
});

test("base-only edits preserve unknown currency, amount and contradictory legacy aliases", async () => {
  const row = stored(), h = editor(dto(row));
  h.field("priceUnit").value = "sqm";
  await h.submit();
  assert.equal(h.requests.length, 1, JSON.stringify(h.messages));
  const payload = h.requests[0].body;
  assert.equal(payload.priceUnit, "sqm");
  assert.equal(Object.hasOwn(payload, "price"), false);
  assert.equal(Object.hasOwn(payload, "currency"), false);
  assert.deepEqual(commercial(normalizer()(payload, row.id, row.images, row)), [null, null, "sqm", "900.00", "18000.00"]);
});

test("currency-only edits never convert or resurrect a missing amount", async () => {
  for (const amount of [null, "123.456789"]) {
    const row = stored({ price_amount: amount, price_currency: "USD", price_unit: "total" }), h = editor(dto(row));
    h.field("currency").value = "MXN";
    await h.submit();
    assert.equal(h.requests.length, 1, JSON.stringify(h.messages));
    const payload = h.requests[0].body;
    assert.equal(payload.currency, "MXN");
    assert.equal(Object.hasOwn(payload, "price"), false);
    assert.equal(Object.hasOwn(payload, "priceUnit"), false);
    assert.deepEqual(commercial(normalizer()(payload, row.id, row.images, row)), [amount, "MXN", "total", null, amount]);
  }
});

test("base-only edits do not convert the stored amount or overwrite alias columns", async () => {
  const row = stored({ price_amount: "123.456789", price_currency: "USD", price_unit: "total" }), h = editor(dto(row));
  h.field("priceUnit").value = "sqm";
  await h.submit();
  assert.equal(h.requests.length, 1);
  assert.deepEqual(commercial(normalizer()(h.requests[0].body, row.id, row.images, row)), ["123.456789", "USD", "sqm", "900.00", "18000.00"]);
});

test("editing an amount requires explicit currency and basis instead of filling defaults", async () => {
  const row = stored(), h = editor(dto(row));
  h.field("price").value = "500";
  await h.submit();
  assert.equal(h.requests.length, 0);
  assert.ok(h.messages.some(item => item.error));
  h.field("currency").value = "MXN";
  h.field("priceUnit").value = "sqm";
  await h.submit();
  assert.equal(h.requests.length, 1);
  assert.deepEqual(commercial(normalizer()(h.requests[0].body, row.id, row.images, row)), [500, "MXN", "sqm", null, 500]);
});

test("clearing a known price is explicit and requires price-on-request", async () => {
  const row = stored({ price_amount: "500.00", price_currency: "USD", price_unit: "total" }), h = editor(dto(row));
  h.field("price").value = "";
  await h.submit();
  assert.equal(h.requests.length, 0);
  h.field("priceOnRequest").checked = true;
  h.configureListingFormMode("new-property");
  await h.submit();
  assert.equal(h.requests.length, 1);
  assert.deepEqual(commercial(normalizer()(h.requests[0].body, row.id, row.images, row)), [null, "USD", "total", null, null]);
});

test("unchanged explicit canonical nulls do not resurrect legacy columns", () => {
  const row = stored();
  const result = normalizer()(body({ price: null, currency: null, priceUnit: null, priceUsd: 900 }), row.id, row.images, row);
  assert.deepEqual(commercial(result), columns(row));
  assert.equal(result.catalogData.priceOnRequest, false);
});

test("unchanged explicit known fields keep stored precision and both legacy aliases", () => {
  const row = stored({ price_amount: "123.4500", price_currency: "USD", price_unit: "total" });
  const result = normalizer()(body({ price: 123.45, currency: "USD", priceUnit: "total" }), row.id, row.images, row);
  assert.deepEqual(commercial(result), columns(row));
});

test("clearing an amount never falls back to a simultaneous stale legacy alias", () => {
  const row = stored({ price_amount: "100", price_currency: "USD", price_unit: "total" });
  const result = normalizer()(body({ price: null, priceUsd: 900, catalogData: { priceOnRequest: true } }), row.id, row.images, row);
  assert.deepEqual(commercial(result), [null, "USD", "total", null, null]);
  assert.throws(() => normalizer()(body({ price: null }), row.id, row.images, row), error => error.status === 400);
});

for (const patch of [{ price: 50 }, { price: 50, currency: "USD" }, { currency: "EUR" }, { priceUnit: "from" }, { price: -1 }, { price: "NaN" }]) {
  test(`PUT rejects explicit invalid or ambiguous price changes: ${JSON.stringify(patch)}`, () => {
    const row = stored();
    assert.throws(() => normalizer()(body(patch), row.id, row.images, row), error => error.status === 400);
  });
}

test("POST remains compatible and cannot bypass the required price through preservation", () => {
  const normalize = normalizer();
  assert.throws(() => normalize(body(), "new", ["fixture.jpg"]), error => error.status === 400);
  const result = normalize(body({ price: 100, currency: "MXN", priceUnit: "sqm" }), "new", ["fixture.jpg"]);
  assert.deepEqual(commercial(result), [100, "MXN", "sqm", null, 100]);
});

async function putHarness(row, payload, { conflict = false } = {}) {
  const start = server.indexOf('app.put("/api/admin/properties/:id",');
  const end = server.indexOf("\n});", start);
  const calls = [], updates = [];
  let handler, status = 200, result, error;
  const client = { release() {}, async query(sql, params) {
    calls.push(sql);
    if (sql.startsWith("SELECT * FROM properties")) return { rows: [row] };
    if (sql.startsWith("SELECT id,")) return { rows: [{ id: row.id, image_count: 1, images: row.images }] };
    if (sql.startsWith("UPDATE properties")) { updates.push({ sql, params }); return { rows: conflict ? [] : [{ id: row.id }] }; }
    return { rows: [] };
  } };
  vm.runInNewContext(server.slice(start, end + 4), {
    app: { put: (_, ...handlers) => { handler = handlers.at(-1); } }, requireRole: role => { assert.equal(role, "admin"); return () => {}; },
    pool: { connect: async () => client }, sanitizePropertyImageBody: async value => copy(value),
    normalizePropertyInput: normalizer(), mergeLegacyImages: images => images || [],
    validateParentDevelopment: async () => {}, syncDevelopmentEntity: async () => {}, syncDevelopmentLinks: async () => {},
    getPropertySummary: async () => row, toProperty: dto, uuid: () => "fixture-version",
    invalidatePublicPropertyCache() {}, PUBLIC_PROPERTY_STATUSES: new Set(["active"]),
    notifyIndexNow() {}, propertyIndexPaths: () => [], createSavedSearchAlertsForProperty: async () => {}, automaticallyTranslateProperty: async () => {},
  });
  await handler({ body: payload, params: { id: row.id }, session: { user: { id: "fixture-admin" } } }, {
    status(code) { status = code; return this; }, json(value) { result = value; },
  }, value => { error = value; });
  return { status, result, error, calls, updates };
}

test("actual PUT preserves DB bindings and keeps optimistic concurrency on title-only edits", async () => {
  const row = stored();
  const h = await putHarness(row, body({ preserveImages: true, expectedUpdatedAt: row.updated_at }));
  assert.ifError(h.error);
  assert.equal(h.status, 200);
  assert.equal(h.updates.length, 1);
  const { sql, params } = h.updates[0];
  assert.deepEqual([params[37], params[36], params[38], params[15], params[16]], columns(row));
  assert.equal(params[34], row.updated_at);
  assert.match(sql, /date_trunc\('milliseconds', updated_at\)/);
  assert.ok(h.calls.some(sql => /^SELECT \* FROM properties.*FOR UPDATE$/.test(sql)));
  assert.ok(h.calls.includes("COMMIT"));
});

test("conflicting price-preserving PUT rolls back without replacing the snapshot version", async () => {
  const row = stored();
  const h = await putHarness(row, body({ preserveImages: true, expectedUpdatedAt: "old-version" }), { conflict: true });
  assert.ifError(h.error);
  assert.equal(h.status, 409);
  assert.ok(h.calls.includes("ROLLBACK"));
  assert.ok(!h.calls.includes("COMMIT"));
  assert.equal(h.updates[0].params[34], "old-version");
});
