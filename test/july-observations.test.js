const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { renderSeoPage } = require("../seo-pages");

const root = path.resolve(__dirname, "..");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
const schemaSource = fs.readFileSync(path.join(root, "db", "schema.sql"), "utf8");

test("propiedades y desarrollos tienen inventarios y altas independientes", () => {
  assert.match(indexSource, /data-admin-section="properties"/);
  assert.match(indexSource, /data-admin-section-link="new-property"/);
  assert.match(indexSource, /data-admin-section="developments"/);
  assert.match(indexSource, /data-admin-section-link="new-development"/);
  assert.match(appSource, /property\.publicationSection === "developments"/);
  assert.match(serverSource, /development_data JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
});

test("mailing y PDF buscan propiedades por MLS o título", () => {
  assert.match(indexSource, /id="campaignPropertySearch"[^>]+list="campaignPropertySuggestions"/);
  assert.match(indexSource, /id="pdfPropertySearch"[^>]+list="pdfPropertySuggestions"/);
  assert.match(appSource, /function populatePropertyPicker/);
  assert.match(appSource, /property\.mls/);
  assert.match(appSource, /property\.titleEs/);
});

test("la moneda publicada se guarda como dato original y no como preferencia de idioma", () => {
  assert.match(schemaSource, /price_currency TEXT NOT NULL DEFAULT 'USD'/);
  assert.match(schemaSource, /price_amount NUMERIC/);
  assert.match(indexSource, /<select name="currency" required>/);
  assert.match(indexSource, /<input name="price" type="number"/);
  assert.match(serverSource, /currency,\s+price,\s+priceUsd,\s+priceMxn/s);
});

test("CRM permite editar contactos sin abrir un cliente de correo", () => {
  assert.match(indexSource, /name="id" type="hidden"/);
  assert.match(indexSource, /id="cancelContactEdit"/);
  assert.match(appSource, /function editContact/);
  assert.match(appSource, /method: id \? "PATCH" : "POST"/);
  assert.doesNotMatch(appSource, /mailto:/);
});

test("blog, calculadora y búsquedas de compradores tienen superficie pública", () => {
  assert.match(serverSource, /app\.get\("\/api\/blog"/);
  assert.match(serverSource, /app\.get\("\/api\/public\/buyer-requirements"/);
  assert.match(serverSource, /app\.post\("\/api\/admin\/blog"/);
  assert.match(renderSeoPage("/calculadora-hipotecaria"), /mortgageCalculatorForm/);
  assert.match(renderSeoPage("/blog"), /publicBlogList/);
  assert.match(renderSeoPage("/busquedas-clientes"), /buyerRequirementsPublic/);
});

test("marketing e IA producen entregables de contenido y una propuesta visual", () => {
  assert.match(indexSource, /id="marketingCreativeForm"/);
  assert.match(indexSource, /value="seo">Paquete SEO/);
  assert.match(indexSource, /value="blog">Artículo para el blog/);
  assert.match(indexSource, /value="ads">Anuncios para Meta y Google/);
  assert.match(indexSource, /value="email_sequence">Secuencia de seguimiento/);
  assert.match(serverSource, /app\.post\("\/api\/admin\/ai\/generate-image"/);
  assert.match(serverSource, /type: "image_generation"/);
});
