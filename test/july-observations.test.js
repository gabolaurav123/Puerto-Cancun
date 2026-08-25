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
  assert.match(indexSource, /id="adminListings" data-admin-listing-view="properties developments"/);
  assert.match(indexSource, /class="panel-card-subhead listings-subhead" data-admin-listing-view="properties developments"/);
  assert.match(serverSource, /development_data JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
});

test("mailing y PDF buscan propiedades por MLS o título", () => {
  assert.match(indexSource, /id="campaignPropertySearch"[^>]+list="campaignPropertySuggestions"/);
  assert.match(indexSource, /id="pdfPropertySearch"[^>]+aria-controls="pdfPropertyMatches"/);
  assert.doesNotMatch(indexSource, /id="pdfPropertySearch"[^>]+\slist=/);
  assert.match(appSource, /function populatePropertyPicker/);
  assert.match(appSource, /property\.mls/);
  assert.match(appSource, /property\.titleEs/);
});

test("la moneda publicada se guarda como dato original y no como preferencia de idioma", () => {
  assert.match(schemaSource, /price_currency TEXT NOT NULL DEFAULT 'USD'/);
  assert.match(schemaSource, /price_amount NUMERIC/);
  assert.match(indexSource, /<select name="currency" required>/);
  assert.match(indexSource, /<input name="price" type="number"/);
  assert.match(serverSource, /currency,\s+price: developmentMode \? null : price,\s+priceUsd: developmentMode \? null : priceUsd,\s+priceMxn: developmentMode \? null : priceMxn/s);
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
  assert.match(indexSource, /data-ai-category="publication"/);
  assert.match(indexSource, /data-ai-category="commercial"/);
  assert.match(indexSource, /data-ai-category="operation"/);
  assert.match(indexSource, /data-ai-tool="quality_audit"/);
  assert.match(indexSource, /data-ai-tool="duplicate_risk"/);
  assert.match(indexSource, /data-ai-tool="market_position"/);
  assert.match(indexSource, /data-ai-tool="email_sequence"/);
  assert.match(serverSource, /app\.post\("\/api\/admin\/ai\/generate-image"/);
  assert.match(serverSource, /provider: "property-media-layout"/);
  assert.match(serverSource, /source: "property-gallery-best-resolution"/);
  assert.match(serverSource, /puerto-cancun-logo\.png/);
  assert.doesNotMatch(serverSource, /type: "image_generation"/);
});
