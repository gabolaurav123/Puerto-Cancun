const assert = require("node:assert/strict");
const test = require("node:test");
const { renderPropertyHead, renderPropertyPage, robotsTxt } = require("../seo-pages");
const { publicExchangeFixture } = require("./helpers/public-exchange-fixture");

const unitPriceLand = {
  id: "land-unit-price",
  slug: "terreno-frente-al-mar",
  titleEs: "Terreno frente al mar",
  titleEn: "Oceanfront land",
  descriptionEs: "Terreno con precio publicado por metro cuadrado.",
  descriptionEn: "Land listed with a price per square meter.",
  type: "Terreno",
  operation: "sale",
  zone: "Punta Sam / Playa Mujeres",
  city: "Cancún",
  state: "Quintana Roo",
  currency: "MXN",
  price: 4200,
  priceMxn: 4200,
  priceUsd: null,
  priceUnit: "sqm",
  images: ["/assets/cancun-hotel-zone-hero-1280.webp"],
  amenities: [],
};

test("el terreno convierte a USD por m² también en datos estructurados sin fabricar un total", () => {
  const exchangeRate = publicExchangeFixture();
  const original = JSON.stringify(unitPriceLand);
  const page = renderPropertyPage(unitPriceLand, "es", [], {}, [], exchangeRate);
  const head = renderPropertyHead(unitPriceLand, "https://www.puertocancun.center", "es", exchangeRate);

  assert.match(page.html, /≈ USD \$210 \/ m² · TC /);
  assert.match(head.jsonLd, /"@type":"UnitPriceSpecification"/);
  assert.match(head.jsonLd, /"price":210/);
  assert.match(head.jsonLd, /"priceCurrency":"USD"/);
  assert.match(head.jsonLd, /"unitCode":"MTK"/);
  assert.doesNotMatch(head.jsonLd, /"@type":"Offer","price":/);
  assert.equal(JSON.stringify(unitPriceLand), original);
});

test("robots permite indexar el sitio público", () => {
  const robots = robotsTxt("https://www.puertocancun.center");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
});
