const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const inventory = require("../inventory-contract");
const admin = require("../admin-inventory-ui");
const root = path.resolve(__dirname, "..");

function property(id, overrides = {}) {
  return { id, titleEs: `Publicacion de prueba ${id}`, type: "Casa", publicationSection: "properties", operation: "sale", zone: "Puerto Cancun", city: "Cancun", address: "Direccion original de prueba", price: 100, currency: "USD", priceUnit: "total", area: 120, images: ["/test-cover.png"], descriptionEs: "Descripcion documentada para una prueba aislada. ".repeat(3), status: "active", isPublic: true, featured: false, ...overrides };
}

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

if (!process.argv.includes("--serve")) {
  test("browser global exports mount and the same pure helpers as CommonJS", () => {
    const context = vm.createContext({ PccInventory: inventory });
    vm.runInContext(fs.readFileSync(path.join(root, "admin-inventory-ui.js"), "utf8"), context);
    assert.equal(typeof context.PccAdminInventory.mount, "function");
    assert.deepEqual(Object.keys(context.PccAdminInventory).sort(), Object.keys(admin).sort());
  });

  test("mount is harmless without DOM or without an administrative session", () => {
    assert.equal(admin.mount({ properties: [] }).mounted, false);
    assert.equal(admin.mount({ session: { role: "seller" } }, { document: {} }).mounted, false);
  });

  test("T06/T14/T15: unique IDs, separate entities, repeated MLS never merged", () => {
    const p = property("unit", { mls: "1707" });
    const project = property("project", { type: "Desarrollo", publicationSection: "developments", mls: "1707" });
    const report = admin.snapshot([p, p, project, property(null)]);
    assert.equal(report.total, 2);
    assert.equal(report.duplicateRows, 1);
    assert.equal(report.unidentifiedRows, 1);
    assert.deepEqual(report.counts.map((row) => row.total), [1, 1]);
    assert.deepEqual(report.records[0].duplicateMlsIds, ["unit", "project"]);
    assert.equal(admin.filterListings([p, project], { status: "all", review: true }, "properties").length, 1);
  });

  test("T06: location alias resolution does not mutate geography or input", () => {
    const items = freeze([property("a", { zone: "Costa Mujeres" }), property("b", { zone: "Punta Sam" }), property("c"), property("d", { zone: "Huayacan" }), property("e", { zone: "Colosio", city: "Playa del Carmen" }), property("f", { zone: "Colosio", city: "" })]);
    const original = JSON.stringify(items);
    const report = admin.snapshot(items);
    assert.deepEqual(report.records.map((r) => r.location.id), ["zona-hotelera", "zona-hotelera", "puerto-cancun", "cancun-city", "fuera-de-cancun", ""]);
    assert.equal(JSON.stringify(items), original);
    assert.equal(report.counts[0].locations.reduce((sum, location) => sum + location.total, 0), items.length);
    assert.equal(admin.filterListings(items, { status: "all", location: "pending" }, "properties")[0].id, "f");
  });

  test("source is shown only when supplied, never inferred from location", () => {
    const rows = admin.snapshot([property("a"), property("b", { catalogData: { provenance: { file: "inventario.xlsx", sheet: "Hoja 2", row: 17 } } }), property("c", { sourceRequestId: "request-3" })]).records;
    assert.equal(rows[0].source, "Origen no informado");
    assert.equal(rows[1].source, "inventario.xlsx / Hoja 2 / 17");
    assert.equal(rows[2].source, "Solicitud request-3");
  });

  test("T17: complete uses quality.complete, never qualityScore threshold 70", () => {
    const complete = property("complete", { qualityScore: 0 });
    const incomplete = property("incomplete", { images: [], qualityScore: 100 });
    assert.ok(inventory.quality(incomplete).score >= 70);
    assert.deepEqual(admin.filterListings([complete, incomplete], { quality: "ready" }, "properties").map((p) => p.id), ["complete"]);
    assert.deepEqual(admin.filterListings([complete, incomplete], { quality: "incomplete" }, "properties").map((p) => p.id), ["incomplete"]);
  });

  test("T17/T43: placeholder descriptions are missing and land does not require bedrooms", () => {
    const land = property("land", { type: "Terreno", lot: 400, area: null, beds: null });
    const placeholder = property("placeholder", { descriptionEs: "POR DEFINIR" });
    const report = admin.snapshot([land, placeholder]);
    assert.equal(report.records[0].quality.complete, true);
    assert.equal(report.records[1].quality.complete, false);
    assert.ok(report.records[1].quality.missingFields.some((item) => item.field === "description"));
    assert.equal(report.records[1].quality.issues[0].code, "placeholder-description");
  });

  test("T17: developments follow the project's own requirements", () => {
    const project = property("project", { type: "Desarrollo", publicationSection: "developments", price: null, area: null, operation: null, developmentData: { stage: "En construccion" } });
    assert.equal(admin.snapshot([project]).records[0].quality.complete, inventory.quality(project).complete);
    assert.equal(admin.filterListings([project], { quality: "ready" }, "developments").length, 1);
    assert.equal(admin.filterListings([project], {}, "properties").length, 0);
    const unclassified = { ...project, developmentData: {} };
    assert.equal(admin.filterListings([unclassified], { quality: "ready" }, "developments").length, 0);
    assert.ok(inventory.quality(unclassified).missingFields.some((field) => field.field === "commercialization"));
  });

  test("complete editorial fields and contradictions remain separate sets", () => {
    const conflict = property("conflict", { titleEs: "Departamento en venta", type: "Casa" });
    assert.equal(inventory.quality(conflict).complete, true);
    assert.equal(admin.filterListings([conflict], { quality: "ready", review: true }, "properties").length, 1);
    assert.equal(admin.filterListings([conflict], { quality: "incomplete" }, "properties").length, 0);
  });

  test("T10/T13: location, featured, quality and legacy filters intersect", () => {
    const items = [property("a", { featured: true }), property("b"), property("c", { featured: true, zone: "Costa Mujeres" }), property("d", { featured: true, operation: "rent" })];
    const filters = freeze({ location: "puerto-cancun", featured: true, quality: "ready", type: "Casa", operation: "sale", search: "prueba" });
    assert.deepEqual(admin.filterListings(items, filters, "properties").map((p) => p.id), ["a"]);
    assert.equal(filters.location, "puerto-cancun");
    assert.equal(admin.filterListings(items, { featured: "false" }, "properties").length, 4);
  });

  test("T16: missing-cover drilldown includes drafts/archives only with explicit all scope", () => {
    const items = [property("active", { images: [] }), property("draft", { status: "draft", images: [] }), property("archived", { status: "archived", images: [] }), property("covered")];
    assert.deepEqual(admin.filterListings(items, { missingCover: true }, "properties").map((p) => p.id), ["active"]);
    assert.deepEqual(admin.filterListings(items, { missingCover: true, status: "all" }, "properties").map((p) => p.id), ["active", "draft", "archived"]);
    assert.equal(admin.filterListings(items, { missingCover: true, status: "draft" }, "properties")[0].id, "draft");
  });

  test("T13/T14: highlighted drafts stay separate from published visibility", () => {
    const items = [property("active", { featured: true }), property("draft", { featured: true, status: "draft" }), property("private", { featured: true, isPublic: false })];
    assert.deepEqual(admin.filterListings(items, { featured: true, status: "all" }, "properties").map((p) => p.id), ["active", "draft", "private"]);
    assert.deepEqual(admin.filterListings(items, { featured: true, status: "all", publicOnly: true }, "properties").map((p) => p.id), ["active"]);
  });

  test("T19/T44: price summaries never mix entities, currencies, operations, bases or periods", () => {
    const items = [property("usd"), property("mxn", { currency: "MXN" }), property("sqm", { priceUnit: "sqm", price: 4200 }), property("month", { operation: "rent", catalogData: { rentPeriod: "month" } }), property("day", { operation: "rent", catalogData: { rentPeriod: "day" } }), property("unclassified", { operation: "rent" }), property("project", { type: "Desarrollo", publicationSection: "developments" })];
    const groups = admin.priceGroups(admin.snapshot(items).records);
    assert.equal(groups.length, 7);
    assert.ok(groups.filter((group) => group.comparable).every((group) => group.n === 1));
    assert.equal(groups.find((group) => group.basis === "sqm").median, 4200);
    assert.equal(groups.find((group) => group.period === "unclassified").n, 0);
    assert.equal(groups.find((group) => group.period === "unclassified").excluded, 1);
  });

  test("O34: price order separates comparable groups, ignores FX and keeps missing prices last", () => {
    const items = freeze([property("usd-200", { price: 200, priceMxn: 1 }), property("mxn-20", { currency: "MXN", price: 20, priceUsd: 999999 }), property("usd-100", { price: 100, priceMxn: 999999 }), property("usd-missing", { price: null, priceMxn: 1 }), property("rent-day", { operation: "rent", price: 4, catalogData: { rentPeriod: "day" } }), property("rent-month", { operation: "rent", price: 1, catalogData: { rentPeriod: "month" } }), property("rent-unknown-a", { operation: "rent", price: 900 }), property("rent-unknown-b", { operation: "rent", price: 2 }), property("sqm", { price: 4200, priceUnit: "sqm" }), property("from", { price: 500, priceUnit: "from" })]);
    const original = JSON.stringify(items);
    for (const direction of ["asc", "desc"]) {
      const result = admin.sortListingsByPrice(items, direction);
      assert.deepEqual(result.filter((p) => p.id.startsWith("usd-")).map((p) => p.id), direction === "asc" ? ["usd-100", "usd-200", "usd-missing"] : ["usd-200", "usd-100", "usd-missing"]);
      assert.deepEqual(result.slice(-2).map((p) => p.id), ["rent-unknown-a", "rent-unknown-b"]);
      const keys = result.map((p) => admin.priceGroupOf(p).key);
      assert.equal(keys.filter((key, i) => !i || key !== keys[i - 1]).length, new Set(keys).size);
    }
    assert.equal(JSON.stringify(items), original);
  });

  test("O38: exact ID cohorts include archived rows, distinguish repeated MLS and keep zero empty", () => {
    const items = freeze([property("a", { mls: "1707", images: [], status: "archived" }), property("b", { mls: "1707", images: [] }), property("a-long", { images: [] }), property("project", { type: "Desarrollo", publicationSection: "developments", images: [] })]);
    assert.deepEqual(admin.filterListings(items, { status: "all", ids: ["a"], missingCover: true }, "properties").map((p) => p.id), ["a"]);
    assert.deepEqual(admin.filterListings(items, { status: "all", ids: [] }, "properties"), []);
    assert.deepEqual(admin.filterListings(items, { status: "all", ids: ["project"] }, "properties"), []);
    assert.deepEqual(admin.filterListings(items, { status: "all", ids: ["a"], featured: true }, "properties"), []);
  });

  test("O34: unclassified price criteria are excluded and native renderers contain no FX ordering", () => {
    const items = [property("currency", { currency: null }), property("operation", { operation: null }), property("basis", { priceUnit: null }), property("period", { operation: "rent" })];
    assert.ok(admin.priceGroups(admin.snapshot(items).records).every((group) => group.n === 0 && group.excluded === 1 && group.median === null && group.mean === null));
    const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
    const listings = app.match(/function renderAdminListings\([^]*?\n}/)[0];
    assert.doesNotMatch(listings, /exchangeRate|priceMxn|priceUsd/);
    assert.match(listings, /sortListingsByPrice/);
    assert.match(listings, /priceGroupOf/);
    assert.doesNotMatch(app.match(/function renderAdminInsights\([^]*?\n}/)[0], /priceUsd|const average/);
  });

  test("T19: median, mean, valid N and exclusions are calculated without null-to-zero coercion", () => {
    const items = [100, 200, 900, null, "", 0, -2, "not-a-number"].map((price, index) => property(String(index), { price }));
    const [group] = admin.priceGroups(admin.snapshot(items).records);
    assert.equal(group.total, 8);
    assert.equal(group.n, 3);
    assert.equal(group.excluded, 5);
    assert.equal(group.median, 200);
    assert.equal(group.mean, 400);
    assert.equal(admin.priceGroups(admin.snapshot([property("a", { price: 100 }), property("b", { price: 300 })]).records)[0].median, 200);
  });

  test("T19: missing prices yield null statistics, never a fabricated zero", () => {
    const [group] = admin.priceGroups(admin.snapshot([property("none", { price: null }), property("request", { price: null, catalogData: { priceOnRequest: true } })]).records);
    assert.equal(group.n, 0);
    assert.equal(group.median, null);
    assert.equal(group.mean, null);
    assert.equal(group.excluded, 2);
    assert.deepEqual(admin.priceGroups([]), []);
  });

  test("T14/T19: duplicate row IDs do not double the price sample", () => {
    const item = property("same", { price: 100 });
    assert.equal(admin.priceGroups(admin.snapshot([item, item]).records)[0].n, 1);
  });

  test("T18: empty references are presentation only, never inventory records", () => {
    const items = freeze([]);
    const report = admin.snapshot(items);
    assert.equal(report.total, 0);
    assert.deepEqual(report.records, []);
    assert.deepEqual(admin.filterListings(items, { status: "all" }, "properties"), []);
    assert.ok(report.counts.every((group) => group.total === 0));
  });

  test("search by immutable internal ID remains distinct from repeated MLS", () => {
    const items = [property("unit-1", { mls: "1707" }), property("unit-2", { mls: "1707" })];
    assert.equal(admin.filterListings(items, { search: "1707" }, "properties").length, 2);
    assert.deepEqual(admin.filterListings(items, { search: "unit-2" }, "properties").map((p) => p.id), ["unit-2"]);
  });

  test("module stays read-only for inventory, persistence and network", () => {
    const source = fs.readFileSync(path.join(root, "admin-inventory-ui.js"), "utf8");
    assert.doesNotMatch(source, /XMLHttpRequest|localStorage|sessionStorage|\.properties\s*=|\.properties\.(push|splice)|method:\s*"(?:POST|PUT|PATCH|DELETE)"/);
    assert.match(source, /window\.fetch\(`\/api\/admin\/properties\/\$\{encodeURIComponent\(id\)\}\/verify`, \{ method: "GET"/);
    assert.match(source, /ctx\.helpers\.setSection\(entity\);[\s\S]+ctx\.state\.adminListingFilters =/);
  });

  test("O34/O36/O37/O38 browser integration uses real renderers, exact cohorts and statistics navigation", { skip: !process.env.PCC_ADMIN_BROWSER_QA, timeout: 90000 }, async () => {
    const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
    const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
    try {
      const context = await browser.newContext();
      await context.route("**/*", (route) => route.request().url() === "http://127.0.0.1:31889/" ? route.fulfill({ contentType: "text/html", body: "<!doctype html><html><head></head><body></body></html>" }) : route.request().method() === "GET" && /\/api\/admin\/properties\/[^/]+\/verify$/.test(route.request().url())
        ? route.fulfill({ contentType: "application/json", body: JSON.stringify({ reviewPolicy: { properties: 30, developments: 60 } }) }) : route.abort());
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:31889/");
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
      const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
      const sidebar = html.match(/<aside class="admin-sidebar"[\s\S]*?<\/aside>/)[0];
      const statistics = html.slice(html.indexOf('<section id="adminStatistics"'), html.indexOf('<div class="admin-command-bar"'));
      const renderers = ["renderStats", "renderAdminInsights", "renderAdminListings", "mountAdminInventory", "openAdminMetric", "setAdminSection", "updateAdminShell", "normalizeSearchText", "listingEditorTitle"].map((name) => app.match(new RegExp(`function ${name}\\([^]*?\\n}`))[0]).join("\n");
      assert.doesNotMatch(renderers.match(/function renderAdminListings\([^]*?\n}/)[0], /exchangeRate|priceMxn|priceUsd/);
      assert.doesNotMatch(renderers.match(/function renderAdminInsights\([^]*?\n}/)[0], /priceUsd|const average/);
      const items = [property("unit-low", { price: 100, featured: true }), property("unit-high", { price: 300 }), property("unit-mxn", { price: 50, currency: "MXN" }), property("unit-null", { price: null }), property("missing", { status: "draft", images: [], mls: "1707" }), property("missing-long", { status: "archived", images: [], mls: "1707" }), property("project", { publicationSection: "developments", type: "Desarrollo", images: [], developmentData: { stage: "Construccion" } })];
      const initial = { session: { id: "qa-admin", role: "admin", internalRole: "admin" }, lang: "es", sidebarCollapsed: false, adminSection: "dashboard", adminListingSort: "created_desc", adminListingFilters: {}, properties: items, stats: { searches: 0, pendingRequests: 1 }, requests: [{ status: "pending" }], leads: [], tasks: [], valuations: [], guestSaleRequests: [], whatsapp: {}, config: { exchangeRate: 987654 } };
      await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><style>${fs.readFileSync(path.join(root, "styles.css"), "utf8")}\n${fs.readFileSync(path.join(root, "admin-inventory.css"), "utf8")}</style><section class="dashboard" id="adminPanel"><div class="admin-shell">${sidebar}<div class="admin-main"><div id="statsGrid" class="stats-grid" data-admin-section-panel="dashboard"></div>${statistics}<div id="adminInsights" data-admin-section-panel="dashboard"></div><article id="adminListingsCard" class="panel-card admin-listings-card" data-admin-section-panel="properties developments"><h2 id="adminListingsTitle"></h2><select id="adminListingSort" aria-label="Orden"><option value="created_desc">Recientes</option><option value="price_asc">Precio asc</option><option value="price_desc">Precio desc</option></select><select id="adminListingStatusFilter" aria-label="Estado"><option value="">General</option></select><p id="adminListingSummary"></p><div class="listings-subhead"></div><div id="adminListings" class="admin-listings"></div></article><section data-admin-section-panel="analytics">Analitica existente</section><section data-admin-section-panel="data-quality">Calidad existente</section><section data-admin-section-panel="requests">Solicitudes existentes</section></div></div></section>`);
      await page.addScriptTag({ path: path.join(root, "inventory-contract.js") });
      await page.addStyleTag({ content: "body{padding:16px}#adminPanel{margin-top:0}*{scroll-behavior:auto!important}" });
      await page.addScriptTag({ path: path.join(root, "admin-inventory-ui.js") });
      await page.addScriptTag({ content: `
        const state = ${JSON.stringify(initial)};
        const $ = (selector) => document.querySelector(selector), $$ = (selector) => [...document.querySelectorAll(selector)];
        const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
        const t = (value) => value, localizedTitle = (p) => p.titleEs, localizedDescription = (p) => p.descriptionEs;
        const fallbackImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        const primaryImage = () => fallbackImage, storedImages = (p) => p.images;
        const displayType = (value) => value, propertyStatusLabel = (value) => value, displayLocation = (p) => p.zone;
        const formatPriceSummary = (p) => p.price == null ? "Consultar precio" : p.currency + " " + p.price, qualityLevelLabel = () => "";
        const truncateText = (text, size) => text.slice(0, size), canManageListings = () => true;
        const renderListingDraftShelf = () => {}, refreshIcons = () => {}, editListing = () => {}, focusAdminListing = () => {};
        const renderAdminListingFilters = () => {}, renderCopilotContext = () => {}, loadListingDraftShelf = async () => {};
        const stopWhatsappPolling = () => {}, renderAdminRequests = () => {}, listingFormRecordId = () => "";
        ${renderers}
        window.qa = { state, renderStats, renderAdminInsights, renderAdminListings, setAdminSection, nativeMetricCalls: 0 };
        document.addEventListener("click", (event) => {
          const metric = event.target.closest("[data-admin-metric]");
          if (metric) { window.qa.nativeMetricCalls++; openAdminMetric(metric.dataset.adminMetric); }
          const nav = event.target.closest("[data-admin-section], [data-admin-section-link]");
          if (nav) setAdminSection(nav.dataset.adminSection || nav.dataset.adminSectionLink);
        });
        $("#adminListingSort").addEventListener("change", (event) => { state.adminListingSort = event.target.value; renderAdminListings(); });
        renderStats(); renderAdminInsights(); setAdminSection("dashboard");
      ` });
      const rowIds = () => page.locator("#adminListings [data-pcc-listing-id]").evaluateAll((rows) => rows.map((row) => row.dataset.pccListingId).sort());
      await page.waitForFunction(() => document.querySelector("#pccInventoryDashboard")?.textContent.includes("30 días"));
      await page.locator('#pccInventoryDashboard [data-pcc-query]').filter({ hasText: "4 nunca revisadas" }).click();
      assert.deepEqual(await rowIds(), ["unit-high", "unit-low", "unit-mxn", "unit-null"]);
      assert.match(await page.locator("#pccInventoryFilters .pcc-scope").last().textContent(), /solo activas visibles/);
      for (const width of [1440, 768, 390, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => { qa.setAdminSection("dashboard"); qa.nativeMetricCalls = 0; });
        await page.locator('#statsGrid [data-admin-metric="properties"]').click();
        assert.equal(await page.evaluate(() => qa.state.adminSection), "dashboard");
        assert.equal(await page.locator('[data-pcc-details="breakdown-properties"]').evaluate((node) => node.open), true);
        await page.locator('#statsGrid [data-admin-metric="developments"]').click();
        assert.equal(await page.locator('[data-pcc-details="breakdown-developments"]').evaluate((node) => node.open), true);
        await page.locator('#statsGrid [data-admin-metric="properties-without-cover"]').click();
        assert.deepEqual(await rowIds(), ["missing", "missing-long"]);
        assert.deepEqual(await page.evaluate(() => qa.state.adminListingFilters.ids.sort()), ["missing", "missing-long"]);
        await page.evaluate(() => qa.setAdminSection("dashboard"));
        await page.locator('#adminInsights [data-admin-metric="incomplete-developments"]').click();
        assert.deepEqual(await rowIds(), ["project"]);
        assert.equal(await page.evaluate(() => qa.nativeMetricCalls), 0, "No legacy reset after inventory metrics");
        await page.locator('[data-admin-section="statistics"]').click();
        assert.equal(await page.locator("#adminStatistics").isVisible(), true);
        assert.equal(await page.locator("#pccInventoryStatistics").count(), 1);
        assert.equal(await page.locator("#adminOperationalStats .stat-card").count(), 8);
        assert.equal(await page.locator("#pccInventoryStatistics [data-pcc-query]").evaluateAll((buttons) => buttons.every((button) => {
          const query = JSON.parse(button.dataset.pccQuery);
          const rows = PccAdminInventory.filterListings(qa.state.properties, { status: "all", ...query.filters }, query.entity);
          return rows.length === Number(button.getAttribute("aria-label").match(/^\d+/)[0]) && rows.every((row) => query.filters.ids.includes(row.id));
        })), true);
        assert.equal(await page.locator('[data-admin-section-link="analytics"]').first().evaluate((node) => node.closest(".admin-sidebar-subnav").inert), false);
        await page.locator('[data-admin-section-link="analytics"]').first().click();
        assert.equal(await page.evaluate(() => qa.state.adminSection), "analytics");
        await page.locator('[data-admin-section="statistics"]').click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Statistics overflow at ${width}px`);
        if (process.env.PCC_QA_SCREENSHOT_DIR) {
          fs.mkdirSync(process.env.PCC_QA_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.PCC_QA_SCREENSHOT_DIR, `statistics-${width}.png`), fullPage: true });
        }
        await page.evaluate(() => qa.setAdminSection("properties"));
        await page.locator("#adminListingSort").selectOption("price_desc");
        const order = await page.locator("#adminListings [data-pcc-listing-id]").evaluateAll((rows) => rows.map((row) => row.dataset.pccListingId));
        assert.deepEqual(order, ["unit-mxn", "unit-high", "unit-low", "unit-null"]);
        assert.equal(await page.locator(".pcc-price-group-heading").count(), 2);
      }
      assert.deepEqual(await page.evaluate(() => qa.state.properties), items, "No inventory mutations during navigation or sorting");
      await page.evaluate(() => qa.setAdminSection("dashboard"));
      await page.locator('#adminInsights [data-admin-metric="pending-requests"]').click();
      assert.equal(await page.evaluate(() => qa.state.adminSection), "requests", "Unrelated metrics retain their native handler");
      await page.evaluate(() => { qa.state.properties = qa.state.properties.filter((p) => p.id !== "project"); qa.renderStats(); qa.renderAdminInsights(); qa.setAdminSection("dashboard"); });
      await page.locator('#statsGrid [data-admin-metric="developments-without-cover"]').click();
      assert.deepEqual(await rowIds(), []);
      assert.deepEqual(await page.evaluate(() => qa.state.adminListingFilters.ids), []);
      assert.equal(await page.locator("#pccInventoryFilters").count(), 1);
      assert.deepEqual(errors, []);
      await context.close();
    } finally { await browser.close(); }
  });
}

// Optional browser QA, isolated fixtures and static assets only; never loads server.js or DB.
// node test/admin-inventory-contract.test.js --serve
if (process.argv.includes("--serve")) {
  const http = require("node:http");
  const fixture = [property("test-complete", { featured: true }), property("test-missing", { images: [], status: "draft" }), property("test-placeholder", { zone: "Huayacan", descriptionEs: "POR DEFINIR" }), property("test-project", { type: "Desarrollo", publicationSection: "developments" }), property("test-pending", { zone: "Colosio", city: "", titleEs: '<img src=x onerror="window.pccXss=true">', source: '<script>window.pccXss=true</script>' })];
  function browserHarness() {
    const ui = window.PccAdminInventory;
    const panel = document.getElementById("adminPanel");
    const original = JSON.stringify(window.qaState.properties);
    let renders = 0;
    let opened = null;
    let nativeMetricCalls = 0;
    const helpers = {
      setSection(section) { window.qaState.adminSection = section; window.qaState.adminListingFilters = {}; renderListings(); },
      renderListings,
      refreshIcons() {},
      openListing(id) { opened = id; },
      focusListing(id) { window.qaState.adminSection = "properties"; window.qaState.adminListingFilters = { search: id, status: "all" }; renderListings(); },
    };
    document.addEventListener("click", (event) => { if (event.target.closest("[data-admin-metric]")) nativeMetricCalls++; });
    function renderListings() {
      renders++;
      const state = window.qaState;
      const rows = ui.filterListings(state.properties, state.adminListingFilters, state.adminSection === "developments" ? "developments" : "properties");
      document.getElementById("adminListings").innerHTML = rows.map((p) => `<div class="listing-item"><div class="listing-content"><h3>${p.id}</h3><p class="quality-missing">Legacy diagnosis</p><button type="button" data-edit-listing="${p.id}">Editar</button></div></div>`).join("");
      panel.querySelectorAll("[data-admin-section-panel]").forEach((node) => { node.hidden = !node.dataset.adminSectionPanel.split(" ").includes(state.adminSection); });
      ui.mount(state, helpers);
    }
    function check(condition, message) { if (!condition) throw new Error(message); }
    function run() {
      const results = [];
      const step = (name, action) => { action(); results.push(name); };
      step("Idempotent mount and safe escaping", () => {
        ui.mount(window.qaState, helpers); ui.mount(window.qaState, helpers);
        check(document.querySelectorAll("#pccInventoryDashboard").length === 1, "Duplicate dashboard");
        check(!document.querySelector("#pccInventoryDashboard img"), "Unescaped title");
        check(!window.pccXss, "Markup executed");
      });
      step("Every displayed numeric drilldown equals its destination query", () => {
        document.querySelectorAll("[data-pcc-query]").forEach((button) => {
          const leadingCount = button.textContent.match(/^(\d+) /);
          if (!leadingCount) return;
          const { entity, filters } = JSON.parse(button.dataset.pccQuery);
          const count = ui.filterListings(window.qaState.properties, { status: "all", ...filters }, entity).length;
          check(count === Number(leadingCount[1]), `Count mismatch: ${button.textContent}`);
        });
      });
      step("Total metric opens intermediate breakdown without legacy callback", () => {
        document.querySelector('[data-admin-metric="properties"]').click();
        check(document.querySelector('[data-pcc-details="breakdown-properties"]').open, "No breakdown");
        check(nativeMetricCalls === 0, "Legacy click also ran");
      });
      step("Missing cover includes draft and opens exact IDs", () => {
        document.querySelector('[data-admin-metric="properties-without-cover"]').click();
        check(window.qaState.adminListingFilters.status === "all", "Missing all-state scope");
        check(document.querySelectorAll("#adminListings .listing-item").length === 1, "Incorrect missing cover result");
        check(document.querySelector('#adminListings [data-edit-listing="test-missing"]'), "Draft excluded");
      });
      step("Quality and featured preserve other filters; listeners do not duplicate", () => {
        window.qaState.adminListingFilters = { status: "all", location: "puerto-cancun", type: "Casa", zone: "Puerto Cancun" };
        renderListings();
        const previous = renders;
        document.querySelector('[data-pcc-quality="ready"]').click();
        check(renders === previous + 1, "Duplicate render callback");
        check(window.qaState.adminListingFilters.type === "Casa" && window.qaState.adminListingFilters.zone === "Puerto Cancun", "Dropped legacy filters");
        const toggle = document.querySelector('[data-pcc-filter="featured"]');
        toggle.focus();
        toggle.checked = true; toggle.dispatchEvent(new Event("change", { bubbles: true }));
        check(window.qaState.adminListingFilters.featured === true && window.qaState.adminListingFilters.location === "puerto-cancun", "Wrong filter contract");
        check(document.querySelectorAll("#adminListings .listing-item").length === 1, "Incorrect intersection");
        check(document.activeElement.dataset.pccFilter === "featured", "Keyboard focus lost after rerender");
      });
      step("Native actions retained, diagnoses mounted once, edit callback uses ID", () => {
        ui.mount(window.qaState, helpers); ui.mount(window.qaState, helpers);
        check(document.querySelectorAll("#adminListings [data-pcc-diagnosis]").length === 1, "Duplicate diagnosis");
        check(document.querySelector("#adminListings [data-edit-listing]"), "Native action removed");
        const record = document.querySelector('#pccInventoryDashboard [data-pcc-open="test-missing"][data-pcc-mode="edit"]');
        record.click(); check(opened === "test-missing", "Wrong immutable ID");
      });
      step("Rerender preserves expanded details", () => {
        const detail = document.querySelector('[data-pcc-details="listing-prices"]');
        detail.open = true;
        window.qaState.adminListingFilters.featured = false;
        renderListings();
        check(document.querySelector('[data-pcc-details="listing-prices"]').open, "Collapsed on rerender");
      });
      step("References do not create records and no input data was mutated", () => {
        check(JSON.stringify(window.qaState.properties) === original, "Inventory mutated");
        check(document.querySelectorAll(".pcc-reference").length > 0, "Missing empty-category reference");
        check(ui.snapshot(window.qaState.properties).total === 5, "Reference counted");
      });
      step("Reconciliation pages and empty results update without duplicate handlers", () => {
        const saved = window.qaState.properties;
        window.qaState.properties = Array.from({ length: 41 }, (_, index) => ({ ...saved[0], id: `page-${index}`, images: [] }));
        window.qaState.adminListingFilters = { status: "all" };
        renderListings();
        const detail = document.querySelector('[data-pcc-details="listing-review"]');
        detail.open = true;
        check(detail.querySelectorAll("tbody tr").length === 20, "Wrong page size");
        detail.querySelector('[data-pcc-step="1"]').click();
        const next = document.querySelector('[data-pcc-details="listing-review"]');
        check(next.querySelector("tbody code").textContent === "page-20", "Pagination skipped or duplicated a page");
        window.qaState.adminListingFilters.search = "does-not-exist";
        renderListings();
        check(!document.querySelector('#pccInventoryFilters tbody'), "Stale rows after empty results");
        check(document.querySelector('#pccInventoryFilters .pcc-scope').textContent.includes("0 propiedades"), "Incorrect empty count");
        window.qaState.properties = saved;
        window.qaState.adminListingFilters = {};
        renderListings();
      });
      step("Read-only viewers cannot open edit actions", () => {
        const role = window.qaState.session.internalRole;
        window.qaState.session.internalRole = "viewer";
        ui.mount(window.qaState, helpers);
        check([...document.querySelectorAll('[data-pcc-mode="edit"]')].every((button) => button.disabled), "Editable for viewer");
        window.qaState.session.internalRole = role;
      });
      window.qaState.adminSection = "dashboard";
      window.qaState.adminListingFilters = {};
      renderListings();
      document.getElementById("qaResults").textContent = `${results.length} browser contracts passed: ${results.join("; ")}`;
    }
    document.getElementById("qaRun").onclick = () => { try { run(); } catch (error) { document.getElementById("qaResults").textContent = `FAIL: ${error.stack}`; } };
    document.getElementById("qaListings").onclick = () => helpers.setSection("properties");
    document.getElementById("qaDashboard").onclick = () => helpers.setSection("dashboard");
    document.getElementById("qaCatalogs").onclick = () => helpers.setSection("catalogs");
    renderListings();
  }
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin inventory isolated QA</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/admin-inventory.css"><style>body{padding:16px;font-family:Arial,sans-serif}main{max-width:1120px;margin:auto;min-width:0}#adminPanel{display:block;padding:0}.qa-controls{display:flex;gap:8px;flex-wrap:wrap}.qa-controls button{min-height:44px}#qaResults{overflow-wrap:anywhere}#adminListings{display:block}.listing-item{padding:12px;margin:8px 0;border:1px solid #ddd}.panel-card{padding:12px}</style></head><body><main><h1 style="font-size:18px">Prueba aislada, sin inventario real</h1><nav class="qa-controls"><button id="qaRun">Ejecutar pruebas</button><button id="qaDashboard">Resumen</button><button id="qaListings">Propiedades</button><button id="qaCatalogs">Locations</button></nav><p id="qaResults" role="status"></p><div id="adminPanel"><div id="statsGrid" data-admin-section-panel="dashboard"><button type="button" data-admin-metric="properties"><strong>999</strong><span>Total</span></button><button type="button" data-admin-metric="properties-without-cover"><strong>999</strong><span>Sin portada</span></button></div><article id="adminCatalogsCard" class="panel-card" data-admin-section-panel="catalogs"><div class="catalog-summary">Catalogos</div></article><article id="adminListingsCard" class="panel-card" data-admin-section-panel="properties developments"><div class="admin-listing-toolbar"><input id="adminListingSearch" aria-label="Buscar"><select id="adminListingStatusFilter" aria-label="Estado"><option value="">General</option><option value="draft">Borrador</option></select><select id="adminListingQualityFilter" aria-label="Calidad"><option value="">Todas</option><option value="ready">Listas</option><option value="incomplete">Incompletas</option></select></div><div class="listings-subhead"></div><div id="adminListings"></div></article><form id="listingForm" hidden><div class="form-row"><label>Zona<input name="zone"></label></div><input name="imageFile"><input name="description"></form></div></main><script src="/inventory-contract.js"></script><script src="/admin-inventory-ui.js"></script><script>window.qaState=${JSON.stringify({ session: { role: "admin", internalRole: "admin" }, adminSection: "dashboard", adminListingFilters: {}, properties: fixture }).replace(/</g, "\\u003c")};(${browserHarness.toString()})();</script></body></html>`;
  const files = new Set(["/inventory-contract.js", "/admin-inventory-ui.js", "/admin-inventory.css", "/styles.css"]);
  const server = http.createServer((req, res) => {
    if (req.url === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html); return; }
    if (!files.has(req.url)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": req.url.endsWith(".css") ? "text/css" : "application/javascript" });
    res.end(fs.readFileSync(path.join(root, req.url.slice(1))));
  });
  server.listen(0, "127.0.0.1", () => console.log(`Isolated admin QA: http://127.0.0.1:${server.address().port}`));
}
