"use strict";

// Synthetic, current observation for rendering tests which use the real clock.
// Business values are fixed; this does not fetch or claim a live market quote.
function publicExchangeFixture(rate = 20) {
  const checked = Date.now() - 1000;
  return { status: "available", base: "USD", quote: "MXN", rate,
    date: new Date(checked - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    checkedAt: new Date(checked).toISOString(), source: { provider: "BANXICO" } };
}

module.exports = { publicExchangeFixture };
