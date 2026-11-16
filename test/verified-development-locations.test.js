const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const inventory = require("../inventory-contract");
const data = require("../verified-development-location-data");
const registry = require("../verified-development-locations");
const { resolvePublicLocation, renderPublicLocationSection } = require("../public-listing-details");
const root = path.join(__dirname, "..");
const project = (entry = data[0], extra = {}) => ({ id: entry.id, titleEs: entry.title, type: "Desarrollo",
  publicationSection: "developments", status: "active", isPublic: true, zone: "Puerto Cancún", city: "Cancún",
  locationPrecision: "approximate", latitude: null, longitude: null, ...extra });

test("curated location references retain unique identities and auditable coordinate evidence", () => {
  assert.equal(new Set(data.map(row => row.id)).size, data.length);
  for (const row of data) {
    assert.ok(row.evidence?.trim(), row.title);
    assert.match(row.sourceUrl, /^https:\/\//, row.title);
    assert.match(row.verifiedOn, /^\d{4}-\d{2}-\d{2}$/, row.title);
    assert.ok(Number.isFinite(row.latitude) && Number.isFinite(row.longitude), row.title);
    assert.ok(row.latitude > 18 && row.latitude < 23 && row.longitude > -89 && row.longitude < -86, row.title);
  }
});

test("verified locations require both the development ID and normalized Spanish title", () => {
  assert.ok(data.length > 0);
  for (const entry of data) {
    const source = project(entry), before = JSON.stringify(source);
    const result = registry.find(source);
    assert.equal(result?.latitude, entry.latitude, entry.title);
    assert.equal(result?.longitude, entry.longitude, entry.title);
    assert.ok(Object.isFrozen(result));
    assert.equal(registry.find({ ...source, titleEs: `  ${entry.title.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}  ` }), result);
    assert.equal(registry.find({ ...source, titleEs: "Another community" }), null);
    assert.equal(registry.find({ ...source, id: "unrelated" }), null);
    assert.equal(registry.find({ ...source, type: "Departamento", publicationSection: "properties" }), null);
    assert.equal(JSON.stringify(source), before);
  }
});

test("verified community display has a scoped pin without changing inventory or individual unit precision", () => {
  const entry = data.find(item => item.kind === "building"), source = project(entry), before = JSON.stringify(source);
  const model = resolvePublicLocation(source);
  assert.equal(model.precision, "exact"); assert.equal(model.coordinateSource, "verified-development");
  assert.equal(model.locationScope, "building"); assert.equal(model.latitude, entry.latitude);
  assert.equal(model.sourceUrl, entry.sourceUrl); assert.equal(model.address, entry.address);
  assert.match(model.notice, /edificio, no una unidad/);
  assert.equal(model.geocodeQuery, ""); assert.equal(JSON.stringify(source), before);
  const english = renderPublicLocationSection(source, { lang: "en" });
  assert.match(english, /Development location/); assert.match(english, /Verified building location/);
  assert.match(english, /data-location-scope="building"/); assert.match(english, /not an individual unit/);
  const unit = { ...source, id: "unit", titleEs: "Apartment in " + entry.title, publicationSection: "properties", type: "Departamento", developmentId: entry.id };
  const unitModel = resolvePublicLocation(unit, { properties: [source] });
  assert.equal(unitModel.precision, "approximate"); assert.equal(unitModel.coordinateSource, "zone");
  assert.equal(unitModel.latitude, null); assert.equal(unitModel.locationScope, "");
});

test("a community or complex is not labelled as a building or a unit", () => {
  const community = data.find(item => item.kind === "community");
  const model = resolvePublicLocation(project(community));
  assert.equal(model.heading, "Ubicación de la comunidad"); assert.equal(model.locationScope, "community");
  assert.match(model.notice, /no un edificio o una unidad/);
  const complex = resolvePublicLocation(project(data.find(item => item.kind === "complex")), { lang: "en" });
  assert.match(complex.evidenceLabel, /complex/); assert.match(complex.notice, /not an individual unit/);
});

test("Mondrian's presale project resolves its verified linked community in both languages", () => {
  const { projectRecords, projectDetail } = require("../catalog-directory");
  const entry = data.find(item => /mondrian/i.test(item.title));
  assert.ok(entry);
  const source = project(entry, { zone: "Zona Hotelera", titleEn: "Mondrian Residences at Grand Island Cancun",
    images: ["/media/properties/" + entry.id + "/0"], descriptionEs: "Residencias en Grand Island.",
    descriptionEn: "Residences in Grand Island.", catalogData: { locationId: "zona-hotelera", salesModality: "presale" } });
  const projectId = "presale-" + entry.id;
  const directory = { areas: inventory.LOCATIONS, presales: [{ id: projectId, developmentId: entry.id,
    nameEs: entry.title, nameEn: source.titleEn, areaId: "zona-hotelera", status: "confirmed" }] };
  const before = JSON.stringify({ source, directory });
  const [row] = projectRecords(directory, [source]);
  assert.equal(row.locationSource.id, source.id);
  for (const lang of ["es", "en"]) {
    const html = projectDetail(row, directory.areas, lang, (lang === "en" ? "/en/cancun-presales" : "/preventas-cancun") + "?project=" + projectId);
    assert.match(html, /data-location-source="verified-development"/);
    assert.match(html, /data-location-scope="complex"/);
    assert.ok(html.includes(`data-location-latitude="${entry.latitude}"`));
    assert.ok(html.includes(`data-location-longitude="${entry.longitude}"`));
    assert.ok(html.includes(`data-development-id="${entry.id}"`));
    assert.ok(html.includes(`data-project-id="${projectId}"`));
    assert.match(html, lang === "en" ? /not an individual unit/ : /no una unidad específica/);
    assert.doesNotMatch(html, /data-location-query=/);
  }
  assert.equal(JSON.stringify({ source, directory }), before);
});

test("hidden location always suppresses verified coordinates, address, source and map", () => {
  for (const extra of [{ locationPrecision: "hidden" }, { location_precision: "hidden" }, { portalHiddenBlocks: ["location"] }]) {
    const row = project(data[0], extra), model = resolvePublicLocation(row);
    assert.equal(registry.find(row), null); assert.equal(model.precision, "hidden");
    assert.equal(model.latitude, null); assert.equal(model.longitude, null); assert.equal(model.address, "");
    assert.equal(model.sourceUrl, ""); assert.equal(model.geocodeQuery, "");
    assert.doesNotMatch(renderPublicLocationSection(row), /data-location-canvas|data-location-latitude|data-location-query/);
  }
});

test("existing exact published coordinates win; unverified approximate communities remain pending", () => {
  const row = project(data[0], { locationPrecision: "exact", latitude: 21.17, longitude: -86.81, address: "Already published address" });
  const exact = resolvePublicLocation(row);
  assert.equal(exact.coordinateSource, "listing"); assert.equal(exact.latitude, 21.17); assert.equal(exact.longitude, -86.81);
  assert.equal(exact.address, row.address);
  for (const patch of [{ latitude: null, longitude: null }, { latitude: 21.16, longitude: -86.81 }, { locationPrecision: "exact", latitude: null, longitude: null }]) {
    const unknown = project(data[0], { id: "unknown-project", ...patch });
    const model = resolvePublicLocation(unknown);
    assert.equal(model.precision, "unavailable"); assert.equal(model.coordinateSource, "none");
    assert.equal(model.latitude, null); assert.equal(model.geocodeQuery, ""); assert.match(model.notice, /pendiente de confirmar/);
    assert.doesNotMatch(renderPublicLocationSection(unknown), /data-location-canvas|data-location-query/);
  }
});

test("browser UMD rejects incomplete, ambiguous and invalid location data without fetching", () => {
  const code = fs.readFileSync(path.join(root, "verified-development-locations.js"), "utf8");
  for (const rows of [undefined, [], [{ ...data[0], latitude: null }], [{ ...data[0], latitude: 91 }],
    [{ ...data[0], kind: "zone-center" }], [{ ...data[0], sourceUrl: "javascript:alert(1)" }], [data[0], data[0]]]) {
    const context = { PccInventory: inventory, PccVerifiedDevelopmentLocationData: rows };
    vm.runInNewContext(code, context);
    assert.equal(context.PccVerifiedDevelopmentLocations.find(project()), null);
  }
  const context = { PccInventory: inventory, PccVerifiedDevelopmentLocationData: data };
  vm.runInNewContext(code, context);
  assert.equal(context.PccVerifiedDevelopmentLocations.find(project()).latitude, data[0].latitude);
});

test("both registry scripts load in dependency order and participate in static cache invalidation", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const scripts = ["inventory-contract.js", "verified-development-location-data.js", "verified-development-locations.js", "public-listing-details.js"];
  for (let index = 1; index < scripts.length; index++) assert.ok(html.indexOf(`src="/${scripts[index - 1]}?`) < html.indexOf(`src="/${scripts[index]}?`));
  const { RUNTIME_FILES } = require("../asset-version");
  for (const file of scripts.slice(1, 3)) {
    assert.ok(RUNTIME_FILES.includes(file)); assert.ok(server.includes(`"/${file}"`));
    assert.ok(server.includes(file.replace(".", "\\.")), "SSR version replacement covers " + file);
  }
});
