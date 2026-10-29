"use strict";

const inventory = require("./inventory-contract");
const { fold } = require("./intelligence-utils");
const { interpretCatalogSearch, catalogLanguage, localizeCatalogError } = require("./catalog-search");

const QUERY_KEYS = ["entity", "text", "locations", "bounds", "zone", "development", "type", "operation", "modality", "currency", "priceBasis", "priceBasisExplicit", "rentPeriod", "min", "max", "beds", "featured", "sort", "page"];
const LEGACY_KEYS = ["propertyType", "location", "minPrice", "maxPrice", "bedrooms", "q"];
const META_KEYS = ["contractVersion", "queryText", "query_text", "language", "lang", "errors", "conversation", "warnings", "clarificationRequired", "needsChoice", "understood"];
const KNOWN_KEYS = new Set([...QUERY_KEYS, ...LEGACY_KEYS, ...META_KEYS]);
const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const present = (value) => value !== undefined && value !== null && value !== "";
const restrictive = (value) => present(value) && value !== false && value !== 0 && (!Array.isArray(value) || value.length > 0);
const unique = (values) => [...new Set(values)];

/** Initial saved intent is a conjunction, not a conversational command to relax filters. */
function savedCatalogQuery(input = {}, options = {}) {
  if (typeof options === "string") options = { queryText: options };
  options = object(options) ? options : {};
  const language = catalogLanguage(options, input, input?.filters);
  const t = (es, en) => language === "en" ? en : es;
  const errors = [];
  const invalid = () => errors.push(t("Consulta guardada invalida; revisa sus criterios.", "Invalid saved search; review its criteria."));
  const conflict = (key) => errors.push(t(`Criterios incompatibles para ${key}; confirma una eleccion antes de guardar.`, `Conflicting ${key} criteria; confirm a choice before saving.`));
  if (!object(input)) { invalid(); input = {}; }
  let source = input;
  if (owns(input, "filters") || owns(input, "query")) {
    source = input.filters ?? input.query;
    if (!object(source)) { invalid(); source = {}; }
    for (const key of Object.keys(input)) {
      if (!["filters", "query", ...META_KEYS].includes(key) && restrictive(input[key])) {
        errors.push(t(`Campo no soportado en consulta guardada: ${key}.`, `Unsupported saved-search field: ${key}.`));
      }
    }
    if (owns(input, "filters") && owns(input, "query")) conflict("filters/query");
  }
  for (const container of unique([input, source])) {
    if (owns(container, "errors")) {
      if (!Array.isArray(container.errors) || container.errors.some((error) => typeof error !== "string")) invalid();
      else errors.push(...container.errors.map((error) => localizeCatalogError(error, language)));
    }
  }
  const raw = Object.fromEntries(QUERY_KEYS.filter((key) => owns(source, key)).map((key) => [key, source[key]]));
  const set = (key, value) => {
    if (!present(value)) return;
    if (present(raw[key]) && fold(raw[key]) !== fold(value)) conflict(key);
    else raw[key] = value;
  };
  for (const [legacy, key] of [["minPrice", "min"], ["maxPrice", "max"], ["bedrooms", "beds"], ["q", "text"]]) set(key, source[legacy]);
  if (source.propertyType === "Desarrollo") set("entity", "developments");
  else if (source.propertyType === "Preventa") { set("modality", "presale"); set("operation", "sale"); }
  else set("type", source.propertyType);
  if (present(source.location)) {
    if (typeof source.location !== "string") invalid();
    else {
      const values = source.location.split(",").map((part) => inventory.locationId(part.trim()));
      if (values.every(Boolean)) {
        const normalized = inventory.parseQuery({ locations: raw.locations }).query.locations;
        if (normalized.length && (normalized.length !== unique(values).length || values.some((id) => !normalized.includes(id)))) conflict("locations");
        else raw.locations = unique(values);
      } else if (source.location.includes(",")) conflict("locations");
      else set("zone", source.location);
    }
  }
  if (present(raw.sort)) raw.sort = ({ price_asc: "price-asc", price_desc: "price-desc", newest: "recent" })[raw.sort] || raw.sort;
  for (const key of Object.keys(source)) {
    if (!KNOWN_KEYS.has(key) && restrictive(source[key])) {
      errors.push(t(`Criterio sin soporte verificado: ${key}; revisalo antes de activar avisos.`, `Unverified unsupported criterion: ${key}; review it before enabling alerts.`));
    }
  }

  const texts = unique([options.queryText, options.query_text, input.queryText, input.query_text, source.queryText, source.query_text].filter(present));
  if (texts.some((text) => typeof text !== "string")) invalid();
  if (texts.length > 1) conflict("queryText");
  const queryText = typeof texts[0] === "string" ? texts[0] : "";
  const base = inventory.parseQuery(raw);
  // Missing budget dimensions may be supplied by queryText; malformed stored values may not be erased by it.
  errors.push(...base.errors.filter((error) => !/^Elige (?:una moneda|compra o renta|un periodo de renta|el periodo de renta)/.test(error)).map((error) => localizeCatalogError(error, language)));
  const context = { filters: raw, language };
  for (const key of ["conversation", "warnings", "clarificationRequired", "needsChoice"]) {
    if (owns(source, key)) context[key] = source[key];
    else if (owns(input, key)) context[key] = input[key];
  }
  const interpreted = interpretCatalogSearch(queryText, context, { properties: options.properties, language });
  // Even optional unsupported wishes need review before an automated alert is called a match.
  errors.push(...interpreted.warnings);
  const merged = { ...interpreted.filters };
  const normalized = inventory.parseQuery(merged).query;
  for (const key of ["entity", "type", "operation", "modality", "currency", "rentPeriod", "zone", "development", "priceBasis"]) {
    const implicitSale = key === "operation" && base.query.modality;
    const budgetBasis = key === "priceBasis" && (base.query.min !== null || base.query.max !== null);
    const constrained = present(raw[key]) && !(key === "priceBasis" && raw.priceBasisExplicit === false && raw.priceBasis === "total");
    if (!constrained && !implicitSale && !budgetBasis) continue;
    if (fold(base.query[key]) !== fold(normalized[key])) conflict(key);
    merged[key] = base.query[key];
    if (key === "priceBasis") merged.priceBasisExplicit = base.query.priceBasisExplicit || (normalized.priceBasis === base.query.priceBasis && normalized.priceBasisExplicit);
  }
  for (const key of ["min", "max", "beds"]) {
    if (base.query[key] === null) continue;
    if (normalized[key] === null) conflict(key);
    const combine = key === "max" ? Math.min : Math.max;
    merged[key] = normalized[key] === null ? base.query[key] : combine(base.query[key], normalized[key]);
  }
  if (base.query.locations.length) {
    const intersection = base.query.locations.filter((id) => normalized.locations.includes(id));
    if (!intersection.length) conflict("locations");
    merged.locations = intersection.length ? intersection : base.query.locations;
  }
  if (base.query.featured) {
    if (!normalized.featured) conflict("featured");
    merged.featured = true;
  }
  if (base.query.text) {
    if (!normalized.text) conflict("text");
    merged.text = unique([base.query.text, merged.text].filter(Boolean)).join(" ");
  }
  if (base.query.bounds) {
    if (!normalized.bounds) conflict("bounds");
    merged.bounds = base.query.bounds;
  }
  if (base.query.priceBasisExplicit) merged.priceBasisExplicit = true;
  // Presentation defaults never change the set of matches.
  merged.sort = base.query.sort;
  merged.page = base.query.page;
  if (merged.text?.length > 300) errors.push(t("El texto libre supera 300 caracteres; revisalo antes de guardar.", "Free text exceeds 300 characters; review it before saving."));
  const parsed = inventory.parseQuery(merged);
  errors.push(...parsed.errors.map((error) => localizeCatalogError(error, language)));
  return { ...parsed.query, errors: unique(errors) };
}

/** Pass the separately stored query_text here on create, edit AND alert evaluation. */
function parseInitialCatalogSearch(queryText, filters = {}, options = {}) {
  return savedCatalogQuery(filters, { ...options, queryText });
}

module.exports = { savedCatalogQuery, parseInitialCatalogSearch };
