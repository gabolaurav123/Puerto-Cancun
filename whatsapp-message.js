(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccWhatsAppMessage = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const topics = {
    availability: ["Disponibilidad", "Availability"],
    prices: ["Precios y costos", "Prices and costs"],
    photos: ["Más fotografías", "More photos"],
    payments: ["Planes de pago", "Payment plans"],
    delivery: ["Fecha de entrega", "Delivery date"],
    visit: ["Agendar una visita", "Arrange a visit"],
  };
  const clean = value => typeof value === "string" ? value.trim() : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  const folded = value => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function messageFor(data = {}, url = "") {
    const en = data.lang === "en", t = (es, english) => en ? english : es;
    const types = { Casa: ["una casa", "a house"], Departamento: ["un departamento", "an apartment"], Terreno: ["un terreno", "land"], Comercial: ["un local comercial", "commercial property"], Oficina: ["una oficina", "an office"], Bodega: ["una bodega", "a warehouse"] };
    const what = types[data.propertyType] ? t(...types[data.propertyType]) : clean(data.propertyType) || t("una propiedad", "a property");
    const phrases = { buy: t("Me interesa comprar", "I would like to buy"), rent: t("Busco alquilar", "I am looking to rent"), sell: t("Quiero vender", "I would like to sell"), let: t("Quiero poner en renta", "I would like to offer for rent") };
    let intro = (phrases[data.intent] || t("Quisiera información sobre", "I would like information about")) + " " + what + ".";
    if (data.service === "valuation") intro = t("Quiero solicitar una valoración inmobiliaria.", "I would like a property valuation.");
    if (data.service === "price-review") intro = t("Quiero revisar mi precio estimado.", "I would like to review my estimated price.");
    if (data.service === "visit") intro = t("Quiero solicitar una visita. Me gustaría confirmar la disponibilidad.", "I would like to arrange a visit and check availability.");
    if (["property-search", "search-watch"].includes(data.service)) intro = t("Quiero que me ayuden a conseguir mi propiedad ideal.", "I would like help finding my ideal property.");
    if (data.service === "guest-listing") intro = data.intent === "let" ? t("Quiero anunciar mi propiedad en renta.", "I would like to list my property for rent.") : t("Quiero anunciar mi propiedad en venta.", "I would like to list my property for sale.");
    const text = [t("Hola. ", "Hello. ") + intro];
    const title = clean(data.propertyTitle || data.project || data.development);
    if (title) text.push(t("Me interesa: ", "I am interested in: ") + title);
    if (data.development && !folded(title).includes(folded(data.development))) text.push(t("Desarrollo: ", "Gated community: ") + clean(data.development));
    const entries = [
      [data.name, "Mi nombre", "My name"],
      [data.zone, "Zona", "Zone"],
      [data.subzone && !folded(data.zone).includes(folded(data.subzone)) ? data.subzone : "", "Sector", "Neighbourhood"],
      [data.propertyType && ["property-search", "search-watch"].includes(data.service) ? (types[data.propertyType] ? t(...types[data.propertyType]) : data.propertyType) : "", "Tipo de propiedad", "Property type"],
      [data.beds || data.bedrooms, "Recámaras", "Bedrooms"], [data.baths || data.bathrooms, "Baños", "Bathrooms"],
      [data.area, "Superficie aproximada (m²)", "Approximate area (m²)"],
      [data.landSize, "Superficie de terreno (m²)", "Land area (m²)"],
      [data.builtSize, "Superficie construida (m²)", "Built area (m²)"],
      [data.age, "Antigüedad del inmueble", "Age of the property"],
      [data.amenities, "Amenidades", "Amenities"], [data.legalStatus, "Situación documental", "Document status"],
      [data.features, "Características", "Features"], [data.preferences, "Otros detalles", "Other details"],
      [data.message, "Comentarios", "Comments"],
      [data.summary, "Resumen de la consulta", "Inquiry summary"],
    ];
    for (const [value, es, english] of entries) if (clean(value)) text.push(t(es, english) + ": " + clean(value));
    if (topics[data.topic]) text.push(t("Quisiera consultar: ", "I would like to ask about: ") + t(...topics[data.topic]));
    if (Number(data.budget) > 0 && Number.isFinite(Number(data.budget))) text.push(t("Presupuesto aproximado: ", "Approximate budget: ") + new Intl.NumberFormat(en ? "en-US" : "es-MX").format(Number(data.budget)) + " " + (data.currency === "MXN" ? "MXN" : "USD"));
    if (data.askingPrice) text.push(t("Precio solicitado: ", "Asking price: ") + clean(data.askingPrice) + " " + clean(data.currency));
    if (data.rentPeriod) text.push(t("Periodo de renta: ", "Rental period: ") + ({ day: t("día", "daily"), month: t("mes", "monthly"), year: t("año", "yearly") }[data.rentPeriod] || clean(data.rentPeriod)));
    if (data.visitPreferredAt) text.push(t("Fecha/hora preferida (Cancún): ", "Preferred date/time (Cancun): ") + clean(data.visitPreferredAt).replace("T", " "));
    if (data.moveDate) text.push(t("Mudanza estimada: ", "Estimated move date: ") + clean(data.moveDate));
    if (data.searchDescription) text.push(t("Criterios de búsqueda: ", "Search criteria: ") + clean(data.searchDescription));
    if (data.ownerEstimate) text.push(t("Mi estimación: ", "My estimate: ") + clean(data.ownerEstimate) + " " + clean(data.currency));
    const email = clean(data.email || data.replyEmail);
    if (data.contactChannel === "email" && email) text.push(t("Deseo que me contacten por correo electrónico. Este es mi correo electrónico: ", "Please contact me by email. This is my email address: ") + email);
    if (url) text.push(t("Lo vi en Puerto Cancún Center: ", "I saw this on Puerto Cancún Center: ") + url);
    return text.join("\n");
  }
  function handoffUrl(number, data, url) {
    const phone = String(number || "").replace(/\D/g, "");
    if (!/^[1-9]\d{6,14}$/.test(phone)) return "";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(messageFor(data, url));
  }
  return { messageFor, handoffUrl, topics };
});
