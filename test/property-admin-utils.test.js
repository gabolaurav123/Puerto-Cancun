const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:1/test";

const {
  buildInstagramFallbackCaption,
  ensureNumericColumn,
  normalizeGeocodeQuery,
  parseNonNegativeNumber,
  parseUploadedImages,
} = require("../server");

test("las superficies conservan hasta dos decimales", () => {
  assert.equal(parseNonNegativeNumber("105.087", "Superficie"), 105.09);
  assert.equal(parseNonNegativeNumber("0", "Superficie"), 0);
  assert.throws(() => parseNonNegativeNumber("-1", "Superficie"), /mayor o igual a cero/);
});

test("la galería permite conservar, eliminar y reordenar imágenes por separado", () => {
  const first = "data:image/png;base64,iVBORw0KGgo=";
  const second = "data:image/png;base64,iVBORw0KGgoAAA=";
  const existing = [first, second];

  assert.deepEqual(
    parseUploadedImages({ images: ["/media/properties/prop-1/1", "/media/properties/prop-1/0"] }, existing, "prop-1"),
    [second, first]
  );
  assert.deepEqual(parseUploadedImages({ images: ["/media/properties/prop-1/1"] }, existing, "prop-1"), [second]);
  assert.deepEqual(parseUploadedImages({ removeImage: true }, existing, "prop-1"), []);
});

test("una migración numérica no bloquea de nuevo una columna ya convertida", async () => {
  const calls = [];
  const numericClient = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      return { rows: [{ data_type: "numeric" }] };
    },
  };
  await ensureNumericColumn(numericClient, "properties", "area");
  assert.equal(calls.length, 1);

  const migrationCalls = [];
  const integerClient = {
    query: async (sql, params) => {
      migrationCalls.push({ sql, params });
      return migrationCalls.length === 1 ? { rows: [{ data_type: "integer" }] } : { rows: [] };
    },
  };
  await ensureNumericColumn(integerClient, "properties", "lot");
  assert.equal(migrationCalls.length, 2);
  assert.match(migrationCalls[1].sql, /ALTER TABLE properties ALTER COLUMN lot TYPE NUMERIC/);
});

test("la geocodificación normaliza entradas y el borrador local no inventa datos", () => {
  assert.equal(normalizeGeocodeQuery("  Av. Bonampak   10, Cancún  "), "Av. Bonampak 10, Cancún");
  const caption = buildInstagramFallbackCaption(
    { titleEs: "Departamento Marina", zone: "Puerto Cancún", city: "Cancún", area: 105.08, beds: 2, baths: 2 },
    "#PuertoCancun etiqueta-invalida #Cancun"
  );
  assert.match(caption, /105\.08 m²/);
  assert.match(caption, /#PuertoCancun #Cancun/);
  assert.doesNotMatch(caption, /alberca|vista al mar/i);
});
