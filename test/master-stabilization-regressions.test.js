const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const server = source("server.js");
const app = source("app.js");
const html = source("index.html");
const styles = source("styles.css");
const schema = source(path.join("db", "schema.sql"));

test("las solicitudes rápidas admiten cero o varias imágenes y conservan su ubicación", () => {
  const guestForm = html.match(/<form id="guestSaleForm"[\s\S]+?<\/form>/)?.[0] || "";
  const guestEndpoint = server.match(/app\.post\("\/api\/guest-sale-requests"[\s\S]+?app\.post\("\/api\/leads"/)?.[0] || "";
  assert.ok(guestForm, "Falta el formulario de venta sin registro");
  assert.doesNotMatch(guestForm, /name="imageFile"[^>]*required/);
  assert.match(guestForm, /data-map-picker/);
  assert.match(guestForm, /name="latitude"/);
  assert.match(guestForm, /name="longitude"/);
  assert.match(guestEndpoint, /parseUploadedImages\(body, \[\]\)/);
  assert.doesNotMatch(guestEndpoint, /!images\.length/);
  for (const field of ["state", "city", "zone", "neighborhood", "address", "latitude", "longitude", "map_place"]) {
    assert.match(schema, new RegExp(`\\b${field}\\b`, "i"));
  }
});

test("aprobar solicitudes con o sin fotos crea un borrador privado de forma transaccional", () => {
  const registeredApproval = server.match(/app\.post\("\/api\/admin\/requests\/:id\/approve"[\s\S]+?app\.post\("\/api\/admin\/requests\/:id\/reject"/)?.[0] || "";
  const guestApproval = server.match(/app\.post\("\/api\/admin\/guest-sale-requests\/:id\/approve"[\s\S]+?app\.delete\("\/api\/admin\/contacts/)?.[0] || "";
  assert.doesNotMatch(registeredApproval, /requestImages\.length\s*===\s*0[\s\S]*status\(400\)/);
  assert.match(registeredApproval, /publishReady \? "active" : "draft"/);
  assert.match(guestApproval, /BEGIN/);
  assert.match(guestApproval, /'draft', FALSE/);
  assert.match(guestApproval, /source_request_id/);
  assert.match(guestApproval, /COMMIT/);
  assert.match(app, /async function approveGuestSaleRequest/);
  assert.match(app, /data-approve-guest-request/);
});

test("el catálogo sugiere ubicaciones en tiempo real sin impedir texto libre y sincroniza el mapa", () => {
  const listingForm = html.match(/<form id="listingForm"[\s\S]+?<\/form>/)?.[0] || "";
  for (const field of ["state", "city", "zone", "neighborhood"]) {
    assert.match(listingForm, new RegExp(`<input name="${field}"[^>]+data-location-select`));
  }
  assert.match(app, /select\.setAttribute\("list", select\.dataset\.locationListId\)/);
  assert.match(app, /async function reverseGeocodeMapPosition/);
  assert.match(app, /applyGeocodedLocation/);
  assert.match(server, /app\.get\("\/api\/reverse-geocode"/);
  assert.match(server, /async function reverseGeocodeCoordinates/);
  assert.match(server, /app\.get\("\/api\/geocode\/suggestions"/);
  assert.match(server, /async function geocodeAddressSuggestions/);
  assert.match(app, /data-map-search-suggestions/);
  assert.match(app, /scheduleMapAddressSuggestions/);
  assert.match(app, /selectMapAddressSuggestion/);
});

test("las respuestas verifican pertenencia, conservan el aviso interno y reportan el correo real", () => {
  assert.match(server, /allowedTables = new Set\(\["seller_request", "lead_request", "guest_sale_request"\]\)/);
  assert.match(server, /emailSent: false/);
  assert.match(server, /internal: true/);
  assert.match(server, /sendTransactionalEmail/);
  assert.match(server, /emailStatus/);
  assert.match(server, /WHERE n\.id = \$1[\s\S]+n\.user_id = \$2/);
  assert.match(app, /Seguimiento guardado\. No se afirmó un envío externo/);
  assert.match(app, /guestCanReceiveEmail/);
  assert.match(app, /form\.notifyUser\.disabled = guestRequest && !guestCanReceiveEmail/);
});

test("las fichas usan códigos cortos auditables y mantienen la ruta firmada histórica", () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS document_share_links/);
  assert.match(schema, /open_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(server, /PUBLIC_SHARE_DOMAIN/);
  assert.match(server, /app\.get\("\/f\/:code"/);
  assert.match(server, /open_count = open_count \+ 1/);
  assert.match(server, /app\.get\("\/fichas\/:id"/);
  assert.match(server, /Consulta la ficha completa/);
  assert.doesNotMatch(server.match(/function propertyWhatsappSheetText[\s\S]+?\n}/)?.[0] || "", /undefined|null/);
});

test("desarrollos empiezan como borrador y las superficies modificadas caben en móvil", () => {
  assert.match(app, /developmentMode && !formField\(form, "id"\)\?\.value/);
  assert.match(app, /formField\(form, "status"\)\.value = "draft"/);
  assert.match(app, /formField\(form, "isPublic"\)\.checked = false/);
  assert.match(styles, /\.admin-mailing-card \.module-split[\s\S]+grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /\.response-form \.form-actions[\s\S]+position: sticky/);
  assert.match(styles, /\.response-modal[\s\S]+height: min\(880px, calc\(100dvh - 44px\)\)/);
  assert.match(styles, /\.request-context-panel,[\s\S]+overscroll-behavior: contain/);
  assert.match(server, /\$14::numeric,[\s\S]+CASE WHEN \$14::numeric > 0/);
  assert.match(styles, /\.guest-sale-modal,[\s\S]+width: 100vw/);
});
