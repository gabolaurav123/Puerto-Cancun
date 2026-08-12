const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const seoSource = fs.readFileSync(path.join(root, "seo-pages.js"), "utf8");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");

test("el idioma se guarda antes de navegar y tambien se controla desde los paneles", () => {
  assert.match(appSource, /localStorage\.setItem\(keys\.lang, nextLanguage\)/);
  assert.match(appSource, /storedLanguage !== renderedLanguage/);
  assert.match(indexSource, /id="panelLanguageToggle"/);
  assert.match(indexSource, /name="titleEn"/);
  assert.match(indexSource, /name="descriptionEn"/);
  assert.match(serverSource, /automaticallyTranslateProperty/);
  assert.match(serverSource, /titleEnStored/);
  assert.match(seoSource, /localizedAmenity\(item, lang\)/);
  assert.match(seoSource, /"seguridad 24\/7": "24\/7 security"/);
  assert.doesNotMatch(serverSource, /Original property description:\\n\$\{descriptionEs\}/);
  assert.match(serverSource, /function propertyEnglishFallback/);
  assert.match(appSource, /descriptionSummary = truncateText\(localizedDescription\(property\), 190\)/);
  assert.match(appSource, /class="property-description">\$\{escapeHtml\(descriptionSummary\)\}/);
  assert.match(seoSource, /descriptionSummary = excerptText\(description\)/);
  assert.match(seoSource, /class="seo-property-description">\$\{escapeHtml\(descriptionSummary\)\}/);
});

test("desarrollos usa un formulario reducido sin datos propios de una unidad", () => {
  assert.doesNotMatch(indexSource, /data-development-fields/);
  assert.match(indexSource, /data-property-only/);
  assert.match(appSource, /container\.hidden = developmentMode/);
  assert.match(appSource, /developmentMode \? 0 : Number\(field\("beds"\)/);
  assert.match(serverSource, /developmentMode \? 0 : parseNonNegativeInteger\(body\.beds/);
});

test("cada imagen conserva descripciones bilingues y la ficha PDF se comparte por WhatsApp", () => {
  assert.match(serverSource, /image_metadata JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(serverSource, /function normalizeImageMetadata/);
  assert.match(appSource, /data-image-description="es"/);
  assert.match(appSource, /data-image-description="en"/);
  assert.match(appSource, /data-share-document/);
  assert.match(serverSource, /app\.post\("\/api\/admin\/documents\/:id\/share"/);
  assert.match(serverSource, /app\.get\("\/fichas\/:id"/);
  assert.match(serverSource, /Consulta la ficha completa/);
});

test("desarrollos tiene destino editorial y pagina publica propia", () => {
  assert.match(indexSource, /name="publicationSection"/);
  assert.match(indexSource, /data-admin-section="developments"/);
  assert.match(indexSource, /data-admin-section-link="new-development"/);
  assert.doesNotMatch(indexSource, /data-development-fields/);
  assert.match(serverSource, /publication_section TEXT NOT NULL DEFAULT 'properties'/);
  assert.match(indexSource, /id="developmentsNavLink"/);
});

test("el mapa inicia con pin y permite buscar ubicaciones libres", () => {
  assert.match(appSource, /data-map-search-submit/);
  assert.match(appSource, /marker\.setVisible\(true\)/);
  assert.match(appSource, /marker\.setOpacity\(1\)/);
  assert.match(appSource, /geocodeMapAddress\(picker, query\)/);
});

test("las cuentas registradas alimentan el CRM y las campanas pueden enviar mailing", () => {
  assert.match(serverSource, /source: "registered_account"/);
  assert.match(serverSource, /\/api\/admin\/campaigns\/:id\/send-email/);
  assert.match(serverSource, /RESEND_API_KEY/);
  assert.match(serverSource, /MAIL_FROM/);
  assert.match(serverSource, /recipient_mode TEXT NOT NULL DEFAULT 'segment'/);
  assert.match(serverSource, /normalizeRecipientEmails/);
  assert.match(appSource, /data-compose-email/);
  assert.match(appSource, /function openEmailComposer/);
  assert.doesNotMatch(appSource, /mailto:/);
});

test("la biblioteca rechaza PDF con acciones activas", async () => {
  process.env.SESSION_SECRET ||= "test-session-secret-1234567890";
  process.env.ADMIN_PASSWORD ||= "test-admin-password-123";
  process.env.ADMIN_USERNAME ||= "admin-prueba";
  const { sanitizeUploadedFile } = require("../server");
  await assert.rejects(
    sanitizeUploadedFile({
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n1 0 obj <</JavaScript 2 0 R>> endobj"),
      content: "",
    }),
    /no permitido/
  );
});
