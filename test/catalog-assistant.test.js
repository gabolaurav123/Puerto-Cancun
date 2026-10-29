"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { interpretCatalogSearch } = require("../catalog-search");
const inventory = require("../inventory-contract");
const source = fs.readFileSync(path.join(__dirname, "../catalog-assistant.js"), "utf8");
const copy = (value) => JSON.parse(JSON.stringify(value));

class Element {
  constructor(tag = "div") { this.tag = tag; this.children = []; this.listeners = {}; this.attributes = {}; this.hidden = true; this.disabled = false; this.value = ""; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return (this.text || "") + this.children.map((child) => child.textContent).join(" "); }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key] ?? null; }
  replaceChildren(...children) { this.text = ""; this.children = children; }
  append(...children) { this.children.push(...children); }
  addEventListener(name, listener) { this.listeners[name] = listener; }
}

// Same deterministic forwarding as the existing endpoint, without network or inventory records.
function endpoint(text, context) {
  const result = interpretCatalogSearch(text, context);
  return { ...result, needsChoice: result.clarificationRequired, errors: [], url: "/en/properties?fixture=1" };
}

function harness({ lang = "en", catalog = true, api = endpoint, search = "" } = {}) {
  const requests = [], navigations = [], listeners = {};
  const document = {
    documentElement: { lang },
    querySelector: () => catalog ? {} : null,
    createElement: (tag) => new Element(tag),
    addEventListener: (name, listener) => { listeners[name] = listener; },
  };
  const window = {
    PccInventory: inventory,
    PccCatalog: { navigate: async (url) => { navigations.push(url); } },
    api: async (url, options) => { requests.push({ url, ...options }); return api(options.body.query, copy(options.body.filters), requests.length); },
  };
  const location = { origin: "https://catalog.invalid", search, assign: (url) => { navigations.push(url); } };
  vm.runInNewContext(source, { window, document, location, AbortController, URL, URLSearchParams });
  return { window, document, requests, navigations, listeners, status: new Element(), button: new Element("button"), assistant: window.PccCatalogAssistant };
}

for (const language of ["es", "en", "en-US", "ES-mx"]) {
  test(`UI y endpoint reciben idioma ${language}`, async () => {
    const h = harness({ lang: language });
    await h.assistant.search("Comprar casa hasta 700000", h.status, h.button);
    const expected = language.slice(0, 2).toLowerCase();
    assert.equal(h.requests[0].body.lang, expected);
    assert.equal(h.requests[0].body.language, expected);
    assert.equal(h.requests[0].body.filters.language, expected);
    assert.match(h.status.textContent, expected === "en" ? /Please clarify.*Choose a currency/s : /Necesitamos precisar.*Elige una moneda/s);
    assert.equal(h.button.disabled, false);
    assert.equal(h.status.attributes.role, "status");
    assert.equal(h.status.hidden, false);
  });
}

test("search conserva tres argumentos y acepta cuarto options language/lang", async () => {
  const h = harness({ lang: "es" });
  await h.assistant.search("Buy under 700000", h.status, h.button, { lang: "en" });
  assert.equal(h.requests[0].body.lang, "en");
  await h.assistant.search("USD", h.status, h.button, { language: "es-MX" });
  assert.equal(h.requests[1].body.lang, "es");
  assert.equal(h.navigations.length, 1);
});

test("vista y rutas sobreviven respuestas USD/buy con envelope serializable", async () => {
  const h = harness();
  await h.assistant.search("House with sea view within 20 minutes of the airport under 700000", h.status, h.button);
  await h.assistant.search("USD", h.status, h.button);
  await h.assistant.search("buy", h.status, h.button);
  assert.equal(h.navigations.length, 0);
  assert.equal(h.requests[2].body.filters.filters.currency, "USD");
  assert.equal(h.requests[2].body.filters.filters.max, 700000);
  assert.deepEqual(copy(h.requests[2].body.filters.conversation.pending.map((item) => item.code)), ["travel_time", "sea_view"]);
  assert.match(h.status.textContent, /Sea views.*Travel time|Travel time.*Sea views/);
  assert.doesNotMatch(h.status.textContent, /Choose a currency|Choose purchase or rent/);
});

test("elegir moneda simple sigue navegando sin obligar reinicio", async () => {
  const h = harness();
  await h.assistant.search("Buy house under 700000", h.status, h.button);
  await h.assistant.search("USD", h.status, h.button);
  assert.equal(h.navigations.length, 1);
  assert.equal(h.requests[1].retry, false);
  assert.equal(h.requests[1].timeoutMs, 15000);
});

test("requisitos pendientes bloquean incluso sin needsChoice", async () => {
  const h = harness({ api: () => ({ filters: {}, conversation: { version: 1, language: "en", pending: [{ code: "sea_view", sources: [] }] }, warnings: [], url: "/en/properties" }) });
  await h.assistant.search("Sea view", h.status, h.button);
  assert.equal(h.navigations.length, 0);
  assert.match(h.status.textContent, /Confirm the pending requirements/);
});

test("respuesta que pierde estado no navega y permite reset", async () => {
  const h = harness({ api: (text, previous, count) => count === 1 ? endpoint(text, previous) : { filters: {}, errors: [], url: "/en/properties" } });
  await h.assistant.search("Buy house with sea view", h.status, h.button);
  await h.assistant.search("USD", h.status, h.button);
  assert.equal(h.navigations.length, 0);
  assert.match(h.status.textContent, /Clarification context is missing/);
  const restart = h.status.children.find((child) => child.tag === "button");
  assert.ok(restart);
  restart.listeners.click();
  assert.equal(h.status.textContent, "");
});

test("estado corrupto en respuesta bloquea", async () => {
  const h = harness({ api: (text, previous, count) => count === 1 ? { filters: {}, conversation: { version: 7 }, url: "/en/properties" } : endpoint(text, previous) });
  await h.assistant.search("Buy", h.status, h.button);
  assert.equal(h.navigations.length, 0);
  assert.match(h.status.textContent, /context is missing/);
  await h.assistant.search("USD", h.status, h.button);
  assert.equal(h.navigations.length, 0);
  assert.match(h.status.textContent, /context is incomplete or invalid/);
});

test("boton reiniciar descarta pendiente pero conserva filtros actuales URL", async () => {
  const h = harness({ search: "?type=Casa&bounds=-87,20,-86,22" });
  await h.assistant.search("Sea view", h.status, h.button);
  h.status.children.find((child) => child.tag === "button").listeners.click();
  await h.assistant.search("Buy", h.status, h.button);
  assert.equal(h.requests[1].body.filters.conversation, undefined);
  assert.equal(h.requests[1].body.filters.filters.type, "Casa");
  assert.deepEqual(copy(h.requests[1].body.filters.filters.bounds), [-87, 20, -86, 22]);
  assert.equal(h.navigations.length, 1);
});

test("reset aborta peticion, restaura boton y descarta respuesta tardia", async () => {
  let resolve;
  const h = harness({ api: () => new Promise((done) => { resolve = done; }) });
  const work = h.assistant.search("Buy", h.status, h.button);
  assert.equal(h.button.disabled, true);
  h.assistant.reset();
  assert.equal(h.requests[0].signal.aborted, true);
  assert.equal(h.button.disabled, false);
  resolve(endpoint("Buy", {}));
  await work;
  assert.equal(h.navigations.length, 0);
  assert.equal(h.status.textContent, "");
});

test("respuesta anterior no pisa estado ni navega despues de nueva peticion", async () => {
  let resolve;
  const h = harness({ api: (text, previous, count) => count === 1 ? new Promise((done) => { resolve = done; }) : endpoint(text, previous) });
  const first = h.assistant.search("Buy", h.status, h.button);
  const secondButton = new Element("button");
  await h.assistant.search("House with sea view", h.status, secondButton);
  assert.equal(h.button.disabled, false);
  resolve(endpoint("Buy", {}));
  await first;
  assert.equal(h.navigations.length, 0);
  assert.match(h.status.textContent, /Sea views/);
});

test("reset invalida tambien un error tardio", async () => {
  let reject;
  const h = harness({ api: () => new Promise((_, fail) => { reject = fail; }) });
  const work = h.assistant.search("Buy", h.status, h.button);
  h.assistant.reset();
  reject(new Error("obsolete failure"));
  await work;
  assert.equal(h.status.textContent, "");
});

test("fuera del catalogo navega misma procedencia sin PccCatalog", async () => {
  const h = harness({ catalog: false });
  await h.assistant.search("Buy house", h.status, h.button);
  assert.deepEqual(h.navigations, ["https://catalog.invalid/en/properties?fixture=1"]);
});

test("URL ausente o externa no navega", async () => {
  for (const url of [undefined, "", "https://untrusted.invalid/"]) {
    const h = harness({ api: () => ({ filters: {}, url }) });
    await h.assistant.search("Buy", h.status, h.button);
    assert.equal(h.navigations.length, 0);
    assert.match(h.status.textContent, /Invalid catalog destination/);
  }
});

test("warnings usan textContent, nunca HTML", async () => {
  const h = harness({ api: () => ({ needsChoice: true, filters: {}, warnings: ["<img src=x onerror=alert(1)>"], errors: [] }) });
  await h.assistant.search("Buy", h.status, h.button);
  assert.equal(h.status.children.find((child) => child.tag === "p").textContent, "<img src=x onerror=alert(1)>");
});

test("submit delegado respeta idioma del formulario", async () => {
  const h = harness({ lang: "es" });
  const form = new Element("form");
  form.setAttribute("lang", "en");
  form.matches = (selector) => selector === "[data-catalog-assistant]";
  form.elements = { query: { value: "  Buy house under 700000  " } };
  form.querySelector = (selector) => selector === "[data-search-status]" ? h.status : h.button;
  let prevented = false;
  h.listeners.submit({ target: form, preventDefault() { prevented = true; } });
  await new Promise((done) => setImmediate(done));
  assert.equal(prevented, true);
  assert.equal(h.requests[0].body.query, "Buy house under 700000");
  assert.equal(h.requests[0].body.lang, "en");
});
