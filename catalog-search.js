"use strict";

const { fold } = require("./intelligence-utils");
const inventory = require("./inventory-contract");

const FILTER_KEYS = ["entity", "text", "locations", "bounds", "zone", "type", "operation", "modality", "currency", "min", "max", "beds", "development", "featured", "priceBasis", "priceBasisExplicit", "rentPeriod"];
const MESSAGES = [
  ["input_type", "La consulta debe ser texto.", "The search must be text."],
  ["input_length", "La consulta supera 600 caracteres; acortala sin omitir los limites obligatorios.", "The search exceeds 600 characters; shorten it without dropping required limits."],
  ["editorial", "El criterio editorial requiere una consulta administrativa autorizada; no se aplica al catalogo publico.", "This editorial requirement needs an authorized administrative search; it cannot be applied to the public catalog."],
  ["travel_time", "No se aplica el filtro de minutos: requiere un servicio de rutas, destino y condiciones verificables.", "Travel time cannot be filtered without a routing service, a destination and verifiable travel conditions."],
  ["sea_view", "Vista o acceso al mar no verificados: no se aplican ni se deducen de texto o fotos.", "Sea views or access are unverified: they cannot be filtered or inferred from text or photos."],
  ["unsupported_attribute", "Ese atributo no tiene un filtro verificado en el contrato; elige criterios disponibles.", "That attribute has no verified filter in the catalog contract; choose supported criteria."],
  ["exclusion", "No se aplican exclusiones como inclusiones; confirma el filtro positivo deseado.", "Exclusions cannot be treated as inclusions; explicitly confirm the intended positive filter."],
  ["entity_conflict", "Elige propiedades/unidades o desarrollos; no se mezclan ambas entidades.", "Choose properties/units or developments; the two entities cannot be mixed."],
  ["commercial_use", "Uso comercial del terreno no verificado documentalmente; solo se aplica Tipo Terreno.", "Commercial land use is not documented; only the Land property type is applied."],
  ["type_conflict", "El contrato admite un solo tipo; elige Casa, Departamento, Terreno o Comercial.", "Only one property type is supported; choose Home, Apartment, Land or Commercial."],
  ["name_conflict", "El nombre coincide con varios desarrollos o unidades; elige una identidad antes de buscar.", "The name matches multiple developments or units; choose an identity before searching."],
  ["development_identity", "El desarrollo no tiene un identificador de relacion verificable; confirma su selector.", "The development has no verifiable relationship ID; confirm its selector."],
  ["name_entity", "El nombre pertenece a una unidad, no a un desarrollo; confirma la entidad.", "The name belongs to a unit, not a development; confirm the entity."],
  ["subzone_union", "La union de subzonas no cabe en zone (campo unico). Locations conserva los grupos propuestos; elige una subzona o confirma ampliar a los grupos completos antes de consultar.", "A union of subareas cannot fit in the single zone field. Locations retains the proposed groups; choose one subarea or explicitly confirm expanding to the full groups before searching."],
  ["zone_alias", "Hay varios alias de esa subzona en el catalogo; confirma una zona exacta antes de consultar.", "The catalog has multiple aliases for this subarea; confirm an exact zone before searching."],
  ["colosio", "Colosio requiere confirmar la ciudad: Cancun o Playa del Carmen.", "Confirm the city for Colosio: Cancun or Playa del Carmen."],
  ["cancun", "Cancun no identifica una unica Location; elige Zona Hotelera, Puerto Cancun o Cancun City.", "Cancun does not identify one Location; choose Hotel Zone, Puerto Cancun or Cancun City."],
  ["operation_conflict", "Compra y renta requieren presupuestos separados; elige una operacion.", "Purchase and rent require separate budgets; choose one operation."],
  ["operation_budget", "Al cambiar compra/renta se retira el presupuesto anterior: total y renta por periodo no son comparables.", "Changing purchase/rent removes the previous budget: a total price and rent per period cannot be compared."],
  ["modality_conflict", "Elige una sola modalidad de venta.", "Choose one sales mode."],
  ["period_conflict", "Elige un solo periodo de renta: mensual, diario o anual.", "Choose one rental period: monthly, daily or yearly."],
  ["period_budget", "Se retira el presupuesto al cambiar el periodo; no se convierten rentas automaticamente.", "Changing the rental period removes the previous budget; rents are not converted automatically."],
  ["bedroom_operator", "El contrato solo admite un minimo de recamaras, no un maximo ni un numero exacto.", "Only a minimum bedroom count is supported, not a maximum or an exact count."],
  ["bedroom_conflict", "Indica un solo minimo de recamaras.", "Specify one minimum bedroom count."],
  ["currency_conflict", "Elige una sola moneda soportada, USD o MXN; no se hacen conversiones.", "Choose one supported currency, USD or MXN; no currency conversion is performed."],
  ["basis_budget", "Se retira el presupuesto al cambiar la base de precio; no se calcula un total sin superficie verificada.", "Changing the price basis removes the previous budget; no total is calculated without verified area data."],
  ["area", "Superficie no disponible como filtro en este contrato; no se aplica como presupuesto.", "Area is not a supported filter in this contract; it is not treated as a budget."],
  ["negative_budget", "El presupuesto no puede ser negativo; confirma el importe.", "The budget cannot be negative; confirm the amount."],
  ["budget_conflict", "Hay varios presupuestos; confirma un unico intervalo y moneda.", "There are multiple budgets; confirm one price range and currency."],
  ["invalid_amount", "Importe no valido o ambiguo; usa una cantidad numerica y moneda explicitas.", "The amount is invalid or ambiguous; specify an explicit numeric amount and currency."],
  ["rental_period", "Elige el periodo de renta: mensual, diario o anual.", "Choose the rental period: monthly, daily or yearly.", true],
  ["text_length", "El texto libre supera 300 caracteres; acortalo para que el contrato no lo trunque.", "Free text exceeds 300 characters; shorten it so the contract does not truncate it."],
  ["conversation_invalid", "El contexto de aclaraciones esta incompleto o no es valido; revisa los requisitos o inicia una nueva busqueda.", "The clarification context is incomplete or invalid; review the requirements or start a new search."],
  ["missing_currency", "Elige una moneda para aplicar el presupuesto", "Choose a currency before applying the budget.", true],
  ["missing_operation", "Elige compra o renta para aplicar el presupuesto", "Choose purchase or rent before applying the budget.", true],
  ["missing_period", "Elige un periodo de renta conocido para comparar precios", "Choose a known rental period before comparing prices.", true],
  ["old_missing_period", "Elige el periodo de renta para comparar precios", "Choose the rental period before comparing prices.", true],
  ["invalid_location", "Location invalida", "Invalid Location.", true],
  ["unknown_location", "Location no reconocida", "Unrecognized Location.", true],
  ["invalid_entity", "Tipo de inventario invalido", "Invalid inventory entity.", true],
  ["typologies", "Tipologias pendientes de soporte; no son propiedades ni desarrollos", "Typologies are not supported; they are neither properties nor developments.", true],
  ["invalid_featured", "Filtro de destacadas invalido", "Invalid featured filter.", true],
  ["invalid_type", "Tipo de propiedad invalido", "Invalid property type.", true],
  ["invalid_operation", "Operacion invalida", "Invalid operation.", true],
  ["invalid_modality", "Modalidad invalida", "Invalid sales mode.", true],
  ["rent_modality", "La modalidad de venta no corresponde a renta", "A sales mode cannot be applied to rent.", true],
  ["invalid_currency", "Moneda invalida", "Invalid currency.", true],
  ["invalid_basis", "Base de precio invalida", "Invalid price basis.", true],
  ["invalid_period", "Periodo de renta invalido", "Invalid rental period.", true],
  ["invalid_min", "min: valor invalido", "min: invalid value.", true],
  ["invalid_max", "max: valor invalido", "max: invalid value.", true],
  ["invalid_beds", "beds: valor invalido", "beds: invalid value.", true],
  ["inverted_range", "El precio minimo supera el maximo", "The minimum price exceeds the maximum.", true],
  ["invalid_sort", "Orden invalido", "Invalid sort order.", true],
  ["invalid_page", "Pagina invalida", "Invalid page.", true],
  ["invalid_bounds", "Limites del mapa invalidos: usa cuatro numeros west,south,east,north", "Invalid map bounds: use four numbers west,south,east,north.", true],
  ["bounds_range", "Limites del mapa fuera de rango: longitud -180 a 180, latitud -90 a 90", "Map bounds are out of range: longitude -180 to 180, latitude -90 to 90.", true],
  ["bounds_order", "Limites del mapa invalidos: west < east y south < north", "Invalid map bounds: west < east and south < north are required.", true],
  ["legacy_budget", "Presupuesto antiguo pendiente de remapeo: no se puede ignorar minPrice/maxPrice", "Legacy budget needs remapping: minPrice/maxPrice cannot be ignored.", true],
  ["saved_errors", "Errores de consulta guardada invalidos", "Invalid saved-search errors.", true],
  ["saved_envelope", "Consulta guardada invalida: se requieren query y errors", "Invalid saved search: query and errors are required.", true],
];
const MESSAGE_BY_CODE = new Map(MESSAGES.map(([code, es, en, validation]) => [code, { code, es, en, validation: Boolean(validation) }]));
const MESSAGE_BY_TEXT = new Map([...MESSAGE_BY_CODE.values()].flatMap((entry) => [entry.es, entry.en].map((text) => [fold(text), entry])));

function catalogLanguage(...sources) {
  for (const source of sources) {
    const values = typeof source === "string" ? [source] : [source?.language, source?.lang, source?.conversation?.language];
    for (const value of values) {
      if (/^(es|en)(?:[-_]|$)/i.test(String(value || ""))) return String(value).slice(0, 2).toLowerCase();
    }
  }
  return "es";
}

function localizeCatalogError(message, language = "es") {
  const entry = MESSAGE_BY_TEXT.get(fold(message));
  if (entry) return entry[catalogLanguage(language)];
  return catalogLanguage(language) === "en" ? "A search criterion needs review; it cannot be ignored." : String(message);
}
const NUMBER_WORDS = { un: 1, una: 1, uno: 1, one: 1, dos: 2, two: 2, tres: 3, three: 3, cuatro: 4, four: 4, cinco: 5, five: 5, seis: 6, six: 6, siete: 7, seven: 7, ocho: 8, eight: 8, nueve: 9, nine: 9, diez: 10, ten: 10 };
const NUMBER = "(?:\\d{1,3}(?:[ \\u00a0]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d+)*)";
const SCALE = "(?:millon(?:es)?|millions?|thousand|mil|[mk](?![a-z0-9]))";
const MONEY = "(?:usd|mxn|us\\$|dolar(?:es)?|dollars?|pesos?|\\$)";
const AMOUNT = `(?:${MONEY}\\s*)?(${NUMBER})\\s*(${SCALE})?(?:\\s*${MONEY})?`;

// These are query aliases, not inventory corrections or inferred project locations.
const PLACES = [
  { aliases: ["zona hotelera de cancun", "zona hotelera cancun", "zona hotelera", "cancun hotel zone", "hotel zone", "zh"], location: "zona-hotelera" },
  { aliases: ["puerto cancun", "puerto-cancun", "p cancun", "p. cancun"], location: "puerto-cancun" },
  { aliases: ["cancun city", "ciudad de cancun", "cancun centro", "centro cancun", "downtown cancun"], location: "cancun-city" },
  { aliases: ["fuera de cancun", "outside cancun"], location: "fuera-de-cancun" },
  { aliases: ["avenida huayacan", "av. huayacan", "av huayacan", "huayacan"], location: "cancun-city", zone: "Huayac\u00e1n" },
  { aliases: ["corredor colosio", "boulevard colosio", "colosio cancun"], location: "cancun-city", zone: "Colosio" },
  { aliases: ["punta sam"], location: "zona-hotelera", zone: "Punta Sam" },
  { aliases: ["costa mujeres"], location: "zona-hotelera", zone: "Costa Mujeres" },
  { aliases: ["lagos del sol"], location: "cancun-city", zone: "Lagos del Sol" },
  { aliases: ["tulum"], location: "fuera-de-cancun", text: "Tulum" },
  { aliases: ["playa del carmen"], location: "fuera-de-cancun", text: "Playa del Carmen" },
  { aliases: ["merida"], location: "fuera-de-cancun", text: "M\u00e9rida" },
  { aliases: ["ciudad de mexico", "mexico city", "cdmx"], location: "fuera-de-cancun", text: "Ciudad de M\u00e9xico" },
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const unique = (values) => [...new Set(values)];
const blankFilters = () => ({ entity: "properties", locations: [] });
const hasBudget = (filters) => filters.min !== undefined || filters.max !== undefined;

function previousFilters(previous) {
  const source = previous?.filters || previous || {};
  const filters = blankFilters();
  for (const key of FILTER_KEYS) {
    const value = source[key];
    // Keep the interpreter's sparse filter shape, including absent numeric bounds.
    if (value !== undefined && value !== null && value !== "") filters[key] = Array.isArray(value) ? [...value] : value;
  }
  const locations = Array.isArray(filters.locations) ? filters.locations : String(filters.locations).split(",").filter(Boolean);
  filters.locations = unique(locations.map((value) => inventory.locationId(value) || value));
  return filters;
}

function amountOf(value, scale = "") {
  let raw = value.replace(/\s/g, "");
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(raw)) raw = raw.replace(/[.,]/g, "");
  else if (/^\d+[.,]\d{1,2}$/.test(raw)) raw = raw.replace(",", ".");
  else if (/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(raw)) raw = raw.replace(/,/g, "");
  else if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(raw)) raw = raw.replace(/\./g, "").replace(",", ".");
  else if (!/^\d+$/.test(raw)) return NaN;
  const multiplier = /^(m|millon|millones|million|millions)$/.test(scale) ? 1e6 : /^(mil|thousand|k)$/.test(scale) ? 1e3 : 1;
  const amount = Number(raw) * multiplier;
  return Number.isFinite(amount) && amount <= Number.MAX_SAFE_INTEGER ? Math.round(amount * 100) / 100 : NaN;
}

function namesOf(properties) {
  const names = [];
  const add = (name, kind, id = "") => {
    if (typeof name === "string" && fold(name).length >= 3) names.push({ name: name.trim(), key: fold(name), kind, id: String(id || "") });
  };
  for (const property of properties) {
    if (!property || !inventory.isPublic(property)) continue;
    if (inventory.entityOf(property) === "developments") {
      const id = property.developmentData?.id || property.id;
      for (const name of [property.titleEs, property.titleEn, property.title_es, property.title_en, property.nameEs, property.nameEn]) add(name, "development", id);
    } else {
      for (const name of [property.titleEs, property.titleEn, property.title_es, property.title_en]) add(name, "unit");
      const parent = property.parentDevelopment || {};
      if (!inventory.isPublic(parent)) continue;
      const id = property.developmentId || property.development_id || parent.id || parent.propertyId;
      for (const name of [parent.nameEs, parent.nameEn, parent.name_es, parent.name_en]) add(name, "development", id);
    }
  }
  return names.sort((a, b) => b.key.length - a.key.length || a.key.localeCompare(b.key));
}

function describe(filters, language = "es") {
  if (language === "en") {
    const labels = [filters.entity === "developments" ? "Developments" : "Properties"];
    labels.push({ sale: "Operation: Purchase", rent: "Operation: Rent" }[filters.operation] || "Operation: Purchase and rent");
    if (filters.type) labels.push(`Type: ${{ Casa: "Home", Departamento: "Apartment", Terreno: "Land", Comercial: "Commercial" }[filters.type] || filters.type}`);
    for (const location of filters.locations || []) labels.push(`Location: ${{ "zona-hotelera": "Hotel Zone", "puerto-cancun": "Puerto Cancun", "cancun-city": "Cancun City", "fuera-de-cancun": "Outside Cancun" }[location] || location}`);
    if (filters.zone) labels.push(`Subarea: ${filters.zone}`);
    if (filters.development) labels.push(`Units in development: ${filters.development}`);
    if (filters.modality) labels.push(`Sales mode: ${{ presale: "Presale", direct: "Direct sale", resale: "Resale", unclassified: "Unclassified" }[filters.modality] || filters.modality}`);
    if (filters.min !== undefined) labels.push(`Minimum price: ${filters.min} ${filters.currency || "(currency pending)"}`);
    if (filters.max !== undefined) labels.push(`Maximum price: ${filters.max} ${filters.currency || "(currency pending)"}`);
    if (filters.currency && !hasBudget(filters)) labels.push(`Currency: ${filters.currency}`);
    if (filters.rentPeriod) labels.push(`Period: ${{ month: "Monthly", day: "Daily", year: "Yearly", unclassified: "Unclassified" }[filters.rentPeriod] || filters.rentPeriod}`);
    if (filters.priceBasis === "sqm") labels.push("Price per sqm");
    if (filters.beds !== undefined) labels.push(`Minimum bedrooms: ${filters.beds}`);
    if (filters.featured) labels.push("Featured only");
    if (filters.text) labels.push(`Text: ${filters.text}`);
    return labels;
  }
  const labels = [filters.entity === "developments" ? "Desarrollos" : "Propiedades"];
  labels.push({ sale: "Operacion: Venta", rent: "Operacion: Renta" }[filters.operation] || "Operacion: Compra y renta");
  if (filters.type) labels.push(`Tipo: ${filters.type}`);
  for (const location of filters.locations || []) labels.push(`Location: ${inventory.LOCATIONS.find((item) => item.id === location)?.name || location}`);
  if (filters.zone) labels.push(`Subzona: ${filters.zone}`);
  if (filters.development) labels.push(`Unidades del desarrollo: ${filters.development}`);
  if (filters.modality) labels.push(`Modalidad: ${{ presale: "Preventa", direct: "Venta directa", resale: "Reventa", unclassified: "Sin clasificar" }[filters.modality] || filters.modality}`);
  if (filters.min !== undefined) labels.push(`Precio minimo: ${filters.min} ${filters.currency || "(moneda pendiente)"}`);
  if (filters.max !== undefined) labels.push(`Precio maximo: ${filters.max} ${filters.currency || "(moneda pendiente)"}`);
  if (filters.currency && !hasBudget(filters)) labels.push(`Moneda: ${filters.currency}`);
  if (filters.rentPeriod) labels.push(`Periodo: ${{ month: "Mensual", day: "Diario", year: "Anual" }[filters.rentPeriod] || filters.rentPeriod}`);
  if (filters.priceBasis === "sqm") labels.push("Precio por m2");
  if (filters.beds !== undefined) labels.push(`Recamaras minimas: ${filters.beds}`);
  if (filters.featured) labels.push("Solo destacadas");
  if (filters.text) labels.push(`Texto: ${filters.text}`);
  return labels;
}

/** Interpret only. Never fetch inventory, rank results, relax limits or grant access. */
function interpretCatalogSearch(input, previous = {}, options = {}) {
  let filters = previousFilters(previous);
  const language = catalogLanguage(options, previous);
  const warnings = [];
  // Pending requirements are separate from executable filters and survive JSON round trips.
  const carried = new Map(), added = new Map();
  const remember = (target, code, sources) => {
    target.set(code, unique([...(target.get(code) || []), ...sources]));
  };
  const state = previous?.conversation;
  if (state !== undefined) {
    if (!state || state.version !== 1 || !Array.isArray(state.pending) || state.pending.length > MESSAGES.length) {
      remember(carried, "conversation_invalid", []);
    } else {
      for (const item of state.pending) {
        const entry = MESSAGE_BY_CODE.get(item?.code);
        if (!entry || entry.validation || !Array.isArray(item.sources) || item.sources.length > 30 || item.sources.some((source) => typeof source !== "string" || source.length > 600)) {
          remember(carried, "conversation_invalid", []);
        } else remember(carried, item.code, item.sources);
      }
    }
  } else if (previous?.clarificationRequired || previous?.needsChoice) {
    const oldWarnings = previous.warnings;
    if (!Array.isArray(oldWarnings) || !oldWarnings.length) remember(carried, "conversation_invalid", []);
    else for (const message of oldWarnings) {
      const entry = MESSAGE_BY_TEXT.get(fold(message));
      if (!entry) remember(carried, "conversation_invalid", []);
      else if (!entry.validation) remember(carried, entry.code, []);
    }
  }
  const resolve = (...codes) => codes.forEach((code) => carried.delete(code));
  let clarificationRequired = false;
  const warn = (message, blocking = true, persist = true) => {
    const entry = MESSAGE_BY_TEXT.get(fold(message));
    warnings.push(localizeCatalogError(message, language));
    clarificationRequired ||= blocking;
    if (blocking && persist && !entry?.validation) remember(added, entry?.code || "conversation_invalid", typeof input === "string" && input.length <= 600 ? [input] : []);
  };
  const finish = () => {
    const parsed = inventory.parseQuery(filters);
    for (const error of parsed.errors) warn(error, true, false);
    for (const [code, sources] of added) remember(carried, code, sources);
    const pending = [...carried].map(([code, sources]) => ({ code, sources }));
    for (const item of pending) warnings.push(MESSAGE_BY_CODE.get(item.code)[language]);
    return { filters, warnings: unique(warnings), clarificationRequired: clarificationRequired || pending.length > 0,
      understood: describe(filters, language), conversation: { version: 1, language, pending } };
  };
  if (typeof input !== "string") {
    warn("La consulta debe ser texto.");
    return finish();
  }
  if (input.length > 600) {
    warn("La consulta supera 600 caracteres; acortala sin omitir los limites obligatorios.");
    return finish();
  }
  resolve("input_type", "input_length");
  let remaining = fold(input);
  const take = (regex) => {
    const matches = [...remaining.matchAll(new RegExp(regex.source, "g"))];
    remaining = remaining.replace(new RegExp(regex.source, "g"), (match) => " ".repeat(match.length));
    return matches;
  };
  const drop = (...keys) => keys.forEach((key) => { delete filters[key]; });

  if (take(/\b(nueva busqueda|empezar de nuevo|reiniciar busqueda|new search|start over|reset search)\b/).length) {
    filters = blankFilters(); carried.clear(); added.clear();
  }
  const discarded = options?.discardRequirements ?? previous?.discardRequirements;
  if (discarded !== undefined) {
    if (!Array.isArray(discarded) || discarded.some((code) => !MESSAGE_BY_CODE.has(code) || code === "conversation_invalid")) {
      warn(MESSAGE_BY_CODE.get("conversation_invalid").es);
    } else resolve(...discarded);
  }
  if (take(/\b(sin requisito de vista al mar|quita el requisito de vista al mar|drop (?:the )?(?:sea|ocean) view requirement)\b/).length) resolve("sea_view");
  if (take(/\b(sin requisito de tiempo|quita el requisito de tiempo|drop (?:the )?travel time requirement)\b/).length) resolve("travel_time");
  if (!remaining.trim()) return finish();

  const addLocations = /\b(tambien|ademas|incluye|incluir|also|include|add)\b/.test(remaining);
  if (take(/\b(sin (?:limite de precio|presupuesto)|cualquier precio|quita (?:el )?presupuesto|no (?:price limit|budget)|any price|remove (?:the )?budget)\b/).length) { drop("min", "max"); resolve("budget_conflict", "negative_budget", "invalid_amount"); }
  if (take(/\b(todas las zonas|cualquier (?:zona|ubicacion)|all locations|any location|anywhere)\b/).length) { filters.locations = []; drop("zone"); resolve("subzone_union", "zone_alias", "cancun", "colosio"); }
  if (take(/\b(todas las modalidades|cualquier modalidad|any modality|all modalities)\b/).length) { drop("modality"); resolve("modality_conflict"); }
  if (take(/\b(cualquier tipo|todos los tipos|any type|all types)\b/).length) { drop("type"); resolve("type_conflict"); }
  if (take(/\b(cualquier desarrollo|todos los desarrollos|any development|all developments)\b/).length) { drop("development"); resolve("name_conflict", "development_identity", "name_entity"); }
  if (take(/\b(sin minimo de recamaras|cualquier numero de recamaras|any bedrooms|no bedroom minimum)\b/).length) { drop("beds"); resolve("bedroom_conflict"); }
  if (take(/\b(incluye no destacadas|no solo destacadas|todas las propiedades|all properties|not only featured|include non featured)\b/).length) drop("featured");
  if (take(/\b(sin texto|quita (?:el )?texto|clear text|remove keywords)\b/).length) { drop("text"); resolve("text_length"); }

  if (take(/\b(sin portada|sin (?:foto|imagen) de portada|missing cover(?: image)?|without (?:a )?cover(?: image)?|borradores?|drafts?|privad[oa]s?|private|archivad[oa]s?|archived)\b/).length) {
    warn("El criterio editorial requiere una consulta administrativa autorizada; no se aplica al catalogo publico.");
  }
  if (take(/\b(?:(?:a|en|within|under|menos de|hasta)\s+)?(?:\d+|veinte|twenty|diez|ten|treinta|thirty)\s*(?:minutos?|minutes?|mins?)\b(?:\s+(?:del?|al?|from|to|of)\s+(?:el\s+|the\s+)?(?:aeropuerto|airport|centro|downtown))?/).length) {
    warn("No se aplica el filtro de minutos: requiere un servicio de rutas, destino y condiciones verificables.");
  }
  const optionalView = /\b(si tiene|si hay|mejor|preferiblemente|de preferencia|preferably|ideally|nice to have|preferred)\b/.test(remaining);
  if (take(/\b(vistas? al mar|ocean views?|sea views?|frente al mar|oceanfront|beachfront)\b/).length) {
    warn("Vista o acceso al mar no verificados: no se aplican ni se deducen de texto o fotos.", !optionalView);
    take(/\b(si tiene|si hay|mejor|preferiblemente|de preferencia|preferably|ideally|nice to have|preferred)\b/);
  }
  if (take(/\b(?:\d+\s*)?(?:banos?|bathrooms?|baths?|albercas?|piscinas?|pools?|gimnasio|gym|mascotas|pets?)\b/).length) warn("Ese atributo no tiene un filtro verificado en el contrato; elige criterios disponibles.");
  if (take(/\b(no|sin|excepto|excluir|excluye|not|without|except|exclude|non)\s+(?:casas?|houses?|homes?|departamentos?|apartments?|condos?|terrenos?|land|lots?|comercial|commercial|destacad[oa]s?|featured|rent\w*|renta|venta|sale|preventa|presale|reventa|resale|puerto cancun|punta sam|costa mujeres|huayacan|zona hotelera)\b/).length) warn("No se aplican exclusiones como inclusiones; confirma el filtro positivo deseado.");

  const properties = Array.isArray(options?.properties) ? options.properties.filter((p) => p && inventory.isPublic(p)) : [];
  const named = [];
  const catalogNames = namesOf(properties);
  for (const candidate of catalogNames) {
    if (take(new RegExp(`(?<![a-z0-9])${escapeRegex(candidate.key)}(?![a-z0-9])`)).length) {
      named.push(...catalogNames.filter((item) => item.key === candidate.key));
    }
  }

  const unitWords = /\b(unidades?|units?|propiedades|properties|departamentos?|apartments?|condos?|casas?|houses?|homes?|terrenos?|lots?)\b/.test(remaining);
  const projectWords = /\b(desarrollos?|proyectos?|developments?|projects?)\b/.test(remaining);
  const unitsOfProject = unitWords && /\b(?:del?|en|in|of)\s+(?:(?:el|los|the)\s+)?(?:desarrollos?|proyectos?|developments?|projects?)\b/.test(remaining);
  const previousEntity = filters.entity;
  if (projectWords && unitWords && !unitsOfProject) warn("Elige propiedades/unidades o desarrollos; no se mezclan ambas entidades.");
  else if (projectWords || unitWords) resolve("entity_conflict");
  if (projectWords && !unitWords) filters.entity = "developments";
  else if (unitWords) filters.entity = "properties";
  if (filters.entity !== previousEntity) drop("text", "development", "type", "beds");
  take(/\b(desarrollos?|proyectos?|developments?|projects?|unidades?|units?|propiedades|properties)\b/);

  const types = [
    ["Departamento", /\b(departamentos?|depas?|condos?|apartments?|apartamentos?|penthouses?)\b/],
    ["Casa", /\b(casas?|villas?|homes?|houses?)\b/],
    ["Terreno", /\b(terrenos?|lotes?|land|lots?)\b/],
    ["Comercial", /\b(comercial(?:es)?|commercial|local(?:es)?|oficinas?|retail|offices?)\b/],
  ].filter(([, regex]) => take(regex).length).map(([type]) => type);
  if (types.includes("Terreno") && types.includes("Comercial")) {
    types.splice(types.indexOf("Comercial"), 1);
    warn("Uso comercial del terreno no verificado documentalmente; solo se aplica Tipo Terreno.", false);
  }
  if (types.length > 1) warn("El contrato admite un solo tipo; elige Casa, Departamento, Terreno o Comercial.");
  else if (types.length) { filters.type = types[0]; resolve("type_conflict"); }

  let nameText = "";
  let placeText = "";
  if (named.length) {
    const projects = named.filter((item) => item.kind === "development");
    const units = named.filter((item) => item.kind === "unit");
    const ids = unique(projects.map((item) => item.id).filter(Boolean));
    if (ids.length > 1 || (projects.length && units.length) || unique(units.map((item) => item.key)).length > 1) {
      warn("El nombre coincide con varios desarrollos o unidades; elige una identidad antes de buscar.");
    } else if (projects.length && filters.entity === "properties" && ids.length === 1) {
      resolve("name_conflict", "development_identity", "name_entity");
      filters.development = ids[0];
      drop("text");
    } else {
      if ((projects.length && filters.entity === "developments") || (units.length && filters.entity === "properties")) resolve("name_conflict", "development_identity", "name_entity");
      filters.text = nameText = named[0].name;
      drop("development");
      if (projects.length && filters.entity === "properties") warn("El desarrollo no tiene un identificador de relacion verificable; confirma su selector.");
      if (units.length && filters.entity === "developments") warn("El nombre pertenece a una unidad, no a un desarrollo; confirma la entidad.");
    }
  }

  const places = [];
  const aliases = PLACES.flatMap((place) => place.aliases.map((alias) => ({ ...place, alias }))).sort((a, b) => b.alias.length - a.alias.length);
  for (const place of aliases) {
    const matches = take(new RegExp(`(?<![a-z0-9])${escapeRegex(place.alias)}(?![a-z0-9])`));
    if (matches.length) places.push({ ...place, index: matches[0].index });
  }
  places.sort((a, b) => a.index - b.index);
  if (places.length) {
    if (!addLocations) resolve("subzone_union", "zone_alias", "cancun");
    if (!addLocations && places.some((place) => place.zone === "Colosio")) resolve("colosio");
    const oldLocations = Array.isArray(filters.locations) ? filters.locations : [];
    const oldZone = filters.zone;
    const newLocations = unique(places.map((place) => place.location));
    const restrictive = places.filter((place) => place.zone || place.text);
    const redundantAddition = addLocations && !oldZone && !filters.text && newLocations.every((id) => oldLocations.includes(id));
    filters.locations = unique([...(addLocations ? oldLocations : []), ...newLocations]);
    if (!redundantAddition) {
      drop("zone");
      if (PLACES.some((place) => place.text && fold(place.text) === fold(filters.text))) drop("text");
      const sameZone = restrictive.length === 1 && oldZone && fold(oldZone) === fold(restrictive[0].zone);
      const multiple = places.length > 1 || (addLocations && oldLocations.length > 0 && !sameZone);
      if (multiple && (restrictive.length || (addLocations && oldZone))) {
        warn("La union de subzonas no cabe en zone (campo unico). Locations conserva los grupos propuestos; elige una subzona o confirma ampliar a los grupos completos antes de consultar.");
      } else if (restrictive.length === 1) {
        const place = restrictive[0];
        if (place.zone) {
          const zones = unique(properties.map((p) => p.zone).filter((zone) => place.aliases.includes(fold(zone))));
          filters.zone = zones.length === 1 ? zones[0] : place.zone;
          if (zones.length > 1 && unique(zones.map(fold)).length > 1) warn("Hay varios alias de esa subzona en el catalogo; confirma una zona exacta antes de consultar.");
        }
        if (place.text) {
          placeText = place.text;
          filters.text = [filters.text, placeText].filter(Boolean).join(" ");
        }
      }
    }
  }
  if (take(/\bcolosio\b/).length) warn("Colosio requiere confirmar la ciudad: Cancun o Playa del Carmen.");
  if (take(/\bcancun\b/).length && !places.length) warn("Cancun no identifica una unica Location; elige Zona Hotelera, Puerto Cancun o Cancun City.");

  const modalities = [
    ["presale", /\b(preventas?|pre[ -]?sales?|pre[ -]?construction|off[ -]?plan)\b/],
    ["resale", /\b(reventas?|re[ -]?sales?)\b/],
    ["direct", /\b(venta directa|entrega inmediata|direct sale|immediate delivery|ready to move(?: in)?)\b/],
  ].filter(([, regex]) => take(regex).length).map(([modality]) => modality);
  const rent = take(/\b(renta|rentar|rentas|alquiler|alquilar|arrendamiento|rent|rental|rentals|renting|lease|leasing)\b/).length > 0;
  const sale = take(/\b(venta|ventas|comprar|compra|sale|buy|buying|purchase)\b/).length > 0;
  const periods = [
    ["month", /\b(mensual(?:es)?|al mes|por mes|monthly|per month|a month)\b|\/month\b/],
    ["day", /\b(diari[oa]s?|por dia|al dia|por noche|daily|nightly|per day|per night)\b/],
    ["year", /\b(anual(?:es)?|al ano|por ano|yearly|annually|per year)\b/],
  ].filter(([, regex]) => take(regex).length).map(([period]) => period);
  const explicitOperation = rent || periods.length ? "rent" : sale || modalities.length ? "sale" : "";
  if ((rent || periods.length) && (sale || modalities.length)) warn("Compra y renta requieren presupuestos separados; elige una operacion.");
  else if (explicitOperation) {
    resolve("operation_conflict");
    if (filters.operation && filters.operation !== explicitOperation && hasBudget(filters)) {
      drop("min", "max");
      warn("Al cambiar compra/renta se retira el presupuesto anterior: total y renta por periodo no son comparables.", false);
    }
    filters.operation = explicitOperation;
    if (explicitOperation === "rent") drop("modality");
    else drop("rentPeriod");
  }
  if (modalities.length > 1) warn("Elige una sola modalidad de venta.");
  else if (modalities.length && filters.operation === "sale") { filters.modality = modalities[0]; resolve("modality_conflict"); }
  if (periods.length > 1) { drop("rentPeriod"); warn("Elige un solo periodo de renta: mensual, diario o anual."); }
  else if (periods.length === 1 && filters.operation === "rent") {
    resolve("period_conflict");
    if (filters.rentPeriod && filters.rentPeriod !== periods[0] && hasBudget(filters)) {
      drop("min", "max");
      warn("Se retira el presupuesto al cambiar el periodo; no se convierten rentas automaticamente.", false);
    }
    filters.rentPeriod = periods[0];
  }

  const bedroomQuantity = `(\\d+|${Object.keys(NUMBER_WORDS).join("|")})\\s*(?:recamaras?|habitaciones?|dormitorios?|bedrooms?|beds?)\\b`;
  if (take(new RegExp(`\\b(?:exactamente|exactly|hasta|maximo|at most|no more than|menos de|under)\\s+${bedroomQuantity}`)).length) warn("El contrato solo admite un minimo de recamaras, no un maximo ni un numero exacto.");
  const bedroomPattern = new RegExp(`\\b${bedroomQuantity}`);
  const bedrooms = take(bedroomPattern);
  if (bedrooms.length > 1) warn("Indica un solo minimo de recamaras.");
  else if (bedrooms.length) { filters.beds = NUMBER_WORDS[bedrooms[0][1]] || Number(bedrooms[0][1]); resolve("bedroom_conflict"); }
  if (take(/\b(destacad[oa]s?|featured)\b/).length) filters.featured = true;

  const currencies = [];
  if (/(?:\busd\b|us\$|\bdolar(?:es)?\b|\bdollars?\b|\d\s*usd\b)/.test(remaining)) currencies.push("USD");
  if (/(?:\bmxn\b|\bpesos?\b|\d\s*mxn\b)/.test(remaining)) currencies.push("MXN");
  const unsupportedCurrency = /\b(eur|euros?|cad|gbp|btc)\b/.test(remaining);
  if (currencies.length > 1 || unsupportedCurrency) {
    drop("currency");
    warn("Elige una sola moneda soportada, USD o MXN; no se hacen conversiones.");
  } else if (currencies.length === 1) { filters.currency = currencies[0]; resolve("currency_conflict"); }

  const oldBasis = filters.priceBasis || "total";
  if (take(/(?:por|per|\/)\s*(?:m2|m\u00b2|sqm|metro cuadrado|square met(?:er|re))(?![a-z0-9])/).length) { filters.priceBasis = "sqm"; if ("priceBasisExplicit" in filters) filters.priceBasisExplicit = true; }
  if (take(/\b(precio total|total price)\b/).length) { filters.priceBasis = "total"; if ("priceBasisExplicit" in filters) filters.priceBasisExplicit = true; }
  if (oldBasis !== (filters.priceBasis || "total") && hasBudget(filters)) {
    drop("min", "max");
    warn("Se retira el presupuesto al cambiar la base de precio; no se calcula un total sin superficie verificada.", false);
  }
  if (take(/\b\d+(?:[.,]\d+)?\s*(?:m2|m\u00b2|sqm|metros cuadrados|square meters)(?![a-z0-9])/).length) warn("Superficie no disponible como filtro en este contrato; no se aplica como presupuesto.");

  const identifiers = take(/\b(?:mls|id|codigo|code)\s*[:#-]?\s*([a-z0-9][a-z0-9-]*)\b/);
  const identifierText = identifiers.map((match) => match[1]).join(" ");
  if (identifierText) filters.text = [nameText, placeText, identifierText].filter(Boolean).join(" ");
  const range = take(new RegExp(`\\b(?:entre|between|from)\\s*${AMOUNT}\\s*(?:y|and|a|to|-)\\s*${AMOUNT}`, "g"));
  if (take(new RegExp(`(?<![a-z0-9])(?:${MONEY}\\s*)?-\\s*${NUMBER}\\s*(?:${SCALE})?(?:\\s*${MONEY})?`)).length) warn("El presupuesto no puede ser negativo; confirma el importe.");
  const maxima = take(new RegExp(`\\b(?:hasta|maximo(?: de)?|menos de|no mas de|tope(?: de)?|presupuesto(?: de)?|under|below|up to|maximum(?: of)?|at most|budget(?: of)?)\\s*[:$]?\\s*${AMOUNT}`));
  const minima = take(new RegExp(`\\b(?:desde|a partir de|minimo(?: de)?|mas de|minimum(?: of)?|at least|over|more than)\\s*[:$]?\\s*${AMOUNT}`));
  const bareAmounts = take(new RegExp(`(?:${MONEY}\\s*(${NUMBER})\\s*(${SCALE})?|(${NUMBER})\\s*(${SCALE})?\\s*${MONEY})`));
  const amounts = range.length + maxima.length + minima.length + bareAmounts.length;
  if (range.length > 1 || maxima.length > 1 || minima.length > 1 || (range.length && amounts > 1) || (bareAmounts.length && amounts > 1)) {
    warn("Hay varios presupuestos; confirma un unico intervalo y moneda.");
  } else if (amounts) {
    if (range.length) {
      const [, low, lowScale, high, highScale] = range[0];
      filters.min = amountOf(low, lowScale || (Number(low) < 1000 ? highScale : ""));
      filters.max = amountOf(high, highScale);
    } else {
      if (maxima.length) filters.max = amountOf(maxima[0][1], maxima[0][2]);
      if (minima.length) filters.min = amountOf(minima[0][1], minima[0][2]);
      if (bareAmounts.length) {
        const [, before, beforeScale, after, afterScale] = bareAmounts[0];
        filters.max = amountOf(before || after, before ? beforeScale : afterScale);
      }
    }
    if ([filters.min, filters.max].some((value) => value !== undefined && !Number.isFinite(value))) {
      drop("min", "max");
      warn("Importe no valido o ambiguo; usa una cantidad numerica y moneda explicitas.");
    } else resolve("negative_budget", "budget_conflict", "invalid_amount");
  }
  take(/\b(usd|mxn|dolar(?:es)?|dollars?|pesos?|eur|euros?|cad|gbp|btc)\b|us\$/);
  if (filters.operation === "rent" && !filters.rentPeriod) warn("Elige el periodo de renta: mensual, diario o anual.");

  // Unconsumed words remain a lexical AND query, not invented attributes or results.
  const residue = remaining
    .replace(/\b(busco|buscar|busca|quiero|necesito|muestrame|mostrar|ver|opciones|opcion|ahora|solo|solamente|tambien|ademas|incluye|incluir|por favor|de|del|en|con|para|por|a|al|el|la|los|las|un|una|unos|unas|y|o|que|se|si|me|i|want|need|looking|look|for|find|show|me|please|now|only|also|include|add|options|the|a|an|in|with|of|at|and|or|to|least|minimum|minimo|property|propiedad)\b/g, " ")
    .replace(/[,:;!?"'$]/g, " ").replace(/\s+/g, " ").trim();
  if (residue) filters.text = [nameText, placeText, identifierText, residue].filter(Boolean).join(" ");
  if (filters.text?.length > 300) warn("El texto libre supera 300 caracteres; acortalo para que el contrato no lo trunque.");
  return finish();
}

module.exports = { interpretCatalogSearch, catalogLanguage, localizeCatalogError };
