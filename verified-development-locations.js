(function (root, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(node ? require("./verified-development-location-data") : root.PccVerifiedDevelopmentLocationData,
    node ? require("./inventory-contract") : root.PccInventory);
  if (node) module.exports = api;
  else root.PccVerifiedDevelopmentLocations = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (data, inventory) {
  "use strict";

  // Display-only references for independently identified communities. Never modify inventory.
  const normalizedTitle = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const records = new Map();
  for (const source of Array.isArray(data) ? data : []) {
    if (!source || typeof source.id !== "string" || !source.id.trim() || !normalizedTitle(source.title)) continue;
    const latitude = source.latitude, longitude = source.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || latitude === 0 && longitude === 0) continue;
    if (!["building", "complex", "community"].includes(source.kind) || !/^https:\/\//i.test(source.sourceUrl || "")) continue;
    const record = Object.freeze({ id: source.id, title: source.title, latitude, longitude,
      address: String(source.address || ""), sourceUrl: source.sourceUrl, kind: source.kind });
    // Conflicting duplicate IDs must not silently select a location.
    records.set(record.id, records.has(record.id) ? null : record);
  }

  function find(property = {}) {
    if (!property || inventory?.entityOf(property) !== "developments") return null;
    if ([property.locationPrecision, property.location_precision].includes("hidden") || property.portalHiddenBlocks?.includes("location")) return null;
    const record = records.get(property.id);
    const title = property.titleEs || property.title_es || property.title;
    return record && normalizedTitle(title) === normalizedTitle(record.title) ? record : null;
  }

  return Object.freeze({ find });
});
