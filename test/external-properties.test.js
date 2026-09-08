const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const {
  externalPropertyWhatsappText,
  normalizeExternalPropertyInput,
  renderExternalPropertyShareHtml,
  toExternalProperty,
} = require("../external-property-utils");

const sourceRow = {
  id: "external-property-test-1",
  reference_code: "EXT-TEST01",
  title_es: "Departamento frente al mar",
  title_en: "Oceanfront apartment",
  type: "Departamento",
  operation: "sale",
  state: "Quintana Roo",
  city: "Cancun",
  zone: "Zona Hotelera",
  neighborhood: "Punta Cancun",
  address: "Boulevard Kukulcan",
  latitude: "21.134",
  longitude: "-86.747",
  price_currency: "USD",
  price_amount: "1250000",
  price_unit: "total",
  beds: 3,
  baths: "3.5",
  parking: 2,
  area: "245",
  lot: "0",
  features: ["Vista al mar"],
  amenities: ["Alberca"],
  keywords: ["playa"],
  images: ["data:image/webp;base64,AAAA", "data:image/webp;base64,BBBB"],
  image_metadata: [{ descriptionEs: "Sala con vista al mar", descriptionEn: "Ocean-view living room" }],
  image_count: 2,
  description_es: "Propiedad confirmada para colaboración inmobiliaria.",
  description_en: "Confirmed property for real-estate collaboration.",
  additional_information: "Disponibilidad sujeta a confirmación.",
  status: "available",
  external_contact_name: "Agente Privado",
  external_company: "Inmobiliaria Confidencial",
  external_phone: "+52 998 000 0000",
  external_whatsapp: "+52 998 111 1111",
  external_email: "privado@example.com",
  internal_notes: "Comisión interna reservada.",
  external_additional_info: "No compartir sin autorización.",
  created_at: "2026-09-08T10:00:00.000Z",
  updated_at: "2026-09-08T10:00:00.000Z",
};

test("normaliza publicaciones externas y exige identificar su origen", () => {
  assert.throws(
    () => normalizeExternalPropertyInput({ title: "Casa", type: "Casa", zone: "Cancun" }, { id: "external-1" }),
    /nombre del colega o la empresa/i
  );
  const property = normalizeExternalPropertyInput({
    title: "Casa de colaboración",
    type: "Casa",
    zone: "Puerto Cancun",
    externalCompany: "Socio inmobiliario",
    features: "Terraza, Vista al canal, terraza",
    status: "available",
    price: "850000",
  }, { id: "external-2", images: ["data:image/webp;base64,AAAA"] });
  assert.equal(property.referenceCode.startsWith("EXT-"), true);
  assert.deepEqual(property.features, ["Terraza", "Vista al canal"]);
  assert.equal(property.price, 850000);
  assert.equal(property.images.length, 1);
  assert.equal(property.beds, 0);
  assert.equal(property.baths, 0);
  assert.equal(property.parking, 0);
  assert.equal(property.area, 0);
  assert.equal(property.lot, 0);
});

test("la vista sin contacto elimina todos los campos privados desde el origen", () => {
  const privateView = toExternalProperty(sourceRow, { includePrivate: true, mediaBase: "/ext/TestCode123/media" });
  const neutralView = toExternalProperty(sourceRow, { includePrivate: false, mediaBase: "/ext/TestCode123/media" });
  assert.equal(privateView.externalContact.email, "privado@example.com");
  assert.equal(Object.hasOwn(neutralView, "externalContact"), false);
  assert.deepEqual(neutralView.images, ["/ext/TestCode123/media/0", "/ext/TestCode123/media/1"]);

  const neutralMessage = externalPropertyWhatsappText(neutralView, "https://pic.estate/ext/TestCode123", { includeContact: false });
  assert.match(neutralMessage, /EXT/u);
  assert.match(neutralMessage, /https:\/\/pic\.estate\/ext\/TestCode123/);
  assert.doesNotMatch(neutralMessage, /Agente Privado|Inmobiliaria Confidencial|privado@example\.com|998 111 1111/);

  const contactMessage = externalPropertyWhatsappText(privateView, "https://pic.estate/ext/TestCode123", { includeContact: true });
  assert.match(contactMessage, /Agente Privado/);
  assert.match(contactMessage, /privado@example\.com/);
});

test("la presentación privada usa Pick.State, EXT y directivas estrictas de no indexación", () => {
  const neutralView = toExternalProperty(sourceRow, { includePrivate: false, mediaBase: "/ext/TestCode123/media" });
  const neutralHtml = renderExternalPropertyShareHtml(neutralView, {
    shareUrl: "https://pic.estate/ext/TestCode123",
    includeContact: false,
  });
  assert.match(neutralHtml, /PICK\.STATE/);
  assert.match(neutralHtml, /EXT · COLABORACIÓN/);
  assert.match(neutralHtml, /noindex,nofollow,noarchive,nosnippet,noimageindex/);
  assert.doesNotMatch(neutralHtml, /Puerto Canc[uú]n Center/i);
  assert.doesNotMatch(neutralHtml, /Agente Privado|Inmobiliaria Confidencial|privado@example\.com|Comisión interna/);

  const privateView = toExternalProperty(sourceRow, { includePrivate: true, mediaBase: "/ext/TestCode123/media" });
  const contactHtml = renderExternalPropertyShareHtml(privateView, {
    shareUrl: "https://pic.estate/ext/TestCode123",
    includeContact: true,
  });
  assert.match(contactHtml, /CONTACTO AUTORIZADO/);
  assert.match(contactHtml, /Agente Privado/);
  assert.match(contactHtml, /privado@example\.com/);
  assert.doesNotMatch(contactHtml, /Comisión interna reservada|No compartir sin autorización/);
});

test("el inventario externo usa almacenamiento, rutas y permisos separados del catálogo público", () => {
  const server = source("server.js");
  const schema = source("db/schema.sql");
  const html = source("index.html");
  const app = source("app.js");
  const env = source(".env.example");

  assert.match(server, /id: "0009-external-properties"/);
  assert.match(server, /CREATE TABLE IF NOT EXISTS external_properties/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS external_properties/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS external_property_share_links/);
  assert.doesNotMatch(schema.match(/CREATE TABLE IF NOT EXISTS external_properties[\s\S]+?;/)?.[0] || "", /DROP|TRUNCATE/i);
  assert.match(server, /app\.get\("\/api\/admin\/external-properties", requireRole\("admin"\)/);
  assert.match(server, /app\.post\("\/api\/admin\/external-properties", requireRole\("admin"\)/);
  assert.match(server, /app\.put\("\/api\/admin\/external-properties\/:id", requireRole\("admin"\)/);
  assert.match(server, /app\.delete\("\/api\/admin\/external-properties\/:id", requireRole\("admin"\)/);
  assert.doesNotMatch(server, /app\.(?:get|post|put|patch|delete)\("\/api\/external-properties/);
  assert.match(server, /app\.get\("\/ext\/:code"/);
  assert.match(server, /app\.get\("\/ext\/:code\/media\/:index"/);
  assert.match(server, /"X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex"/);
  assert.match(server, /publicShareDomain = String\(process\.env\.PUBLIC_SHARE_DOMAIN/);
  assert.match(env, /PUBLIC_SHARE_DOMAIN=https:\/\/pic\.estate/);

  const publicProperties = server.match(/async function getPublicProperties\(\)[\s\S]+?^}/m)?.[0] || "";
  assert.match(publicProperties, /FROM properties p WHERE p\.is_public = TRUE/);
  assert.doesNotMatch(publicProperties, /external_properties/);

  assert.match(html, /data-admin-section="external-properties"/);
  assert.match(html, /id="externalPropertyForm"/);
  assert.match(html, /id="externalShareModal"/);
  assert.match(html, /name="includeContact" value="false" checked/);
  assert.match(app, /function renderExternalProperties/);
  assert.match(app, /function externalPropertySubmit/);
  assert.match(app, /function externalShareSubmit/);
  assert.match(app, /externalPropertySearchTimer = window\.setTimeout/);
});
