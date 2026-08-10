const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  computeLeadScore,
  parseIntelligentSearch,
  propertyMatchesFilters,
  rankProperties,
  validateSearchFilters,
} = require("../intelligence-utils");
const { registryForRole, searchFeatures } = require("../feature-registry");

const root = path.resolve(__dirname, "..");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("el buscador interpreta lenguaje natural y valida listas permitidas", () => {
  const filters = parseIntelligentSearch(
    "Busco un departamento de 3 recámaras en Puerto Cancún por menos de 900 mil dólares con alberca",
    { locations: ["Puerto Cancún", "Zona Hotelera"] }
  );
  assert.equal(filters.propertyType, "Departamento");
  assert.equal(filters.bedrooms, 3);
  assert.equal(filters.location, "Puerto Cancún");
  assert.equal(filters.maxPrice, 900000);
  assert.equal(filters.currency, "USD");
  assert.deepEqual(filters.amenities, ["alberca"]);

  const hostile = validateSearchFilters({ propertyType: "DROP TABLE properties", operation: "delete", currency: "BTC" });
  assert.equal(hostile.propertyType, null);
  assert.equal(hostile.operation, null);
  assert.equal(hostile.currency, null);
});

test("el ranking usa únicamente propiedades recibidas del inventario", () => {
  const inventory = [
    { id: "real-1", titleEs: "Departamento frente al mar", descriptionEs: "Alberca y marina", type: "Departamento", operation: "sale", zone: "Puerto Cancún", currency: "USD", price: 650000, beds: 2, baths: 2, area: 140, amenities: ["alberca"], keywords: [] },
    { id: "real-2", titleEs: "Casa familiar", descriptionEs: "Zona tranquila", type: "Casa", operation: "sale", zone: "Puerto Cancún", currency: "USD", price: 800000, beds: 3, baths: 3, area: 220, amenities: [], keywords: [] },
  ];
  const filters = parseIntelligentSearch("departamento frente al mar con alberca", { locations: ["Puerto Cancún"] });
  const matches = rankProperties(inventory.filter((property) => propertyMatchesFilters(property, filters)), filters, "frente al mar");
  assert.deepEqual(matches.map((item) => item.id), ["real-1"]);
  assert.ok(matches.every((item) => inventory.includes(item)));
});

test("el lead score distingue factores confirmados", () => {
  const score = computeLeadScore(
    { phone: "529982166563", email: "lead@example.com", preferredZones: ["Puerto Cancún"], budgetMax: 900000, propertyType: "Departamento" },
    { interactions: 4, propertyViews: 2, pendingTask: true }
  );
  assert.ok(score.value >= 75);
  assert.equal(score.level, "premium");
  assert.ok(score.factors.every((factor) => factor.confirmed === true));
});

test("Copilot queda limitado al administrador y a un registry real", () => {
  assert.ok(registryForRole("admin").some((feature) => feature.id === "copilot"));
  assert.equal(registryForRole("advisor").some((feature) => feature.id === "copilot"), false);
  assert.equal(registryForRole("seller").length, 0);
  const result = searchFeatures("cómo creo una propiedad", "admin", { section: "new-property" });
  assert.equal(result[0].id, "new-property");
  const fromCopilot = searchFeatures("cómo creo una propiedad", "admin", { section: "copilot" });
  assert.equal(fromCopilot[0].id, "new-property");
  assert.match(serverSource, /app\.post\("\/api\/admin\/copilot\/query", requireRole\("admin"\)/);
  assert.match(serverSource, /isGenericCopilotOnboardingQuestion/);
  assert.match(serverSource, /soy nuev\[oa\]\(\?: como empiezo\)\?/);
  assert.match(serverSource, /Las publicaciones son el flujo principal/);
  assert.equal(registryForRole("admin").some((feature) => ["matches", "smart-map"].includes(feature.id)), false);
  assert.doesNotMatch(serverSource, /SELECT\s+\$\{[^}]*question/i);
});

test("las herramientas IA consultan las columnas vigentes de precio", () => {
  assert.match(serverSource, /price_amount AS price, price_currency AS currency, area/);
  assert.doesNotMatch(serverSource, /SELECT id, title_es, mls, zone, type, price, currency, area/);
  assert.match(serverSource, /createOpenAIResponseError/);
  assert.match(serverSource, /OPENAI_INSUFFICIENT_QUOTA/);
});

test("la interfaz integra búsqueda, Intelligence, calidad e integraciones sin chatbot público", () => {
  assert.match(indexSource, /id="searchForm"[\s\S]*Búsqueda inteligente/);
  assert.match(indexSource, /data-admin-section="copilot"/);
  assert.match(indexSource, /data-admin-section-panel="data-quality"/);
  assert.match(indexSource, /data-admin-section-panel="integrations"/);
  assert.match(appSource, /POST|\/api\/search\/intelligent/);
  assert.match(stylesSource, /body\.admin-session \.whatsapp-float/);
  assert.match(serverSource, /CREATE TABLE IF NOT EXISTS translation_cache/);
  assert.match(serverSource, /CREATE TABLE IF NOT EXISTS ai_operation_logs/);
});
