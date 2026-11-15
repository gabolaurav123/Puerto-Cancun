"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { resolveInquiryContext } = require("../inquiry-context");
const { sourcePath } = require("../contact-inquiries");
const { fixtures, createHarness } = require("./helpers/public-inquiry-harness");
const body = extra => ({ intent: "buy", lang: "en", contactChannel: "email", email: "buyer@example.test", consent: true, formStartedAt: Date.now() - 2500, requestId: randomUUID(), sourcePath: "/en/properties?q=beach&priceMode=public-usd", ...extra });

test("canonical identities keep sale, rent, presale and outside-city land context separate", () => {
  const properties = fixtures();
  for (const [id, intent, entity, project] of [["fixture-sale", "buy", "property", ""], ["fixture-rent", "rent", "property", ""], ["fixture-presale", "buy", "development", "Proyecto en preventa"], ["fixture-presale-unit", "buy", "property", "Proyecto en preventa"]]) {
    const context = resolveInquiryContext({ propertyId: id, intent }, properties, { validateIntent: true });
    assert.equal(context.entity, entity); assert.equal(context.fixedIntent, intent); assert.equal(context.project, project);
    assert.deepEqual(context.allowedIntents, [intent]);
    assert.equal(context.propertyId, entity === "property" ? id : "");
  }
  const land = resolveInquiryContext({ propertyId: "fixture-land", intent: "buy" }, properties);
  assert.equal(land.zone, "Fuera de Cancún"); assert.equal(land.subzone, "Cozumel"); assert.equal(land.propertyType, "Terreno");
  assert.equal(resolveInquiryContext({ propertyId: "fixture-rent" }, properties).rentPeriod, "");
  const unknownPeriod = properties.map(p => p.id === "fixture-rent" ? { ...p, catalogData: { rentPeriod: "unclassified" } } : p);
  assert.equal(resolveInquiryContext({ propertyId: "fixture-rent" }, unknownPeriod).rentPeriod, "", "An unknown period must not become an invalid optional preference");
});

test("legacy references to developments cannot resolve to a child that appears first in inventory", () => {
  const properties = fixtures();
  for (const values of [{ reference: "fixture-presale" }, { reference: "presale-fixture-presale" }, { reference: "fixture-presale-key" }, { propertyId: "fixture-presale" }, { developmentId: "fixture-presale-key" }]) {
    const context = resolveInquiryContext(values, properties);
    assert.equal(context.entity, "development", JSON.stringify(values));
    assert.equal(context.developmentId, "fixture-presale"); assert.equal(context.propertyId, ""); assert.equal(context.fixedIntent, "buy");
  }
  assert.throws(() => resolveInquiryContext({ propertyId: "fixture-sale", developmentId: "fixture-presale", intent: "buy" }, properties, { validateIntent: true }), /not linked|no pertenece/);
});

test("source paths retain public USD semantics while removing unrecognized data", () => {
  assert.equal(sourcePath("/propiedades?currency=USD&priceMode=public-usd&max=1000000&secret=remove#map"), "/propiedades?currency=USD&priceMode=public-usd&max=1000000");
  assert.equal(sourcePath("https://external.example"), "/");
});

test("context endpoint fixes operations and rejects unavailable identities without opening a database transaction", async t => {
  const h = await createHarness(); t.after(h.close);
  const rental = await h.get("/api/inquiries/context?propertyId=fixture-rent&intent=buy&lang=en");
  assert.equal(rental.status, 200); assert.equal(rental.data.fixedIntent, "rent"); assert.equal(rental.data.project, "");
  const legacy = await h.get("/api/inquiries/context?propertyId=fixture-presale&lang=en");
  assert.equal(legacy.status, 200); assert.equal(legacy.data.developmentId, "fixture-presale"); assert.equal(legacy.data.propertyId, "");
  assert.equal((await h.get("/api/inquiries/context?propertyId=deleted-fixture&lang=en")).status, 400);
  assert.equal(h.records.size, 0); assert.equal(h.calls.some(([sql]) => sql === "BEGIN"), false);
});

test("email-only contact ignores hidden phone data, persists canonical context and is idempotent", async t => {
  const h = await createHarness(); t.after(h.close);
  const request = body({ propertyId: "fixture-sale", phone: "bad hidden input", country: "ZZ", propertyTitle: "forged", zone: "forged", mls: "forged", propertyType: "Terreno" });
  const first = await h.post(request); assert.equal(first.status, 201, first.data.error);
  const second = await h.post(request); assert.equal(second.status, 200, second.data.error);
  assert.equal(first.data.id, second.data.id); assert.equal(h.records.size, 1); assert.equal(h.contacts.length, 1);
  const stored = [...h.records.values()][0];
  assert.equal(stored.phone, ""); assert.equal(stored.email, "buyer@example.test"); assert.equal(stored.propertyId, "fixture-sale");
  assert.equal(stored.payload.propertyTitle, "Published apartment"); assert.equal(stored.payload.zone, "Puerto Cancún"); assert.equal(stored.payload.mls, "QA100"); assert.equal(stored.payload.propertyType, "Departamento");
  assert.equal(stored.payload.contactChannel, "email"); assert.equal(stored.payload.consentContact, true); assert.ok(stored.payload.consentAt);
  assert.equal(stored.payload.project, undefined);
  const another = await h.post({ ...request, email: "another@example.test" }); assert.equal(another.status, 201); assert.equal(h.records.size, 2);
});

test("server rejects incompatible presale and rental intent and validates only the chosen contact channel", async t => {
  const h = await createHarness(); t.after(h.close);
  for (const intent of ["rent", "sell", "let"]) assert.equal((await h.post(body({ propertyId: "fixture-presale", intent }))).status, 400);
  assert.equal((await h.post(body({ propertyId: "fixture-rent", intent: "buy" }))).status, 400);
  assert.equal((await h.post(body({ contactChannel: "sms" }))).status, 400);
  assert.equal((await h.post(body({ email: "invalid" }))).status, 400);
  assert.equal((await h.post(body({ consent: false }))).status, 400);
  assert.equal((await h.post(body({ budget: 100000, currency: "MXN", priceMode: "public-usd" }))).status, 400);
  const phone = await h.post(body({ contactChannel: "whatsapp", phone: "9982166563", email: "invalid inactive field" }));
  assert.equal(phone.status, 201, phone.data.error);
  const stored = [...h.records.values()][0]; assert.equal(stored.phone, "529982166563"); assert.equal(stored.email, ""); assert.equal(stored.payload.country, "MX");
});

test("visits accept an optional date and rental requests never invent the unknown listing period", async t => {
  const h = await createHarness(); t.after(h.close);
  h.properties.find(p => p.id === "fixture-rent").catalogData = { rentPeriod: "unclassified" };
  const result = await h.post(body({ propertyId: "fixture-rent", intent: "rent", service: "visit", rentPeriod: "month" }));
  assert.equal(result.status, 201, result.data.error); assert.equal(result.data.visitStatus, "requested");
  assert.equal(h.tours.length, 1); assert.equal(h.tours[0].preferredDate, null); assert.equal(h.tours[0].preferredTime, null);
  const stored = [...h.records.values()][0]; assert.ok(!stored.payload.rentPeriod); assert.equal(stored.payload.project, undefined);
  assert.doesNotMatch(new URL(result.data.whatsappUrl).searchParams.get("text"), /monthly|Preventa:|Presale:/);
});

test("alerts preserve exact legacy MXN criteria and activate only the opted-in chosen available channel", async t => {
  const h = await createHarness({ channels: { email: true, whatsapp: false } }); t.after(h.close);
  const filters = { entity: "properties", operation: "sale", currency: "MXN", max: 20000000, locations: ["puerto-cancun"], beds: 2 };
  const request = body({ service: "search-watch", searchFilters: filters, alertChannel: "email", alertConsent: true });
  const first = await h.post(request); assert.equal(first.status, 201, first.data.error); assert.equal(first.data.searchWatchStatus, "active");
  const saved = [...h.records.values()][0].payload.searchWatch;
  assert.equal(saved.email, "buyer@example.test"); assert.equal(saved.filters.currency, "MXN"); assert.equal(saved.filters.max, 20000000); assert.equal(saved.filters.priceMode, undefined);
  assert.equal((await h.post({ ...request, alertChannel: "whatsapp" })).status, 400);
  assert.equal((await h.post({ ...request, alertConsent: false })).status, 400);
  const pending = await h.post({ ...request, alertChannel: "", alertConsent: false });
  assert.equal(pending.status, 201); assert.equal(pending.data.searchWatchStatus, "pending_channel");
  const review = await h.post({ ...request, preferences: "Mascotas" });
  assert.equal(review.status, 201); assert.equal(review.data.searchWatchStatus, "needs_review");
});
