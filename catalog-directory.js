const inventory = require("./inventory-contract");
const { safePublicImages, optimizedPublicImage, localizedAmenity } = require("./public-listing-details");

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

function projectDescription(editorial, inherited) {
  return [editorial, inherited].find(value => typeof value === "string" && value.trim() && !inventory.isPlaceholder(value)) || "";
}

function projectRecords(directory, properties) {
  const byId = new Map(properties.filter(inventory.isPublic).map(property => [property.id, property]));
  return (directory?.presales || []).filter(project => (!project.status || project.status === "confirmed") &&
    (!project.developmentId || inventory.entityOf(byId.get(project.developmentId) || {}) === "developments")).map(project => {
    const development = byId.get(project.developmentId);
    const hidden = new Set(development?.portalHiddenBlocks || []);
    const areaId = project.areaId || "";
    const sameArea = development && areaFor(development, directory.areas)?.id === areaId;
    // Only a publicly located, explicitly linked development can locate its project.
    const position = sameArea && development.locationPrecision !== "hidden" && !hidden.has("location") ? development : null;
    const locality = [position?.neighborhood, position?.city, position?.state].filter(Boolean).join(", ");
    const projectLocation = position?.locationPrecision === "exact" && position.address ? position.address : locality;
    const images = hidden.has("gallery") ? [] : safePublicImages({ images: [project.image, ...(development?.images || []), development?.image] })
      .filter(src => !/\/assets\/(?:cancun-hotel-zone-hero-\d+|og-puerto-cancun-center)\.webp(?:[?#]|$)/i.test(src));
    const pathFor = locale => presalePath(locale) + "?" + new URLSearchParams({ project: project.id });
    return {
      id: project.id, status: "active", isPublic: true, publicationSection: "developments", type: "Desarrollo",
      titleEs: project.nameEs, titleEn: project.nameEn || project.nameEs,
      descriptionEs: projectDescription(project.descriptionEs, !hidden.has("description") && development?.descriptionEs),
      descriptionEn: projectDescription(project.descriptionEn, !hidden.has("description") && development?.descriptionEn),
      portalAreaId: areaId, portalSubareaId: project.subareaId || "", portalGated: development?.portalGated,
      catalogData: { locationId: areaId }, images, projectLocation, presaleProject: project,
      amenities: hidden.has("amenities") ? [] : [...new Set([...(development?.amenities || []), ...(development?.developmentData?.amenities || [])])],
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
  const link = (property, label) => {
    const url = en ? property.urlEn : property.urlEs;
    return url && url.startsWith("/") && !url.startsWith("//") ? `<a class="text-link" href="${escape(url)}">${escape(label || (en ? property.titleEn : property.titleEs) || property.titleEs)}</a>` : "";
  };
  const unitLinks = row.publicUnits.map(unit => link(unit)).filter(Boolean);
  const developmentLink = linked && link(linked, en ? "View full development listing" : "Ver ficha completa del desarrollo");
  const context = { intent: "buy", zone, subzone, development: linked && ((en ? linked.titleEn : linked.titleEs) || linked.titleEs), project: title, reference: project.reference || project.id, origin: "presale-project", sourcePath };
  const photo = row.images[0] && optimizedPublicImage(row.images[0], 960);
  const reference = project.reference && ![linked?.id, project.id].includes(project.reference) ? project.reference : "";
  return `<article class="catalog-project-detail"><a class="text-link" href="${presalePath(lang)}">${en ? "All presales" : "Todas las preventas"}</a>
    <div class="catalog-project-intro">${photo ? `<img data-presale-cover src="${escape(photo)}" width="960" height="640" decoding="async" alt="${escape(title)}" />` : ""}
      <div><h2>${escape(title)}</h2><p>${escape([zone, subzone].filter(Boolean).join(" · "))}</p>
      ${row.projectLocation ? `<p><strong>${en ? "Location" : "Ubicación"}</strong><br>${escape(row.projectLocation)}</p>` : ""}
      ${reference ? `<p>${en ? "Project reference" : "Referencia del proyecto"}: ${escape(reference)}</p>` : ""}
      <div class="catalog-project-actions">${contactLink(lang, en ? "Ask about this project" : "Pedir información de este proyecto", context)}${developmentLink || ""}</div></div>
    </div>
    ${description ? `<section><h3>${en ? "About the project" : "Sobre el proyecto"}</h3><p>${escape(description)}</p></section>` : ""}
    ${row.amenities.length ? `<section><h3>${en ? "Amenities" : "Amenidades"}</h3><ul>${row.amenities.map(item => `<li>${escape(localizedAmenity(item, lang))}</li>`).join("")}</ul></section>` : ""}
    ${unitLinks.length ? `<h3>${en ? "Published listings" : "Propiedades publicadas"}</h3><ul>${unitLinks.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}
    </article>`;
}

module.exports = { escape, areasFor, areaName, areaFor, subareaName, contactLink, presalePath, projectRecords, projectDetail };
