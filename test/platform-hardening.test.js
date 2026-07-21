const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createRateLimiter,
  isValidEmail,
  normalizePhone,
  requestContext,
  resolveReleaseInfo,
  sameOriginMutationGuard,
  securityHeaders,
  validateRuntimeConfig,
} = require("../platform-utils");
const { runMigration } = require("../db/migrations");

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    locals: {},
    set(name, value) {
      if (typeof name === "object") Object.assign(this.headers, name);
      else this.headers[name] = value;
      return this;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

test("la versión desplegada se resuelve desde el commit del proveedor", () => {
  assert.deepEqual(resolveReleaseInfo({ NODE_ENV: "production", RELEASE_SHA: "abcdef1234567890" }, "1.2.3"), {
    version: "1.2.3",
    release: "abcdef1234567890",
    shortRelease: "abcdef123456",
    environment: "production",
  });
});

test("la configuración productiva rechaza secretos inseguros", () => {
  const invalid = validateRuntimeConfig({ NODE_ENV: "production", SESSION_SECRET: "change-me", ADMIN_USER: "admin" });
  assert.equal(invalid.errors.length, 2);
  const valid = validateRuntimeConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://example",
    SESSION_SECRET: "a".repeat(48),
    ADMIN_USER: "admin",
    ADMIN_PASSWORD: "a-secure-admin-password",
    WHATSAPP_AUTH_SECRET: "b".repeat(48),
  });
  assert.deepEqual(valid.errors, []);
});

test("correo y teléfono se validan antes de crear usuarios o leads", () => {
  assert.equal(isValidEmail("cliente@example.com"), true);
  assert.equal(isValidEmail("cliente@invalid"), false);
  assert.equal(normalizePhone("+52 998 216 6563"), "529982166563");
  assert.equal(normalizePhone("123"), "");
});

test("las respuestas incluyen seguridad, versión e identificador de soporte", () => {
  const req = { secure: true, get: () => "", socket: {} };
  const res = mockResponse();
  let calls = 0;
  requestContext({ version: "1.0.0", shortRelease: "abc123" })(req, res, () => { calls += 1; });
  securityHeaders()(req, res, () => { calls += 1; });
  assert.equal(calls, 2);
  assert.match(res.headers["X-Request-Id"], /^[0-9a-f-]{36}$/);
  assert.equal(res.headers["X-App-Release"], "abc123");
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
  assert.match(res.headers["Strict-Transport-Security"], /max-age=/);
});

test("las mutaciones entre orígenes se bloquean", () => {
  const req = {
    method: "POST",
    requestId: "request-test",
    get(name) {
      return { "Sec-Fetch-Site": "cross-site", Origin: "https://evil.example", Host: "www.puertocancun.center" }[name] || "";
    },
  };
  const res = mockResponse();
  let nextCalled = false;
  sameOriginMutationGuard()(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.requestId, "request-test");
});

test("el límite de solicitudes devuelve tiempo de reintento", () => {
  const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
  const req = { ip: "127.0.0.1", socket: {} };
  for (let index = 0; index < 2; index += 1) {
    const res = mockResponse();
    let called = false;
    limiter(req, res, () => { called = true; });
    assert.equal(called, true);
  }
  const blocked = mockResponse();
  limiter(req, blocked, () => assert.fail("no debe continuar"));
  assert.equal(blocked.statusCode, 429);
  assert.ok(Number(blocked.headers["Retry-After"]) >= 1);
});

test("una migración versionada se ejecuta una sola vez", async () => {
  const applied = new Set();
  const client = {
    async query(sql, params = []) {
      if (/SELECT 1 FROM schema_migrations/.test(sql)) return { rows: applied.has(params[0]) ? [{ exists: 1 }] : [] };
      if (/INSERT INTO schema_migrations/.test(sql)) applied.add(params[0]);
      return { rows: [] };
    },
  };
  let executions = 0;
  const migration = { id: "0002-test", description: "Test", up: async () => { executions += 1; } };
  assert.equal(await runMigration(client, migration), true);
  assert.equal(await runMigration(client, migration), false);
  assert.equal(executions, 1);
});

test("el servidor expone versión y cabeceras sin depender de PostgreSQL", async (context) => {
  const { app } = require("../server");
  const server = app.listen(0, "127.0.0.1");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/version`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.service, "puerto-cancun-center");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(response.headers.get("x-request-id"));

  const publicResponse = await fetch(`http://127.0.0.1:${address.port}/`);
  const publicHtml = await publicResponse.text();
  assert.equal(publicResponse.status, 200);
  assert.match(publicHtml, /Puerto Cancún Center/);

  const privateResponse = await fetch(`http://127.0.0.1:${address.port}/api/admin/stats`);
  assert.equal(privateResponse.status, 503);

  const configResponse = await fetch(`http://127.0.0.1:${address.port}/api/config`);
  const config = await configResponse.json();
  assert.equal(config.platform.databaseReady, false);
  assert.equal(config.platform.databaseStatus, "unavailable");

  const loginResponse = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "diagnostic@example.invalid", password: "diagnostic-only" }),
  });
  const loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status, 503);
  assert.equal(loginPayload.code, "DATABASE_UNAVAILABLE");
  assert.match(loginPayload.error, /cuentas y datos permanecen guardados/);
});
