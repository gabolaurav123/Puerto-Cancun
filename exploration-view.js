"use strict";

const inventory = require("./inventory-contract");
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
function nameOf(record, lang) {
  return lang === "en" ? record.nameEn || record.nameEs || record.name : record.nameEs || record.name;
}
function descriptionOf(record, lang) {
  return lang === "en" ? record.descriptionEn || "" : record.descriptionEs || record.description || "";
}
function areaLink(id, lang, entity = "properties", subarea = "") {
  const params = new URLSearchParams({ location: id, entity });
  if (subarea) params.set("subarea", subarea);
  return (lang === "en" ? "/en/properties" : "/propiedades") + "?" + params;
}
function propertyLink(property, lang) {
  return (lang === "en" ? "/en/properties/" : "/propiedades/") + encodeURIComponent(property.slug || property.id);
}
function areaCards(directory, lang) {
  return directory.areas.map(area => {
    const image = area.image ? `src="${esc(area.image)}"` : "hidden";
    return `<a class="zone-card${area.image ? " has-home-cover" : ""}" href="${esc(areaLink(area.id, lang))}" data-commercial-location="${esc(area.id)}"${area.image ? ' data-editorial-cover="true"' : ""}><img data-home-cover data-location-cover ${image} alt="" width="900" height="600" loading="lazy" decoding="async"><i class="location-cover-placeholder" data-lucide="map-pin" aria-hidden="true"></i><span>${esc(nameOf(area, lang))}</span></a>`;
  }).join("");
}
function areaNav(directory, lang, footer = false) {
  const overview = lang === "en" ? "/en/cancun-areas" : "/zonas-cancun";
  const links = directory.areas.map(area => {
    const name = esc(nameOf(area, lang));
    return `<a href="${esc(areaLink(area.id, lang))}">${footer ? name : `<strong>${name}</strong><small>${esc(descriptionOf(area, lang))}</small>`}</a>`;
  }).join("");
  return `<a class="public-nav-overview" href="${overview}">${lang === "en" ? "Explore all zones" : "Explorar todas las zonas"}</a>${links}`;
}
function renderAreaGuideContent(directory, properties, lang) {
  const en = lang === "en";
  const cards = directory.areas.map(area => {
    const matches = properties.filter(p => (p.portalAreaId || inventory.resolveLocation(p).id) === area.id);
    const developments = matches.filter(p => inventory.entityOf(p) === "developments");
    const units = matches.filter(p => inventory.entityOf(p) === "properties");
    const subareas = area.subareas || [];
    return `<article class="exploration-area"><h2>${esc(nameOf(area, lang))}</h2><p>${esc(descriptionOf(area, lang))}</p>${subareas.length ? `<p class="area-subareas">${subareas.map(s => `<a href="${esc(areaLink(area.id, lang, "properties", s.id))}">${esc(nameOf(s, lang))}</a>`).join(" · ")}</p>` : ""}<div class="exploration-area-actions"><a class="primary-button" href="${esc(areaLink(area.id, lang, "developments"))}">${en ? "View all developments" : "Ver todos los desarrollos"} (${developments.length})</a><a class="ghost-button" href="${esc(areaLink(area.id, lang))}">${en ? "Properties" : "Propiedades"} (${units.length})</a></div></article>`;
  }).join("");
  return `<section id="area-guide" class="exploration-area-grid">${cards}</section>`;
}
function featuredSection(directory, properties, lang, placement, contextId = "") {
  const en = lang === "en";
  const cards = [];
  for (const slot of directory.featured || []) {
    if (slot.placement !== placement || (placement !== "home" && slot.contextId !== contextId)) continue;
    let label, name, href, image;
    if (slot.kind === "area") {
      const area = directory.areas.find(a => a.id === slot.targetId);
      if (!area) continue;
      label = en ? "Zone" : "Zona"; name = nameOf(area, lang); href = areaLink(area.id, lang); image = area.image;
    } else if (slot.kind === "presale") {
      const project = directory.presales.find(p => p.id === slot.targetId);
      if (!project) continue;
      label = en ? "Presale" : "Preventa"; name = nameOf(project, lang); image = project.image;
      href = (en ? "/en/cancun-presales" : "/preventas-cancun") + "?project=" + encodeURIComponent(project.id);
    } else {
      const item = properties.find(p => p.id === slot.targetId && inventory.isPublic(p));
      if (!item) continue;
      label = slot.kind === "development" ? (en ? "Development" : "Desarrollo") : (en ? "Property" : "Propiedad");
      name = en ? item.titleEn || item.titleEs : item.titleEs; href = propertyLink(item, lang);
      image = (item.images || []).find(s => /^\/media\/properties\//.test(s));
      if (image) image += "?w=480";
    }
    cards.push(`<a class="exploration-featured-card" href="${esc(href)}">${image ? `<img src="${esc(image)}" alt="" loading="lazy" width="480" height="270">` : ""}<small>${esc(label)}</small><strong>${esc(name)}</strong></a>`);
  }
  if (!cards.length) return "";
  return `<section class="exploration-featured content-wrap"><h2>${en ? "Featured" : "Destacados"}</h2><div>${cards.join("")}</div></section>`;
}

module.exports = { areaLink, areaCards, areaNav, renderAreaGuideContent, featuredSection, nameOf };
