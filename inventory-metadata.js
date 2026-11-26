const { LOCATIONS } = require("./inventory-contract");

function normalizeCatalogData(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("Clasificación comercial inválida"), { status: 400 });
  const result = {};
  const enums = {
    locationId: ["", ...LOCATIONS.map((item) => item.id)],
    salesModality: ["", "presale", "direct", "resale", "unclassified"],
    rentPeriod: ["", "month", "day", "year", "unclassified"],
  };
  for (const [key, choices] of Object.entries(enums)) {
    const item = String(value[key] ?? "");
    if (!choices.includes(item)) throw Object.assign(new Error(`${key}: selección inválida`), { status: 400 });
    result[key] = item;
  }
  result.priceOnRequest = value.priceOnRequest === true;
  result.homeOrder = value.homeOrder === "" || value.homeOrder == null ? null : Number(value.homeOrder);
  if (result.homeOrder !== null && (!Number.isInteger(result.homeOrder) || result.homeOrder < 0 || result.homeOrder > 9999)) throw Object.assign(new Error("El orden de portada debe estar entre 0 y 9999"), { status: 400 });
  return result;
}

function publicProperty(property) {
  const clean = { ...property };
  const coordinate = (value, limit) => {
    if (value === null || value === undefined || typeof value === "boolean" || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
  };
  clean.latitude = coordinate(clean.latitude, 90);
  clean.longitude = coordinate(clean.longitude, 180);
  if (clean.latitude === 0 && clean.longitude === 0) clean.latitude = clean.longitude = null;
  if (clean.portalHiddenBlocks?.includes("location")) clean.locationPrecision = "hidden";
  // Coordinates and exact address never travel to the public client when not authorized for display.
  if (clean.locationPrecision !== "exact") {
    const hidden = clean.locationPrecision === "hidden";
    clean.latitude = !hidden && clean.latitude !== null ? Math.round(clean.latitude * 100) / 100 : null;
    clean.longitude = !hidden && clean.longitude !== null ? Math.round(clean.longitude * 100) / 100 : null;
    clean.address = "";
    clean.mapPlace = "";
  }
  clean.googleMapsUrl = "";
  delete clean.verifiedBy;
  delete clean.completeness;
  delete clean.qualityMissing;
  delete clean.qualityScore;
  delete clean.qualityLevel;
  delete clean.titleEnStored;
  delete clean.descriptionEnStored;
  delete clean.sourceRequestId;
  delete clean.idempotencyKey;
  clean.catalogData = Object.fromEntries(["locationId", "salesModality", "rentPeriod", "priceOnRequest", "homeOrder"].filter(key => Object.hasOwn(clean.catalogData || {}, key)).map(key => [key, clean.catalogData[key]]));
  if (clean.developmentData) clean.developmentData = Object.fromEntries(["id", "nameEs", "nameEn", "developer", "stage", "deliveryDate", "units", "availableUnits", "paymentPlan", "paymentPlanEn", "amenities", "amenitiesPlanned", "constructionProgress", "progressUpdatedAt", "investmentHighlights", "investmentHighlightsEn"].filter(key => Object.hasOwn(clean.developmentData, key)).map(key => [key, clean.developmentData[key]]));
  if (clean.parentDevelopment) {
    const parent = clean.parentDevelopment;
    const publicFields = ["id", "propertyId", "updatedAt", "nameEs", "nameEn", "developer", "stage", "deliveryDate", "units", "availableUnits", "paymentPlan", "paymentPlanEn", "amenities", "amenitiesPlanned", "imageCount"];
    clean.parentDevelopment = Object.fromEntries(publicFields.filter(key => Object.hasOwn(parent, key)).map(key => [key, parent[key]]));
    const linkedId = clean.portalDevelopmentId || clean.developmentId;
    const linked = Boolean(linkedId) && [parent.id, parent.propertyId].includes(linkedId);
    // Names alone do not authorize publishing a parent's map. Both records must explicitly
    // allow it, and the parent must be the published linked development, never another unit.
    if (linked && parent.isPublic === true && ["active", "featured"].includes(parent.status)
      && clean.locationPrecision !== "hidden" && parent.locationPrecision !== "hidden" && !parent.portalHiddenBlocks?.includes("location")) {
      const exact = clean.locationPrecision === "exact" && parent.locationPrecision === "exact";
      const latitude = coordinate(parent.latitude, 90), longitude = coordinate(parent.longitude, 180);
      Object.assign(clean.parentDevelopment, {
        isPublic: true, status: parent.status, publicationSection: "developments",
        locationPrecision: exact ? "exact" : "approximate",
        ...Object.fromEntries(["zone", "city", "state", "neighborhood"].filter(key => typeof parent[key] === "string").map(key => [key, parent[key]])),
        address: exact && typeof parent.address === "string" ? parent.address : "",
        latitude: latitude === null || longitude === null || (latitude === 0 && longitude === 0) ? null : exact ? latitude : Math.round(latitude * 100) / 100,
        longitude: latitude === null || longitude === null || (latitude === 0 && longitude === 0) ? null : exact ? longitude : Math.round(longitude * 100) / 100,
      });
    }
  }
  return clean;
}

module.exports = { normalizeCatalogData, publicProperty };
