const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const server = fs.readFileSync(require.resolve("../server"), "utf8");
const start = server.indexOf('app.post("/api/admin/blog-automation/run"');
const route = server.slice(start, server.indexOf("\n});", start) + 4);

async function invoke(run, overrides = {}) {
  let handler;
  let executions = 0;
  let statusCode = 200;
  let payload;
  vm.runInNewContext(route, {
    Date,
    app: { post: (_path, _guard, fn) => { handler = fn; } },
    requireRole(role) { assert.equal(role, "admin"); return null; },
    dailyBlogService: {
      getStatus: async () => ({ enabled: true, configured: true, today: "2026-11-03", manualAttemptLimit: 4, runs: run ? [run] : [], ...overrides }),
      run: async (options) => { assert.equal(options.manual, true); executions++; },
    },
  });
  const response = { status(code) { statusCode = code; return response; }, json(value) { payload = value; return response; } };
  await handler({}, response, (error) => { throw error; });
  return { statusCode, payload, executions };
}

test("admin can request the single remaining manual recovery attempt", async () => {
  const result = await invoke({ run_date: new Date("2026-11-03T00:00:00Z"), attempts: 3, status: "skipped" });
  assert.equal(result.statusCode, 202);
  assert.equal(result.executions, 1);
});

test("exhausted attempts return an honest error without starting more generation", async () => {
  const result = await invoke({ run_date: "2026-11-03T00:00:00Z", attempts: 4, status: "skipped" });
  assert.equal(result.statusCode, 429);
  assert.match(result.payload.error, /límite de intentos/);
  assert.equal(result.executions, 0);
});

test("published edition cannot be generated again and previous dates do not block today", async () => {
  const published = await invoke({ run_date: "2026-11-03", attempts: 1, status: "published" });
  assert.equal(published.statusCode, 409);
  assert.equal(published.executions, 0);
  const yesterday = await invoke({ run_date: "2026-11-02", attempts: 4, status: "skipped" });
  assert.equal(yesterday.statusCode, 202);
  assert.equal(yesterday.executions, 1);
});

test("unconfigured automation does not start a provider operation", async () => {
  const result = await invoke(null, { configured: false });
  assert.equal(result.statusCode, 503);
  assert.equal(result.executions, 0);
});
