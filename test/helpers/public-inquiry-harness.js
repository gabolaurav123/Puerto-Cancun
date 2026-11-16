"use strict";
const http = require("node:http");
const path = require("node:path");
const express = require("express");
const { registerInquiries } = require("../../contact-inquiries");

function fixtures() {
  const base = { type: "Departamento", status: "active", isPublic: true, price: 500000, currency: "USD", priceUnit: "total", operation: "sale", zone: "Puerto Cancún" };
  return [
    { ...base, id: "fixture-rent", titleEs: "Renta sin periodo confirmado", titleEn: "Rental with unconfirmed period", mls: "1877", operation: "rent", portalDevelopmentId: "fixture-presale", price: 7200 },
    { ...base, id: "fixture-sale", titleEs: "Departamento publicado", titleEn: "Published apartment", mls: "QA100", portalDevelopmentId: "fixture-development" },
    { ...base, id: "fixture-presale-unit", titleEs: "Unidad en preventa", titleEn: "Presale unit", portalDevelopmentId: "fixture-presale", catalogData: { salesModality: "presale" } },
    { ...base, id: "fixture-development", titleEs: "Desarrollo existente", titleEn: "Existing development", type: "Desarrollo", publicationSection: "developments", developmentData: { id: "fixture-development-key" } },
    { ...base, id: "fixture-presale", titleEs: "Proyecto en preventa", titleEn: "Presale project", type: "Desarrollo", publicationSection: "developments", developmentData: { id: "fixture-presale-key" }, catalogData: { salesModality: "presale" } },
    { ...base, id: "fixture-land", titleEs: "Terreno Cozumel", titleEn: "Cozumel land", type: "Terreno", zone: "Fuera de Cancún", municipality: "Cozumel", lot: 900 },
  ];
}

async function createHarness({ properties = fixtures(), channels = { email: true, whatsapp: true }, getExchangeRate = () => null, browser = false } = {}) {
  const records = new Map(), calls = [], contacts = [], tours = [];
  let sequence = 0;
  const query = async (sql, values = []) => {
    calls.push([sql, values]);
    if (sql.startsWith("SELECT key, value FROM app_settings")) return { rows: [] };
    if (sql.startsWith("SELECT title_es, title_en, zone, mls")) {
      const property = properties.find(row => row.id === values[0]);
      return { rows: property ? [{ title_es: property.titleEs, title_en: property.titleEn, zone: property.zone, mls: property.mls, publication_section: property.publicationSection || "properties" }] : [] };
    }
    if (sql.startsWith("SELECT id, payload FROM lead_requests")) {
      const match = records.get(values[0]) || [...records.values()].find(row => ((values[1] && row.phone === values[1]) || (values[3] && row.email === values[3])) && row.payload.inquiryFingerprint === values[2]);
      return { rows: match ? [match] : [] };
    }
    if (sql.startsWith("INSERT INTO lead_requests")) {
      const [id, leadType, name, phone, email, sourcePath, propertyId, contactId, payload] = values;
      records.set(id, { id, leadType, name, phone, email, sourcePath, propertyId, contactId, payload: JSON.parse(payload) });
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith("INSERT INTO tour_requests")) {
      const [id, propertyId, name, phone, email, preferredDate, preferredTime, comments] = values;
      tours.push({ id, propertyId, name, phone, email, preferredDate, preferredTime, comments });
    }
    return { rows: [], rowCount: 1 };
  };
  const app = express(); app.use(express.json());
  registerInquiries(app, { query, pool: { connect: async () => ({ query, release() {} }) }, uuid: () => "fixture-" + ++sequence,
    siteUrl: "https://portal.example.test", secret: "test-secret", upsertContact: async (_client, data) => { contacts.push(data); return { id: "contact-" + contacts.length }; }, leadScoreFromData: () => "warm",
    getPublicProperties: async () => properties, getExchangeRate, channels: () => channels });
  if (browser) {
    const root = path.resolve(__dirname, "../..");
    for (const file of ["contextual-contact.js", "contextual-contact.css", "contact-config.js", "public-pricing.js"]) app.get("/" + file, (_req, res) => res.sendFile(path.join(root, file)));
    app.get("/api/config", (_req, res) => res.json({ currencyExchange: getExchangeRate(), publicSiteUrl: "https://portal.example.test" }));
    app.get("/styles.css", (_req, res) => res.sendFile(path.join(root, "styles.css")));
    app.get("*", (req, res) => res.type("html").send(`<!doctype html><html lang="${req.path.startsWith("/en") ? "en" : "es"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/contextual-contact.css"></head><body><main style="padding:24px"><h1>QA local</h1><a id="openInquiry" href="${req.path.startsWith("/en") ? "/en/contact" : "/contacto"}?propertyId=fixture-sale&intent=buy" data-contact-inquiry data-property-id="fixture-sale" data-intent="buy">Pedir información</a></main><script>window.PccInquiryRequest=async(path,body)=>{const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error),{status:r.status});return data;};</script><script src="/contact-config.js"></script><script src="/public-pricing.js"></script><script src="/contextual-contact.js"></script></body></html>`));
  }
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }));
  const server = http.createServer(app); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const get = async url => { const response = await fetch(base + url); return { status: response.status, data: await response.json() }; };
  const post = async body => { const response = await fetch(base + "/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: response.status, data: await response.json() }; };
  return { base, records, contacts, tours, properties, channels, calls, get, post, close: () => new Promise(resolve => server.close(resolve)) };
}
module.exports = { fixtures, createHarness };
