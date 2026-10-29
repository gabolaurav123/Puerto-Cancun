const inventory = require("./inventory-contract");
const { whatsappUrl } = require("./contact-config");
const { localizeCatalogError } = require("./catalog-search");

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function categoryDefaults(filter = {}) {
  const location = inventory.locationId(filter.zone);
  return { ...filter, ...(location ? { location, zone: "" } : {}), entity: filter.publicationSection || "properties" };
}

function renderCatalog(page, properties, params, renderCards) {
  const english = page.lang === "en";
  const t = (es, en) => english ? en : es;
  const result = inventory.queryInventory(properties, params, { defaults: categoryDefaults(page.category) });
  result.errors = result.errors.map(error => localizeCatalogError(error, english ? "en" : "es"));
  const { query, total } = result;
  const path = english ? "/en/properties" : "/propiedades";
  const options = (entries, value) => entries.map(([key, label]) => `<option value="${escape(key)}"${key === value ? " selected" : ""}>${escape(label)}</option>`).join("");
  const select = (name, label, entries, value) => {
    const retained = ["zone", "development"].includes(name) && value && !entries.some(([key]) => key === value)
      ? [...entries, [value, `${value} (${t("sin coincidencias actuales", "no current matches")})`]] : entries;
    return `<label><span>${escape(label)}</span><select name="${name}">${options(retained, value)}</select></label>`;
  };
  const comparison = String(params.compare || "").slice(0, 500);
  const retainComparison = (search) => { if (comparison) search.set("compare", comparison); return search; };
  const number = (name, label, value) => `<label><span>${escape(label)}</span><input type="number" name="${name}" min="0" step="any" value="${escape(value ?? "")}" /></label>`;
  const typeEntries = [["", t("Todos los tipos", "All types")], ...inventory.TYPES.map((type, index) => [type, english ? ["Homes", "Apartments", "Land", "Commercial"][index] : type])];
  const operations = [["", t("Compra y renta", "Purchase and rent")], ["sale", t("Compra", "Purchase")], ["rent", t("Renta", "Rent")]];
  const modes = [["", t("Todas las modalidades", "All sales modes")], ["presale", t("Preventa", "Presale")], ["direct", t("Venta directa", "Direct sale")], ["resale", t("Reventa", "Resale")], ["unclassified", t("Por clasificar", "Unclassified")]];
  const label = query.entity === "developments" ? t(total === 1 ? "desarrollo" : "desarrollos", total === 1 ? "development" : "developments") : t(total === 1 ? "propiedad" : "propiedades", total === 1 ? "property" : "properties");
  const count = t(`Encontramos ${total} ${label}`, `We found ${total} ${label}`);
  const context = [query.locations.map((id) => inventory.LOCATIONS.find((item) => item.id === id)?.name).join(", "), query.zone, query.type, operations.find(([id]) => id === query.operation)?.[1], query.modality && modes.find(([id]) => id === query.modality)?.[1], query.currency, query.max !== null ? `${t("hasta", "up to")} ${query.max}` : "", query.text].filter(Boolean).join(" · ");
  const contactMessage = t("Busco una propiedad: ", "I am looking for a property: ") + context;
  const sellerParams = new URLSearchParams({ location: query.locations.join(","), zone: query.zone, type: query.type, intent: "sell" });
  const callToActions = `<div class="catalog-demand"><p>${escape(t(total ? "¿Necesitas otras opciones o tienes una propiedad en esta zona?" : "Todavía no hay coincidencias con estos criterios. Podemos ayudarte a buscar o publicar aquí.", total ? "Need other options or own a property in this area?" : "There are no matches for these criteria yet. We can help you search or list here."))}</p><div><a class="primary-button" href="${escape(whatsappUrl("mx", contactMessage))}" target="_blank" rel="noopener">${t("Busco una propiedad aquí", "Find a property here")}</a><a class="outline-dark-button" href="${english ? "/en/sell-property-cancun" : "/vender-casa-cancun"}?${escape(sellerParams)}">${t("Quiero vender aquí", "Sell a property here")}</a></div></div>`;
  const developmentEntries = properties.filter((p) => inventory.entityOf(p) === "developments" && inventory.isPublic(p)).map((p) => [p.developmentData?.id || `dev-${p.id}`, english ? p.titleEn || p.titleEs : p.titleEs]);
  const advancedOpen = query.modality || query.currency || query.priceBasisExplicit || query.rentPeriod || query.min !== null || query.max !== null || query.zone || query.development || query.beds !== null;
  const form = `<form id="catalogFilters" class="catalog-filters" method="get" action="${path}">
    ${query.bounds ? `<input type="hidden" name="bounds" value="${escape(query.bounds.join(","))}" />` : ""}${comparison ? `<input type="hidden" name="compare" value="${escape(comparison)}" />` : ""}
    <label class="catalog-keyword"><span>${t("Buscar por zona, desarrollo, título o MLS", "Search area, development, title or MLS")}</span><input type="search" name="q" value="${escape(query.text)}" placeholder="${t("Escribe palabras clave", "Enter keywords")}" autocomplete="off" /></label>
    ${select("entity", t("Inventario", "Inventory"), [["properties", t("Propiedades", "Properties")], ["developments", t("Desarrollos", "Developments")]], query.entity)}
    ${select("type", t("Tipo", "Type"), typeEntries, query.type)}
    ${select("operation", t("Operación", "Operation"), operations, query.operation)}
    <fieldset class="catalog-locations"><legend>Locations</legend>${inventory.LOCATIONS.map((location) => `<label><input type="checkbox" name="location" value="${location.id}"${query.locations.includes(location.id) ? " checked" : ""} /><span>${escape(location.name)}</span></label>`).join("")}</fieldset>
    <details class="catalog-advanced"${advancedOpen ? " open" : ""}><summary>${t("Precio, modalidad y más filtros", "Price, sales mode and more filters")}</summary><div class="catalog-advanced-fields">
      ${select("modality", t("Modalidad de venta", "Sales mode"), modes, query.modality)}
      ${select("currency", t("Moneda original", "Original currency"), [["", t("Todas", "All")], ["USD", "USD"], ["MXN", "MXN"]], query.currency)}
      ${number("min", t("Precio mínimo", "Minimum price"), query.min)}${number("max", t("Precio máximo", "Maximum price"), query.max)}
      ${select("priceBasis", t("Base del precio", "Price basis"), [["", t("Todas las bases", "All price bases")], ["total", t("Total", "Total")], ["sqm", t("Por m²", "Per m²")]], query.priceBasisExplicit ? query.priceBasis : "")}
      ${select("rentPeriod", t("Periodo de renta", "Rental period"), [["", t("Seleccionar", "Select")], ["month", t("Mensual", "Monthly")], ["day", t("Diario", "Daily")], ["year", t("Anual", "Annual")], ["unclassified", t("Por confirmar", "Unconfirmed")]], query.rentPeriod)}
      ${select("zone", t("Subzona original", "Original subarea"), [["", t("Todas", "All")], ...[...new Set(properties.filter((p) => inventory.isPublic(p)).map((p) => p.zone).filter(Boolean))].sort().map((zone) => [zone, zone])], query.zone)}
      ${select("development", t("Unidades de un desarrollo", "Units in a development"), [["", t("Todos", "All")], ...developmentEntries], query.development)}
      ${number("beds", t("Recámaras mínimas", "Minimum bedrooms"), query.beds)}
    </div><p class="field-hint">${t("Venta directa indica entrega inmediata según la clasificación del negocio. Los registros antiguos sin modalidad permanecen por clasificar. Los precios no mezclan monedas, bases o periodos.", "Direct sale means immediate delivery according to the business classification. Legacy listings without a sales mode remain unclassified. Prices are not mixed across currencies, bases or periods.")}</p></details>
    <div class="catalog-filter-actions"><label class="catalog-featured"><input name="featured" type="checkbox" value="1"${query.featured ? " checked" : ""} /><span>${t("Solo destacadas", "Featured only")}</span></label>
    ${select("sort", t("Ordenar", "Sort"), [["recent", t("Más recientes", "Newest")], ["oldest", t("Más antiguas", "Oldest")], ["price-asc", t("Precio menor por moneda/base", "Lowest price by currency/basis")], ["price-desc", t("Precio mayor por moneda/base", "Highest price by currency/basis")], ["title", t("Título A–Z", "Title A–Z")]], query.sort)}
    <button class="primary-button" type="submit">${t("Aplicar filtros", "Apply filters")}</button><a class="text-link" href="${path}">${t("Limpiar filtros", "Clear filters")}</a></div>
  </form>`;
  const chips = [];
  for (const [key, value] of Object.entries({ q: query.text, location: query.locations.join(","), zone: query.zone, type: query.type, operation: query.operation, modality: query.modality, featured: query.featured ? "1" : "", development: query.development, currency: query.currency, min: query.min, max: query.max, beds: query.beds, rentPeriod: query.rentPeriod, priceBasis: query.priceBasisExplicit ? query.priceBasis : "" })) {
    if (value === "" || value === null || value === undefined) continue;
    const params = retainComparison(inventory.toSearchParams(query)); params.delete(key); params.delete("page");
    if (key === "operation") { params.delete("modality"); params.delete("min"); params.delete("max"); params.delete("rentPeriod"); }
    if (key === "currency") { params.delete("min"); params.delete("max"); }
    const labels = { operation: operations.find(([id]) => id === value)?.[1], modality: modes.find(([id]) => id === value)?.[1], featured: t("Destacadas", "Featured"), location: query.locations.map((id) => inventory.LOCATIONS.find((item) => item.id === id)?.name || id).join(", ") };
    chips.push(`<a href="${path}?${escape(params)}" class="catalog-chip" aria-label="${escape(t("Quitar", "Remove") + " " + (labels[key] || value))}">${escape(labels[key] || value)} <span aria-hidden="true">×</span></a>`);
  }
  const pagination = result.pages > 1 ? `<nav class="catalog-pagination" aria-label="${t("Páginas del catálogo", "Catalog pages")}">${Array.from({ length: result.pages }, (_, index) => { const params = retainComparison(inventory.toSearchParams({ ...query, page: index + 1 })); return `<a class="${result.page === index + 1 ? "is-active" : ""}"${result.page === index + 1 ? ' aria-current="page"' : ""} href="${path}?${escape(params)}">${index + 1}</a>`; }).join("")}</nav>` : "";
  if (query.bounds) {
    const withoutArea = retainComparison(inventory.toSearchParams(query)); withoutArea.delete("bounds"); withoutArea.delete("page");
    chips.push(`<a class="catalog-chip" href="${path}?${escape(withoutArea)}">${t("Quitar área del mapa", "Remove map area")} <span aria-hidden="true">×</span></a>`);
  }
  const mapItems = result.all.filter(p => p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined && p.locationPrecision !== "hidden").map((p) => ({ id: p.id, latitude: p.latitude, longitude: p.longitude, title: english ? p.titleEn || p.titleEs : p.titleEs, url: english ? p.urlEn : p.urlEs, approximate: p.locationPrecision !== "exact", locationPrecision: p.locationPrecision }));
  return `<section id="category-inventory" class="category-inventory catalog-experience" data-catalog-root data-catalog-query="${escape(inventory.toSearchParams(query))}" data-catalog-map-total="${total}">
    <h2 class="catalog-heading">${t("Resultados de tu búsqueda", "Your search results")}</h2>
    <details class="catalog-conversation"><summary>${t("Búsqueda inteligente", "Smart search")}</summary><form data-catalog-assistant><label>${t("Describe lo que buscas", "Describe what you are looking for")}<input name="query" maxlength="600" required placeholder="${t("Departamento en Puerto Cancún hasta 700 mil USD para comprar", "Buy an apartment in Puerto Cancun under USD 700,000")}" /></label><button type="submit" class="primary-button">${t("Buscar", "Search")}</button><div data-search-status aria-live="polite"></div></form></details>${form}
    <div class="catalog-active-filters">${chips.join("")}</div>
    <div class="catalog-result-bar"><p id="categoryInventoryCount" role="status">${escape(count)}</p><div class="catalog-view-toggle" role="group" aria-label="${t("Vista", "View")}"><button type="button" data-catalog-view="list" aria-pressed="true">${t("Lista", "List")}</button><button type="button" data-catalog-view="map" aria-pressed="false">${t("Mapa", "Map")}</button></div></div>
    <p class="catalog-request-status" aria-live="polite"></p>
    ${result.errors.length ? `<div class="catalog-errors" role="alert"><h3>${t("Revisa los filtros", "Review filters")}</h3><ul>${result.errors.map((error) => `<li>${escape(error)}</li>`).join("")}</ul></div>` : ""}
    <div class="catalog-results"><div data-catalog-list>${result.errors.length ? "" : renderCards(result.items, page.lang)}${pagination}</div><div data-catalog-map hidden><div class="catalog-map-canvas" role="region" aria-label="${t("Mapa de resultados", "Results map")}"></div><p>${escape(t(`${mapItems.length} de ${total} resultados tienen coordenadas. Las ubicaciones aproximadas no representan la dirección exacta.`, `${mapItems.length} of ${total} results have coordinates. Approximate locations do not represent exact addresses.`))}</p><p class="catalog-map-status" role="status"></p></div></div>
    ${callToActions}<script type="application/json" data-catalog-map-data>${JSON.stringify(mapItems).replace(/</g, "\\u003c")}</script></section>`;
}

function catalogPresentation(page, params = {}) {
  if (!page.category || !Object.keys(params).length) return page;
  const { query } = inventory.parseQuery(params, categoryDefaults(page.category));
  const english = page.lang === "en";
  const types = english ? { Casa: "Homes", Departamento: "Apartments", Terreno: "Land", Comercial: "Commercial properties" } : { Casa: "Casas", Departamento: "Departamentos", Terreno: "Terrenos", Comercial: "Propiedades comerciales" };
  const entity = query.entity === "developments" ? (english ? "Developments" : "Desarrollos") : (types[query.type] || (english ? "Properties" : "Propiedades"));
  const locations = query.locations.map(id => inventory.LOCATIONS.find(item => item.id === id)?.name).filter(Boolean);
  const h1 = [entity, ...locations, query.zone].filter(Boolean).join(" · ");
  const intro = query.entity === "developments" ? (english ? "Published projects. Individual units are listed separately." : "Proyectos publicados. Las unidades individuales se consultan por separado.") : query.operation === "sale" ? (english ? "Properties for purchase, excluding rental listings." : "Opciones de compra, sin mezclar ofertas de renta.") : query.operation === "rent" ? (english ? "Rental properties, retaining each listing's original price and rental period." : "Opciones de renta, conservando moneda y periodo de cada publicación.") : (english ? "Published properties for purchase and rent. Choose your criteria to narrow the results." : "Propiedades publicadas para compra y renta. Selecciona tus criterios para acotar los resultados.");
  return { ...page, h1, intro, eyebrow: entity, title: `${h1} | Puerto Cancun Center`, description: intro };
}

module.exports = { categoryDefaults, renderCatalog, catalogPresentation };
