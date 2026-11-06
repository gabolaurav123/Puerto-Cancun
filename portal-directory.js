(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./inventory-contract"));
  else root.PccPortalDirectory = factory(root.PccInventory);
})(typeof globalThis === "undefined" ? this : globalThis, function (inventory) {
  "use strict";
  const BLOCKS = ["description", "amenities", "location", "gallery", "units", "video"];
  const KINDS = ["area", "development", "property", "presale"];
  const fold = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const isDev = record => inventory.entityOf(record) === "developments";
  const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
  function identifier(value, label = "ID") {
    if (typeof value !== "string" || !/^[a-z0-9][a-z0-9._-]{0,179}$/i.test(value) || ["constructor","prototype","__proto__"].includes(value)) invalid(`${label} inválido.`);
    return value;
  }
  function text(value, max, label, required = false) {
    if (value == null) value = "";
    if (typeof value !== "string" || value.length > max || (required && !value.trim())) invalid(`Revisa ${label}.`);
    return value.trim();
  }
  function image(value) {
    const url = text(value, 2048, "la imagen");
    if (!url) return "";
    if (/^\/(?:assets|media)\//.test(url) && !/[\\\s?#]/.test(url.split("?")[0]) && !url.includes("..")) return url;
    try { const parsed = new URL(url); if (parsed.protocol === "https:" && !parsed.username && !parsed.password) return parsed.href; } catch {}
    return invalid("La imagen debe usar HTTPS o una ruta local /assets/ o /media/.");
  }
  function editorial(input) {
    return { id: identifier(input.id), nameEs: text(input.nameEs, 150, "el nombre en español", true), nameEn: text(input.nameEn, 150, "el nombre en inglés", true),
      descriptionEs: text(input.descriptionEs, 4000, "la descripción en español"), descriptionEn: text(input.descriptionEn, 4000, "la descripción en inglés"), image: image(input.image) };
  }
  const initialAreas = [
    ["zona-hotelera", "Zona Hotelera", "Cancún Hotel Zone", "La zona hotelera de Cancún.", "The hotel zone of Cancún."],
    ["puerto-cancun", "Puerto Cancún", "Puerto Cancún", "El distrito residencial y la marina de Puerto Cancún.", "The residential district and marina of Puerto Cancún."],
    ["cancun-city", "Ciudad de Cancún", "Cancún City", "La ciudad y sus corredores urbanos, incluido Huayacán–Colosio.", "The city and its urban corridors, including Huayacán–Colosio."],
    ["fuera-de-cancun", "Fuera de Cancún", "Outside Cancún", "Otros destinos, identificados por su ubicación original.", "Other destinations, identified by their original location."],
  ];
  function initialConfig() {
    return { revision: 0, areas: initialAreas.map(([id,nameEs,nameEn,descriptionEs,descriptionEn,image = ""]) => ({ id,nameEs,nameEn,descriptionEs,descriptionEn,image,active:true })),
      subareas: [
        { id:"huayacan-colosio",areaId:"cancun-city",nameEs:"Corredor Huayacán–Colosio",nameEn:"Huayacán–Colosio corridor" },
        { id:"alfredo-v-bonfil",areaId:"cancun-city",nameEs:"Alfredo V. Bonfil",nameEn:"Alfredo V. Bonfil" },
        { id:"costa-mujeres-punta-sam",areaId:"fuera-de-cancun",nameEs:"Costa Mujeres y Punta Sam",nameEn:"Costa Mujeres and Punta Sam" },
      ].map(item => ({...item, active:true, image:"",descriptionEs:"",descriptionEn:""})), assignments:{}, presales:[], featured:[] };
  }
  function parentOf(record, developments) {
    const id = record.parentDevelopment?.propertyId || record.developmentId || record.parentDevelopment?.id;
    return id ? developments.get(id) || null : null;
  }
  const centralParkId = "prop-d277bf6d-750a-4e2d-9231-c263336c721c";
  function verifiedCentralPark(record) {
    return record?.id === centralParkId && isDev(record) && fold(record.titleEs) === "central park towers cancun" && fold(record.city) === "cancun"
      && /^central park towers cancun, manzana 0?1, lote 8, supermanzana 10, cancun\b/.test(fold(record.address));
  }
  function exactProjectMatch(record, master) {
    return master && !record.portalSuppressInferredLink && !record.developmentId && !record.parentDevelopment
      && record.locationPrecision === "exact" && master.locationPrecision === "exact" && fold(record.city) === "cancun"
      && fold(record.address) === fold(master.address) && Number(record.latitude) === 21.12546 && Number(record.longitude) === -86.830299
      && Number(record.latitude) === Number(master.latitude) && Number(record.longitude) === Number(master.longitude);
  }
  function documentedArea(record) {
    if (fold(record.city) !== "cancun" || fold(record.state) !== "quintana roo") return "";
    const address = fold(record.address), neighborhood = fold(record.neighborhood);
    if (neighborhood === "puerto cancun" && /\bpuerto cancun\b/.test(address) || neighborhood === "zona hotelera" && /\bboulevard puerto cancun\b/.test(address)) return "puerto-cancun";
    if (neighborhood === "zona hotelera" && /\b(?:boulevard|blvd\.?) kukulcan\b/.test(address)) return "zona-hotelera";
    if (neighborhood === "supermanzana 10" && /\b(?:supermanzana 10|sm\s?10)\b/.test(address)) return "cancun-city";
    if (record.id === "prop-c4d92f5e-4ee0-4c2c-9d82-858add7a5d40" && fold(record.titleEs) === "amara" && neighborhood === "supermanzana 84" && /\bsupermanzana 84\b/.test(address)) return "cancun-city";
    return "";
  }
  function buildAssignments(config, records) {
    const areas = new Set(config.areas.filter(x => x.active).map(x => x.id));
    const subareas = new Map(config.subareas.filter(x => x.active && areas.has(x.areaId)).map(x => [x.id, x]));
    const developments = new Map();
    for (const record of records.filter(isDev)) {
      for (const id of [record.id, record.developmentData?.id, `dev-${record.id}`]) if (id) developments.set(id, record);
    }
    const assignments = Object.create(null);
    function own(record) {
      const edit = config.assignments[record.id] || {};
      const physical = fold(record.zone);
      const northern = fold(record.city) === "isla mujeres" && ["costa mujeres","punta sam","punta sam / playa mujeres","playa mujeres"].includes(physical);
      const rawArea = northern && !record.catalogData?.locationId && !record.commercialLocationId ? "fuera-de-cancun" : inventory.resolveLocation(record).id || documentedArea(record);
      const areaId = areas.has(edit.areaId || rawArea) ? (edit.areaId || rawArea) : "";
      let inferred = "";
      if (areaId === "cancun-city" && ["huayacan","avenida huayacan","av. huayacan","av huayacan","corredor colosio","boulevard colosio","blvd. luis donaldo colosio","residencial campestre","cumbres"].includes(physical)) inferred = "huayacan-colosio";
      if (areaId === "cancun-city" && /^alfredo v\.? bonfil$/.test(physical)) inferred = "alfredo-v-bonfil";
      if (areaId === "fuera-de-cancun" && northern) inferred = "costa-mujeres-punta-sam";
      const sub = edit.areaId ? edit.subareaId : inferred;
      return { areaId, subareaId: subareas.get(sub)?.areaId === areaId ? sub : "", developmentId:"", gated: edit.gated ?? null, hiddenBlocks: edit.hiddenBlocks || [] };
    }
    for (const record of records.filter(isDev)) assignments[record.id] = own(record);
    for (const record of records.filter(record => !isDev(record))) {
      const assignment = own(record), manual = config.assignments[record.id];
      const central = developments.get(centralParkId);
      const declaredArea = manual?.areaId || record.catalogData?.locationId || record.commercialLocationId;
      const inferred = verifiedCentralPark(central) && exactProjectMatch(record,central) && (!declaredArea || declaredArea === assignments[central.id].areaId) ? central : null;
      const parent = manual && Object.hasOwn(manual,"developmentId") ? developments.get(manual.developmentId) : parentOf(record, developments) || inferred;
      if (parent) {
        const from = assignments[parent.id];
        assignment.developmentId = parent.id;
        if (from.areaId || config.assignments[parent.id]?.areaId) { assignment.areaId = from.areaId; assignment.subareaId = from.subareaId; }
      }
      assignments[record.id] = assignment;
    }
    return assignments;
  }
  function adminAssignments(config,records) {
    return buildAssignments({...config,areas:config.areas.map(a=>({...a,active:true})),subareas:config.subareas.map(s=>({...s,active:true}))},records);
  }
  function materialize(stored, records = []) {
    const config = stored ? JSON.parse(JSON.stringify(stored)) : initialConfig();
    if (records.some(verifiedCentralPark) && !Object.hasOwn(config.assignments[centralParkId] || {},"gated")) {
      config.assignments[centralParkId] = { areaId:"",subareaId:"",hiddenBlocks:[],...config.assignments[centralParkId], gated:true, gatedEvidence:"https://centralparkcancun.com/ · ficha oficial del desarrollo, sección Acceso Controlado." };
    }
    const assignments = adminAssignments(config,records);
    const isExplicitPresale = r => r.catalogData?.salesModality === "presale" || r.salesModality === "presale" || r.type === "Preventa";
    const existing = new Set(config.presales.filter(p => p.developmentId).map(p => p.developmentId));
    for (const r of records.filter(isDev)) {
      if (!isExplicitPresale(r) || existing.has(r.id)) continue;
      const geography = assignments[r.id];
      config.presales.push({ id:`presale-${r.id}`, nameEs:r.titleEs || r.titleEn, nameEn:r.titleEn || r.titleEs, descriptionEs:"",descriptionEn:"",
        image:r.image || "", reference:r.mls || r.id, developmentId:r.id, areaId:geography.areaId, subareaId:geography.subareaId,
        propertyIds:records.filter(unit => !isDev(unit) && assignments[unit.id].developmentId === r.id && isExplicitPresale(unit)).map(unit => unit.id),
        status:geography.areaId ? "confirmed" : "draft", evidence:r.id === "prop-8008c9bc-02ca-435f-9dcd-b5739cfed032" && fold(r.titleEs) === "al mare puerto cancun"
          ? "Modalidad explícita en inventario. Sitio del proyecto: https://www.almarepuertocancun.com/" : "Modalidad preventa declarada en la ficha del desarrollo." });
    }
    if (!stored && !records.some(r => isDev(r) && /\bal ?mar[e]?\b/.test(fold(r.titleEs || r.titleEn)))) {
      config.presales.push({ id:"almar-preview", nameEs:"Almar", nameEn:"Almar", reference:"ALMAR-REVISION", descriptionEs:"", descriptionEn:"", image:"",
        areaId:"",subareaId:"",developmentId:"", propertyIds:[], status:"draft", evidence:"" });
    }
    // Home is the stored ID for the general Featured page. Inventory marks stay live
    // after a directory edit; an explicit placement (including one hidden by an editor) wins.
    const markOrder = r => r.catalogData?.homeOrder ?? Number.MAX_SAFE_INTEGER;
    const marked = records.filter(r => r.featured && inventory.isPublic(r)).sort((a,b) => markOrder(a) - markOrder(b));
    const unmarked = new Set(records.filter(r => !r.featured).map(r => r.id));
    config.featured = config.featured.filter(slot => slot.placement !== "home" || slot.id !== `home-${slot.targetId}` || !unmarked.has(slot.targetId));
    const existingGlobal = new Set(config.featured.filter(slot => slot.placement === "home").map(slot => slot.kind + "/" + slot.targetId));
    for (const r of marked) {
      const kind = isDev(r) ? "development" : "property";
      if (!existingGlobal.has(kind + "/" + r.id)) config.featured.push({ id:`home-${r.id}`,kind,targetId:r.id,placement:"home",contextId:"",active:true });
    }
    return config;
  }
  function list(value, limit, name) {
    if (!Array.isArray(value) || value.length > limit || value.some(v => !v || typeof v !== "object" || Array.isArray(v))) invalid(`Lista inválida: ${name}.`);
    return value;
  }
  function unique(rows, name) {
    if (new Set(rows.map(x => x.id)).size !== rows.length) invalid(`ID repetido en ${name}.`);
    return rows;
  }
  function validate(input, records, previous) {
    if (!input || typeof input !== "object") invalid("Directorio inválido.");
    const normalizeArea = a => ({...editorial(a),active:a.active !== false});
    const areas = unique(list(input.areas, 500, "zonas").map(normalizeArea), "zonas");
    const areaIds = new Set(areas.map(x => x.id));
    const subareas = unique(list(input.subareas, 1500, "subzonas").map(s => {
      if (!areaIds.has(s.areaId)) invalid("Una subzona necesita una zona existente.");
      return {...normalizeArea(s),areaId:s.areaId};
    }), "subzonas");
    const subMap = new Map(subareas.map(x => [x.id,x.areaId]));
    const byId = new Map(records.map(r => [r.id,r]));
    function geography(item) {
      const areaId = item.areaId || "", subareaId = item.subareaId || "";
      if (areaId && !areaIds.has(areaId) || subareaId && subMap.get(subareaId) !== areaId) invalid("La zona y subzona deben ser compatibles.");
      return {areaId,subareaId};
    }
    if (!input.assignments || typeof input.assignments !== "object" || Array.isArray(input.assignments)) invalid("Asignaciones inválidas.");
    const assignments = Object.create(null);
    for (const [id, a] of Object.entries(input.assignments)) {
      if (!a || !byId.has(identifier(id))) invalid("La ficha asignada no existe.");
      if (a.gated != null && typeof a.gated !== "boolean" || !Array.isArray(a.hiddenBlocks) || a.hiddenBlocks.some(b => !BLOCKS.includes(b))) invalid("Revisa los bloques y el acceso controlado.");
      const gated = isDev(byId.get(id)) ? (a.gated ?? null) : null;
      const gatedEvidence = text(a.gatedEvidence,1000,"la fuente de acceso controlado",gated !== null);
      assignments[id] = {...geography(a), gated, gatedEvidence, hiddenBlocks:[...new Set(a.hiddenBlocks)] };
      if (Object.hasOwn(a,"developmentId")) {
        if (isDev(byId.get(id)) || (a.developmentId && !isDev(byId.get(a.developmentId) || {}))) invalid("El vínculo debe identificar un desarrollo existente o quedar vacío.");
        assignments[id].developmentId = a.developmentId ? identifier(a.developmentId) : "";
      }
    }
    const config = {areas,subareas,assignments};
    // An inactive area can keep its projects and units. Visibility is applied only to the public projection.
    const effective = adminAssignments(config,records);
    const presales = unique(list(input.presales, 1800, "preventas").map(p => {
      const developmentId = p.developmentId || "";
      if (developmentId && (!byId.has(developmentId) || !isDev(byId.get(developmentId)))) invalid("El desarrollo vinculado no existe.");
      const geo = developmentId ? {areaId:effective[developmentId].areaId,subareaId:effective[developmentId].subareaId} : geography(p);
      if (!["confirmed","draft","inactive"].includes(p.status)) invalid("Estado de preventa inválido.");
      const evidence = text(p.evidence, 2000, "la fuente");
      if (p.status === "confirmed" && (!geo.areaId || !evidence)) invalid("Confirma la zona y registra la fuente antes de publicar una preventa.");
      if (!Array.isArray(p.propertyIds) || p.propertyIds.some(id => !byId.has(id) || isDev(byId.get(id)) || (developmentId && effective[id]?.developmentId !== developmentId) || (!developmentId && geo.areaId && effective[id]?.areaId !== geo.areaId))) invalid(`Revisa las unidades de la preventa «${p.nameEs || p.id}». Quita o corrige el vínculo incompatible con su desarrollo o zona antes de guardar.`);
      return {...editorial(p), ...geo, developmentId,propertyIds:[...new Set(p.propertyIds)], status:p.status,evidence,reference:text(p.reference,180,"la referencia",true)};
    }), "preventas");
    const linked = presales.filter(p => p.developmentId).map(p => p.developmentId);
    if (new Set(linked).size !== linked.length) invalid("Ya existe un proyecto de preventa para ese desarrollo.");
    if (new Set(presales.map(p => fold(p.reference))).size !== presales.length) invalid("La referencia de preventa debe ser única.");
    function target(kind, id) {
      if (kind === "area") return areaIds.has(id);
      if (kind === "presale") return presales.some(p => p.id === id);
      return byId.has(id) && isDev(byId.get(id)) === (kind === "development");
    }
    const placed = new Set();
    const featured = unique(list(input.featured, 4000, "destacados").map(f => {
      if (!KINDS.includes(f.kind) || !target(f.kind,f.targetId)) invalid("El destacado debe apuntar a un registro existente.");
      if (!["home","area","development"].includes(f.placement) || (f.placement !== "home" && !target(f.placement,f.contextId))) invalid("El destino del destacado no existe.");
      const item = {id:identifier(f.id),kind:f.kind,targetId:f.targetId,placement:f.placement,contextId:f.placement === "home" ? "" : f.contextId,active:f.active !== false};
      const key = JSON.stringify([item.kind,item.targetId,item.placement,item.contextId]);
      if (placed.has(key)) invalid("Este destacado ya está en esa ubicación.");
      placed.add(key); return item;
    }), "destacados");
    // Removing or moving an inherited mark must survive the next read of the inventory.
    for (const old of previous?.featured || []) {
      if (old.placement !== "home" || !["property","development"].includes(old.kind) || !byId.get(old.targetId)?.featured) continue;
      const globalKey = JSON.stringify([old.kind,old.targetId,"home",""]);
      if (placed.has(globalKey)) continue;
      placed.add(globalKey);
      let id = old.id;
      for (let n = 1; featured.some(slot => slot.id === id); n++) id = `hidden-${n}-${old.targetId}`.slice(0,180);
      featured.push({ ...old, id, active:false });
    }
    for (const [key, rows] of [["areas",areas],["subareas",subareas],["presales",presales]]) {
      const ids = new Set(rows.map(x => x.id));
      if (previous?.[key]?.some(x => !ids.has(x.id))) invalid("Desactiva el registro para retirarlo de la web sin eliminarlo.");
    }
    return {...config,presales,featured};
  }
  function publicDirectory(stored, inputRecords = []) {
    const records = inputRecords.filter(r => inventory.isPublic(r) && inventory.entityOf(r) !== "typologies");
    const config = materialize(stored, records);
    const areas = config.areas.filter(a => a.active).map(a => ({ ...a, subareas:config.subareas.filter(s => s.active && s.areaId === a.id) }));
    const activeAreas = new Set(areas.map(a => a.id));
    const byId = new Map(records.map(r => [r.id,r])), assignments = buildAssignments(config, records);
    const presales = config.presales.filter(p => p.status === "confirmed" && (!p.developmentId || (byId.has(p.developmentId) && isDev(byId.get(p.developmentId))))).map(p => {
      const {evidence, ...publicProject} = p;
      const geography = p.developmentId ? assignments[p.developmentId] : p;
      const units = new Set(p.propertyIds);
      const image = geography.hiddenBlocks?.includes("gallery") ? "" : (p.image || byId.get(p.developmentId)?.image || "");
      return {...publicProject,image,areaId:geography.areaId,subareaId:areas.find(a => a.id === geography.areaId)?.subareas.some(s => s.id === geography.subareaId) ? geography.subareaId : "",
        propertyIds:[...units].filter(id => byId.has(id) && !isDev(byId.get(id)) && assignments[id].areaId === geography.areaId && (!p.developmentId || assignments[id].developmentId === p.developmentId))};
    }).filter(p => activeAreas.has(p.areaId));
    const publicTarget = (kind,id) => kind === "area" ? activeAreas.has(id) : kind === "presale" ? presales.some(p => p.id === id) : byId.has(id) && (kind === "development") === isDev(byId.get(id));
    const featured = config.featured.filter(f => f.active && publicTarget(f.kind,f.targetId) && (f.placement === "home" || publicTarget(f.placement,f.contextId)));
    return {areas,assignments,presales,featured};
  }
  function enrichProperties(records, directory) {
    const masters = new Map(records.filter(isDev).map(record => [record.id, record]));
    return records.map(record => {
      const a = directory.assignments[record.id];
      if (!a) return record;
      const location = a.hiddenBlocks.includes("location") ? {latitude:null,longitude:null,address:"",mapPlace:"",googleMapsUrl:"",locationPrecision:"hidden"} : {};
      let relation = {};
      if (!isDev(record) && (record.parentDevelopment?.propertyId || "") !== a.developmentId) {
        const parent = masters.get(a.developmentId);
        const developmentId = parent ? parent.developmentData?.id || `dev-${parent.id}` : null;
        relation = {developmentId, parentDevelopment:parent ? {id:developmentId,propertyId:parent.id,nameEs:parent.titleEs,nameEn:parent.titleEn} : null, developmentImages:[]};
      }
      return {...record, ...location, ...relation, catalogData:{...record.catalogData, locationId:a.areaId,subareaId:a.subareaId}, portalAreaId:a.areaId,portalSubareaId:a.subareaId,
        portalDevelopmentId:a.developmentId,portalGated:a.gated,portalHiddenBlocks:a.hiddenBlocks};
    });
  }
  function adminInventory(stored,records) {
    const config = materialize(stored,records), assignments = adminAssignments(config,records);
    const areas = config.areas.map(a => ({id:a.id,name:a.nameEs,nameEs:a.nameEs,nameEn:a.nameEn,description:a.descriptionEs,descriptionEn:a.descriptionEn,active:a.active}));
    return {areas, properties:records.map(r => ({...r,portalAreaId:assignments[r.id].areaId,portalSubareaId:assignments[r.id].subareaId,portalDevelopmentId:assignments[r.id].developmentId}))};
  }
  return {BLOCKS,KINDS,initialConfig,materialize,validate,publicDirectory,enrichProperties,buildAssignments,adminAssignments,adminInventory};
});
