(function (root, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(node ? require("./inventory-contract") : root.PccInventory,
    node ? require("./verified-development-locations") : root.PccVerifiedDevelopmentLocations);
  if (node) module.exports = api;
  else root.PccListingDevelopmentLocation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (inventory, verifiedLocations) {
  "use strict";
  const text = value => String(value ?? "").trim();
  const empty = value => value == null || text(value) === "";
  const coordinate = (value, limit) => empty(value) || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > limit ? null : Number(value);
  const textFields = ["state", "city", "zone", "neighborhood", "address", "mapPlace", "googleMapsUrl"];

  function fromDevelopment(source = {}) {
    const location = Object.fromEntries(textFields.map(name => [name, text(source[name] ?? source[{ mapPlace: "map_place", googleMapsUrl: "google_maps_url" }[name]])]));
    location.latitude = coordinate(source.latitude, 90);
    location.longitude = coordinate(source.longitude, 180);
    if (location.latitude == null || location.longitude == null) location.latitude = location.longitude = null;
    location.locationPrecision = source.locationPrecision || source.location_precision || "approximate";
    const verified = verifiedLocations?.find(source);
    if (verified && !(location.latitude != null && location.locationPrecision === "exact")) {
      location.latitude = verified.latitude;
      location.longitude = verified.longitude;
      location.address = verified.address || location.address;
      // A community pin is a reference for the unit, not its exact street address.
      location.locationPrecision = verified.kind === "building" ? "exact" : "approximate";
    }
    location.commercialLocationId = (source.catalogData || source.catalog_data)?.locationId || inventory?.resolveLocation(source).id || "";
    return location;
  }

  function inheritMissing(property, source) {
    const location = fromDevelopment(source);
    for (const name of textFields) if (empty(property[name]) && location[name]) property[name] = location[name];
    if (empty(property.latitude) && empty(property.longitude) && location.latitude != null) {
      property.latitude = location.latitude;
      property.longitude = location.longitude;
      if (property.locationPrecision !== "hidden") property.locationPrecision = location.locationPrecision;
    }
    if (!property.catalogData?.locationId && location.commercialLocationId) {
      property.catalogData = { ...property.catalogData, locationId: location.commercialLocationId };
    }
    return property;
  }

  return { fromDevelopment, inheritMissing };
});
