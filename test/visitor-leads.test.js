const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  hashTrackingId,
  locationFromRequest,
  normalizeClientIp,
  normalizeTrackingId,
  parseUserAgent,
  periodToDays,
  sanitizeVisitorPayload,
} = require("../visitor-analytics");

const root = path.resolve(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("los identificadores de medición se validan y solo se guardan como HMAC", () => {
  const id = "visitor-12345678-1234-1234-1234-123456789abc";
  assert.equal(normalizeTrackingId(id), id);
  assert.equal(normalizeTrackingId("short"), "");
  assert.equal(normalizeTrackingId("visitor con espacios que no es valido"), "");
  const first = hashTrackingId(id, "secret-one");
  const repeated = hashTrackingId(id, "secret-one");
  const otherSecret = hashTrackingId(id, "secret-two");
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, repeated);
  assert.notEqual(first, otherSecret);

  const server = source("server.js");
  assert.match(server, /visitorHash \? `visitor-\$\{visitorHash\.slice\(0, 32\)\}`/);
  assert.match(server, /visitor_key_hash CHAR\(64\) NOT NULL UNIQUE/);
  assert.doesNotMatch(server, /visitorId: String\(rawMetadata\.visitorId/);
});

test("la IP y la ubicación aproximada se obtienen de cabeceras conocidas", () => {
  assert.equal(normalizeClientIp("::ffff:203.0.113.24"), "203.0.113.24");
  assert.equal(normalizeClientIp("2001:db8::1"), "2001:db8::1");
  assert.equal(normalizeClientIp("not-an-ip"), "");
  const headers = {
    "cf-ipcountry": "MX",
    "cf-ipcity": "Benito%20Ju%C3%A1rez",
    "cf-region": "Quintana Roo",
  };
  const location = locationFromRequest({
    ip: "::ffff:203.0.113.24",
    get(name) { return headers[name] || ""; },
    socket: {},
  });
  assert.equal(location.ipAddress, "203.0.113.24");
  assert.equal(location.countryCode, "MX");
  assert.equal(location.city, "Benito Juárez");
  assert.equal(location.region, "Quintana Roo");
  assert.ok(location.countryName);
});

test("el dispositivo, navegador y tráfico automatizado se clasifican sin dependencias externas", () => {
  const mobile = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1");
  assert.equal(mobile.deviceType, "mobile");
  assert.equal(mobile.browserName, "Safari");
  assert.equal(mobile.operatingSystem, "iOS");
  assert.equal(mobile.isBot, false);

  const bot = parseUserAgent("Mozilla/5.0 compatible Googlebot/2.1");
  assert.equal(bot.deviceType, "bot");
  assert.equal(bot.isBot, true);
});

test("el payload limita campos, rutas, dimensiones y periodos permitidos", () => {
  const payload = sanitizeVisitorPayload({
    visitorId: "visitor-123456789012",
    sessionId: "session-123456789012",
    pageViewId: "page-123456789012345",
    path: "https://evil.example/path",
    title: `Titulo\u0000${"x".repeat(400)}`,
    viewportWidth: 999999,
    viewportHeight: -20,
  });
  assert.equal(payload.path, "/");
  assert.equal(payload.title.includes("\u0000"), false);
  assert.equal(payload.title.length, 240);
  assert.equal(payload.viewportWidth, 10000);
  assert.equal(payload.viewportHeight, 0);
  assert.equal(periodToDays("7"), 7);
  assert.equal(periodToDays("all"), null);
  assert.equal(periodToDays("365"), 30);
});

test("el servidor registra visitantes, sesiones y páginas de forma agrupada e idempotente", () => {
  const schema = source("db/schema.sql");
  const server = source("server.js");
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_profiles/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_sessions/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_page_views/);
  assert.match(schema, /ON visitor_page_views \(path, created_at DESC\)/);
  assert.match(server, /0008-visitor-lead-analytics/);
  assert.match(server, /app\.post\("\/api\/analytics\/visit"/);
  assert.match(server, /ON CONFLICT \(visitor_key_hash\) DO UPDATE SET/);
  assert.match(server, /ON CONFLICT \(session_key_hash\) DO NOTHING/);
  assert.match(server, /ON CONFLICT \(client_event_hash\) DO NOTHING/);
  assert.match(server, /session_count = session_count \+ \$2/);
  assert.match(server, /analyticsConsent !== true/);
  assert.match(server, /req\.session\.user\?\.role === "admin"/);
  assert.match(server, /VISITOR_ANALYTICS_RETENTION_DAYS/);
  assert.match(server, /DELETE FROM visitor_page_views WHERE created_at/);
});

test("una instalación limpia crea notificaciones antes de las claves foráneas de alertas", () => {
  const server = source("server.js");
  const notifications = server.indexOf("CREATE TABLE IF NOT EXISTS notifications");
  const savedSearchMatches = server.indexOf("CREATE TABLE IF NOT EXISTS saved_search_matches");
  const publicColumns = server.indexOf("ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_public");
  const publicIndex = server.indexOf("CREATE INDEX IF NOT EXISTS idx_properties_public_status_updated");
  const locationColumns = server.indexOf("ALTER TABLE location_options ADD COLUMN IF NOT EXISTS is_active");
  const locationIndex = server.indexOf("CREATE INDEX IF NOT EXISTS idx_location_options_hierarchy");
  const tasksTable = server.indexOf("CREATE TABLE IF NOT EXISTS tasks");
  const tasksIndex = server.indexOf("CREATE INDEX IF NOT EXISTS idx_tasks_status_due");
  assert.ok(notifications > 0);
  assert.ok(savedSearchMatches > notifications);
  assert.ok(publicIndex > publicColumns);
  assert.ok(locationIndex > locationColumns);
  assert.ok(tasksIndex > tasksTable);
});

test("el apartado Leads expone filtros, recorrido, paginación y exportación solo al administrador", () => {
  const html = source("index.html");
  const app = source("app.js");
  const server = source("server.js");
  const styles = source("styles.css");
  assert.match(html, /data-admin-section="visitor-leads"/);
  assert.match(html, /data-admin-section-panel="visitor-leads"/);
  assert.match(html, /id="visitorLeadPeriod"/);
  assert.match(html, /id="visitorLeadIdentity"/);
  assert.match(html, /id="visitorLeadCountry"/);
  assert.match(html, /id="visitorLeadDevice"/);
  assert.match(html, /data-i18n="visitorPeriod30"/);
  assert.match(html, /data-i18n="visitorIdentityAnonymous"/);
  assert.match(html, /data-i18n="visitorDeviceMobile"/);
  assert.match(html, /styles\.css\?v=20260905\.1/);
  assert.match(html, /app\.js\?v=20260905\.1/);
  assert.match(html, /id="visitorLeadRows"/);
  assert.match(app, /function renderVisitorLeads\(\)/);
  assert.match(app, /function refreshVisitorLeads/);
  assert.match(app, /function exportVisitorLeadsCsv/);
  assert.match(app, /visitorLeadSearchTimer/);
  assert.match(app, /data-visitor-offset/);
  assert.match(app, /element\.closest\("#panelLanguageToggle, #visitorLeadsCard"\)/);
  assert.match(app, /panelLanguageLabel\.textContent = state\.lang === "es" \? "English" : "Español"/);
  assert.match(server, /app\.get\("\/api\/admin\/visitor-leads", requireRole\("admin"\)/);
  assert.match(server, /recent_pages/);
  assert.match(server, /recent_sessions/);
  assert.match(styles, /\.visitor-leads-filters/);
  assert.match(styles, /\.visitor-table-wrap/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.visitor-leads-heading/);
});

test("el cliente mide solo con consentimiento, conserva identidad y excluye administradores", () => {
  const app = source("app.js");
  assert.match(app, /localStorage\.getItem\("pcc-cookie-consent"\) === "all"/);
  assert.match(app, /localStorage\.getItem\("pcc\.analyticsVisitor"\)/);
  assert.match(app, /sessionStorage\.getItem\("pcc\.analyticsSession"\)/);
  assert.match(app, /30 \* 60 \* 1000/);
  assert.match(app, /state\.session\?\.role === "admin"/);
  assert.match(app, /analyticsConsent: true/);
  assert.match(app, /void trackPageVisit\(\)/);
});

test("privacidad y cookies describen la medición opcional y la ubicación aproximada", () => {
  const pages = source("seo-pages.js");
  assert.match(pages, /Medición opcional de audiencia/);
  assert.match(pages, /Optional audience measurement/);
  assert.match(pages, /dirección IP y país, región o ciudad aproximados/);
  assert.match(pages, /Administrative sessions are excluded/);
  assert.match(pages, /identificador seudónimo propio del visitante/);
  assert.match(pages, /page-level navigation detail is deleted/i);
});
