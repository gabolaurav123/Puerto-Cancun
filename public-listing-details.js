(function (root, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(node ? require("./inventory-contract") : root.PccInventory,
    node ? require("./verified-development-locations") : root.PccVerifiedDevelopmentLocations);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccPublicListingDetails = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (inventory, verifiedDevelopmentLocations) {
"use strict";

function safePublicImages(property) {
  // A linked development keeps its own gallery; it is not part of a unit's photos.
  const images = Array.isArray(property.images) ? property.images : [];
  return [...new Set(images)].filter((image) => /^https?:\/\//i.test(image) || /^\/media\//.test(image) || /^\/assets\//.test(image));
}

function optimizedPublicImage(image, width) {
  if (!/^\/media\/properties\//.test(String(image || ""))) return image;
  const separator = String(image).includes("?") ? "&" : "?";
  return `${image}${separator}w=${width}`;
}

function publicAmenities(property = {}, records = []) {
  if (!property || property.portalHiddenBlocks?.includes("amenities")) return [];
  const parent = property.parentDevelopment;
  const catalogParent = parent && records.find(row => row.id === parent.propertyId || row.developmentData?.id === parent.id);
  const inherited = parent?.amenitiesPlanned || catalogParent?.developmentData?.amenitiesPlanned || catalogParent?.portalHiddenBlocks?.includes("amenities") || parent?.portalHiddenBlocks?.includes("amenities")
    ? [] : parent?.amenities || [];
  return [...new Set([...(property.amenities || []), ...(property.developmentData?.amenities || []), ...inherited]
    .filter(value => typeof value === "string" && value.trim()).map(value => value.trim()))];
}

function localizedAmenity(amenity, lang = "es") {
  if (lang !== "en") return amenity;
  const key = String(amenity || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return {
    "acceso controlado": "Controlled access",
    "area de mascotas": "Pet area",
    "areas infantiles": "Children’s play areas",
    "club infantil": "Kids’ club",
    "asadores": "Barbecue areas",
    "canchas de tenis": "Tennis courts",
    "canchas de padel": "Padel courts",
    "carril de nado": "Lap lane",
    "casa club": "Clubhouse",
    "jardines": "Gardens",
    "restaurante": "Restaurant",
    "estacionamiento": "Parking",
    "areas sociales": "Social spaces",
    "areas verdes": "Green spaces",
    "vigilancia": "Security",
    "terraza panoramica": "Panoramic terrace",
    "parque infantil": "Playground",
    "marina seca": "Dry marina",
    "salon de eventos": "Event room",
    "parque central": "Central park",
    "cine": "Cinema",
    "ludoteca": "Playroom",
    "club social": "Social club",
    "sala de juegos": "Games room",
    "palapas": "Palapas",
    "bar": "Bar",
    "coworking": "Coworking",
    "lobby": "Lobby",
    "sauna": "Sauna",
    "snack bar": "Snack bar",
    "yoga": "Yoga",
    "acceso a playa": "Beach access",
    "acceso a playa privada": "Private beach access",
    alberca: "Swimming pool",
    albercas: "Swimming pools",
    "cancha de tenis": "Tennis court",
    "canchas deportivas": "Sports courts",
    cenote: "Cenote",
    "centro de negocios": "Business center",
    ciclovia: "Bike path",
    "club de playa": "Beach club",
    elevador: "Elevator",
    "frente a marina": "Marina front",
    "frente a playa": "Beachfront",
    "frente al mar": "Oceanfront",
    gimnasio: "Gym",
    jacuzzi: "Jacuzzi",
    malecon: "Waterfront promenade",
    marina: "Marina",
    muelle: "Dock",
    palapa: "Palapa",
    "playa privada": "Private beach",
    "salon de usos multiples": "Multipurpose room",
    seguridad: "Security",
    "seguridad 24/7": "24/7 security",
    "senderos peatonales": "Walking paths",
    spa: "Spa",
    "terraza - bar": "Terrace bar",
    "vista a la marina": "Marina view",
  }[key] || amenity;
}

const locationText = (value) => typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
const escapeLocation = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const distinctLocationParts = (parts) => [...new Map(parts.map(locationText).filter(Boolean).map(value => [inventory.fold(value), value])).values()];

function parsePlacePin(value) {
  const text = String(value || "").trim();
  let coordinates = text;
  if (/^https?:\/\//i.test(text)) {
    let url;
    try { url = new URL(text); } catch { return null; }
    if (!/^(?:www\.|maps\.)?google\.(?:com|com\.mx|ca|co\.uk)$/i.test(url.hostname)) return null;
    const point = url.pathname.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
    coordinates = point ? point[1] + "," + point[2] : url.searchParams.get("query") || url.searchParams.get("q") || "";
  }
  const pair = coordinates.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  return pair ? publicCoordinatePair({ latitude:pair[1], longitude:pair[2] }) : null;
}

function publicCoordinatePair(property = {}) {
  const parse = (value, limit) => {
    if (!["string", "number"].includes(typeof value) || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
  };
  const latitude = parse(property.latitude, 90), longitude = parse(property.longitude, 180);
  return latitude !== null && longitude !== null && (latitude !== 0 || longitude !== 0) ? { latitude, longitude } : null;
}

function locationPrecisionOf(property = {}) {
  const flags = [property.locationPrecision, property.location_precision];
  if (flags.includes("hidden") || property.portalHiddenBlocks?.includes("location")) return "hidden";
  return flags.includes("exact") && !flags.includes("approximate") ? "exact" : "approximate";
}

function locationNames(property, directory = {}, lang = "es") {
  const areas = Array.isArray(directory.areas) ? directory.areas : inventory.LOCATIONS;
  const areaId = inventory.resolveLocation(property, areas).id;
  const area = areas.find(item => item.id === areaId);
  const localizedAreas = {
    "zona-hotelera": ["Zona Hotelera", "Hotel Zone"],
    "puerto-cancun": ["Puerto Cancún", "Puerto Cancun"],
    "cancun-city": ["Ciudad de Cancún", "Cancun City"],
    "fuera-de-cancun": ["Fuera de Cancún", "Outside Cancun"],
  };
  const areaName = locationText(area?.[lang === "en" ? "nameEn" : "nameEs"] || localizedAreas[areaId]?.[lang === "en" ? 1 : 0] || area?.name);
  const subareaId = property.portalSubareaId || property.catalogData?.subareaId;
  const subarea = area?.subareas?.find(item => item.id === subareaId);
  const subareaName = locationText(subarea?.[lang === "en" ? "nameEn" : "nameEs"] || subarea?.name);
  const zone = locationText(property.zone), city = locationText(property.city), state = locationText(property.state);
  const zoneAreaId = inventory.locationId(zone, areas);
  const neighborhood = locationText(property.neighborhood);
  const neighborhoodAreaId = inventory.locationId(neighborhood, areas);
  const broadZone = value => /^(zona hotelera(?: \(zh\)| de cancun| cancun)?|hotel zone(?: \(zh\))?|puerto[- ]cancun|p cancun|ciudad de cancun|cancun city|cancun centro|centro cancun|fuera de cancun|outside cancun)$/.test(inventory.fold(value));
  // A geocoder's broad administrative label is not a second commercial zone.
  // For example, an Al Mare street may say Zona Hotelera while its reviewed zone is Puerto Cancún.
  const localNeighborhood = neighborhoodAreaId && (neighborhoodAreaId !== areaId || broadZone(neighborhood)) ? "" : neighborhood;
  const localZone = zoneAreaId && broadZone(zone) ? "" : zone;
  const outside = areaId === "fuera-de-cancun";
  const genericCity = !city || /^(cancun|benito juarez|quintana roo|mexico)$/.test(inventory.fold(city));
  const place = distinctLocationParts([subareaName, localZone, localNeighborhood, outside && genericCity ? "" : city]);
  const compact = distinctLocationParts([areaName || zone, ...place]).join(" · ");
  const specificZone = localZone && !/^(fuera de cancun|outside cancun|quintana roo|mexico)$/.test(inventory.fold(localZone)) ? localZone : "";
  // A broad outside grouping or state alone cannot turn into a Cancun-center map.
  const canGeocode = outside ? !genericCity || Boolean(specificZone || subareaName) : Boolean(areaName || specificZone || subareaName || (!genericCity && city));
  const geocodeParts = outside
    ? [subareaName, specificZone ? localZone : "", genericCity ? "" : city, state, "México"]
    : [subareaName || specificZone || areaName, city, state, "México"];
  return { areaId, compact: compact || state, geocodeQuery: canGeocode ? distinctLocationParts(geocodeParts).join(", ") : "" };
}

function linkedPublicDevelopment(property, properties) {
  const linkedIds = property.portalDevelopmentId ? [property.portalDevelopmentId]
    : [property.parentDevelopment?.propertyId, property.developmentId].filter(Boolean);
  if (!linkedIds.length || !Array.isArray(properties)) return null;
  return properties.find(candidate => {
    if (!candidate || candidate.id === property.id || inventory.entityOf(candidate) !== "developments") return false;
    if (candidate.isPublic === false || candidate.is_public === false || !["active", "featured"].includes(candidate.status)) return false;
    if (locationPrecisionOf(candidate) === "hidden") return false;
    const candidateIds = [candidate.id, candidate.developmentData?.id].filter(Boolean);
    return linkedIds.every(id => candidateIds.includes(id));
  }) || null;
}

/** Resolve a display-only public location. Verified community references never change inventory or unit precision. */
function resolvePublicLocation(property = {}, { lang = "es", directory = {}, properties = [] } = {}) {
  const english = lang === "en", t = (es, en) => english ? en : es;
  const entity = inventory.entityOf(property);
  const heading = entity === "developments" ? t("Ubicación del desarrollo", "Development location") : t("Ubicación de la propiedad", "Property location");
  const declaredPrecision = locationPrecisionOf(property);
  const names = locationNames(property, directory, lang);
  const result = { entity, heading, compact: names.compact, declaredPrecision, precision: "unavailable", address: "", latitude: null, longitude: null, geocodeQuery: "", coordinateSource: "none", sourceId: "", sourceName: "", sourceUrl: "", locationScope: "", notice: "", evidenceLabel: "" };
  if (declaredPrecision === "hidden") return { ...result, precision: "hidden", notice: t("Consulta la ubicación con nuestro equipo.", "Ask our team about the location."), evidenceLabel: t("Ubicación reservada", "Location withheld") };
  let point = publicCoordinatePair(property), source = property;
  const verified = entity === "developments" && verifiedDevelopmentLocations?.find(property);
  const matchesReference = verified && point && Math.abs(point.latitude - verified.latitude) < 0.000001 && Math.abs(point.longitude - verified.longitude) < 0.000001;
  if (entity === "developments" && (!(point && declaredPrecision === "exact") || matchesReference)) {
    if (verified) {
      const scope = verified.kind;
      return { ...result, precision: "exact", address: verified.address, latitude: verified.latitude, longitude: verified.longitude,
        coordinateSource: "verified-development", sourceId: verified.id, sourceName: verified.title, sourceUrl: verified.sourceUrl, locationScope: scope,
        heading: scope === "community" ? t("Ubicación de la comunidad", "Community location") : heading,
        evidenceLabel: scope === "building" ? t("Ubicación verificada del edificio", "Verified building location")
          : scope === "community" ? t("Ubicación verificada de la comunidad", "Verified community location") : t("Ubicación verificada del conjunto", "Verified complex location"),
        notice: scope === "building" ? t("El mapa identifica el edificio, no una unidad específica.", "The map identifies the building, not an individual unit.")
          : scope === "community" ? t("El mapa identifica la comunidad, no un edificio o una unidad específica.", "The map identifies the community, not a particular building or unit.")
            : t("El mapa identifica el conjunto, no una unidad específica.", "The map identifies the complex, not an individual unit.") };
    }
    // An approximate stored point or a geocoded zone center is not evidence of a community's location.
    point = null;
  }
  if (entity !== "developments") {
    const parent = linkedPublicDevelopment(property, properties);
    const parentPoint = parent && (publicCoordinatePair(parent) || verifiedDevelopmentLocations?.find(parent));
    const copied = point && parentPoint && Math.abs(point.latitude - parentPoint.latitude) < 0.000006 && Math.abs(point.longitude - parentPoint.longitude) < 0.000006;
    if (parent && (!point || copied) && declaredPrecision === "exact") {
      const parentLocation = resolvePublicLocation(parent, { lang, directory });
      if (parentLocation.precision === "exact") return { ...parentLocation, entity, heading, declaredPrecision,
        compact: names.compact || parentLocation.compact, coordinateSource: "development", sourceId: parent.id,
        sourceName: parentLocation.sourceName || parent.titleEs || "", locationScope: parentLocation.locationScope || "",
        evidenceLabel: t("Ubicación del desarrollo vinculado", "Linked development location"), notice: parent.titleEs || parent.titleEn || "" };
    }
    if (!point && parent && publicCoordinatePair(parent)) { source = parent; point = publicCoordinatePair(parent); }
  }
  if (point) {
    const exact = declaredPrecision === "exact" && locationPrecisionOf(source) === "exact";
    result.precision = exact ? "exact" : "approximate";
    result.latitude = exact ? point.latitude : Math.round(point.latitude * 100) / 100;
    result.longitude = exact ? point.longitude : Math.round(point.longitude * 100) / 100;
    result.coordinateSource = source === property ? "listing" : "development";
    result.sourceId = source.id || "";
    if (source !== property) {
      result.sourceName = locationText(source[english ? "titleEn" : "titleEs"] || source.titleEs || source.titleEn);
      result.notice = t("Referencia del desarrollo vinculado", "Linked development reference") + (result.sourceName ? `: ${result.sourceName}.` : ".");
      if (!result.compact) result.compact = locationNames(source, directory, lang).compact;
    }
    if (exact) result.address = locationText(source.address);
  } else if (names.geocodeQuery && entity !== "developments") {
    result.precision = "approximate";
    result.coordinateSource = "zone";
    result.geocodeQuery = names.geocodeQuery;
  }
  if (result.precision === "exact") {
    result.evidenceLabel = entity === "developments" ? t("Ubicación publicada del desarrollo", "Published development location")
      : result.coordinateSource === "development" ? t("Ubicación exacta del desarrollo vinculado", "Exact location of the linked development") : t("Ubicación exacta publicada", "Published exact location");
    if (entity === "developments") result.notice = t("El punto corresponde al desarrollo; no identifica una unidad específica.", "The point identifies the development, not an individual unit.");
  } else if (result.precision === "approximate") {
    result.evidenceLabel = t("Ubicación aproximada de la zona", "Approximate zone location");
    result.notice = [result.notice, t("El mapa muestra una referencia de la zona, no el punto exacto del inmueble.", "The map shows the surrounding zone, not the property's exact position.")].filter(Boolean).join(" ");
  } else {
    result.evidenceLabel = t("Ubicación por confirmar", "Location to be confirmed");
    result.notice = entity === "developments"
      ? t("La ubicación de este desarrollo está pendiente de confirmar. Puedes pedir información para conocerla.", "This development's location is awaiting confirmation. Request information to learn more.")
      : t("No hay un punto verificado para mostrar. Consulta la ubicación con nuestro equipo.", "There is no verified point to display. Ask our team about the location.");
  }
  return result;
}

function renderPublicLocationSection(property, options = {}) {
  const model = resolvePublicLocation(property, options), english = options.lang === "en";
  const e = escapeLocation;
  const mapAvailable = model.precision === "exact";
  const attrs = [`data-location-precision="${e(model.precision)}"`, `data-location-source="${e(model.coordinateSource)}"`];
  if (model.locationScope) attrs.push(`data-location-scope="${e(model.locationScope)}"`);
  if (model.latitude !== null && model.longitude !== null) attrs.push(`data-location-latitude="${model.latitude}"`, `data-location-longitude="${model.longitude}"`);

  const contactHref = typeof options.contactHref === "string" && /^(#[a-z][\w-]*|\/(?!\/)[^<>"\s]*)$/i.test(options.contactHref) ? options.contactHref : "";
  return `<section class="property-location-map public-location-section" data-public-location lang="${english ? "en" : "es"}" ${attrs.join(" ")}>
    <h2>${e(model.heading)}</h2>
    ${model.compact ? `<p class="public-location-summary">${e(model.compact)}</p>` : ""}
    ${model.address ? `<p class="public-location-address">${e(model.address)}</p>` : ""}
    <p class="public-location-precision">${e(model.evidenceLabel)}</p>
    ${mapAvailable ? `<div class="public-location-canvas" data-location-canvas style="height:clamp(240px,42vh,360px);min-height:240px;position:relative;z-index:0;" role="region" aria-label="${e(model.heading)}"></div><p class="public-location-status" data-location-status role="status" aria-live="polite"></p>` : ""}
    ${contactHref ? `<a class="public-location-contact"${/^\/(?:contacto|en\/contact)\?/.test(contactHref) ? " data-contact-inquiry" : ""} href="${e(contactHref)}">${english ? "Ask about this location" : "Consultar esta ubicación"}</a>` : ""}
  </section>`;
}

return { publicAmenities, safePublicImages, optimizedPublicImage, localizedAmenity, parsePlacePin, publicCoordinatePair, locationPrecisionOf, resolvePublicLocation, renderPublicLocationSection };
});
