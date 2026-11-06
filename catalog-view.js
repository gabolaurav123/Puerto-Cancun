const inventory = require("./inventory-contract");
const { localizeCatalogError } = require("./catalog-search");
const { escape, areasFor, areaName, areaFor, subareaName, contactLink, presalePath, projectRecords, projectDetail } = require("./catalog-directory");

function categoryDefaults(filter = {}, areas = inventory.LOCATIONS) {
  const location = inventory.locationId(filter.zone, areas);
  const area = areas.find(item => item.id === location);
  const names = area ? [area.id, areaName(area, "es"), areaName(area, "en"), areaName({id:area.id}, "es"), areaName({id:area.id}, "en")] : [];
  const isArea = names.some(name => inventory.fold(name) === inventory.fold(filter.zone));
  return { ...filter, ...(location ? { location, zone: isArea ? "" : filter.zone } : {}), entity: filter.publicationSection || "properties" };
}

function catalogContext(page, params, areas) {
  const presales = page.category?.type === "Preventa";
  const lang = page.lang === "en" ? "en" : "es";
  const base = lang === "en" ? "/en/properties" : "/propiedades";
  const featuredPage = page.category?.featured === true;
  const path = featuredPage ? page.path : presales ? presalePath(lang) : base;
  const defaults = presales ? { entity: "developments" } : categoryDefaults(page.category, areas);
  const input = { ...params };
  if (featuredPage) {
    defaults.entity = "all";
    defaults.sort = "featured";
    input.featured = true;
  }
  if (presales) input.entity = "developments";
  if (page.category?.type === "Terreno") input.entity = "properties";
  const projects = (input.entity || defaults.entity) === "developments";
  if (projects) {
    for (const key of ["type", "operation", "modality", "currency", "min", "max", "priceBasis", "rentPeriod", "beds", "development"]) {
      delete input[key]; delete defaults[key];
    }
    if (!["featured", "title"].includes(input.sort)) input.sort = "featured";
  } else {
    delete input.gated;
    if (page.category?.type === "Terreno") input.type = "Terreno";
  }
  return { lang, base, path, presales, projects, featuredPage, defaults, input };
}

function selectionUrl(path, query, view) {
  const params = inventory.toSearchParams(query);
  if (view === "map") params.set("view", "map");
  return path + "?" + params.toString();
}

function navLink(url, label, attrs = "") {
  return `<a href="${escape(url)}" data-catalog-link ${attrs}>${escape(label)}</a>`;
}

function paginated(result, path, lang, view) {
  if (result.pages <= 1) return "";
  const en = lang === "en";
  const link = (page, label = page, aria = en ? `Page ${page}` : `Página ${page}`) => navLink(selectionUrl(path, { ...result.query, page }, view), label,
    `class="${result.page === page ? "is-active" : ""}"${result.page === page ? ' aria-current="page"' : ""} aria-label="${escape(aria)}"`);
  const indices = [...new Set([1, result.page - 1, result.page, result.page + 1, result.pages])].filter(page => page > 0 && page <= result.pages).sort((a, b) => a - b);
  const links = indices.map((page, i) => (i && page - indices[i - 1] > 1 ? '<span aria-hidden="true">…</span>' : "") + link(page));
  if (result.page > 1) links.unshift(link(result.page - 1, "‹", en ? "Previous page" : "Página anterior"));
  if (result.page < result.pages) links.push(link(result.page + 1, "›", en ? "Next page" : "Página siguiente"));
  return `<nav class="catalog-pagination" aria-label="${en ? "Catalog pages" : "Páginas del catálogo"}">${links.join("")}</nav>`;
}

function select(name, label, entries, selected, t) {
  const rows = entries.slice();
  if (selected && !rows.some(([id]) => id === selected)) rows.push([selected, `${selected} (${t("sin coincidencias actuales", "no current matches")})`]);
  const options = rows.map(([id, text, area]) => `<option value="${escape(id)}"${id === selected ? " selected" : ""}${area ? ` data-area="${escape(area)}"` : ""}>${escape(text)}</option>`);
  return `<label><span>${escape(label)}</span><select name="${name}">${options.join("")}</select></label>`;
}

function number(name, label, value) {
  return `<label><span>${escape(label)}</span><input type="number" name="${name}" min="0" step="any" inputmode="${name === "beds" ? "numeric" : "decimal"}" value="${escape(value ?? "")}" /></label>`;
}

function catalogFilters(ctx, publicRows) {
  const { t, areas, lang, projects, path, view, query, result } = ctx;
  const choose = (name, label, entries) => select(name, label, entries, query[name], t);
  const locationScope = row => !query.locations.length || query.locations.includes(areaFor(row, areas)?.id);
  const scoped = publicRows.filter(locationScope);
  const subs = areas.filter(area => !query.locations.length || query.locations.includes(area.id)).flatMap(area =>
    (area.subareas || []).map(item => [item.id, areaName(item, lang), area.id]));
  const subareas = subs.length || query.subarea ? choose("subarea", t("Subzona", "Subzone"), [["", t("Todas las subzonas", "All subzones")], ...subs]) : "";
  const groupedLegacyZones = new Map();
  for (const row of scoped) {
    const area = areaFor(row, areas);
    if (!row.zone || row.portalSubareaId || inventory.fold(row.zone) === inventory.fold(areaName(area, lang)) || inventory.fold(row.zone) === inventory.fold(areaName(area, "es"))) continue;
    if (!groupedLegacyZones.has(row.zone)) groupedLegacyZones.set(row.zone, new Set());
    if (area) groupedLegacyZones.get(row.zone).add(area.id);
  }
  const legacyZones = [...groupedLegacyZones].sort(([a], [b]) => a.localeCompare(b, lang)).map(([zone, ids]) => [zone, zone, [...ids].join(",")]);
  const legacy = legacyZones.length || query.zone ? choose("zone", subs.length ? t("Ubicación registrada", "Recorded location") : t("Subzona", "Subzone"), [["", t("Todas", "All")], ...legacyZones]) : "";
  const locations = `<fieldset class="catalog-locations"><legend>${t("Zonas", "Zones")}</legend>${areas.map(area => `<label><input type="checkbox" name="location" value="${escape(area.id)}"${query.locations.includes(area.id) ? " checked" : ""} /><span>${escape(areaName(area, lang))}</span></label>`).join("")}</fieldset>`;
  const devs = scoped.filter(row => inventory.entityOf(row) === "developments").map(row =>
    [query.development === row.developmentData?.id ? query.development : row.id, lang === "en" ? row.titleEn || row.titleEs : row.titleEs, areaFor(row, areas)?.id]);
  const types = [["", t("Todos los tipos", "All types")], ...inventory.TYPES.map((type, index) => [type, lang === "en" ? ["Home", "Apartment", "Land", "Commercial"][index] : type])];
  const ops = [["", t("Comprar o buscar renta", "Buy or find a rental")], ["sale", t("Comprar", "Buy")], ["rent", t("Buscar renta", "Find a rental")]];
  const currencies = [["", t("Todas", "All")], ["USD", "USD"], ["MXN", "MXN"]];
  const rentPeriod = choose("rentPeriod", t("Periodo de renta", "Rental period"), [["", t("Seleccionar", "Select")], ["month", t("Mensual", "Monthly")], ["day", t("Diario", "Daily")], ["year", t("Anual", "Annual")], ["unclassified", t("Por confirmar", "Unconfirmed")]]);
  const advancedOpen = query.modality || query.beds !== null || query.priceBasisExplicit || query.zone;
  let main;
  if (projects) {
    main = locations + subareas + legacy;
    if (query.gated || scoped.some(row => inventory.entityOf(row) === "developments" && row.portalGated === true)) {
      main += `<label class="catalog-featured"><input type="checkbox" name="gated" value="1"${query.gated ? " checked" : ""} /><span>${t("Acceso controlado", "Gated community")}</span></label>`;
    }
  } else {
    const type = ctx.landRoute ? `<input type="hidden" name="type" value="Terreno" />` : choose("type", t("Tipo de propiedad", "Property type"), types);
    const development = devs.length || query.development ? choose("development", t("Desarrollo", "Development"), [["", t("Cualquiera, incluso sin desarrollo", "Any, including independent listings")], ...devs]) : "";
    main = choose("operation", t("Operación", "Transaction"), ops) + type + locations + subareas + development +
      choose("currency", t("Moneda del presupuesto", "Budget currency"), currencies) + number("min", t("Precio mínimo", "Minimum price"), query.min) + number("max", t("Precio máximo", "Maximum price"), query.max) +
      (query.operation === "rent" || query.rentPeriod ? rentPeriod : "") +
      `<details class="catalog-advanced"${advancedOpen ? " open" : ""}><summary>${t("Más filtros", "More filters")}</summary><div class="catalog-advanced-fields">${legacy}
      ${query.operation !== "rent" ? choose("modality", t("Modalidad de venta", "Sales mode"), [["",t("Todas","All")],["presale",t("Preventa","Presale")],["direct",t("Venta directa","Direct sale")],["resale",t("Reventa","Resale")],["unclassified",t("Por clasificar","Unclassified")]]) : ""}
      ${select("priceBasis", t("Base del precio", "Price basis"), [["",t("Todas","All")],["total",t("Total","Total")],["sqm",t("Por m²","Per m²")]], query.priceBasisExplicit ? query.priceBasis : "", t)}
      ${query.type !== "Terreno" ? number("beds", t("Recámaras mínimas", "Minimum bedrooms"), query.beds) : ""}</div></details>`;
  }
  const sorts = projects ? [["featured",t("Destacados","Featured")],["title",t("Nombre A–Z","Name A–Z")]] : [["recent",t("Más recientes","Newest")],["price-asc",t("Precio menor por moneda y base","Lowest price within currency and basis")],["price-desc",t("Precio mayor por moneda y base","Highest price within currency and basis")]];
  if (ctx.featuredPage && !projects) sorts.unshift(["featured",t("Selección editorial","Editorial order")]);
  if (query.type === "Terreno" && (query.sort.startsWith("lot-") || scoped.some(row => row.type === "Terreno" && Number(row.lot) > 0))) sorts.push(["lot-asc",t("Menor superficie","Smallest lot")],["lot-desc",t("Mayor superficie","Largest lot")]);
  return `<details class="catalog-filter-panel"${result.errors.length ? " open" : ""}><summary>${t("Filtros", "Filters")}</summary><form id="catalogFilters" class="catalog-filters" method="get" action="${path}">
    <input type="hidden" name="entity" value="${escape(query.entity)}" />
    ${view === "map" ? '<input type="hidden" name="view" value="map" />' : ""}
    ${query.bounds ? `<input type="hidden" name="bounds" value="${escape(query.bounds.join(","))}" />` : ""}${main}
    <div class="catalog-filter-actions">${ctx.featuredPage ? "" : `<label class="catalog-featured"><input name="featured" type="checkbox" value="1"${query.featured ? " checked" : ""} /><span>${t("Solo destacados","Featured only")}</span></label>`}
    ${choose("sort",t("Ordenar","Sort"),sorts)}<button class="primary-button" type="submit">${t("Aplicar filtros","Apply filters")}</button>
    <a class="text-link" href="${ctx.landRoute ? (lang === "en" ? "/en/properties/land-cancun" : "/propiedades/terrenos-cancun") : path + (projects && !ctx.presales ? "?entity=developments" : "")}">${t("Limpiar filtros","Clear filters")}</a></div></form></details>`;
}

function entityNavigation(ctx, records) {
  if (ctx.presales) return "";
  const { query, t, lang, base, view } = ctx;
  const entities = ctx.featuredPage ? ["all", "developments", "properties"] : ["developments", "properties"];
  const options = entities.map(entity => {
    const params = new URLSearchParams({ entity });
    if (query.locations.length) params.set("location", query.locations.join(","));
    if (query.subarea) params.set("subarea", query.subarea);
    if (query.zone) params.set("zone", query.zone);
    if (view === "map") params.set("view", "map");
    let label = entity === "all" ? t("Todos","All") : entity === "developments" ? t("Desarrollos","Developments") : t("Propiedades","Properties");
    if (query.locations.length && !ctx.featuredPage) {
      const count = inventory.queryInventory(records, { entity, locations:query.locations, subarea:query.subarea, zone:query.zone }, {areas:ctx.areas}).total;
      label += " (" + count + ")";
    }
    return navLink((ctx.featuredPage ? ctx.path : base) + "?" + params, label, entity === query.entity ? 'aria-current="page"' : "");
  });
  let allDevelopments = "";
  if (query.locations.length === 1) {
    const params = new URLSearchParams({ entity: "developments", location: query.locations[0] });
    allDevelopments = navLink(base + "?" + params, lang === "en" ? "View all developments in this zone" : "Ver todos los desarrollos de esta zona", 'class="text-link"');
  }
  return `<div class="catalog-entity-bar"><nav class="catalog-entity-nav" aria-label="${t("Explorar","Explore")}">${options.join("")}</nav>${allDevelopments}</div>`;
}

function suggestionLinks(ctx, rows) {
  const { query, areas, lang, t, base } = ctx;
  const text = inventory.fold(query.text);
  if (text.length < 2) return "";
  const groups = [];
  const areaLinks = areas.filter(area => inventory.fold(areaName(area,lang)).includes(text) || inventory.fold(areaName(area,"es")).includes(text)).slice(0,4)
    .map(area => navLink(base + "?" + new URLSearchParams({ entity: query.entity, location: area.id }), areaName(area,lang)));
  if (areaLinks.length) groups.push([t("Zona","Zone"), areaLinks]);
  for (const entity of ["developments","properties"]) {
    const matches = rows.filter(row => inventory.entityOf(row) === entity && (!query.locations.length || query.locations.includes(areaFor(row,areas)?.id)) && inventory.fold([row.titleEs,row.titleEn,row.mls].join(" ")).includes(text));
    const links = matches.slice(0,4).flatMap(row => {
      const href = lang === "en" ? row.urlEn : row.urlEs;
      return href && href.startsWith("/") && !href.startsWith("//") ? [`<a href="${escape(href)}">${escape(lang === "en" ? row.titleEn || row.titleEs : row.titleEs)}</a>`] : [];
    });
    if (links.length) groups.push([entity === "developments" ? t("Desarrollo","Development") : t("Propiedad","Property"),links]);
  }
  if (!groups.length) return "";
  return `<nav class="catalog-suggestions" aria-label="${t("Sugerencias de búsqueda","Search suggestions")}">${groups.map(([label,links]) => `<div><strong>${label}</strong> ${links.join(" · ")}</div>`).join("")}</nav>`;
}

function activeChips(ctx, rows) {
  const { query, path, t, view, areas, lang } = ctx;
  const subareas = areas.flatMap(area => area.subareas || []);
  const dev = rows.find(row => inventory.entityOf(row) === "developments" && [row.id,row.developmentData?.id].includes(query.development));
  const labels = {
    location: query.locations.map(id => areaName(areas.find(area => area.id === id),lang) || id).join(", "),
    subarea: areaName(subareas.find(item => item.id === query.subarea),lang) || query.subarea,
    development: dev ? (lang === "en" ? dev.titleEn || dev.titleEs : dev.titleEs) : query.development,
    type: lang === "en" ? ({Casa:"Home",Departamento:"Apartment",Terreno:"Land",Comercial:"Commercial"})[query.type] : query.type,
    operation: query.operation === "rent" ? t("Buscar renta","Find a rental") : t("Comprar","Buy"),
    modality: ({presale:t("Preventa","Presale"),direct:t("Venta directa","Direct sale"),resale:t("Reventa","Resale"),unclassified:t("Por clasificar","Unclassified")})[query.modality],
    featured:t("Destacados","Featured"),gated:t("Acceso controlado","Gated community"),bounds:t("Área del mapa","Map area"),
    min:t("Desde ","From ") + query.min,max:t("Hasta ","Up to ") + query.max,beds:t("Recámaras mínimas: ","Minimum bedrooms: ") + query.beds,
    priceBasis:query.priceBasis === "sqm" ? t("Por m²","Per m²") : t("Precio total","Total price"),
    rentPeriod:({month:t("Mensual","Monthly"),day:t("Diario","Daily"),year:t("Anual","Annual"),unclassified:t("Sin confirmar","Unconfirmed")})[query.rentPeriod],
  };
  const params = inventory.toSearchParams(query);
  const chips = [];
  for (const [key,value] of params) {
    if (["entity","sort","page"].includes(key) || (ctx.featuredPage && key === "featured")) continue;
    const rest = new URLSearchParams(params); rest.delete(key); rest.delete("page");
    if (key === "operation") for (const field of ["modality","min","max","rentPeriod"]) rest.delete(field);
    if (key === "currency") { rest.delete("min"); rest.delete("max"); }
    if (view === "map") rest.set("view","map");
    const label = labels[key] || value;
    chips.push(`<a href="${escape(path + "?" + rest)}" class="catalog-chip" aria-label="${escape(t("Quitar","Remove") + " " + label)}">${escape(label)} <span aria-hidden="true">×</span></a>`);
  }
  return chips.join("");
}

function catalogHelp(ctx, rows, sourcePath) {
  const { query, areas, lang, t } = ctx;
  const zone = query.locations.map(id => areaName(areas.find(area => area.id === id),lang)).filter(Boolean).join(", ");
  const subarea = areas.flatMap(area => area.subareas || []).find(row => row.id === query.subarea);
  const development = rows.find(row => inventory.entityOf(row) === "developments" && [row.id,row.developmentData?.id].includes(query.development));
  const mode = {presale:t("Preventa","Presale"),direct:t("Venta directa","Direct sale"),resale:t("Reventa","Resale"),unclassified:t("Modalidad por confirmar","Sales mode unconfirmed")}[query.modality];
  const period = {month:t("Renta mensual","Monthly rental"),day:t("Renta diaria","Daily rental"),year:t("Renta anual","Annual rental")}[query.rentPeriod];
  const context = { zone, subzone: subarea ? areaName(subarea,lang) : query.zone, development: development && (lang === "en" ? development.titleEn || development.titleEs : development.titleEs), propertyType:query.type, budget:query.max, currency:query.currency,
    preferences:[query.text,query.min != null ? t("Presupuesto mínimo","Minimum budget") + " " + query.min + " " + query.currency : "",query.beds != null ? t("Recámaras mínimas","Minimum bedrooms") + ": " + query.beds : "", mode, period].filter(Boolean).join(" · "), origin:ctx.presales ? "presale-directory" : "catalog-results", sourcePath };
  const rent = query.operation === "rent", land = query.type === "Terreno";
  const buyer = rent ? t("Busco una renta aquí","Find a rental here") : land ? t("Quiero comprar un terreno","I want to buy land") : t("Busco una propiedad aquí","Find a property here");
  const seller = rent ? t("Quiero poner mi propiedad en renta","I want to rent out my property") : land ? t("Quiero vender un terreno","I want to sell land") : t("Quiero vender aquí","I want to sell here");
  return `<div class="catalog-demand"><p>${t("Cuéntanos qué necesitas y te ayudamos a encontrarlo.","Tell us what you need and we’ll help you find it.")}</p><div>${contactLink(lang,buyer,{...context,intent:rent ? "rent" : "buy"})}${contactLink(lang,seller,{...context,intent:rent ? "let" : "sell"},"outline-dark-button")}</div></div>`;
}

function renderCatalog(page, properties, params = {}, renderCards) {
  const areas = areasFor(page);
  const ctx = catalogContext(page,params,areas);
  const { lang, presales, projects, path, input, defaults } = ctx;
  const t = (es,en) => lang === "en" ? en : es;
  const publicRows = properties.filter(inventory.isPublic);
  const directory = page.portalDirectory || require("./portal-directory").publicDirectory(null, publicRows);
  let records = presales ? projectRecords(directory, publicRows, lang) : publicRows;
  if (presales && params.project) records = records.filter(row => row.id === params.project);
  const parsed = inventory.parseQuery(input, defaults, {areas}).query;
  const selectedLocations = parsed.locations;
  const mixed = parsed.entity === "all" && parsed.featured;
  const kind = presales ? "presale" : projects ? "development" : "property";
  const placements = (directory.featured || []).filter(item => (mixed || item.kind === kind) &&
    (selectedLocations.length && !ctx.featuredPage ? item.placement === "area" && selectedLocations.includes(item.contextId) : item.placement === "home"));
  if (mixed) {
    const projectsById = new Map(projectRecords(directory, publicRows, lang).map(row => [row.id,row]));
    const rowsById = new Map(publicRows.map(row => [row.id,row]));
    records = placements.map(slot => {
      if (slot.kind === "presale") {
        const project = projectsById.get(slot.targetId);
        return project && {...project, id:`presale:${project.id}`};
      }
      if (slot.kind !== "area") return rowsById.get(slot.targetId);
      const zone = directory.areas.find(area => area.id === slot.targetId);
      if (!zone) return null;
      const {areaLink} = require("./exploration-view");
      return { id:`area:${zone.id}`, featuredArea:zone, titleEs:areaName(zone,"es"), titleEn:areaName(zone,"en"), portalAreaId:zone.id,
        urlEs:areaLink(zone.id,"es"), urlEn:areaLink(zone.id,"en"), locationPrecision:"hidden" };
    }).filter(Boolean);
  }
  const ranks = new Map(placements.map((item,index) => [mixed && ["area","presale"].includes(item.kind) ? item.kind + ":" + item.targetId : item.targetId,index]));
  if (page.portalDirectory || ctx.featuredPage) records = records.map(row => ({...row,featured:ranks.has(row.id)}));
  const grouped = projects && !ctx.featuredPage && selectedLocations.length !== 1;
  const result = inventory.queryInventory(records, input, { defaults, areas, lang, featureRanks:ranks, groupByArea:grouped });
  result.errors = result.errors.map(error => localizeCatalogError(error,lang));
  const { query, total } = result;
  const view = params.view === "map" ? "map" : "list";
  Object.assign(ctx,{areas,t,query,result,view,landRoute:page.category?.type === "Terreno"});
  const sourceParams = new URLSearchParams(params);
  const sourcePath = (page.path || path) + (sourceParams.size ? "?" + sourceParams : "");
  const singular = total === 1;
  const label = mixed ? t(singular ? "resultado destacado":"resultados destacados",singular ? "featured result":"featured results") : presales ? t(singular ? "preventa":"preventas",singular ? "presale":"presales") : projects ? t(singular ? "desarrollo":"desarrollos",singular ? "development":"developments") : t(singular ? "propiedad":"propiedades",singular ? "listing":"listings");
  const cardContext = { ...ctx, sourcePath, records:publicRows };
  let cards = "";
  if (presales && params.project && result.items[0]) cards = projectDetail(result.items[0], areas, lang, sourcePath);
  else if (grouped && result.items.length) {
    const groups = new Map();
    for (const row of result.items) {
      const area = areaFor(row,areas);
      const id = area?.id || "";
      if (!groups.has(id)) groups.set(id,{area,rows:[]});
      groups.get(id).rows.push(row);
    }
    cards = [...groups].map(([id, group]) => {
      const scoped = { ...query,locations:[id],page:1 };
      const name = areaName(group.area,lang) || t("Zona por confirmar","Zone to be confirmed");
      return `<div class="catalog-area-group"><h2>${id ? navLink(selectionUrl(path,scoped,view),name) : escape(name)}</h2>${renderCards(group.rows,lang,cardContext)}</div>`;
    }).join("");
  } else if (result.items.length && !result.errors.length) cards = renderCards(result.items,lang,cardContext);
  let areaIndex = "";
  if (grouped && !params.project && result.total) {
    const counts = new Map();
    for (const row of result.all) {
      const id = areaFor(row, areas)?.id;
      if (id) counts.set(id, (counts.get(id) || 0) + 1);
    }
    const links = areas.filter(area => counts.has(area.id)).map(area => {
      const href = selectionUrl(path, { ...query, locations:[area.id], page:1 }, view);
      return navLink(href, areaName(area, lang) + " (" + counts.get(area.id) + ")");
    });
    if (links.length) areaIndex = `<nav class="catalog-area-index" aria-label="${t("Explorar por zona","Explore by zone")}">${links.join("")}</nav>`;
  }
  const mapItems = result.items.map(row => {
    const precision = row.portalHiddenBlocks?.includes("location") ? "hidden" : row.locationPrecision;
    return { id:row.id,title:lang === "en" ? row.titleEn || row.titleEs : row.titleEs,url:lang === "en" ? row.urlEn : row.urlEs,kind:row.featuredArea ? "zone" : row.presaleProject ? "presale" : inventory.entityOf(row) === "developments" ? "development" : "property",
      locationPrecision:precision,approximate:precision !== "exact", ...(precision === "hidden" ? {} : {latitude:row.latitude,longitude:row.longitude}) };
  });
  const searchLabel = projects ? t("Buscar por nombre","Search by name") : t("Buscar por zona, desarrollo, título o MLS","Search by zone, development, title or MLS");
  const pagination = presales && params.project ? "" : paginated(result,path,lang,view);
  return `<section id="category-inventory" class="category-inventory catalog-experience" data-catalog-root data-catalog-query="${escape(inventory.toSearchParams(query))}" data-catalog-map-total="${mapItems.length}">
    ${entityNavigation(ctx,publicRows)}${areaIndex}<div class="catalog-controls"><div class="catalog-search-row">
      <input type="search" name="q" form="catalogFilters" value="${escape(query.text)}" aria-label="${searchLabel}" placeholder="${projects ? t("Nombre del proyecto","Project name") : t("Zona, desarrollo, título o MLS","Zone, development, title or MLS")}" autocomplete="off" />
      <button type="submit" form="catalogFilters" class="primary-button">${t("Buscar","Search")}</button></div>
      ${catalogFilters(ctx,presales ? records : publicRows)}
      ${projects ? "" : `<details class="catalog-conversation"><summary>${t("Búsqueda guiada","Guided search")}</summary><form data-catalog-assistant><label>${t("Describe lo que buscas","Describe what you are looking for")}<input name="query" maxlength="600" required /></label><button type="submit" class="primary-button">${t("Buscar","Search")}</button><div data-search-status aria-live="polite"></div></form></details>`}</div>
    ${presales ? "" : suggestionLinks(ctx,publicRows)}<div class="catalog-active-filters">${activeChips(ctx,publicRows)}</div>
    <div class="catalog-result-bar"><p id="categoryInventoryCount" role="status">${total} ${label}</p><div class="catalog-view-toggle" role="group" aria-label="${t("Vista","View")}"><button type="button" data-catalog-view="list" aria-pressed="true">${t("Lista","List")}</button><button type="button" data-catalog-view="map" aria-pressed="false">${t("Mapa","Map")}</button></div></div>
    <p class="catalog-request-status" aria-live="polite"></p>
    ${result.errors.length ? `<div class="catalog-errors" role="alert"><h3>${t("Revisa los filtros","Review filters")}</h3><ul>${result.errors.map(error => `<li>${escape(error)}</li>`).join("")}</ul></div>` : ""}
    <div class="catalog-results"><div data-catalog-list>${cards || (result.errors.length ? "" : `<p class="inventory-empty">${t("Aún no hay publicaciones que coincidan con esta búsqueda.","There are no published matches for this search yet.")}</p>`)}${pagination}</div><div data-catalog-map hidden><div class="catalog-map-canvas" role="region" aria-label="${t("Mapa de resultados","Results map")}"></div><p class="catalog-map-status" role="status"></p></div></div>
    ${presales && params.project && result.items.length ? "" : catalogHelp(ctx,publicRows,sourcePath)}<script type="application/json" data-catalog-map-data>${JSON.stringify(mapItems).replace(/</g,"\\u003c")}</script></section>`;
}

function catalogPresentation(page, params = {}) {
  if (!page.category) return page;
  const areas = areasFor(page), ctx = catalogContext(page,params,areas);
  if (ctx.presales || ctx.featuredPage) return page;
  const { query } = inventory.parseQuery(ctx.input,ctx.defaults,{areas});
  const lang = ctx.lang, en = lang === "en";
  const selected = areas.filter(area => query.locations.includes(area.id));
  if (selected.length === 1 && !query.type && !query.zone && !query.text) {
    const area = selected[0], name = areaName(area,lang);
    const intro = en ? area.descriptionEn || "" : area.descriptionEs || area.description || "";
    return { ...page,h1:name,intro:intro || page.intro,title:`${name} | Puerto Cancun Center` };
  }
  if (!Object.keys(params).length) return page;
  const types = en ? {Casa:"Homes",Departamento:"Apartments",Terreno:"Land",Comercial:"Commercial properties"} : {Casa:"Casas",Departamento:"Departamentos",Terreno:"Terrenos",Comercial:"Propiedades comerciales"};
  const entity = ctx.projects ? (en ? "Developments":"Desarrollos") : types[query.type] || (en ? "Properties":"Propiedades");
  const h1 = [entity,...selected.map(area => areaName(area,lang)),query.zone].filter(Boolean).join(" · ");
  const intro = ctx.projects ? (en ? "Explore projects by zone." : "Explora los desarrollos por zona.") : (en ? "Choose a zone and filter the published listings." : "Elige una zona y filtra las propiedades publicadas.");
  return {...page,h1,intro,eyebrow:entity,title:`${h1} | Puerto Cancun Center`,description:intro};
}

module.exports = { categoryDefaults, renderCatalog, catalogPresentation };
