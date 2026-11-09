"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), crypto = require("node:crypto"), sharp = require("sharp");
const base = process.env.PCC_TEST_BASE;
test("commercial inquiries, requested visits, follow-up and matching persist in isolated PostgreSQL", { skip: !base }, async () => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
  let cookie = "", csrf = "";
  const api = async (path, method = "GET", body, expected = 200) => {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie, "X-CSRF-Token": csrf }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const cookies = response.headers.getSetCookie(); if (cookies.length) cookie = cookies[0].split(";")[0];
    const data = await response.json(); assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
    if (data.csrfToken) csrf = data.csrfToken; return data;
  };
  await api("/api/session"); await api("/api/auth/login", "POST", { username: process.env.PCC_TEST_ADMIN || "qa-admin", password: process.env.PCC_TEST_PASSWORD || "qa-admin-password-only-local" });
  const suffix = Date.now(), records = [], leads = [];
  const photo = `data:image/webp;base64,${(await sharp({ create: { width: 30, height: 30, channels: 3, background: "#aabbcc" } }).webp().toBuffer()).toString("base64")}`;
  const common = { state: "Quintana Roo", city: "Cancún", zone: "Puerto Cancún", status: "active", isPublic: true, images: [photo] };
  const create = async body => { const result = (await api("/api/admin/properties", "POST", { ...common, ...body }, 201)).property; records.push(result); return result; };
  const inquire = async (body, expected = 201) => { const result = await api("/api/inquiries", "POST", { intent: "buy", phone: "+529981234567", country: "MX", consent: true, name: "QA Comercial " + suffix, requestId: crypto.randomUUID(), formStartedAt: Date.now() - 2000, sourcePath: "/propiedades?qa=" + suffix, ...body }, expected); if (result.id && !leads.includes(result.id)) leads.push(result.id); return result; };
  try {
    const master = await create({ title: `QA Comercial proyecto ${suffix}`, publicationSection: "developments", type: "Desarrollo" });
    const rental = await create({ title: `QA Comercial unidad ${suffix}`, publicationSection: "properties", type: "Departamento", operation: "rent", currency: "USD", price: 2000, priceUnit: "total", developmentId: master.developmentData.id, catalogData: { rentPeriod: "month" } });
    const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) + "T14:30";
    const visitBody = { propertyId: rental.id, developmentId: master.id, intent: "rent", rentPeriod: "month", propertyType: "Departamento", service: "visit", visitPreferredAt: future, budget: 2500, currency: "USD", preferences: "Mascota por confirmar", requestId: crypto.randomUUID() };
    const visit = await inquire(visitBody); assert.equal(visit.visitStatus, "requested");
    assert.match(decodeURIComponent(new URL(visit.whatsappUrl).searchParams.get("text")), /14:30/);
    assert.equal((await inquire(visitBody, 200)).id, visit.id, "Visit retry stays idempotent");
    const saved = (await api("/api/admin/commercial")).leads.find(lead => lead.id === visit.id);
    assert.equal(saved.payload.developmentId, master.id); assert.equal(saved.payload.commercialStage, "visit_requested");
    const tour = (await api("/api/admin/tours")).tours.find(t => t.id === saved.payload.visitId);
    assert.equal(tour.status, "requested"); assert.equal(tour.property_id, rental.id);
    await api(`/api/admin/commercial/${visit.id}`, "PATCH", { stage: "visit_confirmed", assignedTo: "admin-prueba", note: "Horario acordado en QA" });
    assert.equal((await api("/api/admin/tours")).tours.find(t => t.id === saved.payload.visitId).status, "confirmed");
    assert.ok((await api(`/api/admin/commercial/${visit.id}/history`)).history.some(h => h.new_value.note === "Horario acordado en QA"));
    await api(`/api/admin/tours/${saved.payload.visitId}`, "PATCH", { status: "completed" });
    assert.equal((await api("/api/admin/commercial")).leads.find(lead => lead.id === visit.id).payload.commercialStage, "visit_completed", "The existing agenda and commercial follow-up share visit state");
    assert.ok((await api(`/api/admin/commercial/${visit.id}/history`)).history.some(h => h.new_value.visitStatus === "completed"));
    await inquire({ ...visitBody, visitPreferredAt: "2020-01-01T10:00", requestId: crypto.randomUUID() }, 400);
    await inquire({ phone: "123", propertyId: rental.id }, 400);
    const channels = (await api("/api/inquiries/options")).channels;
    assert.ok(!channels.email && !channels.whatsapp, "QA must not send external alerts");
    const watch = await inquire({ intent: "rent", service: "search-watch", searchFilters: { entity: "properties", operation: "rent", type: "Departamento", max: 1, currency: "USD", priceBasis: "total", priceBasisExplicit: true, rentPeriod: "month" } });
    assert.equal(watch.searchWatchStatus, "pending_channel");
    const buyer = await inquire({ intent: "rent", developmentId: master.id, propertyType: "Departamento", budget: 2500, currency: "USD", rentPeriod: "month" });
    const owner = await inquire({ intent: "let", developmentId: master.id, propertyType: "Departamento", askingPrice: 2400, currency: "USD", rentPeriod: "month" });
    const tooExpensive = await inquire({ intent: "let", developmentId: master.id, propertyType: "Departamento", askingPrice: 3000, currency: "USD", rentPeriod: "month" });
    const daily = await inquire({ intent: "let", developmentId: master.id, propertyType: "Departamento", askingPrice: 200, currency: "USD", rentPeriod: "day" });
    const dashboard = await api("/api/admin/commercial"); const matched = dashboard.leads.find(lead => lead.id === buyer.id);
    assert.ok(matched.owners.some(o => o.id === owner.id)); assert.ok(!matched.owners.some(o => [tooExpensive.id, daily.id].includes(o.id)));
    assert.ok(matched.inventory.matches.some(p => p.id === rental.id));
    assert.ok(matched.relatedInquiries.includes(owner.id), "Same contact keeps distinct inquiries");
    await api(`/api/admin/commercial/${owner.id}`, "PATCH", { stage: "captured", note: "Encargo recibido QA" });
    await api(`/api/admin/commercial/${owner.id}`, "PATCH", { stage: "closed_won", note: "Contrato completado QA" });
    const metrics = (await api("/api/admin/commercial")).metrics;
    assert.ok(metrics.captured >= 1 && metrics.closed >= 1 && metrics.confirmed >= 1);
  } finally {
    for (const id of leads) await api(`/api/admin/leads/${id}`, "DELETE");
    for (const record of records.reverse()) await api(`/api/admin/properties/${record.id}`, "DELETE");
  }
});
