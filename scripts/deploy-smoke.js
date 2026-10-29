"use strict";

const { computeAssetVersion } = require("../asset-version");
const { performance } = require("node:perf_hooks");

const VERSION = /^[a-f0-9]{12}$/;

function deploymentUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("PUBLIC_DEPLOY_URL must be a public service URL."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash) {
    throw new Error("Deployment URL must use HTTPS (HTTP allowed for loopback), without credentials, query or fragment.");
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url;
}

async function readJson(url, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(url, {
          method: "GET", redirect: "error", cache: "no-store", signal: controller.signal,
          headers: { Accept: "application/json", "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
        });
        if (response.status !== 200) {
          controller.abort();
          return null;
        }
        return await response.json();
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error("request timeout")); }, timeoutMs);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

async function verifyDeployment({ baseUrl, expectedAssetVersion, timeoutMs = 300000, intervalMs = 5000, requestTimeoutMs = 10000, requiredMatches = 2 }, dependencies = {}) {
  const base = deploymentUrl(baseUrl);
  if (!VERSION.test(expectedAssetVersion || "")) throw new Error("Expected assetVersion must be the 12-character runtime fingerprint.");
  for (const value of [timeoutMs, intervalMs, requestTimeoutMs, requiredMatches]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Verification limits must be positive integers.");
  }
  const fetchImpl = dependencies.fetch || globalThis.fetch;
  const now = dependencies.now || (() => performance.now());
  const sleep = dependencies.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const log = dependencies.log || (() => {});
  const deadline = now() + timeoutMs;
  const maxAttempts = Math.max(requiredMatches, Math.ceil(timeoutMs / intervalMs));
  let attempts = 0, matching = 0, lastStatus = "no response";
  const read = (route) => {
    const remaining = deadline - now();
    if (remaining <= 0) return Promise.resolve(null);
    const url = new URL(route, base);
    url.searchParams.set("_deploy_check", `${expectedAssetVersion}-${Date.now()}-${attempts}`);
    return readJson(url, Math.min(requestTimeoutMs, remaining), fetchImpl);
  };
  while (now() < deadline && attempts < maxAttempts) {
    attempts++;
    try {
      const ready = await read("ready");
      if (ready?.ok !== true || ready.databaseReady !== true) {
        matching = 0;
        lastStatus = "not ready";
      } else {
        const version = await read("api/version");
        if (version?.assetVersion === expectedAssetVersion && version.databaseReady === true && now() < deadline) {
          matching++;
          lastStatus = `matching assetVersion (${matching}/${requiredMatches})`;
          if (matching >= requiredMatches) {
            log(`Deployment verified: assetVersion ${expectedAssetVersion}; ${attempts} attempts.`);
            return { assetVersion: expectedAssetVersion, attempts, consecutiveMatches: matching };
          }
        } else {
          matching = 0;
          const observed = VERSION.test(version?.assetVersion || "") ? version.assetVersion : "unavailable";
          lastStatus = version?.assetVersion === expectedAssetVersion ? "expected runtime not database-ready" : `assetVersion mismatch: ${observed}`;
        }
      }
    } catch {
      matching = 0;
      lastStatus = "request failed, timed out or invalid JSON";
    }
    log(`Attempt ${attempts}: ${lastStatus}.`);
    const remaining = deadline - now();
    if (remaining > 0 && attempts < maxAttempts) await sleep(Math.min(intervalMs, remaining));
  }
  const error = new Error(`Deployment verification timed out after ${attempts} attempts; expected assetVersion ${expectedAssetVersion}; ${lastStatus}.`);
  error.code = "DEPLOY_VERIFICATION_TIMEOUT";
  error.attempts = attempts;
  throw error;
}

module.exports = { verifyDeployment };

if (require.main === module) {
  const expectedAssetVersion = process.env.EXPECTED_ASSET_VERSION || computeAssetVersion();
  verifyDeployment({ baseUrl: process.env.PUBLIC_DEPLOY_URL, expectedAssetVersion }, { log: (message) => process.stdout.write(`${message}\n`) })
    .catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
