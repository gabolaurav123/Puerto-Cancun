const assert = require("node:assert/strict");
const test = require("node:test");
const { reconcileLocationSeedOptions } = require("../location-catalog");

function createLocationClient(initialRows = []) {
  const rows = initialRows.map((row) => ({ created_at: new Date(0), is_active: true, ...row }));
  return {
    rows,
    async query(sql, params) {
      if (/SELECT id\s+FROM location_options/.test(sql)) {
        const [type, name, parentId, preferredId] = params;
        const matches = rows
          .filter((row) => row.type === type
            && row.name.toLowerCase() === String(name).toLowerCase()
            && row.parent_id === parentId)
          .sort((left, right) => Number(right.id === preferredId) - Number(left.id === preferredId));
        return { rows: matches.slice(0, 1).map(({ id }) => ({ id })) };
      }
      if (/INSERT INTO location_options/.test(sql)) {
        const [id, type, name, parentId] = params;
        const idConflict = rows.some((row) => row.id === id);
        const identityConflict = rows.some((row) => row.type === type
          && row.name === name
          && row.parent_id === parentId);
        if (idConflict || identityConflict) return { rows: [] };
        rows.push({ id, type, name, parent_id: parentId, is_active: true, created_at: new Date() });
        return { rows: [{ id }] };
      }
      throw new Error(`Consulta inesperada en la prueba: ${sql}`);
    },
  };
}

test("reutiliza los IDs reales de una jerarquía existente", async () => {
  const client = createLocationClient([
    { id: "custom-state", type: "state", name: "Quintana Roo", parent_id: null },
    { id: "custom-city", type: "city", name: "Cancún", parent_id: "custom-state" },
    { id: "legacy-lagos", type: "zone", name: "Lagos del Sol", parent_id: "custom-city" },
  ]);
  const resolved = await reconcileLocationSeedOptions(client, [
    { id: "seed-state", type: "state", name: "Quintana Roo", parentId: null },
    { id: "seed-city", type: "city", name: "Cancún", parentId: "seed-state" },
    { id: "seed-zone", type: "zone", name: "Lagos del Sol", parentId: "seed-city" },
    { id: "seed-neighborhood", type: "neighborhood", name: "Residencial Lagos", parentId: "seed-zone" },
  ]);

  assert.equal(resolved.get("seed-state"), "custom-state");
  assert.equal(resolved.get("seed-city"), "custom-city");
  assert.equal(resolved.get("seed-zone"), "legacy-lagos");
  assert.equal(client.rows.find((row) => row.name === "Residencial Lagos").parent_id, "legacy-lagos");
});

test("no sobrescribe una ubicación cuando el ID inicial ya pertenece a otro registro", async () => {
  const client = createLocationClient([
    { id: "seed-state", type: "state", name: "Registro administrado", parent_id: null },
  ]);
  const resolved = await reconcileLocationSeedOptions(client, [
    { id: "seed-state", type: "state", name: "Quintana Roo", parentId: null },
    { id: "seed-city", type: "city", name: "Cancún", parentId: "seed-state" },
  ]);

  const resolvedState = resolved.get("seed-state");
  assert.notEqual(resolvedState, "seed-state");
  assert.equal(client.rows.find((row) => row.id === "seed-state").name, "Registro administrado");
  assert.equal(client.rows.find((row) => row.name === "Cancún").parent_id, resolvedState);
});
