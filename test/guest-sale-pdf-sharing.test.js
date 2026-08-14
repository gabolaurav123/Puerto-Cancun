const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const { renderSeoPage } = require("../seo-pages");

test("la venta sin registro solicita solo datos esenciales y el contacto al final", () => {
  const html = source("index.html");
  const app = source("app.js");
  const styles = source("styles.css");
  for (const value of ["sellerOptionsModal", "guestSaleModal", "guestSaleForm", "preferredContact", "countryCode"]) {
    assert.ok(html.includes(value), `Falta ${value}`);
  }
  assert.match(html, /name="description"[^>]*maxlength="4000"/);
  assert.doesNotMatch(html.match(/<form id="guestSaleForm"[\s\S]+?<\/form>/)?.[0] || "", /name="description"[^>]*required/);
  assert.match(app, /POST[\s\S]*\/api\/guest-sale-requests/);
  assert.match(app, /function updateGuestContactFields/);
  assert.match(app, /setGuestSaleStep\("contact"\)/);
  assert.match(html, /Venta con registro/);
  assert.doesNotMatch(html, /Publicaci[oó]n acompañada/);
  assert.match(html, /seller-option-benefits/);
  assert.match(styles, /\.guest-consent-field\s*\{[\s\S]*grid-template-columns:\s*20px minmax\(0, 1fr\)/);
  const sellPage = renderSeoPage("/vender-casa-cancun");
  assert.match(sellPage, /Enviar propiedad sin registro/);
  assert.match(sellPage, /PUBLICA CON ACOMPAÑAMIENTO/);
  assert.match(sellPage, /Solicita valoracion de tu propiedad/);
});

test("las solicitudes sin cuenta se conservan en una tabla aditiva y tienen panel propio", () => {
  const server = source("server.js");
  const schema = source("db/schema.sql");
  const html = source("index.html");
  const app = source("app.js");
  assert.match(server, /CREATE TABLE IF NOT EXISTS guest_sale_requests/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS guest_sale_requests/);
  assert.doesNotMatch(schema.match(/CREATE TABLE IF NOT EXISTS guest_sale_requests[\s\S]+?;/)?.[0] || "", /DROP|TRUNCATE/i);
  assert.match(server, /app\.post\("\/api\/guest-sale-requests"/);
  assert.match(server, /app\.get\("\/api\/admin\/guest-sale-requests"/);
  assert.match(server, /app\.patch\("\/api\/admin\/guest-sale-requests\/:id"/);
  assert.match(server, /WHEN source = 'registered_account' THEN source/);
  assert.match(html, /data-admin-section-link="guest-requests"/);
  assert.match(html, /data-admin-section-link="guest-contacts"/);
  assert.match(app, /renderAdminGuestRequests\(\)/);
  assert.match(app, /renderAdminGuestContacts\(\)/);
});

test("el vendedor registrado ve primero un panel de navegación simple", () => {
  const html = source("index.html");
  const app = source("app.js");
  for (const section of ["sale", "requests", "favorites", "searches", "tours", "services"]) {
    assert.match(html, new RegExp(`data-seller-section="${section}"`));
  }
  assert.match(app, /function setSellerSection/);
  assert.match(app, /setSellerSection\(state\.sellerSection \|\| "sale"\)/);
});

test("las fichas se comparten desde un modal común por tres canales", () => {
  const html = source("index.html");
  const app = source("app.js");
  const server = source("server.js");
  assert.match(html, /id="pdfShareModal"/);
  const pdfSearch = html.match(/<input id="pdfPropertySearch"[^>]*>/)?.[0] || "";
  assert.ok(pdfSearch, "Falta el buscador principal de propiedades para PDF");
  assert.doesNotMatch(pdfSearch, /\slist=/, "El buscador PDF no debe abrir la lista nativa duplicada");
  assert.doesNotMatch(html, /id="pdfPropertySuggestions"/);
  assert.match(html, /id="pdfSharePropertySearch"[^>]*aria-controls="pdfSharePropertyMatches"/);
  for (const channel of ["whatsapp", "facebook", "instagram"]) {
    assert.match(html, new RegExp(`data-pdf-share-channel="${channel}"`));
  }
  assert.match(app, /data-open-pdf-share="property"/);
  assert.match(app, /data-open-pdf-share="history"/);
  assert.match(app, /async function preparePdfShareDocument/);
  assert.match(app, /async function sharePdfThroughChannel/);
  assert.match(app, /pdfSharePropertySearch"\)\?\.addEventListener\("input"/);
  assert.match(app, /renderPdfSharePropertyMatches\(event\.currentTarget\.value\)/);
  assert.match(server, /d\.options AS document_options/);
  assert.match(server, /neutral: row\.document_options\?\.brandMode === "neutral"/);
});
