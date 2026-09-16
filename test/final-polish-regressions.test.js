const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { renderPropertyPage } = require("../seo-pages");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("el formulario de contacto de una ficha conserva la propiedad de origen", () => {
  const html = renderPropertyPage({
    id: "prop-123",
    slug: "departamento-prueba",
    titleEs: "Departamento de prueba",
    descriptionEs: "Descripción de prueba.",
    type: "Departamento",
    operation: "sale",
    state: "Quintana Roo",
    city: "Cancún",
    zone: "Puerto Cancún",
    currency: "USD",
    price: 900000,
    images: ["/assets/og-puerto-cancun-center.webp"],
  }, "es").html;

  assert.match(html, /name="leadType" value="comprador"/);
  assert.match(html, /name="propertyId" value="prop-123"/);
});

test("una publicación administrativa nueva inicia como borrador privado", () => {
  const html = read("index.html");
  const app = read("app.js");
  const server = read("server.js");

  assert.match(html, /<option value="draft" data-i18n="statusDraft" selected>Borrador<\/option>/);
  assert.doesNotMatch(html, /<input name="isPublic" type="checkbox" checked/);
  assert.match(app, /formField\(form, "status"\)\.value = "draft"/);
  assert.match(app, /formField\(form, "isPublic"\)\.checked = false/);
  assert.match(server, /if \(safeBody\.status === undefined\) safeBody\.status = "draft"/);
  assert.match(server, /if \(safeBody\.isPublic === undefined\) safeBody\.isPublic = false/);
});

test("el modal de solicitudes mantiene desplazamiento propio en móvil", () => {
  const styles = read("styles.css");
  assert.match(styles, /Mobile request modal: one scroll container/);
  assert.match(styles, /\.response-modal-body\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?overflow-y:\s*auto;/);
});
