const inventory = require("./inventory-contract");
const { localizeCatalogError, describeCatalogFilters } = require("./catalog-search");
const { createPublicLocationResolver } = require("./public-inventory-query");
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
    for (const key of Object.keys(input)) if (!["entity", "page", "view"].includes(key)) delete input[key];
    input.featured = true;
    input.sort = "featured";
  }
  if (presales) input.entity = "developments";
  if (page.category?.type === "Terreno") input.entity = "properties";
  const projects = (input.entity || defaults.entity) === "developments";
  const unitFilterKeys = ["type", "operation", "modality", "currency", "min", "max", "priceBasis", "rentPeriod", "beds", "baths", "parking", "minBuilt", "maxBuilt", "minLot", "maxLot", "development"];
  const unsupportedProjectFilters = projects ? unitFilterKeys.filter(key => input[key] !== undefined && input[key] !== null && input[key] !== "") : [];
  if (projects) {
    for (const key of unitFilterKeys) delete defaults[key];
    if (!["featured", "title"].includes(input.sort)) input.sort = "featured";
  } else {
    if (page.category?.type === "Terreno") input.type = "Terreno";
  }
  return { lang, base, path, presales, projects, featuredPage, defaults, input, unsupportedProjectFilters };
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

function catalogFilters(ctx) {
  const params = inventory.toSearchParams(ctx.query);
  params.delete("q"); params.delete("page");
  if (ctx.view === "map") params.set("view", "map");
  return '<form id="catalogFilters" method="get" action="' + escape(ctx.path) + '">' + [...params].map(([name,value]) => '<input type="hidden" name="' + escape(name) + '" value="' + escape(value) + '">').join("") + '</form>';
}

function catalogAssistance(ctx, sourcePath) {
  const { t,lang,query } = ctx;
  const link = contactLink(lang, t("Clic aquí", "Start here"), {service:"property-search", intent:query.operation === "rent" ? "rent" : "buy", searchFilters:JSON.stringify(query),origin:"catalog-assistance",sourcePath}, "catalog-assistance-button");
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.3A10 10 0 1 0 12 2Zm0 18c-1.4 0-2.8-.4-4-1.1l-.4-.2-3.1.8.8-3-.3-.5A8 8 0 1 1 12 20Zm4.4-5.9-1.6-.8c-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.2-.3 0-.4.1-.5l.6-.7c.1-.2.1-.3.1-.5l-.7-1.8c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.6.6-.9 1.3-.8 2.1.1 1 .6 1.9 1.2 2.6 1.1 1.6 2.6 2.8 4.4 3.4 1 .4 1.6.4 2.1.2.7-.2 1.2-.7 1.4-1.3.1-.5.1-.8 0-.9l-.2-.2Z"/></svg>';
  return '<aside class="catalog-assistance"><div><strong>' + t("Te ayudamos a conseguir tu propiedad ideal", "Let us help you find your ideal property") + '</strong><p>' + t("Cuéntanos la zona, el presupuesto y lo que necesitas.", "Tell us your preferred zone, budget and must-haves.") + '</p></div>' + link.replace('>'+t("Clic aquí", "Start here")+'</a>', '>'+icon+'<span>'+t("Clic aquí", "Start here")+'</span></a>') + '</aside>';
}

function entityNavigation(ctx, records) {
  if (ctx.presales) return "";
  const { query, t, lang, base, view } = ctx;
  const entities = ctx.featuredPage ? ["all", "developments", "properties"] : ["developments", "properties"];
  const options = entities.map(entity => {
    const params = ctx.unsupportedProjectFilters.length && entity === "properties" ? inventory.toSearchParams({...query,entity,page:1}) : new URLSearchParams({ entity });
    if (query.locations.length) params.set("location", query.locations.join(","));
    if (query.subarea) params.set("subarea", query.subarea);
    if (query.zone) params.set("zone", query.zone);
    if (view === "map") params.set("view", "map");
    let label = entity === "all" ? t("Todos","All") : entity === "developments" ? t("Desarrollos","Gated communities") : t("Propiedades","Properties");
    if (query.locations.length && !ctx.featuredPage) {
      const count = inventory.queryInventory(records, { entity, locations:query.locations, subarea:query.subarea, zone:query.zone }, {areas:ctx.areas}).total;
      label += " (" + count + ")";
    }
    return navLink((ctx.featuredPage ? ctx.path : base) + "?" + params, label, entity === query.entity ? 'aria-current="page"' : "");
  });
  let allDevelopments = "";
  if (query.locations.length === 1) {
    const params = new URLSearchParams({ entity: "developments", location: query.locations[0] });
    allDevelopments = navLink(base + "?" + params, lang === "en" ? "View all gated communities in this zone" : "Ver todos los desarrollos de esta zona", 'class="text-link"');
  }
  return `<div class="catalog-entity-bar"><nav class="catalog-entity-nav" aria-label="${t("Explorar","Explore")}">${options.join("")}</nav>${allDevelopments}</div>`;
}

function suggestionLinks(ctx, rows) {
  const { query, areas, lang, t, base } = ctx;
  if (ctx.result.errors.length) return "";
  const text = inventory.fold(query.text);
  if (text.length < 2) return "";
  const groups = [];
  const areaLinks = areas.filter(area => inventory.fold(areaName(area,lang)).includes(text) || inventory.fold(areaName(area,"es")).includes(text)).slice(0,4)
    .map(area => navLink(selectionUrl(base, { ...query, text:"", locations:[area.id], zone:"", subarea:"", page:1 }, ctx.view), areaName(area,lang)));
  if (areaLinks.length) groups.push([t("Buscar en otra zona (sustituye el texto y la ubicación; conserva los demás filtros)","Search in a different zone (replaces text and location; keeps other filters)"), areaLinks]);
  for (const entity of ["developments","properties"]) {
    const alternate = query.entity !== "all" && entity !== query.entity;
    // Named projects can help orient an unconstrained name search. Never bypass a
    // budget, property type, operation, or another restriction in suggested links.
    if (alternate && ["type","operation","modality","currency","rentPeriod","development","zone","subarea"].some(key => query[key])) continue;
    if (alternate && ["min","max","beds","baths","parking","minBuilt","maxBuilt","minLot","maxLot"].some(key => query[key] != null)) continue;
    const matches = rows.filter(row => inventory.entityOf(row) === entity && inventory.matches(row, { ...query, entity }, {areas, publicLocationFor:ctx.publicLocationFor}));
    const links = matches.slice(0,4).flatMap(row => {
      const href = lang === "en" ? row.urlEn : row.urlEs;
      return href && href.startsWith("/") && !href.startsWith("//") ? [`<a href="${escape(href)}">${escape(lang === "en" ? row.titleEn || row.titleEs : row.titleEs)}</a>`] : [];
    });
    if (links.length) {
      const label = entity === "developments" ? t("Desarrollo","Gated community") : t("Propiedad","Property");
      groups.push([label, links, alternate ? t("Es otro tipo de ficha; no cuenta como una propiedad compatible.","This is a different listing type; it is not counted as a compatible property.") : ""]);
    }
  }
  if (!groups.length) return "";
  return `<nav class="catalog-suggestions" aria-label="${t("Sugerencias de búsqueda","Search suggestions")}">${groups.map(([label,links,note]) => `<div><strong>${label}</strong> ${links.join(" · ")}${note ? `<p>${note}</p>` : ""}</div>`).join("")}</nav>`;
}

function activeChips(ctx, rows) {
  const { query, path, t, view, areas, lang } = ctx;
  const pricing = require("./public-pricing");
  const budget = pricing.budgetInUsd(query, ctx.exchangeRate);
  const budgetLabel = key => {
    if (budget[key] === null) return t("Presupuesto USD por confirmar", "USD budget to be confirmed");
    if (budget[key] === 0) return "USD $0";
    return pricing.format({ amount: budget[key], currency: "USD", approximate: budget.approximate, date: budget.date,
      basis: query.priceBasis, operation: query.operation, period: query.rentPeriod || "unclassified" }, lang);
  };
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
    min:t("Desde ","From ") + budgetLabel("min"),max:t("Hasta ","Up to ") + budgetLabel("max"),beds:t("Recámaras mínimas: ","Minimum bedrooms: ") + query.beds,
    baths:t("Baños mínimos: ","Minimum bathrooms: ") + query.baths,parking:t("Estacionamientos mínimos: ","Minimum parking spaces: ") + query.parking,
    minBuilt:t("Construcción desde ","Built area from ") + query.minBuilt + " m²", maxBuilt:t("Construcción hasta ","Built area up to ") + query.maxBuilt + " m²",
    minLot:t("Terreno desde ","Land area from ") + query.minLot + " m²", maxLot:t("Terreno hasta ","Land area up to ") + query.maxLot + " m²",
    priceBasis:query.priceBasis === "sqm" ? t("Por m²","Per m²") : t("Precio total","Total price"),
    rentPeriod:({month:t("Mensual","Monthly"),day:t("Diario","Daily"),year:t("Anual","Annual"),unclassified:t("Sin confirmar","Unconfirmed")})[query.rentPeriod],
  };
  const params = inventory.toSearchParams(query);
  const chips = [];
  for (const [key,value] of params) {
    if (["entity","sort","page","priceMode","currency"].includes(key) || (ctx.featuredPage && key === "featured")) continue;
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
  const context = { zone, subzone: subarea ? areaName(subarea,lang) : query.zone, development: development && (lang === "en" ? development.titleEn || development.titleEs : development.titleEs), developmentId:development?.id, propertyType:query.type,
    searchFilters:JSON.stringify(query), origin:ctx.presales ? "presale-directory" : "catalog-results", sourcePath };
  const presale = ctx.presales || development && require("./presale-policy").isPresale(development,{directory:ctx.directory,records:rows});
  const rent = !presale && query.operation === "rent", land = query.type === "Terreno";
  const buyer = rent ? t("Busco una renta aquí","Find a rental here") : land ? t("Quiero comprar un terreno","I want to buy land") : development ? t("Encontrar vivienda aquí","Find a home here") : t("Busco una propiedad aquí","Find a property here");
  const seller = rent ? t("Quiero poner mi propiedad en renta","I want to rent out my property") : land ? t("Quiero vender un terreno","I want to sell land") : t("Quiero vender aquí","I want to sell here");
  const emptyDevelopment = development && !ctx.result.total ? `<p>${t("No hay viviendas publicadas aquí por el momento. Cuéntanos qué buscas y te ayudamos a encontrar opciones.","There are no homes listed here at the moment. Tell us what you are looking for and we will help you find options.")}</p>` : "";
  return `<div class="catalog-demand">${emptyDevelopment}<div>${contactLink(lang,buyer,{...context,intent:rent ? "rent" : "buy"})}${presale ? "" : contactLink(lang,seller,{...context,intent:rent ? "let" : "sell"},"outline-dark-button")}</div></div>`;
}

function renderCatalog(page, properties, params = {}, renderCards) {
  const areas = areasFor(page);
  const ctx = catalogContext(page,params,areas);
  const { lang, presales, projects, path, input, defaults } = ctx;
  const t = (es,en) => lang === "en" ? en : es;
  const publicRows = properties.filter(inventory.isPublic);
  const directory = page.portalDirectory || require("./portal-directory").publicDirectory(null, publicRows);
  const publicLocationFor = createPublicLocationResolver(publicRows, { directory, areas, lang });
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
  const result = inventory.queryInventory(records, input, { defaults, areas, lang, featureRanks:ranks, groupByArea:grouped, publicPricing:true, exchangeRate:page.currencyExchange, publicLocationFor });
  result.errors = result.errors.map(error => localizeCatalogError(error,lang));
  if (ctx.unsupportedProjectFilters.length) {
    result.errors.push(t("Estos criterios corresponden a unidades: cambia a Propiedades o quita los filtros indicados. No se han ignorado tus requisitos.","These criteria apply to units: switch to Properties or remove the selected filters. Your requirements have not been ignored."));
    result.items = []; result.all = []; result.total = 0; result.pages = 0;
  }
  const { query, total } = result;
  const view = params.view === "map" ? "map" : "list";
  Object.assign(ctx,{areas,t,query,result,view,directory,publicLocationFor,landRoute:page.category?.type === "Terreno",exchangeRate:page.currencyExchange});
  const sourceParams = new URLSearchParams(params);
  const sourcePath = (page.path || path) + (sourceParams.size ? "?" + sourceParams : "");
  const mapSourceParams = new URLSearchParams(sourceParams);
  mapSourceParams.set("view", "map");
  const mapSourcePath = (page.path || path) + "?" + mapSourceParams;
  const singular = total === 1;
  const label = mixed ? t(singular ? "resultado destacado":"resultados destacados",singular ? "featured result":"featured results") : presales ? t(singular ? "preventa":"preventas",singular ? "presale":"presales") : projects ? t(singular ? "desarrollo":"desarrollos",singular ? "gated community":"gated communities") : t(singular ? "propiedad":"propiedades",singular ? "listing":"listings");
  const cardContext = { ...ctx, sourcePath, records:publicRows };
  let cards = "";
  if (presales && params.project && result.items[0]) {
    // A project is a detail view, not a one-result directory. Keep its public
    // location map independent from the catalog's list/map controls.
    return `<section id="category-inventory" class="category-inventory catalog-experience catalog-project-view">${projectDetail(result.items[0], areas, lang, sourcePath)}</section>`;
  }
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
    if (links.length) areaIndex = `<details class="catalog-zone-chooser"><summary>${t("Elegir zona","Choose an area")}</summary><nav class="catalog-area-index" aria-label="${t("Explorar por zona","Explore by zone")}">${links.join("")}</nav></details>`;
  }
  const mapItems = result.all.map(row => {
    const resolved = publicLocationFor(row);
    const precision = row.portalHiddenBlocks?.includes("location") || row.locationPrecision === "hidden" ? "hidden" : resolved.precision;
    const project = Boolean(row.presaleProject), development = project || inventory.entityOf(row) === "developments";
    const title = lang === "en" ? row.titleEn || row.titleEs : row.titleEs;
    const parent = publicRows.find(item => item.id === row.portalDevelopmentId);
    const area = areaFor(row,areas);
    const context = {
      intent:!development && row.operation === "rent" ? "rent" : "buy",
      zone:areaName(area,lang),subzone:subareaName(row,area,lang),
      development:development ? (project ? (lang === "en" ? row.linkedDevelopment?.titleEn || row.linkedDevelopment?.titleEs : row.linkedDevelopment?.titleEs) : title) : (lang === "en" ? parent?.titleEn || parent?.titleEs : parent?.titleEs) || "",
      propertyId:development ? row.linkedProperty?.id || "" : row.id,
      developmentId:development ? row.linkedDevelopment?.id || (!project ? row.id : "") : parent?.id || "",
      propertyTitle:development ? "" : title,propertyType:development ? "" : row.type,mls:row.mls || "",
      project:project ? title : "",reference:project ? row.presaleProject.reference || row.reference || row.id : "",
      searchFilters:JSON.stringify(query),origin:project ? "presale-map" : development ? "development-map" : "property-map",sourcePath:mapSourcePath,
    };
    const contactParams = new URLSearchParams(Object.entries(context).filter(([,value]) => value != null && value !== ""));
    return { id:row.id,title:lang === "en" ? row.titleEn || row.titleEs : row.titleEs,url:lang === "en" ? row.urlEn : row.urlEs,kind:row.featuredArea ? "zone" : row.presaleProject ? "presale" : inventory.entityOf(row) === "developments" ? "development" : "property",
      contactUrl:row.featuredArea ? "" : (lang === "en" ? "/en/contact?" : "/contacto?") + contactParams,
      priceText: row.featuredArea ? "" : inventory.publicPriceText(row.linkedDevelopment || row.linkedProperty || row, ctx.exchangeRate, lang),
      locationPrecision:precision,approximate:precision !== "exact", ...(precision === "hidden" ? {} : {
        latitude:resolved.latitude,longitude:resolved.longitude,locationScope:resolved.locationScope,evidenceLabel:resolved.evidenceLabel}) };
  });
  const searchLabel = t("Buscar por zona, comunidad, nombre o características","Search by zone, community, name or features");
  const pagination = presales && params.project ? "" : paginated(result,path,lang,view);
  const saveSearch = !result.errors.length && !total ? contactLink(lang,t("Guardar búsqueda y consultar avisos","Save search and check alerts"), {
    service:"search-watch", intent:query.operation === "rent" ? "rent" : "buy", searchFilters:JSON.stringify(query), origin:"catalog-no-results", sourcePath,
  }, "outline-dark-button").replace("data-contact-inquiry", "data-contact-inquiry data-save-search") : "";
  return `<section id="category-inventory" class="category-inventory catalog-experience" data-catalog-root data-catalog-query="${escape(inventory.toSearchParams(query))}" data-catalog-map-total="${mapItems.length}">
    <div class="public-catalog-toolbar">${entityNavigation(ctx,publicRows)}${areaIndex}
    ${ctx.featuredPage ? "" : `<div class="catalog-controls"><div class="catalog-search-row"><input type="search" name="q" form="catalogFilters" value="${escape(query.text)}" aria-label="${searchLabel}" placeholder="${t("Zona, nombre o características","Zone, name or features")}" autocomplete="off" /><button type="submit" form="catalogFilters" class="primary-button">${t("Buscar","Search")}</button></div>${catalogFilters(ctx)}<details class="catalog-conversation"><summary>${t("Búsqueda guiada","Guided search")}</summary><form data-catalog-assistant><label>${t("Describe lo que buscas","Describe what you are looking for")}<input name="query" maxlength="600" required /></label><button type="submit" class="primary-button">${t("Buscar","Search")}</button><div data-search-status aria-live="polite"></div></form></details></div>`}
    ${ctx.featuredPage ? "" : `${presales ? "" : suggestionLinks(ctx,records)}<div class="catalog-active-filters">${activeChips(ctx,publicRows)}</div>`}
    <div class="catalog-result-bar"><p id="categoryInventoryCount" role="status">${total} ${label}</p><div class="catalog-view-toggle" role="group" aria-label="${t("Vista","View")}"><button type="button" data-catalog-view="list" aria-pressed="true">${t("Lista","List")}</button><button type="button" data-catalog-view="map" aria-pressed="false">${t("Mapa","Map")}</button></div></div>
    <p class="catalog-request-status" aria-live="polite"></p></div>
    ${result.errors.length ? `<div class="catalog-errors" role="alert"><h3>${t("Revisa los filtros","Review filters")}</h3><ul>${result.errors.map(error => `<li>${escape(error)}</li>`).join("")}</ul></div>` : ""}
    <div class="catalog-results"><div data-catalog-list>${cards || (result.errors.length ? "" : `<p class="inventory-empty">${t("Aún no hay publicaciones que coincidan con esta búsqueda.","There are no published matches for this search yet.")}</p>${saveSearch}`)}${pagination}</div><div data-catalog-map hidden><div class="catalog-map-canvas" role="region" aria-label="${t("Mapa de resultados","Results map")}"></div><p class="catalog-map-status" role="status"></p></div></div>
    ${ctx.featuredPage ? "" : catalogAssistance(ctx,sourcePath)}${result.errors.length || !total && !query.development || presales && params.project && result.items.length ? "" : catalogHelp(ctx,publicRows,sourcePath)}<script type="application/json" data-catalog-map-data>${JSON.stringify(mapItems).replace(/</g,"\\u003c")}</script></section>`;
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
  const entity = ctx.projects ? (en ? "Gated communities":"Desarrollos") : types[query.type] || (en ? "Properties":"Propiedades");
  const h1 = [entity,...selected.map(area => areaName(area,lang)),query.zone].filter(Boolean).join(" · ");
  const intro = ctx.projects ? (en ? "Explore projects by zone." : "Explora los desarrollos por zona.") : (en ? "Choose a zone and filter the published listings." : "Elige una zona y filtra las propiedades publicadas.");
  return {...page,h1,intro,eyebrow:entity,title:`${h1} | Puerto Cancun Center`,description:intro};
}

module.exports = { categoryDefaults, renderCatalog, catalogPresentation };
