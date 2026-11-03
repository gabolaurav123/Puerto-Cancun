const assert = require("node:assert/strict");
const test = require("node:test");
const { createExchangeRateService, RATE_URL, STORAGE_KEY } = require("../exchange-rate");

const instant = Date.parse("2026-11-03T17:00:00Z");
const quote = { base: "USD", quote: "MXN", rate: 18.7592, date: "2026-11-03" };
const silent = { warn() {} };
const response = (value = quote) => ({ ok: true, json: async () => value });

test("fetches a dated USD/MXN reference and persists only the provider observation", async () => {
  const queries = [];
  const service = createExchangeRateService({ now: () => instant, logger: silent,
    query: async (sql, args) => { queries.push({ sql, args }); return { rows: [] }; },
    fetchImpl: async (url, options) => { assert.equal(url, RATE_URL); assert.equal(options.redirect, "error"); return response(); },
  });
  try {
    const result = await service.start();
    assert.equal(result.rate, quote.rate);
    assert.equal(result.date, quote.date);
    assert.equal(result.checkedAt, "2026-11-03T17:00:00.000Z");
    assert.equal(result.source.name, "Banco de México");
    assert.equal(result.status, "available");
    assert.equal(queries.length, 2);
    assert.equal(queries[1].args[0], STORAGE_KEY);
    assert.equal(JSON.parse(queries[1].args[1]).rate, quote.rate);
  } finally { service.stop(); }
});

test("coalesces simultaneous refreshes and caches successful responses", async () => {
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const service = createExchangeRateService({ now: () => instant, logger: silent, fetchImpl: async () => { calls++; await gate; return response(); } });
  const first = service.refresh();
  const second = service.refresh();
  assert.equal(first, second);
  release();
  await Promise.all([first, second]);
  await service.refresh();
  assert.equal(calls, 1);
});

test("provider failure preserves the old publication date with stale status and throttles retries", async () => {
  let time = instant;
  let calls = 0;
  const service = createExchangeRateService({ now: () => time, logger: silent, refreshIntervalMs: 100, retryIntervalMs: 10,
    fetchImpl: async () => { calls++; if (calls === 1) return response(); throw new Error("offline"); },
  });
  await service.refresh();
  time += 101;
  const stale = await service.refresh();
  assert.equal(stale.status, "stale");
  assert.equal(stale.rate, quote.rate);
  assert.equal(stale.date, quote.date);
  assert.equal(stale.checkedAt, "2026-11-03T17:00:00.000Z");
  await service.refresh();
  assert.equal(calls, 2);
  time += 10;
  await service.refresh();
  assert.equal(calls, 3);
});

test("timeouts abort the request without inventing a manual fallback", async () => {
  let signal;
  const service = createExchangeRateService({ now: () => instant, logger: silent, timeoutMs: 15,
    fetchImpl: async (_url, options) => { signal = options.signal; return new Promise(() => {}); },
  });
  const result = await service.refresh();
  assert.equal(signal.aborted, true);
  assert.equal(result.status, "unavailable");
  assert.equal(result.rate, null);
  assert.equal(result.date, null);
});

test("rejects wrong pairs, impossible dates, future observations, and nonnumeric rates", async () => {
  for (const invalid of [
    { ...quote, base: "EUR" }, { ...quote, quote: "USD" }, { ...quote, date: "2026-02-30" },
    { ...quote, date: "2026-11-04" }, { ...quote, rate: "18.75" }, { ...quote, rate: -1 },
    { ...quote, rate: Infinity }, { ...quote, date: "<b>today</b>" },
  ]) {
    const service = createExchangeRateService({ now: () => instant, logger: silent, fetchImpl: async () => response(invalid) });
    assert.equal((await service.refresh()).status, "unavailable");
  }
});

test("restores a saved reference on restart without relabeling it as today's rate", async () => {
  const cached = { ...quote, date: "2026-10-30", checkedAt: "2026-10-30T18:00:00Z", source: { provider: "BANXICO" } };
  const service = createExchangeRateService({ now: () => instant, logger: silent,
    query: async () => ({ rows: [{ value: cached }] }), fetchImpl: async () => { throw new Error("offline"); },
  });
  try {
    const result = await service.start();
    assert.equal(result.status, "stale");
    assert.equal(result.date, "2026-10-30");
    assert.equal(result.checkedAt, "2026-10-30T18:00:00.000Z");
  } finally { service.stop(); }
});

test("keeps the last business-day observation dated correctly after a weekend refresh", async () => {
  const service = createExchangeRateService({ now: () => Date.parse("2026-11-01T17:00:00Z"), logger: silent,
    fetchImpl: async () => response({ ...quote, date: "2026-10-30" }),
  });
  const result = await service.refresh();
  assert.equal(result.status, "available");
  assert.equal(result.date, "2026-10-30");
  assert.equal(result.checkedAt, "2026-11-01T17:00:00.000Z");
});

test("database persistence outage does not discard a verified fresh rate", async () => {
  const service = createExchangeRateService({ now: () => instant, logger: silent,
    query: async () => { throw new Error("database reconnecting"); }, fetchImpl: async () => response(),
  });
  const result = await service.refresh();
  assert.equal(result.status, "available");
  assert.equal(result.rate, quote.rate);
});

test("regressed provider dates cannot overwrite a newer saved observation", async () => {
  let calls = 0;
  const service = createExchangeRateService({ now: () => instant, logger: silent,
    fetchImpl: async () => response(calls++ ? { ...quote, date: "2026-11-02", rate: 19 } : quote),
  });
  await service.refresh();
  const result = await service.refresh({ force: true });
  assert.equal(result.status, "stale");
  assert.equal(result.date, quote.date);
  assert.equal(result.rate, quote.rate);
});
