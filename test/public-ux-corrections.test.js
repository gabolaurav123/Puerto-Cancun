const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  localizedListingPrice,
  renderPropertyPage,
  renderSeoPage,
} = require("../seo-pages");

const root = path.join(__dirname, "..");

test("el idioma determina una sola moneda pública", () => {
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const property = { priceUsd: 1000000, priceMxn: null };

  assert.doesNotMatch(indexSource, /id="currencySelect"|class="currency-control"/);
  assert.deepEqual(localizedListingPrice(property, "es"), { amount: 18500000, currency: "MXN" });
  assert.deepEqual(localizedListingPrice({ priceUsd: null, priceMxn: 18500000 }, "en"), { amount: 1000000, currency: "USD" });
  assert.match(appSource, /state\.currency = state\.lang === "en" \? "USD" : "MXN"/);
});

test("las publicaciones usan carrusel y no muestran fecha de modificación", () => {
  const property = {
    id: "property-test",
    slug: "property-test",
    titleEs: "Departamento frente al mar",
    titleEn: "Oceanfront condo",
    descriptionEs: "Descripción completa de la propiedad.",
    descriptionEn: "Complete property description.",
    type: "Departamento",
    operation: "sale",
    zone: "Puerto Cancún",
    city: "Cancún",
    state: "Quintana Roo",
    priceUsd: 1000000,
    priceMxn: null,
    images: ["/assets/one.webp", "/assets/two.webp", "/assets/three.webp"],
    amenities: ["Alberca", "Marina"],
    updatedAt: "2026-07-20T00:00:00.000Z",
  };
  const spanish = renderPropertyPage(property, "es").html;
  const english = renderPropertyPage(property, "en").html;

  assert.match(spanish, /MXN \$18,500,000/);
  assert.match(english, /USD \$1,000,000/);
  assert.doesNotMatch(spanish, /Ultima verificacion|Última verificación|property-verified/);
  assert.doesNotMatch(english, /Last verified|property-verified/);
  assert.doesNotMatch(spanish, /class="last-updated"/);
  assert.match(spanish, /data-property-carousel/);
  assert.match(spanish, /Ver galería de la propiedad/);
  assert.match(spanish, /data-property-gallery-modal/);
  assert.match(spanish, /data-gallery-zoom-in/);
  assert.equal((spanish.match(/data-gallery-slide=/g) || []).length, 3);
});

test("la navegación explica cómo vender y presenta un Nosotros completo", () => {
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const sellingPage = renderSeoPage("/vender-casa-cancun");
  const aboutPage = renderSeoPage("/nosotros");

  assert.match(indexSource, /id="aboutNavLink"/);
  assert.match(indexSource, /href="\/vender-casa-cancun" id="sellNavLink"/);
  assert.doesNotMatch(indexSource, /class="ai-home-section/);
  assert.match(indexSource, /class="ai-validation-home/);
  assert.match(sellingPage, /Regístrate y anuncia con nosotros/);
  assert.match(sellingPage, /data-seller-access="register"/);
  assert.match(sellingPage, /data-seller-access="login"/);
  assert.match(aboutPage, /about-story/);
  assert.match(aboutPage, /about-values-grid/);
  assert.match(aboutPage, /about-process/);
  assert.match(appSource, /initializePropertyGallery\(\)/);
  assert.match(stylesSource, /\.property-gallery-modal/);
});

test("todas las métricas superiores del administrador abren un detalle", () => {
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  for (const target of [
    "properties",
    "active-properties",
    "incomplete-properties",
    "requests",
    "leads",
    "valuations",
    "tasks",
    "contacts",
    "analytics",
    "properties-without-cover",
    "pdf",
  ]) {
    assert.match(appSource, new RegExp(`"${target}"`));
  }
  assert.match(appSource, /data-admin-metric=/);
  assert.match(appSource, /function openAdminMetric\(metric\)/);
  assert.match(appSource, /state\.adminListingFilters\.quality = "incomplete"/);
});
