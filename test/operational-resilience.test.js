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
  const archiveRoute = source.match(/app\.delete\("\/api\/admin\/properties\/:id"[\s\S]*?\n\}\);/);
  assert.ok(archiveRoute, "debe existir la ruta administrativa de archivado");
  assert.match(archiveRoute[0], /SET status = 'archived', is_public = FALSE/);
  assert.doesNotMatch(archiveRoute[0], /DELETE FROM properties/);
  assert.match(source, /app\.patch\("\/api\/admin\/properties\/:id\/status"/);
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
  assert.match(app, /error\.status === 503 \|\| error\.code === "DATABASE_UNAVAILABLE"/);
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
