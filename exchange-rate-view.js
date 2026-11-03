(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PccExchangeRate = factory();
})(typeof window === "undefined" ? this : window, function () {
  function render(snapshot, lang = "es") {
    const english = lang === "en";
    const title = english ? "USD / MXN exchange rate" : "Tipo de cambio USD / MXN";
    if (!snapshot || !Number.isFinite(snapshot.rate) || snapshot.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date || "")) {
      return `<strong>${title}</strong><span>${english ? "Temporarily unavailable." : "Temporalmente no disponible."}</span>`;
    }
    const rate = snapshot.rate.toLocaleString(english ? "en-US" : "es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    const date = new Date(snapshot.date + "T12:00:00Z").toLocaleDateString(english ? "en-US" : "es-MX", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Cancun" });
    const label = snapshot.status === "stale" ? (english ? "Last available rate" : "Última cotización disponible") : (english ? "Published rate" : "Cotización publicada");
    return `<strong>${title}</strong><span class="exchange-rate-value">1 USD = ${rate} MXN</span><small>${label}: ${date}. <a href="https://www.banxico.org.mx/tipcamb/main.do?page=tip&amp;idioma=${english ? "en" : "sp"}" target="_blank" rel="noopener noreferrer">Banco de México</a> · ${english ? "via Frankfurter" : "vía Frankfurter"}. ${english ? "Reference rate; your bank may apply a different rate." : "Referencia bancaria; la tasa de tu operación puede variar."}</small>`;
  }
  return { render };
});
