const test = require("node:test");
const assert = require("node:assert/strict");
const { resolvePublicLocation, renderPublicLocationSection, publicCoordinatePair } = require("../public-listing-details");
const { publicProperty } = require("../inventory-metadata");

const property = (extra = {}) => ({ id: "unit", titleEs: "Departamento de prueba", type: "Departamento", status: "active", isPublic: true,
  publicationSection: "properties", zone: "Puerto Cancún", city: "Cancún", state: "Quintana Roo", locationPrecision: "exact", latitude: 21.160899, longitude: -86.805907, address: "Dirección publicada", ...extra });
const development = (extra = {}) => property({ id: "project", type: "Desarrollo", publicationSection: "developments", titleEs: "Desarrollo vinculado", developmentData: { id: "dev-project" }, ...extra });

test("exact map requires an authorized valid coordinate pair; privacy always wins", () => {
  const source = property(), before = JSON.stringify(source);
  assert.equal(resolvePublicLocation(source).precision, "exact");
  assert.equal(resolvePublicLocation(source).address, source.address);
  const approximate = resolvePublicLocation({ ...source, locationPrecision: "approximate" });
  assert.equal(approximate.latitude, 21.16); assert.equal(approximate.longitude, -86.81);
  assert.equal(approximate.address, "");
  for (const row of [{ ...source, locationPrecision: "hidden" }, { ...source, portalHiddenBlocks: ["location"] }]) {
    const model = resolvePublicLocation(row);
    assert.equal(model.precision, "hidden"); assert.equal(model.latitude, null); assert.equal(model.longitude, null);
    assert.equal(model.geocodeQuery, ""); assert.equal(model.address, "");
    assert.doesNotMatch(renderPublicLocationSection(row), /data-location-canvas|data-location-query|21\.160899|Dirección publicada/);
  }
  assert.equal(JSON.stringify(source), before);
});

test("missing, invalid and sentinel coordinates cannot produce an exact map or exact label", () => {
  for (const pair of [{ latitude: null, longitude: null }, { latitude: "", longitude: "" }, { latitude: false, longitude: false }, { latitude: 91, longitude: 181 }, { latitude: 0, longitude: 0 }, { latitude: 21, longitude: null }]) {
    assert.equal(publicCoordinatePair(pair), null);
    const model = resolvePublicLocation(property(pair));
    assert.equal(model.precision, "approximate");
    assert.equal(model.coordinateSource, "zone");
    assert.match(model.geocodeQuery, /Puerto Cancún/);
    assert.doesNotMatch(model.evidenceLabel, /exacta/);
    assert.equal(model.address, "");
  }
});

test("RIVA's missing point stays approximate; a sibling unit never supplies coordinates", () => {
  const riva = property({ id: "riva-missing", latitude: null, longitude: null, neighborhood: "RIVA", address: "Quintana Roo, México", developmentId: "dev-project" });
  const sibling = property({ id: "riva-with-point", developmentId: "dev-project" });
  const project = development({ latitude: null, longitude: null, locationPrecision: "approximate" });
  const model = resolvePublicLocation(riva, { properties: [riva, sibling, project] });
  assert.equal(model.latitude, null); assert.equal(model.precision, "approximate"); assert.equal(model.coordinateSource, "zone");
  assert.match(model.compact, /Puerto Cancún.*RIVA.*Cancún/);
});

test("only a linked public development supplies a clearly labelled and authorized fallback", () => {
  const unit = property({ latitude: null, longitude: null, developmentId: "dev-project" });
  const parent = development();
  const before = JSON.stringify([unit, parent]);
  const model = resolvePublicLocation(unit, { properties: [parent] });
  assert.equal(model.coordinateSource, "development"); assert.equal(model.sourceId, "project");
  assert.equal(model.precision, "exact"); assert.match(model.evidenceLabel, /desarrollo vinculado/);
  assert.match(model.notice, /Desarrollo vinculado/);
  const approximate = resolvePublicLocation({ ...unit, locationPrecision: "approximate" }, { properties: [parent] });
  assert.equal(approximate.precision, "approximate"); assert.equal(approximate.latitude, 21.16); assert.equal(approximate.address, "");
  for (const row of [{ ...parent, isPublic: false }, { ...parent, status: "draft" }, { ...parent, locationPrecision: "hidden" }, { ...parent, portalHiddenBlocks: ["location"] }, development({ id: "other", developmentData: { id: "dev-other" } })]) {
    assert.equal(resolvePublicLocation(unit, { properties: [row] }).coordinateSource, "zone");
  }
  assert.equal(resolvePublicLocation({ ...unit, parentDevelopment: { propertyId: "contradictory-parent" } }, { properties: [parent] }).coordinateSource, "zone");
  assert.equal(resolvePublicLocation({ ...unit, portalDevelopmentId: "other" }, { properties: [parent] }).coordinateSource, "zone");
  assert.equal(JSON.stringify([unit, parent]), before);
});

test("Al Mare retains commercial Puerto Cancun separately from its geocoded administrative address", () => {
  const model = resolvePublicLocation(property({ neighborhood: "Zona Hotelera", address: "7, Circuito Marina, Zona Hotelera, Cancún" }));
  assert.equal(model.compact, "Puerto Cancún · Cancún");
  assert.match(model.address, /Zona Hotelera/);
  assert.equal(model.precision, "exact");
});

test("outside Cancun shows the real locality and never invents a Cancun-center query", () => {
  const outside = property({ zone: "Fuera de Cancún", catalogData: { locationId: "fuera-de-cancun" }, latitude: null, longitude: null });
  const unknown = resolvePublicLocation(outside);
  assert.equal(unknown.precision, "unavailable"); assert.equal(unknown.geocodeQuery, "");
  assert.equal(unknown.compact, "Fuera de Cancún");
  const puntaSam = resolvePublicLocation({ ...outside, zone: "Punta Sam" });
  assert.match(puntaSam.compact, /Fuera de Cancún · Punta Sam/); assert.match(puntaSam.geocodeQuery, /^Punta Sam,/);
  const tulum = resolvePublicLocation({ ...outside, city: "Tulum" });
  assert.equal(tulum.compact, "Fuera de Cancún · Tulum"); assert.match(tulum.geocodeQuery, /^Tulum,/); assert.doesNotMatch(tulum.geocodeQuery, /Cancún/);
  const bare = resolvePublicLocation(property({ zone: "", city: "Cancún", latitude: null, longitude: null }));
  assert.equal(bare.geocodeQuery, "");
});

test("location markup is permanent, localized, accessible, escaped and reserves space before map load", () => {
  for (const lang of ["es", "en"]) {
    const html = renderPublicLocationSection(development({ titleEs: "<script>" }), { lang, contactHref: "#contact-form" });
    assert.match(html, lang === "es" ? /Ubicación del desarrollo/ : /Development location/);
    assert.match(html, /data-public-location/); assert.match(html, /min-height:240px/);
    assert.match(html, /role="status"/); assert.match(html, /href="#contact-form"/);
    assert.doesNotMatch(html, /<details|<summary|<button|data-show-area-map|<iframe/);
  }
  assert.doesNotMatch(renderPublicLocationSection(property({ zone: "<script>alert(1)</script>" }), { contactHref: "javascript:alert(1)" }), /<script|javascript:/);
});

test("public parent projection needs proof of publication and relationship, caps precision, and strips private fields", () => {
  const parent = { ...development(), id: "dev-project", propertyId: "project", internalNotes: "private", googleMapsUrl: "https://maps.example/private" };
  const source = property({ developmentId: "dev-project", parentDevelopment: parent });
  const before = JSON.stringify(source);
  const clean = publicProperty(source).parentDevelopment;
  assert.equal(clean.latitude, parent.latitude); assert.equal(clean.address, parent.address);
  assert.equal(clean.internalNotes, undefined); assert.equal(clean.googleMapsUrl, undefined);
  const approximate = publicProperty({ ...source, locationPrecision: "approximate" }).parentDevelopment;
  assert.equal(approximate.latitude, 21.16); assert.equal(approximate.address, "");
  for (const patch of [{ isPublic: false }, { isPublic: undefined }, { status: "draft" }, { locationPrecision: "hidden" }, { portalHiddenBlocks: ["location"] }, { id: "other", propertyId: "other" }]) {
    const unavailable = publicProperty({ ...source, parentDevelopment: { ...parent, ...patch } }).parentDevelopment;
    assert.equal(unavailable.latitude, undefined); assert.equal(unavailable.address, undefined);
  }
  assert.equal(publicProperty({ ...source, portalHiddenBlocks: ["location"] }).parentDevelopment.latitude, undefined);
  assert.equal(JSON.stringify(source), before);
});

test("browser: lazy automatic location, zoom, approximate zone, provider failure and normal mobile scrolling", { skip: process.env.PCC_LOCATION_BROWSER !== "1", timeout: 120000 }, async t => {
  const { chromium } = require("playwright");
  const fs = require("node:fs"), path = require("node:path"), http = require("node:http");
  const rootPath = path.join(__dirname, "..");
  const requests = [];
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64");
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/catalog-map.js" || /^\/assets\/leaflet-1\.9\.4\/leaflet\.(js|css)$/.test(url.pathname)) {
      res.setHeader("Content-Type", url.pathname.endsWith(".js") ? "application/javascript" : "text/css");
      return res.end(fs.readFileSync(path.join(rootPath, url.pathname)));
    }
    if (url.pathname.startsWith("/tile/")) { res.setHeader("Content-Type", "image/png"); return res.end(png); }
    if (url.pathname === "/api/geocode") { res.statusCode = 503; res.setHeader("Content-Type", "application/json"); return res.end('{"error":"fixture provider unavailable"}'); }
    const approximate = url.searchParams.has("approximate"), missing = url.searchParams.has("providerfail");
    const row = property({ ...(approximate || missing ? { locationPrecision: "approximate" } : {}), ...(missing ? { latitude: null, longitude: null } : {}) });
    const markup = renderPublicLocationSection(row, { lang: url.searchParams.get("lang") || "es", contactHref: "#contact-form" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:16px;font:16px Arial;line-height:1.5}.public-location-section{max-width:900px;margin:auto}h2{line-height:1.3}.spacer{height:2200px}</style><body><h1>Ficha de prueba</h1><div class="spacer"></div>${markup}<div id="contact-form" class="spacer">Formulario</div><script src="/catalog-map.js"></script><script>window.controls=PccCatalogMap.mountListingLocationMaps(document,{tileUrl:'/tile/{z}/{x}/{y}.png'});</script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ headless: true, ...(process.env.PCC_MAP_CHROMIUM ? { executablePath: process.env.PCC_MAP_CHROMIUM } : {}) });
  t.after(() => browser.close());
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin);
  assert.equal(await page.locator(".leaflet-container").count(), 0);
  assert.equal(requests.some(url => /leaflet/.test(url)), false, "map assets are not fetched far below the viewport");
  await page.locator("[data-public-location]").scrollIntoViewIfNeeded();
  await page.evaluate(() => controls[0].ready.then(() => true));
  assert.equal(await page.locator("[data-public-location]").getAttribute("data-location-map-state"), "ready");
  assert.equal(await page.locator(".leaflet-marker-icon").count(), 1);
  assert.equal(await page.evaluate(() => PccCatalogMap.mountListingLocationMaps(document)[0] === controls[0]), true);
  const initial = await page.evaluate(() => controls[0].map.getZoom());
  await page.getByRole("button", { name: "Acercar mapa" }).click();
  await page.waitForFunction(zoom => controls[0].map.getZoom() === zoom + 1, initial);
  assert.equal(await page.evaluate(() => controls[0].map.scrollWheelZoom.enabled()), false);
  await page.goto(origin + "/?approximate=1&lang=en");
  await page.locator("[data-public-location]").scrollIntoViewIfNeeded();
  assert.equal(await page.locator("[data-location-canvas]").count(), 0);
  assert.match(await page.locator(".public-location-precision").innerText(), /Approximate zone location/);
  await page.goto(origin + "/?providerfail=1");
  await page.locator("[data-public-location]").scrollIntoViewIfNeeded();
  assert.equal(await page.locator(".leaflet-container").count(), 0);
  assert.equal(await page.locator(".public-location-summary").isVisible(), true);
  assert.equal(await page.getByRole("link", { name: "Consultar esta ubicación" }).isVisible(), true);
  await page.route("**/assets/leaflet-1.9.4/**", route => route.abort());
  await page.goto(origin);
  await page.locator("[data-public-location]").scrollIntoViewIfNeeded();
  await page.evaluate(() => controls[0].ready.then(() => true));
  assert.match(await page.locator("[data-location-status]").innerText(), /Mapa no disponible/);
  assert.equal(await page.locator(".public-location-address").isVisible(), true);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(origin);
  await mobile.locator("[data-location-canvas]").scrollIntoViewIfNeeded();
  await mobile.evaluate(() => controls[0].ready.then(() => true));
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(await mobile.evaluate(() => [controls[0].map.dragging.enabled(), controls[0].map.touchZoom.enabled(), controls[0].map.scrollWheelZoom.enabled()]), [false, false, false]);
  const bounds = await mobile.locator("[data-location-canvas]").boundingBox();
  const startY = bounds.y + bounds.height * .8, endY = Math.max(30, startY - 170);
  const beforeScroll = await mobile.evaluate(() => scrollY);
  const cdp = await mobile.context().newCDPSession(mobile);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: startY }] });
  for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y: startY + (endY - startY) * step / 8 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await mobile.waitForFunction(y => scrollY > y + 30, beforeScroll);
  const output = path.join(rootPath, "outputs", "qa-20261115"); fs.mkdirSync(output, { recursive: true });
  await mobile.locator("[data-public-location]").screenshot({ path: path.join(output, "location-mobile.png") });
  assert.deepEqual(errors, []);
});
