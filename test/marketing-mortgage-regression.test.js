const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const sharp = require("sharp");
const { composePropertyMarketingImage } = require("../server");

const root = path.resolve(__dirname, "..");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("marketing separa contenido, imágenes y conexiones", () => {
  for (const view of ["content", "images", "networks"]) {
    assert.match(indexSource, new RegExp(`data-marketing-view="${view}"`));
    assert.match(indexSource, new RegExp(`data-marketing-panel="${view}"`));
  }
  assert.match(appSource, /function setMarketingView/);
  assert.match(stylesSource, /\.marketing-view-tabs/);
  assert.match(stylesSource, /\.marketing-network-grid/);
});

test("los flujos de contenido e imagen buscan propiedades en tiempo real", () => {
  assert.match(indexSource, /id="instagramPropertySearch"[^>]+list="instagramPropertySuggestions"/);
  assert.match(indexSource, /id="marketingPropertySearch"[^>]+list="marketingPropertySuggestions"/);
  assert.match(appSource, /populatePropertyPicker\("#instagramPropertySearch"/);
  assert.match(appSource, /populatePropertyPicker\("#marketingPropertySearch"/);
  assert.match(appSource, /searchInput\.oninput/);
  assert.match(appSource, /function renderMarketingPropertyPreview/);
});

test("la pieza institucional usa la portada real y no inventa una casa", () => {
  const routeStart = serverSource.indexOf('app.post("/api/admin/ai/generate-image"');
  const routeEnd = serverSource.indexOf('app.post("/api/admin/ai/translate-property"', routeStart);
  const route = serverSource.slice(routeStart, routeEnd);
  assert.ok(routeStart > -1 && routeEnd > routeStart);
  assert.match(serverSource, /function composePropertyMarketingImage/);
  assert.match(serverSource, /loadMarketingSourceImage\(propertyRow\)/);
  assert.match(serverSource, /puerto-cancun-logo\.png/);
  assert.match(serverSource, /\+52 1 998 216 6563/);
  assert.match(route, /provider: "property-media-layout"/);
  assert.doesNotMatch(route, /OPENAI_API_KEY|image_generation|Create a polished/);
});

test("la composición institucional produce una imagen válida con datos comerciales", async () => {
  const image = await composePropertyMarketingImage(
    { images: [], image: "/assets/cancun-hotel-zone-hero-1280.webp" },
    {
      id: "visual-test",
      titleEs: "Departamento frente al mar en Puerto Cancún",
      currency: "MXN",
      price: 14900000,
      priceUnit: "total",
      zone: "Puerto Cancún",
      city: "Cancún",
      state: "Quintana Roo",
      beds: 2,
      baths: 2,
      area: 175,
      mls: "2678",
    },
    "square",
    "Residencia lista para habitar"
  );
  const metadata = await sharp(image).metadata();
  const stats = await sharp(image).stats();
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1080);
  assert.ok(image.length > 100_000);
  assert.ok(stats.entropy > 2);
});

test("la amortización tiene tabla legible, resumen y adaptación móvil", () => {
  assert.match(appSource, /mortgage-amortization-heading/);
  assert.match(appSource, /mortgage-table-summary/);
  assert.match(appSource, /class="mortgage-table"/);
  assert.match(stylesSource, /\.mortgage-table-wrap/);
  assert.match(stylesSource, /\.mortgage-table thead th/);
  assert.match(stylesSource, /position: sticky/);
  assert.match(stylesSource, /font-variant-numeric: tabular-nums/);
});
