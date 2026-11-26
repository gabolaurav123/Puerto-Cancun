"use strict";

const inventory = require("./inventory-contract");
const { inquiryPolicy } = require("./presale-policy");
const clean = value => typeof value === "string" ? value.trim().slice(0, 240) : "";
const fail = (lang, es, en) => { throw Object.assign(new Error(lang === "en" ? en : es), { status: 400 }); };

// Resolve identities from published inventory, never trust a title/operation supplied by a link.
function resolveInquiryContext(body = {}, properties = [], { validateIntent = false, directory } = {}) {
  const lang = body.lang === "en" ? "en" : "es";
  const records = properties.filter(inventory.isPublic);
  const isDevelopment = row => inventory.entityOf(row) === "developments";
  const byReference = value => records.find(row => [row.id, row.developmentData?.id].filter(Boolean).includes(clean(value).replace(/^presale-/, "")));
  let listing = clean(body.propertyId) ? records.find(row => row.id === clean(body.propertyId)) : null;
  if (body.propertyId && !listing) fail(lang, "La publicación ya no está disponible. Consulta al equipo desde Contacto.", "This listing is no longer available. Please contact our team.");
  let development = clean(body.developmentId) ? records.find(row => isDevelopment(row) && [row.id, row.developmentData?.id].includes(clean(body.developmentId))) : null;
  if (body.developmentId && !development) fail(lang, "El desarrollo ya no está publicado. Revisa la selección.", "This development is no longer published. Please check your selection.");
  if (listing && isDevelopment(listing)) { development = listing; listing = null; }
  if (!listing && !development && body.reference) {
    const referenced = byReference(body.reference);
    if (referenced) { if (isDevelopment(referenced)) development = referenced; else listing = referenced; }
  }
  if (!listing && !development && (body.project || body.development)) {
    const title = inventory.fold(body.project || body.development);
    const matches = records.filter(row => isDevelopment(row) && [row.titleEs, row.titleEn].some(name => inventory.fold(name) === title));
    if (matches.length === 1) development = matches[0];
  }
  if (listing) {
    const linked = records.find(row => isDevelopment(row) && [listing.portalDevelopmentId, listing.developmentId, listing.parentDevelopment?.propertyId, listing.parentDevelopment?.id].some(id => id && [row.id, row.developmentData?.id].includes(id)));
    if (development && linked?.id !== development.id) fail(lang, "La unidad no pertenece al desarrollo indicado.", "This listing is not linked to the selected development.");
    development = linked || null;
  }
  const entity = listing || development;
  const policy = entity ? inquiryPolicy(entity, { records, directory }) : null;
  const searchPresale = body.service === "search-watch" && /"modality"\s*:\s*"presale"/.test(typeof body.searchFilters === "string" ? body.searchFilters : JSON.stringify(body.searchFilters || {}));
  const allowedIntents = policy?.allowedIntents || (searchPresale || /presale|preventa/.test(body.origin || "") ? ["buy"] : ["buy", "rent", "sell", "let"]);
  if (validateIntent && !allowedIntents.includes(body.intent)) fail(lang, "La operación elegida no corresponde a esta publicación. Abre de nuevo su formulario.", "That request does not match this listing. Please reopen its inquiry form.");
  const title = row => lang === "en" ? row.titleEn || row.titleEs : row.titleEs || row.titleEn;
  const context = { allowedIntents, fixedIntent: allowedIntents.length === 1 ? allowedIntents[0] : "", entity: listing ? "property" : development ? "development" : "general" };
  if (entity) Object.assign(context, {
    propertyId: listing?.id || "", propertyTitle: listing ? title(listing) : "", mls: entity.mls || "",
    listingPath: require("./public-sharing").sharePath(entity, lang),
    developmentId: development?.id || "", development: development ? title(development) : "",
    project: policy?.isPresale ? title(development || listing) : "",
    reference: entity.id, zone: entity.zone || "", subzone: entity.subzone || entity.neighborhood || entity.municipality || entity.city || "",
    propertyType: listing?.type || "",
    intent: allowedIntents.includes(body.intent) ? body.intent : allowedIntents.length === 1 ? allowedIntents[0] : "",
    rentPeriod: ["day", "month", "year"].includes(listing?.catalogData?.rentPeriod) ? listing.catalogData.rentPeriod : "",
  });
  if (body.projectId && directory) {
    const project = require("./catalog-directory").projectRecords(directory, records).find(p => p.id === body.projectId);
    if (project && (!entity || [project.linkedDevelopment?.id, project.linkedProperty?.id].includes(entity.id))) {
      Object.assign(context, { entity: listing ? "property" : "development", projectId: project.id, project: title(project),
        mls: project.mls, listingPath: require("./public-sharing").sharePath(project, lang), allowedIntents: ["buy"], fixedIntent: "buy", intent: "buy" });
    }
  }
  return context;
}

module.exports = { resolveInquiryContext };
