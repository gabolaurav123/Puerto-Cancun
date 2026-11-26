const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { publicExchangeFixture } = require("./helpers/public-exchange-fixture");
const {
  localizedListingPrice,
  renderPropertyPage,
  renderSeoPage,
} = require("../seo-pages");

const root = path.join(__dirname, "..");

test("la publicación presenta MXN en español y USD en inglés sin alterar su moneda original", () => {
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const property = { currency: "MXN", price: 18500000, priceUsd: null, priceMxn: 18500000 };
  const original = JSON.stringify(property);
  const snapshot = publicExchangeFixture();

  assert.doesNotMatch(indexSource, /id="currencySelect"|class="currency-control"/);
  assert.deepEqual(localizedListingPrice(property, snapshot, "en"), { amount: 925000, currency: "USD" });
  assert.match(renderPropertyPage(property, "es", [], {}, [], snapshot).html, /MXN \$18,500,000/);
  assert.match(renderPropertyPage(property, "en", [], {}, [], snapshot).html, /≈ USD \$925,000/);
  assert.equal(localizedListingPrice(property, null, "en"), null, "No conversion without a current rate");
  assert.equal(JSON.stringify(property), original);
  assert.doesNotMatch(appSource, /state\.currency = state\.lang === "en" \? "USD" : "MXN"/);
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
    currency: "USD",
    price: 1000000,
    priceUsd: 1000000,
    priceMxn: null,
    images: ["/assets/one.webp", "/assets/two.webp", "/assets/three.webp"],
    amenities: ["Alberca", "Marina"],
    latitude: 21.1619,
    longitude: -86.8515,
    updatedAt: "2026-07-20T00:00:00.000Z",
  };
  const spanish = renderPropertyPage(property, "es").html;
  const english = renderPropertyPage(property, "en").html;

  assert.match(spanish, /USD \$1,000,000/);
  assert.match(english, /USD \$1,000,000/);
  for (const html of [spanish, english]) {
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.equal((html.match(/USD \$1,000,000/g) || []).length, 1);
    assert.doesNotMatch(html, /class="seo-page-hero"/);
    assert.match(html, /class="property-page-overview"/);
  }
  assert.doesNotMatch(spanish, /Ultima verificacion|Última verificación|property-verified/);
  assert.doesNotMatch(english, /Last verified|property-verified/);
  assert.doesNotMatch(spanish, /class="last-updated"/);
  assert.match(spanish, /data-property-carousel/);
  assert.match(spanish, /Ver galería de la propiedad/);
  assert.match(spanish, /data-property-gallery-modal/);
  assert.match(spanish, /data-gallery-zoom-in/);
  assert.equal((spanish.match(/data-gallery-slide=/g) || []).length, 3);
  assert.match(spanish, /Descripción completa de la propiedad\./);
  assert.match(spanish, /class="property-location-map public-location-section"/);
  assert.match(spanish, /data-contact-inquiry data-intent="buy"/);
  assert.ok(spanish.indexOf("property-page-summary") < spanish.indexOf("property-page-gallery"), "Contact is available before the gallery on mobile");
  assert.ok(spanish.indexOf("property-contact-cta") < spanish.indexOf("property-long-description"));
  assert.ok(spanish.indexOf("property-long-description") < spanish.indexOf("property-amenities"));
  assert.ok(spanish.indexOf("property-page-summary") < spanish.indexOf("property-location-map"));
  assert.ok(spanish.indexOf("property-location-map") < spanish.indexOf("property-long-description"));
});

test("la guía enlaza los dos inventarios de cada zona activa, en ambos idiomas", () => {
  const directory = { areas: [{ id:"test-area", nameEs:"Zona de prueba", nameEn:"Test area", subareas:[] }] };
  for (const [path,en] of [["/zonas-cancun",false],["/en/cancun-areas",true]]) {
    const html = renderSeoPage(path,{directory});
    assert.equal((html.match(/class="exploration-area"/g)||[]).length,1);
    assert.match(html,en ? /Test area/ : /Zona de prueba/);
    assert.match(html,/location=test-area&amp;entity=properties/);
    assert.match(html,/location=test-area&amp;entity=developments/);
  }
});

test("el mapa de la ficha respeta la visibilidad y no dirige a Google Maps en ES ni EN", () => {
  const property = {
    id: "muestra", slug: "muestra", titleEs: "Muestra", titleEn: "Sample",
    zone: "Puerto Cancún", latitude: 21.16, longitude: -86.81, locationPrecision: "exact",
    googleMapsUrl: "https://maps.app.goo.gl/private-location",
  };
  for (const lang of ["es", "en"]) {
    const withCoordinates = renderPropertyPage(property, lang).html;
    assert.match(withCoordinates, /data-location-precision="exact"/);
    assert.match(withCoordinates, /data-location-latitude="21\.16" data-location-longitude="-86\.81"/);
    const withoutCoordinates = renderPropertyPage({ ...property, latitude: null, longitude: null }, lang).html;
    assert.match(withoutCoordinates, /data-location-precision="approximate"/);
    assert.doesNotMatch(withoutCoordinates, /data-location-canvas|data-location-query=/);
    assert.doesNotMatch(withoutCoordinates, /data-show-area-map|<iframe/);
    assert.doesNotMatch(withoutCoordinates, /www\.openstreetmap\.org\/export\/embed/);
    const hidden = renderPropertyPage({ ...property, locationPrecision: "hidden" }, lang).html;
    assert.match(hidden, /data-location-precision="hidden"/);
    assert.doesNotMatch(hidden, /data-location-canvas|data-location-query|data-location-latitude|data-show-area-map/);
    const office = renderSeoPage(lang === "es" ? "/contacto" : "/en/contact");
    assert.doesNotMatch([withCoordinates, withoutCoordinates, hidden, office].join("\n"), /(?:href|src)="https?:\/\/[^" ]*(?:google\.com\/maps|maps\.google\.|maps\.app\.goo\.gl)/i);
  }
});

test("la navegación explica cómo vender y presenta un Nosotros completo", () => {
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const sellingPage = renderSeoPage("/vender-casa-cancun");
  const aboutPage = renderSeoPage("/nosotros");

  const header = indexSource.match(/<header[\s\S]*?<\/header>/)[0];
  const footer = indexSource.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.doesNotMatch(header, /href="\/nosotros"/);
  assert.match(footer, /href="\/nosotros"/);
  assert.match(indexSource, /href="\/vender-casa-cancun" id="sellNavLink"/);
  assert.doesNotMatch(indexSource, /class="ai-home-section/);
  assert.doesNotMatch(indexSource, /class="ai-validation-home/);
  const adviceSection = indexSource.match(/<section class="team-section home-only">[\s\S]*?<\/section>/)[0];
  assert.match(adviceSection, /¿Cuál es tu precio estimado\?[\s\S]*href="\/revisar-precio-propiedad"/);
  assert.doesNotMatch(indexSource, /class="audience-section home-only"/);
  const sellerOptions = sellingPage.match(/<div class="seller-entry-options">[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(sellerOptions, /data-open-guest-sale>Anunciar sin registro/);
  assert.match(sellerOptions, /data-seller-access="register">Registrarme y anunciar/);
  assert.match(sellerOptions, /data-seller-access="login">Ingresar a mi panel/);
  assert.match(sellingPage, /anunciar tu propiedad en venta o renta/);
  assert.match(sellerOptions, /guarda avances y recibe novedades en tu panel personal/);
  assert.match(indexSource, /id="sellNavLink"[^>]*data-open-seller-options/);
  assert.match(indexSource.match(/<form id="guestSaleForm"[\s\S]*?<\/form>/)?.[0] || "", /name="operation"[\s\S]*value="sale"[\s\S]*value="rent"/);
  assert.match(aboutPage, /about-story/);
  assert.match(aboutPage, /about-values-grid/);
  assert.match(aboutPage, /about-process/);
  assert.match(appSource, /initializePropertyGallery\(\)/);
  assert.match(stylesSource, /\.property-gallery-modal/);
});

test("mailing es independiente de marketing y los controles PDF permanecen juntos", () => {
  const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

  assert.match(indexSource, /data-admin-section="mailing"/);
  assert.match(indexSource, /data-admin-section-panel="mailing"/);
  assert.match(indexSource, /id="adminMailingCard"/);
  assert.match(indexSource, /id="adminMarketingCard" data-admin-section-panel="marketing"/);
  assert.match(indexSource, /<input name="channel" type="hidden" value="email"/);
  assert.match(indexSource, /name="recipientMode" type="radio" value="selected"/);
  assert.match(indexSource, /id="campaignRecipientList"/);
  assert.match(indexSource, /Enviar correo ahora/);
  assert.match(indexSource, /data-admin-section-link="new-property"/);
  assert.match(indexSource, /data-admin-listing-view="new-property new-development"/);
  assert.match(indexSource, /data-admin-listing-view="properties developments"/);
  assert.match(indexSource, /class="pdf-display-options span-2"/);
  assert.match(stylesSource, /\.pdf-display-options/);
  assert.match(stylesSource, /\.mailing-contact-list/);
  assert.match(stylesSource, /\.admin-sidebar-subnav\.is-open/);
  assert.match(stylesSource, /\.seller-onboarding-actions \.outline-dark-button/);
  assert.match(stylesSource, /background: #25d366/);
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
