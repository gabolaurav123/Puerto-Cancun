const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildLocationSeedOptions,
  mexicoStates,
  quintanaRooCities,
  quintanaRooNeighborhoods,
  quintanaRooZones,
} = require("../location-catalog");

test("el catálogo geográfico tiene jerarquía completa y referencias válidas", () => {
  const options = buildLocationSeedOptions();
  const ids = new Set(options.map((option) => option.id));

  assert.equal(mexicoStates.length, 32);
  assert.equal(quintanaRooCities.length, 11);
  assert.ok(quintanaRooZones.length >= 50);
  assert.ok(quintanaRooNeighborhoods.length >= 40);
  assert.equal(ids.size, options.length, "cada ubicación debe tener un id único");

  for (const option of options) {
    if (option.type === "state") assert.equal(option.parentId, null);
    else assert.ok(ids.has(option.parentId), `falta el superior de ${option.name}`);
  }

  const quintanaRoo = options.find((option) => option.id === "loc-state-quintana-roo");
  assert.equal(quintanaRoo?.name, "Quintana Roo");
  assert.equal(options.filter((option) => option.type === "city" && option.parentId === quintanaRoo.id).length, 11);
});
