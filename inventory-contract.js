(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccInventory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "2026-10-29.2";
  const LOCATIONS = [
    { id: "zona-hotelera", name: "Zona Hotelera (ZH)", description: "Zona Hotelera de Cancún, Costa Mujeres y Punta Sam. Puerto Cancún se consulta por separado.", descriptionEn: "Cancun Hotel Zone, Costa Mujeres and Punta Sam. Puerto Cancun is listed separately." },
    { id: "puerto-cancun", name: "Puerto Cancún", description: "Únicamente Puerto Cancún; conserva sus subzonas y desarrollos.", descriptionEn: "Puerto Cancun only, retaining its neighborhoods and developments." },
    { id: "cancun-city", name: "Cancún City", description: "Ciudad de Cancún, Huayacán, corredor Colosio y subzonas urbanas confirmadas.", descriptionEn: "Cancun city, Huayacan, the Colosio corridor and confirmed urban neighborhoods." },
    { id: "fuera-de-cancun", name: "Fuera de Cancún", description: "Tulum, Playa del Carmen, Mérida, Ciudad de México y otros destinos fuera de las tres agrupaciones anteriores.", descriptionEn: "Tulum, Playa del Carmen, Merida, Mexico City and destinations outside the other three groups." },
  ];
  const TYPES = ["Casa", "Departamento", "Terreno", "Comercial"];
  const fold = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  const field = (p, camel, snake = camel) => p[camel] ?? p[snake];
  const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const suppliedField = (p, camel, snake = camel) => p[camel] !== undefined ? p[camel] : p[snake];
  const entityOf = (p) => {
    const section = field(p, "publicationSection", "publication_section");
    if (section === "typologies" || ["tipologia", "typology"].includes(fold(p.type))) return "typologies";
    return section === "developments" || p.type === "Desarrollo" ? "developments" : "properties";
  };
  const isPublic = (p) => entityOf(p) !== "typologies" && field(p, "isPublic", "is_public") !== false && ["active", "featured", undefined, null, ""].includes(p.status);
  const metadataOf = (p) => p.catalogData || p.catalog_data || {};
  const locationAliases = {
    "zona hotelera": "zona-hotelera", "zona hotelera cancun": "zona-hotelera", "zona hotelera de cancun": "zona-hotelera",
    "hotel zone": "zona-hotelera", "costa mujeres": "zona-hotelera", "punta sam": "zona-hotelera", "punta sam / playa mujeres": "zona-hotelera",
    "puerto cancun": "puerto-cancun", "puerto-cancun": "puerto-cancun", "p cancun": "puerto-cancun",
    "cancun city": "cancun-city", "cancun centro": "cancun-city", "centro cancun": "cancun-city", "ciudad de cancun": "cancun-city",
    "huayacan": "cancun-city", "avenida huayacan": "cancun-city", "av. huayacan": "cancun-city", "av huayacan": "cancun-city",
    "corredor colosio": "cancun-city", "boulevard colosio": "cancun-city", "blvd. luis donaldo colosio": "cancun-city",
    "lagos del sol": "cancun-city", "cumbres": "cancun-city", "poligono sur": "cancun-city", "alfredo v. bonfil": "cancun-city",
    "malecon tajamar": "cancun-city", "residencial campestre": "cancun-city", "supermanzana 15": "cancun-city", "supermanzana 17": "cancun-city",
    "fuera de cancun": "fuera-de-cancun",
  };
  const outsideCities = new Set(["tulum", "playa del carmen", "merida", "ciudad de mexico", "cdmx", "cozumel", "puerto morelos", "bacalar", "chetumal", "isla mujeres", "lazaro cardenas", "kantunilkin / lazaro cardenas", "chetumal / othon p. blanco", "felipe carrillo puerto", "jose maria morelos"]);
  const outsideZones = new Set(["tulum", "aldea zama", "la veleta", "playa del carmen", "playacar", "corasol", "mayakoba", "ciudad mayakoba", "merida", "cdmx", "ciudad de mexico", "holbox", "isla blanca", "mahahual", "bahia soliman", "akumal", "puerto aventuras", "cozumel", "isla mujeres"]);
  const colosioZones = new Set(["colosio", "corredor colosio", "boulevard colosio", "blvd. luis donaldo colosio"]);
  const aliasOf = (value) => owns(locationAliases, value) ? locationAliases[value] : "";

  function optionalNumber(value) {
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) return null;
    if (typeof value !== "number" && typeof value !== "string") return NaN;
    return Number(value);
  }

  function positiveAmount(value) {
    const number = optionalNumber(value);
    return number !== null && Number.isFinite(number) && number > 0 ? number : null;
  }

  function queryEnvelope(value) {
    if (!value || !owns(value, "query")) {
      if (!value || !owns(value, "errors")) return { value: value || {}, errors: [] };
      const validErrors = Array.isArray(value.errors) && value.errors.every((error) => typeof error === "string");
      return { value, errors: validErrors ? value.errors.slice() : ["Errores de consulta guardada inválidos"] };
    }
    if (!value.query || typeof value.query !== "object" || Array.isArray(value.query) || owns(value.query, "query") || !Array.isArray(value.errors) || value.errors.some((error) => typeof error !== "string")) {
      return { value: {}, errors: ["Consulta guardada inválida: se requieren query y errors"] };
    }
    return { value: value.query, errors: value.errors.slice() };
  }

  function locationId(value) {
    const normal = fold(value);
    return LOCATIONS.find((item) => item.id === normal)?.id || aliasOf(normal);
  }

  function resolveLocation(p) {
    const explicit = metadataOf(p).locationId || p.commercialLocationId;
    if (explicit && LOCATIONS.some((item) => item.id === explicit)) return { id: explicit, status: "confirmed", source: "classification", reason: "Asignación comercial revisada" };
    const zone = fold(p.zone), city = fold(p.city);
    // Street aliases need the same city evidence as the ambiguous neighborhood name.
    if (colosioZones.has(zone)) {
      const playa = /\bplaya del carmen\b/.test(city);
      const cancun = /\bcancun\b/.test(city) || (city === "benito juarez" && fold(p.state) === "quintana roo");
      if (playa && !cancun && zone === "colosio") return { id: "fuera-de-cancun", status: "mapped", source: "zone+city", reason: "Colosio, Playa del Carmen" };
      if (cancun && !playa && !outsideCities.has(city)) return { id: "cancun-city", status: "mapped", source: "zone+city", reason: "Colosio, Cancún" };
      return { id: "", status: "pending", source: "zone", reason: "Colosio requiere confirmar la ciudad" };
    }
    const known = aliasOf(zone);
    if (known) return { id: known, status: "mapped", source: "zone-alias", reason: p.zone };
    if (outsideZones.has(zone) || outsideCities.has(city)) return { id: "fuera-de-cancun", status: "mapped", source: "zone-or-city", reason: p.zone || p.city };
    // A broad city or title cannot disambiguate Hotel Zone, Puerto Cancun and urban Cancun.
    return { id: "", status: "pending", source: "", reason: "Agrupación comercial pendiente de revisar" };
  }

  function modalityOf(p) {
    const value = metadataOf(p).salesModality || p.salesModality;
    if (["presale", "direct", "resale"].includes(value)) return value;
    return p.type === "Preventa" ? "presale" : "unclassified";
  }

  function priceOf(p) {
    const declaredCurrency = suppliedField(p, "currency", "price_currency");
    const raw = suppliedField(p, "price", "price_amount");
    let currency = typeof declaredCurrency === "string" ? declaredCurrency.trim().toUpperCase() || null : null;
    const legacy = {
      USD: positiveAmount(suppliedField(p, "priceUsd", "price_usd")),
      MXN: positiveAmount(suppliedField(p, "priceMxn", "price_mxn")),
    };
    // Explicit amounts (including null) are authoritative; legacy columns are not replacements.
    if (declaredCurrency === undefined && raw === undefined) {
      const candidates = Object.keys(legacy).filter((key) => legacy[key] !== null);
      if (candidates.length === 1) currency = candidates[0];
    }
    const amount = raw !== undefined ? positiveAmount(raw) : legacy[currency] ?? null;
    const unit = suppliedField(p, "priceUnit", "price_unit");
    const basis = unit === undefined ? "total" : typeof unit === "string" ? unit.trim() || null : null;
    const operation = typeof p.operation === "string" ? p.operation.trim() || null : null;
    return { amount, currency, basis, operation, period: operation === "rent" ? metadataOf(p).rentPeriod || "unclassified" : "" };
  }

  function parseQuery(input = {}, defaults = {}) {
    const envelope = queryEnvelope(input);
    const defaultEnvelope = queryEnvelope(defaults);
    input = envelope.value;
    defaults = defaultEnvelope.value;
    const values = input instanceof URLSearchParams ? { ...Object.fromEntries(input.entries()), ...Object.fromEntries(["location", "locations", "bounds"].filter((key) => input.getAll(key).length > 1).map((key) => [key, input.getAll(key)])) } : input || {};
    const raw = { ...defaults, ...values };
    const errors = [...defaultEnvelope.errors, ...envelope.errors];
    if (["minPrice", "maxPrice"].some((key) => raw[key] !== undefined && raw[key] !== null && raw[key] !== "")) errors.push("Presupuesto antiguo pendiente de remapeo: no se puede ignorar minPrice/maxPrice");
    // Resolve aliases within the selected source, not across defaults and explicit filters.
    const locationSource = ["location", "locations"].some((key) => owns(values, key)) ? values : defaults;
    const locations = [];
    for (const key of ["location", "locations"]) {
      const value = locationSource[key];
      if (value === undefined || value === null || value === "") continue;
      for (const part of Array.isArray(value) ? value : [value]) {
        if (typeof part !== "string") { errors.push("Location inválida"); continue; }
        const entries = part.split(",").map((item) => item.trim()).filter(Boolean);
        if (!entries.length) errors.push("Location inválida");
        locations.push(...entries);
      }
    }
    const basisSource = owns(values, "priceBasis") ? values : defaults;
    const priceBasis = String(raw.priceBasis || "total");
    const priceBasisExplicit = Boolean(basisSource.priceBasis) && !(priceBasis === "total" && basisSource.priceBasisExplicit === false);
    let bounds = null;
    if (raw.bounds !== undefined && raw.bounds !== null && raw.bounds !== "") {
      const parts = Array.isArray(raw.bounds) ? raw.bounds : typeof raw.bounds === "string" ? raw.bounds.split(",") : [];
      const numbers = parts.map(optionalNumber);
      if (numbers.length !== 4 || numbers.some((number) => number === null || !Number.isFinite(number))) errors.push("Límites del mapa inválidos: usa cuatro números west,south,east,north");
      else if (Math.abs(numbers[0]) > 180 || Math.abs(numbers[2]) > 180 || Math.abs(numbers[1]) > 90 || Math.abs(numbers[3]) > 90) errors.push("Límites del mapa fuera de rango: longitud -180 a 180, latitud -90 a 90");
      else if (numbers[0] >= numbers[2] || numbers[1] >= numbers[3]) errors.push("Límites del mapa inválidos: west < east y south < north");
      else bounds = numbers;
    }
    const query = {
      entity: raw.entity || raw.publicationSection || (raw.type === "Desarrollo" ? "developments" : "properties"),
      text: String(raw.q ?? raw.text ?? "").trim().slice(0, 300),
      locations,
      bounds,
      zone: String(raw.zone || "").trim(),
      development: String(raw.development || "").trim(),
      type: raw.type === "Desarrollo" || raw.type === "Preventa" ? "" : String(raw.type || ""),
      operation: String(raw.operation || ""),
      modality: String(raw.modality || (raw.type === "Preventa" ? "presale" : "")),
      currency: String(raw.currency || "").toUpperCase(),
      priceBasis,
      priceBasisExplicit,
      rentPeriod: String(raw.rentPeriod || ""),
      min: optionalNumber(raw.min),
      max: optionalNumber(raw.max),
      beds: optionalNumber(raw.beds),
      featured: raw.featured === true || raw.featured === "1" || raw.featured === "true",
      sort: String(raw.sort || "recent"),
      page: raw.page === undefined || raw.page === "" ? 1 : Number(raw.page),
    };
    query.locations = [...new Set(query.locations.map((value) => locationId(value) || value))];
    if (query.locations.some((value) => !LOCATIONS.some((location) => location.id === value))) errors.push("Location no reconocida");
    if (!["properties", "developments"].includes(query.entity)) errors.push(query.entity === "typologies" ? "Tipologías pendientes de soporte; no son propiedades ni desarrollos" : "Tipo de inventario inválido");
    if (![undefined, null, "", true, false, "1", "0", "true", "false"].includes(raw.featured)) errors.push("Filtro de destacadas inválido");
    if (query.type && !TYPES.includes(query.type)) errors.push("Tipo de propiedad inválido");
    if (query.operation && !["sale", "rent"].includes(query.operation)) errors.push("Operación inválida");
    if (query.modality && !["presale", "direct", "resale", "unclassified"].includes(query.modality)) errors.push("Modalidad inválida");
    if (query.modality && query.operation === "rent") errors.push("La modalidad de venta no corresponde a renta");
    if (query.modality && !query.operation) query.operation = "sale";
    if (query.currency && !["USD", "MXN"].includes(query.currency)) errors.push("Moneda inválida");
    if (!["total", "sqm"].includes(query.priceBasis)) errors.push("Base de precio inválida");
    if (query.rentPeriod && !["month", "day", "year", "unclassified"].includes(query.rentPeriod)) errors.push("Periodo de renta inválido");
    for (const key of ["min", "max", "beds"]) if (query[key] !== null && (!Number.isFinite(query[key]) || query[key] < 0)) errors.push(`${key}: valor inválido`);
    if (query.min !== null && query.max !== null && query.min > query.max) errors.push("El precio mínimo supera el máximo");
    if ((query.min !== null || query.max !== null) && !query.currency) errors.push("Elige una moneda para aplicar el presupuesto");
    if ((query.min !== null || query.max !== null) && !query.operation) errors.push("Elige compra o renta para aplicar el presupuesto");
    if ((query.min !== null || query.max !== null) && query.operation === "rent" && !["month", "day", "year"].includes(query.rentPeriod)) errors.push("Elige un periodo de renta conocido para comparar precios");
    if (!["recent", "oldest", "price-asc", "price-desc", "title"].includes(query.sort)) errors.push("Orden inválido");
    if (!Number.isInteger(query.page) || query.page < 1 || query.page > 10000) errors.push("Página inválida");
    return { query, errors: [...new Set(errors)] };
  }

  function matches(p, query, { includePrivate = false } = {}) {
    if (query && (owns(query, "query") || owns(query, "errors"))) {
      const parsed = parseQuery(query);
      if (parsed.errors.length) return false;
      query = parsed.query;
    }
    if (!includePrivate && !isPublic(p)) return false;
    if (entityOf(p) !== query.entity) return false;
    if (query.locations.length && !query.locations.includes(resolveLocation(p).id)) return false;
    if (query.bounds) {
      const latitude = optionalNumber(p.latitude), longitude = optionalNumber(p.longitude);
      if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
      const [west, south, east, north] = query.bounds;
      if (longitude < west || longitude > east || latitude < south || latitude > north) return false;
    }
    if (query.zone && fold(p.zone) !== fold(query.zone)) return false;
    if (query.type && p.type !== query.type) return false;
    if (query.operation && p.operation !== query.operation) return false;
    if (query.modality && modalityOf(p) !== query.modality) return false;
    if (query.development && ![p.developmentId, p.development_id, p.parent_development_id, p.parentDevelopment?.id, p.parentDevelopment?.propertyId].includes(query.development)) return false;
    if (query.featured && !p.featured) return false;
    if (query.beds !== null && Number(p.beds || 0) < query.beds) return false;
    const price = priceOf(p);
    if (query.currency && price.currency !== query.currency) return false;
    if (query.rentPeriod && price.period !== query.rentPeriod) return false;
    if ((query.priceBasisExplicit || query.priceBasis === "sqm") && price.basis !== query.priceBasis) return false;
    if (query.min !== null || query.max !== null) {
      if (price.amount === null || price.basis !== query.priceBasis) return false;
      if (query.min !== null && price.amount < query.min) return false;
      if (query.max !== null && price.amount > query.max) return false;
    }
    if (query.text) {
      const haystack = fold([p.titleEs, p.title_es, p.titleEn, p.title_en, p.mls, p.zone, p.city, p.neighborhood, p.address, p.type, p.parentDevelopment?.nameEs, p.parentDevelopment?.nameEn, ...(p.keywords || [])].filter(Boolean).join(" "));
      if (!fold(query.text).split(/\s+/).every((term) => haystack.includes(term))) return false;
    }
    return true;
  }

  function queryInventory(items, input = {}, options = {}) {
    const parsed = parseQuery(input, options.defaults);
    if (parsed.errors.length) return { ...parsed, items: [], all: [], total: 0, page: 1, pages: 0 };
    const { query } = parsed;
    const unique = [...new Map(items.map((p) => [p.id, p])).values()];
    const all = unique.filter((p) => matches(p, query, options));
    const group = (p) => { const price = priceOf(p); return [price.currency, price.operation, price.basis, price.period].join("|"); };
    all.sort((a, b) => {
      const exact = Number(fold(b.mls) === fold(query.text) && !!query.text) - Number(fold(a.mls) === fold(query.text) && !!query.text);
      if (exact) return exact;
      let order = 0;
      if (query.sort.startsWith("price-")) {
        const pa = priceOf(a).amount, pb = priceOf(b).amount;
        if (pa === null || pb === null) order = Number(pa === null) - Number(pb === null);
        if (!order) order = group(a).localeCompare(group(b));
        if (!order && pa !== null && pb !== null) order = (pa - pb) * (query.sort === "price-desc" ? -1 : 1);
      } else if (query.sort === "title") order = fold(a.titleEs || a.title_es).localeCompare(fold(b.titleEs || b.title_es));
      else order = ((Date.parse(b.createdAt || b.created_at) || 0) - (Date.parse(a.createdAt || a.created_at) || 0)) * (query.sort === "oldest" ? -1 : 1);
      return order || String(a.id).localeCompare(String(b.id));
    });
    const size = Math.max(1, Math.min(100, options.pageSize || 24));
    const pages = Math.ceil(all.length / size);
    const page = Math.min(query.page, Math.max(1, pages));
    return { ...parsed, all, items: all.slice((page - 1) * size, page * size), total: all.length, page, pages };
  }

  function toSearchParams(query) {
    if (query && (owns(query, "query") || owns(query, "errors"))) {
      const parsed = parseQuery(query);
      if (parsed.errors.length) throw new TypeError(parsed.errors.join("; "));
      query = parsed.query;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ entity: query.entity, q: query.text, location: query.locations?.join(","), bounds: query.bounds?.join(","), zone: query.zone, type: query.type, operation: query.operation, modality: query.modality, development: query.development, currency: query.currency, min: query.min, max: query.max, priceBasis: query.priceBasisExplicit === false && query.priceBasis === "total" ? "" : query.priceBasis, rentPeriod: query.rentPeriod, beds: query.beds, featured: query.featured ? "1" : "", sort: query.sort, page: query.page })) {
      if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
    }
    return params;
  }

  function quality(p) {
    if (entityOf(p) === "typologies") {
      const label = "Tipología pendiente de soporte";
      return { version: VERSION, complete: false, score: 0, level: "incomplete", missing: [label], missingFields: [{ field: "entity", label }], issues: [{ code: "unsupported-entity", field: "entity", reason: label }], required: 1, fulfilled: 0 };
    }
    const missing = [];
    const issues = [];
    const title = String(field(p, "titleEs", "title_es") || "").trim();
    const description = String(field(p, "descriptionEs", "description_es") || "").trim();
    const images = Array.isArray(p.images) ? p.images : [];
    const nonempty = (value) => typeof value === "string" && Boolean(value.trim());
    const count = optionalNumber(p.image_count);
    const hasCover = Array.isArray(p.images) || p.image !== undefined
      ? images.some(nonempty) || nonempty(p.image)
      : Number.isInteger(count) && count > 0;
    const development = entityOf(p) === "developments";
    const price = priceOf(p);
    const checks = [
      ["title", "Título", Boolean(title)],
      ["zone", "Location por clasificar", Boolean(resolveLocation(p).id)],
      ["images", "Imagen de portada", hasCover],
      ["description", "Descripción comercial", description.length >= 80 && !isPlaceholder(description)],
    ];
    if (development) {
      const data = p.developmentData || p.development_record || p.development_data || {};
      const commercialText = [data.stage, data.paymentPlan, data.paymentPlanEn].some((value) => nonempty(value) && !isPlaceholder(value));
      const classified = ["presale", "direct", "resale"].includes(metadataOf(p).salesModality || p.salesModality);
      checks.push(["commercialization", "Información de comercialización", commercialText || classified || metadataOf(p).priceOnRequest === true]);
    } else {
      checks.push(["type", "Tipo de propiedad", TYPES.includes(p.type)]);
      checks.push(["operation", "Operación", ["sale", "rent"].includes(p.operation)]);
      checks.push(["price", "Precio y moneda o precio a consultar", (price.amount !== null && ["USD", "MXN"].includes(price.currency) && ["total", "sqm"].includes(price.basis)) || metadataOf(p).priceOnRequest === true]);
      if (p.operation === "rent") checks.push(["rentPeriod", "Periodo de renta", ["month", "day", "year"].includes(price.period)]);
      checks.push([p.type === "Terreno" ? "lot" : "area", p.type === "Terreno" ? "Superficie de terreno" : "Superficie de construcción", positiveAmount(p.type === "Terreno" ? p.lot : p.area) !== null]);
    }
    for (const [fieldName, label, complete] of checks) if (!complete) missing.push({ field: fieldName, label });
    if (isPlaceholder(description)) issues.push({ code: "placeholder-description", field: "description", reason: "La descripción contiene un texto de trabajo" });
    const descriptionTypes = [...fold(description).matchAll(/(?:^|[.!?]\s+)(?:(?:se (?:vende|renta)|venta de|renta de)\s+)?(?:(?:el|la|un|una|este|esta)\s+)?(casa|departamento)\b(?!\s+(?:club|de ventas))/g)].map((match) => match[1]);
    const opposite = p.type === "Casa" ? "departamento" : p.type === "Departamento" ? "casa" : "";
    if (opposite && (new RegExp(`\\b${opposite}\\b(?!\\s+(?:club|de ventas))`).test(fold(title)) || descriptionTypes.includes(opposite))) issues.push({ code: "type-conflict", field: "type", reason: "El título o la descripción y el tipo difieren; confirmar en la fuente" });
    if (p.type === "Departamento" && positiveAmount(p.lot) !== null && positiveAmount(p.area) === null) issues.push({ code: "area-concept", field: "lot", reason: "Revisar el concepto de superficie antes de renombrarlo" });
    const score = Math.round(100 * (checks.length - missing.length) / checks.length);
    return { version: VERSION, complete: missing.length === 0, score, level: missing.length ? "incomplete" : "ready", missing: missing.map((item) => item.label), missingFields: missing, issues, required: checks.length, fulfilled: checks.length - missing.length };
  }

  function isPlaceholder(value) {
    return /^(?:(?:por definir|pendiente|por completar|to be defined|pending|sin descripcion|n\/?a)(?:[.!;,:\s-]+|$))+$/.test(fold(value));
  }

  function reconcile(items) {
    const unique = [...new Map(items.map((p) => [p.id, p])).values()];
    const mls = new Map();
    for (const p of unique) if (p.mls) mls.set(fold(p.mls), [...(mls.get(fold(p.mls)) || []), p.id]);
    const allRecords = unique.map((p) => ({ id: p.id, title: p.titleEs || p.title_es, mls: p.mls, entity: entityOf(p), status: p.status, public: isPublic(p), zone: p.zone, city: p.city, location: resolveLocation(p), quality: quality(p), price: priceOf(p), duplicateMlsIds: mls.get(fold(p.mls))?.length > 1 ? mls.get(fold(p.mls)) : [] }));
    const records = allRecords.filter((p) => p.entity !== "typologies");
    const pendingRecords = allRecords.filter((p) => p.entity === "typologies");
    const counts = ["properties", "developments"].map((entity) => ({ entity, total: records.filter((p) => p.entity === entity).length, locations: [...LOCATIONS, { id: "", name: "Pendiente de clasificar" }].map((location) => ({ id: location.id, name: location.name, total: records.filter((p) => p.entity === entity && p.location.id === location.id).length, public: records.filter((p) => p.entity === entity && p.location.id === location.id && p.public).length })) }));
    return { version: VERSION, total: records.length, counts, records, pendingRecords };
  }

  return { VERSION, LOCATIONS, TYPES, fold, entityOf, isPublic, locationId, resolveLocation, modalityOf, priceOf, parseQuery, matches, queryInventory, toSearchParams, quality, isPlaceholder, reconcile };
});
