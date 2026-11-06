const inventory = require("./inventory-contract");

const escape = input => String(input ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const defaults = {
  "zona-hotelera": ["Zona Hotelera", "Hotel Zone"], "puerto-cancun": ["Puerto Cancún", "Puerto Cancun"],
  "cancun-city": ["Ciudad de Cancún", "Cancun City"], "fuera-de-cancun": ["Fuera de Cancún", "Outside Cancun"],
};

function areasFor(page) {
  return page.catalogAreas || page.portalDirectory?.areas || inventory.LOCATIONS;
}

function areaName(area, lang) {
  if (!area) return "";
  return (lang === "en" ? area.nameEn : area.nameEs) || defaults[area.id]?.[lang === "en" ? 1 : 0] || area.nameEs || area.name || area.id;
}

function areaFor(property, areas) {
  const id = inventory.resolveLocation(property, areas).id;
  return areas.find(area => area.id === id);
}

function subareaName(property, area, lang) {
  const id = property.portalSubareaId || property.catalogData?.subareaId;
  const entry = area?.subareas?.find(item => item.id === id);
  if (entry) return (lang === "en" ? entry.nameEn : entry.nameEs) || entry.nameEs;
  if (Object.hasOwn(property, "portalSubareaId")) return "";
  const knownNames = [area?.id, areaName(area, "es"), areaName(area, "en")].map(inventory.fold);
  return property.zone && !knownNames.includes(inventory.fold(property.zone)) ? property.zone : "";
}

function contactLink(lang, label, context, className = "primary-button") {
  const params = new URLSearchParams();
  const attrs = [];
  for (const [key, value] of Object.entries(context)) {
    if (value === "" || value == null) continue;
    params.set(key, String(value));
    attrs.push(`data-${key.replace(/[A-Z]/g, char => "-" + char.toLowerCase())}="${escape(value)}"`);
  }
  const path = lang === "en" ? "/en/contact" : "/contacto";
  return `<a class="${className}" href="${path}?${escape(params)}" data-contact-inquiry ${attrs.join(" ")}>${escape(label)}</a>`;
}

function presalePath(lang) {
  return lang === "en" ? "/en/cancun-presales" : "/preventas-cancun";
}

function projectRecords(directory, properties, lang) {
  const byId = new Map(properties.filter(inventory.isPublic).map(property => [property.id, property]));
  return (directory?.presales || []).filter(project => !project.status || project.status === "confirmed").map(project => {
    const development = byId.get(project.developmentId);
    const areaId = project.areaId || "";
    const sameArea = development && areaFor(development, directory.areas)?.id === areaId;
    // Only a publicly located, explicitly linked development can locate its project.
    const position = sameArea && development.locationPrecision !== "hidden" && !development.portalHiddenBlocks?.includes("location") ? development : null;
    const pathFor = locale => presalePath(locale) + "?" + new URLSearchParams({ project: project.id });
    return {
      id: project.id, status: "active", isPublic: true, publicationSection: "developments", type: "Desarrollo",
      titleEs: project.nameEs, titleEn: project.nameEn || project.nameEs, descriptionEs: project.descriptionEs, descriptionEn: project.descriptionEn,
      portalAreaId: areaId, portalSubareaId: project.subareaId || "", portalGated: development?.portalGated,
      catalogData: { locationId: areaId }, images: project.image ? [project.image] : [], presaleProject: project,
      urlEs: pathFor("es"), urlEn: pathFor("en"), locationPrecision: position?.locationPrecision || "hidden",
      latitude: position?.latitude ?? null, longitude: position?.longitude ?? null,
      publicUnits: (project.propertyIds || []).map(id => byId.get(id)).filter(row => row && inventory.entityOf(row) === "properties"),
      linkedDevelopment: development,
    };
  });
}

function projectDetail(row, areas, lang, sourcePath) {
  const en = lang === "en", project = row.presaleProject;
  const title = en ? row.titleEn : row.titleEs, description = en ? row.descriptionEn : row.descriptionEs;
  const area = areaFor(row, areas), zone = areaName(area, lang), subzone = subareaName(row, area, lang);
  const linked = row.linkedDevelopment;
  const link = property => {
    const url = en ? property.urlEn : property.urlEs;
    return url && url.startsWith("/") && !url.startsWith("//") ? `<a href="${escape(url)}">${escape((en ? property.titleEn : property.titleEs) || property.titleEs)}</a>` : "";
  };
  const unitLinks = row.publicUnits.map(link).filter(Boolean);
  const context = { intent: "buy", zone, subzone, development: linked && ((en ? linked.titleEn : linked.titleEs) || linked.titleEs), project: title, reference: project.reference || project.id, origin: "presale-project", sourcePath };
  return `<article class="catalog-project-detail"><a class="text-link" href="${presalePath(lang)}">${en ? "All presales" : "Todas las preventas"}</a><h2>${escape(title)}</h2>
    <p>${escape([zone, subzone, project.reference].filter(Boolean).join(" · "))}</p>
    ${row.images[0] ? `<img src="${escape(row.images[0])}" loading="lazy" decoding="async" alt="${escape(title)}" />` : ""}
    ${description ? `<p>${escape(description)}</p>` : ""}
    ${linked && link(linked) ? `<p>${en ? "Development" : "Desarrollo"}: ${link(linked)}</p>` : ""}
    ${unitLinks.length ? `<h3>${en ? "Published listings" : "Propiedades publicadas"}</h3><ul>${unitLinks.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}
    ${contactLink(lang, en ? "Ask about this project" : "Pedir información de este proyecto", context)}</article>`;
}

module.exports = { escape, areasFor, areaName, areaFor, subareaName, contactLink, presalePath, projectRecords, projectDetail };
