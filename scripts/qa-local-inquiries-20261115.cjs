"use strict";

// Deliberately restricted to the disposable local HTTP/PostgreSQL instance.
// No production URLs, external messaging or schema initialization are permitted.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Pool } = require("pg");
const base = new URL(process.env.PCC_QA_URL || "http://127.0.0.1:44763");
const database = new URL(process.env.PCC_QA_DATABASE_URL || "");
assert.equal(base.hostname, "127.0.0.1"); assert.equal(base.port, "44763"); assert.equal(base.protocol, "http:");
assert.equal(database.hostname, "127.0.0.1"); assert.equal(database.port, "44762"); assert.equal(database.username, "qa");
const pool = new Pool({ connectionString: database.href, ssl: false });
const run = "nov15-" + Date.now();
const report = { run, at: new Date().toISOString(), http: base.origin, database: "127.0.0.1:44762/postgres (qa)", externalMessages: "disabled; links inspected only", cases: [], ids: {} };
let cookie = "", csrf = "", clientAddress = "192.0.2.1", visitor = 1;
async function api(route, body, headers = {}) {
  const target = new URL(route, base); assert.equal(target.origin, base.origin);
  const response = await fetch(target, { method: body === undefined ? "GET" : "POST", redirect: "error", headers: { "Content-Type": "application/json", Origin: base.origin, Cookie: cookie, "X-CSRF-Token": csrf, "X-Forwarded-For": clientAddress, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  for (const value of response.headers.getSetCookie()) if (value.startsWith("pcc.sid=") || value.startsWith("connect.sid=")) cookie = value.split(";")[0];
  const data = await response.json().catch(() => ({})); if (data.csrfToken) csrf = data.csrfToken;
  return { status: response.status, data };
}
const check = (response, status) => assert.equal(response.status, status, JSON.stringify(response));
const body = extra => ({ intent: "buy", contactChannel: "email", email: `${run}@example.test`, lang: "es", consent: true, formStartedAt: Date.now() - 3000, requestId: randomUUID(), origin: "qa-local-" + run, sourcePath: "/", ...extra });
async function row(id) { const result = await pool.query("SELECT * FROM lead_requests WHERE id=$1", [id]); assert.equal(result.rowCount, 1); return result.rows[0]; }
async function lead(name, input) {
  const first = await api("/api/inquiries", input); check(first, 201); assert.ok(first.data.id);
  const retry = await api("/api/inquiries", input); check(retry, 200); assert.equal(retry.data.id, first.data.id);
  const saved = await row(first.data.id); assert.equal(saved.payload.contactChannel, input.contactChannel); assert.equal(saved.payload.consentContact, true); assert.ok(saved.payload.consentAt);
  const notification = await pool.query("SELECT count(*)::int AS total FROM notifications WHERE related_entity_id=$1", [saved.id]); assert.equal(notification.rows[0].total, 1);
  report.ids[name] = saved.id;
  return { first, saved };
}
// Distinct documentation-range visitors isolate cases while each retry keeps the same visitor.
async function runCase(name, fn) { clientAddress = "192.0.2." + (++visitor); try { const details = await fn(); report.cases.push({ name, ...details, status: "pass" }); console.log("PASS " + name); } catch (error) { report.cases.push({ name, status: "fail", error: error.message }); console.log("FAIL " + name + ": " + error.message); } }
const counts = async () => (await pool.query("SELECT (SELECT count(*)::int FROM properties) AS properties,(SELECT count(*)::int FROM lead_requests) AS leads,(SELECT count(*)::int FROM contacts) AS contacts,(SELECT count(*)::int FROM guest_sale_requests) AS guests,(SELECT count(*)::int FROM tour_requests) AS tours,(SELECT count(*)::int FROM valuations) AS valuations")).rows[0];

async function main() {
  report.before = await counts();
  check(await api("/api/session"), 200);
  const options = await api("/api/inquiries/options"); check(options, 200);
  assert.deepEqual(options.data.channels, { email: false, whatsapp: false });
  const inventory = (await api("/api/properties")).data.properties;
  const sale = inventory.find(p => p.type === "Terreno" && p.operation === "sale");
  const rental = inventory.find(p => p.operation === "rent");
  const presale = inventory.find(p => p.catalogData?.salesModality === "presale");
  const development = inventory.find(p => p.publicationSection === "developments");
  assert.ok(sale && rental && presale && development, "Required local fixtures were not found");
  report.fixtures = [sale, rental, presale, development].map(p => ({ id: p.id, title: p.titleEs, type: p.type, operation: p.operation, zone: p.zone }));
  const mxPhone = "998555" + String(Date.now()).slice(-4);
  const usPhone = "20255501" + String(Date.now()).slice(-2);
  const caPhone = "41655501" + String(Date.now()).slice(-2);
  let generalContactId;

  await runCase("Contacto general ES: correo solo y reintento", async () => {
    const { saved } = await lead("generalEmail", body({ sourcePath: "/contacto" }));
    assert.equal(saved.phone, ""); assert.equal(saved.email, `${run}@example.test`); assert.equal(saved.source_path, "/contacto");
    generalContactId = saved.contact_id; return { id: saved.id, contactId: saved.contact_id };
  });
  await runCase("Segundo correo no se mezcla con otro contacto sin teléfono", async () => {
    const { saved } = await lead("secondEmail", body({ email: `other-${run}@example.test`, sourcePath: "/en/contact", lang: "en" }));
    assert.notEqual(saved.contact_id, generalContactId); return { id: saved.id, contactId: saved.contact_id };
  });
  await runCase("Ficha de terreno EN: WhatsApp MX, contexto canónico y reintento", async () => {
    const { saved } = await lead("landWhatsapp", body({ propertyId: sale.id, propertyTitle: "Discard this title", zone: "Discard this zone", contactChannel: "whatsapp", phone: mxPhone, country: "MX", email: "ignored-invalid", lang: "en", sourcePath: sale.urlEn || "/en/properties" }));
    assert.equal(saved.phone, "52" + mxPhone); assert.equal(saved.email, ""); assert.equal(saved.property_id, sale.id); assert.notEqual(saved.payload.propertyTitle, "Discard this title"); assert.equal(saved.payload.zone, sale.zone); assert.equal(saved.payload.country, "MX");
    return { id: saved.id, propertyId: saved.property_id, contactId: saved.contact_id };
  });
  await runCase("Ficha de renta EN: intención fija y período no inventado", async () => {
    const { saved } = await lead("rental", body({ propertyId: rental.id, intent: "rent", contactChannel: "whatsapp", phone: caPhone, country: "CA", lang: "en", rentPeriod: "month", sourcePath: rental.urlEn || "/en/properties" }));
    assert.equal(saved.payload.intent, "rent"); assert.equal(saved.property_id, rental.id); if (!rental.catalogData?.rentPeriod || rental.catalogData?.rentPeriod === "unclassified") assert.ok(!saved.payload.rentPeriod);
    return { id: saved.id, propertyId: saved.property_id, rentPeriod: saved.payload.rentPeriod || "unconfirmed" };
  });
  await runCase("Visita: consulta y tour persistidos una sola vez", async () => {
    const { saved } = await lead("visit", body({ service: "visit", propertyId: sale.id, sourcePath: sale.urlEs || "/propiedades" }));
    assert.equal(saved.payload.visitStatus, "requested");
    const tours = await pool.query("SELECT id,property_id,email,status FROM tour_requests WHERE id=$1", [saved.payload.visitId]); assert.equal(tours.rowCount, 1); assert.equal(tours.rows[0].property_id, sale.id);
    return { id: saved.id, tour: tours.rows[0] };
  });
  await runCase("Búsqueda vacía Fuera de Cancún: filtros exactos y seguimiento sin canal activo", async () => {
    const filters = { entity: "properties", operation: "sale", type: "Terreno", locations: ["fuera-de-cancun"], zone: "Cozumel", minLot: 500, currency: "USD", max: 250000, priceMode: "public-usd", priceBasis: "total" };
    const { saved } = await lead("watch", body({ service: "search-watch", searchFilters: filters, sourcePath: "/propiedades?type=Terreno&location=fuera-de-cancun&zone=Cozumel&max=250000&currency=USD" }));
    assert.equal(saved.payload.searchWatch.status, "pending_channel"); assert.equal(saved.payload.searchWatch.filters.zone, "Cozumel"); assert.equal(saved.payload.searchWatch.filters.type, "Terreno"); assert.equal(saved.payload.searchWatch.filters.max, 250000); assert.equal(saved.payload.searchWatch.filters.minLot, 500); assert.deepEqual(saved.payload.searchWatch.filters.locations, ["fuera-de-cancun"]); assert.equal(saved.payload.searchWatch.channel, "");
    const blocked = await api("/api/inquiries", body({ service: "search-watch", searchFilters: filters, alertChannel: "email", alertConsent: true })); check(blocked, 400);
    return { id: saved.id, watchStatus: saved.payload.searchWatch.status, blockedEmailStatus: blocked.status };
  });
  await runCase("Propietario publica en renta: intención let y zona Cozumel", async () => {
    const { saved } = await lead("ownerLet", body({ intent: "let", propertyType: "Casa", zone: "Cozumel", sourcePath: "/contacto?intent=let" }));
    assert.equal(saved.lead_type, "vendedor-ofrece-renta"); assert.equal(saved.payload.intent, "let"); assert.equal(saved.payload.zone, "Cozumel");
    return { id: saved.id, leadType: saved.lead_type };
  });
  await runCase("Propietario vende: intención sell y WhatsApp", async () => {
    const { saved } = await lead("ownerSell", body({ intent: "sell", propertyType: "Terreno", zone: "Cozumel", contactChannel: "whatsapp", phone: mxPhone, sourcePath: "/vender-casa-cancun" }));
    assert.equal(saved.lead_type, "vendedor-venta"); return { id: saved.id, leadType: saved.lead_type };
  });
  for (const channel of ["email", "whatsapp"]) await runCase("Publicación sin cuenta: " + channel + ", opcionales vacíos y reintento", async () => {
    const key = randomUUID();
    const input = { type: "Terreno", location: "Cozumel " + run, preferredContact: channel, email: channel === "email" ? `${run}@example.test` : "ignored-invalid", phone: channel === "whatsapp" ? usPhone : "", country: channel === "whatsapp" ? "US" : "", consent: true, lang: channel === "email" ? "es" : "en", formStartedAt: Date.now() - 3000, sourcePath: "/vender-casa-cancun" };
    const first = await api("/api/guest-sale-requests", input, { "Idempotency-Key": key }); check(first, 201);
    const retry = await api("/api/guest-sale-requests", input, { "Idempotency-Key": key }); check(retry, 200); assert.equal(retry.data.request.id, first.data.request.id);
    const saved = (await pool.query("SELECT * FROM guest_sale_requests WHERE id=$1", [first.data.request.id])).rows[0];
    assert.equal(saved.preferred_contact, channel); assert.equal(saved.title, "Terreno · Cozumel " + run); assert.equal(saved.latitude, null); assert.equal(saved.longitude, null); assert.deepEqual(saved.images, []);
    const activity = (await pool.query("SELECT new_value FROM activity_logs WHERE id=$1", ["guest-inquiry:" + saved.id])).rows[0].new_value; assert.equal(activity.contactChannel, channel); assert.equal(activity.consentContact, true);
    if (channel === "email") { assert.equal(saved.phone, ""); assert.equal(saved.contact_id, generalContactId); } else assert.equal(saved.phone, "1" + usPhone);
    assert.equal((await pool.query("SELECT count(*)::int AS total FROM notifications WHERE related_entity_id=$1", [saved.id])).rows[0].total, 1);
    report.ids["guest-" + channel] = saved.id; return { id: saved.id, contactId: saved.contact_id, preferredContact: saved.preferred_contact };
  });
  for (const review of [false, true]) await runCase(review ? "Revisión de precio USD: WhatsApp y reintento" : "Valoración: correo solo, zona y reintento", async () => {
    const input = { leadType: review ? "validar-precio" : "valuacion-inmobiliaria", zone: "Cozumel", propertyType: "Terreno", contactChannel: review ? "whatsapp" : "email", email: review ? "ignored-invalid" : `${run}@example.test`, phone: review ? usPhone : "", country: review ? "US" : "", lang: review ? "en" : "es", currency: "USD", priceMode: "public-usd", ...(review ? { ownerEstimate: "42500" } : {}), consent: true, formStartedAt: Date.now() - 3000, requestId: randomUUID(), sourcePath: review ? "/en/review-property-price" : "/valuacion-inmobiliaria-cancun" };
    const first = await api("/api/leads", input); check(first, 201); const retry = await api("/api/leads", input); check(retry, 200); assert.equal(retry.data.lead.id, first.data.lead.id);
    const saved = await row(first.data.lead.id); assert.equal(saved.payload.contactChannel, input.contactChannel); assert.equal(saved.payload.consentContact, true);
    const valuations = await pool.query("SELECT id,request_id,contact_id,zone,expected_price,expected_currency FROM valuations WHERE request_id=$1", [saved.id]); assert.equal(valuations.rowCount, 1);
    assert.equal(Number(valuations.rows[0].expected_price) || null, review ? 42500 : null); assert.equal(valuations.rows[0].expected_currency, review ? "USD" : null);
    report.ids[review ? "priceReview" : "valuation"] = saved.id; return { id: saved.id, valuation: valuations.rows[0] };
  });
  await runCase("Preventa heredada: compra permitida; renta y propietarios rechazados", async () => {
    for (const intent of ["rent", "sell", "let"]) check(await api("/api/inquiries", body({ propertyId: presale.id, intent })), 400);
    const { saved } = await lead("presale", body({ propertyId: presale.id, intent: "buy", sourcePath: "/preventas-cancun" }));
    assert.equal(saved.payload.intent, "buy"); assert.equal(saved.property_id, presale.id); return { id: saved.id, propertyId: saved.property_id };
  });
  await runCase("Desarrollo: ID distinto de propiedad y seguimiento contextual", async () => {
    const { saved } = await lead("development", body({ developmentId: development.id, sourcePath: development.urlEs || "/propiedades?entity=developments" }));
    assert.equal(saved.property_id, null); assert.equal(saved.payload.developmentId, development.id); return { id: saved.id, developmentId: saved.payload.developmentId };
  });
  await runCase("Seguimiento administrativo lee las solicitudes guardadas", async () => {
    const auth = await api("/api/auth/login", { username: process.env.PCC_QA_ADMIN, password: process.env.PCC_QA_PASSWORD }); check(auth, 200);
    const guests = await api("/api/admin/guest-sale-requests"); check(guests, 200);
    const valuations = await api("/api/admin/valuations"); check(valuations, 200);
    const leads = await api("/api/admin/leads"); check(leads, 200);
    assert.ok(guests.data.requests.some(row => row.id === report.ids["guest-email"]));
    assert.ok(valuations.data.valuations.some(row => row.requestId === report.ids.valuation));
    assert.ok(leads.data.leads.some(row => row.id === report.ids.generalEmail));
    return { guestVisible: true, valuationVisible: true, inquiryVisible: true };
  });
  report.after = await counts(); assert.equal(report.before.properties, report.after.properties, "QA must not change inventory");
}

main().catch(error => { report.fatal = error.stack; console.error(error.message); process.exitCode = 1; }).finally(async () => {
  report.summary = { passed: report.cases.filter(row => row.status === "pass").length, failed: report.cases.filter(row => row.status === "fail").length };
  if (report.summary.failed) process.exitCode = 1;
  const output = path.resolve(__dirname, "../outputs/qa-20261115/local-inquiries-persistence.json"); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ report: output, summary: report.summary, fatal: Boolean(report.fatal) })); await pool.end();
});
