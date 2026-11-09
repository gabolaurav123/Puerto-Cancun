"use strict";

const crypto = require("node:crypto");
const inventory = require("./inventory-contract");
const { savedCatalogQuery } = require("./saved-catalog-search");
const { propertyPath } = require("./seo-pages");
const stages = ["new", "contacted", "qualified", "visit_requested", "visit_confirmed", "visit_completed", "captured", "closed_won", "closed_lost"];
const clean = (v, n = 1200) => typeof v === "string" ? v.trim().slice(0, n) : "";
const fold = v => inventory.fold(clean(v));
function bad(message) { throw Object.assign(new Error(message), { status: 400 }); }
function visitPreference(value, now = Date.now()) {
  const text = clean(value, 40);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(text)) bad("Elige fecha y hora preferidas para la visita (hora de Cancún).");
  const date = new Date(text + ":00-05:00");
  if (!Number.isFinite(+date) || +date <= now || +date > now + 366 * 86400000 || new Date(+date - 5 * 3600000).toISOString().slice(0, 16) !== text) bad("Elige una fecha futura válida, dentro del próximo año (hora de Cancún).");
  return text;
}

async function enrichCommercialInquiry(body, data, properties, channels, areas = inventory.LOCATIONS) {
  if (body.service === "visit") {
    if (!body.propertyId) bad("Selecciona la propiedad o el desarrollo que deseas visitar.");
    if (!properties.some(property => property.id === body.propertyId && inventory.isPublic(property))) bad("La publicación ya no está disponible. Consulta al equipo antes de solicitar una visita.");
    data.service = "visit";
    data.visitPreferredAt = visitPreference(body.visitPreferredAt);
    data.visitTimezone = "America/Cancun";
    data.commercialStage = "visit_requested";
    data.visitStatus = "requested";
  }
  if (body.developmentId) {
    const dev = properties.find(p => p.publicationSection === "developments" && [p.id, p.developmentData?.id].includes(body.developmentId));
    if (!dev) bad("El desarrollo seleccionado ya no está publicado. Revisa la selección antes de guardar.");
    data.developmentId = dev.id;
    data.development = data.lang === "en" ? dev.titleEn || dev.titleEs : dev.titleEs;
  }
  if (body.rentPeriod) {
    if (!["day", "month", "year"].includes(body.rentPeriod)) bad("Selecciona un periodo de renta válido.");
    data.rentPeriod = body.rentPeriod;
  }
  if (["sell", "let"].includes(data.intent) && body.askingPrice !== "" && body.askingPrice !== undefined) {
    const price = Number(body.askingPrice);
    if (!(price > 0 && price <= 1e13) || !["USD", "MXN"].includes(body.currency)) bad("Indica el precio solicitado y su moneda.");
    data.askingPrice = price; data.currency = body.currency;
  }
  if (body.service === "search-watch") {
    if (!["buy", "rent"].includes(data.intent)) bad("Las búsquedas guardadas corresponden a compra o renta.");
    const filters = savedCatalogQuery(body.searchFilters || {}, { properties, language: data.lang, areas });
    if (filters.errors.length) bad(filters.errors.join(" "));
    const { errors, ...criteria } = filters;
    // Free-form preferences remain visible to advisors and cannot be certified by numeric filters.
    const needsReview = Boolean(clean(data.preferences));
    const channel = ["email", "whatsapp"].includes(body.alertChannel) ? body.alertChannel : "";
    if (channel && !channels[channel]) bad("Ese canal no está disponible ahora. Guarda la búsqueda para que un asesor la revise.");
    if (channel && body.alertConsent !== true) bad("Autoriza los avisos para activar este canal.");
    const email = clean(body.alertEmail, 254).toLowerCase();
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad("Escribe un correo válido para recibir los avisos.");
    const result = inventory.queryInventory(properties, criteria, { areas });
    if (result.errors.length) bad(result.errors.join(" "));
    data.service = "search-watch";
    data.searchWatch = { filters: criteria, preferences: data.preferences || "", channel, email: channel === "email" ? email : "", consentAt: channel ? new Date().toISOString() : null,
      status: channel && !needsReview ? "active" : needsReview ? "needs_review" : "pending_channel", knownPropertyIds: result.all.map(p => p.id), deliveries: {}, subscribedAt: new Date().toISOString() };
  }
  return data;
}

function matchingListings(lead, properties, areas = inventory.LOCATIONS) {
  const p = lead.payload || {};
  if (!["buy", "rent"].includes(p.intent)) return { matches: [], pending: [] };
  let criteria;
  if (p.searchWatch) criteria = savedCatalogQuery(p.searchWatch.filters, { properties, language: p.lang, areas });
  else if (p.searchFilters) criteria = savedCatalogQuery(p.searchFilters, { properties, language: p.lang, areas });
  else {
    const raw = { entity: "properties", operation: p.intent === "rent" ? "rent" : "sale", type: p.propertyType || "" };
    const zoneId = inventory.locationId(p.zone, areas);
    if (zoneId) raw.locations = [zoneId];
    else raw.zone = p.zone || "";
    if (p.developmentId || p.development) {
      const developments = properties.filter(row => inventory.entityOf(row) === "developments" && (p.developmentId ? [row.id, row.developmentData?.id].includes(p.developmentId) : [row.titleEs, row.titleEn].some(name => fold(name) && fold(name) === fold(p.development))));
      if (developments.length !== 1) return { matches: [], pending: ["Confirmar el desarrollo de interés antes de relacionar propiedades"] };
      const development = developments[0], references = [development.id, development.developmentData?.id].filter(Boolean);
      properties = properties.filter(row => [row.portalDevelopmentId, row.developmentId, row.development_id, row.parent_development_id, row.parentDevelopment?.id, row.parentDevelopment?.propertyId].some(id => references.includes(id)));
    }
    if (p.budget) Object.assign(raw, { max: p.budget, currency: p.currency, priceBasis: "total", priceBasisExplicit: true });
    if (p.rentPeriod) raw.rentPeriod = p.rentPeriod;
    criteria = savedCatalogQuery(raw, { properties, language: p.lang, areas });
  }
  if (criteria.errors.length) return { matches: [], pending: criteria.errors };
  const result = inventory.queryInventory(properties, criteria, { areas });
  return { matches: result.all.slice(0, 30).map(row => ({ id: row.id, title: row.titleEs, url: propertyPath(row, "es"), price: inventory.priceOf(row) })), pending: p.preferences ? ["Confirmar preferencias con el asesor: " + p.preferences] : [] };
}

function ownerMatches(buyer, owners) {
  const b = buyer.payload || {};
  if (!["buy", "rent"].includes(b.intent)) return [];
  const finished = lead => ["closed_won", "closed_lost"].includes(lead.payload?.commercialStage) || ["closed", "rejected", "archived", "cancelled"].includes(lead.status);
  if (finished(buyer)) return [];
  return owners.filter(owner => owner.id !== buyer.id).flatMap(owner => {
    const o = owner.payload || {};
    if (finished(owner)) return [];
    if (o.intent !== (b.intent === "buy" ? "sell" : "let")) return [];
    const sameDevelopment = b.developmentId && o.developmentId ? b.developmentId === o.developmentId : fold(b.development) && fold(b.development) === fold(o.development);
    if (!sameDevelopment || (b.propertyType && o.propertyType && b.propertyType !== o.propertyType)) return [];
    const pending = [];
    if (!b.propertyType || !o.propertyType) pending.push("Tipo de inmueble por confirmar");
    if (b.budget && o.askingPrice && b.currency === o.currency) { if (o.askingPrice > b.budget) return []; }
    else pending.push("Presupuesto o moneda por confirmar");
    if (b.intent === "rent") {
      if (b.rentPeriod && o.rentPeriod && b.rentPeriod !== o.rentPeriod) return [];
      if (!b.rentPeriod || !o.rentPeriod) pending.push("Periodo de renta por confirmar");
    }
    if (b.preferences) pending.push("Preferencias del comprador por confirmar");
    return [{ id: owner.id, name: owner.name, propertyType: o.propertyType, askingPrice: o.askingPrice, currency: o.currency, pending }];
  });
}

function unsubscribeToken(id, secret) { return crypto.createHmac("sha256", secret).update("search-watch:" + id).digest("hex"); }
function registerCommercialRoutes(app, deps) {
  const { pool, query, requireRole, getPublicProperties, uuid, siteUrl, secret, channels, sendEmail, sendWhatsapp } = deps;
  const getAreas = () => deps.getAreas?.() || inventory.LOCATIONS;
  app.get("/api/search-watch/channels", (_req, res) => res.json({ channels: channels() }));
  app.get("/avisos/cancelar", (req, res) => {
    const id = clean(req.query.id, 100), token = clean(req.query.token, 64);
    if (token !== unsubscribeToken(id, secret)) return res.status(400).send("Enlace no válido / Invalid link");
    // GET is deliberately read-only: mail scanners must not revoke consent.
    return res.type("html").send(`<meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelar avisos / Stop alerts</title><main style="max-width:36rem;margin:4rem auto;font:18px system-ui;padding:1rem"><h1>Cancelar avisos / Stop alerts</h1><p>Puedes detener los avisos de esta búsqueda. / You can stop alerts for this search.</p><form data-unsubscribe method="post" action="/api/search-watch/unsubscribe"><input type="hidden" name="id" value="${id.replace(/[^a-zA-Z0-9-]/g, "")}"><input type="hidden" name="token" value="${token}"><button style="padding:1rem">Confirmar / Confirm</button></form><p role="status"></p></main><script src="/search-watch-unsubscribe.js"></script>`);
  });
  app.post("/api/search-watch/unsubscribe", async (req, res, next) => {
    try {
      const id = clean(req.body?.id, 100), token = clean(req.body?.token, 64);
      if (token !== unsubscribeToken(id, secret)) return res.status(400).send("Enlace no válido / Invalid link");
      await query(`UPDATE lead_requests SET payload=jsonb_set(payload,'{searchWatch,status}','"cancelled"'::jsonb),updated_at=NOW() WHERE id=$1 AND payload ? 'searchWatch'`, [id]);
      res.send("Avisos cancelados. / Alerts cancelled.");
    } catch (error) { next(error); }
  });
  app.get("/api/admin/commercial", requireRole("admin"), async (req, res, next) => {
    try {
      const [leads, users, properties, counts, tours] = await Promise.all([
        query("SELECT * FROM lead_requests ORDER BY updated_at DESC LIMIT 1000"),
        query("SELECT id,name FROM internal_users WHERE status='active' ORDER BY name"),
        getPublicProperties(),
        query(`SELECT count(*)::int AS inquiries,count(DISTINCT COALESCE(contact_id,NULLIF(phone,''),id))::int AS contacts,
          count(*) FILTER (WHERE payload->'commercialMilestones' ? 'captured')::int AS captured,
          count(*) FILTER (WHERE payload->'commercialMilestones' ? 'closed_won')::int AS closed,
          count(*) FILTER (WHERE payload ? 'searchWatch')::int AS searches FROM lead_requests`),
        query("SELECT count(*)::int AS requested,count(*) FILTER(WHERE status IN ('confirmed','completed'))::int AS confirmed,count(*) FILTER(WHERE status='completed')::int AS completed,count(DISTINCT NULLIF(regexp_replace(regexp_replace(phone,'[^0-9]','','g'),'^521([0-9]{10})$','52\\1'),''))::int AS \"visitingContacts\" FROM tour_requests")
      ]);
      const phones = new Map();
      for (const lead of leads.rows) {
        const phone = String(lead.phone || "").replace(/\D/g, "").replace(/^521(?=\d{10}$)/, "52");
        const key = phone || lead.contact_id || lead.id;
        if (!phones.has(key)) phones.set(key, []);
        phones.get(key).push(lead.id);
        lead.identityKey = key;
      }
      res.json({ metrics: { ...counts.rows[0], ...tours.rows[0] }, users: [{ id: 'admin-prueba', name: 'Administración' }, ...users.rows], channels: channels(), limit: 1000,
        leads: leads.rows.map(lead => ({ id: lead.id, name: lead.name, phone: lead.phone, status: lead.status, assignedTo: lead.assigned_to || "", notes: lead.internal_notes || "", propertyId: lead.property_id, source: lead.source_path, createdAt: lead.created_at, updatedAt: lead.updated_at, payload: lead.payload, relatedInquiries: phones.get(lead.identityKey).filter(id => id !== lead.id), inventory: matchingListings(lead, properties, getAreas()), owners: ownerMatches(lead, leads.rows) })) });
    } catch (error) { next(error); }
  });
  app.get("/api/admin/commercial/:id/history", requireRole("admin"), async (req, res, next) => {
    try {
      const result = await query("SELECT a.action,a.old_value,a.new_value,a.created_at,u.name AS author FROM activity_logs a LEFT JOIN internal_users u ON u.id=a.user_id WHERE a.entity_type='lead_request' AND a.entity_id=$1 ORDER BY a.created_at DESC LIMIT 100", [req.params.id]);
      res.json({ history: result.rows });
    } catch (error) { next(error); }
  });
  app.patch("/api/admin/commercial/:id", requireRole("admin"), async (req, res, next) => {
    let client;
    try {
      client = await pool.connect(); await client.query("BEGIN");
      const lead = (await client.query("SELECT * FROM lead_requests WHERE id=$1 FOR UPDATE", [req.params.id])).rows[0];
      if (!lead) return await client.query("ROLLBACK").then(() => res.status(404).json({ error: "Solicitud no encontrada." }));
      const data = { ...lead.payload }, body = req.body || {};
      if (body.stage !== undefined) {
        if (!stages.includes(body.stage)) bad("Etapa comercial no válida.");
        if (body.stage === "captured" && !["sell", "let"].includes(data.intent)) bad("La captación corresponde a una oferta de propietario.");
        if (["captured", "closed_won"].includes(body.stage) && !clean(body.note)) bad("Describe la captación o el cierre para dejar constancia.");
        if (body.stage.startsWith("visit_") && !data.visitId) bad("Esta solicitud no tiene una visita registrada.");
        data.commercialStage = body.stage;
        data.commercialMilestones = { ...data.commercialMilestones, [body.stage]: new Date().toISOString() };
        if (body.stage.startsWith("visit_")) {
          const status = { visit_requested: "requested", visit_confirmed: "confirmed", visit_completed: "completed" }[body.stage];
          data.visitStatus = status;
          await client.query("UPDATE tour_requests SET status=$2,updated_at=NOW() WHERE id=$1", [data.visitId, status]);
        }
      }
      let assignedTo = lead.assigned_to;
      if (body.assignedTo !== undefined) {
        assignedTo = clean(body.assignedTo, 140) || null;
        if (assignedTo && assignedTo !== 'admin-prueba' && !(await client.query("SELECT id FROM internal_users WHERE id=$1 AND status='active'", [assignedTo])).rowCount) bad("Selecciona un responsable válido.");
      }
      if (body.pauseAlerts === true && data.searchWatch) data.searchWatch = { ...data.searchWatch, status: "cancelled" };
      const note = clean(body.note, 4000);
      const notes = note ? [lead.internal_notes, new Date().toISOString() + " — " + note].filter(Boolean).join("\n") : lead.internal_notes;
      await client.query("UPDATE lead_requests SET payload=$2::jsonb,assigned_to=$3,internal_notes=$4,updated_at=NOW() WHERE id=$1", [lead.id, JSON.stringify(data), assignedTo, notes]);
      await client.query("INSERT INTO activity_logs(id,user_id,action,entity_type,entity_id,old_value,new_value) VALUES($1,$2,'commercial_followup','lead_request',$3,$4::jsonb,$5::jsonb)", [uuid("log"), req.session.user.id, lead.id, JSON.stringify({ stage: lead.payload?.commercialStage || "new", assignedTo: lead.assigned_to }), JSON.stringify({ stage: data.commercialStage || "new", assignedTo, note, alertStatus: data.searchWatch?.status })]);
      await client.query("COMMIT"); res.json({ ok: true });
    } catch (error) { if (client) await client.query("ROLLBACK"); if (error.status === 400) res.status(400).json({ error: error.message }); else next(error); }
    finally { client?.release(); }
  });

  let running = false;
  async function evaluateWatches() {
    if (running || !Object.values(channels()).some(Boolean)) return;
    running = true;
    let client;
    try {
      client = await pool.connect();
      const locked = (await client.query("SELECT pg_try_advisory_lock(hashtext('pcc-guest-search-alerts')) AS locked")).rows[0]?.locked;
      if (!locked) return;
      const properties = await getPublicProperties();
      const leads = await client.query("SELECT id,phone,payload FROM lead_requests WHERE payload->'searchWatch'->>'status'='active' ORDER BY created_at");
      for (const lead of leads.rows) {
        const watch = lead.payload.searchWatch;
        if (!watch.consentAt || !channels()[watch.channel] || watch.preferences) continue;
        const criteria = savedCatalogQuery(watch.filters, { properties, areas: getAreas() });
        if (criteria.errors.length) continue;
        const result = inventory.queryInventory(properties, criteria, { areas: getAreas() });
        const newMatches = result.all.filter(p => !watch.knownPropertyIds?.includes(p.id) && !watch.deliveries?.[p.id]);
        if (!newMatches.length) continue;
        const en = lead.payload.lang === "en";
        const cancelUrl = new URL("/avisos/cancelar", siteUrl); cancelUrl.searchParams.set("id", lead.id); cancelUrl.searchParams.set("token", unsubscribeToken(lead.id, secret));
        const selected = newMatches.slice(0, 5);
        const message = [en ? "New listings match your saved search:" : "Nuevas publicaciones compatibles con tu búsqueda:", ...selected.map(p => `${en ? p.titleEn || p.titleEs : p.titleEs}\n${new URL(propertyPath(p, en ? "en" : "es"), siteUrl).href}`), en ? "Confirm availability with our team." : "Confirma disponibilidad con el equipo.", (en ? "Stop alerts: " : "Cancelar avisos: ") + cancelUrl.href].join("\n\n");
        // Mark before transport. An ambiguous timeout is held for review, never blindly resent.
        const deliveries = { ...watch.deliveries };
        for (const p of selected) deliveries[p.id] = { status: "sending", at: new Date().toISOString() };
        const claimed = await client.query("UPDATE lead_requests SET payload=jsonb_set(payload,'{searchWatch,deliveries}',$2::jsonb) WHERE id=$1 AND payload->'searchWatch'->>'status'='active'", [lead.id, JSON.stringify(deliveries)]);
        if (!claimed.rowCount) continue;
        try {
          if (watch.channel === "email") await sendEmail({ to: watch.email, subject: en ? "New listings for your search" : "Nuevas propiedades para tu búsqueda", html: "<p>" + message.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])).replace(/\n/g, "<br>") + "</p>" });
          else await sendWhatsapp(lead.phone, message);
          for (const p of selected) deliveries[p.id].status = "sent";
        } catch { for (const p of selected) deliveries[p.id].status = "needs_review"; }
        await client.query("UPDATE lead_requests SET payload=jsonb_set(payload,'{searchWatch,deliveries}',$2::jsonb) WHERE id=$1", [lead.id, JSON.stringify(deliveries)]);
      }
    } finally {
      if (client) { await client.query("SELECT pg_advisory_unlock(hashtext('pcc-guest-search-alerts'))").catch(() => {}); client.release(); }
      running = false;
    }
  }
  return { evaluateWatches };
}

module.exports = { stages, visitPreference, enrichCommercialInquiry, matchingListings, ownerMatches, registerCommercialRoutes, unsubscribeToken };
