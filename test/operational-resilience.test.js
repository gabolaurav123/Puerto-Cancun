const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function adminResourceHarness() {
  const app = read("app.js");
  const loader = app.slice(app.indexOf("const adminResources ="), app.indexOf("async function loadPanelData()"));
  const navigation = app.match(/async function loadActiveAdminSection\([^\n]+[\s\S]*?\n\}/)[0];
  const state = { session: { id: "qa", role: "admin" }, adminSection: "dashboard", files: [], whatsapp: {} };
  const calls = [], renders = [], notices = [];
  const api = (route) => new Promise((resolve, reject) => calls.push({ route, resolve, reject }));
  const actions = vm.runInNewContext(loader + "\n" + navigation + "\n({ readAdminResource, loadActiveAdminSection })", {
    state, api, renderActiveAdminSection: (section) => renders.push(section), refreshIcons() {}, showToast: (message) => notices.push(message),
  });
  return { ...actions, state, calls, renders, notices };
}

test("Inicio usa solo sus recursos y una sección abandonada no vuelve a dibujar el panel", async () => {
  const { state, calls, renders, notices, loadActiveAdminSection } = adminResourceHarness();
  const dashboard = loadActiveAdminSection("dashboard");
  assert.deepEqual(calls.map((call) => call.route).sort(), [
    "stats", "properties", "requests", "guest-sale-requests", "leads", "tasks", "valuations", "whatsapp/overview", "notifications",
  ].map((route) => "/api/admin/" + route).sort());
  state.adminSection = "blog";
  const blog = loadActiveAdminSection("blog");
  const blogCall = calls.at(-1);
  assert.equal(blogCall.route, "/api/admin/blog");
  blogCall.resolve({ posts: [{ id: "post" }] });
  await blog;
  for (const call of calls.slice(0, -1)) call.resolve({});
  await dashboard;
  assert.deepEqual(renders, ["blog"]);
  assert.deepEqual(notices, []);
  assert.equal(state.blogPosts[0].id, "post");
});

test("se comparten lecturas por usuario, se ignoran respuestas obsoletas y se reintentan fallos", async () => {
  const { state, calls, readAdminResource } = adminResourceHarness();
  const old = readAdminResource("blog");
  assert.equal(old, readAdminResource("blog"));
  const fresh = readAdminResource("blog", null, true);
  assert.notEqual(old, fresh);
  calls[1].resolve({ posts: [{ id: "new" }] });
  await fresh;
  calls[0].resolve({ posts: [{ id: "old" }] });
  await old;
  assert.equal(state.blogPosts[0].id, "new");
  assert.equal(readAdminResource("blog"), fresh);
  const abandoned = readAdminResource("blog", null, true);
  state.session = { id: "other", role: "admin" };
  const failed = readAdminResource("blog");
  calls[2].resolve({ posts: [{ id: "previous-user" }] });
  await abandoned;
  assert.equal(state.blogPosts[0].id, "new");
  calls[3].reject(new Error("offline"));
  await assert.rejects(failed, /offline/);
  const retry = readAdminResource("blog");
  calls[4].resolve({ posts: [{ id: "retried" }] });
  await retry;
  assert.equal(state.blogPosts[0].id, "retried");
});

test("los archivos de distintos ámbitos se combinan aunque respondan fuera de orden", async () => {
  const { state, calls, readAdminResource } = adminResourceHarness();
  const general = readAdminResource("generalFiles");
  const property = readAdminResource("propertyFiles");
  const development = readAdminResource("developmentFiles");
  calls[2].resolve({ files: [{ id: "d", libraryScope: "development" }] });
  calls[0].resolve({ files: [{ id: "g", libraryScope: "general" }] });
  calls[1].resolve({ files: [{ id: "p", libraryScope: "property" }] });
  await Promise.all([general, property, development]);
  const update = readAdminResource("propertyFiles", null, true);
  calls[3].resolve({ files: [{ id: "p2", libraryScope: "property" }] });
  await update;
  assert.deepEqual(Array.from(state.files, (file) => file.id).sort(), ["d", "g", "p2"]);
});

test("el acceso público y el vendedor conservan inventario y el administrador carga solo su colección privada", async () => {
  const loader = read("app.js").match(/async function loadPublicData\(\)[\s\S]*?\n\}/)[0];
  for (const [page, user, needsPublic, needsCovers] of [
    ["panel", { id: "admin", role: "admin" }, false, false],
    ["panel", { id: "seller", role: "seller" }, true, false],
    ["panel", null, false, false],
    ["home", { id: "admin", role: "admin" }, true, true],
    ["catalog", null, true, true],
  ]) {
    const calls = [], rendered = [];
    const state = { config: {}, platform: {} };
    const api = async (route) => {
      calls.push(route);
      if (route === "/api/session") return { user, csrfToken: "csrf" };
      if (route === "/api/properties") return { properties: [{ id: "public" }] };
      return {};
    };
    await vm.runInNewContext(loader + "\nloadPublicData()", {
      api, state, document: { body: { dataset: { page } } },
      mountPublicComparison: () => rendered.push("compare"), updateHomeEditorialImages: () => rendered.push("covers"),
      renderCurrencyExchange() {},
    });
    assert.equal(calls.filter((route) => route === "/api/properties").length, Number(needsPublic));
    assert.equal(state.session, user);
    assert.equal(state.csrfToken, "csrf");
    assert.equal(state.properties.length, Number(needsPublic));
    assert.deepEqual(rendered, needsCovers ? ["compare", "covers"] : []);
  }
});

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
  const restore = app.match(/async function restoreListingDraft\([^\n]+[\s\S]*?\n\}/)?.[0] || "";
  const persistentRead = restore.indexOf("await readPersistentDraft");
  const editGuard = restore.indexOf("listingDraftSlot(form) !== slot");
  const dirtyGuard = restore.indexOf('form.dataset.dirty === "true"');

  assert.ok(persistentRead > -1, "debe mantenerse la recuperación persistente");
  assert.ok(editGuard > persistentRead, "la recuperación tardía debe respetar una edición abierta");
  assert.ok(dirtyGuard > persistentRead, "la recuperación tardía debe respetar cambios recién escritos");
  assert.match(restore, /form.dataset.draftGeneration !== generation/);
});

test("la edición conserva una identidad estable aunque el campo oculto se reinicie", () => {
  const app = read("app.js");
  const submit = app.match(/async function listingSubmit\(event\)[\s\S]*?\n\}/)?.[0] || "";
  const edit = app.match(/function editListing\(id\)[\s\S]*?\n\}/)?.[0] || "";
  const reset = app.match(/function resetListingForm\(clearDraft = true\)[\s\S]*?\n\}/)?.[0] || "";

  assert.match(app, /function listingFormRecordId\(form = \$\("#listingForm"\)\)/);
  assert.match(app, /form\.dataset\.editingId/);
  assert.match(edit, /setListingFormRecordId\(form, property\.id\)/);
  assert.match(submit, /const id = listingFormRecordId\(form\)/);
  assert.match(reset, /setListingFormRecordId\(form, ""\)/);
});

test("el modo de desarrollo no depende de un campo oculto que pueda reiniciarse", () => {
  const app = read("app.js");
  const submit = app.match(/async function listingSubmit\(event\)[\s\S]*?\n\}/)?.[0] || "";
  const snapshot = app.match(/function listingDraftSnapshot\(form\)[\s\S]*?\n\}/)?.[0] || "";

  assert.match(app, /function listingFormIsDevelopment\(form = \$\("#listingForm"\)\)/);
  assert.match(app, /form\?\.dataset\.listingMode/);
  assert.match(submit, /const developmentMode = listingFormIsDevelopment\(form\)/);
  assert.match(submit, /field\("publicationSection"\)\.value = developmentMode \? "developments" : "properties"/);
  assert.match(submit, /publicationSection: developmentMode \? "developments" : "properties"/);
  assert.match(snapshot, /fields\.publicationSection = listingFormIsDevelopment\(form\) \? "developments" : "properties"/);
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
    assert.ok(require("../site-language").en[key], `falta la traducción ${key}`);
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
  assert.match(workflow, /node scripts\/deploy-smoke\.js/);
  assert.match(workflow, /EXPECTED_ASSET_VERSION: \$\{\{ steps\.expected\.outputs\.assetVersion \}\}/);
  assert.match(read("scripts/deploy-smoke.js"), /read\("api\/version"\)/);
});

test("el administrador tiene auditoría y un criterio único de propiedades incompletas", () => {
  const server = read("server.js");
  const app = read("app.js");
  assert.match(server, /app\.get\("\/api\/admin\/activity"/);
  assert.match(server, /unitItems\.filter\(\(property\) => !inventoryContract\.quality\(property\)\.complete\)/);
  assert.match(app, /inventoryModule\?\.currentSnapshot\(state\.properties,\s*state\.adminPortalAreas\)\.records/);
  assert.match(app, /inventoryModule\.selectRecords\(records, filters,/);
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

test("la portada no renderiza destacadas y mantiene el acceso al catálogo completo", () => {
  const app = read("app.js");
  const index = read("index.html");
  assert.match(app, /if \(isHome\) \{\s*grid\.innerHTML = ""/);
  assert.match(index, /href="\/propiedades"[^>]*data-i18n="navSearch"/);
  assert.match(index, /href="\/propiedades\/en-venta"[^>]*data-i18n="heroBuyCta"/);
});
