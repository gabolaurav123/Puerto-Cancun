const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const admin = require("../admin-inventory-ui");
const server = fs.readFileSync(require.resolve("../server.js"), "utf8");
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const extract = (source, name) => source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0];
const now = Date.parse("2026-10-29T12:00:00Z");
const ago = (days) => new Date(now - days * 86400000).toISOString();

test("availability uses verification only, per-entity boundaries and honest unknown/invalid states", () => {
  const policy = { properties: 30, developments: 60 };
  const base = { id: "unit", type: "Casa", status: "active", updatedAt: ago(0), createdAt: ago(500) };
  assert.equal(admin.availability(base, policy, now).status, "never");
  assert.equal(admin.availability({ ...base, lastVerifiedAt: ago(30) }, policy, now).status, "overdue");
  assert.equal(admin.availability({ ...base, lastVerifiedAt: ago(29) }, policy, now).status, "reviewed");
  assert.equal(admin.availability({ ...base, type: "Desarrollo", lastVerifiedAt: ago(30) }, policy, now).status, "reviewed");
  assert.equal(admin.availability({ ...base, publicationSection: "developments", lastVerifiedAt: ago(60) }, policy, now).status, "overdue");
  for (const value of ["invalid", ago(-1)]) assert.equal(admin.availability({ ...base, lastVerifiedAt: value }, policy, now).status, "invalid");
  assert.equal(admin.availability({ ...base, lastVerifiedAt: ago(100) }, null, now).status, "unknown");
  for (const status of ["draft", "archived"]) assert.equal(admin.availability({ ...base, status }, policy, now).status, "excluded");
  const sold = { ...base, status: "sold", lastVerifiedAt: ago(100), verifiedBy: "reviewer" };
  assert.match(admin.availability(sold, policy, now).label, /reviewer/);
  assert.equal(sold.status, "sold");
});

test("pending cohorts are exact, public active only, and editing never clears them", () => {
  const items = [
    { id: "never", status: "active", isPublic: true, updatedAt: new Date().toISOString() },
    { id: "stale", status: "active", isPublic: true, lastVerifiedAt: "2020-01-01", updatedAt: new Date().toISOString() },
    ...["draft", "archived", "sold", "rented"].map((status) => ({ id: status, status, isPublic: true })),
    { id: "private", status: "active", isPublic: false },
  ];
  const before = JSON.stringify(items);
  const filters = { status: "all", reviewPolicy: { properties: 90, developments: 90 } };
  assert.deepEqual(admin.filterListings(items, { ...filters, availability: "never" }, "properties").map((p) => p.id), ["never"]);
  assert.deepEqual(admin.filterListings(items, { ...filters, availability: "overdue", ids: ["stale"] }, "properties").map((p) => p.id), ["stale"]);
  assert.equal(JSON.stringify(items), before);
});

function route(method, query, env = {}) {
  let handler;
  const source = server.match(new RegExp(`app\\.${method}\\("/api/admin/properties/:id/verify"[\\s\\S]*?\\n\\}\\);`))[0];
  vm.runInNewContext(source, { app: { [method]: (_path, _guard, fn) => { handler = fn; } }, requireRole: (role) => { assert.equal(role, "admin"); }, query, uuid: () => "audit-id", toProperty: (row) => row, invalidatePublicPropertyCache() {}, process: { env } });
  return { handler, source };
}
function response() {
  return { code: 200, body: null, headers: {}, status(code) { this.code = code; return this; }, set(key, value) { this.headers[key] = value; return this; }, json(body) { this.body = body; } };
}

test("GET verification policy is authenticated, read-only and validates environment defaults", () => {
  for (const [env, expected] of [[{}, [90, 90]], [{ PROPERTY_REVIEW_DAYS: "30", DEVELOPMENT_REVIEW_DAYS: "120" }, [30, 120]], [{ PROPERTY_REVIEW_DAYS: "0", DEVELOPMENT_REVIEW_DAYS: "Infinity" }, [90, 90]], [{ PROPERTY_REVIEW_DAYS: "2.5", DEVELOPMENT_REVIEW_DAYS: "3651" }, [90, 90]]]) {
    const api = route("get", () => assert.fail("policy touched DB"), env);
    const res = response();
    api.handler({}, res);
    assert.deepEqual(Object.values(res.body.reviewPolicy), expected);
    assert.equal(res.headers["Cache-Control"], "no-store");
  }
});

test("POST requires explicit confirmation and uses one atomic update/audit without changing edit or commercial status", async () => {
  const calls = [];
  const stored = { id: "unit", status: "sold", updated_at: "original-edit", last_verified_at: "database-time", verified_by: "admin" };
  const api = route("post", async (sql, params) => { calls.push({ sql, params }); return { rows: [stored] }; });
  for (const body of [undefined, {}, { confirmAvailability: "true" }, { confirmAvailability: false }]) {
    const res = response();
    await api.handler({ body }, res, (error) => { throw error; });
    assert.equal(res.code, 400);
    assert.equal(calls.length, 0);
  }
  const res = response();
  await api.handler({ body: { confirmAvailability: true, lastVerifiedAt: "forged", status: "active" }, params: { id: "unit" }, session: { user: { id: "admin" } } }, res, (error) => { throw error; });
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /WITH verified AS[\s\S]+INSERT INTO activity_logs[\s\S]+FROM verified/);
  assert.match(calls[0].sql, /last_verified_at = NOW\(\), verified_by = \$2/);
  assert.match(calls[0].sql, /'verifiedAt', last_verified_at/);
  assert.doesNotMatch(calls[0].sql, /updated_at\s*=|status\s*=|is_public\s*=/);
  assert.deepEqual(Array.from(calls[0].params), ["unit", "admin", "audit-id"]);
  assert.equal(res.body.property.status, "sold");
  assert.equal(res.body.property.updated_at, "original-edit");
});

test("POST rejects draft/archive without verifying them, distinguishes 404 and forwards atomic failures", async () => {
  for (const exists of [false, true]) {
    const queries = [];
    const api = route("post", async (sql) => { queries.push(sql); return { rows: queries.length === 1 ? [] : exists ? [{ id: "unit" }] : [] }; });
    const res = response();
    await api.handler({ body: { confirmAvailability: true }, params: { id: "unit" }, session: { user: { id: "admin" } } }, res, (error) => { throw error; });
    assert.equal(res.code, exists ? 409 : 404);
    assert.match(queries[0], /NOT IN \('draft', 'archived'\)/);
  }
  const error = new Error("audit insertion failed");
  const api = route("post", async () => { throw error; });
  let forwarded;
  const res = response();
  await api.handler({ body: { confirmAvailability: true }, params: { id: "unit" }, session: { user: { id: "admin" } } }, res, (value) => { forwarded = value; });
  assert.equal(forwarded, error);
  assert.equal(res.body, null);
});

test("Copilot stale query includes never reviewed, excludes drafts and never substitutes updated_at", async () => {
  const captured = [];
  const handler = vm.runInNewContext(`${extract(server, "getCopilotOperationalResult")}\ngetCopilotOperationalResult`, { process: { env: { PROPERTY_REVIEW_DAYS: "14", DEVELOPMENT_REVIEW_DAYS: "45" } }, query: async (sql, params) => { captured.push({ sql, params }); return { rows: [] }; }, getIntegrationHealth: async () => [] });
  await handler("prioridades de hoy");
  const stale = captured.find((call) => call.sql.includes("WITH review"));
  assert.deepEqual(Array.from(stale.params), [14, 45]);
  assert.match(stale.sql, /last_verified_at IS NULL/);
  assert.match(stale.sql, /status = 'active'/);
  assert.match(stale.sql, /publication_section = 'developments' OR type = 'Desarrollo'/);
  assert.match(stale.sql, /last_verified_at <= NOW\(\) - review_days/);
  assert.doesNotMatch(stale.sql, /COALESCE\(last_verified_at|INTERVAL '90 days'/);
});

test("verify handler confirms before API, prevents duplicates and preserves state on cancellation/failure", async () => {
  for (const [status, confirmed, fails, expectedCalls] of [["active", false, false, 0], ["draft", true, false, 0], ["archived", true, false, 0], ["sold", true, false, 1], ["active", true, true, 1]]) {
    const state = { session: { id: "admin" }, properties: [{ id: "unit", status, updatedAt: "original" }] };
    let calls = 0, renders = 0;
    const handler = vm.runInNewContext(`${extract(app, "verifyPropertyFreshness")}\nverifyPropertyFreshness`, { state, canManageListings: () => true, confirmAction: async () => confirmed, showToast() {}, renderAdminListings: () => { renders++; }, api: async (_url, options) => { calls++; assert.equal(options.body.confirmAvailability, true); assert.equal(options.retry, false); if (fails) throw new Error("offline"); return { property: { lastVerifiedAt: "server-date", verifiedBy: "admin" } }; } });
    await Promise.all([handler("unit"), handler("unit")]);
    assert.equal(calls, expectedCalls);
    assert.equal(state.properties[0].status, status);
    assert.equal(state.properties[0].updatedAt, "original");
    assert.equal(renders, expectedCalls && !fails ? 1 : 0);
    if (state.availabilityVerifying) assert.equal(state.availabilityVerifying.size, 0);
  }
});
