const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("el panel conserva los módulos disponibles cuando una API falla", () => {
  const source = read("app.js");
  const server = read("server.js");
  assert.match(source, /async function loadPanelData\(\)[\s\S]*Promise\.allSettled/);
  assert.match(source, /const sellerResults = await Promise\.allSettled/);
  assert.match(source, /failedModules/);
  assert.match(source, /#networkStatus/);
  assert.match(server, /function publicRequestCanDegrade/);
  assert.match(server, /function anonymousSession/);
});

test("las publicaciones se archivan y pueden reactivarse sin pérdida destructiva", () => {
  const source = read("server.js");
  const app = read("app.js");
  const html = read("index.html");
  const archiveRoute = source.match(/app\.delete\("\/api\/admin\/properties\/:id"[\s\S]*?\n\}\);/);
  assert.ok(archiveRoute, "debe existir la ruta administrativa de archivado");
  assert.match(archiveRoute[0], /SET status = 'archived', is_public = FALSE/);
  assert.doesNotMatch(archiveRoute[0], /DELETE FROM properties/);
  assert.match(source, /app\.patch\("\/api\/admin\/properties\/:id\/status"/);
  assert.match(app, /property\.status === "archived"/);
  assert.match(app, /Eliminar desarrollo/);
  assert.match(app, /Eliminar propiedad/);
  assert.match(html, /id="deleteListingFromForm"/);
});

test("un borrador local tardío no reemplaza una edición ya abierta", () => {
  const app = read("app.js");
  const restore = app.match(/async function restoreListingDraft\(\)[\s\S]*?\n\}/)?.[0] || "";
  const persistentRead = restore.indexOf("await readPersistentDraft");
  const editGuard = restore.indexOf('formField(form, "id")?.value');
  const dirtyGuard = restore.indexOf('form.dataset.dirty === "true"');

  assert.ok(persistentRead > -1, "debe mantenerse la recuperación persistente");
  assert.ok(editGuard > persistentRead, "la recuperación tardía debe respetar una edición abierta");
  assert.ok(dirtyGuard > persistentRead, "la recuperación tardía debe respetar cambios recién escritos");
});

test("el API público nunca expone inventario privado aunque exista una sesión administrativa", () => {
  const source = read("server.js");
  const route = source.match(/app\.get\("\/api\/properties"[\s\S]*?\n\}\);/)?.[0] || "";
  assert.match(route, /getPublicProperties\(\)/);
  assert.doesNotMatch(route, /req\.session\.user/);
  assert.doesNotMatch(route, /SELECT \$\{PROPERTY_SUMMARY_COLUMNS\} FROM properties p ORDER BY/);
});

test("el idioma elegido se aplica antes de que terminen las solicitudes públicas", () => {
  const source = read("app.js");
  const initStart = source.indexOf("async function init()");
  const initEnd = source.indexOf("\n}\n\ninit();", initStart);
  const initSource = source.slice(initStart, initEnd);
  const immediateTranslation = initSource.indexOf("applyTranslations({ renderPanelContent: false });");
  const publicLoad = initSource.indexOf("await loadPublicData()");

  assert.ok(immediateTranslation > -1, "la interfaz estática debe traducirse inmediatamente");
  assert.ok(publicLoad > -1, "la carga de datos públicos debe mantenerse");
  assert.ok(immediateTranslation < publicLoad, "la traducción no debe esperar a la API pública");
});

test("la experiencia pública en inglés traduce confianza, legales y controles de catálogo", () => {
  const app = read("app.js");
  const html = read("index.html");
  for (const key of [
    "trustSignalsLabel",
    "trustInventoryTitle",
    "trustPrivacyTitle",
    "trustTrackingTitle",
    "privacyNotice",
    "termsConditions",
    "cookiePolicy",
    "saveFavorite",
    "addComparison",
  ]) {
    assert.match(app, new RegExp(`${key}:`), `falta la traducción ${key}`);
  }
  assert.match(app, /data-i18n-aria-label/);
  assert.match(html, /data-i18n-aria-label="trustSignalsLabel"/);
  assert.match(html, /data-i18n="countryPrefix"/);
  assert.match(html, /data-i18n="nationalNumber"/);
});

test("el despliegue expone versión, readiness y recursos con huella", () => {
  const server = read("server.js");
  const workflow = read(".github/workflows/deploy.yml");
  assert.match(server, /app\.get\("\/api\/version"/);
  assert.match(server, /app\.get\("\/ready"/);
  assert.match(server, /staticAssetVersion/);
  assert.match(server, /installShutdownHandlers\(server\)/);
  assert.match(workflow, /npm run verify/);
  assert.match(workflow, /SEENODE_DEPLOY_HOOK_URL/);
  assert.match(workflow, /\/api\/version/);
});

test("el administrador tiene auditoría y un criterio único de propiedades incompletas", () => {
  const server = read("server.js");
  const app = read("app.js");
  assert.match(server, /app\.get\("\/api\/admin\/activity"/);
  assert.match(server, /incompleteProperties\.rows\.filter\(\(property\) => propertyQuality\(property\)\.score < 70\)/);
  assert.match(app, /filters\.quality === "incomplete" && \(property\.qualityScore \|\| 0\) >= 70/);
  assert.match(app, /data-admin-metric/);
});

test("la automatización de calidad se ejecuta para cambios y pull requests", () => {
  const quality = read(".github/workflows/quality.yml");
  assert.match(quality, /pull_request:/);
  assert.match(quality, /branches: \[main\]/);
  assert.match(quality, /npm ci/);
  assert.match(quality, /npm run verify/);
});

test("el catálogo inicial tolera ubicaciones existentes sin bloquear PostgreSQL", () => {
  const server = read("server.js");
  const catalog = read("location-catalog.js");
  assert.match(server, /reconcileLocationSeedOptions\(client, seedLocationOptions\)/);
  assert.match(catalog, /parent_id IS NOT DISTINCT FROM \$3/);
  assert.match(catalog, /ON CONFLICT DO NOTHING/);
  assert.match(catalog, /resolvedIds\.get\(option\.parentId\)/);
});

test("el acceso distingue una base indisponible de una contraseña incorrecta", () => {
  const server = read("server.js");
  const app = read("app.js");
  assert.match(server, /code: "DATABASE_UNAVAILABLE"/);
  assert.match(server, /Tus cuentas y datos permanecen guardados/);
  assert.match(app, /error\.code = data\.code/);
  assert.match(app, /error\.code === "DATABASE_UNAVAILABLE"/);
  assert.doesNotMatch(app, /error\.status === 503 \|\| error\.code === "DATABASE_UNAVAILABLE"/);
  assert.match(app, /loginUnavailable/);
});

test("las galerías descargan una imagen y variantes dimensionadas bajo demanda", () => {
  const server = read("server.js");
  const seo = read("seo-pages.js");
  const app = read("app.js");
  assert.match(server, /END AS selected_image/);
  assert.match(server, /\[240, 640, 1200, 1600\]/);
  assert.match(server, /\.webp\(\{ quality:/);
  assert.match(seo, /data-gallery-src/);
  assert.match(seo, /optimizedPublicImage\(image, 240\)/);
  assert.match(app, /const loadDeferredImage/);
  assert.match(app, /IntersectionObserver/);
});

test("la portada limita el inventario y enlaza al catálogo completo", () => {
  const app = read("app.js");
  const index = read("index.html");
  assert.match(app, /properties\.slice\(0, 6\)/);
  assert.match(index, /id="homeCatalogCta"/);
  assert.match(index, /id="homeCatalogLink" href="\/propiedades"/);
});
