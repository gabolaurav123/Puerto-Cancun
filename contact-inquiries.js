"use strict";

const crypto = require("node:crypto");
const { getCountries, getCountryCallingCode, parsePhoneNumberFromString } = require("libphonenumber-js/max");
const { contacts } = require("./contact-config");
const { propertyPath } = require("./seo-pages");

const countries = getCountries().map(country => ({ country, prefix: "+" + getCountryCallingCode(country) }));
const intentTypes = { buy: "comprador-compra", rent: "comprador-busca-renta", sell: "vendedor-venta", let: "vendedor-ofrece-renta" };
const intentPhrases = {
  en: { buy: "I would like to buy", rent: "I am looking to rent", sell: "I would like to sell", let: "I would like to offer for rent" },
  es: { buy: "Me interesa comprar", rent: "Busco alquilar", sell: "Quiero vender", let: "Quiero poner en renta" },
};
const routingDefaults = { mx: contacts[0].number, us: contacts[1].number, rule: "country", fallback: "mx", featuredCountry: "ES" };
const clean = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";
function fail(es, en, lang) { throw Object.assign(new Error(lang === "en" ? en : es), { status: 400 }); }

function contactRouting(input, validate = false, oldMx = "") {
  const legacy = String(oldMx || "").replace(/[\s()+.-]/g, "");
  const settings = { ...routingDefaults, mx: /^[1-9]\d{6,14}$/.test(legacy) ? legacy : routingDefaults.mx, ...input };
  settings.featuredCountry = String(settings.featuredCountry || "").trim().toUpperCase();
  for (const key of ["mx", "us"]) {
    settings[key] = String(settings[key] ?? "").replace(/[\s()+.-]/g, "");
    if (settings[key] && !/^[1-9]\d{6,14}$/.test(settings[key])) {
      if (validate) fail("Revisa el número comercial y su prefijo internacional.", "", "es");
      settings[key] = routingDefaults[key];
    }
  }
  if (!["country", "mx", "us"].includes(settings.rule) || !["mx", "us"].includes(settings.fallback)
      || !countries.some(c => c.country === settings.featuredCountry) || (!settings.mx && !settings.us)) {
    if (validate) fail("Selecciona una regla, un respaldo, un país válido y al menos un número comercial.", "", "es");
    return { ...routingDefaults };
  }
  return Object.fromEntries(Object.keys(routingDefaults).map(k => [k, settings[k]]));
}

async function readContactRouting(db) {
  const result = await db.query("SELECT key, value FROM app_settings WHERE key IN ('contact_routing','site')");
  const stored = Object.fromEntries(result.rows.map(row => [row.key, row.value]));
  return contactRouting(stored.contact_routing, false, stored.site?.whatsapp);
}

function contactPhone(raw, country, lang) {
  const selected = countries.find(c => c.country === country);
  const number = clean(raw, 64);
  const parsed = selected && /^[+\d\s().-]+$/.test(number) && parsePhoneNumberFromString(number, { defaultCountry: country, extract: false });
  if (!parsed || !parsed.isValid() || "+" + parsed.countryCallingCode !== selected.prefix) {
    fail("Revisa el teléfono y el país al que pertenece.", "Check the phone number and the country it belongs to.", lang);
  }
  return { phone: parsed.number.slice(1), country, prefix: selected.prefix };
}

function sourcePath(input) {
  const path = clean(input, 1000);
  if (!path.startsWith("/") || /^\/[/\\]|\\|[\x00-\x1f]/.test(path)) return "/";
  const parsed = new URL(path, "https://example.invalid");
  if (/^\/(?:api|panel|admin|seller|media|compartir|share)(?:\/|$)/.test(parsed.pathname)) return "/";
  const query = new URLSearchParams();
  for (const [key, value] of parsed.searchParams) {
    if (/^(q|type|zone|location|development|subzone|entity|operation|currency|budget|minPrice|maxPrice|sort|view|page|beds|category|intent)$/.test(key)) query.set(key, value.slice(0, 140));
  }
  return parsed.pathname + (query.size ? "?" + query : "");
}

function readInquiry(body) {
  const lang = body.lang === "en" ? "en" : "es";
  if (!Object.hasOwn(intentTypes, body.intent)) fail("Selecciona qué necesitas.", "Choose what you need.", lang);
  if (body.consent !== true) fail("Acepta el aviso de privacidad para enviar tu solicitud.", "Accept the privacy notice to send your request.", lang);
  const elapsed = Date.now() - Number(body.formStartedAt || 0);
  if (!(elapsed >= 1000 && elapsed <= 7200000)) fail("Vuelve a abrir el formulario e intenta nuevamente.", "Reopen the form and try again.", lang);
  const phone = contactPhone(body.phone, body.country, lang);
  const data = { lang, intent: body.intent, country: phone.country, prefix: phone.prefix };
  const limits = { propertyType: 100, zone: 160, subzone: 160, development: 240, propertyTitle: 240, mls: 90, project: 240, reference: 140, preferences: 1200, area: 100, features: 400, origin: 120 };
  Object.assign(limits, { viewedPropertyId: 140, viewedPropertyTitle: 240, viewedMls: 90, viewedProject: 240, viewedReference: 140, viewedZone: 160, viewedDevelopment: 240 });
  for (const [key, limit] of Object.entries(limits)) {
    const value = clean(body[key], limit);
    if (value) data[key] = value;
  }
  if (body.budget !== undefined && body.budget !== "") {
    const value = Number(body.budget);
    if (!(value > 0 && Number.isFinite(value) && value <= 1e13 && ["USD", "MXN"].includes(body.currency))) {
      fail("Indica un presupuesto válido y su moneda.", "Enter a valid budget and its currency.", lang);
    }
    data.budget = value;
    data.currency = body.currency;
  }
  return { phone: phone.phone, name: clean(body.name, 110), propertyId: clean(body.propertyId, 140), path: sourcePath(body.sourcePath), data };
}

function messageFor(data, url) {
  const en = data.lang === "en";
  const propertyTypes = en ? { Casa: "a house", Departamento: "an apartment", Terreno: "land", Comercial: "commercial property", Oficina: "an office", Bodega: "a warehouse" }
    : { Casa: "una casa", Departamento: "un departamento", Terreno: "un terreno", Comercial: "un local comercial", Oficina: "una oficina", Bodega: "una bodega" };
  const what = propertyTypes[data.propertyType] || data.propertyType || (en ? "a property" : "una propiedad");
  let introduction = intentPhrases[data.lang][data.intent] + " " + what + ".";
  if (data.service === "valuation") introduction = en ? "I would like a property valuation." : "Quiero solicitar una valoración inmobiliaria.";
  if (data.service === "price-review") introduction = en ? "I would like an advisor to review my estimated price." : "Quiero revisar mi precio estimado con un asesor.";
  const text = [(en ? "Hello. " : "Hola. ") + introduction];
  for (const [value, es, english] of [
    [data.propertyTitle, "Propiedad", "Listing"], [data.mls, "MLS", "MLS"], [data.project, "Preventa", "Presale"],
    [data.reference, "Referencia del proyecto", "Project reference"], [data.development, "Desarrollo", "Development"],
    [data.zone, "Zona", "Area"], [data.subzone, "Subzona", "Subarea"], [data.area, "Superficie aproximada", "Approximate area"],
    [data.features, "Características", "Features"], [data.preferences, "Preferencias", "Preferences"],
  ]) if (value) text.push((en ? english : es) + ": " + value);
  if (data.budget) text.push((en ? "Budget: " : "Presupuesto: ") + new Intl.NumberFormat(en ? "en-US" : "es-MX").format(data.budget) + " " + data.currency);
  if (data.ownerEstimate) text.push((en ? "My estimate: " : "Mi estimación: ") + String(data.ownerEstimate) + (data.currency ? " " + data.currency : ""));
  text.push((en ? "I saw this on Puerto Cancún Center: " : "Lo vi en Puerto Cancún Center: ") + url);
  text.push("Ref. PCC-" + data.whatsappRef);
  return text.join("\n");
}

function destination(routing, country) {
  const primary = routing.rule === "country" ? (["US", "CA"].includes(country) ? "us" : "mx") : routing.rule;
  return routing[primary] || routing[routing.fallback] || routing.mx || routing.us;
}

function businessPhoneLabel(number) {
  const known = contacts.find(item => item.number === number);
  if (known) return known.display;
  return parsePhoneNumberFromString("+" + number)?.formatInternational() || "+" + number;
}

function inquiryAction(id, data, siteUrl, path, secret) {
  if (!data?.whatsappRef || !data.destination) return null;
  const clickToken = crypto.createHmac("sha256", secret).update("inquiry-click:" + id).digest("hex");
  const url = new URL(data.listingPath || sourcePath(path), siteUrl).href;
  return { id, clickToken, whatsappUrl: "https://wa.me/" + data.destination + "?text=" + encodeURIComponent(messageFor(data, url)) };
}

async function serviceChannel(db, country) {
  return { whatsappRef: crypto.randomBytes(8).toString("hex"), destination: destination(await readContactRouting(db), country) };
}

function registerInquiries(app, { pool, query, uuid, siteUrl, secret, upsertContact, leadScoreFromData }) {
  const clickToken = id => crypto.createHmac("sha256", secret).update("inquiry-click:" + id).digest("hex");
  app.get("/api/inquiries/options", async (_req, res, next) => {
    try { res.json({ countries, featuredCountry: (await readContactRouting({ query })).featuredCountry }); } catch (err) { next(err); }
  });
  app.post("/api/inquiries", async (req, res, next) => {
    let client;
    try {
      const body = req.body || {};
      if (body.website) return res.status(201).json({ ok: true });
      const { phone, name, propertyId, path, data } = readInquiry(body);
      client = await pool.connect();
      await client.query("BEGIN");
      // Serialize simultaneous submissions from the same phone, including different interests.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["pcc-inquiry:" + phone]);
      if (propertyId) {
        const property = (await client.query("SELECT title_es, title_en, zone, mls, publication_section FROM properties WHERE id=$1 AND is_public=TRUE AND status IN ('active','featured') AND publication_section<>'typologies'", [propertyId])).rows[0];
        if (!property) fail("La publicación ya no está disponible. Abre el formulario general para consultar.", "This listing is no longer published. Open the general inquiry form for help.", data.lang);
        data.propertyTitle = (data.lang === "en" && property.title_en) || property.title_es;
        data.listingPath = propertyPath({ id: propertyId, titleEs: property.title_es, zone: property.zone, mls: property.mls }, data.lang);
        if (!data.zone && !Object.hasOwn(body, "zone") && property.zone) data.zone = property.zone;
        if (property.mls) data.mls = property.mls;
        if (property.publication_section === "developments" && !data.development) data.development = data.propertyTitle;
        if (data.project && !data.reference) data.reference = propertyId;
      }
      const fingerprint = crypto.createHash("sha256").update(JSON.stringify([propertyId, path, data])).digest("hex");
      const nonce = clean(body.requestId, 80);
      if (!/^[a-zA-Z0-9-]{12,80}$/.test(nonce)) fail("Vuelve a abrir el formulario.", "Reopen the inquiry form.", data.lang);
      const id = "lead-" + crypto.createHmac("sha256", secret).update(JSON.stringify([phone, nonce, fingerprint])).digest("hex").slice(0, 36);
      const previous = (await client.query(
        `SELECT id, payload FROM lead_requests WHERE id=$1 OR (phone=$2 AND payload->>'inquiryFingerprint'=$3 AND created_at > NOW() - INTERVAL '90 seconds') ORDER BY created_at DESC LIMIT 1`,
        [id, phone, fingerprint])).rows[0];
      const routing = await readContactRouting(client);
      let recordId = id;
      let payload = previous?.payload;
      if (previous) recordId = previous.id;
      else {
        const leadType = intentTypes[data.intent];
        const score = leadScoreFromData({ leadType, phone, payload: data, propertyId });
        const contact = await upsertContact(client, { name, phone, source: "portal_inquiry", contactType: ["sell", "let"].includes(data.intent) ? "seller" : "buyer", preferredZones: data.zone ? [data.zone] : [], propertyType: data.propertyType, leadScore: score });
        payload = { ...data, inquiryFingerprint: fingerprint, whatsappRef: crypto.randomBytes(8).toString("hex"), destination: destination(routing, data.country) };
        await client.query(
          `INSERT INTO lead_requests(id,lead_type,name,phone,source_path,property_id,contact_id,payload,priority,lead_score)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)`, [id, leadType, name || (data.lang === "en" ? "Website visitor" : "Visitante web"), phone, path, propertyId || null, contact.id, JSON.stringify(payload), score === "premium" ? "premium" : score === "hot" ? "high" : "medium", score]);
        await client.query("INSERT INTO notifications (id,type,title,message,related_entity_type,related_entity_id) VALUES ($1,'lead_created','Nueva consulta comercial',$2,'lead_request',$3)", [uuid("notif"), [leadType, data.project || data.propertyTitle || data.development || data.zone].filter(Boolean).join(" · "), id]);
        await client.query("INSERT INTO analytics_events (id,event_type,contact_id,property_id,metadata) VALUES ($1,'lead_submitted',$2,$3,$4::jsonb)", [uuid("evt"), contact.id, propertyId || null, JSON.stringify({ leadType, zone: data.zone || "", source: path })]);
      }
      const action = inquiryAction(recordId, payload, siteUrl, path, secret);
      await client.query("COMMIT");
      res.status(previous ? 200 : 201).json(action);
    } catch (err) {
      if (client) await client.query("ROLLBACK");
      if (err.status === 400) return res.status(400).json({ error: err.message });
      next(err);
    } finally { client?.release(); }
  });
  app.post("/api/inquiries/:id/whatsapp-click", async (req, res, next) => {
    try {
      if (req.body?.token !== clickToken(req.params.id)) return res.sendStatus(403);
      if (req.params.id.startsWith("guest-sale-")) {
        await query(`UPDATE activity_logs SET new_value=jsonb_set(new_value,'{whatsappClickedAt}',to_jsonb(NOW()))
          WHERE id='guest-inquiry:' || $1 AND action='guest_inquiry_saved' AND NOT new_value ? 'whatsappClickedAt'`, [req.params.id]);
        return res.sendStatus(204);
      }
      await query(`WITH clicked AS (
        UPDATE lead_requests SET payload=jsonb_set(payload,'{whatsappClickedAt}',to_jsonb(NOW()))
        WHERE id=$1 AND payload ? 'whatsappRef' AND NOT payload ? 'whatsappClickedAt'
        RETURNING contact_id, property_id
      ) INSERT INTO analytics_events(id,event_type,contact_id,property_id,metadata)
        SELECT $2,'whatsapp_clicked',contact_id,property_id,jsonb_build_object('inquiryId',$1::text) FROM clicked`, [req.params.id, uuid("evt")]);
      res.sendStatus(204);
    } catch (err) { next(err); }
  });
}

async function recordIncomingInquiry(query, jid, text, timestamp) {
  const reference = /\bPCC-([a-f0-9]{16})\b/i.exec(text)?.[1]?.toLowerCase();
  const sender = /^(\d+)@s\.whatsapp\.net$/.exec(jid)?.[1];
  if (!reference || !sender) return;
  const phones = [sender];
  if (/^521\d{10}$/.test(sender)) phones.push("52" + sender.slice(3));
  await query(`UPDATE lead_requests SET payload=jsonb_set(payload,'{whatsappReceivedAt}',to_jsonb($3::timestamptz))
     WHERE phone=ANY($1::text[]) AND payload->>'whatsappRef'=$2 AND NOT payload ? 'whatsappReceivedAt'`, [phones, reference, timestamp]);
  await query(`UPDATE activity_logs a SET new_value=jsonb_set(a.new_value,'{whatsappReceivedAt}',to_jsonb($3::timestamptz))
     FROM guest_sale_requests g WHERE g.phone=ANY($1::text[]) AND a.id='guest-inquiry:' || g.id AND a.action='guest_inquiry_saved'
       AND a.new_value->>'whatsappRef'=$2 AND NOT a.new_value ? 'whatsappReceivedAt'`, [phones, reference, timestamp]);
}

module.exports = { businessPhoneLabel, contactRouting, contactPhone, destination, messageFor, registerInquiries, recordIncomingInquiry, readContactRouting, inquiryAction, serviceChannel, sourcePath };
