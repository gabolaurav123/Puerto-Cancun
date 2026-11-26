(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccPublicPricing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY = 24 * 60 * 60 * 1000;
  const MAX_RATE_AGE_DAYS = 7;
  const number = value => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

  // A published rate can precede today on weekends/holidays. Retain its actual
  // publication date; an undated numeric setting is never a conversion source.
  function usableRate(snapshot, { now = Date.now() } = {}) {
    const instant = typeof now === "function" ? Number(now()) : Number(now);
    if (!Number.isFinite(instant) || !snapshot || !["available", "stale"].includes(snapshot.status)
      || snapshot.base !== "USD" || snapshot.quote !== "MXN" || snapshot.source?.provider !== "BANXICO"
      || number(snapshot.rate) === null || snapshot.rate >= 1000 || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date || "")) return null;
    const published = Date.parse(snapshot.date + "T00:00:00Z");
    const checked = Date.parse(snapshot.checkedAt);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cancun", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instant));
    if (!Number.isFinite(published) || new Date(published).toISOString().slice(0, 10) !== snapshot.date
      || snapshot.date > today || instant - published > MAX_RATE_AGE_DAYS * DAY
      || !Number.isFinite(checked) || checked > instant || checked < published || instant - checked > MAX_RATE_AGE_DAYS * DAY) return null;
    return { rate: snapshot.rate, date: snapshot.date, checkedAt: snapshot.checkedAt, status: snapshot.status,
      source: { name: "Banco de México", provider: "BANXICO", via: "Frankfurter" } };
  }

  function convert(amount, currency, snapshot, options = {}) {
    const originalAmount = number(amount), originalCurrency = ["USD", "MXN"].includes(currency) ? currency : null;
    const base = { amount: null, currency: "USD", originalAmount, originalCurrency, approximate: false, rate: null, date: null, status: "unconfirmed" };
    if (originalAmount === null || !originalCurrency) return base;
    if (currency === "USD") return { ...base, amount: originalAmount, status: "original" };
    const observation = usableRate(snapshot, options);
    if (!observation) return { ...base, status: "rate_unavailable" };
    const amountUsd = originalAmount / observation.rate;
    if (!Number.isFinite(amountUsd)) return base;
    return { ...base, amount: amountUsd, approximate: true, rate: observation, date: observation.date, status: "converted" };
  }

  function price(original, snapshot, options = {}) {
    // Accepting our own descriptor is idempotent: recompute from its original
    // values, so a new rate never converts an already converted USD amount.
    const descriptor = original && typeof original === "object" ? original : {};
    const amount = descriptor.originalAmount !== undefined ? descriptor.originalAmount : descriptor.amount;
    const currency = descriptor.originalCurrency !== undefined ? descriptor.originalCurrency : descriptor.currency;
    const result = convert(amount, currency, snapshot, options);
    const basis = ["total", "sqm"].includes(descriptor.basis) ? descriptor.basis : null;
    return { ...result, amount: basis && !options.onRequest ? result.amount : null, status: basis && !options.onRequest ? result.status : "unconfirmed", basis,
      operation: ["sale", "rent"].includes(descriptor.operation) ? descriptor.operation : null,
      period: descriptor.operation === "rent" ? ["month", "day", "year"].includes(descriptor.period) ? descriptor.period : "unclassified" : "",
      onRequest: options.onRequest === true };
  }

  function dateText(value, lang = "es") {
    return new Date(value + "T12:00:00Z").toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
      year: "numeric", month: "short", day: "numeric", timeZone: "America/Cancun",
    });
  }

  function displayPrice(descriptor, lang = "es") {
    if (lang !== "en" && descriptor?.originalCurrency === "MXN" && number(descriptor.originalAmount)
        && !descriptor.onRequest && descriptor.status !== "unconfirmed") {
      return { ...descriptor, amount: descriptor.originalAmount, currency: "MXN", approximate: false, date: null, rate: null, status: "original" };
    }
    return descriptor;
  }

  function rateNote(descriptor, lang = "es", { forceUsd = false } = {}) {
    if (!forceUsd) descriptor = displayPrice(descriptor, lang);
    if (!descriptor?.approximate || !descriptor.date) return "";
    const en = lang === "en";
    return (descriptor.rate?.status === "stale" ? en ? "Last available rate: " : "Última cotización disponible: " : en ? "Exchange rate: " : "Tipo de cambio: ")
      + dateText(descriptor.date, lang) + ". " + (en ? "Approximate USD amount." : "Importe aproximado en USD.");
  }

  function format(descriptor, lang = "es", { includeRateDate = true, from = false, maximumFractionDigits = 0, forceUsd = false } = {}) {
    if (!forceUsd) descriptor = displayPrice(descriptor, lang);
    const en = lang === "en";
    if (!descriptor || number(descriptor.amount) === null || !["MXN", "USD"].includes(descriptor.currency)) {
      return descriptor?.status === "rate_unavailable" ? en ? "USD price to be confirmed" : "Precio en USD por confirmar"
        : en ? "Price on request" : "Precio a consultar";
    }
    let value = (from ? en ? "From " : "Desde " : "") + (descriptor.approximate ? "≈ " : "") + descriptor.currency + " $"
      + new Intl.NumberFormat(en ? "en-US" : "es-MX", { maximumFractionDigits }).format(descriptor.amount);
    if (descriptor.basis === "sqm") value += " / m²";
    if (descriptor.operation === "rent") {
      const periods = en ? { month: "month", day: "day", year: "year" } : { month: "mes", day: "día", year: "año" };
      value += periods[descriptor.period] ? " / " + periods[descriptor.period] : en ? " · rental period unconfirmed" : " · periodo por confirmar";
    }
    if (includeRateDate && descriptor.approximate) value += " · " + (en ? "rate " : "TC ") + dateText(descriptor.date, lang);
    return value;
  }

  function budgetInUsd(query, snapshot, options = {}) {
    const result = { min: null, max: null, currency: "USD", priceMode: "public-usd", approximate: false, date: null, unavailable: false };
    for (const key of ["min", "max"]) {
      const amount = query?.[key];
      if (amount === null || amount === undefined || amount === "") continue;
      if (Number(amount) === 0) { result[key] = 0; continue; }
      const converted = convert(Number(amount), query.priceMode === "public-usd" ? "USD" : query.currency, snapshot, options);
      result[key] = converted.amount;
      result.approximate ||= converted.approximate;
      result.date ||= converted.date;
      result.unavailable ||= converted.amount === null;
    }
    return result;
  }

  return { MAX_RATE_AGE_DAYS, usableRate, convert, price, displayPrice, format, rateNote, budgetInUsd };
});
