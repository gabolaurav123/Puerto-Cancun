const PROPERTY_TYPES = Object.freeze(["Casa", "Departamento", "Terreno", "Comercial", "Preventa", "Desarrollo"]);
const OPERATIONS = Object.freeze(["sale", "rent"]);
const CURRENCIES = Object.freeze(["USD", "MXN"]);
const AMENITIES = Object.freeze(["alberca", "marina", "gimnasio", "seguridad", "playa", "coworking", "tenis", "spa"]);
const FEATURES = Object.freeze(["frente_al_mar", "vista_al_mar", "inversion", "moderno", "lujo", "familiar", "tranquilo"]);

function fold(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function numericAmount(value, suffix = "") {
  const amount = Number(String(value || "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return null;
  const normalizedSuffix = fold(suffix);
  if (/mill(?:on|ones)|million|m\b/.test(normalizedSuffix)) return Math.round(amount * 1_000_000);
  if (/mil|thousand|k\b/.test(normalizedSuffix)) return Math.round(amount * 1_000);
  return Math.round(amount);
}

function normalizeAllowed(value, allowed, aliases = {}) {
  const normalized = fold(value);
  if (!normalized) return null;
  const alias = aliases[normalized];
  if (alias && allowed.includes(alias)) return alias;
  return allowed.find((item) => fold(item) === normalized) || null;
}

function detectAmount(text) {
  const priceContext = /(?:menos de|hasta|maximo|maximo de|presupuesto(?: de)?|under|below|up to|maximum(?: of)?)[\s:$]*(?:mxn|usd|us\$|\$)?\s*([\d.,]+)\s*(millones?|million|mil|thousand|m\b|k\b)?/i.exec(text);
  if (priceContext) return numericAmount(priceContext[1], priceContext[2]);
  const currencyAmount = /(?:mxn|usd|us\$|\$)\s*([\d.,]+)\s*(millones?|million|mil|thousand|m\b|k\b)?/i.exec(text);
  return currencyAmount ? numericAmount(currencyAmount[1], currencyAmount[2]) : null;
}

function parseIntelligentSearch(input, options = {}) {
  const query = String(input || "").trim().slice(0, 600);
  const text = fold(query);
  const knownLocations = Array.isArray(options.locations) ? options.locations.filter(Boolean) : [];
  const filters = {
    operation: null,
    propertyType: null,
    location: null,
    minPrice: null,
    maxPrice: null,
    currency: null,
    bedrooms: null,
    bathrooms: null,
    minArea: null,
    amenities: [],
    features: [],
    sort: "relevance",
  };

  if (/\b(renta|rentar|alquiler|rent|lease)\b/.test(text)) filters.operation = "rent";
  else if (/\b(venta|comprar|compra|sale|buy|purchase|inversion)\b/.test(text)) filters.operation = "sale";

  if (/\b(departamento|departamentos|depa|condo|apartment)\b/.test(text)) filters.propertyType = "Departamento";
  else if (/\b(casa|casas|villa|home|house)\b/.test(text)) filters.propertyType = "Casa";
  else if (/\b(terreno|terrenos|lote|land|lot)\b/.test(text)) filters.propertyType = "Terreno";
  else if (/\b(comercial|local|oficina|commercial|retail|office)\b/.test(text)) filters.propertyType = "Comercial";
  else if (/\b(preventa|preventa|presale|pre-sale)\b/.test(text)) filters.propertyType = "Preventa";
  else if (/\b(desarrollo|desarrollos|proyecto inmobiliario|real estate development|developments?)\b/.test(text)) filters.propertyType = "Desarrollo";

  if (/\b(mxn|pesos?|peso mexicano)\b/.test(text)) filters.currency = "MXN";
  else if (/\b(usd|dolares?|dollars?|us\$)\b/.test(text)) filters.currency = "USD";
  const maxPrice = detectAmount(text);
  if (maxPrice !== null) filters.maxPrice = maxPrice;

  const bedrooms = /(?:de|con|at least|minimum|minimo)?\s*(\d{1,2})\s*(?:recamaras?|habitaciones?|dormitorios?|bedrooms?|beds?)\b/i.exec(text);
  const bathrooms = /(?:de|con|at least|minimum|minimo)?\s*(\d{1,2})\s*(?:banos?|bathrooms?|baths?)\b/i.exec(text);
  const area = /(?:mas de|minimo|at least|over)?\s*([\d.,]+)\s*(?:m2|m²|metros cuadrados|square meters)\b/i.exec(text);
  if (bedrooms) filters.bedrooms = Math.min(20, Number(bedrooms[1]));
  if (bathrooms) filters.bathrooms = Math.min(20, Number(bathrooms[1]));
  if (area) filters.minArea = Math.min(1_000_000, numericAmount(area[1]) || 0) || null;

  const matchedLocation = knownLocations
    .map((location) => ({ location, key: fold(location) }))
    .filter((item) => item.key && text.includes(item.key))
    .sort((a, b) => b.key.length - a.key.length)[0];
  if (matchedLocation) filters.location = matchedLocation.location;

  const amenityAliases = {
    alberca: ["alberca", "piscina", "pool"],
    marina: ["marina", "muelle", "dock"],
    gimnasio: ["gimnasio", "gym"],
    seguridad: ["seguridad", "vigilancia", "security"],
    playa: ["playa", "beach", "club de playa"],
    coworking: ["coworking", "trabajo compartido"],
    tenis: ["tenis", "tennis"],
    spa: ["spa"],
  };
  Object.entries(amenityAliases).forEach(([amenity, aliases]) => {
    if (aliases.some((alias) => text.includes(alias))) filters.amenities.push(amenity);
  });
  const featureAliases = {
    frente_al_mar: ["frente al mar", "oceanfront", "beachfront"],
    vista_al_mar: ["vista al mar", "ocean view", "sea view"],
    inversion: ["inversion", "investment", "rendimiento"],
    moderno: ["moderno", "contemporaneo", "modern", "contemporary"],
    lujo: ["lujo", "exclusivo", "luxury", "exclusive"],
    familiar: ["familiar", "family"],
    tranquilo: ["tranquilo", "quiet", "privacy", "privacidad"],
  };
  Object.entries(featureAliases).forEach(([feature, aliases]) => {
    if (aliases.some((alias) => text.includes(alias))) filters.features.push(feature);
  });
  if (/\b(mas barato|menor precio|cheapest|lower price)\b/.test(text)) filters.sort = "price_asc";
  if (/\b(mas nuevo|reciente|latest|newest)\b/.test(text)) filters.sort = "newest";
  return validateSearchFilters(filters, { knownLocations });
}

function validateSearchFilters(input = {}, options = {}) {
  const knownLocations = Array.isArray(options.knownLocations) ? options.knownLocations : [];
  const location = knownLocations.length ? normalizeAllowed(input.location, knownLocations) : String(input.location || "").trim().slice(0, 120) || null;
  const optionalNumber = (value, { integer = false, max = Number.MAX_SAFE_INTEGER } = {}) => {
    if (value === undefined || value === null || value === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) return null;
    return Math.min(max, number);
  };
  return {
    operation: normalizeAllowed(input.operation, OPERATIONS, { venta: "sale", compra: "sale", renta: "rent" }),
    propertyType: normalizeAllowed(input.propertyType, PROPERTY_TYPES, { apartment: "Departamento", condo: "Departamento", house: "Casa", home: "Casa", land: "Terreno", presale: "Preventa", commercial: "Comercial", development: "Desarrollo", desarrollo: "Desarrollo" }),
    location,
    minPrice: optionalNumber(input.minPrice),
    maxPrice: optionalNumber(input.maxPrice),
    currency: normalizeAllowed(input.currency, CURRENCIES),
    bedrooms: optionalNumber(input.bedrooms, { integer: true, max: 20 }),
    bathrooms: optionalNumber(input.bathrooms, { integer: true, max: 20 }),
    minArea: optionalNumber(input.minArea, { max: 1_000_000 }),
    amenities: [...new Set((Array.isArray(input.amenities) ? input.amenities : []).map((item) => normalizeAllowed(item, AMENITIES)).filter(Boolean))],
    features: [...new Set((Array.isArray(input.features) ? input.features : []).map((item) => normalizeAllowed(item, FEATURES)).filter(Boolean))],
    sort: ["relevance", "price_asc", "price_desc", "newest"].includes(input.sort) ? input.sort : "relevance",
  };
}

function propertySearchText(property) {
  return fold([
    property.titleEs, property.titleEn, property.descriptionEs, property.descriptionEn,
    property.type, property.zone, property.neighborhood, property.city, property.state,
    property.operation === "rent" ? "renta rent lease" : "venta sale buy compra",
    property.mls,
    property.beds ? `${property.beds} recamaras bedrooms beds` : "",
    property.baths ? `${property.baths} banos bathrooms baths` : "",
    property.area ? `${property.area} m2 metros cuadrados square meters` : "",
    property.lot ? `${property.lot} m2 terreno lot land` : "",
    property.parentDevelopment?.nameEs,
    property.parentDevelopment?.nameEn,
    property.parentDevelopment?.developer,
    ...(property.amenities || []), ...(property.keywords || []),
  ].filter(Boolean).join(" "));
}

function propertyMatchesQuery(property, query = "") {
  const ignored = new Set([
    "busco", "buscar", "quiero", "necesito", "mostrar", "muestrame", "propiedad", "propiedades",
    "para", "con", "una", "uno", "unos", "unas", "del", "las", "los", "que", "por", "and", "the",
    "show", "find", "looking", "property", "properties", "real", "estate",
  ]);
  const terms = fold(query)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !ignored.has(term));
  if (!terms.length) return true;
  const text = propertySearchText(property);
  return terms.some((term) => text.includes(term));
}

function propertyMatchesFilters(property, filters, { relaxed = false } = {}) {
  const text = propertySearchText(property);
  if (filters.operation && property.operation !== filters.operation) return false;
  if (filters.propertyType && property.type !== filters.propertyType) return false;
  if (filters.location && !text.includes(fold(filters.location))) return false;
  if (filters.currency && property.currency !== filters.currency && !relaxed) return false;
  if (filters.maxPrice !== null && Number(property.price || 0) > filters.maxPrice * (relaxed ? 1.2 : 1)) return false;
  if (filters.minPrice !== null && Number(property.price || 0) < filters.minPrice * (relaxed ? 0.8 : 1)) return false;
  if (filters.bedrooms !== null && Number(property.beds || 0) < filters.bedrooms) return false;
  if (filters.bathrooms !== null && Number(property.baths || 0) < filters.bathrooms) return false;
  if (filters.minArea !== null && Number(property.area || property.lot || 0) < filters.minArea) return false;
  if (!relaxed && filters.amenities.some((amenity) => !text.includes(fold(amenity)))) return false;
  if (!relaxed && filters.features.some((feature) => !text.includes(fold(feature.replace(/_/g, " "))))) return false;
  return true;
}

function rankProperties(properties, filters, query = "") {
  const queryTerms = fold(query).split(/\s+/).filter((term) => term.length > 2);
  return properties.map((property) => {
    const text = propertySearchText(property);
    let relevance = Number(property.featured) * 8;
    relevance += queryTerms.filter((term) => text.includes(term)).length * 3;
    relevance += filters.features.filter((feature) => text.includes(fold(feature.replace(/_/g, " ")))).length * 5;
    relevance += filters.amenities.filter((amenity) => text.includes(fold(amenity))).length * 4;
    return { property, relevance };
  }).sort((a, b) => {
    if (filters.sort === "price_asc") return Number(a.property.price || Infinity) - Number(b.property.price || Infinity);
    if (filters.sort === "price_desc") return Number(b.property.price || 0) - Number(a.property.price || 0);
    if (filters.sort === "newest") return new Date(b.property.updatedAt || b.property.createdAt || 0) - new Date(a.property.updatedAt || a.property.createdAt || 0);
    return b.relevance - a.relevance;
  }).map((item) => item.property);
}

function computeLeadScore(contact = {}, activity = {}) {
  const factors = [];
  let score = 8;
  const add = (points, label, confirmed = true) => { score += points; factors.push({ points, label, confirmed }); };
  if (contact.phone) add(14, "Teléfono disponible");
  if (contact.email) add(10, "Correo disponible");
  if ((contact.preferredZones || []).length) add(12, "Zona de interés definida");
  if (contact.budgetMax || contact.budgetMin) add(14, "Presupuesto registrado");
  if (contact.propertyType) add(8, "Tipo de propiedad definido");
  if (activity.interactions > 1) add(Math.min(18, activity.interactions * 3), `${activity.interactions} interacciones registradas`);
  if (activity.propertyViews > 0) add(Math.min(12, activity.propertyViews * 2), `${activity.propertyViews} vistas de propiedades`);
  if (activity.pendingTask) add(5, "Seguimiento pendiente");
  const value = Math.min(100, Math.round(score));
  return { value, level: value >= 75 ? "premium" : value >= 55 ? "hot" : value >= 32 ? "warm" : "cold", factors };
}

module.exports = {
  AMENITIES,
  CURRENCIES,
  FEATURES,
  OPERATIONS,
  PROPERTY_TYPES,
  computeLeadScore,
  fold,
  parseIntelligentSearch,
  propertyMatchesFilters,
  propertyMatchesQuery,
  rankProperties,
  validateSearchFilters,
};
