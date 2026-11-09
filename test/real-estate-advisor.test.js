"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { askAdvisor, preferenceEvidence, registerAdvisorRoutes, extractWithOpenAI, answerFacts } = require("../real-estate-advisor");
const base = { isPublic: true, status: "active", operation: "sale", type: "Departamento", zone: "Puerto Cancun", currency: "USD", price: 500000, area: 120, lot: 180, beds: 2, baths: 2 };
const properties = [
  { ...base, id: "public-unit", titleEs: "Departamento real", titleEn: "Real apartment", developmentId: "dev-project", descriptionEs: "Se aceptan mascotas. Cerca de escuelas. Cocina y terraza.", descriptionEn: "Pets are allowed. Close to schools. Kitchen and terrace." },
  { ...base, id: "unknown-pets", titleEs: "Sin regla publicada", price: 600000, descriptionEs: "Cocina y terraza." },
  { ...base, id: "no-pets", titleEs: "Sin mascotas", price: 650000, descriptionEs: "No se aceptan mascotas." },
  { ...base, id: "too-expensive", titleEs: "Mayor presupuesto", price: 950000 },
  { ...base, id: "other-currency", titleEs: "Moneda distinta", currency: "MXN" },
  { ...base, id: "unpublished", titleEs: "Título secreto", isPublic: false, descriptionEs: "Datos privados que nunca deben devolverse." },
  { ...base, id: "sold", titleEs: "Vendida", status: "sold" },
  { ...base, id: "rental-month", titleEs: "Renta mensual", operation: "rent", price: 4000, catalogData: { rentPeriod: "month" } },
  { ...base, id: "rental-day", titleEs: "Renta diaria", operation: "rent", price: 200, catalogData: { rentPeriod: "day" } },
  { ...base, id: "project", titleEs: "Proyecto real", publicationSection: "developments", type: "Desarrollo", developmentData: { id: "dev-project" }, descriptionEs: "Información verificada del desarrollo." },
];
const ask = (body, extras = {}) => askAdvisor(body, { properties, ...extras });

test("model paraphrases cannot replace an explicit zone/development or invent a budget", async () => {
  const wrong = async () => ({intent:"search",query:"Comprar departamento en Zona Hotelera hasta 900000 USD",facts:[],preferences:[]});
  const result = await ask({message:"Comprar departamento en Puerto Cancun"},{interpret:wrong});
  assert.deepEqual(result.state.filters.locations,["puerto-cancun"]);
  assert.equal(result.state.filters.max,undefined);
  assert.equal(result.state.filters.currency,undefined);
  const scoped = await ask({message:"Comprar departamento en Proyecto real"},{interpret:wrong});
  assert.equal(scoped.state.filters.development,"dev-project");
  assert.deepEqual(scoped.cards.map(card=>card.id),["public-unit"]);
});

test("hidden editorial blocks cannot supply answers or preference evidence", async () => {
  const hidden = {...properties[0],portalHiddenBlocks:["description","amenities","location"],amenities:["Pet-friendly"],address:"Hidden exact address",locationPrecision:"exact"};
  assert.equal(preferenceEvidence(hidden,"pets"),"unknown");
  assert.equal(preferenceEvidence(hidden,"schools"),"unknown");
  const result = await askAdvisor({message:"Cuéntame descripción, ubicación y amenidades",context:{propertyId:hidden.id}}, {properties:[hidden]});
  assert.doesNotMatch(result.reply,/Cocina y terraza|Hidden exact address|Pet-friendly/);
  assert.equal(result.cards[0].zone,"");
  assert.match(result.reply,/no publica la ubicación/);
});

test("negative preference evidence and missing prices are not advertised as confirmed", async () => {
  assert.equal(preferenceEvidence({descriptionEs:"No es pet-friendly."},"pets"),"no");
  assert.equal(preferenceEvidence({descriptionEn:"Not near schools."},"schools"),"no");
  const result = await askAdvisor({message:"¿Qué precio tiene?",context:{propertyId:"missing"}}, {properties:[{...properties[0],id:"missing",price:null}]});
  assert.match(result.reply,/Precio por confirmar/);
  assert.doesNotMatch(result.reply,/Precio a consultar/);
});

test("unknown listing questions say what is missing rather than answering another question", async () => {
  const result = await ask({message:"¿Tiene elevador de carga?",context:{propertyId:"public-unit"}});
  assert.match(result.reply,/No identifico ese dato/);
  assert.match(result.inquiryContext.summary,/elevador de carga/);
});

test("long requests are not silently truncated before interpreting their last restriction", async () => {
  const result = await ask({message:"Comprar departamento en Puerto Cancun " + "amplio ".repeat(85) + "hasta 1000 USD"});
  assert.equal(result.needsClarification,true);
  assert.equal(result.cards.length,0);
  assert.match(result.reply,/600 caracteres/);
});

test("a different development context replaces the prior development relationship", async () => {
  const first = await ask({message:"Hola",context:{propertyId:"project"}});
  const others = [...properties,{...properties.at(-1),id:"second-project",titleEs:"Segundo proyecto",developmentData:{id:"dev-second"}},{...properties[0],id:"second-unit",developmentId:"dev-second"}];
  const changed = await askAdvisor({message:"Comprar departamento",context:{propertyId:"second-project"},state:first.state},{properties:others});
  assert.equal(changed.state.filters.development,"dev-second");
  assert.deepEqual(changed.cards.map(card=>card.id),["second-unit"]);
});

test("handoff summary contains current criteria rather than accumulating chat transcript", async () => {
  let result = await ask({message:"Comprar departamento en Puerto Cancun hasta 700000 USD"});
  result = await ask({message:"2 baños",state:result.state});
  assert.match(result.inquiryContext.summary,/Baños mínimos: 2/);
  assert.match(result.inquiryContext.summary,/700000 USD/);
  assert.equal(result.inquiryContext.preferences,"");
  assert.doesNotMatch(result.inquiryContext.summary,/Comprar departamento en Puerto Cancun hasta/);
});

test("a preference-only follow-up cannot discard unresolved exclusions", async () => {
  const first = await ask({message:"Comprar departamento sin Puerto Cancun"});
  assert.equal(first.needsClarification,true);
  const next = await ask({message:"con mascotas",state:first.state});
  assert.equal(next.needsClarification,true);
  assert.equal(next.cards.length,0);
  assert.match(next.reply,/exclusiones/);
});

test("advisor filters the real inventory by currency, operation and budget", async () => {
  const result = await ask({ message: "Comprar departamento en Puerto Cancun hasta 700000 USD" });
  assert.deepEqual(result.cards.map(card => card.id).sort(), ["no-pets", "public-unit", "unknown-pets"]);
  assert.equal(result.inquiryContext.zone, "Puerto Cancún");
  assert.equal(result.state.filters.max, 700000);
  assert.equal(result.provider, "guided");
  assert.equal(result.configuration.ai, "not_configured");
  assert.equal(result.cards[0].constructionArea, 120);
  assert.equal(result.cards[0].landArea, 180);
  assert.equal(result.cards[0].price, "USD $650,000");
});

test("conversation preserves the budget while clarifying the rental period", async () => {
  const initial = await ask({ message: "Rentar departamento en Puerto Cancun hasta 5000 USD" });
  assert.equal(initial.needsClarification, true);
  assert.equal(initial.cards.length, 0);
  const result = await ask({ message: "mensual", state: initial.state });
  assert.equal(result.state.filters.max, 5000);
  assert.equal(result.state.filters.rentPeriod, "month");
  assert.deepEqual(result.cards.map(card => card.id), ["rental-month"]);
  assert.equal(result.cards[0].price, "USD $4,000 / mes");
});

test("pets and schools are evidence based and unverified alternatives are labeled", async () => {
  const result = await ask({ message: "Comprar departamento en Puerto Cancun hasta 700000 USD con mascotas cerca de escuelas" });
  assert.deepEqual(result.cards.map(card => card.id), ["public-unit"]);
  assert.equal(result.alternatives.length, 2);
  const denied = result.alternatives.find(card => card.id === "no-pets");
  assert.match(denied.differences.join(" "), /no cumple/);
  assert.match(result.alternatives.find(card => card.id === "unknown-pets").differences.join(" "), /por confirmar/);
  assert.equal(preferenceEvidence(properties[1], "pets"), "unknown");
});

test("context questions only report stored facts and explicitly flag missing evidence", async () => {
  const result = await ask({ message: "¿Acepta mascotas?", context: { propertyId: "unknown-pets" } });
  assert.match(result.reply, /no consta/);
  assert.equal(result.inquiryContext.propertyId, "unknown-pets");
  assert.match(result.inquiryContext.preferences, /Mascotas/);
  assert.match(answerFacts(properties[0], ["area"], "es"), /Construcción: 120 m². Terreno: 180 m²/);
});

test("a private or nonexistent context never leaks a listing", async () => {
  for (const id of ["unpublished", "invented-id"]) {
    const result = await ask({ message: "¿Qué precio tiene?", context: { propertyId: id } });
    assert.equal(result.inquiryContext.propertyId, "");
    assert.doesNotMatch(JSON.stringify(result), /Título secreto|Datos privados|invented-id/);
  }
});

test("development context searches only its linked available units", async () => {
  const first = await ask({ message: "Hola", context: { propertyId: "project" } });
  assert.equal(first.state.filters.development, "dev-project");
  const result = await ask({ message: "Comprar departamento", context: { propertyId: "project" }, state: first.state });
  assert.deepEqual(result.cards.map(card => card.id), ["public-unit"]);
});

test("a viewing is requested through the contact form and is never confirmed by the agent", async () => {
  const result = await ask({ message: "Quiero agendar una visita mañana", context: { propertyId: "public-unit" } });
  assert.equal(result.inquiryContext.service, "visit");
  assert.equal(result.inquiryContext.propertyId, "public-unit");
  assert.equal(result.visitRequested, false);
  assert.match(result.reply, /equipo debe confirmarla/);
});

test("no matches keeps the search criteria for explicit alert consent", async () => {
  const result = await ask({ message: "Comprar departamento en Puerto Cancun hasta 1000 USD", lang: "en" });
  assert.equal(result.cards.length, 0);
  assert.equal(result.canSaveSearch, true);
  assert.equal(result.inquiryContext.searchFilters.max, 1000);
  assert.equal(result.inquiryContext.searchFilters.currency, "USD");
  assert.equal(result.inquiryContext.origin, "web-advisor");
});

test("model text cannot invent property facts, ids or change an explicit budget", async () => {
  const result = await ask({ message: "Comprar departamento en Puerto Cancun hasta 700000 USD" }, {
    aiConfigured: true,
    interpret: async () => ({ intent: "search", query: "Comprar departamento en Puerto Cancun hasta 1000000 USD", facts: ["description"], preferences: [], answer: "All homes have private pools", properties: [{ id: "invented" }] }),
  });
  assert.equal(result.provider, "ai");
  assert.equal(result.state.filters.max, 700000);
  assert.ok(!result.cards.some(card => ["too-expensive", "invented"].includes(card.id)));
  assert.doesNotMatch(JSON.stringify(result), /private pools/);
});

test("unsupported constraints cannot be silently erased by a model paraphrase", async () => {
  const result = await ask({ message: "Comprar departamento sin Puerto Cancun" }, {
    aiConfigured: true, interpret: async () => ({ intent: "search", query: "Comprar departamento", facts: [], preferences: [] }),
  });
  assert.equal(result.needsClarification, true);
  assert.equal(result.cards.length, 0);
});

test("a follow-up cannot widen an existing budget because of a model paraphrase", async () => {
  const initial = await ask({ message: "Comprar departamento en Puerto Cancun hasta 700000 USD" });
  const result = await ask({ message: "Más opciones", state: initial.state }, {
    aiConfigured: true, interpret: async () => ({ intent: "search", query: "Comprar departamento en Puerto Cancun hasta 1000000 USD", facts: [], preferences: [] }),
  });
  assert.equal(result.state.filters.max, 700000);
  assert.ok(!result.cards.some(card => card.id === "too-expensive"));
});

test("provider failure preserves the deterministic search and reports guided mode", async () => {
  const result = await ask({ message: "Comprar departamento hasta 700000 USD" }, { aiConfigured: true, interpret: async () => { throw new Error("Provider credentials must not leak"); } });
  assert.equal(result.provider, "guided");
  assert.equal(result.configuration.ai, "temporarily_unavailable");
  assert.ok(result.cards.length);
  assert.doesNotMatch(JSON.stringify(result), /credentials/);
});

test("the provider only receives intent extraction with storage disabled", async () => {
  let payload;
  const response = await extractWithOpenAI({ message: "Comprar" }, { apiKey: "test-only", fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ intent: "search", query: "Comprar", facts: [], preferences: [] }) }] }] }) };
  } });
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.strict, true);
  assert.equal(response.intent, "search");
});

test("advisor route runs with HTTP JSON, rejects invalid input, and avoids caching", async t => {
  const app = express(); app.use(express.json());
  registerAdvisorRoutes(app, { getPublicProperties: async () => properties });
  app.use((error, req, res, next) => { res.status(error.status || 500).json({ error: error.message }); });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = "http://127.0.0.1:" + server.address().port + "/api/advisor/chat";
  let response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "Monthly rent in Puerto Cancun up to 5000 USD", lang: "en" }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual((await response.json()).cards.map(card => card.id), ["rental-month"]);
  response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "" }) });
  assert.equal(response.status, 400);
});
