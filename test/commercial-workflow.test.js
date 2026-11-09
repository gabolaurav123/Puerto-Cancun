"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { visitPreference, enrichCommercialInquiry, matchingListings, ownerMatches, registerCommercialRoutes, unsubscribeToken } = require("../commercial-workflow");

const properties = [
  { id: "development-a", developmentData: { id: "dev-a" }, publicationSection: "developments", titleEs: "Desarrollo A", titleEn: "Development A", zone: "Puerto Cancun", isPublic: true, status: "active" },
  { id: "unit-a", developmentId: "dev-a", titleEs: "Unidad A", zone: "Puerto Cancun", catalogData: { locationId: "puerto-cancun" }, type: "Departamento", operation: "sale", price: 200000, currency: "USD", isPublic: true, status: "active" },
  { id: "unit-b", portalDevelopmentId: "development-a", titleEs: "Unidad B", zone: "Puerto Cancun", type: "Departamento", operation: "sale", price: 300000, currency: "USD", isPublic: true, status: "active" },
  { id: "unit-unrelated", titleEs: "Otra unidad", zone: "Puerto Cancun", type: "Departamento", operation: "sale", price: 200000, currency: "USD", isPublic: true, status: "active" },
  { id: "unit-sold", developmentId: "dev-a", titleEs: "Unidad vendida", zone: "Puerto Cancun", type: "Departamento", operation: "sale", price: 200000, currency: "USD", isPublic: true, status: "sold" },
];
const future = "2027-03-10T14:30";
const criteria = { entity: "properties", operation: "sale", locations: ["puerto-cancun"], type: "Departamento", currency: "USD", max: 250000 };

test("visit preference validates exact future calendar values in Cancun time", () => {
  const now = Date.parse("2026-11-09T12:00:00Z");
  assert.equal(visitPreference(future, now), future);
  for (const value of ["2026-11-08T14:30", "2027-02-30T14:30", "2027-03-10T25:30", "2028-01-01T12:00", future + "invalid", "tomorrow"]) assert.throws(() => visitPreference(value, now), { status: 400 });
});

test("visit enrichment does not confirm, accepts only a published context", async () => {
  const data = await enrichCommercialInquiry({ service: "visit", propertyId: "unit-a", visitPreferredAt: future }, { lang: "es", intent: "buy" }, properties, {});
  assert.equal(data.visitStatus, "requested");
  assert.equal(data.commercialStage, "visit_requested");
  assert.equal(data.visitTimezone, "America/Cancun");
  await assert.rejects(enrichCommercialInquiry({ service: "visit", propertyId: "unit-sold", visitPreferredAt: future }, {}, properties, {}), { status: 400 });
});

test("search watches retain criteria, require configured channels and separate consent", async () => {
  const body = { service: "search-watch", searchFilters: criteria, alertChannel: "email", alertEmail: "buyer@example.test", alertConsent: true };
  await assert.rejects(enrichCommercialInquiry(body, { intent: "buy" }, properties, { email: false }), { status: 400 });
  await assert.rejects(enrichCommercialInquiry({ ...body, alertConsent: false }, { intent: "buy" }, properties, { email: true }), { status: 400 });
  const data = await enrichCommercialInquiry(body, { intent: "buy" }, properties, { email: true });
  assert.equal(data.searchWatch.status, "active");
  assert.equal(data.searchWatch.filters.max, 250000);
  assert.equal(data.searchWatch.filters.currency, "USD");
  assert.ok(data.searchWatch.consentAt);
  assert.deepEqual(data.searchWatch.knownPropertyIds.sort(), ["unit-a", "unit-unrelated"]);
  const reviewed = await enrichCommercialInquiry(body, { intent: "buy", preferences: "Mascotas" }, properties, { email: true });
  assert.equal(reviewed.searchWatch.status, "needs_review");
  const noChannel = await enrichCommercialInquiry({ ...body, alertChannel: "" }, { intent: "buy" }, properties, {});
  assert.equal(noChannel.searchWatch.status, "pending_channel");
  assert.equal(noChannel.searchWatch.consentAt, null);
});

test("custom directory zones survive watch creation and matching", async () => {
  const areas = [{ id: "custom-zone", nameEs: "Zona nueva", nameEn: "New zone" }];
  const inventory = [{ ...properties[1], catalogData: { locationId: "custom-zone" } }];
  const data = await enrichCommercialInquiry({ service: "search-watch", searchFilters: { ...criteria, locations: ["custom-zone"] } }, { intent: "buy" }, inventory, {}, areas);
  assert.equal(data.searchWatch.filters.locations[0], "custom-zone");
  assert.deepEqual(matchingListings({ payload: data }, inventory, areas).matches.map(row => row.id), ["unit-a"]);
});

test("lead matching resolves native or portal development ids without mixing other units", () => {
  for (const dev of [{ developmentId: "development-a" }, { developmentId: "dev-a" }, { development: "Desarrollo A" }]) {
    const result = matchingListings({ payload: { intent: "buy", ...dev, zone: "Puerto Cancún", propertyType: "Departamento", budget: 400000, currency: "USD" } }, properties);
    assert.deepEqual(result.matches.map(row => row.id).sort(), ["unit-a", "unit-b"]);
    assert.ok(result.matches.every(row => row.url.startsWith("/propiedades/")));
  }
  const unknown = matchingListings({ payload: { intent: "buy", development: "Ambiguous or unknown" } }, properties);
  assert.equal(unknown.matches.length, 0);
  assert.ok(unknown.pending.length);
});

test("owners are matched by stable development, operation, type, currency and rental period", () => {
  const buyer = { id: "buyer", payload: { intent: "rent", developmentId: "development-a", propertyType: "Departamento", budget: 4000, currency: "USD", rentPeriod: "month" } };
  const owner = { id: "owner", name: "Propietario", payload: { intent: "let", developmentId: "development-a", propertyType: "Departamento", askingPrice: 3500, currency: "USD", rentPeriod: "month" } };
  assert.equal(ownerMatches(buyer, [owner]).length, 1);
  for (const patch of [{ askingPrice: 5000 }, { intent: "sell" }, { developmentId: "different" }, { rentPeriod: "day" }, { propertyType: "Casa" }, { commercialStage: "closed_won" }]) assert.equal(ownerMatches(buyer, [{ ...owner, payload: { ...owner.payload, ...patch } }]).length, 0);
  const unknownPrice = ownerMatches(buyer, [{ ...owner, payload: { ...owner.payload, askingPrice: null } }]);
  assert.match(unknownPrice[0].pending.join(" "), /Presupuesto/);
});

async function routeHarness(t, db, extras = {}) {
  const app = express(); app.use(express.json()); app.use(express.urlencoded({ extended: false }));
  app.use((req, _res, next) => { req.session = { csrfToken: "fixture-csrf", ...(req.get("x-admin") === "yes" ? { user: { id: "admin-prueba" } } : {}) }; next(); });
  const deps = { query: db.query, pool: { connect: async () => ({ query: db.query, release: () => db.calls?.push(["RELEASE"]) }) },
    uuid: () => "fixture-uuid", siteUrl: "https://portal.example.test", secret: "test-secret", channels: () => ({ email: true, whatsapp: false }),
    getPublicProperties: async () => properties, requireRole: () => (req, res, next) => req.session.user ? next() : res.status(401).json({ error: "unauthorized" }),
    sendEmail: async () => {}, sendWhatsapp: async () => {}, ...extras };
  const workflow = registerCommercialRoutes(app, deps);
  app.use((error, req, res, next) => res.status(error.status || 500).json({ error: error.message }));
  const server = http.createServer(app); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return { workflow, url: "http://127.0.0.1:" + server.address().port };
}

test("commercial update is authorized, validates transitions and records a visit plus history atomically", async t => {
  const calls = [];
  const lead = { id: "lead-test", payload: { intent: "buy", visitId: "tour-test", commercialStage: "visit_requested" }, assigned_to: null, internal_notes: "Existing note" };
  const db = { calls, query: async (sql, values = []) => {
    calls.push([sql, values]);
    if (sql.startsWith("SELECT * FROM lead_requests")) return { rows: [structuredClone(lead)], rowCount: 1 };
    if (sql.startsWith("SELECT id FROM internal_users")) return { rows: [], rowCount: 0 };
    return { rows: [], rowCount: 1 };
  } };
  const { url } = await routeHarness(t, db);
  let response = await fetch(url + "/api/admin/commercial/lead-test", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ stage: "visit_confirmed" }) });
  assert.equal(response.status, 401); assert.equal(calls.length, 0);
  response = await fetch(url + "/api/admin/commercial/lead-test", { method: "PATCH", headers: { "content-type": "application/json", "x-admin": "yes" }, body: JSON.stringify({ stage: "visit_confirmed", assignedTo: "admin-prueba", note: "Confirmed by phone" }) });
  assert.equal(response.status, 200);
  assert.equal(calls[0][0], "BEGIN");
  assert.ok(calls.some(([sql, values]) => sql.startsWith("UPDATE tour_requests") && values[1] === "confirmed"));
  const update = calls.find(([sql]) => sql.startsWith("UPDATE lead_requests"));
  const payload = JSON.parse(update[1][1]);
  assert.equal(payload.visitStatus, "confirmed");
  assert.ok(payload.commercialMilestones.visit_confirmed);
  assert.match(update[1][3], /Existing note.*\n.*Confirmed by phone/s);
  assert.ok(calls.some(([sql]) => sql.startsWith("INSERT INTO activity_logs")));
  assert.ok(calls.some(([sql]) => sql === "COMMIT"));
  calls.length = 0;
  response = await fetch(url + "/api/admin/commercial/lead-test", { method: "PATCH", headers: { "content-type": "application/json", "x-admin": "yes" }, body: JSON.stringify({ stage: "captured", note: "Wrong buyer stage" }) });
  assert.equal(response.status, 400);
  assert.ok(calls.some(([sql]) => sql === "ROLLBACK"));
  assert.ok(!calls.some(([sql]) => sql.startsWith("UPDATE")));
});

test("unsubscribe GET stays read-only and POST requires the signed lead token", async t => {
  const calls = [], db = { calls, query: async (sql, values) => { calls.push([sql, values]); return { rows: [], rowCount: 1 }; } };
  const { url } = await routeHarness(t, db);
  const token = unsubscribeToken("lead-test", "test-secret");
  let response = await fetch(url + "/avisos/cancelar?id=lead-test&token=" + token);
  assert.equal(response.status, 200); assert.equal(calls.length, 0);
  response = await fetch(url + "/api/search-watch/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "lead-test", token: "invalid" }) });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
  response = await fetch(url + "/api/search-watch/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "lead-test", token }) });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1); assert.match(calls[0][0], /cancelled/);
});

test("watch delivery uses only newly matching listings, is idempotent and holds uncertain deliveries for review", async t => {
  const calls = [], messages = [];
  const lead = { id: "watch-lead", phone: "5219982166563", payload: { lang: "en", searchWatch: { filters: criteria, status: "active", consentAt: new Date().toISOString(), channel: "email", email: "buyer@example.test", knownPropertyIds: ["unit-unrelated"], deliveries: {} } } };
  let failure = false, cancelledBeforeClaim = false;
  const db = { calls, query: async (sql, values = []) => {
    calls.push([sql, values]);
    if (sql.includes("pg_try_advisory_lock")) return { rows: [{ locked: true }] };
    if (sql.startsWith("SELECT id,phone,payload")) return { rows: [structuredClone(lead)] };
    if (sql.startsWith("UPDATE lead_requests")) {
      if (sql.includes("status'='active'") && cancelledBeforeClaim) return { rows: [], rowCount: 0 };
      lead.payload.searchWatch.deliveries = JSON.parse(values[1]); return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  } };
  const { workflow } = await routeHarness(t, db, { sendEmail: async message => { messages.push(message); if (failure) throw new Error("Ambiguous provider timeout"); } });
  await workflow.evaluateWatches();
  assert.equal(messages.length, 1);
  assert.match(messages[0].html, /Unidad A/);
  assert.doesNotMatch(messages[0].html, /Otra unidad|Unidad B|Unidad vendida/);
  assert.equal(lead.payload.searchWatch.deliveries["unit-a"].status, "sent");
  await workflow.evaluateWatches(); assert.equal(messages.length, 1);
  lead.payload.searchWatch.deliveries = {}; failure = true;
  await workflow.evaluateWatches(); assert.equal(messages.length, 2);
  assert.equal(lead.payload.searchWatch.deliveries["unit-a"].status, "needs_review");
  await workflow.evaluateWatches(); assert.equal(messages.length, 2);
  lead.payload.searchWatch.deliveries = {}; cancelledBeforeClaim = true;
  await workflow.evaluateWatches(); assert.equal(messages.length, 2);
  assert.ok(calls.some(([sql]) => sql.includes("pg_advisory_unlock")));
});

test("watches with unverified preferences do not claim automatic compatibility", async t => {
  let sent = 0;
  const db = { query: async sql => sql.includes("pg_try_advisory_lock") ? { rows: [{ locked: true }] } : sql.startsWith("SELECT id,phone,payload") ? { rows: [{ id: "watch", payload: { searchWatch: { status: "active", consentAt: "2026-11-09", channel: "email", preferences: "Mascotas", filters: criteria } } }] } : { rows: [], rowCount: 1 } };
  const { workflow } = await routeHarness(t, db, { sendEmail: async () => { sent++; } });
  await workflow.evaluateWatches(); assert.equal(sent, 0);
});
