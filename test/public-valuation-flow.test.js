"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const { contactIdentity, sourcePath } = require("../contact-inquiries");
const { resolveInquiryContext } = require("../inquiry-context");
const { normalizePhone } = require("../platform-utils");

const source = fs.readFileSync(require.resolve("../server"), "utf8");
const start = source.indexOf('app.post("/api/leads",');
const route = source.slice(start, source.indexOf("\nfunction toSavedSearch", start));
const formBody = extras => ({ leadType: "valuacion-inmobiliaria", zone: "Cozumel", lang: "en", contactChannel: "email", email: "owner@example.test",
  currency: "USD", priceMode: "public-usd", consent: true, formStartedAt: Date.now() - 3000, sourcePath: "/en/property-valuation-cancun", requestId: crypto.randomUUID(), ...extras });

async function harness(t) {
  const records = [], valuations = [], contacts = [], locks = [];
  let counter = 0;
  const properties = [{ id: "fixture-presale", type: "Desarrollo", publicationSection: "developments", titleEs: "Proyecto verificado", zone: "Puerto Cancún", status: "active", isPublic: true, catalogData: { salesModality: "presale" } }];
  const query = async (sql, values = []) => {
    if (sql.includes("pg_advisory_xact_lock")) locks.push(values[0]);
    if (sql.includes("SELECT * FROM lead_requests")) {
      const [type, email, phone, scoped, propertyId, key, requestId, developmentId] = values;
      const found = records.find(row => row.lead_type === type && (email && row.email === email || phone && row.phone === phone)
        && (!scoped || row.property_id === propertyId) && (!key || row.payload.valuationKey === key)
        && (!developmentId || row.payload.developmentId === developmentId));
      return { rows: found ? [found] : [] };
    }
    if (sql.includes("INSERT INTO lead_requests")) {
      const [id, lead_type, name, phone, email, source_path, property_id, contact_id, payload] = values;
      const row = { id, lead_type, name, phone, email, source_path, property_id, contact_id, payload: JSON.parse(payload) };
      records.push(row); return { rows: [row] };
    }
    if (sql.includes("INSERT INTO valuations")) {
      const [id, requestId, contactId, propertyId, ownerName, phone, email, zone, propertyType, expectedPrice, comments, expectedCurrency] = values;
      valuations.push({ id, requestId, contactId, propertyId, ownerName, phone, email, zone, propertyType, expectedPrice, comments, expectedCurrency });
    }
    return { rows: [] };
  };
  const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.session = {}; next(); });
  vm.runInNewContext(route, {
    app, pool: { connect: async () => ({ query, release() {} }) }, crypto,
    inferLeadCategory: type => type.includes("valuacion") ? "valuation" : "general", normalizePhone,
    isValidEmail: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), inquirySourcePath: sourcePath,
    contactIdentity, resolveInquiryContext, getPublicProperties: async () => properties,
    serviceChannel: async () => ({ whatsappRef: "test-ref", destination: "529982166563" }),
    inquiryAction: (id, payload) => payload.whatsappRef ? { id, whatsappUrl: "https://wa.me/529982166563" } : null,
    leadScoreFromData: () => "warm", contactTypeFromLead: () => "seller",
    upsertContact: async (_client, contact) => { contacts.push(contact); return { id: "contact-" + ++counter }; },
    uuid: prefix => prefix + "-" + ++counter, toLead: row => row,
    numericOrNull: value => value === undefined || value === null || value === "" ? null : Number(value),
    ownerPriceCurrency: (price, currency) => price === null ? null : ["USD", "MXN"].includes(currency) ? currency : null,
    siteUrl: "https://example.test", sessionSecret: "test-secret", Date,
  });
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }));
  const server = http.createServer(app); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const post = async body => {
    const response = await fetch("http://127.0.0.1:" + server.address().port + "/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  return { post, records, valuations, contacts, locks };
}

test("email-only valuation stores one chosen reply channel, consent and one valuation across retries", async t => {
  const h = await harness(t), body = formBody({ phone: "inactive-invalid-field", country: "ZZ" });
  const first = await h.post(body);
  assert.equal(first.status, 201, first.data.error);
  const again = await h.post(body);
  assert.equal(again.status, 200, again.data.error);
  assert.equal(again.data.lead.id, first.data.lead.id);
  assert.equal(h.records.length, 1); assert.equal(h.valuations.length, 1); assert.equal(h.contacts.length, 1);
  assert.equal(h.records[0].phone, null); assert.equal(h.records[0].email, "owner@example.test");
  assert.equal(h.records[0].payload.contactChannel, "email");
  assert.equal(h.records[0].payload.consentContact, true); assert.ok(h.records[0].payload.consentAt);
  assert.equal(h.contacts[0].phonePrimary, false);
  assert.equal(h.valuations[0].expectedPrice, null); assert.equal(h.valuations[0].expectedCurrency, null);
  assert.equal(first.data.action, null);
  assert.equal(h.locks[0], "pcc-inquiry:email:owner@example.test");
});

test("WhatsApp valuation defaults to Mexico and ignores the inactive email field", async t => {
  const h = await harness(t);
  const result = await h.post(formBody({ contactChannel: "whatsapp", phone: "9982166563", email: "bad email" }));
  assert.equal(result.status, 201, result.data.error);
  assert.equal(h.records[0].phone, "529982166563"); assert.equal(h.records[0].email, null);
  assert.equal(h.records[0].payload.country, "MX"); assert.equal(h.records[0].payload.contactChannel, "whatsapp");
  assert.ok(result.data.action.whatsappUrl); assert.equal(h.contacts[0].phonePrimary, true);
});

test("review requires zone, valid chosen channel, consent and a positive USD estimate", async t => {
  const h = await harness(t);
  for (const patch of [{ zone: "" }, { consent: false }, { contactChannel: "sms" }, { email: "bad" }, { ownerEstimate: "" }, { ownerEstimate: 0 }, { ownerEstimate: true }, { ownerEstimate: -1 }, { ownerEstimate: "NaN" }, { currency: "MXN" }]) {
    const result = await h.post(formBody({ leadType: "validar-precio", ownerEstimate: 250000, ...patch }));
    assert.equal(result.status, 400, JSON.stringify(patch)); assert.equal(h.records.length, 0);
  }
  const result = await h.post(formBody({ leadType: "validar-precio", ownerEstimate: "250000", propertyType: "Terreno", landSize: "900", bedrooms: "3", bathrooms: "2", builtSize: "200", age: "10" }));
  assert.equal(result.status, 201, result.data.error);
  assert.equal(h.valuations[0].expectedPrice, 250000); assert.equal(h.valuations[0].expectedCurrency, "USD");
  assert.equal(h.records[0].payload.landSize, "900");
  for (const key of ["bedrooms", "bathrooms", "builtSize", "age"]) assert.equal(h.records[0].payload[key], undefined);
});

test("legacy price-review submissions retain their stated currency without relabeling stored amounts", async t => {
  const h = await harness(t);
  for (const currency of ["MXN", "USD", undefined]) {
    const result = await h.post(formBody({ leadType: "validar-precio", ownerEstimate: 100000, currency, priceMode: undefined }));
    assert.equal(result.status, 201, result.data.error);
    const saved = h.valuations.at(-1);
    assert.equal(saved.expectedPrice, 100000); assert.equal(saved.expectedCurrency, currency || null);
  }
});

test("legacy development form rejects owner/rental intents for a presale and keeps project IDs distinct", async t => {
  const h = await harness(t), body = formBody({ leadType: "contacto-desarrollo", propertyId: "fixture-presale" });
  for (const developmentIntent of ["rent", "sell", "let"]) assert.equal((await h.post({ ...body, developmentIntent })).status, 400);
  const result = await h.post({ ...body, developmentIntent: "buy" });
  assert.equal(result.status, 201, result.data.error);
  assert.equal(h.records[0].property_id, null); assert.equal(h.records[0].payload.developmentId, "fixture-presale");
  assert.equal(h.records[0].payload.intent, "buy"); assert.equal(h.valuations.length, 0);
  assert.equal((await h.post({ ...body, developmentIntent: "buy" })).status, 200);
  assert.equal(h.records.length, 1);
});

test("legacy leads cannot activate alerts or forge workflow, account and delivery state", async t => {
  const h = await harness(t);
  const forged = {
    searchWatch: { status: "active", channel: "email", email: "other@example.test", consentAt: "2000-01-01", filters: {}, knownPropertyIds: [], deliveries: {} },
    alertConsent: true, alertChannel: "email", alertEmail: "other@example.test",
    commercialStage: "closed_won", commercialMilestones: { closed_won: "2000-01-01" },
    visitId: "another-visit", visitStatus: "confirmed", visitTimezone: "UTC", visitConfirmedAt: "2000-01-01", visitCompletedAt: "2000-01-01",
    listingPath: "https://wrong.example.test", valuationKey: "forged-key", sellerAccountId: "another-account",
    allowedIntents: ["let"], fixedIntent: "let", entity: "development",
    inquiryFingerprint: "forged", whatsappRef: "forged", destination: "15555555555", whatsappClickedAt: "2000-01-01", whatsappReceivedAt: "2000-01-01",
  };
  const result = await h.post(formBody({ leadType: "general", ...forged, consentContact: false, consentAt: "2000-01-01", country: "ZZ", prefix: "+999", message: "Quiero conocer opciones en Cozumel" }));
  assert.equal(result.status, 201, result.data.error);
  const payload = h.records[0].payload;
  for (const key of Object.keys(forged)) assert.equal(payload[key], undefined, key + " must be server-owned");
  assert.equal(payload.contactChannel, "email"); assert.equal(payload.country, ""); assert.equal(payload.prefix, "");
  assert.equal(payload.consentContact, true); assert.ok(Date.now() - Date.parse(payload.consentAt) < 5000);
  assert.equal(payload.message, "Quiero conocer opciones en Cozumel");
  assert.equal(h.valuations.length, 0); assert.equal(result.data.action, undefined);
});

test("legacy channel-less leads derive consent from the validated form and never trust supplied metadata", async t => {
  const h = await harness(t);
  const body = formBody({ leadType: "general", contactChannel: undefined, consentContact: false, consentAt: "2000-01-01", prefix: "+999", country: "ZZ" });
  assert.equal((await h.post({ ...body, consent: false })).status, 400);
  assert.equal(h.records.length, 0);
  assert.equal((await h.post(body)).status, 201);
  const payload = h.records[0].payload;
  assert.equal(payload.contactChannel, "email"); assert.equal(payload.consentContact, true);
  assert.ok(Date.now() - Date.parse(payload.consentAt) < 5000);
  assert.equal(payload.country, undefined); assert.equal(payload.prefix, undefined);
});

test("lead submission keeps data and request identity after failure and only confirms a saved lead", async () => {
  const source = fs.readFileSync(require.resolve("../app"), "utf8");
  const code = source.slice(source.indexOf("async function leadFormSubmit("), source.indexOf("\nfunction preparePersonalDataForms"));
  const payloads = [], messages = [], node = { focus() {} }, button = {};
  let resets = 0;
  const form = { dataset: {}, reportValidity: () => true, elements: { country: {}, formStartedAt: {} },
    querySelector: selector => selector.startsWith("button") ? button : node, reset() { resets++; },
    data: { leadType: "validar-precio", zone: "Cozumel", contactChannel: "email", email: "owner@example.test", phone: "inactive", country: "MX", ownerEstimate: "250000", currency: "USD" } };
  const submit = vm.runInNewContext(code + "\nleadFormSubmit", { crypto, state: { lang: "en" },
    FormData: class { constructor(target) { this.target = target; } entries() { return Object.entries(this.target.data); } },
    setFormMessage: (_node, message) => messages.push(message), setButtonLoading() {}, t: () => "Saved", showToast() {},
    window: { location: { pathname: "/en/review-property-price", search: "?zone=Cozumel", hash: "#review" }, PccInquiry: { populatePhone() {} } },
    api: async (_path, { body }) => { payloads.push(body); if (payloads.length === 1) throw new Error("No network"); return { lead: { id: "saved-id" } }; },
  });
  const event = { preventDefault() {}, currentTarget: form };
  await submit(event); assert.equal(resets, 0); assert.equal(messages.at(-1), "No network");
  await submit(event); assert.equal(resets, 1); assert.equal(messages.at(-1), "Saved");
  assert.equal(payloads[0].requestId, payloads[1].requestId);
  assert.equal(payloads[0].phone, undefined); assert.equal(payloads[0].country, undefined);
  assert.equal(payloads[0].sourcePath, "/en/review-property-price?zone=Cozumel#review");
});
