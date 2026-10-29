const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const { verifyDeployment } = require("../scripts/deploy-smoke");

const EXPECTED = "aaaaaaaaaaaa", OLD = "bbbbbbbbbbbb";
const options = { baseUrl: "https://deploy.example.invalid", expectedAssetVersion: EXPECTED, timeoutMs: 50, intervalMs: 10, requestTimeoutMs: 20 };
function harness(sequence) {
  let time = 0, index = -1;
  const requests = [], logs = [];
  return {
    requests, logs,
    dependencies: {
      now: () => time, sleep: async (ms) => { time += ms; }, log: (line) => logs.push(line),
      fetch: async (url, init) => {
        url = new URL(url);
        requests.push({ url, init });
        if (url.pathname === "/ready") index++;
        const step = sequence[Math.min(index, sequence.length - 1)];
        if (step.error) throw new Error(step.error);
        const ready = url.pathname === "/ready";
        return { status: ready ? step.readyStatus ?? 200 : step.versionStatus ?? 200, json: async () => {
          if (step.invalidJson && !ready) throw new Error("invalid JSON");
          return ready ? { ok: step.ready !== false, databaseReady: step.ready !== false } : { assetVersion: step.version, databaseReady: step.versionReady !== false, sensitiveField: "must-not-log" };
        } };
      },
    },
  };
}

test("ready old deployment cannot pass; mismatch retries until two consecutive expected versions", async () => {
  const fake = harness([{ version: OLD }, { version: EXPECTED }, { version: OLD }, { version: EXPECTED }, { version: EXPECTED }]);
  const result = await verifyDeployment(options, fake.dependencies);
  assert.deepEqual(result, { assetVersion: EXPECTED, attempts: 5, consecutiveMatches: 2 });
  assert.equal(fake.requests.length, 10);
  const keys = fake.requests.filter((request) => request.url.pathname === "/api/version").map((request) => request.url.searchParams.get("_deploy_check"));
  assert.equal(new Set(keys).size, 5);
  for (const { init } of fake.requests) {
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    assert.equal(init.headers["Cache-Control"], "no-cache, no-store");
    assert.ok(init.signal instanceof AbortSignal);
  }
  assert.doesNotMatch(fake.logs.join("\n"), /must-not-log/);
});

test("permanent mismatch is bounded and reports failure, never readiness-only success", async () => {
  const fake = harness([{ version: OLD }]);
  await assert.rejects(verifyDeployment(options, fake.dependencies), (error) => {
    assert.equal(error.code, "DEPLOY_VERIFICATION_TIMEOUT");
    assert.equal(error.attempts, 5);
    assert.match(error.message, /expected assetVersion aaaaaaaaaaaa/);
    return true;
  });
  assert.equal(fake.requests.length, 10);
});

test("not-ready, HTTP failures, invalid JSON, missing fingerprints and mixed readiness cannot pass", async () => {
  for (const step of [{ ready: false, version: EXPECTED }, { readyStatus: 503, version: EXPECTED }, { versionStatus: 500, version: EXPECTED }, { invalidJson: true, version: EXPECTED }, { version: undefined }, { version: EXPECTED, versionReady: false }, { error: "https://private:secret@host/?token=must-not-log" }, { version: "must-not-log" }]) {
    const fake = harness([step]);
    await assert.rejects(verifyDeployment(options, fake.dependencies), { code: "DEPLOY_VERIFICATION_TIMEOUT" });
    assert.doesNotMatch(fake.logs.join("\n"), /secret|token|must-not-log/);
  }
});

test("network and JSON body stalls obey request and overall deadlines", { timeout: 2000 }, async () => {
  for (const stalledBody of [false, true]) {
    const signals = [];
    const start = performance.now();
    await assert.rejects(verifyDeployment({ ...options, timeoutMs: 45, intervalMs: 5, requestTimeoutMs: 10 }, {
      fetch: async (_url, init) => {
        signals.push(init.signal);
        if (stalledBody) return { status: 200, json: () => new Promise(() => {}) };
        return new Promise(() => {});
      },
    }), { code: "DEPLOY_VERIFICATION_TIMEOUT" });
    assert.ok(performance.now() - start < 1000);
    assert.ok(signals.length > 0 && signals.length <= 9);
    assert.ok(signals.every((signal) => signal.aborted));
  }
});

test("expected fingerprint arriving after the deadline never passes", async () => {
  let time = 0;
  await assert.rejects(verifyDeployment({ ...options, requiredMatches: 1 }, {
    now: () => time, sleep: async (ms) => { time += ms; },
    fetch: async (url) => ({ status: 200, json: async () => {
      if (new URL(url).pathname === "/ready") return { ok: true, databaseReady: true };
      time = 51;
      return { assetVersion: EXPECTED, databaseReady: true };
    } }),
  }), { code: "DEPLOY_VERIFICATION_TIMEOUT" });
});

test("invalid configuration fails before network access without exposing URLs or credentials", async () => {
  for (const changes of [{ baseUrl: "" }, { baseUrl: "http://production.example.invalid" }, { baseUrl: "https://user:password@example.invalid" }, { baseUrl: "https://example.invalid/?secret=hidden" }, { expectedAssetVersion: "not-a-version" }, { timeoutMs: 0 }]) {
    await assert.rejects(verifyDeployment({ ...options, ...changes }, { fetch: () => assert.fail("invalid config reached network") }), (error) => {
      assert.doesNotMatch(error.message, /password|hidden/);
      return true;
    });
  }
});

test("real fetch verifies a local fixture without server.js, DB or deployment hooks", async (t) => {
  let versions = 0;
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (new URL(req.url, "http://localhost").pathname === "/ready") res.end(JSON.stringify({ ok: true, databaseReady: true }));
    else { versions++; res.end(JSON.stringify({ assetVersion: versions === 1 ? OLD : EXPECTED, databaseReady: true })); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const result = await verifyDeployment({ ...options, baseUrl: `http://127.0.0.1:${server.address().port}`, timeoutMs: 1000, intervalMs: 5, requestTimeoutMs: 200 });
  assert.equal(result.attempts, 3);
});

test("workflow computes expected version before the unchanged deployment hook and requires smoke", () => {
  const workflow = fs.readFileSync(require.resolve("../.github/workflows/deploy.yml"), "utf8");
  assert.ok(workflow.indexOf("node asset-version.js") < workflow.indexOf("Trigger Seenode deploy"));
  assert.match(workflow, /curl --fail --silent --show-error --retry 2 --request POST "\$DEPLOY_HOOK_URL"/);
  assert.match(workflow, /EXPECTED_ASSET_VERSION: \$\{\{ steps\.expected\.outputs\.assetVersion \}\}/);
  const smoke = workflow.slice(workflow.indexOf("- name: Verify readiness"));
  assert.match(smoke, /if: env\.DEPLOY_HOOK_URL != ''/);
  assert.doesNotMatch(smoke, /PUBLIC_DEPLOY_URL != ''/);
  assert.match(smoke, /timeout-minutes: 6/);
  assert.match(smoke, /run: node scripts\/deploy-smoke\.js/);
});
