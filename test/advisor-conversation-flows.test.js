"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { askAdvisor, preferenceEvidence } = require("../real-estate-advisor");

// These visitors answer in fragments, including answers out of the prompted order.
// No provider or production data is needed to exercise the conversation contract.
const base = { isPublic: true, status: "active", operation: "sale", type: "Departamento", zone: "Puerto Cancun", currency: "MXN", price: 1800000, area: 100, beds: 2, baths: 2 };
const properties = [
  { ...base, id: "mxn-sale", titleEs: "Departamento Alameda", titleEn: "Alameda apartment", descriptionEs: "Cocina y terraza.", descriptionEn: "Kitchen and terrace." },
  { ...base, id: "usd-sale", titleEs: "Departamento Roble", titleEn: "Oak apartment", currency: "USD", price: 180000 },
  { ...base, id: "other-zone", titleEs: "Departamento Centro", titleEn: "Downtown apartment", zone: "Cancun Centro", location: "cancun-city" },
  { ...base, id: "above-budget", titleEs: "Departamento Amplio", titleEn: "Larger apartment", price: 3000000 },
  { ...base, id: "monthly-rental", titleEs: "Departamento Jardín", titleEn: "Garden apartment", operation: "rent", price: 20000, catalogData: { rentPeriod: "month" } },
  { ...base, id: "daily-rental", titleEs: "Departamento Sol", titleEn: "Sun apartment", operation: "rent", price: 1500, catalogData: { rentPeriod: "day" } },
  { ...base, id: "unknown-period", titleEs: "Departamento Luna", titleEn: "Moon apartment", operation: "rent", price: 12000 },
  { ...base, id: "sold", titleEs: "Departamento vendido", titleEn: "Sold apartment", status: "sold" },
  { ...base, id: "private", titleEs: "Borrador", titleEn: "Draft", isPublic: false },
];

const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const ask = (message, state, lang = "es", extras = {}) => askAdvisor({ message, state: clone(state), lang }, { properties, ...extras });
const folded = text => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const noLexicalDebris = response => assert.ok(!response.state.filters.text, `Fragment became a text filter: ${JSON.stringify(response.state.filters)}\n${response.reply}`);
const noPrematureResults = response => {
  assert.equal(response.cards.length, 0);
  assert.equal(response.alternatives.length, 0);
  assert.equal(response.canSaveSearch, false);
  assert.doesNotMatch(folded(response.reply), /no encontre|no encontr|no properties|i found no|no matching/);
};
async function conversation(messages, lang = "es", extras = {}) {
  let state;
  const turns = [];
  for (const message of messages) {
    const response = await ask(message, state, lang, extras);
    turns.push(response);
    state = response.state;
  }
  return turns;
}

test("Spanish visitor saying hola, vivienda, mar gets clarification instead of repeated empty searches", async () => {
  const [hello, home, coast] = await conversation(["hola", "vivienda", "mar"]);
  assert.match(folded(hello.reply), /comprar|rentar/);
  for (const response of [home, coast]) {
    noPrematureResults(response);
    noLexicalDebris(response);
    assert.ok(response.questions.length <= 1, "Ask one question at a time");
  }
  assert.notEqual(coast.reply, home.reply, "A new preference needs acknowledgement, not the same response");
  assert.match(folded(coast.reply), /vista|frente|cerca|playa/);
  assert.ok(!coast.state.filters.locations?.length, "Sea is not an invented zone");
  assert.equal(coast.state.filters.operation, undefined);
});

test("Spanish fragmented answers retain operation, type, compact zone and amount until pesos supplies currency", async () => {
  const turns = await conversation(["hola", "vivienda", "mar", "comprar", "departamento", "PuertoCancun", "2 millones", "pesos"]);
  const purchase = turns[3], apartment = turns[4], zone = turns[5], amount = turns[6], final = turns[7];
  assert.equal(purchase.state.filters.operation, "sale");
  assert.doesNotMatch(folded(purchase.reply), /buscas comprar o rentar/);
  assert.equal(apartment.state.filters.type, "Departamento");
  assert.deepEqual(zone.state.filters.locations, ["puerto-cancun"]);
  assert.match(folded(amount.reply), /moneda|usd|mxn|pesos|dolares/);
  assert.equal(amount.state.filters.currency, undefined, "An amount does not imply a currency");
  assert.equal(final.state.filters.max, 2000000);
  assert.equal(final.state.filters.currency, "MXN");
  assert.equal(final.state.filters.operation, "sale");
  assert.equal(final.state.filters.type, "Departamento");
  assert.deepEqual(final.state.filters.locations, ["puerto-cancun"]);
  for (const response of turns.slice(1)) noLexicalDebris(response);
  const clarified = await ask("cerca de la playa", final.state);
  assert.ok(clarified.state.preferences.includes("beach_nearby"));
  assert.equal(clarified.state.filters.max, 2000000);
  assert.equal(clarified.state.filters.currency, "MXN");
  noLexicalDebris(clarified);
});

test("a complete search assembled from short answers finds the same real properties as a full sentence", async () => {
  const turns = await conversation(["comprar", "departamento", "PuertoCancun", "2 millones", "pesos"]);
  const final = turns.at(-1);
  const single = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN");
  assert.equal(final.needsClarification, false);
  assert.deepEqual(final.cards.map(card => card.id), ["mxn-sale"]);
  assert.deepEqual(final.cards.map(card => card.id), single.cards.map(card => card.id));
  assert.equal(final.inquiryContext.budget, 2000000);
  assert.equal(final.inquiryContext.currency, "MXN");
  assert.equal(final.inquiryContext.zone, "Puerto Cancún");
  assert.doesNotMatch(folded(final.reply), /que zona|que tipo|cual es tu presupuesto|comprar o rentar/);
});

test("switching to monthly rent clears the purchase budget and keeps the other explicit criteria", async () => {
  const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN");
  const switched = await ask("mejor renta mensual", initial.state);
  assert.equal(switched.state.filters.operation, "rent");
  assert.equal(switched.state.filters.rentPeriod, "month");
  assert.equal(switched.state.filters.max, undefined);
  assert.equal(switched.state.filters.min, undefined);
  assert.equal(switched.state.filters.currency, "MXN");
  assert.equal(switched.state.filters.type, "Departamento");
  assert.deepEqual(switched.state.filters.locations, ["puerto-cancun"]);
  noLexicalDebris(switched);
  assert.match(folded(switched.reply), /presupuesto/);
  const budget = await ask("25 mil", switched.state);
  assert.equal(budget.state.filters.max, 25000);
  assert.equal(budget.state.filters.currency, "MXN");
  assert.deepEqual(budget.cards.map(card => card.id), ["monthly-rental"]);
  assert.ok(budget.cards.every(card => card.rentPeriod === "month"));
});

test("negative beachfront preference replaces a positive one without becoming an inclusion or lexical no", async () => {
  const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN");
  const positive = await ask("frente al mar", initial.state);
  const negative = await ask("no frente al mar", positive.state);
  assert.ok(negative.state.preferences.includes("not_oceanfront"));
  assert.ok(!negative.state.preferences.includes("oceanfront"));
  assert.equal(negative.state.filters.max, 2000000);
  assert.equal(negative.state.filters.operation, "sale");
  noLexicalDebris(negative);
  assert.doesNotMatch(folded(negative.reply), /no se aplican ni se deducen|confirma el filtro positivo|contrato/);
  assert.match(folded(negative.inquiryContext.preferences), /no|not|sin/);
  assert.ok(negative.cards.every(card => card.preferences.every(preference => preference.evidence === "yes")), "Unknown absence of beachfront is not a confirmed match");
});

test("English home and sea fragments clarify the preference without claiming there are no properties", async () => {
  const [hello, home, coast] = await conversation(["hello", "home", "sea"], "en");
  assert.match(folded(hello.reply), /buy|rent/);
  for (const response of [home, coast]) {
    noPrematureResults(response);
    noLexicalDebris(response);
    assert.doesNotMatch(folded(response.reply), /buscas|comprar|rentar|presupuesto/);
  }
  assert.match(folded(coast.reply), /view|beachfront|oceanfront|near|beach/);
  assert.ok(!coast.state.filters.locations?.length);
});

test("English short replies and a later currency answer preserve the amount and exact search criteria", async () => {
  const turns = await conversation(["buy", "apartment", "PuertoCancun", "2 million", "Mexican pesos"], "en");
  const amount = turns[3], final = turns.at(-1);
  assert.equal(amount.state.filters.currency, undefined);
  assert.match(folded(amount.reply), /currency|usd|mxn|pesos|dollars/);
  assert.equal(final.state.filters.max, 2000000);
  assert.equal(final.state.filters.currency, "MXN");
  assert.equal(final.state.filters.operation, "sale");
  assert.equal(final.state.filters.type, "Departamento");
  assert.deepEqual(final.state.filters.locations, ["puerto-cancun"]);
  assert.deepEqual(final.cards.map(card => card.id), ["mxn-sale"]);
  for (const response of turns) noLexicalDebris(response);
  const rent = await ask("actually monthly rent", final.state, "en");
  assert.equal(rent.state.filters.max, undefined);
  assert.equal(rent.state.filters.operation, "rent");
  assert.equal(rent.state.filters.rentPeriod, "month");
  noLexicalDebris(rent);
  assert.match(folded(rent.reply), /budget/);
  const negative = await ask("not beachfront", rent.state, "en");
  assert.ok(negative.state.preferences.includes("not_oceanfront"));
  assert.ok(!negative.state.preferences.includes("oceanfront"));
  noLexicalDebris(negative);
});

test("provider outage midway through fragmented replies keeps the conversation useful and preserves completed requirements", async () => {
  const interpret = async () => { throw new Error("provider temporarily unavailable"); };
  const turns = await conversation(["hola", "vivienda", "comprar", "departamento", "PuertoCancun", "2 millones", "pesos"], "es", { interpret, aiConfigured: true });
  noPrematureResults(turns[1]);
  const final = turns.at(-1);
  assert.equal(final.provider, "guided");
  assert.equal(final.configuration.ai, "temporarily_unavailable");
  assert.equal(final.state.filters.max, 2000000);
  assert.equal(final.state.filters.currency, "MXN");
  assert.deepEqual(final.cards.map(card => card.id), ["mxn-sale"]);
});

test("sea view and not beachfront remain distinct preferences in the same sentence", async () => {
  for (const [lang, message, negativeEvidence] of [
    ["es", "Con vista al mar, pero no frente al mar", "Este inmueble no está frente al mar."],
    ["en", "Sea view, but not oceanfront", "This property is not oceanfront."],
  ]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN", undefined, lang);
    const response = await ask(message, initial.state, lang);
    assert.ok(response.state.preferences.includes("sea_view"));
    assert.ok(response.state.preferences.includes("not_oceanfront"));
    assert.ok(!response.state.preferences.includes("oceanfront"));
    noLexicalDebris(response);
    assert.equal(response.state.filters.max, 2000000);
    assert.notEqual(preferenceEvidence({ descriptionEs: negativeEvidence }, "oceanfront"), "yes");
  }
});

test("mar or sea after complete criteria asks one coastal question then accepts a short clarification", async () => {
  for (const [lang, first, coast, answer] of [
    ["es", "Comprar departamento en Puerto Cancun hasta 2000000 MXN", "mar", "cerca de la playa"],
    ["en", "Buy apartment in Puerto Cancun under 2000000 MXN", "sea", "near the beach"],
  ]) {
    const initial = await ask(first, undefined, lang);
    const pending = await ask(coast, initial.state, lang);
    noPrematureResults(pending);
    noLexicalDebris(pending);
    const resolved = await ask(answer, pending.state, lang);
    assert.ok(resolved.state.preferences.includes("beach_nearby"));
    assert.equal(resolved.state.filters.max, 2000000);
    assert.equal(resolved.state.filters.currency, "MXN");
    assert.equal(resolved.state.filters.operation, "sale");
    assert.deepEqual(resolved.state.filters.locations, ["puerto-cancun"]);
    assert.equal(resolved.needsClarification, false);
    noLexicalDebris(resolved);
  }
});

test("buy-to-rent switch can replace its budget in the same short reply without currency conversion", async () => {
  for (const [lang, message] of [
    ["es", "Mejor renta mensual, hasta 5 mil"],
    ["en", "Monthly rental instead, under 5k"],
  ]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 USD", undefined, lang);
    const switched = await ask(message, initial.state, lang);
    assert.equal(switched.state.filters.operation, "rent");
    assert.equal(switched.state.filters.rentPeriod, "month");
    assert.equal(switched.state.filters.max, 5000);
    assert.equal(switched.state.filters.currency, "USD");
    assert.equal(switched.state.filters.type, "Departamento");
    assert.deepEqual(switched.state.filters.locations, ["puerto-cancun"]);
    noLexicalDebris(switched);
  }
});

test("provider literal preference labels are canonicalized and cannot undo the visitor's negation", async () => {
  for (const [lang, message, modelPreference, expected] of [
    ["es", "vista al mar", "vista al mar", "sea_view"],
    ["en", "Sea view", "sea view", "sea_view"],
    ["es", "no frente al mar", "frente al mar", "not_oceanfront"],
    ["en", "not beachfront", "beachfront", "not_oceanfront"],
  ]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN", undefined, lang);
    const response = await ask(message, initial.state, lang, { interpret: async () => ({ intent: "search", query: message, facts: [], preferences: [modelPreference] }) });
    assert.equal(response.provider, "ai");
    assert.deepEqual(response.state.preferences, [expected]);
    assert.equal(response.state.filters.max, 2000000);
    assert.equal(response.state.filters.currency, "MXN");
    noLexicalDebris(response);
    assert.ok(response.alternatives.every(card => card.preferences.length === 1));
  }
});

test("coastal clarification understands the short answers vista, frente, cerca and their English equivalents", async () => {
  for (const [lang, coast, replies] of [
    ["es", "mar", [["vista", "sea_view"], ["frente", "oceanfront"], ["cerca", "beach_nearby"]]],
    ["en", "sea", [["view", "sea_view"], ["front", "oceanfront"], ["near", "beach_nearby"]]],
  ]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN", undefined, lang);
    const pending = await ask(coast, initial.state, lang);
    for (const [reply, preference] of replies) {
      const response = await ask(reply, pending.state, lang);
      assert.deepEqual(response.state.preferences, [preference]);
      assert.equal(response.needsClarification, false);
      assert.equal(response.state.filters.max, 2000000);
      assert.deepEqual(response.state.filters.locations, ["puerto-cancun"]);
      noLexicalDebris(response);
    }
  }
});

test("starting a new search clears old preferences and an unanswered coastal question", async () => {
  for (const [lang, reset] of [["es", "nueva búsqueda"], ["en", "new search"]]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN con mascotas", undefined, lang);
    const preference = await ask("frente al mar", initial.state, lang);
    const pending = await ask("mar", preference.state, lang);
    const response = await ask(reset, pending.state, lang);
    assert.deepEqual(response.state.preferences, []);
    assert.equal(response.state.filters.max, undefined);
    assert.equal(response.state.filters.operation, undefined);
    assert.ok(!response.state.filters.locations?.length);
    assert.equal(response.needsClarification, false);
    assert.doesNotMatch(folded(response.reply), /cuando dices.*mar|when you say.*sea/);
    assert.match(folded(response.reply), /comprar o rentar|buy or rent/);
    noPrematureResults(response);
  }
});

test("a greeting after a completed search does not ask again for the operation already supplied", async () => {
  for (const [lang, greeting] of [["es", "hola"], ["en", "hello"]]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN", undefined, lang);
    const response = await ask(greeting, initial.state, lang);
    assert.equal(response.state.filters.operation, "sale");
    assert.equal(response.state.filters.type, "Departamento");
    assert.equal(response.state.filters.max, 2000000);
    assert.deepEqual(response.state.filters.locations, ["puerto-cancun"]);
    assert.doesNotMatch(folded(response.reply), /buscas comprar o rentar|looking to buy or rent/);
    assert.ok(response.reply.trim().length > 0);
  }
});

test("natural beachfront negation is preserved even when the provider correctly supplies a negative preference", async () => {
  const coastalProperties = [{ ...properties[0], descriptionEs: "Frente al mar. Vista al mar.", descriptionEn: "Oceanfront. Sea view." }];
  for (const [lang, message] of [["es", "No quiero estar frente al mar"], ["en", "I do not want beachfront"]]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN", undefined, lang);
    const response = await ask(message, initial.state, lang, { properties: coastalProperties, interpret: async () => ({ intent: "search", query: "", facts: [], preferences: ["not_oceanfront"] }) });
    assert.equal(response.provider, "ai");
    assert.deepEqual(response.state.preferences, ["not_oceanfront"]);
    assert.equal(response.cards.length, 0, "A beachfront property cannot be an exact match for a negative beachfront request");
    assert.equal(response.state.filters.max, 2000000);
    assert.equal(response.state.filters.currency, "MXN");
    noLexicalDebris(response);
  }
});

test("rejecting a sea view never keeps or invents a positive sea-view requirement", async () => {
  const coastalProperties = [{ ...properties[0], descriptionEs: "Vista al mar.", descriptionEn: "Sea view." }];
  for (const [lang, message] of [["es", "No quiero vista al mar"], ["en", "No sea view"]]) {
    const initial = await ask("Comprar departamento en Puerto Cancun hasta 2000000 MXN", undefined, lang);
    const positive = await ask("vista al mar", initial.state, lang, { properties: coastalProperties });
    const response = await ask(message, positive.state, lang, { properties: coastalProperties });
    assert.ok(!response.state.preferences.includes("sea_view"));
    assert.ok(response.needsClarification || response.state.preferences.includes("not_sea_view"), "Keep the negative requirement or clarify it; do not drop it");
    assert.equal(response.cards.length, 0);
    assert.equal(response.state.filters.max, 2000000);
    assert.equal(response.state.filters.currency, "MXN");
  }
});
