const RATE_URL = "https://api.frankfurter.dev/v2/providers/BANXICO/rate/USD/MXN";
const STORAGE_KEY = "exchange_rate_usd_mxn";
const SOURCE = Object.freeze({ name: "Banco de México", provider: "BANXICO", via: "Frankfurter", url: RATE_URL });
const HOUR = 60 * 60 * 1000;

function publicationDate(now) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cancun", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}

function validObservation(value, now) {
  if (!value || value.base !== "USD" || value.quote !== "MXN") return false;
  if (typeof value.rate !== "number" || !Number.isFinite(value.rate) || value.rate <= 0 || value.rate >= 1000) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date || "")) return false;
  const date = Date.parse(`${value.date}T00:00:00Z`);
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value.date
    && value.date >= "1991-01-01" && value.date <= publicationDate(now);
}

function createExchangeRateService({
  query,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  timeoutMs = 5000,
  refreshIntervalMs = HOUR,
  retryIntervalMs = 5 * 60 * 1000,
  logger = console,
} = {}) {
  let observation = null;
  let pending = null;
  let started = false;
  let timer = null;
  let nextAttemptAt = 0;
  let lastAttemptFailed = false;

  function getSnapshot() {
    if (!observation) return { status: "unavailable", base: "USD", quote: "MXN", rate: null, date: null, checkedAt: null, source: { ...SOURCE } };
    const checkedAge = now() - Date.parse(observation.checkedAt);
    const sourceAge = now() - Date.parse(`${observation.date}T00:00:00Z`);
    return {
      ...observation,
      source: { ...SOURCE },
      status: lastAttemptFailed || checkedAge > refreshIntervalMs * 2 || sourceAge > 7 * 24 * HOUR ? "stale" : "available",
    };
  }

  async function load() {
    if (typeof query !== "function") return;
    try {
      const result = await query("SELECT value FROM app_settings WHERE key = $1", [STORAGE_KEY]);
      const value = result.rows?.[0]?.value;
      const checkedAt = Date.parse(value?.checkedAt);
      if (validObservation(value, now()) && Number.isFinite(checkedAt) && checkedAt <= now()
        && value?.source?.provider === SOURCE.provider) {
        observation = { base: "USD", quote: "MXN", rate: value.rate, date: value.date, checkedAt: new Date(checkedAt).toISOString() };
      }
    } catch {
      logger.warn?.("[exchange-rate] Could not load the last saved rate.");
    }
  }

  function refresh({ force = false } = {}) {
    if (pending) return pending;
    if (!force && now() < nextAttemptAt) return Promise.resolve(getSnapshot());
    nextAttemptAt = now() + retryIntervalMs;
    pending = (async () => {
      const controller = new AbortController();
      let timeout;
      try {
        const deadline = new Promise((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            reject(new Error("EXCHANGE_RATE_TIMEOUT"));
          }, timeoutMs);
        });
        const value = await Promise.race([
          (async () => {
            const response = await fetchImpl(RATE_URL, { signal: controller.signal, headers: { Accept: "application/json" }, redirect: "error" });
            if (!response.ok) throw new Error("EXCHANGE_RATE_PROVIDER_ERROR");
            const body = await response.json();
            if (!validObservation(body, now())) throw new Error("EXCHANGE_RATE_INVALID_RESPONSE");
            return body;
          })(),
          deadline,
        ]);
        // A delayed or regressed provider response must never replace a newer observation.
        if (observation && value.date < observation.date) throw new Error("EXCHANGE_RATE_OLDER_RESPONSE");
        observation = { base: "USD", quote: "MXN", rate: value.rate, date: value.date, checkedAt: new Date(now()).toISOString() };
        lastAttemptFailed = false;
        nextAttemptAt = now() + refreshIntervalMs;
        if (typeof query === "function") {
          try {
            await query(
              "INSERT INTO app_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
              [STORAGE_KEY, JSON.stringify({ ...observation, source: SOURCE })],
            );
          } catch {
            // The current verified observation remains usable even if persistence is temporarily unavailable.
            logger.warn?.("[exchange-rate] Current rate fetched; saving it for restart failed.");
          }
        }
      } catch {
        lastAttemptFailed = true;
        nextAttemptAt = now() + retryIntervalMs;
        logger.warn?.("[exchange-rate] Provider unavailable; retaining the last dated observation.");
      } finally {
        clearTimeout(timeout);
        pending = null;
      }
      return getSnapshot();
    })();
    return pending;
  }

  async function start() {
    if (started) return pending || getSnapshot();
    started = true;
    await load();
    timer = setInterval(() => void refresh(), Math.min(refreshIntervalMs, retryIntervalMs));
    timer.unref?.();
    return refresh();
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    started = false;
  }

  return { getSnapshot, refresh, start, stop };
}

module.exports = { createExchangeRateService, validObservation, RATE_URL, STORAGE_KEY };
