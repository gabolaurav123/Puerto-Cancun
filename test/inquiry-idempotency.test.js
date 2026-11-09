"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { registerInquiries, prepareSearchContext, inquiryFingerprint, messageFor } = require("../contact-inquiries");

const criteria = { entity: "properties", type: "Departamento", operation: "sale", locations: ["puerto-cancun"], max: 700000, currency: "USD", beds: 2 };
const unit = { id: "fixture-property", titleEs: "Departamento de prueba", zone: "Puerto Cancun", type: "Departamento", operation: "sale", price: 500000, currency: "USD", beds: 2, isPublic: true, status: "active" };

test("fingerprint excludes generated watch times/current match snapshots but retains consent and criteria", () => {
  const base = { intent: "buy", searchWatch: { filters: criteria, preferences: "", channel: "email", email: "buyer@example.test", consentAt: "2026-11-09T12:00:00Z", subscribedAt: "2026-11-09T12:00:00Z", knownPropertyIds: ["a"], deliveries: {}, status: "active" } };
  const changedSnapshot = { ...base, searchWatch: { ...base.searchWatch, consentAt: "2026-11-09T13:00:00Z", subscribedAt: "2026-11-09T13:00:00Z", knownPropertyIds: ["a", "b"], deliveries: { b: { status: "sent" } } } };
  assert.equal(inquiryFingerprint("", "/propiedades", base), inquiryFingerprint("", "/propiedades", changedSnapshot));
  assert.notEqual(inquiryFingerprint("", "/propiedades", base), inquiryFingerprint("", "/propiedades", { ...base, searchWatch: { ...base.searchWatch, consentAt: null } }));
  assert.notEqual(inquiryFingerprint("", "/propiedades", base), inquiryFingerprint("", "/propiedades", { ...base, searchWatch: { ...base.searchWatch, filters: { ...criteria, max: 800000 } } }));
});

test("ordinary inquiry keeps full criteria, while changed intent never reuses a sale budget as rent", () => {
  const data = { lang: "es", intent: "buy", budget: 700000, currency: "USD", propertyType: "Departamento", zone: "Puerto Cancún" };
  prepareSearchContext({ searchFilters: criteria, budget: 700000, zone: "Puerto Cancún", propertyType: "Departamento" }, data, [unit]);
  assert.equal(data.searchFilters.beds, 2);
  assert.equal(data.searchFilters.max, 700000);
  const changed = { ...data, intent: "rent", rentPeriod: "month" }; delete changed.searchFilters;
  prepareSearchContext({ searchFilters: criteria, budget: 700000, zone: "Puerto Cancún", propertyType: "Departamento" }, changed, [unit]);
  assert.equal(changed.originalSearchFilters.max, 700000);
  assert.equal(changed.searchFilters.operation, "rent");
  assert.equal(changed.searchFilters.rentPeriod, "month");
  assert.equal(changed.searchFilters.max, null);
  assert.equal(changed.budget, undefined);
  assert.ok(changed.searchContextReview.length);
  const message = messageFor({ ...data, summary: "Interesado en una unidad con dos recámaras", whatsappRef: "fixture" }, "https://example.test/property");
  assert.match(message, /Resumen de la consulta/);
  assert.match(message, /Criterios de búsqueda/);
  assert.doesNotMatch(message, /entity=properties/);
});

test("repeating the same saved-search POST creates one lead even after inventory and generated times change", async t => {
  const records = new Map(), calls = [], properties = [unit];
  let contactCalls = 0, sequence = 0;
  const query = async (sql, values = []) => {
    calls.push([sql, values]);
    if (sql.startsWith("SELECT key, value FROM app_settings")) return { rows: [] };
    if (sql.startsWith("SELECT id, payload FROM lead_requests")) {
      const match = records.get(values[0]) || [...records.values()].find(record => record.phone === values[1] && record.payload.inquiryFingerprint === values[2]);
      return { rows: match ? [match] : [] };
    }
    if (sql.startsWith("INSERT INTO lead_requests")) {
      records.set(values[0], { id: values[0], phone: values[3], payload: JSON.parse(values[7]) });
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  };
  const app = express(); app.use(express.json());
  registerInquiries(app, { query, pool: { connect: async () => ({ query, release() {} }) }, uuid: () => "fixture-" + ++sequence,
    siteUrl: "https://portal.example.test", secret: "test-secret", upsertContact: async () => { contactCalls++; return { id: "same-contact" }; }, leadScoreFromData: () => "warm",
    getPublicProperties: async () => properties, channels: () => ({ email: true, whatsapp: false }) });
  app.use((error, req, res, next) => res.status(error.status || 500).json({ error: error.message }));
  const server = http.createServer(app); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const body = { intent: "buy", lang: "es", country: "US", phone: "+14155552671", consent: true, formStartedAt: Date.now() - 2500, requestId: "search-retry-fixture", sourcePath: "/propiedades", service: "search-watch", searchFilters: criteria, alertChannel: "email", alertEmail: "buyer@example.test", alertConsent: true, summary: "Necesito dos recámaras dentro de mi presupuesto" };
  const post = () => fetch("http://127.0.0.1:" + server.address().port + "/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const first = await post(); assert.equal(first.status, 201); const firstResult = await first.json();
  properties.push({ ...unit, id: "fixture-newly-published" });
  const second = await post(); assert.equal(second.status, 200); const secondResult = await second.json();
  assert.equal(firstResult.id, secondResult.id);
  assert.equal(firstResult.whatsappUrl, secondResult.whatsappUrl);
  assert.equal(records.size, 1);
  assert.equal(contactCalls, 1);
  assert.equal([...records.values()][0].payload.summary, body.summary);
  body.preferences = "Mascotas";
  const different = await post(); assert.equal(different.status, 201);
  assert.equal(records.size, 2, "A genuinely different inquiry is preserved");
  assert.equal(contactCalls, 2);
});
