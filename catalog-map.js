(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccCatalogMap = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const instances = new WeakMap();
  const active = new Set();
  const loaders = new WeakMap();
  const ASSETS = {
    css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    cssHash: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
    jsHash: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=",
  };
  const DEFAULT_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const STYLES = `
    .pcc-catalog-map-mounted .catalog-map-canvas { width:100%;height:480px;min-height:320px;position:relative;z-index:0; }
    .pcc-catalog-map-toolbar { display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px; }
    .pcc-catalog-map-toolbar button { min-height:44px;max-width:100%;padding:8px 14px;border:1px solid #075562;border-radius:4px;background:#fff;color:#073540;font:inherit;white-space:normal; }
    .pcc-catalog-map-toolbar button:disabled { opacity:.55; }
    .pcc-catalog-map-mounted :focus-visible { outline:3px solid #ae8c42;outline-offset:3px; }
    .pcc-catalog-map-pin { display:grid;place-items:center;background:#075562;color:#fff;border:2px solid white;border-radius:50%;font:700 15px Arial,sans-serif;box-shadow:0 2px 6px #0005; }
    .pcc-catalog-map-pin.is-approximate { border-style:dashed;background:#644b19; }
    .pcc-catalog-map-popup { padding:0;list-style:none;max-height:240px;overflow:auto;overflow-wrap:anywhere; }
    .pcc-catalog-map-popup li { padding:8px 0;border-bottom:1px solid #cbdedf; }
    .pcc-catalog-map-popup a { display:block;padding:4px 0; }
    .pcc-catalog-map-popup small { display:block; }
    .pcc-catalog-map-missing { margin:12px 0;overflow-wrap:anywhere; }
    .pcc-catalog-map-missing summary { cursor:pointer;min-height:44px; }
    .pcc-catalog-map-missing a { display:inline-block;padding:8px 0; }
    .pcc-catalog-map-mounted .map-highlight { outline:3px solid #ae8c42; }
    @media(max-width:900px) {
      .pcc-catalog-map-mounted.catalog-map-open .catalog-results { display:flex;flex-direction:column;gap:16px; }
      .pcc-catalog-map-mounted.catalog-map-open [data-catalog-map] { order:0;min-width:0; }
      .pcc-catalog-map-mounted.catalog-map-open [data-catalog-list] { display:block;order:1;min-width:0; }
      .pcc-catalog-map-mounted .catalog-map-canvas { height:400px; }
    }
  `;

  function number(value) {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function safeUrl(value, base, google = false) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value, base);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return "";
      if (google) {
        const host = url.hostname;
        if (url.protocol !== "https:" || !((host === "www.google.com" || host === "google.com") && url.pathname.startsWith("/maps") || host === "maps.google.com" || host === "maps.app.goo.gl" || host === "goo.gl" && url.pathname.startsWith("/maps"))) return "";
      } else if (url.origin !== new URL(base).origin) return "";
      return value;
    } catch { return ""; }
  }

  function prepareItems(input, base = "https://www.puertocancun.center/") {
    if (!Array.isArray(input)) throw new TypeError("Map items must be an array");
    const byId = new Map();
    let invalid = 0;
    for (const raw of input) {
      if (!raw || typeof raw !== "object") { invalid++; continue; }
      if (raw.isPublic === false || raw.is_public === false || raw.status && !["active", "featured"].includes(raw.status)) continue;
      if (!["string", "number"].includes(typeof raw.id) || !String(raw.id).trim()) { invalid++; continue; }
      const id = String(raw.id);
      const flags = [raw.locationPrecision, raw.location_precision, raw.precision];
      const hidden = flags.includes("hidden");
      const declared = flags.find((value) => value !== undefined && value !== null && value !== "");
      const uncertain = flags.some((value) => value && value !== "exact");
      const precision = hidden ? "hidden" : !uncertain && (declared === "exact" && raw.approximate !== true || !declared && raw.approximate === false) ? "exact" : "approximate";
      const item = { id, title: String(raw.title || raw.titleEs || raw.title_es || id), url: safeUrl(raw.url || raw.urlEs || "", base), precision };
      const lat = number(raw.latitude), lng = number(raw.longitude);
      if (hidden) item.reason = "hidden";
      else if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) item.reason = "missing";
      else {
        item.latitude = precision === "exact" ? lat : Math.round(lat * 100) / 100;
        item.longitude = precision === "exact" ? lng : Math.round(lng * 100) / 100;
        item.mapsUrl = precision === "exact" ? safeUrl(raw.googleMapsUrl || "", base, true) : "";
        item.mapsUrl ||= `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
      }
      const old = byId.get(id);
      if (!old) byId.set(id, item);
      else if (old.precision === "hidden" || hidden || old.latitude !== item.latitude || old.longitude !== item.longitude || old.precision !== item.precision) {
        // Conflicting duplicate IDs never choose the more precise/exposing position.
        byId.set(id, { id, title: old.title, url: old.url, precision: "hidden", reason: "unavailable" });
      }
    }
    const records = [...byId.values()];
    return { items: records.filter((item) => !item.reason), missing: records.filter((item) => item.reason), total: records.length, invalid };
  }

  function clusterItems(items, project, cellSize = 50) {
    if (!(cellSize > 0) || !Number.isFinite(cellSize)) throw new RangeError("Invalid cell size");
    const groups = new Map();
    const seen = new Set();
    for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id))) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const point = project([item.latitude, item.longitude]);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new RangeError("Invalid projected point");
      const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    return [...groups.values()];
  }

  function serializeBounds(value) {
    const parts = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : value && [value.getWest(), value.getSouth(), value.getEast(), value.getNorth()];
    if (!parts || parts.length !== 4) return "";
    let [west, south, east, north] = parts.map(number);
    if ([west, south, east, north].includes(null) || east <= west || north <= south || south < -90 || north > 90) return "";
    const width = east - west;
    if (width >= 360) { west = -180; east = 180; }
    else {
      if (west < -180 || west >= 180) {
        west = ((west + 180) % 360 + 360) % 360 - 180;
        east = west + width;
      }
      // The four-number contract has no antimeridian OR. Never broaden silently.
      if (east > 180) return "";
    }
    const outward = (coordinate, down) => {
      const scaled = coordinate * 1e6, nearest = Math.round(scaled);
      return (Math.abs(scaled - nearest) < 1e-7 ? nearest : down ? Math.floor(scaled) : Math.ceil(scaled)) / 1e6;
    };
    return [outward(west, true), outward(south, true), outward(east, false), outward(north, false)].join(",");
  }

  function loadLeaflet(doc) {
    if (loaders.has(doc)) return loaders.get(doc);
    const win = doc.defaultView;
    const asset = (kind) => new Promise((resolve, reject) => {
      const css = kind === "css", id = css ? "leafletStyles" : "leafletScript";
      let element = doc.getElementById(id);
      if (!css && win.L) { resolve(); return; }
      if (css && element?.sheet) { resolve(); return; }
      const owned = !element;
      if (!element) {
        element = doc.createElement(css ? "link" : "script");
        element.id = id;
        if (css) { element.rel = "stylesheet"; element.href = ASSETS.css; }
        else { element.src = ASSETS.js; element.async = true; }
        element.integrity = css ? ASSETS.cssHash : ASSETS.jsHash;
        element.crossOrigin = "anonymous";
      }
      const cleanup = () => { win.clearTimeout(timer); element.removeEventListener("load", success); element.removeEventListener("error", failure); };
      const success = () => { cleanup(); resolve(); };
      const failure = () => { cleanup(); if (owned) element.remove(); reject(new Error("leaflet-unavailable")); };
      const timer = win.setTimeout(failure, 10000);
      element.addEventListener("load", success, { once: true });
      element.addEventListener("error", failure, { once: true });
      if (owned) doc.head.append(element);
    });
    const promise = Promise.all([asset("css"), asset("js")]).then(() => {
      if (!win.L?.map || !win.L?.marker) throw new Error("leaflet-unavailable");
      return win.L;
    }).catch((error) => { loaders.delete(doc); throw error; });
    loaders.set(doc, promise);
    return promise;
  }

  function mount(root) {
    if (!root?.querySelector || !root.ownerDocument) throw new TypeError("A catalog root element is required");
    if (instances.has(root)) { const current = instances.get(root); current.show(); return current; }
    const doc = root.ownerDocument, win = doc.defaultView;
    const english = (root.lang || doc.documentElement.lang || "").startsWith("en");
    const t = (es, en) => english ? en : es;
    const holder = root.querySelector("[data-catalog-map]");
    if (!holder) throw new Error("Missing data-catalog-map holder");
    const form = root.querySelector("form#catalogFilters, form[data-catalog-filters]");
    const created = [], listeners = [], markedCards = new Set();
    let map, markers = [], observer, resize, destroyed = false, failedTiles = false;
    const make = (tag, className, parent) => { const element = doc.createElement(tag); element.className = className; parent.append(element); created.push(element); return element; };
    const listen = (element, event, fn) => { element.addEventListener(event, fn); listeners.push(() => element.removeEventListener(event, fn)); };
    if (!doc.getElementById("pccCatalogMapStyles")) {
      const style = doc.createElement("style"); style.id = "pccCatalogMapStyles"; style.textContent = STYLES; doc.head.append(style);
    }
    const canvas = holder.querySelector(".catalog-map-canvas") || make("div", "catalog-map-canvas", holder);
    const canvasAttributes = Object.fromEntries(["class", "style", "tabindex"].map((name) => [name, canvas.getAttribute(name)]));
    const status = holder.querySelector(".catalog-map-status") || make("p", "catalog-map-status", holder);
    status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); status.setAttribute("aria-atomic", "true");
    canvas.setAttribute("role", "region"); canvas.setAttribute("aria-label", t("Mapa de resultados", "Results map"));
    const toolbar = make("div", "pcc-catalog-map-toolbar", holder);
    holder.insertBefore(toolbar, canvas);
    const search = make("button", "", toolbar); search.type = "button"; search.disabled = true;
    search.setAttribute("data-catalog-search-area", ""); search.textContent = t("Buscar esta \u00e1rea", "Search this area");
    const retry = make("button", "", toolbar); retry.type = "button"; retry.hidden = true; retry.textContent = t("Reintentar mapa", "Retry map");
    const summary = make("p", "pcc-catalog-map-summary", holder);
    const details = make("details", "pcc-catalog-map-missing", holder);
    const missingHeading = make("summary", "", details);
    const missingList = make("ul", "", details);

    function removeMap() {
      map?.remove(); map = null; markers = [];
      for (const [name, value] of Object.entries(canvasAttributes)) {
        if (value === null) canvas.removeAttribute(name);
        else canvas.setAttribute(name, value);
      }
    }

    function clearHighlight() {
      for (const card of markedCards) {
        card.classList.remove("map-highlight");
        if (!card.className) card.removeAttribute("class");
      }
      markedCards.clear();
    }
    function highlight(ids) {
      clearHighlight();
      for (const card of root.querySelectorAll("[data-category-property]")) {
        if (ids.includes(card.getAttribute("data-category-property")) && !card.classList.contains("map-highlight")) { card.classList.add("map-highlight"); markedCards.add(card); }
      }
    }
    function link(item, parent) {
      const element = doc.createElement(item.url ? "a" : "span");
      element.textContent = item.title;
      if (item.url) element.setAttribute("href", item.url);
      parent.append(element);
      return element;
    }
    function updateArea() {
      search.disabled = !map || !form || typeof form.requestSubmit !== "function" || !serializeBounds(map.getBounds());
    }
    function draw(items, L) {
      const activeId = doc.activeElement?.getAttribute("data-catalog-map-id");
      markers.forEach((marker) => marker.remove()); markers = []; clearHighlight();
      for (const group of clusterItems(items, (point) => map.project(point, map.getZoom()))) {
        const ids = group.map((item) => item.id);
        const label = group.length === 1 ? group[0].title : t(`${group.length} resultados en este grupo`, `${group.length} results in this group`);
        const approximate = group.some((item) => item.precision === "approximate");
        const marker = L.marker([group[0].latitude, group[0].longitude], { keyboard: true, title: label, alt: label, autoPanOnFocus: false, icon: L.divIcon({ className: `pcc-catalog-map-pin${approximate ? " is-approximate" : ""}`, html: `<span aria-hidden="true">${group.length}</span>`, iconSize: [44, 44], iconAnchor: [22, 22] }) });
        marker.catalogIds = ids;
        const popup = doc.createElement("ul"); popup.className = "pcc-catalog-map-popup";
        popup.setAttribute("aria-label", label);
        for (const item of group) {
          const row = doc.createElement("li"); popup.append(row);
          const propertyLink = link(item, row); propertyLink.setAttribute("data-catalog-map-id", item.id);
          propertyLink.addEventListener("focus", () => highlight([item.id]));
          propertyLink.addEventListener("mouseenter", () => highlight([item.id]));
          propertyLink.addEventListener("mouseleave", clearHighlight);
          propertyLink.addEventListener("blur", clearHighlight);
          const precision = doc.createElement("small"); precision.textContent = item.precision === "exact" ? t("Ubicacion exacta publicada", "Published exact location") : t("Ubicacion aproximada, no es la direccion exacta", "Approximate location, not the exact address"); row.append(precision);
          const mapsLink = doc.createElement("a"); mapsLink.href = item.mapsUrl; mapsLink.target = "_blank"; mapsLink.rel = "noopener noreferrer"; mapsLink.textContent = t("Abrir en Google Maps", "Open in Google Maps"); row.append(mapsLink);
        }
        marker.bindPopup(popup, { autoPan: false, maxWidth: 280 }).addTo(map);
        const icon = marker.getElement();
        icon?.setAttribute("aria-label", label); icon?.setAttribute("aria-expanded", "false"); icon?.setAttribute("role", "button");
        icon?.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); marker.openPopup(); popup.querySelector("a")?.focus(); }
        });
        popup.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); marker.closePopup(); icon?.focus(); } });
        marker.on("popupopen", () => { icon?.setAttribute("aria-expanded", "true"); });
        marker.on("popupclose", () => { icon?.setAttribute("aria-expanded", "false"); clearHighlight(); });
        markers.push(marker);
        if (activeId && ids.includes(activeId)) { marker.openPopup(); [...popup.querySelectorAll("[data-catalog-map-id]")].find((element) => element.getAttribute("data-catalog-map-id") === activeId)?.focus(); }
      }
    }

    async function start() {
      retry.hidden = true; search.disabled = true; canvas.hidden = false;
      status.textContent = t("Cargando mapa...", "Loading map..."); holder.setAttribute("aria-busy", "true");
      try {
        const source = root.querySelector("[data-catalog-map-items], [data-catalog-map-data]");
        const raw = root.getAttribute("data-catalog-map-items") || source?.getAttribute("data-catalog-map-items") || source?.textContent;
        if (!raw) throw new Error("map-data-missing");
        const payload = JSON.parse(raw);
        const data = prepareItems(Array.isArray(payload) ? payload : payload.items, doc.baseURI);
        const suppliedTotal = number(Array.isArray(payload) ? root.getAttribute("data-catalog-map-total") : payload.total);
        const total = suppliedTotal !== null && Number.isInteger(suppliedTotal) && suppliedTotal >= data.total ? suppliedTotal : data.total;
        const absent = Math.max(data.missing.length, total - data.items.length);
        const approximate = data.items.filter((item) => item.precision === "approximate").length;
        const scope = suppliedTotal !== null ? t("resultados", "results") : t("registros recibidos", "received records");
        summary.textContent = t(`${data.items.length} de ${total} ${scope} en el mapa. ${absent} sin ubicacion publica utilizable. ${approximate} aproximados.`, `${data.items.length} of ${total} ${scope} on the map. ${absent} without a usable public location. ${approximate} approximate.`);
        missingHeading.textContent = t(`${absent} resultados sin ubicacion publica`, `${absent} results without a public location`);
        details.hidden = !absent; missingList.replaceChildren();
        for (const item of data.missing) { const row = doc.createElement("li"); missingList.append(row); link(item, row); }
        const existingBounds = serializeBounds(form?.querySelector('[name="bounds"]')?.value || "");
        if (!data.items.length && !existingBounds) {
          canvas.hidden = true; status.textContent = t("Sin ubicaciones publicas para representar. Los resultados permanecen en la lista.", "No public locations to display. Results remain in the list.");
          return "empty";
        }
        const L = await loadLeaflet(doc);
        if (destroyed || !root.isConnected) return "destroyed";
        map = L.map(canvas, { scrollWheelZoom: false, keyboard: true });
        const tileUrl = root.getAttribute("data-catalog-tile-url") || DEFAULT_TILES;
        const attribution = tileUrl === DEFAULT_TILES ? ATTRIBUTION : root.getAttribute("data-catalog-tile-attribution");
        if (!/^https:\/\//.test(tileUrl) || !attribution) throw new Error("tile-configuration");
        const tiles = L.tileLayer(tileUrl, { maxZoom: 19, attribution });
        tiles.on("tileerror", () => { failedTiles = true; status.textContent = t("No se cargaron algunas imagenes del mapa. Las fichas siguen disponibles en la lista.", "Some map tiles could not load. Listings remain available in the list."); });
        tiles.addTo(map);
        if (existingBounds) {
          const [w, s, e, n] = existingBounds.split(",").map(Number); map.fitBounds([[s, w], [n, e]], { animate: false });
        } else map.fitBounds(data.items.map((item) => [item.latitude, item.longitude]), { padding: [30, 30], maxZoom: 14, animate: false });
        map.on("zoomend", () => draw(data.items, L)); map.on("moveend", updateArea);
        draw(data.items, L); updateArea();
        if (!failedTiles) status.textContent = form ? "" : t("Formulario de filtros no disponible; busqueda por area desactivada.", "Filter form unavailable; area search disabled.");
        if (data.invalid) status.textContent = t("Hay registros de mapa invalidos. La lista no fue modificada.", "Some map records are invalid. The list was not changed.");
        if (win.ResizeObserver) { resize = new win.ResizeObserver(() => map?.invalidateSize({ pan: false })); resize.observe(canvas); }
        return "ready";
      } catch {
        if (destroyed) return "destroyed";
        removeMap(); canvas.hidden = true; retry.hidden = false;
        status.textContent = t("No se pudo cargar el mapa. Las fichas y filtros siguen disponibles en la lista.", "The map could not load. Listings and filters remain available in the list.");
        return "error";
      } finally { holder.removeAttribute("aria-busy"); }
    }

    const controller = {
      ready: null,
      show() {
        if (destroyed) return;
        holder.hidden = false; root.classList.add("catalog-map-open", "pcc-catalog-map-mounted"); map?.invalidateSize({ pan: false });
        root.querySelectorAll("[data-catalog-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.getAttribute("data-catalog-view") === "map")));
      },
      hide() {
        if (destroyed) return;
        holder.hidden = true; root.classList.remove("catalog-map-open"); clearHighlight();
        root.querySelectorAll("[data-catalog-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.getAttribute("data-catalog-view") === "list")));
      },
      destroy() {
        if (destroyed) return;
        destroyed = true; observer?.disconnect(); resize?.disconnect(); listeners.forEach((remove) => remove());
        removeMap(); clearHighlight(); created.forEach((element) => element.remove());
        holder.removeAttribute("aria-busy"); root.classList.remove("catalog-map-open", "pcc-catalog-map-mounted"); holder.hidden = true; instances.delete(root); active.delete(controller);
      },
    };
    listen(search, "click", () => {
      if (!map || !form || typeof form.requestSubmit !== "function") return;
      const bounds = serializeBounds(map.getBounds());
      if (!bounds) { status.textContent = t("El area cruza el antimeridiano o no es valida; elige un area menor.", "The area crosses the antimeridian or is invalid; choose a smaller area."); return; }
      let input = form.querySelector('input[name="bounds"]');
      if (!input) { input = doc.createElement("input"); input.type = "hidden"; input.name = "bounds"; form.append(input); }
      input.value = bounds; input.disabled = false;
      // No local filtering, fetch, replacement, URL synthesis or other form edits.
      form.requestSubmit();
    });
    listen(retry, "click", () => { controller.ready = start(); });
    const reveal = (event) => {
      const card = event.target.closest?.("[data-category-property]");
      if (card && root.contains(card)) markers.find((marker) => marker.catalogIds.includes(card.getAttribute("data-category-property")))?.openPopup();
    };
    listen(root, "focusin", reveal); listen(root, "mouseover", reveal);
    if (win.MutationObserver) {
      observer = new win.MutationObserver(() => { if (!root.isConnected) controller.destroy(); });
      observer.observe(doc.documentElement, { childList: true, subtree: true });
    }
    controller.open = controller.show;
    controller.dispose = controller.destroy;
    instances.set(root, controller); active.add(controller); controller.show(); controller.ready = start();
    return controller;
  }

  function hide(root) { instances.get(root)?.hide(); }
  function dispose(root) {
    if (root) instances.get(root)?.destroy();
    else for (const controller of [...active]) controller.destroy();
  }

  return { mount, open: mount, hide, dispose, prepareItems, clusterItems, serializeBounds };
});
