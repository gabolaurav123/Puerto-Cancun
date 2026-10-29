const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const sharp = require("sharp");
const {
  extractBrochureFields,
  publicationReadiness,
  analyzeImageBuffer,
  hammingDistance,
} = require("../completion-utils");
const { registryForRole } = require("../feature-registry");

const root = path.join(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("el brochure extrae hechos explícitos y deja null cuando no existen", () => {
  const fields = extractBrochureFields("Residencial Marina Azul\nDesarrollador: Grupo Caribe\nPrecio desde: USD 450,000\nAmenidades: alberca, marina, gimnasio");
  assert.match(String(fields.title.value), /Residencial Marina Azul/i);
  assert.equal(fields.currency.value, "USD");
  assert.equal(fields.priceFrom.value, 450000);
  assert.equal(fields.address.value, null);
  assert.ok(fields.amenities.value.includes("alberca"));
});

test("la calidad de publicación separa bloqueos de recomendaciones", () => {
  const result = publicationReadiness({ titleEs: "Departamento", descriptionEs: "Breve", price: 0, images: [], isPublic: true, status: "active" });
  assert.ok(result.blocking.length > 0);
  assert.ok(result.improvements.length > 0);
  assert.equal(typeof result.score, "number");
});

test("el análisis técnico genera hash exacto y perceptual deterministas", async () => {
  const image = await sharp({ create: { width: 96, height: 96, channels: 3, background: "#1d8f9d" } }).png().toBuffer();
  const first = await analyzeImageBuffer(image, { title: "Prueba", index: 0 });
  const second = await analyzeImageBuffer(image, { title: "Prueba", index: 0 });
  assert.equal(first.exactHash, second.exactHash);
  assert.equal(first.perceptualHash, second.perceptualHash);
  assert.equal(hammingDistance(first.perceptualHash, second.perceptualHash), 0);
  assert.equal(first.width, 96);
});

test("las migraciones nuevas son aditivas y conservan las tablas históricas", () => {
  const server = source("server.js");
  const schema = source("db/schema.sql");
  for (const table of ["seller_favorites", "saved_searches", "tour_requests", "copilot_feedback", "brochure_imports", "image_analysis_cache", "property_versions"]) {
    assert.match(server, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
    assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  const completionMigration = server.slice(server.indexOf("0004-completion-workflows"));
  assert.doesNotMatch(completionMigration, /DROP\s+(TABLE|COLUMN)|TRUNCATE/i);
});

test("favoritos, búsquedas y visitas validan propietario en el backend", () => {
  const server = source("server.js");
  assert.match(server, /app\.get\("\/api\/seller\/favorites", requireRole\("seller"\)/);
  assert.match(server, /WHERE f\.seller_id = \$1/);
  assert.match(server, /app\.patch\("\/api\/seller\/saved-searches\/:id", requireRole\("seller"\)/);
  assert.match(server, /WHERE id = \$1 AND seller_id = \$2/);
  assert.match(server, /app\.get\("\/api\/seller\/tours", requireRole\("seller"\)/);
});

test("el frontend conecta los flujos completos y no deja botones decorativos", () => {
  const html = source("index.html");
  const app = source("app.js");
  for (const id of ["savedSearchForm", "sellerFavorites", "sellerTours", "tourRequestForm", "developmentBrochureImporter", "analyzeListingImages", "copilotActionForm"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const route of ["/api/seller/favorites/", "/api/seller/saved-searches", "/api/tour-requests", "/api/admin/developments/brochures/analyze", "/analyze-images", "/api/admin/copilot/feedback", "/api/admin/copilot/actions/preview"]) {
    assert.ok(app.includes(route), `Falta conexión frontend para ${route}`);
  }
});

test("Copilot sigue aislado del vendedor y exige confirmación para acciones", () => {
  const server = source("server.js");
  assert.deepEqual(registryForRole("seller"), []);
  assert.match(server, /requiresConfirmation: true/);
  assert.match(server, /status !== "previewed"/);
  assert.match(server, /COPILOT_SAFE_ACTIONS/);
  assert.doesNotMatch(server.match(/const COPILOT_SAFE_ACTIONS[^;]+;/s)?.[0] || "", /delete|secret|campaign/i);
});

test("la galería conserva imágenes si solo cambia el contenido", () => {
  const app = source("app.js");
  const server = source("server.js");
  assert.match(app, /return \{ preserveImages: true \}/);
  assert.match(server, /safeBody\.preserveImages === true/);
  assert.match(app, /data-remove-listing-image/);
  assert.match(app, /data-move-image/);
  assert.match(server, /property_versions/);
});

test("las analíticas públicas aceptan una lista cerrada y el panel calcula funnel", () => {
  const server = source("server.js");
  const app = source("app.js");
  assert.match(server, /const PUBLIC_ANALYTICS_EVENTS = new Set/);
  for (const event of ["property_detail", "favorite_added", "property_contact_clicked", "tour_requested", "search_submitted"]) {
    assert.ok(server.includes(`"${event}"`), `Falta el evento permitido ${event}`);
  }
  assert.match(server, /if \(!PUBLIC_ANALYTICS_EVENTS\.has\(eventType\)\)/);
  assert.match(server, /app\.get\("\/api\/admin\/analytics", requireRole\("admin"\)/);
  assert.match(app, /function renderAdminAnalytics\(\)/);
  assert.match(app, /analytics-funnel/);
});

test("las integraciones tienen diagnóstico persistente sin exponer secretos", () => {
  const server = source("server.js");
  const schema = source("db/schema.sql");
  assert.match(server, /0006-integration-diagnostics/);
  assert.match(server, /app\.post\("\/api\/admin\/integrations\/:id\/test", requireRole\("admin"\)/);
  assert.match(server, /INSERT INTO integration_diagnostics/);
  assert.match(server, /JSONB_ARRAY_LENGTH/);
  assert.doesNotMatch(server, /FROM property_images/);
  assert.match(server, /current\.connection === "connected" \? "success" : "blocked"/);
  assert.match(server, /"translation", "jobs"/);
  assert.match(server, /SELECT COUNT\(\*\)::int AS count FROM translation_cache/);
  assert.match(server, /Automatización por evento disponible/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS integration_diagnostics/);
  assert.doesNotMatch(server.match(/function getIntegrationHealth\([\s\S]+?\n\}/)?.[0] || "", /OPENAI_API_KEY\s*:/);
});

test("el dashboard consolida estadísticas para no agotar el pool remoto", async () => {
  const server = source("server.js");
  const statsRoute = server.match(/app\.get\("\/api\/admin\/stats"[\s\S]+?\n\}\);/)?.[0] || "";
  const summaryColumns = server.match(/const PROPERTY_SUMMARY_COLUMNS = `[\s\S]+?`;/)?.[0];
  const mediaPlaceholders = server.match(/function withPropertyMediaPlaceholders\([\s\S]+?\n\}/)?.[0];
  assert.ok(statsRoute && summaryColumns && mediaPlaceholders);
  assert.match(statsRoute, /AS average_response_hours/);
  assert.match(summaryColumns, /AS image_count/);
  assert.match(statsRoute, /SELECT \$\{PROPERTY_SUMMARY_COLUMNS\} FROM properties p/);
  assert.doesNotMatch(statsRoute, /SELECT image, images,/);
  assert.doesNotMatch(summaryColumns, /(?:^|,)\s*p\.(?:image|images)\s*(?:,|$)/m);
  assert.ok((statsRoute.match(/await Promise\.all/g) || []).length <= 1);
  const inventoryContract = require("../inventory-contract");
  for (const multiplier of [1, 40]) {
    const base = { titleEs: "Casa de prueba", type: "Casa", operation: "sale", status: "active", zone: "Puerto Cancun", price: 100, currency: "USD", area: 120, image_count: 1, descriptionEs: "Descripcion documentada de una propiedad de prueba. ".repeat(3) };
    const fixtures = [{}, { image_count: 0 }, { status: "disabled" }, { status: "draft" }, { status: "archived" }, { type: "Desarrollo", developmentData: { stage: "Construccion" } }, { type: "Desarrollo", status: "draft" }, { publicationSection: "typologies" }];
    const rows = Array.from({ length: multiplier }, (_, batch) => fixtures.map((fields, index) => ({ ...base, ...fields, id: `${batch}-${index}` }))).flat();
    let handler, result, inFlight = 0, maximum = 0, conversions = 0;
    const queries = [];
    vm.runInNewContext(`${summaryColumns}\n${mediaPlaceholders}\n${statsRoute}`, {
      app: { get(route, _auth, callback) { assert.equal(route, "/api/admin/stats"); handler = callback; } },
      requireRole: (role) => { assert.equal(role, "admin"); return "authenticated-admin"; },
      inventoryContract, toProperty: (row) => { conversions++; return row; },
      query: async (sql) => {
        queries.push(sql); inFlight++; maximum = Math.max(maximum, inFlight);
        await Promise.resolve(); inFlight--;
        return queries.length === 1 ? { rows: [{ pending_requests: 3 }] } : { rows };
      },
    });
    await handler({}, { json: (value) => { result = value; } }, (error) => { throw error; });
    assert.equal(queries.length, 2, "Two bounded queries regardless of inventory size; no N+1");
    assert.equal(maximum, 1, "Summary and inventory do not compete for pool connections");
    assert.ok(queries.every((sql) => /^\s*SELECT\b/.test(sql)), "Read-only queries");
    assert.equal(conversions, rows.length, "Every row uses the production property adapter");
    assert.equal(result.properties, 3 * multiplier, "Units exclude drafts, archives, developments and typologies");
    assert.equal(result.activeProperties, 2 * multiplier, "Only active units count as active properties");
    assert.equal(result.incompleteProperties, multiplier, "Completeness comes from the shared contract");
    assert.equal(result.developments, multiplier);
    assert.equal(result.pendingRequests, 3);
    assert.equal(result.inventory.pendingRecords.length, multiplier);
  }
});

test("el CRM distingue datos confirmados, inferencias y actividad real", () => {
  const server = source("server.js");
  const app = source("app.js");
  const html = source("index.html");
  assert.match(server, /\/api\/admin\/contacts\/:id\/intelligence/);
  assert.match(server, /confirmed:\s*\{/);
  assert.match(server, /const confirmedPhone = normalizedPhone \? contact\.phone : ""/);
  assert.match(server, /computeLeadScore\(intelligenceContact/);
  assert.match(server, /inferred:\s*\{/);
  assert.match(server, /timeline,/);
  assert.match(app, /data-contact-intelligence/);
  assert.match(app, /HISTORIAL REAL/);
  assert.match(html, /id="contactIntelligenceModal"/);
});

test("WhatsApp conserva estados explícitos, vigencia de QR y reintento acotado", () => {
  const service = source("whatsapp-service.js");
  const app = source("app.js");
  assert.match(service, /qrExpiresAt/);
  assert.match(service, /connection: "qr_expired"/);
  assert.match(service, /phase: "qr_ready"/);
  assert.match(service, /MAX_RECONNECT_ATTEMPTS = 5/);
  assert.match(service, /fetchLatestWaWebVersion/);
  assert.match(service, /browser: baileys\.Browsers\.ubuntu\("Chrome"\)/);
  assert.match(service, /if \(socketVersion !== service\.socketVersion\) return;[\s\S]*saveCreds/);
  assert.match(service, /if \(update\.qr\)[\s\S]*service\.reconnectAttempts = 0/);
  assert.match(service, /retryLimitReached/);
  assert.match(service, /phase: "connection_timeout"/);
  assert.match(app, /connectWhatsapp\(true\)/);
  assert.match(app, /Solicitando el codigo QR a WhatsApp/);
});

test("las alertas guardan el match antes de asociar su notificación", () => {
  const server = source("server.js");
  const insertMatch = server.indexOf("INSERT INTO saved_search_matches");
  const insertNotification = server.indexOf("INSERT INTO notifications", insertMatch);
  const updateMatch = server.indexOf("UPDATE saved_search_matches SET notification_id", insertNotification);
  assert.ok(insertMatch >= 0 && insertNotification > insertMatch && updateMatch > insertNotification);
  assert.match(server, /delivery_status/);
  assert.match(server, /alert_frequency/);
});

test("calidad y vigencia tienen backend, acciones y modal administrativo", () => {
  const server = source("server.js");
  const app = source("app.js");
  assert.match(server, /\/api\/admin\/properties\/:id\/readiness/);
  assert.match(server, /\/api\/admin\/properties\/:id\/verify/);
  assert.match(server, /\/api\/admin\/properties\/:id\/versions/);
  assert.match(app, /data-review-property-quality/);
  assert.match(app, /data-verify-property/);
  assert.match(app, /data-property-history/);
});
