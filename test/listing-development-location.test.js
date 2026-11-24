"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const location = require("../listing-development-location");

const master = { id: "master-a", publicationSection: "developments", titleEs: "Edificio A", state: "Quintana Roo", city: "Cancún",
  zone: "Puerto Cancún", neighborhood: "Marina", address: "Calle A 1", latitude: 21.17, longitude: -86.8,
  locationPrecision: "exact", mapPlace: "Edificio A", catalogData: { locationId: "puerto-cancun" } };

test("inheritance preserves a unit's location overrides, privacy, prices and gallery", () => {
  const unit = { state: "Yucatán", city: "Mérida", zone: "Centro", address: "Calle propia 2", latitude: 20.97, longitude: -89.62,
    locationPrecision: "hidden", catalogData: { locationId: "fuera-de-cancun", rentPeriod: "month" }, images: ["own"], price: 100 };
  location.inheritMissing(unit, master);
  assert.equal(unit.state, "Yucatán");
  assert.equal(unit.address, "Calle propia 2");
  assert.equal(unit.latitude, 20.97);
  assert.equal(unit.longitude, -89.62);
  assert.equal(unit.locationPrecision, "hidden");
  assert.equal(unit.catalogData.locationId, "fuera-de-cancun");
  assert.equal(unit.price, 100);
  assert.deepEqual(unit.images, ["own"]);
  const hidden = { locationPrecision: "hidden" };
  location.inheritMissing(hidden, master);
  assert.equal(hidden.locationPrecision, "hidden");
});

test("incomplete development locations remain optional and coordinate pairs are never mixed", () => {
  const blank = location.fromDevelopment({});
  assert.equal(blank.state, "");
  assert.equal(blank.city, "");
  assert.equal(blank.latitude, null);
  assert.equal(blank.commercialLocationId, "");
  const partial = { latitude: 22, longitude: null };
  location.inheritMissing(partial, master);
  assert.equal(partial.latitude, 22);
  assert.equal(partial.longitude, null);
  assert.equal(location.fromDevelopment({ latitude: "", longitude: -86 }).longitude, null);
});

test("changing the selected development refreshes inherited fields while preserving unit-specific edits", () => {
  const source = fs.readFileSync(require.resolve("../app.js"), "utf8");
  const functions = ["developmentRecordId", "applyListingDevelopmentLocation"].map(name => source.match(new RegExp(`function ${name}\\([^]*?\\n}`))[0]).join("\n");
  const fields = Object.fromEntries(["developmentId", "state", "city", "zone", "neighborhood", "address", "mapPlace", "commercialLocationId", "latitude", "longitude", "publicLocationPrecision", "title", "price"].map(name => [name, { value: "" }]));
  fields.publicLocationPrecision.value = "approximate";
  fields.title.value = "Mi unidad";
  fields.price.value = "123";
  const form = { dataset: { currentImages: '["unit-photo"]' } }, status = { textContent: "", dataset: {} };
  const second = { ...master, id: "master-b", state: "Yucatán", city: "Mérida", zone: "Centro", neighborhood: "Centro", address: "Calle B 2", mapPlace: "Edificio B", latitude: 20.97, longitude: -89.62, catalogData: { locationId: "fuera-de-cancun" } };
  const run = vm.runInNewContext(`${functions}; applyListingDevelopmentLocation`, { state: { properties: [master, second] }, window: { PccListingDevelopmentLocation: location },
    $: selector => selector === "#listingForm" ? form : status, formField: (_form, name) => fields[name], listingFormIsDevelopment: () => false,
    LOCATION_FIELD_ORDER: ["state", "city", "zone", "neighborhood"], fillLocationSelect: () => {}, updateMapPickerForForm: () => {}, t: key => key });
  fields.developmentId.value = "dev-master-a";
  run(form);
  assert.equal(fields.address.value, master.address);
  assert.equal(Number(fields.latitude.value), master.latitude);
  assert.equal(fields.commercialLocationId.value, "puerto-cancun");
  fields.developmentId.value = "dev-master-b";
  run(form);
  assert.equal(fields.state.value, second.state);
  assert.equal(fields.address.value, second.address);
  assert.equal(Number(fields.longitude.value), second.longitude);
  fields.address.value = "Dirección ajustada de la unidad";
  fields.latitude.value = "20.98";
  fields.longitude.value = "-89.63";
  fields.developmentId.value = "dev-master-a";
  run(form);
  assert.equal(fields.city.value, master.city);
  assert.equal(fields.address.value, "Dirección ajustada de la unidad");
  assert.equal(fields.latitude.value, "20.98");
  assert.equal(fields.title.value, "Mi unidad");
  assert.equal(fields.price.value, "123");
  assert.equal(form.dataset.currentImages, '["unit-photo"]');
  assert.equal(status.dataset.i18n, "listingDevelopmentLocationFilled");
  fields.developmentId.value = "";
  run(form);
  assert.equal(status.textContent, "");
  assert.equal(status.dataset.i18n, undefined);
});
