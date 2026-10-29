(function (root, factory) {
  const api = factory(() => root.PccInventory || (typeof module === "object" && module.exports ? require("./inventory-contract") : null));
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccAdminInventory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (inventory) {
  "use strict";

  // Integration: load after inventory-contract.js; mount after every listings/stats render,
  // including empty results. Helpers: openListing, focusListing, setSection, renderListings,
  // refreshIcons; canManageListings is optional. No inventory or network writes occur here.
  // Native rows can use filterListings(sortedInventory, state.adminListingFilters, entity).
  // Filters: location (canonical ID / "pending" / ""), featured (boolean), quality
  // ("ready" / "incomplete" / ""), status ("all" includes drafts/archives), review,
  // publicOnly, ids (exact drilldown cohort, [] means none) and the existing filters.
  const contexts = new WeakMap();
  const ENTITIES = { properties: "Propiedades", developments: "Desarrollos" };
  const STATES = { active: "Activa", featured: "Destacada", draft: "Borrador", pending: "Pendiente", disabled: "Deshabilitada", sold: "Vendida", rented: "Rentada", archived: "Archivada" };
  const ACTIONS = { title: "Agregar t\u00edtulo", zone: "Asignar Location", images: "Agregar portada", description: "Completar descripci\u00f3n", type: "Revisar tipo", operation: "Revisar operaci\u00f3n", price: "Revisar precio y moneda", lot: "Revisar terreno", area: "Revisar superficie" };
  const FORM_FIELDS = { title: "title", zone: "zone", images: "imageFile", description: "description", type: "type", operation: "operation", price: "price", lot: "lot", area: "area" };
  const PAGE_SIZE = 20;
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const titleOf = (p) => p.titleEs || p.title_es || p.titleEn || p.title_en || "Sin t\u00edtulo";
  const metadata = (p) => p.catalogData || p.catalog_data || {};
  const bool = (value) => value === true || value === "true" || value === "1";
  const number = (value) => value === null ? "Sin datos" : new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);

  function sourceOf(p) {
    const origin = metadata(p).provenance || p.provenance || {};
    const text = (v) => typeof v === "string" || typeof v === "number" ? String(v) : "";
    const parts = [origin.file || p.sourceFile, origin.sheet || p.sourceSheet, origin.row || p.sourceRow].map(text).filter(Boolean);
    return parts.join(" / ") || text(p.source || metadata(p).source) || (p.sourceRequestId ? `Solicitud ${p.sourceRequestId}` : "Origen no informado");
  }

  function snapshot(items = []) {
    const api = inventory();
    const valid = items.filter((p) => p && p.id !== null && p.id !== undefined && String(p.id).trim());
    const unique = new Map(valid.map((p) => [p.id, p]));
    const reconciled = api.reconcile([...unique.values()]);
    return {
      ...reconciled,
      duplicateRows: valid.length - unique.size,
      unidentifiedRows: items.length - valid.length,
      records: reconciled.records.map((record) => ({ ...record, property: unique.get(record.id), source: sourceOf(unique.get(record.id)) })),
    };
  }

  function needsReview(record) {
    return record.quality.issues.length > 0 || record.duplicateMlsIds.length > 0;
  }

  function missingCover(record) {
    return record.quality.missingFields.some((item) => item.field === "images");
  }

  function availability(property, policy, now = Date.now()) {
    const raw = property.lastVerifiedAt ?? property.last_verified_at;
    const date = raw ? new Date(raw).getTime() : null;
    const days = policy?.[inventory().entityOf(property)];
    if (["draft", "archived"].includes(property.status)) return { status: "excluded", label: "Borrador o archivada: verificaci\u00f3n no aplicable" };
    if (!raw) return { status: "never", label: "Disponibilidad nunca revisada" };
    if (!Number.isFinite(date) || date > now) return { status: "invalid", label: "Fecha de revisi\u00f3n inv\u00e1lida; requiere confirmar" };
    const dateLabel = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
    const by = property.verifiedBy || property.verified_by || "Responsable no informado";
    if (!Number.isInteger(days) || days < 1 || days > 3650) return { status: "unknown", label: `Revisi\u00f3n: ${dateLabel} / ${by}. Plazo no disponible.` };
    const overdue = now - date >= days * 86400000;
    return { status: overdue ? "overdue" : "reviewed", days, label: `${overdue ? "Revisi\u00f3n vencida" : "Revisi\u00f3n registrada"}: ${dateLabel} / ${by}. Plazo: ${days} d\u00edas. No cambia el estado comercial.` };
  }

  function loadAvailabilityPolicy(ctx, retry = false) {
    if (ctx.policyUser !== ctx.state.session?.id) {
      ctx.policyUser = ctx.state.session?.id;
      ctx.reviewPolicy = null;
      ctx.policyStatus = "idle";
    }
    const id = ctx.snapshot.records[0]?.id;
    if (!id || (!retry && ctx.policyStatus !== "idle") || typeof window === "undefined" || !window.fetch) return;
    const userId = ctx.policyUser;
    ctx.policyStatus = "loading";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    window.fetch(`/api/admin/properties/${encodeURIComponent(id)}/verify`, { method: "GET", credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Review policy unavailable");
        const data = await response.json();
        if (!["properties", "developments"].every((entity) => Number.isInteger(data.reviewPolicy?.[entity]) && data.reviewPolicy[entity] >= 1 && data.reviewPolicy[entity] <= 3650)) throw new Error("Invalid review policy");
        if (ctx.state.session?.id !== userId) return;
        ctx.reviewPolicy = data.reviewPolicy;
        ctx.policyStatus = "loaded";
      }).catch(() => { if (ctx.state.session?.id === userId) ctx.policyStatus = "error"; })
      .finally(() => { window.clearTimeout(timeout); if (ctx.state.session?.id === userId) mount(ctx.state, ctx.helpers); });
  }

  function selectRecords(records, filters = {}, entity) {
    const api = inventory();
    const search = api.fold(filters.search);
    const ids = Array.isArray(filters.ids) ? new Set(filters.ids.map(String)) : null;
    return records.filter((r) => {
      const p = r.property;
      if (ids && !ids.has(String(r.id))) return false;
      if (entity && r.entity !== entity) return false;
      if (!filters.status && ["draft", "archived"].includes(r.status)) return false;
      if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.zone && p.zone !== filters.zone) return false;
      if (filters.operation && p.operation !== filters.operation) return false;
      if (filters.location === "pending" ? Boolean(r.location.id) : filters.location && r.location.id !== filters.location) return false;
      if (bool(filters.featured) && !bool(p.featured)) return false;
      if (["ready", "complete"].includes(filters.quality) && !r.quality.complete) return false;
      if (filters.quality === "incomplete" && r.quality.complete) return false;
      if (filters.missingCover && !missingCover(r)) return false;
      if (filters.review && !needsReview(r)) return false;
      if (filters.publicOnly && !r.public) return false;
      if (filters.availability && (!r.public || r.status !== "active" || availability(p, filters.reviewPolicy).status !== filters.availability)) return false;
      if (!search) return true;
      return api.fold([p.id, titleOf(p), p.titleEn, p.zone, p.city, p.state, p.neighborhood, p.address, p.mapPlace, p.type, p.operation, p.status, p.mls, p.descriptionEs, p.descriptionEn, ...(Array.isArray(p.keywords) ? p.keywords : [])].join(" ")).includes(search);
    });
  }

  // Optional shared predicate for the host's native rows; preserves input order.
  function filterListings(items, filters, entity) {
    return selectRecords(snapshot(items).records, filters, entity).map((record) => record.property);
  }

  function comparablePrice(price) {
    return ["USD", "MXN"].includes(price.currency) && ["sale", "rent"].includes(price.operation)
      && ["total", "sqm", "from"].includes(price.basis)
      && (price.operation !== "rent" || ["month", "day", "year"].includes(price.period));
  }

  function priceKey(entity, price) {
    return JSON.stringify([entity, price.currency, price.operation, price.basis, price.period]);
  }

  function priceGroupOf(property) {
    const api = inventory();
    const price = api.priceOf(property);
    const entity = api.entityOf(property);
    const label = [ENTITIES[entity], price.currency || "Sin moneda", ({ sale: "Venta", rent: "Renta" })[price.operation] || "Operaci\u00f3n por confirmar", ({ total: "Total", sqm: "Por m\u00b2", from: "Desde" })[price.basis] || "Base por confirmar", price.operation === "rent" ? ({ month: "Mensual", day: "Diario", year: "Anual" })[price.period] || "Periodo por confirmar" : ""].filter(Boolean).join(" / ");
    return { ...price, entity, key: priceKey(entity, price), label, comparable: comparablePrice(price) };
  }

  function sortListingsByPrice(items, direction = "asc") {
    return items.map((property) => ({ property, group: priceGroupOf(property) })).sort((a, b) => {
      const groupOrder = Number(b.group.comparable) - Number(a.group.comparable) || a.group.key.localeCompare(b.group.key);
      if (groupOrder) return groupOrder;
      if (a.group.comparable) {
        const validA = Number.isFinite(a.group.amount) && a.group.amount > 0;
        const validB = Number.isFinite(b.group.amount) && b.group.amount > 0;
        if (validA !== validB) return validA ? -1 : 1;
        if (validA && a.group.amount !== b.group.amount) return (a.group.amount - b.group.amount) * (direction === "desc" ? -1 : 1);
      }
      return String(a.property.id).localeCompare(String(b.property.id));
    }).map((item) => item.property);
  }

  function priceGroups(records) {
    const groups = new Map();
    for (const r of records) {
      const { currency, operation, basis, period, amount } = r.price;
      const key = priceKey(r.entity, r.price);
      if (!groups.has(key)) groups.set(key, { entity: r.entity, currency, operation, basis, period, comparable: comparablePrice(r.price), total: 0, excluded: 0, values: [] });
      const group = groups.get(key);
      group.total++;
      if (!group.comparable || amount === null || !Number.isFinite(amount) || amount <= 0) group.excluded++;
      else group.values.push(amount);
    }
    return [...groups.values()].map(({ values, ...group }) => {
      values.sort((a, b) => a - b);
      const n = values.length;
      const mid = Math.floor(n / 2);
      return { ...group, n, median: n ? (n % 2 ? values[mid] : values[mid - 1] / 2 + values[mid] / 2) : null, mean: n ? values.reduce((sum, value) => sum + value / n, 0) : null };
    }).sort((a, b) => JSON.stringify([a.entity, a.currency, a.operation, a.basis, a.period]).localeCompare(JSON.stringify([b.entity, b.currency, b.operation, b.basis, b.period])));
  }

  function editable(ctx) {
    if (typeof ctx.helpers.canManageListings === "function") return ctx.helpers.canManageListings();
    const user = ctx.state.session;
    return user?.role === "admin" && user.internalRole !== "viewer" && (user.id === "admin-prueba" || ["super_admin", "admin", "editor"].includes(user.internalRole) || user.permissions?.includes("properties:write"));
  }

  function openButton(ctx, r, label = "Corregir", field = "", mode = "edit") {
    const disabled = mode === "edit" ? !editable(ctx) || !ctx.helpers.openListing : !ctx.helpers.focusListing;
    return `<button type="button" class="pcc-action" data-pcc-open="${escape(r.id)}" data-pcc-field="${escape(field)}" data-pcc-mode="${mode}" ${disabled ? "disabled" : ""} aria-label="${escape(`${label}: ${titleOf(r.property)}`)}">${icon(mode === "edit" ? "pencil" : "arrow-right")}${escape(label)}</button>`;
  }

  function queryButton(ctx, label, entity, filters = {}, className = "", accessibleLabel = label) {
    const ids = selectRecords(ctx.snapshot.records, { status: "all", ...filters }, entity).map((record) => record.id);
    return `<button type="button" class="pcc-action ${className}" aria-label="${escape(accessibleLabel)}" data-pcc-query="${escape(JSON.stringify({ entity, filters: { ...filters, ids } }))}" ${ctx.helpers.setSection && ctx.helpers.renderListings ? "" : "disabled"}>${escape(label)}${icon("arrow-right")}</button>`;
  }

  function locationName(id) {
    return inventory().LOCATIONS.find((item) => item.id === id)?.name || "Pendiente de clasificar";
  }

  function renderLocations(ctx, records = ctx.snapshot.records, entityFilter = "") {
    const entities = entityFilter ? [entityFilter] : Object.keys(ENTITIES);
    return `<p class="pcc-note">IDs \u00fanicos del inventario administrativo. Incluye borradores y archivadas; las cifras no son disponibilidad p\u00fablica.</p><div class="pcc-table-scroll" role="region" aria-label="Locations: conteo por entidad" tabindex="0"><table class="pcc-table pcc-locations"><caption>Conteos por entidad y Location</caption><thead><tr><th scope="col">Location / alcance</th>${entities.map((entity) => `<th scope="col">${ENTITIES[entity]}</th>`).join("")}</tr></thead><tbody>${[...inventory().LOCATIONS, { id: "", name: "Pendiente de clasificar", description: "Requiere confirmar la fuente. Una direcci\u00f3n ambigua no se asigna por suposici\u00f3n." }].map((location, index) => {
      const counts = entities.map((entity) => {
        const rows = records.filter((r) => r.entity === entity && r.location.id === location.id);
        return `<td data-pcc-entity-label="${ENTITIES[entity]}">${queryButton(ctx, String(rows.length), entity, { location: location.id || "pending" }, "", `${rows.length} ${ENTITIES[entity].toLowerCase()} en ${location.name}`)}<small>${rows.filter((r) => r.public).length} visibles en web</small></td>`;
      }).join("");
      const total = records.filter((r) => r.location.id === location.id).length;
      return `<tr><th scope="row"><strong>${location.id ? `${index + 1}. ` : ""}${escape(location.name)}</strong><p>${escape(location.description)}</p><small>${location.id ? total ? "Agrupaci\u00f3n definida" : "Agrupaci\u00f3n definida \u00b7 Sin publicaciones" : `${total} registros pendientes de clasificar`}</small></th>${counts}</tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function renderPrices(records) {
    const groups = priceGroups(records);
    if (!groups.length) return '<p class="pcc-note">Sin datos para este alcance.</p>';
    return `<p class="pcc-note">Inventario cargado, sin filtro temporal ni conversi\u00f3n. N excluye precios ausentes, cero, inv\u00e1lidos y criterios sin clasificar. Mediana: valor central; promedio: suma/N, solo dentro de cada grupo. No es una valuaci\u00f3n de mercado ni el precio medio de unidades de un desarrollo.</p><div class="pcc-table-scroll" role="region" aria-label="Resumen de precios" tabindex="0"><table class="pcc-table"><caption>Precios originales por grupo comparable</caption><thead><tr>${["Entidad", "Moneda", "Operaci\u00f3n", "Base", "Periodo", "N v\u00e1lido / total", "Excluidos", "Mediana", "Promedio"].map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody>${groups.map((g) => `<tr><th scope="row">${ENTITIES[g.entity]}${g.comparable ? "" : "<small>Criterios por confirmar; sin c\u00e1lculo</small>"}</th><td>${escape(g.currency || "Sin moneda")}</td><td>${escape(({ sale: "Venta", rent: "Renta" })[g.operation] || "Sin operaci\u00f3n")}</td><td>${escape(({ total: "Total", sqm: "Por m\u00b2", from: "Desde" })[g.basis] || g.basis || "Sin base")}</td><td>${escape(({ month: "Mensual", day: "Diario", year: "Anual", unclassified: "Por confirmar" })[g.period] || (g.period ? g.period : "No aplica"))}</td><td>${g.n} / ${g.total}</td><td>${g.excluded}</td><td>${number(g.median)}</td><td>${number(g.mean)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function pendingText(r) {
    return [r.quality.missing.length ? `Falta: ${r.quality.missing.join(", ")}` : "Sin faltantes editoriales", ...r.quality.issues.map((issue) => `Revisar: ${issue.reason}`), r.duplicateMlsIds.length ? `MLS compartido por ${r.duplicateMlsIds.length} IDs; no fusionar sin fuente` : ""].filter(Boolean).join(". ");
  }

  function renderReconciliation(ctx, records, scope) {
    const onlyPending = ctx.ui[`${scope}Pending`] !== false;
    const matching = onlyPending ? records.filter((r) => !r.quality.complete || needsReview(r)) : records;
    const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
    const page = Math.min(Math.max(1, ctx.ui[`${scope}Page`] || 1), pages);
    ctx.ui[`${scope}Page`] = page;
    const rows = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return `<label class="pcc-check"><input type="checkbox" data-pcc-pending="${scope}" ${onlyPending ? "checked" : ""}>Solo pendientes y datos por revisar</label><p class="pcc-note" role="status">${matching.length} IDs \u00fanicos \u00b7 ${onlyPending ? "Faltantes, contradicciones o MLS compartidos" : "Conciliaci\u00f3n completa del alcance"}</p>${!rows.length ? '<p class="pcc-note">No hay registros en este conjunto.</p>' : `<div class="pcc-table-scroll" role="region" aria-label="Conciliaci\u00f3n por ID" tabindex="0"><table class="pcc-table pcc-reconciliation"><thead><tr>${["Publicaci\u00f3n / ID", "Entidad / estado", "Location / ubicaci\u00f3n original", "Origen / inclusi\u00f3n", "Pendientes", "Acciones"].map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${escape(titleOf(r.property))}<code>${escape(r.id)}</code>${r.mls ? `<small>MLS ${escape(r.mls)}</small>` : ""}</th><td>${ENTITIES[r.entity]}<small>${escape(STATES[r.status] || r.status || "Estado no informado")}</small><small>${r.public ? "Visible en web" : "No visible en web"}</small></td><td>${escape(locationName(r.location.id))}<small>${escape([r.zone, r.city].filter(Boolean).join(" / ") || "Ubicaci\u00f3n no informada")}</small></td><td>${escape(r.source)}<small>ID \u00fanico de ${ENTITIES[r.entity].toLowerCase()}; ${escape(r.location.reason || "Location por revisar")}</small></td><td>${escape(pendingText(r))}</td><td>${openButton(ctx, r, "Corregir", r.quality.missingFields[0]?.field || r.quality.issues[0]?.field)}${openButton(ctx, r, "Ver registro", "", "focus")}</td></tr>`).join("")}</tbody></table></div>`}<div class="pcc-pagination"><button type="button" class="pcc-icon-button" data-pcc-page="${scope}" data-pcc-step="-1" aria-label="P\u00e1gina anterior" title="P\u00e1gina anterior" ${page === 1 ? "disabled" : ""}>${icon("chevron-left")}</button><span>P\u00e1gina ${page} de ${pages}</span><button type="button" class="pcc-icon-button" data-pcc-page="${scope}" data-pcc-step="1" aria-label="P\u00e1gina siguiente" title="P\u00e1gina siguiente" ${page === pages ? "disabled" : ""}>${icon("chevron-right")}</button></div>`;
  }

  function reference(entity, complete) {
    const fields = entity === "developments" ? "Nombre, Location confirmada, portada, descripci\u00f3n comercial suficiente e informaci\u00f3n de comercializaci\u00f3n." : "T\u00edtulo, tipo, operaci\u00f3n, Location, portada, descripci\u00f3n, precio o consulta expl\u00edcita y superficie aplicable.";
    return `<aside class="pcc-reference"><strong>Ejemplo de referencia</strong><p>${complete ? fields : "Una publicaci\u00f3n sin portada requiere agregar una imagen; un texto POR DEFINIR requiere una descripci\u00f3n documentada."}</p><small>Referencia editorial, no es una ficha del inventario. No tiene ID ni MLS y no cuenta en resultados.</small></aside>`;
  }

  function renderExamples(ctx, records, entity) {
    return `<div class="pcc-examples">${[false, true].map((complete) => {
      const cases = records.filter((r) => r.entity === entity && r.quality.complete === complete);
      return `<section><h4>${complete ? "Completas" : "Incompletas"} <span>${cases.length}</span></h4>${cases.length ? `<ul>${cases.slice(0, 5).map((r) => `<li><div><strong>${escape(titleOf(r.property))}</strong><small>${escape(complete ? `${r.quality.fulfilled} de ${r.quality.required} requisitos; ${needsReview(r) ? "datos por revisar" : "sin faltantes editoriales"}` : r.quality.missing[0])}</small></div>${openButton(ctx, r, complete ? "Revisar" : "Corregir", r.quality.missingFields[0]?.field || "")}</li>`).join("")}</ul>${queryButton(ctx, "Ver todas", entity, { quality: complete ? "ready" : "incomplete" })}` : `<p class="pcc-note">No hay ${complete ? "completas" : "incompletas"} en este alcance.</p>${reference(entity, complete)}`}</section>`;
    }).join("")}</div>`;
  }

  function renderDashboard(ctx) {
    const records = ctx.snapshot.records;
    return `<header class="pcc-heading"><h2>Inventario y pendientes</h2><small>Conteos de los registros cargados, sin filtros de listado</small></header><p class="pcc-note">Completitud editorial no significa verificaci\u00f3n jur\u00eddica ni disponibilidad confirmada. Publicadas, destacadas e incompletas pueden coincidir: no se suman entre s\u00ed.</p>${Object.entries(ENTITIES).map(([entity, label]) => {
      const subset = records.filter((r) => r.entity === entity);
      return `<details class="pcc-details" data-pcc-details="breakdown-${entity}"><summary>${label}: ${subset.length} IDs \u00fanicos</summary><div class="pcc-breakdown-actions">${queryButton(ctx, "Ver todos", entity)}${queryButton(ctx, `${subset.filter((r) => r.public).length} visibles en web`, entity, { publicOnly: true })}${queryButton(ctx, `${subset.filter((r) => r.status === "draft").length} borradores`, entity, { status: "draft" })}${queryButton(ctx, `${subset.filter((r) => r.status === "archived").length} archivadas`, entity, { status: "archived" })}${queryButton(ctx, `${subset.filter((r) => bool(r.property.featured)).length} destacadas`, entity, { featured: true })}</div>${renderLocations(ctx, subset, entity)}${entity === "properties" ? `<div class="pcc-breakdown-actions" aria-label="Desglose por tipo">${[...inventory().TYPES, ""].map((type) => {
        const count = subset.filter((r) => type ? r.property.type === type : !inventory().TYPES.includes(r.property.type)).length;
        return type ? queryButton(ctx, `${type}: ${count}`, entity, { type }) : queryButton(ctx, `Tipo por revisar: ${count}`, entity, { ids: subset.filter((r) => !inventory().TYPES.includes(r.property.type)).map((r) => r.id) });
      }).join("")}</div>` : ""}</details><div class="pcc-alerts" aria-label="Pendientes de ${label.toLowerCase()}">${queryButton(ctx, `${subset.filter((r) => !r.quality.complete).length} incompletas`, entity, { quality: "incomplete" })}${queryButton(ctx, `${subset.filter(missingCover).length} sin portada`, entity, { missingCover: true })}${queryButton(ctx, `${subset.filter((r) => !r.location.id).length} sin Location`, entity, { location: "pending" })}${queryButton(ctx, `${subset.filter(needsReview).length} datos por revisar`, entity, { review: true })}</div><details class="pcc-details" data-pcc-details="examples-${entity}"><summary>${label}: casos orientativos</summary>${renderExamples(ctx, records, entity)}</details>`;
    }).join("")}${renderAvailability(ctx)}<button type="button" class="pcc-action" data-admin-section-link="statistics">${icon("chart-column")}Estad\u00edsticas de inventario, demanda y operaci\u00f3n</button><details class="pcc-details" data-pcc-details="reconcile-dashboard"><summary>Conciliaci\u00f3n y pendientes por ID</summary><p class="pcc-note">${ctx.snapshot.duplicateRows} filas repetidas por ID no se cuentan de nuevo. ${ctx.snapshot.unidentifiedRows} filas sin ID excluidas. Un MLS compartido no fusiona registros. Esta conciliaci\u00f3n no corrige datos de origen.</p>${renderReconciliation(ctx, records, "dashboard")}</details>`;
  }

  function renderAvailability(ctx) {
    return `<section class="pcc-details"><h3>Revisi\u00f3n de disponibilidad</h3><p class="pcc-note">Solo inventario activo y visible en web. Editar una ficha no verifica su disponibilidad; vencer el plazo no la marca como vendida.</p>${!ctx.reviewPolicy ? `<p role="status">${ctx.policyStatus === "error" ? 'Plazos no disponibles. No se calculan vencimientos. <button type="button" class="pcc-action" data-pcc-policy-retry>Reintentar</button>' : "Consultando plazos de revisi\u00f3n..."}</p>` : ""}${Object.entries(ENTITIES).map(([entity, label]) => `<div class="pcc-breakdown-actions"><strong>${label}${ctx.reviewPolicy ? ` / ${ctx.reviewPolicy[entity]} d\u00edas` : ""}</strong>${[["never", "nunca revisadas"], ["overdue", "revisiones vencidas"], ["invalid", "fechas por revisar"]].filter(([status]) => status !== "overdue" || ctx.reviewPolicy).map(([status, text]) => {
      const filters = { availability: status, reviewPolicy: ctx.reviewPolicy };
      const rows = selectRecords(ctx.snapshot.records, { status: "all", ...filters }, entity);
      return queryButton(ctx, `${rows.length} ${text}`, entity, filters);
    }).join("")}</div>`).join("")}</section>`;
  }

  function renderStatistics(ctx) {
    const records = ctx.snapshot.records;
    return `<header class="pcc-heading"><h3>Inventario</h3><small>IDs \u00fanicos cargados; todos los estados; sin filtros del listado</small></header>${renderLocations(ctx)}<h3>Precios comparables</h3>${renderPrices(records)}`;
  }

  function renderControls(ctx) {
    const filters = ctx.state.adminListingFilters || {};
    const entity = ctx.state.adminSection === "developments" ? "developments" : "properties";
    const eligible = selectRecords(ctx.snapshot.records, { ...filters, quality: "" }, entity);
    const records = selectRecords(ctx.snapshot.records, filters, entity);
    ctx.selected = records;
    const quality = filters.quality === "complete" ? "ready" : filters.quality || "";
    return `${Array.isArray(filters.ids) ? `<div class="pcc-scope"><span>Selecci\u00f3n del indicador: ${filters.ids.length} IDs; los filtros siguientes restringen este conjunto.</span><button type="button" class="pcc-action" data-pcc-clear-ids>${icon("x")}Quitar selecci\u00f3n por ID</button></div>` : ""}<div class="pcc-filters"><div class="pcc-segments" role="group" aria-label="Completitud editorial">${[["", "Todas"], ["ready", "Completas"], ["incomplete", "Incompletas"]].map(([value, label]) => `<button type="button" data-pcc-quality="${value}" aria-pressed="${quality === value}" ${ctx.helpers.renderListings ? "" : "disabled"}>${label}<span>${eligible.filter((r) => !value || (value === "ready" ? r.quality.complete : !r.quality.complete)).length}</span></button>`).join("")}</div><label class="pcc-filter-location"><span>Location</span><select data-pcc-filter="location" ${ctx.helpers.renderListings ? "" : "disabled"}><option value="">Todas las Locations</option>${[...inventory().LOCATIONS, { id: "pending", name: "Pendiente de clasificar" }].map((item) => `<option value="${item.id}" ${filters.location === item.id ? "selected" : ""}>${escape(item.name)}</option>`).join("")}</select></label><label class="pcc-check"><input type="checkbox" data-pcc-filter="featured" ${bool(filters.featured) ? "checked" : ""} ${ctx.helpers.renderListings ? "" : "disabled"}>Solo destacadas</label></div><div class="pcc-scope" role="status"><span>${records.length} ${ENTITIES[entity].toLowerCase()} \u00b7 ${filters.availability ? "Disponibilidad: solo activas visibles en web" : filters.status === "all" ? "Todos los estados, incluidos borradores y archivadas" : filters.status ? escape(STATES[filters.status] || filters.status) : "Inventario general, sin borradores ni archivadas"}${filters.missingCover ? " \u00b7 Sin portada" : ""}${filters.review ? " \u00b7 Datos por revisar" : ""}${filters.publicOnly ? " \u00b7 Visibles en web" : ""}</span><small>Criterios ${escape(ctx.snapshot.version)}</small></div><details class="pcc-details" data-pcc-details="listing-review"><summary>Conciliaci\u00f3n y pendientes del resultado</summary>${renderReconciliation(ctx, records, "listings")}</details><details class="pcc-details" data-pcc-details="listing-prices"><summary>Precios del resultado</summary>${renderPrices(records)}</details>`;
  }

  function updateHTML(element, html) {
    if (element._pccHTML === html) return;
    const open = new Set([...element.querySelectorAll("details[open][data-pcc-details]")].map((node) => node.dataset.pccDetails));
    const focused = element.contains(element.ownerDocument.activeElement) ? element.ownerDocument.activeElement : null;
    const focusKey = focused ? ["data-pcc-filter", "data-pcc-quality", "data-pcc-pending", "data-pcc-page", "data-pcc-step"].filter((key) => focused.hasAttribute(key)).map((key) => [key, focused.getAttribute(key)]) : [];
    element.innerHTML = html;
    element._pccHTML = html;
    element.querySelectorAll("details[data-pcc-details]").forEach((node) => { node.open = open.has(node.dataset.pccDetails); });
    if (focusKey.length) [...element.querySelectorAll("button, input, select")].find((node) => focusKey.every(([key, value]) => node.getAttribute(key) === value))?.focus({ preventScroll: true });
  }

  function section(ctx, id, anchor, position, views) {
    if (!anchor) return null;
    let node = ctx.document.getElementById(id);
    if (!node) {
      node = ctx.document.createElement("section");
      node.id = id;
      node.className = "pcc-inventory";
      if (views) node.dataset.adminSectionPanel = views;
      anchor.insertAdjacentElement(position, node);
    }
    bind(ctx, node);
    if (views) node.hidden = !views.split(" ").includes(ctx.state.adminSection || "dashboard");
    return node;
  }

  function refresh(ctx) {
    ctx.ui.listingsPage = 1;
    ctx.helpers.renderListings?.();
    mount(ctx.state, ctx.helpers);
  }

  function applyQuery(ctx, entity, filters) {
    // setAdminSection resets legacy filters; assign only AFTER that callback returns.
    ctx.helpers.setSection(entity);
    if (ctx.state.adminSection !== entity) return;
    ctx.state.adminListingFilters = { search: "", type: "", zone: "", operation: "", status: "all", quality: "", missingCover: false, location: "", featured: false, review: false, publicOnly: false, ...filters };
    refresh(ctx);
    ctx.document.getElementById("pccInventoryFilters")?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }

  function bind(ctx, root) {
    ctx.boundRoots ||= new WeakSet();
    if (ctx.boundRoots.has(root)) return;
    ctx.boundRoots.add(root);
    root.addEventListener("change", (event) => {
      const control = event.target.closest("[data-pcc-filter], [data-pcc-pending]");
      if (!control || !root.contains(control)) return;
      if (control.hasAttribute("data-pcc-pending")) {
        const scope = control.dataset.pccPending;
        ctx.ui[`${scope}Pending`] = control.checked;
        ctx.ui[`${scope}Page`] = 1;
        mount(ctx.state, ctx.helpers);
      } else if (ctx.helpers.renderListings) {
        ctx.state.adminListingFilters = { ...ctx.state.adminListingFilters, [control.dataset.pccFilter]: control.type === "checkbox" ? control.checked : control.value };
        refresh(ctx);
      }
    });
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-pcc-quality], [data-pcc-query], [data-pcc-open], [data-pcc-page], [data-pcc-clear-ids], [data-pcc-policy-retry]");
      if (!button || button.disabled || !root.contains(button)) return;
      if (button.hasAttribute("data-pcc-policy-retry")) {
        loadAvailabilityPolicy(ctx, true);
        mount(ctx.state, ctx.helpers);
      } else if (button.hasAttribute("data-pcc-clear-ids")) {
        const { ids, ...filters } = ctx.state.adminListingFilters || {};
        ctx.state.adminListingFilters = filters;
        refresh(ctx);
        root.querySelector('[data-pcc-quality=""]')?.focus({ preventScroll: true });
      } else if (button.hasAttribute("data-pcc-quality")) {
        ctx.state.adminListingFilters = { ...ctx.state.adminListingFilters, quality: button.dataset.pccQuality };
        refresh(ctx);
      } else if (button.hasAttribute("data-pcc-query")) {
        const query = JSON.parse(button.dataset.pccQuery);
        applyQuery(ctx, query.entity, query.filters);
      } else if (button.hasAttribute("data-pcc-page")) {
        const key = `${button.dataset.pccPage}Page`;
        ctx.ui[key] = (ctx.ui[key] || 1) + Number(button.dataset.pccStep);
        mount(ctx.state, ctx.helpers);
      } else {
        const record = ctx.snapshot.records.find((r) => String(r.id) === button.dataset.pccOpen);
        if (!record) return;
        if (button.dataset.pccMode === "focus") {
          ctx.state.adminListingFilters = {};
          ctx.helpers.focusListing?.(record.id);
        } else if (editable(ctx)) {
          ctx.helpers.openListing?.(record.id);
          const field = FORM_FIELDS[button.dataset.pccField];
          if (field) ctx.document.querySelector(`#listingForm [name="${field}"]`)?.focus({ preventScroll: false });
        }
      }
    });
  }

  function annotateRows(ctx) {
    const list = ctx.document.getElementById("adminListings");
    if (!list) return;
    list.classList.add("pcc-inventory-enhanced");
    const records = new Map(ctx.snapshot.records.map((r) => [String(r.id), r]));
    list.querySelectorAll(".listing-item").forEach((row) => {
      const id = row.querySelector("[data-edit-listing]")?.dataset.editListing;
      const record = records.get(id);
      if (!record) return;
      let diagnosis = row.querySelector("[data-pcc-diagnosis]");
      if (!diagnosis) {
        diagnosis = ctx.document.createElement("div");
        diagnosis.className = "pcc-inventory pcc-row-diagnosis";
        diagnosis.dataset.pccDiagnosis = "";
        (row.querySelector(".listing-content") || row).append(diagnosis);
        bind(ctx, diagnosis);
      }
      row.querySelectorAll(".quality-missing").forEach((node) => { node.hidden = true; });
      row.querySelectorAll(".inventory-freshness").forEach((node) => { node.hidden = true; });
      const verification = row.querySelector("[data-verify-property]");
      if (verification) {
        verification.textContent = "Registrar revisi\u00f3n de disponibilidad";
        if (["draft", "archived"].includes(record.status)) verification.disabled = true;
      }
      const q = record.quality;
      updateHTML(diagnosis, `<div class="pcc-row-status"><strong>${q.complete ? "Completa" : "Incompleta"}: ${q.fulfilled} de ${q.required}</strong><span>${escape(locationName(record.location.id))}</span></div>${q.missingFields.length ? `<ul class="pcc-missing">${q.missingFields.map((item) => `<li>${openButton(ctx, record, ACTIONS[item.field] || item.label, item.field)}</li>`).join("")}</ul>` : '<small>Sin faltantes editoriales; no implica disponibilidad verificada.</small>'}${needsReview(record) ? `<p class="pcc-review-note"><strong>Datos por revisar:</strong> ${escape([...q.issues.map((issue) => issue.reason), record.duplicateMlsIds.length ? `MLS compartido (${record.duplicateMlsIds.length} IDs distintos)` : ""].filter(Boolean).join(". "))}</p>` : ""}`);
      let freshness = diagnosis.querySelector("[data-pcc-availability]");
      if (!freshness) { freshness = ctx.document.createElement("p"); freshness.dataset.pccAvailability = ""; diagnosis.append(freshness); }
      freshness.textContent = availability(record.property, ctx.reviewPolicy).label;
    });
  }

  function syncNativeFilters(ctx) {
    const filters = ctx.state.adminListingFilters || {};
    const ids = { search: "adminListingSearch", type: "adminListingTypeFilter", zone: "adminListingZoneFilter", operation: "adminListingOperationFilter", status: "adminListingStatusFilter", quality: "adminListingQualityFilter" };
    for (const [key, id] of Object.entries(ids)) {
      const control = ctx.document.getElementById(id);
      if (!control) continue;
      if (key === "status" && ![...control.options].some((option) => option.value === "all")) {
        const option = ctx.document.createElement("option");
        option.value = "all";
        option.textContent = "Todos los estados";
        control.append(option);
      }
      control.value = filters[key] || "";
      if (key === "quality") {
        const ready = [...control.options].find((option) => option.value === "ready");
        if (ready) ready.textContent = "Completas";
        control.closest("label")?.classList.add("pcc-native-quality");
      }
    }
  }

  function bindMetrics(ctx) {
    const definitions = {};
    for (const [entity, label] of Object.entries(ENTITIES)) {
      for (const [metric, name, filters] of [[entity, label, {}], [`active-${entity}`, `${label} ${entity === "properties" ? "activas" : "activos"}`, { status: "active" }], [`incomplete-${entity}`, `${label} ${entity === "properties" ? "incompletas" : "incompletos"}`, { quality: "incomplete" }], [`${entity}-without-cover`, `${label} sin portada`, { missingCover: true }]]) {
        const ids = selectRecords(ctx.snapshot.records, { status: "all", ...filters }, entity).map((record) => record.id);
        definitions[metric] = { entity, label: name, filters: { ...filters, ids } };
      }
    }
    ctx.metricRoots ||= new WeakSet();
    for (const grid of ctx.document.querySelectorAll("#statsGrid, #adminInsights")) {
      grid.querySelectorAll("[data-admin-metric]").forEach((button) => {
        const definition = definitions[button.dataset.adminMetric];
        if (!definition) return;
        const count = definition.filters.ids.length;
        button.dataset.pccMetricQuery = JSON.stringify(definition);
        if (button.querySelector("strong")) button.querySelector("strong").textContent = count;
        if (grid.id === "statsGrid" && button.querySelector("span")) button.querySelector("span").textContent = definition.label;
        button.setAttribute("aria-label", `${definition.label}: ${count}. ${button.querySelector("small")?.textContent || "Todos los estados"}. Abrir detalle`);
      });
      if (ctx.metricRoots.has(grid)) continue;
      ctx.metricRoots.add(grid);
      grid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-pcc-metric-query]");
        if (!button || !grid.contains(button) || !ctx.helpers.setSection || !ctx.helpers.renderListings) return;
        event.stopPropagation();
        const query = JSON.parse(button.dataset.pccMetricQuery);
        if (button.dataset.adminMetric === query.entity) {
          const breakdown = ctx.document.querySelector(`[data-pcc-details="breakdown-${query.entity}"]`);
          if (breakdown) {
            breakdown.open = true;
            breakdown.querySelector("summary")?.focus();
            breakdown.scrollIntoView({ block: "nearest", behavior: "auto" });
          }
        } else applyQuery(ctx, query.entity, query.filters);
      }, true);
    }
  }

  function mount(state, helpers = {}) {
    const document = helpers.document || (typeof window !== "undefined" ? window.document : null);
    if (!document || !inventory()) return { mounted: false, reason: "DOM o PccInventory no disponible" };
    if (state.session?.role !== "admin") return { mounted: false, reason: "Fuera del panel administrativo" };
    let ctx = contexts.get(document);
    if (!ctx) { ctx = { document, ui: {}, helpers, state }; contexts.set(document, ctx); }
    ctx.state = state;
    ctx.helpers = helpers;
    ctx.snapshot = snapshot(Array.isArray(state.properties) ? state.properties : []);
    loadAvailabilityPolicy(ctx);
    const dashboard = section(ctx, "pccInventoryDashboard", document.getElementById("statsGrid"), "afterend", "dashboard");
    if (dashboard) updateHTML(dashboard, renderDashboard(ctx));
    const statistics = section(ctx, "pccInventoryStatistics", document.getElementById("adminOperationalStatsSection"), "beforebegin");
    if (statistics) updateHTML(statistics, renderStatistics(ctx));
    const catalog = section(ctx, "pccInventoryLocations", document.querySelector("#adminCatalogsCard .catalog-summary") || document.querySelector("#adminCatalogsCard > div"), "afterend");
    if (catalog) updateHTML(catalog, `<header class="pcc-heading"><h3>Locations</h3></header><p class="pcc-note">Agrupaciones comerciales; no sustituyen ciudad, municipio, direcci\u00f3n ni coordenadas. Los alias se resuelven con las reglas compartidas del inventario.</p>${renderLocations(ctx)}`);
    const list = document.getElementById("adminListings");
    const controls = section(ctx, "pccInventoryFilters", list?.parentElement.querySelector(".listings-subhead") || list, "beforebegin");
    if (controls) {
      controls.dataset.adminListingView = "properties developments";
      controls.hidden = !["properties", "developments"].includes(state.adminSection);
      updateHTML(controls, renderControls(ctx));
    }
    const zone = document.querySelector('#listingForm [name="zone"]');
    const help = section(ctx, "pccInventoryLocationHelp", zone?.closest(".form-row") || zone?.closest("label"), "afterend");
    if (help) updateHTML(help, `<details class="pcc-details" data-pcc-details="zone-help"><summary>\u00bfQu\u00e9 incluye esta zona?</summary><dl class="pcc-location-help">${inventory().LOCATIONS.map((item) => `<div><dt>${escape(item.name)}</dt><dd>${escape(item.description)}</dd></div>`).join("")}</dl><p class="pcc-note">La agrupaci\u00f3n no cambia la direcci\u00f3n original. La ubicaci\u00f3n ambigua queda pendiente de revisar.</p></details>`);
    syncNativeFilters(ctx);
    const sort = document.getElementById("adminListingSort");
    if (sort) for (const option of sort.options) {
      if (option.value === "price_asc") option.textContent = "Precio por grupo: menor a mayor";
      if (option.value === "price_desc") option.textContent = "Precio por grupo: mayor a menor";
    }
    annotateRows(ctx);
    bindMetrics(ctx);
    helpers.refreshIcons?.();
    return { mounted: Boolean(dashboard || catalog || controls), total: ctx.snapshot.total, matched: ctx.selected?.length || 0, version: ctx.snapshot.version };
  }

  return { mount, snapshot, filterListings, selectRecords, priceGroups, priceGroupOf, sortListingsByPrice, availability };
});
