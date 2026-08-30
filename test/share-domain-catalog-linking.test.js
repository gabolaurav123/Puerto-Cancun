const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const { propertyWhatsappSheetText } = require("../server");
const { getPageByPath, renderCategoryPage } = require("../seo-pages");

test("pic.estate queda reservado para fichas y los mensajes de WhatsApp conservan Unicode", () => {
  const server = source("server.js");
  const app = source("app.js");
  const env = source(".env.example");
  assert.match(env, /PUBLIC_SHARE_DOMAIN=https:\/\/pic\.estate/);
  assert.match(server, /publicShareHostname/);
  assert.match(server, /X-Robots-Tag", "noindex, nofollow, noarchive/);
  assert.match(server, /\^\\\/f\\\//);
  assert.doesNotMatch(app, /window\.open\("about:blank"/);
  assert.match(app, /window\.open\("\/compartiendo-ficha"/);

  const message = propertyWhatsappSheetText({
    titleEs: "Terreno frente al mar",
    operation: "sale",
    currency: "MXN",
    price: 4200,
    priceUnit: "sqm",
    zone: "Isla Blanca",
    city: "Cancún",
    mls: "1944",
    lot: 700,
  }, "https://pic.estate/f/AbCdEf123");
  assert.match(message, /^🏡/u);
  assert.match(message, /https:\/\/pic\.estate\/f\/AbCdEf123/);
  assert.match(message, /por m²/);
  assert.doesNotMatch(message, /�/u);
});

test("la categoría de terrenos muestra todas las zonas e incorpora búsqueda instantánea", () => {
  const page = getPageByPath("/propiedades/terrenos-cancun");
  assert.ok(page);
  assert.deepEqual(page.category, { type: "Terreno" });
  const base = {
    publicationSection: "properties",
    status: "active",
    isPublic: true,
    operation: "sale",
    currency: "MXN",
    price: 1000000,
    priceUnit: "total",
    city: "Cancun",
    state: "Quintana Roo",
    images: ["/assets/type-land-cancun.jpg"],
    descriptionEs: "Terreno de inversión",
    descriptionEn: "Investment land",
  };
  const html = renderCategoryPage(page, [
    { ...base, id: "land-1", titleEs: "Terreno Isla Blanca", titleEn: "Isla Blanca land", type: "Terreno", zone: "Isla Blanca", mls: "1001" },
    { ...base, id: "land-2", titleEs: "Terreno Holbox", titleEn: "Holbox land", type: "Terreno", zone: "Holbox", mls: "1002" },
    { ...base, id: "home-1", titleEs: "Casa", titleEn: "Home", type: "Casa", zone: "Puerto Cancun", mls: "1003" },
  ]);
  assert.match(html, /2 propiedades disponibles/);
  assert.match(html, /id="categoryKeywordSearch"/);
  assert.match(html, /data-category-search="[^"]*isla blanca/);
  assert.match(html, /data-category-search="[^"]*holbox/);
  assert.doesNotMatch(html, />Casa<\/a>/);
});

test("los enlaces públicos usan la categoría general y la relación con desarrollos se valida", () => {
  const html = source("index.html");
  const app = source("app.js");
  const server = source("server.js");
  assert.match(html, /href="\/propiedades\/terrenos-cancun"/);
  assert.doesNotMatch(html, /href="\/propiedades\/puerto-cancun\/terrenos"/);
  assert.match(app, /"\/propiedades\/terrenos-cancun": "\/en\/properties\/land-cancun"/);
  assert.match(app, /id="propertyKeywordSearch"|#propertyKeywordSearch/);
  assert.match(server, /async function validateParentDevelopment/);
  assert.match(server, /await validateParentDevelopment\(property, client\)/);
  assert.match(server, /JOIN properties p ON p\.id = d\.property_id/);
});
