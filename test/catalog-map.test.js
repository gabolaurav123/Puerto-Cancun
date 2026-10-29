"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { prepareItems, clusterItems, serializeBounds, mount } = require("../catalog-map");
const base = "https://www.puertocancun.center/propiedades";
const item = (patch = {}) => ({ id: "fixture-a", title: "Unidad A", url: "/propiedades/unidad-a?lang=es", latitude: 21.167891, longitude: -86.812345, locationPrecision: "exact", ...patch });

test("preserva precision exacta y rutas sin fabricar slugs", () => {
  const point = prepareItems([item()], base).items[0];
  assert.equal(point.latitude, 21.167891);
  assert.equal(point.longitude, -86.812345);
  assert.equal(point.url, "/propiedades/unidad-a?lang=es");
});

for (const value of [null, undefined, "", "   ", false, true, [], {}, NaN, Infinity, "not-a-coordinate"]) {
  for (const field of ["latitude", "longitude"]) {
    test(`rechaza ${field} ausente/invalida: ${String(value)}`, () => {
      const result = prepareItems([item({ [field]: value })], base);
      assert.equal(result.items.length, 0);
      assert.equal(result.missing.length, 1);
      assert.equal(result.missing[0].latitude, undefined);
      assert.equal(result.missing[0].mapsUrl, undefined);
    });
  }
}

test("no rechaza coordenadas cero reales ni crea ceros desde null", () => {
  assert.equal(prepareItems([item({ latitude: 0, longitude: 0 })]).items.length, 1);
  assert.equal(prepareItems([item({ latitude: null, longitude: null })]).items.length, 0);
});

test("valida rangos geograficos", () => {
  for (const patch of [{ latitude: 91 }, { latitude: -91 }, { longitude: 181 }, { longitude: -181 }]) assert.equal(prepareItems([item(patch)]).items.length, 0);
});

test("aproximadas redondeadas sin enlaces precisos ni metadatos internos", () => {
  const result = prepareItems([item({ locationPrecision: "approximate", googleMapsUrl: "https://maps.app.goo.gl/precise", address: "private address", latitude: "21.167891", longitude: "-86.812345" })]);
  assert.equal(result.items[0].latitude, 21.17);
  assert.equal(result.items[0].longitude, -86.81);
  assert.equal(result.items[0].mapsUrl, "https://www.google.com/maps/search/?api=1&query=21.17,-86.81");
  assert.doesNotMatch(JSON.stringify(result), /167891|812345|precise|private address/);
});

test("precision no declarada y contradictoria se tratan conservadoramente", () => {
  for (const patch of [{ locationPrecision: undefined }, { locationPrecision: "unknown" }, { location_precision: "approximate" }, { approximate: true }]) {
    assert.equal(prepareItems([item(patch)]).items[0].precision, "approximate");
  }
});

test("compatibilidad del booleano approximate antiguo", () => {
  assert.equal(prepareItems([item({ locationPrecision: undefined, approximate: false })]).items[0].precision, "exact");
  assert.equal(prepareItems([item({ locationPrecision: undefined, approximate: true })]).items[0].precision, "approximate");
});

for (const field of ["locationPrecision", "location_precision", "precision"]) {
  test(`hidden prevalece en ${field}`, () => {
    const result = prepareItems([item({ [field]: "hidden", googleMapsUrl: "https://maps.app.goo.gl/secret" })]);
    assert.equal(result.items.length, 0);
    assert.equal(result.missing[0].reason, "hidden");
    assert.doesNotMatch(JSON.stringify(result), /167891|812345|secret/);
  });
}

test("IDs compartiendo pin o MLS no se fusionan", () => {
  const data = prepareItems([item({ mls: "1707" }), item({ id: "fixture-b", mls: "1707" })]);
  const groups = clusterItems(data.items, () => ({ x: 100, y: 100 }));
  assert.deepEqual(groups[0].map((p) => p.id), ["fixture-a", "fixture-b"]);
});

test("ID repetido no aumenta el conteo y coordenadas en conflicto no se eligen", () => {
  assert.equal(prepareItems([item(), item()]).total, 1);
  const result = prepareItems([item(), item({ latitude: 20 })]);
  assert.equal(result.items.length, 0);
  assert.equal(result.missing[0].reason, "unavailable");
});

test("duplicado hidden nunca permite rescatar coordenadas exactas", () => {
  for (const rows of [[item(), item({ precision: "hidden" })], [item({ precision: "hidden" }), item()]]) {
    const result = prepareItems(rows);
    assert.equal(result.items.length, 0);
    assert.doesNotMatch(JSON.stringify(result), /167891|812345/);
  }
});

test("se descartan registros privados y sin identidad", () => {
  const result = prepareItems([item({ status: "draft" }), item({ isPublic: false }), item({ id: "" }), null]);
  assert.deepEqual(result, { items: [], missing: [], total: 0, invalid: 2 });
});

for (const url of ["javascript:alert(1)", "data:text/html,x", "//evil.example/x", "https://evil.example/x", "https://user:pass@www.puertocancun.center/x"]) {
  test(`no acepta URL de ficha insegura: ${url}`, () => assert.equal(prepareItems([item({ url })], base).items[0].url, ""));
}

test("conserva ficha inglesa y enlace Google original permitido", () => {
  const result = prepareItems([item({ url: "/en/properties/unit-a", googleMapsUrl: "https://maps.app.goo.gl/example" })], base).items[0];
  assert.equal(result.url, "/en/properties/unit-a");
  assert.equal(result.mapsUrl, "https://maps.app.goo.gl/example");
});

test("URL Google falsa usa solo coordenadas publicas", () => {
  const point = prepareItems([item({ googleMapsUrl: "https://maps.google.com.evil.example/secret" })]).items[0];
  assert.match(point.mapsUrl, /^https:\/\/www.google.com\/maps\/search/);
});

test("preparacion y clusters no mutan datos originales", () => {
  const rows = [item(), item({ id: "fixture-b" })]; const before = JSON.stringify(rows);
  clusterItems(prepareItems(rows).items, () => ({ x: 100, y: 100 }));
  assert.equal(JSON.stringify(rows), before);
});

test("clusters son estables, conservan IDs y separan posiciones al acercar", () => {
  const points = prepareItems([item(), item({ id: "fixture-b", longitude: -86.8 })]).items;
  const near = clusterItems(points, () => ({ x: 0, y: 0 }));
  assert.equal(near.length, 1);
  const far = clusterItems(points, ([lat, lng]) => ({ x: lng * 100000, y: lat * 100000 }));
  assert.equal(far.length, 2);
  assert.deepEqual(near, clusterItems([...points].reverse(), () => ({ x: 0, y: 0 })));
  assert.deepEqual(far.flat().map((p) => p.id).sort(), ["fixture-a", "fixture-b"]);
});

test("cluster invalido falla explicitamente", () => {
  assert.throws(() => clusterItems([item()], () => ({ x: NaN, y: 0 })), RangeError);
  assert.throws(() => clusterItems([], () => ({}), 0), RangeError);
  assert.throws(() => prepareItems({}), TypeError);
  assert.throws(() => mount(null), TypeError);
});

for (const value of ["", "1,2,3", "1,,3,4", "NaN,2,3,4", "3,2,1,4", "1,4,3,2", "1,-91,3,4", "1,2,3,91", "170,-10,190,10", [0, 0, 0, 0]]) {
  test(`bbox invalida no se amplia: ${String(value)}`, () => assert.equal(serializeBounds(value), ""));
}

test("bbox orden west,south,east,north e idempotencia", () => {
  const value = "-86.8,21.1,-86.7,21.2";
  assert.equal(serializeBounds(value), value);
  assert.equal(serializeBounds(serializeBounds(value)), value);
  assert.equal(serializeBounds({ getWest: () => -86.8, getSouth: () => 21.1, getEast: () => -86.7, getNorth: () => 21.2 }), value);
});

test("bbox redondea hacia afuera sin perder bordes", () => {
  assert.equal(serializeBounds([-86.81234567, 21.12345678, -86.71234567, 21.22345678]), "-86.812346,21.123456,-86.712345,21.223457");
});

test("bbox de mundo completo y copias de mundo", () => {
  assert.equal(serializeBounds([-200, -80, 200, 80]), "-180,-80,180,80");
  assert.equal(serializeBounds([273, 21, 274, 22]), "-87,21,-86,22");
});

test("bbox se intersecta con filtros existentes en el contrato real", () => {
  const inventory = require("../inventory-contract");
  const { publicProperty } = require("../inventory-metadata");
  const row = { ...item(), type: "Departamento", operation: "sale", currency: "USD", price: 700000, zone: "Puerto Cancun", featured: true };
  const candidates = [row, { ...row, id: "outside", latitude: 22 }, { ...row, id: "expensive", price: 700001 }, { ...row, id: "other-currency", currency: "MXN" }, { ...row, id: "private-location", locationPrecision: "hidden" }].map(publicProperty);
  const input = { bounds: serializeBounds([-86.82, 21.16, -86.8, 21.18]), type: "Departamento", operation: "sale", currency: "USD", max: 700000, locations: ["puerto-cancun"], featured: true };
  const found = inventory.queryInventory(candidates, input);
  assert.deepEqual(found.errors, []);
  assert.deepEqual(found.all.map((p) => p.id), ["fixture-a"]);
  const restored = inventory.parseQuery(inventory.toSearchParams(found.query));
  assert.deepEqual(restored.query.bounds, found.query.bounds);
  assert.deepEqual(restored.query.locations, ["puerto-cancun"]);
  assert.equal(restored.query.max, 700000);
});

// Opt-in real Chromium/Leaflet tests. No package changes, production data or files.
test("browser: mapa real, privacidad, teclado, bbox, filtros, fallos y ciclo de vida", { skip: process.env.PCC_MAP_BROWSER !== "1", timeout: 120000 }, async (t) => {
  const { chromium } = require("playwright");
  const fs = require("node:fs");
  const path = require("node:path");
  const http = require("node:http");
  const sharp = require("sharp");
  const rootPath = path.join(__dirname, "..");
  const script = fs.readFileSync(path.join(rootPath, "catalog-map.js"));
  const css = fs.readFileSync(path.join(rootPath, "catalog.css"));
  const rows = [item(), item({ id: "fixture-b", title: "Unidad B", url: "/en/properties/unit-b" }), item({ id: "fixture-approx", title: "Aproximada", locationPrecision: "approximate", latitude: 21.19 }), item({ id: "fixture-hidden", title: "Reservada", precision: "hidden" }), item({ id: "fixture-missing", title: "Sin coordenadas", latitude: null })];
  const html = `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/catalog.css"><style>body{margin:16px;font:16px Arial}.catalog-results{width:100%}article{padding:16px;border-bottom:1px solid #ccc}.catalog-experience{max-width:1200px;margin:auto}</style></head><body><section class="catalog-experience" data-catalog-root><form id="catalogFilters" action="/propiedades"><input name="q" value="test"><input name="type" value="Departamento"><input name="max" value="700000"><input name="currency" value="USD"><input name="location" value="puerto-cancun"><input name="location" value="zona-hotelera"><input type="checkbox" name="featured" value="1" checked></form><div class="catalog-results"><div data-catalog-list>${rows.map((p) => `<article data-category-property="${p.id}"><a href="${p.url}">${p.title}</a></article>`).join("")}</div><section data-catalog-map hidden><div class="catalog-map-canvas"></div><p class="catalog-map-status"></p></section></div><script type="application/json" data-catalog-map-items>${JSON.stringify(rows).replace(/</g, "\\u003c")}</script></section><script src="/catalog-map.js"></script><script>window.submissions=[];document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submissions.push([...new FormData(e.target)])});window.start=()=>{window.ctrl=PccCatalogMap.mount(document.querySelector('[data-catalog-root]'));return ctrl.ready;};</script></body></html>`;
  const server = http.createServer((req, res) => {
    if (req.url === "/catalog-map.js") { res.setHeader("Content-Type", "application/javascript"); res.end(script); }
    else if (req.url === "/catalog.css") { res.setHeader("Content-Type", "text/css"); res.end(css); }
    else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(html); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const browser = await chromium.launch({ headless: true, ...(process.env.PCC_MAP_CHROMIUM ? { executablePath: process.env.PCC_MAP_CHROMIUM } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const url = `http://127.0.0.1:${server.address().port}`;
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  assert.equal(await page.evaluate(() => start()), "ready");
  assert.equal(await page.evaluate(() => PccCatalogMap.mount(document.querySelector('[data-catalog-root]')) === ctrl), true);
  assert.equal(await page.locator(".leaflet-container").count(), 1);
  await page.evaluate(() => PccCatalogMap.hide(document.querySelector('[data-catalog-root]')));
  assert.equal(await page.locator("[data-catalog-map]").isVisible(), false);
  assert.equal(await page.evaluate(() => PccCatalogMap.open(document.querySelector('[data-catalog-root]')) === ctrl), true);
  assert.equal(await page.locator(".leaflet-container").count(), 1);
  assert.match(await page.locator(".pcc-catalog-map-summary").innerText(), /3 de 5.*2 sin.*1 aproximados/);
  const before = await page.locator("[data-catalog-list]").innerHTML();
  const initialForm = await page.evaluate(() => [...new FormData(document.querySelector('form'))]);
  await page.locator(".pcc-catalog-map-pin", { hasText: "2" }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".pcc-catalog-map-popup [data-catalog-map-id]").count(), 2);
  assert.equal(await page.locator(".pcc-catalog-map-popup [data-catalog-map-id='fixture-b']").getAttribute("href"), "/en/properties/unit-b");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-catalog-map-id")), "fixture-a");
  assert.equal(await page.locator("[data-category-property='fixture-a']").getAttribute("class"), "map-highlight");
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains("pcc-catalog-map-pin")), true);
  await page.locator(".leaflet-control-zoom-in").click();
  assert.equal(await page.evaluate(() => submissions.length), 0);
  assert.equal(await page.locator('[name="bounds"]').count(), 0);
  await page.locator("[data-catalog-search-area]").click();
  const sent = await page.evaluate(() => submissions.at(-1));
  assert.deepEqual(sent.filter(([key]) => key !== "bounds"), initialForm);
  assert.equal(sent.filter(([key]) => key === "bounds").length, 1);
  assert.ok(serializeBounds(sent.find(([key]) => key === "bounds")[1]));
  assert.equal(await page.locator("[data-catalog-list]").innerHTML(), before);
  await page.locator("[data-catalog-search-area]").click();
  assert.equal(await page.locator('[name="bounds"]').count(), 1);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(await page.locator("[data-catalog-list]").isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const buffer = await page.locator(".catalog-map-canvas").screenshot();
    const stats = await sharp(buffer).stats();
    assert.ok(stats.channels.slice(0, 3).some((c) => c.stdev > 8), "map screenshot must contain visible tiles/markers");
    assert.ok(await page.locator(".leaflet-marker-icon").count() >= 2);
    t.diagnostic(`Screenshot/pixel check in memory: ${width}px, ${buffer.length} bytes`);
  }
  await page.evaluate(() => document.querySelector('[data-catalog-root]').remove());
  await page.waitForTimeout(20);
  assert.equal(await page.locator(".leaflet-container").count(), 0);

  await page.goto(url);
  await page.route("**/leaflet@1.9.4/**", (route) => route.abort());
  assert.equal(await page.evaluate(() => start()), "error");
  assert.equal(await page.locator("[data-catalog-list]").isVisible(), true);
  assert.equal(await page.locator("[data-catalog-search-area]").isDisabled(), true);
  await page.unroute("**/leaflet@1.9.4/**");
  await page.getByRole("button", { name: "Reintentar mapa" }).click();
  assert.equal(await page.evaluate(() => ctrl.ready), "ready");

  await page.goto(url);
  await page.evaluate(() => { document.querySelector('[data-catalog-map-items]').textContent = JSON.stringify([{id:'missing',title:'Missing',latitude:null,longitude:null}]); });
  assert.equal(await page.evaluate(() => start()), "empty");
  assert.equal(await page.locator("#leafletScript").count(), 0);
  assert.equal(await page.locator("[data-catalog-list]").isVisible(), true);
  await page.goto(url);
  await page.evaluate(() => document.documentElement.lang = "en");
  assert.equal(await page.evaluate(() => start()), "ready");
  assert.equal(await page.getByRole("button", { name: "Search this area", exact: true }).count(), 1);
  await page.locator("[data-category-property='fixture-b'] a").focus();
  assert.equal(await page.locator(".leaflet-popup").count(), 1);

  await page.goto(url);
  await page.evaluate(() => { document.querySelector('[data-catalog-map-items]').textContent = '{bad json'; });
  assert.equal(await page.evaluate(() => start()), "error");
  assert.equal(await page.locator("[data-catalog-list]").isVisible(), true);

  await page.goto(url);
  await page.evaluate(() => { const source = document.querySelector('[data-catalog-map-items]'); source.removeAttribute('data-catalog-map-items'); source.setAttribute('data-catalog-map-data', ''); });
  assert.equal(await page.evaluate(() => start()), "ready");

  await page.goto(url);
  assert.deepEqual(await page.evaluate(async () => {
    const first = document.querySelector('[data-catalog-root]'); const second = first.cloneNode(true); document.body.append(second);
    return Promise.all([PccCatalogMap.mount(first).ready, PccCatalogMap.mount(second).ready]);
  }), ["ready", "ready"]);
  assert.equal(await page.locator("#leafletScript").count(), 1);
  assert.equal(await page.locator(".leaflet-container").count(), 2);
  await page.evaluate(() => PccCatalogMap.dispose());
  assert.equal(await page.locator(".leaflet-container").count(), 0);

  await page.goto(url);
  assert.equal(await page.evaluate(async () => { const mounted = PccCatalogMap.mount(document.querySelector('[data-catalog-root]')); mounted.destroy(); return mounted.ready; }), "destroyed");
  assert.equal(await page.locator(".leaflet-container").count(), 0);

  await page.goto(url);
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  assert.equal(await page.evaluate(() => start()), "ready");
  await page.waitForFunction(() => document.querySelector('.catalog-map-status').textContent.includes('imagenes'));
  assert.equal(await page.locator("[data-catalog-list]").isVisible(), true);
  await page.unroute("https://tile.openstreetmap.org/**");
  assert.deepEqual(errors, []);
});
