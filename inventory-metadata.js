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
  // Coordinates and exact address never travel to the public client when not authorized for display.
  if (clean.locationPrecision !== "exact") {
    const hidden = clean.locationPrecision === "hidden";
    clean.latitude = !hidden && clean.latitude !== null ? Math.round(clean.latitude * 100) / 100 : null;
    clean.longitude = !hidden && clean.longitude !== null ? Math.round(clean.longitude * 100) / 100 : null;
    clean.address = "";
    clean.mapPlace = "";
    clean.googleMapsUrl = !hidden && clean.latitude !== null && clean.longitude !== null ? `https://www.google.com/maps?q=${clean.latitude},${clean.longitude}` : "";
  }
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
  if (clean.developmentData) clean.developmentData = Object.fromEntries(["id", "nameEs", "nameEn", "developer", "stage", "deliveryDate", "units", "availableUnits", "paymentPlan", "paymentPlanEn", "amenities", "constructionProgress", "progressUpdatedAt", "investmentHighlights", "investmentHighlightsEn"].filter(key => Object.hasOwn(clean.developmentData, key)).map(key => [key, clean.developmentData[key]]));
  if (clean.parentDevelopment) {
    clean.parentDevelopment = { ...clean.parentDevelopment };
    delete clean.parentDevelopment.address;
    delete clean.parentDevelopment.latitude;
    delete clean.parentDevelopment.longitude;
  }
  return clean;
}

module.exports = { normalizeCatalogData, publicProperty };
