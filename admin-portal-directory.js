(function initPortalAdmin(root) {
  "use strict";
  const api = root.PccPortalDirectory;
  if (!api) return;
  const instances = new WeakMap();
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const headings = {"portal-areas":["Zonas y subzonas","Areas and subareas"],"portal-featured":["Destacados","Featured placements"],"portal-presales":["Preventas","Presales"]};
  const collectionTitles = {areas:"Zonas",subareas:"Subzonas",presales:"Proyectos",featured:"Ubicaciones de destacados"};
  const kinds = {area:"Zona",development:"Desarrollo",property:"Propiedad o terreno",presale:"Preventa"};
  const placements = {home:"Portada",area:"Página de zona",development:"Ficha de desarrollo"};
  const statusText = {draft:"Borrador privado",confirmed:"Preventa confirmada",inactive:"Inactiva"};
  const blockText = {description:"Descripción",amenities:"Amenidades",location:"Ubicación y mapa",gallery:"Galería",units:"Propiedades vinculadas",video:"Video"};
  const english = {
    "Actualizar":"Refresh","Nueva zona":"New area","Nueva subzona":"New subarea","Ubicación y bloques de fichas":"Listing areas and sections",
    "Nuevo proyecto":"New project","Añadir destacado":"Add featured placement","Zonas":"Areas","Subzonas":"Subareas","Proyectos":"Projects",
    "Ubicaciones de destacados":"Featured placements","Editar":"Edit","Subir":"Move up","Bajar":"Move down","Retirar":"Remove placement","Vista previa":"Preview",
    "Zona":"Area","Subzona":"Subarea","Desarrollo":"Development","Propiedad o terreno":"Property or land","Preventa":"Presale","Portada":"Home",
    "Página de zona":"Area page","Ficha de desarrollo":"Development page","Borrador privado":"Private draft","Preventa confirmada":"Confirmed presale","Inactiva":"Inactive","Activa":"Active","Oculto":"Hidden",
    "Editar registro":"Edit record","Nuevo registro":"New record","Guardar cambios":"Save changes","Cancelar":"Cancel","Qué destacar":"What to feature",
    "Registro":"Record","Seleccionar registro":"Select a record","Dónde se muestra":"Placement","Página de destino":"Destination page","Mostrar en esa ubicación":"Show in this placement",
    "Sin asignar":"Unassigned","Seleccionar página":"Select a page","Ficha del inventario":"Inventory listing","Seleccionar ficha":"Select a listing","Acceso controlado del desarrollo":"Gated access",
    "Sin verificar":"Unverified","Sí, verificado":"Yes, verified","No, verificado":"No, verified","Fuente del acceso controlado (privada)":"Gated access source (private)",
    "Ocultar bloques públicos":"Hide public sections","Descripción":"Description","Amenidades":"Amenities","Ubicación y mapa":"Location and map","Galería":"Gallery","Propiedades vinculadas":"Linked properties",
    "Editar contenido, fotos y mapa en el inventario":"Edit content, photos and map in inventory","Nombre en español":"Spanish name","Nombre en inglés":"English name",
    "Descripción en español":"Spanish description","Descripción en inglés":"English description","URL de la imagen":"Image URL","O elegir una portada del inventario público":"Or select a public listing cover",
    "Elegir imagen":"Select an image","Zona superior":"Parent area","Referencia del proyecto":"Project reference","Desarrollo del inventario (opcional)":"Inventory development (optional)",
    "Desarrollo de la propiedad":"Property development","Usar vínculo del inventario o coincidencia verificada":"Use inventory link or verified match","Sin desarrollo":"No development",
    "Unidades vinculadas a la preventa":"Units linked to this presale","Selecciona únicamente unidades confirmadas para el proyecto.":"Select only units confirmed for this project.",
    "Estado comercial del proyecto":"Project status","Fuente de verificación (privada)":"Verification source (private)","Mostrar en el directorio público":"Show in the public directory",
    "Destacar en la portada":"Feature on the home page","Todavía no hay registros en esta sección.":"There are no records in this section yet.",
    "Vista previa privada":"Private preview","Sin descripción confirmada.":"No confirmed description.","Cerrar":"Close","Revisar ficha":"Review listing",
    "Cambios guardados en el directorio.":"Directory changes saved.","Ya está en el extremo de este grupo.":"Already at the end of this group.",
    "Guarda o cancela el formulario antes de modificar el orden.":"Save or cancel the form before changing the order.",
    "¿Descartar los cambios sin guardar de este formulario?":"Discard unsaved changes in this form?","¿Descartar los cambios sin guardar?":"Discard unsaved changes?",
    "¿Descartar los cambios del formulario y cargar la versión guardada?":"Discard unsaved changes and reload the saved version?",
    "¿Retirar de esta ubicación? La ficha seguirá publicada.":"Remove this placement? The listing will stay published.",
    "No se pudo cargar el directorio. Pulsa Actualizar para reintentar.":"The directory could not be loaded. Select Refresh to try again.",
  };
  const tr = value => document.documentElement.lang === "en" ? english[value] || value : value;
  function translateControls(target) {
    if (document.documentElement.lang !== "en") return;
    const walker = document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) if (!node.parentElement.closest("textarea,[data-portal-literal]") && Object.hasOwn(english,node.textContent.trim())) node.textContent = tr(node.textContent.trim());
  }
  const isDev = record => root.PccInventory.entityOf(record) === "developments";
  const option = (value, label, selected) => `<option value="${esc(value)}"${selected ? " selected" : ""}>${esc(label)}</option>`;
  const btn = (command, label, attrs = "") => `<button type="button" class="ghost-button" data-portal-command="${command}" ${attrs}>${esc(label)}</button>`;
  const field = (label,name,value,required = false) => `<label><span>${esc(label)}</span><input name="${name}" value="${esc(value)}" ${required ? "required" : ""}></label>`;
  const displayName = item => (document.documentElement.lang === "en" ? item?.nameEn || item?.titleEn : "") || item?.nameEs || item?.titleEs;
  const areaLabels = (items, current, none = "Sin asignar") => option("",tr(none),!current) + items.map(x => option(x.id,displayName(x),x.id === current)).join("");
  const select = (label,name,options) => `<label><span>${esc(label)}</span><select name="${name}">${options}</select></label>`;
  const check = (name,value,label,checked) => `<label class="portal-check"><input type="checkbox" name="${name}" value="${esc(value)}" ${checked ? "checked" : ""}><span>${esc(label)}</span></label>`;
  const textarea = (label,name,value) => `<label><span>${esc(label)}</span><textarea name="${name}" rows="3">${esc(value)}</textarea></label>`;
  const identifier = name => (String(name).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || "registro") + "-" + crypto.randomUUID().slice(0,8);
  function notify(v,message) { v.host.querySelector("[data-portal-message]").textContent = tr(message); }
  function records(v,kind) { return v.data.records.filter(r => kind === "development" ? isDev(r) : !isDev(r) && root.PccInventory.entityOf(r) === "properties"); }
  function choices(v,kind) {
    if (kind === "area") return v.data.config.areas;
    if (kind === "presale") return v.data.config.presales;
    return records(v,kind);
  }
  function title(v,kind,id) {
    const item = choices(v,kind).find(r => r.id === id);
    return displayName(item) || id;
  }
  function redraw(v) {
    const {host,section,data,ctx} = v;
    const h = headings[section][ctx.lang === "en" ? 1 : 0];
    const actions = section === "portal-areas" ? btn("new-area","Nueva zona")+btn("new-sub","Nueva subzona")+btn("assign","Ubicación y bloques de fichas")
      : section === "portal-presales" ? btn("new-presale","Nuevo proyecto") : btn("new-feature","Añadir destacado");
    host.innerHTML = `<div class="admin-module-heading"><h2>${esc(h)}</h></div><div class="portal-actions">${ctx.editable ? actions : ""}${btn("reload","Actualizar")}</div><p data-portal-message role="status"></p><div data-portal-editor></div><div data-portal-list></div>`;
    if (!data?.config) { notify(v,"No se pudo cargar el directorio. Pulsa Actualizar para reintentar."); return; }
    host.querySelector("[data-portal-list]").innerHTML = (section === "portal-areas" ? ["areas","subareas"] : section === "portal-presales" ? ["presales"] : ["featured"]).map(key => listHtml(v,key)).join("");
    if (section === "portal-presales" && ctx.editable) {
      const linked = new Set(data.config.presales.flatMap(p => p.propertyIds));
      const candidates = records(v,"property").filter(r => !linked.has(r.id) && root.PccInventory.modalityOf(r) === "presale");
      if (candidates.length) host.querySelector("[data-portal-list]").insertAdjacentHTML("beforeend",`<details><summary>${ctx.lang === "en" ? "Presale units awaiting project review" : "Unidades en preventa pendientes de revisar"} (${candidates.length})</summary><ul class="portal-rows">${candidates.map(r => `<li><strong data-portal-literal>${esc(displayName(r))}</strong>${btn("native","Revisar ficha",`data-id="${esc(r.id)}"`)}</li>`).join("")}</ul></details>`);
    }
    translateControls(host);
    v.dirty = false;
  }
  function listHtml(v,key) {
    const items = v.data.config[key];
    const row = x => {
      const attrs = `data-key="${key}" data-id="${esc(x.id)}"`;
      const titleText = key === "featured" ? `${tr(kinds[x.kind])} · ${title(v,x.kind,x.targetId)}` : displayName(x);
      const secondary = key === "featured" ? tr(placements[x.placement]) + (x.contextId ? ` · ${title(v,x.placement,x.contextId)}` : "") + (x.active ? "" : " · "+tr("Oculto"))
        : key === "presales" ? `${tr(statusText[x.status])} · ${x.reference}`
        : `${x.areaId ? title(v,"area",x.areaId)+" · " : ""}${tr(x.active ? "Activa" : "Inactiva")}`;
      const move = key === "featured" || key === "areas" || key === "subareas";
      return `<li><div><strong>${esc(titleText)}</strong><small>${esc(secondary)}</small></div><div class="portal-actions">${v.ctx.editable ? btn("edit","Editar",attrs)+(move ? btn("up","Subir",attrs)+btn("down","Bajar",attrs) : "") : ""}${key === "presales" ? btn("preview","Vista previa",attrs) : ""}${key === "featured" && v.ctx.editable ? btn("remove","Retirar",attrs) : ""}</div></li>`;
    };
    return `<section><h3>${collectionTitles[key]}</h3>${items.length ? `<ul class="portal-rows">${items.map(row).join("")}</ul>` : "<p>Todavía no hay registros en esta sección.</p>"}</section>`;
  }
  function form(v,key,item,contents) {
    if (v.dirty && !root.confirm(tr("¿Descartar los cambios sin guardar de este formulario?"))) return;
    v.dirty = false;
    const target = v.host.querySelector("[data-portal-editor]");
    target.innerHTML = `<form class="portal-edit" data-key="${key}" data-id="${esc(item.id || "")}"><h3>${esc(item.nameEs || (item.id ? "Editar registro" : "Nuevo registro"))}</h3>${contents}<div class="portal-actions"><button class="primary-button" type="submit">Guardar cambios</button>${btn("cancel","Cancelar")}</div></form>`;
    const form = target.querySelector("form");
    hydrate(v,form);
    translateControls(target);
    form.querySelector("input:not([type=checkbox]), select, textarea")?.focus();
  }
  function geoFields(v,item) {
    return select("Zona","areaId",areaLabels(v.data.config.areas,item.areaId)) + select("Subzona","subareaId",areaLabels(v.data.config.subareas.filter(s => s.areaId === item.areaId),item.subareaId));
  }
  function edit(v,key,item = {}) {
    if (key === "featured") {
      form(v,key,item,select("Qué destacar","kind",api.KINDS.map(k => option(k,kinds[k],k === item.kind)).join(""))+
        select("Registro","targetId",areaLabels(choices(v,item.kind || "area"),item.targetId,"Seleccionar registro"))+
        select("Dónde se muestra","placement",Object.keys(placements).map(k => option(k,placements[k],k === item.placement)).join(""))+
        select("Página de destino","contextId",areaLabels(item.placement && item.placement !== "home" ? choices(v,item.placement) : [],item.contextId))+
        check("active","yes","Mostrar en esa ubicación",item.active !== false)); return;
    }
    if (key === "assignments") {
      form(v,key,item,select("Ficha del inventario","recordId",areaLabels(v.data.records.filter(r => root.PccInventory.entityOf(r) !== "typologies"),item.id,"Seleccionar ficha"))+
        select("Desarrollo de la propiedad","parentOverride",option("__auto","Usar vínculo del inventario o coincidencia verificada",true)+option("__none","Sin desarrollo")+records(v,"development").map(r=>option(r.id,displayName(r),false)).join(""))+
        '<p data-assignment-info></p>'+geoFields(v,item)+select("Acceso controlado del desarrollo","gated",option("","Sin verificar",true)+option("yes","Sí, verificado")+option("no","No, verificado"))+field("Fuente del acceso controlado (privada)","gatedEvidence","")+
        `<fieldset><legend>Ocultar bloques públicos</legend>${api.BLOCKS.map(b => check("hiddenBlocks",b,blockText[b],false)).join("")}</fieldset>`+btn("native","Editar contenido, fotos y mapa en el inventario")); return;
    }
    let contents = `<div class="portal-fields">${field("Nombre en español","nameEs",item.nameEs,true)}${field("Nombre en inglés","nameEn",item.nameEn,true)}</div>`+
      textarea("Descripción en español","descriptionEs",item.descriptionEs)+textarea("Descripción en inglés","descriptionEn",item.descriptionEn)+field("URL de la imagen","image",item.image)
      +select("O elegir una portada del inventario público","cover",areaLabels(v.data.records.filter(r => r.image && root.PccInventory.isPublic(r)),"","Elegir imagen"));
    if (key === "subareas") contents += select("Zona superior","areaId",areaLabels(v.data.config.areas,item.areaId));
    if (key === "presales") {
      contents += field("Referencia del proyecto","reference",item.reference,true) + select("Desarrollo del inventario (opcional)","developmentId",areaLabels(records(v,"development"),item.developmentId)) +
        geoFields(v,item) + `<label><span>Unidades vinculadas a la preventa</span><select multiple size="5" name="propertyIds">${records(v,"property").map(r => option(r.id,r.titleEs,item.propertyIds?.includes(r.id))).join("")}</select><small>Selecciona únicamente unidades confirmadas para el proyecto.</small></label>`+
        select("Estado comercial del proyecto","status",Object.entries(statusText).map(([id,label]) => option(id,label,id === (item.status || "draft"))).join(""))+textarea("Fuente de verificación (privada)","evidence",item.evidence);
    } else {
      contents += check("active","yes","Mostrar en el directorio público",item.active !== false);
      if (key === "areas") contents += check("homeFeatured","yes","Destacar en la portada",v.data.config.featured.some(f => f.active && f.kind === "area" && f.targetId === item.id && f.placement === "home"));
    }
    form(v,key,item,contents);
  }
  function hydrate(v,form,changed) {
    const e = form.elements, cfg = v.data.config, value = name => e.namedItem(name)?.value || "";
    if (changed === "cover" && value("cover")) e.image.value = v.data.records.find(r => r.id === value("cover"))?.image || "";
    if (form.dataset.key === "featured") {
      const placement = value("placement");
      if (changed === "kind") e.targetId.innerHTML = areaLabels(choices(v,value("kind")),"","Seleccionar registro");
      e.contextId.closest("label").hidden = placement === "home";
      if (changed === "placement") e.contextId.innerHTML = areaLabels(placement === "home" ? [] : choices(v,placement),"","Seleccionar página");
      return;
    }
    if (form.dataset.key === "assignments" && (!changed || changed === "recordId")) {
      const id = value("recordId"), a = v.data.effective[id] || {}, saved = cfg.assignments[id] || {}, record = v.data.records.find(r => r.id === id);
      e.areaId.value = saved.areaId || ""; e.gated.value = saved.gated == null ? "" : saved.gated ? "yes" : "no";
      e.parentOverride.disabled = !record || isDev(record);
      e.parentOverride.value = Object.hasOwn(saved,"developmentId") ? saved.developmentId || "__none" : "__auto";
      e.gated.disabled = !record || !isDev(record);
      e.gatedEvidence.value = saved.gatedEvidence || "";
      form.querySelectorAll("[name=hiddenBlocks]").forEach(cb => { cb.checked = saved.hiddenBlocks?.includes(cb.value) || false; });
      form.querySelector("[data-assignment-info]").textContent = record ? `${record.titleEs} · ${record.zone || "Ubicación física sin clasificar"}. ${a.developmentId ? "Hereda la zona de "+title(v,"development",a.developmentId)+"." : "Sin asignación manual se usa la ubicación del inventario."} Zona actual: ${title(v,"area",a.areaId) || "Por revisar"}.` : "Selecciona una propiedad, un terreno o un desarrollo.";
      e.subareaId.innerHTML = areaLabels(cfg.subareas.filter(s => s.areaId === e.areaId.value),saved.subareaId);
    }
    if (form.dataset.key === "assignments") {
      if (!changed || changed === "recordId" || changed === "parentOverride") {
        const id=value("recordId"), saved=cfg.assignments[id] || {};
        const manual = {...saved}; delete manual.developmentId;
        const automatic = api.adminAssignments({...cfg,assignments:{...cfg.assignments,[id]:manual}},v.data.records)[id];
        const parent = e.parentOverride.disabled || e.parentOverride.value === "__none" ? "" : e.parentOverride.value === "__auto" ? automatic?.developmentId : e.parentOverride.value;
        e.areaId.disabled=e.subareaId.disabled=Boolean(parent);
        const geo = parent ? v.data.effective[parent] || {} : saved;
        e.areaId.value=geo.areaId || "";
        e.subareaId.innerHTML=areaLabels(cfg.subareas.filter(s=>s.areaId===e.areaId.value),geo.subareaId);
      }
      e.gatedEvidence.closest("label").hidden = e.gated.disabled || !e.gated.value;
      e.gatedEvidence.required = !e.gated.disabled && Boolean(e.gated.value);
    }
    if (changed === "areaId" && e.subareaId) e.subareaId.innerHTML = areaLabels(cfg.subareas.filter(s => s.areaId === value("areaId")),"");
    if (form.dataset.key === "presales") {
      const parent = value("developmentId");
      e.areaId.disabled = e.subareaId.disabled = Boolean(parent);
      if (parent) {
        const geo = v.data.effective[parent] || {};
        e.areaId.value = geo.areaId || "";
        e.subareaId.innerHTML = areaLabels(cfg.subareas.filter(s => s.areaId === geo.areaId),geo.subareaId);
      }
      for (const opt of e.propertyIds.options) {
        const a = v.data.effective[opt.value] || {};
        opt.hidden = opt.disabled = parent ? a.developmentId !== parent : !e.areaId.value || a.areaId !== e.areaId.value;
        if (opt.disabled) opt.selected = false;
      }
    }
  }
  async function persist(v,cfg) {
    if (v.busy) return;
    v.busy = true;
    v.host.setAttribute("aria-busy","true");
    try {
      const result = await v.ctx.save(cfg);
      v.data = result; v.dirty = false; redraw(v); notify(v,"Cambios guardados en el directorio.");
    } finally { v.busy = false; v.host.removeAttribute("aria-busy"); }
  }
  async function submit(v,form) {
    const key = form.dataset.key, id = form.dataset.id;
    const cfg = structuredClone(v.data.config), e = form.elements;
    const value = name => e.namedItem(name)?.value?.trim() || "";
    if (key === "assignments") {
      const record = value("recordId");
      if (!record) throw new Error("Selecciona una ficha.");
      cfg.assignments[record] = {areaId:e.areaId.disabled ? "" : value("areaId"),subareaId:e.subareaId.disabled ? "" : value("subareaId"),
        gated:!e.gated.disabled && value("gated") ? value("gated") === "yes" : null,gatedEvidence:value("gatedEvidence"),hiddenBlocks:[...form.querySelectorAll("[name=hiddenBlocks]:checked")].map(x => x.value)};
      if (!e.parentOverride.disabled && value("parentOverride") !== "__auto") cfg.assignments[record].developmentId = value("parentOverride") === "__none" ? "" : value("parentOverride");
    } else {
      let item;
      if (key === "featured") item = {id:id || identifier("destacado"),kind:value("kind"),targetId:value("targetId"),placement:value("placement"),contextId:value("contextId"),active:e.active.checked};
      else {
        item = {id:id || identifier(value("nameEs")),nameEs:value("nameEs"),nameEn:value("nameEn"),descriptionEs:value("descriptionEs"),descriptionEn:value("descriptionEn"),image:value("image")};
        if (key === "presales") Object.assign(item,{reference:value("reference"),status:value("status"),evidence:value("evidence"),areaId:value("areaId"),subareaId:value("subareaId"),developmentId:value("developmentId"),propertyIds:[...e.propertyIds.selectedOptions].map(o => o.value)});
        else {
          item.active = e.active.checked;
          if (key === "subareas") {
            item.areaId = value("areaId");
            for (const assigned of [...Object.values(cfg.assignments), ...cfg.presales]) if (assigned.subareaId === item.id) assigned.areaId = item.areaId;
          }
        }
        if (key === "areas") {
          const placed = cfg.featured.find(f => f.kind === "area" && f.targetId === item.id && f.placement === "home");
          if (placed) placed.active = e.homeFeatured.checked;
          else if (e.homeFeatured.checked) cfg.featured.push({id:identifier("destacado"),kind:"area",targetId:item.id,placement:"home",contextId:"",active:true});
        }
      }
      const index = cfg[key].findIndex(x => x.id === id);
      if (index === -1) cfg[key].push(item); else cfg[key][index] = item;
    }
    await persist(v,cfg);
  }
  function preview(v,item) {
    const dialog = document.createElement("dialog"); dialog.className = "listing-publish-dialog";
    dialog.innerHTML = `<h2>Vista previa privada</h2><h3>${esc(item.nameEs)}</h3><p>${esc(statusText[item.status])} · ${esc(item.reference)}</p>${item.image ? `<img class="portal-preview-image" alt="" src="${esc(item.image)}">` : ""}<p>${esc(item.descriptionEs || "Sin descripción confirmada.")}</p><p>${esc(item.descriptionEn || "")}</p><p>Fuente: ${esc(item.evidence || "Pendiente")}</p><form method="dialog"><button class="ghost-button">Cerrar</button></form>`;
    v.host.append(dialog); translateControls(dialog); dialog.addEventListener("close",() => dialog.remove(),{once:true}); dialog.showModal();
  }
  async function command(v,button) {
    const {portalCommand:action,key,id} = button.dataset;
    const cfg = v.data?.config;
    if (action === "reload") {
      if (v.dirty && !root.confirm(tr("¿Descartar los cambios del formulario y cargar la versión guardada?"))) return;
      v.data = await v.ctx.reload(); redraw(v); return;
    }
    if (!cfg || v.busy) return;
    if (action === "preview") return preview(v,cfg[key].find(x => x.id === id));
    if (!v.ctx.editable) return;
    if (action === "native") { const selected = id || button.closest("form")?.elements.recordId.value; if (selected) await v.ctx.editRecord(selected); return; }
    if (action === "cancel") { if (!v.dirty || root.confirm(tr("¿Descartar los cambios sin guardar?"))) redraw(v); return; }
    if (action === "edit") return edit(v,key,cfg[key].find(x => x.id === id));
    const commands = {"new-area":"areas","new-sub":"subareas","new-feature":"featured","new-presale":"presales","assign":"assignments"};
    if (commands[action]) return edit(v,commands[action]);
    if (!key || !["remove","up","down"].includes(action)) return;
    if (v.dirty) throw new Error("Guarda o cancela el formulario antes de modificar el orden.");
    const updated = structuredClone(cfg), list = updated[key], index = list.findIndex(row => row.id === id);
    if (index < 0) return;
    if (action === "remove") {
      if (key !== "featured" || !root.confirm(tr("¿Retirar de esta ubicación? La ficha seguirá publicada."))) return;
      list.splice(index,1);
    } else {
      const row = list[index], step = action === "up" ? -1 : 1;
      let next = index+step;
      while (next >= 0 && next < list.length && ((key === "featured" && (list[next].placement !== row.placement || list[next].contextId !== row.contextId)) || (key === "subareas" && list[next].areaId !== row.areaId))) next += step;
      if (!list[next]) { notify(v,"Ya está en el extremo de este grupo."); return; }
      [list[index],list[next]] = [list[next],row];
    }
    await persist(v,updated);
  }
  function mount(section,data,ctx) {
    const host = document.querySelector(`[data-portal-module="${section}"]`);
    if (!host) return;
    let v = instances.get(host);
    if (!v) {
      v = {host,section}; instances.set(host,v);
      host.addEventListener("click",event => {
        const button = event.target.closest("[data-portal-command]");
        if (button) void command(v,button).catch(error => notify(v,error.message));
      });
      host.addEventListener("input",event => { if (event.target.closest(".portal-edit")) v.dirty = true; });
      host.addEventListener("change",event => { const f=event.target.closest(".portal-edit"); if (f) { v.dirty=true; hydrate(v,f,event.target.name); } });
      host.addEventListener("submit",event => {
        const f = event.target.closest(".portal-edit");
        if (!f) return;
        event.preventDefault();
        if (v.ctx.editable && !v.busy) void submit(v,f).catch(error => notify(v,error.message));
      });
    }
    if (v.ctx?.userId === ctx.userId && (v.dirty || (v.ctx?.lang === ctx.lang && v.data === data && data))) { v.ctx = ctx; return; }
    v.ctx=ctx; v.data=data; redraw(v);
  }
  root.PccAdminPortal={mount};
})(window);
