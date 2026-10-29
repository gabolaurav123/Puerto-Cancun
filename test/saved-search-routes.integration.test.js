"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const express = require("express");
const inventory = require("../inventory-contract");
const { savedCatalogQuery } = require("../saved-catalog-search");

const source = fs.readFileSync(require.resolve("../server.js"), "utf8");
const route = "/api/seller/saved-searches";
const purchase = { type: "Casa", operation: "sale", currency: "USD", max: 700000 };
const copy = (value) => JSON.parse(JSON.stringify(value));

function registration(method, path) {
  const start = source.indexOf(`app.${method}(${JSON.stringify(path)},`);
  assert.ok(start >= 0, `Missing ${method} ${path}`);
  const end = source.indexOf("\n});", start);
  assert.ok(end > start, `Missing registration end: ${path}`);
  return source.slice(start, end + "\n});".length);
}

// Run the actual route registrations and parser over loopback HTTP. Do not import
// server.js: authentication and persistence are isolated fixtures, never real services.
async function harness(t, { row = {}, exists = true, beforeDisable = () => {} } = {}) {
  const app = express();
  app.use(express.json());
  const stored = {
    id: "fixture-search", seller_id: "fixture-user", name: "Fixture", query_text: "Buy house under 700000 USD",
    filters: copy(purchase), alerts_enabled: false, email_enabled: false, whatsapp_enabled: false, consent_at: null, ...copy(row),
  };
  const writes = [], parserInputs = [];
  let inventoryReads = 0;
  vm.runInNewContext([
    registration("post", route), registration("patch", `${route}/:id`),
  ].join("\n"), {
    app,
    requireRole: (role) => {
      assert.equal(role, "seller");
      return (req, res, next) => {
        if (req.get("x-fixture-user") !== "fixture-user") return res.status(401).json({ error: "Fixture authentication required" });
        req.session = { user: { id: "fixture-user" } }; next();
      };
    },
    inventoryContract: inventory,
    savedCatalogQuery: (input, options) => {
      parserInputs.push(copy({ input, queryText: options.queryText }));
      return savedCatalogQuery(input, options);
    },
    getPublicProperties: async () => { inventoryReads += 1; return []; },
    uuid: () => "fixture-created",
    toSavedSearch: (value) => copy(value),
    query: async (sql, params) => {
      if (sql.startsWith("SELECT * FROM saved_searches WHERE id = $1 AND seller_id = $2")) {
        assert.deepEqual(Array.from(params), ["fixture-search", "fixture-user"]);
        return { rows: exists ? [copy(stored)] : [] };
      }
      if (/^INSERT INTO saved_searches/.test(sql)) {
        writes.push({ sql, params: copy(params) });
        return { rows: [{ id: params[0], seller_id: params[1], name: params[2], query_text: params[3], filters: JSON.parse(params[4]) }] };
      }
      if (/^UPDATE saved_searches SET\s+alerts_enabled = alerts_enabled AND \$1/.test(sql)) {
        assert.equal(params[3], "fixture-search"); assert.equal(params[4], "fixture-user");
        assert.match(sql, /email_enabled = email_enabled AND alerts_enabled AND \$1 AND \$2/);
        assert.match(sql, /whatsapp_enabled = whatsapp_enabled AND alerts_enabled AND \$1 AND \$3/);
        assert.match(sql, /WHERE id = \$4 AND seller_id = \$5/);
        assert.doesNotMatch(sql, /\b(?:name|query_text|filters|consent_at|alert_frequency)\s*=/);
        beforeDisable(stored);
        const flags = {
          alerts_enabled: stored.alerts_enabled && params[0],
          email_enabled: stored.email_enabled && stored.alerts_enabled && params[0] && params[1],
          whatsapp_enabled: stored.whatsapp_enabled && stored.alerts_enabled && params[0] && params[2],
        };
        writes.push({ kind: "disable-only", sql, params: copy(params) });
        Object.assign(stored, flags);
        return { rows: [copy(stored)] };
      }
      if (/^UPDATE saved_searches SET/.test(sql)) {
        assert.equal(params[7], "fixture-search"); assert.equal(params[8], "fixture-user");
        writes.push({ sql, params: copy(params) });
        return { rows: [{ ...copy(stored), name: params[0], query_text: params[1], filters: JSON.parse(params[2]), alerts_enabled: params[3] }] };
      }
      throw new Error(`Unexpected fixture SQL: ${sql}`);
    },
  }, { timeout: 1000 });
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeIdleConnections();
  }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    writes, parserInputs, stored, inventoryReads: () => inventoryReads,
    async send(method, body, authenticated = true) {
      const response = await fetch(origin + route + (method === "PATCH" ? "/fixture-search" : ""), {
        method, headers: { "content-type": "application/json", ...(authenticated ? { "x-fixture-user": "fixture-user" } : {}) },
        body: JSON.stringify(body),
      });
      return { status: response.status, data: await response.json() };
    },
  };
}

for (const method of ["POST", "PATCH"]) {
  for (const value of [null, "", "{\"max\":100}", [], [{ max: 100 }], false, true, 0, 42]) {
    test(`${method}: filters invalido ${JSON.stringify(value)} devuelve 400 sin escritura`, async (t) => {
      const h = await harness(t);
      const result = await h.send(method, { name: "Fixture", query: "Buy house", filters: value });
      assert.equal(result.status, 400);
      assert.match(result.data.error, /filtros|filters/i);
      assert.equal(h.writes.length, 0);
    });
  }

  for (const filters of [{ max: 100 }, { type: "invalido" }, { filters: "invalid" }, { bathrooms: 2 }]) {
    test(`${method}: objeto con criterios invalidos ${JSON.stringify(filters)} no se almacena`, async (t) => {
      const h = await harness(t);
      const result = await h.send(method, { name: "Fixture", query: "", filters });
      assert.equal(result.status, 400);
      assert.ok(result.data.error);
      assert.equal(h.writes.length, 0);
    });
  }

  for (const suffix of ["hasta 1 USD", "under 1 USD", "with sea view"]) {
    test(`${method}: requisito despues del caracter 600 (${suffix}) no se pierde`, async (t) => {
      const h = await harness(t);
      const query = "Buy house ".padEnd(600, " ") + suffix;
      assert.equal(query.indexOf(suffix), 600);
      const result = await h.send(method, { name: "Fixture", filters: {}, query });
      assert.equal(result.status, 400);
      assert.match(result.data.error, /600/);
      assert.equal(h.writes.length, 0);
      assert.ok(h.parserInputs.every((entry) => entry.queryText === query), "No parser call may receive a truncated prefix");
    });
  }

  test(`${method}: presupuesto justo antes del limite 600 se conserva completo`, async (t) => {
    const h = await harness(t);
    const suffix = "under 1 USD";
    const query = "Buy house ".padEnd(600 - suffix.length, " ") + suffix;
    assert.equal(query.length, 600);
    const result = await h.send(method, { name: "Fixture", filters: {}, query });
    assert.equal(result.status, method === "POST" ? 201 : 200);
    assert.equal(result.data.savedSearch.query_text, query);
    assert.equal(result.data.savedSearch.filters.max, 1);
    assert.equal(result.data.savedSearch.filters.currency, "USD");
    assert.equal(result.data.savedSearch.filters.operation, "sale");
    assert.equal(h.parserInputs[0].queryText, query);
    assert.equal(h.writes.length, 1);
  });

  test(`${method}: mas de 600 con espacios finales tampoco se recorta`, async (t) => {
    const h = await harness(t);
    const result = await h.send(method, { name: "Fixture", filters: {}, query: "Buy house under 1 USD".padEnd(601, " ") });
    assert.equal(result.status, 400);
    assert.equal(h.writes.length, 0);
  });

  for (const query of [null, {}, [], 123, false]) {
    test(`${method}: query no textual ${JSON.stringify(query)} devuelve 400`, async (t) => {
      const h = await harness(t);
      const result = await h.send(method, { name: "Fixture", filters: {}, query });
      assert.equal(result.status, 400);
      assert.equal(h.writes.length, 0);
    });
  }

  test(`${method}: filtros validos y texto conservan presupuesto`, async (t) => {
    const h = await harness(t);
    const query = "  Buy house under 600000 USD  ";
    const result = await h.send(method, { name: "Fixture", filters: purchase, query });
    assert.equal(result.status, method === "POST" ? 201 : 200);
    assert.equal(result.data.savedSearch.filters.max, 600000);
    assert.equal(result.data.savedSearch.query_text, query);
    assert.equal(h.parserInputs[0].queryText, query);
    assert.equal(result.data.savedSearch.filters.contractVersion, inventory.VERSION);
  });

  test(`${method}: middleware de rol sigue conectado`, async (t) => {
    const h = await harness(t);
    const result = await h.send(method, { name: "Fixture", filters: purchase }, false);
    assert.equal(result.status, 401);
    assert.equal(h.parserInputs.length, 0);
    assert.equal(h.writes.length, 0);
  });
}

test("POST: filters omitido permite intencion textual completa", async (t) => {
  const h = await harness(t);
  const result = await h.send("POST", { name: "Fixture", query: "Buy house under 500 USD" });
  assert.equal(result.status, 201);
  assert.equal(result.data.savedSearch.filters.max, 500);
});

test("POST: query omitido permite filtros validos", async (t) => {
  const h = await harness(t);
  const result = await h.send("POST", { name: "Fixture", filters: purchase });
  assert.equal(result.status, 201);
  assert.equal(result.data.savedSearch.query_text, "");
  assert.equal(result.data.savedSearch.filters.max, 700000);
});

test("PATCH: omitir filters conserva los existentes al validar query", async (t) => {
  const h = await harness(t);
  const result = await h.send("PATCH", { query: "Buy house under 500000 USD" });
  assert.equal(result.status, 200);
  assert.deepEqual(h.parserInputs[0].input, purchase);
  assert.equal(result.data.savedSearch.filters.max, 500000);
});

test("PATCH: omitir query conserva el texto completo almacenado", async (t) => {
  const query_text = "  Buy house under 700000 USD  ";
  const h = await harness(t, { row: { query_text } });
  const result = await h.send("PATCH", { filters: purchase });
  assert.equal(result.status, 200);
  assert.equal(h.parserInputs[0].queryText, query_text);
  assert.equal(result.data.savedSearch.query_text, query_text);
});

test("PATCH: nombre solamente tambien valida criterios efectivos", async (t) => {
  const h = await harness(t);
  const result = await h.send("PATCH", { name: "Renamed" });
  assert.equal(result.status, 200);
  assert.equal(h.parserInputs.length, 1);
  assert.equal(result.data.savedSearch.filters.max, 700000);
});

test("PATCH: legacy largo no pierde presupuesto en cambio de nombre", async (t) => {
  const query_text = "Buy house ".padEnd(600, " ") + "under 1 USD";
  const h = await harness(t, { row: { query_text } });
  const before = copy(h.stored);
  const result = await h.send("PATCH", { name: "Renamed" });
  assert.equal(result.status, 400);
  assert.match(result.data.error, /600/);
  assert.equal(h.writes.length, 0);
  assert.deepEqual(h.stored, before);
});

for (const filters of [null, "invalid", [], { max: 100 }]) {
  test(`PATCH: filtros legacy invalidos ${JSON.stringify(filters)} se bloquean sin reemplazarlos`, async (t) => {
    const h = await harness(t, { row: { filters, query_text: "" } });
    const result = await h.send("PATCH", { name: "Renamed" });
    assert.equal(result.status, 400);
    assert.equal(h.writes.length, 0);
  });
}

test("PATCH: criterios invalidos no activan alertas", async (t) => {
  const h = await harness(t, { row: { query_text: "Buy house with sea view" } });
  const result = await h.send("PATCH", { alertsEnabled: true });
  assert.equal(result.status, 400);
  assert.equal(h.writes.length, 0);
});

test("PATCH: query valido explicito permite corregir texto legacy largo", async (t) => {
  const h = await harness(t, { row: { query_text: "Buy house ".padEnd(600, " ") + "under 1 USD" } });
  const result = await h.send("PATCH", { query: "Buy house under 1 USD" });
  assert.equal(result.status, 200);
  assert.equal(result.data.savedSearch.filters.max, 1);
  assert.equal(result.data.savedSearch.query_text, "Buy house under 1 USD");
});

test("PATCH: pertenencia y 404 no cambian", async (t) => {
  const h = await harness(t, { exists: false });
  const result = await h.send("PATCH", { name: "Renamed" });
  assert.equal(result.status, 404);
  assert.equal(h.writes.length, 0);
  assert.equal(h.inventoryReads(), 0);
});

const invalidLegacy = {
  filters: { maxPrice: 500000, currency: "USD" }, query_text: "", alerts_enabled: true,
  email_enabled: true, whatsapp_enabled: true, alert_frequency: "legacy-frequency", consent_at: null,
};

for (const body of [
  { alertsEnabled: false }, { emailEnabled: false }, { whatsappEnabled: false },
  { emailEnabled: false, whatsappEnabled: false },
  { alertsEnabled: false, emailEnabled: false },
  { alertsEnabled: false, whatsappEnabled: false },
  { alertsEnabled: false, emailEnabled: false, whatsappEnabled: false },
]) {
  test(`PATCH: opt-out legacy ${JSON.stringify(body)} no valida ni reescribe criterios`, async (t) => {
    const h = await harness(t, { row: invalidLegacy });
    const before = copy(h.stored);
    const result = await h.send("PATCH", body);
    assert.equal(result.status, 200);
    assert.equal(h.parserInputs.length, 0);
    assert.equal(h.inventoryReads(), 0);
    assert.equal(h.writes.length, 1);
    assert.equal(h.writes[0].kind, "disable-only");
    const flags = {
      alerts_enabled: body.alertsEnabled !== false,
      email_enabled: body.alertsEnabled !== false && body.emailEnabled !== false,
      whatsapp_enabled: body.alertsEnabled !== false && body.whatsappEnabled !== false,
    };
    assert.deepEqual(result.data.savedSearch, { ...before, ...flags });
    assert.deepEqual(h.stored, { ...before, ...flags });
  });
}

test("PATCH: opt-out conserva byte a byte texto legacy largo y presupuesto", async (t) => {
  const query_text = "Buy house ".padEnd(600, " ") + "under 1 USD";
  const h = await harness(t, { row: { ...invalidLegacy, query_text } });
  const result = await h.send("PATCH", { alertsEnabled: false });
  assert.equal(result.status, 200);
  assert.equal(result.data.savedSearch.query_text, query_text);
  assert.deepEqual(result.data.savedSearch.filters, invalidLegacy.filters);
  assert.equal(h.parserInputs.length, 0);
});

for (const filters of [null, "invalid", []]) {
  test(`PATCH: opt-out permite silenciar legacy malformado ${JSON.stringify(filters)}`, async (t) => {
    const h = await harness(t, { row: { ...invalidLegacy, filters } });
    const result = await h.send("PATCH", { alertsEnabled: false });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.savedSearch.filters, filters);
    assert.equal(h.parserInputs.length, 0);
  });
}

test("PATCH: opt-out idempotente no reactiva canales previamente apagados", async (t) => {
  const h = await harness(t, { row: { ...invalidLegacy, alerts_enabled: false, email_enabled: false, whatsapp_enabled: false } });
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await h.send("PATCH", { emailEnabled: false });
    assert.equal(result.status, 200);
    for (const flag of ["alerts_enabled", "email_enabled", "whatsapp_enabled"]) assert.equal(result.data.savedSearch[flag], false);
  }
  assert.equal(h.parserInputs.length, 0);
});

test("PATCH: SQL de opt-out no revive flags apagados concurrentemente", async (t) => {
  const h = await harness(t, { row: invalidLegacy, beforeDisable(stored) {
    stored.alerts_enabled = false; stored.email_enabled = false; stored.whatsapp_enabled = false;
  } });
  const result = await h.send("PATCH", { emailEnabled: false });
  assert.equal(result.status, 200);
  for (const flag of ["alerts_enabled", "email_enabled", "whatsapp_enabled"]) assert.equal(result.data.savedSearch[flag], false);
});

for (const body of [
  { alertsEnabled: true }, { emailEnabled: true }, { whatsappEnabled: true },
  { alertsEnabled: true, emailEnabled: false }, { alertsEnabled: false, emailEnabled: true },
  { alertsEnabled: "false" }, { alertsEnabled: 0 }, { alertsEnabled: null }, {},
  { alertsEnabled: false, name: "Changed" }, { alertsEnabled: false, consent: true },
  { alertsEnabled: false, filters: "invalid" }, { alertsEnabled: false, filters: [] },
  { alertsEnabled: false, query: "Buy house ".padEnd(600, " ") + "under 1 USD" },
]) {
  test(`PATCH: payload mixto o activacion no evade validacion ${JSON.stringify(body).slice(0, 90)}`, async (t) => {
    const h = await harness(t, { row: { ...invalidLegacy, consent_at: "2026-10-29T00:00:00Z" } });
    const before = copy(h.stored);
    const result = await h.send("PATCH", body);
    assert.equal(result.status, 400);
    assert.equal(h.writes.length, 0);
    assert.deepEqual(h.stored, before);
  });
}

test("PATCH: filtros explicitos con opt-out siguen el parser completo, no la excepcion", async (t) => {
  const h = await harness(t, { row: invalidLegacy });
  const result = await h.send("PATCH", { alertsEnabled: false, filters: { ...purchase, max: 500000 } });
  assert.equal(result.status, 200);
  assert.equal(h.parserInputs.length, 1);
  assert.equal(h.inventoryReads(), 1);
  assert.notEqual(h.writes[0].kind, "disable-only");
  assert.equal(result.data.savedSearch.filters.max, 500000);
});

test("PATCH: opt-out no omite autenticacion ni pertenencia", async (t) => {
  const h = await harness(t, { row: invalidLegacy, exists: false });
  assert.equal((await h.send("PATCH", { alertsEnabled: false }, false)).status, 401);
  assert.equal((await h.send("PATCH", { alertsEnabled: false })).status, 404);
  assert.equal(h.writes.length, 0);
});
