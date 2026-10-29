(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./inventory-contract"));
  else root.PccComparison = factory(root.PccInventory);
})(typeof globalThis !== "undefined" ? globalThis : this, function (inventory) {
  "use strict";

  const MAX = 4;
  const SAVED_KEY = "pcc.comparison.selections.v1";
  const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
  const copy = {
    es: {
      unknown: "Sin confirmar", unavailable: "No disponible", property: "Propiedad", development: "Desarrollo", listing: "Inmueble",
      heading: "Comparar inmuebles", compare: "Comparar", count: "{n} de {max}", share: "Copiar enlace", clear: "Vaciar", add: "A\u00f1adir inmueble",
      limit: "L\u00edmite de cuatro", select: "Seleccionar inmueble", noPublic: "No hay inmuebles p\u00fablicos disponibles",
      remove: "Quitar", needOne: "Falta un inmueble para comparar.", empty: "Sin inmuebles seleccionados.", link: "Enlace de comparaci\u00f3n",
      region: "Comparaci\u00f3n de inmuebles", caption: "Comparaci\u00f3n de {n} inmuebles, con importes y unidades originales", feature: "Caracter\u00edstica",
      noPhoto: "Sin fotograf\u00eda", failedPhoto: "Fotograf\u00eda no disponible", favorite: "Favorito", saveFavorite: "Guardar en favoritos", removeFavorite: "Quitar de favoritos",
      contact: "Consultar", tour: "Solicitar visita", entity: "Entidad", type: "Tipo", operation: "Operaci\u00f3n", sale: "Venta", rent: "Renta",
      originalPrice: "Precio original", priceMatch: "Comparabilidad del precio", area: "Construcci\u00f3n", areaMatch: "Comparabilidad de construcci\u00f3n",
      lot: "Terreno / lote de origen", lotMatch: "Comparabilidad de terreno", beds: "Rec\u00e1maras", noDevelopmentBeds: "No aplica al desarrollo", zone: "Zona / ciudad",
      compatible: "Compatible con {n}", incompatible: "No comparable con {n}", entityMismatch: "Entidad distinta: propiedad y desarrollo",
      noPrice: "Precio no disponible", currencyUnknown: "Moneda sin confirmar", currencyMismatch: "Moneda distinta", operationUnknown: "Operaci\u00f3n sin confirmar",
      operationMismatch: "Operaci\u00f3n distinta", basisUnknown: "Base de precio sin confirmar", basisMismatch: "Base de precio distinta",
      periodUnknown: "Periodo de renta sin confirmar", periodMismatch: "Periodo de renta distinto", noSurface: "Superficie no disponible",
      conceptUnknown: "Concepto de superficie por confirmar", unitUnknown: "Unidad de superficie sin confirmar", unitMismatch: "Unidad de superficie distinta",
      onRequest: "Precio a consultar", total: "total", basisSuffix: "base sin confirmar", periodSuffix: "periodo sin confirmar", unitSuffix: "unidad sin confirmar", conceptSuffix: "concepto por confirmar",
      day: "d\u00eda", month: "mes", year: "a\u00f1o", locationUnknown: "Location por confirmar",
      someUnavailable: "Algunos inmuebles no est\u00e1n disponibles para comparar.", max: "Puedes comparar hasta cuatro inmuebles.", cannotCompare: "Inmueble no disponible para comparar.",
      selected: "{n} inmuebles seleccionados.", copied: "Enlace copiado.", needTwo: "Selecciona al menos dos inmuebles disponibles.", copyFailed: "No se pudo copiar autom\u00e1ticamente. El enlace est\u00e1 disponible.",
      missing: "Inmueble no disponible.", requestFailed: "No se pudo abrir la solicitud. Consulta la ficha del inmueble.", removed: "Inmueble quitado de la comparaci\u00f3n.", cleared: "Comparaci\u00f3n vac\u00eda.",
      favoriteSaved: "Favorito guardado.", favoriteRemoved: "Favorito quitado.", favoriteFailed: "No se pudo guardar el favorito.", redacted: "[omitido]",
      differences: "Solo diferencias", noDifferences: "Sin diferencias en estos campos.", baths: "Ba\u00f1os", parking: "Estacionamientos", maintenance: "Mantenimiento",
      modality: "Modalidad de venta", presale: "Preventa", direct: "Venta directa", resale: "Reventa", notApplicable: "No aplica", delivery: "Entrega documentada", verified: "\u00daltima verificaci\u00f3n",
      selectionName: "Nombre de selecci\u00f3n", saveSelection: "Guardar selecci\u00f3n", savedSelections: "Selecciones guardadas", chooseSelection: "Seleccionar guardada", loadSelection: "Abrir selecci\u00f3n", deleteSelection: "Eliminar selecci\u00f3n",
      localOnly: "Solo en este dispositivo. El nombre no se incluye en el enlace compartido.", selectionSaved: "Selecci\u00f3n guardada en este dispositivo.", selectionDeleted: "Selecci\u00f3n eliminada de este dispositivo.",
      invalidName: "Escribe un nombre y selecciona entre dos y cuatro inmuebles.", storageFailed: "No se pudo guardar el cambio en este dispositivo.", selectionLimit: "Puedes guardar hasta veinte selecciones.", selectionMissing: "Selecci\u00f3n no disponible.",
    },
    en: {
      unknown: "Unconfirmed", unavailable: "Unavailable", property: "Property", development: "Development", listing: "Listing",
      heading: "Compare listings", compare: "Compare", count: "{n} of {max}", share: "Copy link", clear: "Clear", add: "Add listing",
      limit: "Four-listing limit", select: "Select listing", noPublic: "No public listings available", remove: "Remove", needOne: "Add one more listing to compare.", empty: "No listings selected.", link: "Comparison link",
      region: "Listing comparison", caption: "Comparison of {n} listings, with original amounts and units", feature: "Feature",
      noPhoto: "No photo", failedPhoto: "Photo unavailable", favorite: "Favorite", saveFavorite: "Save to favorites", removeFavorite: "Remove from favorites",
      contact: "Inquire", tour: "Request a visit", entity: "Entity", type: "Type", operation: "Transaction", sale: "For sale", rent: "For rent",
      originalPrice: "Original price", priceMatch: "Price compatibility", area: "Built area", areaMatch: "Built area compatibility", lot: "Original land / lot area", lotMatch: "Land area compatibility",
      beds: "Bedrooms", noDevelopmentBeds: "Not applicable to a development", zone: "Area / city", compatible: "Compatible with {n}", incompatible: "Not comparable with {n}",
      entityMismatch: "Different entities: property and development", noPrice: "Price unavailable", currencyUnknown: "Currency unconfirmed", currencyMismatch: "Different currencies",
      operationUnknown: "Transaction unconfirmed", operationMismatch: "Different transactions", basisUnknown: "Price basis unconfirmed", basisMismatch: "Different price bases",
      periodUnknown: "Rental period unconfirmed", periodMismatch: "Different rental periods", noSurface: "Area unavailable", conceptUnknown: "Area definition unconfirmed", unitUnknown: "Area unit unconfirmed", unitMismatch: "Different area units",
      onRequest: "Price on request", total: "total", basisSuffix: "basis unconfirmed", periodSuffix: "period unconfirmed", unitSuffix: "unit unconfirmed", conceptSuffix: "definition unconfirmed",
      day: "day", month: "month", year: "year", locationUnknown: "Location unconfirmed",
      someUnavailable: "Some listings are unavailable for comparison.", max: "You can compare up to four listings.", cannotCompare: "Listing unavailable for comparison.", selected: "{n} listings selected.",
      copied: "Link copied.", needTwo: "Select at least two available listings.", copyFailed: "Could not copy automatically. The link is available.", missing: "Listing unavailable.",
      requestFailed: "Could not open the request. Open the listing for details.", removed: "Listing removed from comparison.", cleared: "Comparison cleared.", favoriteSaved: "Favorite saved.", favoriteRemoved: "Favorite removed.", favoriteFailed: "Could not save favorite.", redacted: "[redacted]",
      differences: "Only differences", noDifferences: "No differences in these fields.", baths: "Bathrooms", parking: "Parking spaces", maintenance: "Maintenance fee",
      modality: "Sale modality", presale: "Presale", direct: "Direct sale", resale: "Resale", notApplicable: "Not applicable", delivery: "Documented delivery", verified: "Last verified",
      selectionName: "Selection name", saveSelection: "Save selection", savedSelections: "Saved selections", chooseSelection: "Choose saved selection", loadSelection: "Open selection", deleteSelection: "Delete selection",
      localOnly: "Only on this device. The name is not included in the shared link.", selectionSaved: "Selection saved on this device.", selectionDeleted: "Selection deleted from this device.",
      invalidName: "Enter a name and select two to four listings.", storageFailed: "Could not save the change on this device.", selectionLimit: "You can save up to twenty selections.", selectionMissing: "Selection unavailable.",
    },
  };
  const language = (value) => /^en(?:-|$)/i.test(String(value?.lang ?? value ?? "")) ? "en" : "es";
  const tr = (lang, key, values = {}) => copy[language(lang)][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
  const catalogPath = (lang) => language(lang) === "en" ? "/en/properties" : "/propiedades";
  const mounted = new WeakMap();
  const field = (p, camel, snake = camel) => p[camel] ?? p[snake];
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const text = (v, max = 220) => typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[omitido]").slice(0, max) : "";
  const number = (v, allowZero = false) => (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) && Number.isFinite(Number(v)) && (allowZero ? Number(v) >= 0 : Number(v) > 0) ? Number(v) : null;
  const format = (v, lang) => new Intl.NumberFormat(language(lang) === "en" ? "en-US" : "es-MX", { maximumFractionDigits: 2 }).format(v);
  const dateValue = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return null;
    const day = value.slice(0, 10), date = new Date(`${day}T00:00:00Z`);
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === day && Number.isFinite(Date.parse(value)) ? day : null;
  };
  const dateText = (value, lang) => value ? new Intl.DateTimeFormat(language(lang) === "en" ? "en-US" : "es-MX", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : tr(lang, "unavailable");

  function requireContract() {
    if (!inventory?.priceOf || !inventory?.resolveLocation || !inventory?.isPublic) throw new Error("Carga inventory-contract.js antes de comparison-ui.js.");
  }

  function publicRecord(p) {
    return p && typeof p === "object" && ID.test(p.id || "") && typeof p.id === "string"
      && inventory.isPublic(p) && ["active", "featured"].includes(p.status)
      && (p.isPublic === true || p.is_public === true)
      && [p.isPublic, p.is_public].every((v) => v === undefined || v === true);
  }

  function imageUrl(value, propertyId) {
    if (typeof value !== "string") return "";
    const media = /^\/media\/properties\/([A-Za-z0-9][A-Za-z0-9_-]{0,127})\/(?:0|[1-9]\d*)$/.exec(value);
    if (media && media[1] === propertyId) return value;
    try {
      const decoded = decodeURIComponent(value);
      if (/^\/(?:assets|uploads)\/[A-Za-z0-9_./+-]+$/.test(decoded) && !decoded.includes("..")) return value;
    } catch { return ""; }
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }

  function listingPath(p, lang) {
    const base = catalogPath(lang);
    const supplied = lang === "en" ? p.urlEn || p.url_en : p.urlEs || p.url_es;
    if (typeof supplied === "string" && new RegExp(`^${base}/[a-zA-Z0-9_-]+$`).test(supplied)) return supplied;
    if (typeof p.slug === "string" && /^[a-zA-Z0-9_-]+$/.test(p.slug)) return `${base}/${p.slug}`;
    return `${base}?q=${encodeURIComponent(p.id)}`;
  }

  function project(p, lang) {
    const metadata = p.catalogData || p.catalog_data || {};
    const legacyPrice = inventory.priceOf(p);
    const currency = legacyPrice.currency || "";
    const rawBasis = field(p, "priceUnit", "price_unit");
    const price = { amount: number(legacyPrice.amount), currency: ["USD", "MXN"].includes(currency) ? currency : "",
      basis: ["total", "sqm"].includes(rawBasis) ? rawBasis : "", operation: ["sale", "rent"].includes(p.operation) ? p.operation : "",
      period: p.operation === "rent" && ["day", "month", "year"].includes(legacyPrice.period) ? legacyPrice.period : "", onRequest: metadata.priceOnRequest === true };
    if (price.onRequest) price.amount = null;
    const unit = (value) => [undefined, "", "m2", "sqm", "m\u00b2"].includes(value) ? "m2" : ["ft2", "sqft", "ft\u00b2"].includes(value) ? "ft2" : "";
    const location = inventory.resolveLocation(p);
    const entity = inventory.entityOf(p);
    const maintenance = p.maintenance && typeof p.maintenance === "object" ? p.maintenance : {};
    const title = text(lang === "en" ? p.titleEn || p.title_en : p.titleEs || p.title_es).replaceAll("[omitido]", tr(lang, "redacted"));
    const physicalType = entity === "developments" ? "Desarrollo" : inventory.TYPES.includes(p.type) ? p.type : "";
    const type = lang === "en" ? ({ Casa: "House", Departamento: "Apartment", Terreno: "Land", Comercial: "Commercial", Desarrollo: "Development" })[physicalType] || tr(lang, "unknown") : physicalType || tr(lang, "unknown");
    const locationEn = { "zona-hotelera": "Hotel Zone (HZ)", "puerto-cancun": "Puerto Cancun", "cancun-city": "Cancun City", "fuera-de-cancun": "Outside Cancun" };
    return { id: p.id, lang, title: title || (lang === "en" ? `Listing ${p.id} (English title pending)` : "Inmueble"), type, entity,
      location: { id: location.id, name: (lang === "en" ? locationEn[location.id] : inventory.LOCATIONS.find((l) => l.id === location.id)?.name) || tr(lang, "locationUnknown") },
      zone: text(p.zone, 100), city: text(p.city, 100), price, beds: entity === "properties" ? number(p.beds, true) : null,
      baths: entity === "properties" ? number(p.baths, true) : null, parking: entity === "properties" ? number(p.parking, true) : null,
      maintenance: { amount: number(maintenance.amount, true), currency: ["USD", "MXN"].includes(maintenance.currency) ? maintenance.currency : "", period: ["day", "month", "year"].includes(maintenance.period) ? maintenance.period : "" },
      modality: p.operation === "sale" && ["presale", "direct", "resale"].includes(inventory.modalityOf(p)) ? inventory.modalityOf(p) : "",
      delivery: dateValue((p.developmentData || p.development_data || {}).deliveryDate), verified: dateValue(field(p, "lastVerifiedAt", "last_verified_at")),
      area: { value: number(p.area), unit: unit(field(p, "areaUnit", "area_unit")), confirmed: entity === "properties" },
      lot: { value: number(p.lot), unit: unit(field(p, "lotUnit", "lot_unit")), confirmed: entity === "properties" && ["Casa", "Terreno"].includes(physicalType) },
      image: imageUrl(p.image || (Array.isArray(p.images) ? p.images[0] : ""), p.id), href: listingPath(p, lang) };
  }

  function publicIndex(properties, lang = "es") {
    requireContract();
    if (!Array.isArray(properties)) throw new TypeError("properties debe ser el array del endpoint publico.");
    const result = new Map(), denied = new Set();
    for (const p of properties) {
      if (!p || typeof p.id !== "string" || !ID.test(p.id)) continue;
      // A conflicting/private copy of an ID must never be resurrected by input order.
      if (!publicRecord(p)) { denied.add(p.id); result.delete(p.id); continue; }
      if (denied.has(p.id)) continue;
      const clean = project(p, lang);
      if (result.has(p.id) && JSON.stringify(result.get(p.id)) !== JSON.stringify(clean)) { denied.add(p.id); result.delete(p.id); }
      else result.set(p.id, clean);
    }
    return result;
  }

  function parseIds(url) {
    try {
      const source = new URL(url, "https://comparison.invalid");
      return [...new Set(source.searchParams.getAll("compare").join(",").slice(0, 8500).split(",").map((v) => v.trim()).filter((v) => ID.test(v)))].slice(0, 64);
    } catch { return []; }
  }

  function compatibility(a, b, metric = "price", lang = a.lang) {
    const reasons = [];
    if (a.entity !== b.entity) reasons.push(tr(lang, "entityMismatch"));
    if (metric === "price") {
      const x = a.price, y = b.price;
      if (x.amount === null || y.amount === null) reasons.push(tr(lang, "noPrice"));
      for (const key of ["currency", "operation", "basis"]) {
        if (!x[key] || !y[key]) reasons.push(tr(lang, `${key}Unknown`));
        else if (x[key] !== y[key]) reasons.push(tr(lang, `${key}Mismatch`));
      }
      if (x.operation === "rent" || y.operation === "rent") {
        if ((x.operation === "rent" && !x.period) || (y.operation === "rent" && !y.period)) reasons.push(tr(lang, "periodUnknown"));
        else if (x.operation === "rent" && y.operation === "rent" && x.period !== y.period) reasons.push(tr(lang, "periodMismatch"));
      }
    } else if (["area", "lot"].includes(metric)) {
      const x = a[metric], y = b[metric];
      if (x.value === null || y.value === null) reasons.push(tr(lang, "noSurface"));
      if (!x.confirmed || !y.confirmed) reasons.push(tr(lang, "conceptUnknown"));
      if (!x.unit || !y.unit) reasons.push(tr(lang, "unitUnknown"));
      else if (x.unit !== y.unit) reasons.push(tr(lang, "unitMismatch"));
    } else throw new TypeError("Metrica de comparacion no admitida.");
    return { compatible: reasons.length === 0, reasons };
  }

  function model(index, requested = []) {
    const unique = [...new Set(Array.isArray(requested) ? requested : [])];
    const available = unique.filter((id) => typeof id === "string" && index.has(id));
    const items = available.slice(0, MAX).map((id) => index.get(id));
    const pairs = [];
    items.forEach((left, i) => items.slice(i + 1).forEach((right) => pairs.push({ ids: [left.id, right.id], price: compatibility(left, right), area: compatibility(left, right, "area"), lot: compatibility(left, right, "lot") })));
    return { ids: items.map((p) => p.id), items, pairs, ready: items.length >= 2, unavailable: unique.length !== available.length, limitExceeded: available.length > MAX };
  }

  function buildComparison(properties, ids, options = {}) { return model(publicIndex(properties, language(options.lang ?? options)), ids); }

  function sharePath(properties, ids, options = {}) {
    const result = buildComparison(properties, ids, options);
    return result.ready ? `${catalogPath(options.lang ?? options)}?compare=${result.ids.map(encodeURIComponent).join(",")}` : "";
  }

  function priceText(p, lang = p.lang) {
    const x = p.price;
    if (x.amount === null) return tr(lang, x.onRequest ? "onRequest" : "noPrice");
    return `${x.currency || tr(lang, "currencyUnknown")} ${format(x.amount, lang)}${x.basis === "sqm" ? " / m\u00b2" : x.basis === "total" ? ` ${tr(lang, "total")}` : ` (${tr(lang, "basisSuffix")})`}${x.operation === "rent" ? ` / ${["day", "month", "year"].includes(x.period) ? tr(lang, x.period) : tr(lang, "periodSuffix")}` : ""}`;
  }

  function surfaceText(value, lang = "es") {
    if (value.value === null) return tr(lang, "unavailable");
    return `${format(value.value, lang)} ${value.unit === "m2" ? "m\u00b2" : value.unit === "ft2" ? "ft\u00b2" : `(${tr(lang, "unitSuffix")})`}${value.confirmed ? "" : ` (${tr(lang, "conceptSuffix")})`}`;
  }

  function icon(name) { return `<i data-lucide="${name}" aria-hidden="true"></i>`; }

  function renderTable(state, favorites = [], lang = state.items[0]?.lang || "es", differencesOnly = state.differencesOnly === true) {
    if (!state.ready) return "";
    const t = (key, values) => tr(lang, key, values);
    const contactPath = language(lang) === "en" ? "/en/contact" : "/contacto";
    const compatibleCell = (p, metric) => state.items.filter((q) => q.id !== p.id).map((q) => {
      const result = compatibility(p, q, metric, lang);
      const position = state.items.indexOf(q) + 1;
      return `<div class="pcc-comparison-match ${result.compatible ? "is-compatible" : "is-incompatible"}"><strong>${t(result.compatible ? "compatible" : "incompatible", { n: position })}</strong>${result.reasons.length ? `<span>${escape(result.reasons.join("; "))}</span>` : ""}</div>`;
    }).join("");
    const rows = [
      [t("entity"), (p) => t(p.entity === "developments" ? "development" : "property"), (p) => p.entity],
      [t("type"), (p) => escape(p.type || t("unknown")), (p) => p.type],
      [t("operation"), (p) => t(["rent", "sale"].includes(p.price.operation) ? p.price.operation : "unknown"), (p) => p.price.operation],
      [t("originalPrice"), (p) => `<strong>${escape(priceText(p, lang))}</strong>`, (p) => p.price],
      [t("priceMatch"), (p) => compatibleCell(p, "price"), (p) => [p.entity, p.price]],
      [t("area"), (p) => escape(surfaceText(p.area, lang)), (p) => p.area],
      [t("areaMatch"), (p) => compatibleCell(p, "area"), (p) => [p.entity, p.area]],
      [t("lot"), (p) => escape(surfaceText(p.lot, lang)), (p) => p.lot],
      [t("lotMatch"), (p) => compatibleCell(p, "lot"), (p) => [p.entity, p.lot]],
      [t("beds"), (p) => p.entity === "developments" ? t("noDevelopmentBeds") : p.beds === null ? t("unavailable") : format(p.beds, lang), (p) => [p.entity, p.beds]],
      ["Location", (p) => escape(p.location.name), (p) => p.location.id],
      [t("zone"), (p) => escape([p.zone, p.city].filter(Boolean).join(", ") || t("unknown")), (p) => [p.zone, p.city]],
      [t("baths"), (p) => p.entity === "developments" ? t("notApplicable") : p.baths === null ? t("unavailable") : format(p.baths, lang), (p) => [p.entity, p.baths]],
      [t("parking"), (p) => p.entity === "developments" ? t("notApplicable") : p.parking === null ? t("unavailable") : format(p.parking, lang), (p) => [p.entity, p.parking]],
      [t("maintenance"), (p) => p.maintenance.amount === null ? t("unavailable") : `${p.maintenance.currency || t("currencyUnknown")} ${format(p.maintenance.amount, lang)} / ${p.maintenance.period ? t(p.maintenance.period) : t("periodSuffix")}`, (p) => p.maintenance],
      [t("modality"), (p) => t(p.price.operation === "rent" ? "notApplicable" : p.modality || "unknown"), (p) => [p.price.operation, p.modality]],
      [t("delivery"), (p) => dateText(p.delivery, lang), (p) => p.delivery],
      [t("verified"), (p) => dateText(p.verified, lang), (p) => p.verified],
    ];
    const warningMetric = { 4: "price", 6: "area", 8: "lot" };
    const visibleRows = rows.filter(([, , signature], row) => !differencesOnly
      || (warningMetric[row] && state.pairs.some((pair) => !pair[warningMetric[row]].compatible))
      || new Set(state.items.map((p) => JSON.stringify(signature(p)))).size > 1);
    rows.splice(0, rows.length, ...visibleRows);
    if (!rows.length) rows.push([t("noDifferences"), () => ""]);
    return `<div class="pcc-comparison-scroll" tabindex="0" role="region" aria-label="${t("region")}"><table class="pcc-comparison-table" style="--pcc-columns:${state.items.length}"><caption class="pcc-comparison-sr">${t("caption", { n: state.items.length })}</caption><thead><tr><th scope="col">${t("feature")}</th>${state.items.map((p, i) => `<th scope="col" id="pcc-comparison-column-${i}"><div class="pcc-comparison-column-top"><span>${t("listing")} ${i + 1}</span><button class="pcc-comparison-icon" type="button" data-pcc-action="remove" data-pcc-id="${escape(p.id)}" data-pcc-focus="remove-${escape(p.id)}" aria-label="${t("remove")} ${escape(p.title)}" title="${t("remove")} ${escape(p.title)}">${icon("x")}<span aria-hidden="true">&times;</span></button></div>${p.image ? `<img class="pcc-comparison-photo" src="${escape(p.image)}" alt="${escape(p.title)}" loading="lazy" referrerpolicy="no-referrer" />` : `<div class="pcc-comparison-photo pcc-comparison-no-photo">${t("noPhoto")}</div>`}<a class="pcc-comparison-title" href="${escape(p.href)}">${escape(p.title)}</a><div class="pcc-comparison-actions"><button type="button" data-pcc-action="favorite" data-pcc-id="${escape(p.id)}" data-pcc-focus="favorite-${escape(p.id)}" aria-pressed="${favorites.includes(p.id)}" aria-label="${t(favorites.includes(p.id) ? "removeFavorite" : "saveFavorite")}: ${escape(p.title)}" title="${t("favorite")}">${icon("heart")}<span>${t("favorite")}</span></button><a href="${contactPath}?propertyId=${encodeURIComponent(p.id)}" data-pcc-action="contact" data-pcc-id="${escape(p.id)}">${icon("message-circle")}<span>${t("contact")}</span></a><a href="${contactPath}?propertyId=${encodeURIComponent(p.id)}&amp;intent=visit" data-pcc-action="tour" data-pcc-id="${escape(p.id)}">${icon("calendar-days")}<span>${t("tour")}</span></a></div></th>`).join("")}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th>${state.items.map((p) => `<td>${value(p)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function mount(options = {}) {
    requireContract();
    const doc = options.document || (typeof document !== "undefined" ? document : null);
    if (!doc?.body) throw new Error("El documento debe estar listo para montar el comparador.");
    const win = doc.defaultView;
    const parent = typeof options.target === "string" ? doc.querySelector(options.target) : options.target || doc.querySelector("main") || doc.body;
    if (!parent) throw new Error("No existe el destino del comparador.");
    let languageOverride = options.lang;
    const currentLanguage = () => language(languageOverride ?? doc.documentElement.lang);
    let lang = currentLanguage(), properties = options.properties;
    let index = publicIndex(properties, lang), ids = [], destroyed = false, notifying = false, differencesOnly = options.differencesOnly === true;
    let opened = false, unavailableSelection = false, lastCompareControl = null;
    const t = (key, values) => tr(lang, key, values);
    mounted.get(doc)?.destroy();
    const host = doc.createElement("section");
    host.id = "pcc-comparison";
    host.className = "pcc-comparison";
    host.hidden = true;
    host.tabIndex = -1;
    host.setAttribute("aria-labelledby", "pcc-comparison-heading");
    host.innerHTML = '<div class="pcc-comparison-body"></div><p class="pcc-comparison-status" role="status" aria-live="polite" aria-atomic="true"></p>';
    parent.append(host);
    const tray = doc.createElement("aside");
    tray.className = "pcc-comparison-tray";
    tray.hidden = true;
    tray.innerHTML = `<span class="pcc-comparison-tray-count" aria-live="polite" aria-atomic="true"></span><button type="button" data-pcc-tray-action="open" aria-controls="pcc-comparison">${icon("git-compare-arrows")}<span></span></button><button type="button" data-pcc-tray-action="clear">${icon("trash-2")}<span></span></button>`;
    doc.body.append(tray);
    const body = host.querySelector(".pcc-comparison-body");
    const status = host.querySelector(".pcc-comparison-status");
    const originalControls = new Map();
    const announce = (message) => { if (!destroyed) status.textContent = message; };
    const restoreCatalogFocus = () => {
      const control = lastCompareControl?.isConnected ? lastCompareControl : doc.querySelector('[data-compare-id]:not([aria-disabled="true"])');
      control?.focus({ preventScroll: true });
    };
    const favorites = () => {
      try { const value = options.getFavoriteIds ? options.getFavoriteIds() : JSON.parse(win.localStorage.getItem("pcc.favorites") || "[]"); return Array.isArray(value) ? value.filter((id) => typeof id === "string") : []; }
      catch { return []; }
    };
    const snapshot = () => ({ ...model(index, ids), lang, differencesOnly });
    const url = () => ids.length >= 2 ? `${win.location.origin}${catalogPath(lang)}?compare=${ids.map(encodeURIComponent).join(",")}` : "";
    const selectionName = (value) => typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 80) : "";
    function savedSelections() {
      try {
        const saved = JSON.parse(win.localStorage.getItem(SAVED_KEY) || "[]");
        if (!Array.isArray(saved)) return [];
        return saved.slice(0, 20).filter((item) => item && selectionName(item.name) && Array.isArray(item.ids))
          .map((item) => ({ name: selectionName(item.name), ids: [...new Set(item.ids.filter((id) => typeof id === "string" && ID.test(id)))].slice(0, MAX) }));
      } catch { return []; }
    }
    function saveSelection(name) {
      if (destroyed) return false;
      name = selectionName(name);
      if (!name || ids.length < 2) { announce(t("invalidName")); return false; }
      const saved = savedSelections(), position = saved.findIndex((item) => item.name === name);
      if (position < 0 && saved.length >= 20) { announce(t("selectionLimit")); return false; }
      const entry = { name, ids: ids.slice() };
      if (position >= 0) saved[position] = entry; else saved.push(entry);
      try { win.localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); }
      catch { announce(t("storageFailed")); return false; }
      render(); announce(t("selectionSaved")); return true;
    }
    function loadSelection(name) {
      if (destroyed) return false;
      const saved = savedSelections().find((item) => item.name === name);
      if (!saved) { announce(t("selectionMissing")); return false; }
      return setIds(saved.ids);
    }
    function deleteSelection(name) {
      if (destroyed) return false;
      const saved = savedSelections();
      if (!saved.some((item) => item.name === name)) { announce(t("selectionMissing")); return false; }
      try { win.localStorage.setItem(SAVED_KEY, JSON.stringify(saved.filter((item) => item.name !== name))); }
      catch { announce(t("storageFailed")); return false; }
      render(); announce(t("selectionDeleted")); return true;
    }

    function syncControls() {
      if (destroyed) return;
      host.lang = lang;
      doc.querySelectorAll("[data-compare-id]").forEach((button) => {
        if (!originalControls.has(button)) originalControls.set(button, { pressed: button.getAttribute("aria-pressed"), disabled: button.getAttribute("aria-disabled") });
        const id = button.getAttribute("data-compare-id");
        button.setAttribute("aria-pressed", String(ids.includes(id)));
        button.setAttribute("aria-disabled", String(!index.has(id) || (ids.length === MAX && !ids.includes(id))));
      });
    }

    function syncUrl() {
      const location = new URL(win.location.href);
      if (ids.length) location.searchParams.set("compare", ids.join(",")); else location.searchParams.delete("compare");
      try { win.history.replaceState(win.history.state, "", `${location.pathname}${location.search}${location.hash}`); } catch { /* Sharing still works when History is unavailable. */ }
    }

    function render(focus) {
      if (destroyed) return;
      const state = snapshot();
      const remaining = [...index.values()].filter((p) => !ids.includes(p.id));
      const active = doc.activeElement;
      const focusInHost = host.contains(active);
      const savedFocus = focus || (focusInHost ? active?.getAttribute("data-pcc-focus") : null);
      const scrollLeft = host.querySelector(".pcc-comparison-scroll")?.scrollLeft || 0;
      const nameDraft = host.querySelector("#pcc-comparison-name")?.value || "";
      const savedName = host.querySelector("#pcc-comparison-saved")?.value || "";
      body.innerHTML = `<header class="pcc-comparison-header"><div><h2 id="pcc-comparison-heading">${t("heading")}</h2><span class="pcc-comparison-count">${t("count", { n: ids.length, max: MAX })}</span></div><div class="pcc-comparison-toolbar"><button type="button" data-pcc-action="share" data-pcc-focus="share" ${state.ready ? "" : "disabled"}>${icon("share-2")}<span>${t("share")}</span></button><button type="button" data-pcc-action="clear" data-pcc-focus="clear" ${ids.length ? "" : "disabled"}>${icon("trash-2")}<span>${t("clear")}</span></button></div></header><div class="pcc-comparison-picker"><label for="pcc-comparison-add">${t("add")}</label><select id="pcc-comparison-add" data-pcc-focus="picker" ${ids.length === MAX || !remaining.length ? "disabled" : ""}><option value="">${t(index.size ? ids.length === MAX ? "limit" : "select" : "noPublic")}</option>${remaining.map((p) => `<option value="${escape(p.id)}">${escape(p.title)} (${t(p.entity === "developments" ? "development" : "property")})</option>`).join("")}</select></div>${state.ready ? renderTable(state, favorites(), lang) : `<div class="pcc-comparison-empty">${ids.length ? `<strong>${escape(index.get(ids[0]).title)}</strong><button type="button" data-pcc-action="remove" data-pcc-id="${escape(ids[0])}" data-pcc-focus="remove-${escape(ids[0])}">${icon("x")}<span>${t("remove")}</span></button><p>${t("needOne")}</p>` : t("empty")}</div>`}<div class="pcc-comparison-share" hidden><label for="pcc-comparison-link">${t("link")}</label><input id="pcc-comparison-link" type="url" readonly data-pcc-focus="link" /></div>`;
      body.querySelector("header").insertAdjacentHTML("afterend", `<label class="pcc-comparison-differences"><input type="checkbox" data-pcc-focus="differences" id="pcc-comparison-differences" ${differencesOnly ? "checked" : ""} />${t("differences")}</label>`);
      const saved = savedSelections();
      body.insertAdjacentHTML("beforeend", `<div class="pcc-comparison-saved"><p id="pcc-comparison-local">${t("localOnly")}</p><div class="pcc-comparison-save-row"><label for="pcc-comparison-name">${t("selectionName")}</label><input id="pcc-comparison-name" data-pcc-focus="name" type="text" maxlength="80" autocomplete="off" aria-describedby="pcc-comparison-local" value="${escape(nameDraft)}" /><button type="button" data-pcc-action="save-selection" data-pcc-focus="save-selection" ${state.ready ? "" : "disabled"}>${icon("save")}<span>${t("saveSelection")}</span></button></div><div class="pcc-comparison-save-row"><label for="pcc-comparison-saved">${t("savedSelections")}</label><select id="pcc-comparison-saved" data-pcc-focus="saved" ${saved.length ? "" : "disabled"}><option value="">${t("chooseSelection")}</option>${saved.map((item) => `<option value="${escape(item.name)}" ${item.name === savedName ? "selected" : ""}>${escape(item.name)}</option>`).join("")}</select><div class="pcc-comparison-toolbar"><button type="button" data-pcc-action="load-selection" data-pcc-focus="load-selection" ${saved.length ? "" : "disabled"}>${icon("folder-open")}<span>${t("loadSelection")}</span></button><button type="button" data-pcc-action="delete-selection" data-pcc-focus="delete-selection" ${saved.length ? "" : "disabled"}>${icon("trash-2")}<span>${t("deleteSelection")}</span></button></div></div></div>`);
      host.hidden = !ids.length && !saved.length && !opened && !unavailableSelection;
      tray.hidden = !ids.length;
      tray.lang = lang;
      tray.setAttribute("aria-label", t("heading"));
      const count = tray.querySelector(".pcc-comparison-tray-count");
      count.textContent = t("count", { n: ids.length, max: MAX });
      count.setAttribute("aria-label", t("selected", { n: ids.length }));
      tray.querySelector('[data-pcc-tray-action="open"] span').textContent = t("compare");
      tray.querySelector('[data-pcc-tray-action="clear"] span').textContent = t("clear");
      win.lucide?.createIcons({ root: host });
      win.lucide?.createIcons({ root: tray });
      const scroll = host.querySelector(".pcc-comparison-scroll");
      if (scroll) scroll.scrollLeft = scrollLeft;
      if ((host.hidden && focusInHost) || (tray.hidden && tray.contains(active))) restoreCatalogFocus();
      else if (savedFocus) {
        const target = [...host.querySelectorAll("[data-pcc-focus]")].find((el) => el.getAttribute("data-pcc-focus") === savedFocus && !el.disabled);
        (target || host.querySelector("[data-pcc-action='remove']") || host.querySelector("select"))?.focus({ preventScroll: true });
      }
      syncControls();
    }

    function setIds(requested, { updateUrl = true, message = "", notify = true, initial = false, fromUrl = false } = {}) {
      if (destroyed) return false;
      const state = model(index, requested);
      const changed = ids.length !== state.ids.length || ids.some((id, i) => id !== state.ids[i]);
      const invalidLink = fromUrl && new URL(win.location.href).searchParams.has("compare") && !requested.length;
      if (state.unavailable || invalidLink) unavailableSelection = true;
      else if (changed || fromUrl) unavailableSelection = false;
      ids = state.ids;
      if (updateUrl) syncUrl();
      render();
      announce(unavailableSelection ? t("someUnavailable") : state.limitExceeded ? t("max") : message);
      // Echoing selection or refreshing public data from an adapter must not recurse.
      if (notify && (changed || initial) && !notifying) {
        notifying = true;
        try { options.onChange?.(ids.slice()); } finally { notifying = false; }
      }
      return true;
    }

    function add(id) {
      if (destroyed) return false;
      if (!index.has(id)) { announce(t("cannotCompare")); return false; }
      if (ids.includes(id)) return true;
      if (ids.length === MAX) { announce(t("max")); return false; }
      return setIds([...ids, id], { message: t("selected", { n: ids.length + 1 }) });
    }

    function clear() {
      opened = false; unavailableSelection = false;
      return setIds([], { message: t("cleared") });
    }

    async function copyLink() {
      const link = url();
      if (!link || destroyed) return false;
      try {
        await win.navigator.clipboard.writeText(link);
        announce(t("copied"));
      } catch {
        if (destroyed) return false;
        const currentLink = url();
        if (!currentLink) { announce(t("needTwo")); return false; }
        const section = host.querySelector(".pcc-comparison-share");
        section.hidden = false;
        const input = section.querySelector("input"); input.value = currentLink; input.focus(); input.select();
        announce(t("copyFailed"));
      }
      return true;
    }

    async function click(event) {
      const control = event.target.closest?.("[data-pcc-action]");
      if (!control || !host.contains(control)) return;
      const action = control.dataset.pccAction, id = control.dataset.pccId;
      if (id && !index.has(id)) { event.preventDefault(); announce(t("missing")); return; }
      if (action === "contact" || action === "tour") {
        const handler = action === "contact" ? options.onContact || win.contactAdvisor : options.onTour || win.openTourRequest;
        if (!handler) return; // The ordinary contact link is a usable standalone fallback.
        event.preventDefault();
        try { await handler(id); } catch { announce(t("requestFailed")); }
        return;
      }
      event.preventDefault();
      if (action === "remove") setIds(ids.filter((value) => value !== id), { message: t("removed") });
      if (action === "clear") clear();
      if (action === "share") await copyLink();
      if (action === "save-selection") saveSelection(host.querySelector("#pcc-comparison-name").value);
      if (action === "load-selection") loadSelection(host.querySelector("#pcc-comparison-saved").value);
      if (action === "delete-selection") deleteSelection(host.querySelector("#pcc-comparison-saved").value);
      if (action === "favorite") {
        control.disabled = true;
        try {
          const previous = favorites(), desired = !previous.includes(id);
          const handler = options.onFavorite || win.toggleFavorite;
          if (handler) await handler(id, desired);
          else win.localStorage.setItem("pcc.favorites", JSON.stringify(desired ? [...previous, id] : previous.filter((item) => item !== id)));
          render(`favorite-${id}`);
          announce(t(favorites().includes(id) ? "favoriteSaved" : "favoriteRemoved"));
        } catch { control.disabled = false; announce(t("favoriteFailed")); }
      }
    }

    const externalClick = (event) => {
      const control = event.target.closest?.("[data-compare-id]");
      if (!control || event.defaultPrevented || (event.button !== undefined && event.button !== 0) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lastCompareControl = control;
      const id = control.getAttribute("data-compare-id");
      if (ids.includes(id)) setIds(ids.filter((value) => value !== id)); else add(id);
    };
    const change = (event) => {
      if (event.target.id === "pcc-comparison-add" && event.target.value) add(event.target.value);
      if (event.target.id === "pcc-comparison-differences") { differencesOnly = event.target.checked; render(); }
    };
    const trayClick = (event) => {
      const control = event.target.closest?.("[data-pcc-tray-action]");
      if (!control || !tray.contains(control)) return;
      if (control.dataset.pccTrayAction === "open") controller.open();
      if (control.dataset.pccTrayAction === "clear") clear();
    };
    const popstate = () => { opened = false; setIds(parseIds(win.location.href), { fromUrl: true }); };
    const storage = (event) => { if (["pcc.favorites", SAVED_KEY, null].includes(event.key)) render(); };
    const imageError = (event) => {
      if (!event.target.matches?.(".pcc-comparison-photo")) return;
      const placeholder = doc.createElement("div"); placeholder.className = "pcc-comparison-photo pcc-comparison-no-photo"; placeholder.textContent = t("failedPhoto"); event.target.replaceWith(placeholder);
    };
    host.addEventListener("click", click); host.addEventListener("change", change); host.addEventListener("error", imageError, true);
    tray.addEventListener("click", trayClick);
    doc.addEventListener("click", externalClick); win.addEventListener("popstate", popstate); win.addEventListener("storage", storage);
    const observer = new win.MutationObserver((entries) => {
      if (currentLanguage() !== lang) controller.update({});
      else if (entries.some((entry) => !host.contains(entry.target) && !tray.contains(entry.target))) syncControls();
    });
    observer.observe(doc.body, { childList: true, subtree: true });
    observer.observe(doc.documentElement, { attributes: true, attributeFilter: ["lang"] });
    const controller = {
      add, remove: (id) => setIds(ids.filter((value) => value !== id)), toggle: (id) => ids.includes(id) ? controller.remove(id) : add(id), setIds,
      updateProperties(nextProperties) { return controller.update({ properties: nextProperties }); },
      update(next = {}) {
        if (destroyed) return false;
        const nextOverride = Object.hasOwn(next, "lang") ? next.lang : languageOverride;
        const nextLang = language(nextOverride ?? doc.documentElement.lang);
        const nextProperties = Object.hasOwn(next, "properties") ? next.properties : properties;
        const nextIndex = publicIndex(nextProperties, nextLang);
        properties = nextProperties; languageOverride = nextOverride; lang = nextLang; index = nextIndex;
        if (Object.hasOwn(next, "differencesOnly")) differencesOnly = next.differencesOnly === true;
        return setIds(Object.hasOwn(next, "ids") ? next.ids : ids, { notify: next.notify !== false, updateUrl: next.updateUrl !== false });
      },
      setLang: (value) => controller.update({ lang: value }),
      saveSelection, loadSelection, deleteSelection,
      getSavedSelections: () => savedSelections().map((item) => ({ name: item.name, ids: model(index, item.ids).ids })),
      setDifferencesOnly(value) { if (destroyed) return false; differencesOnly = value === true; render(); return true; },
      getState: () => JSON.parse(JSON.stringify(snapshot())), shareUrl: url, share: copyLink, syncControls,
      refreshFavorites: () => render(),
      open() {
        if (destroyed) return;
        opened = true; host.hidden = false;
        host.scrollIntoView({ block: "start", behavior: "instant" });
        (host.querySelector(".pcc-comparison-scroll") || host.querySelector("select:not(:disabled)") || host).focus({ preventScroll: true });
      },
      destroy() {
        if (destroyed) return;
        destroyed = true; observer.disconnect();
        host.removeEventListener("click", click); host.removeEventListener("change", change); host.removeEventListener("error", imageError, true);
        tray.removeEventListener("click", trayClick);
        doc.removeEventListener("click", externalClick); win.removeEventListener("popstate", popstate); win.removeEventListener("storage", storage);
        for (const [control, values] of originalControls) for (const [name, value] of [["aria-pressed", values.pressed], ["aria-disabled", values.disabled]]) {
          if (value === null) control.removeAttribute(name); else control.setAttribute(name, value);
        }
        originalControls.clear(); host.remove(); tray.remove(); if (mounted.get(doc) === controller) mounted.delete(doc);
      },
    };
    mounted.set(doc, controller);
    setIds(options.ids ?? parseIds(win.location.href), { initial: true, fromUrl: options.ids == null });
    return controller;
  }

  return { MAX, parseIds, buildComparison, compatibility, sharePath, renderTable, priceText, surfaceText, mount };
});
