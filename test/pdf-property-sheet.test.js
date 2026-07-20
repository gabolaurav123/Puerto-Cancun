const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");
const { drawPropertyPdf, preparePropertyPdfImages } = require("../pdf-property-sheet");

async function imageDataUrl(color) {
  const buffer = await sharp({ create: { width: 640, height: 420, channels: 3, background: color } }).png().toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function buildPdf(property, images, brandMode) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48, compress: false });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));
    drawPropertyPdf(document, {
      property,
      images,
      propertyUrl: "https://example.com/propiedad",
      options: { brandMode, showPrice: true, showAddress: true },
    });
    document.end();
  });
}

test("genera la ficha institucional en una página y la neutra con información ampliada", async () => {
  const sources = await Promise.all([
    "#184e77",
    "#52b788",
    "#f4a261",
    "#9d4edd",
    "#e76f51",
    "#457b9d",
    "#2a9d8f",
    "#e9c46a",
  ].map(imageDataUrl));
  const brandedImages = await preparePropertyPdfImages(sources);
  const neutralImages = await preparePropertyPdfImages(sources, 12);
  assert.equal(brandedImages.length, 4);
  assert.equal(neutralImages.length, 8);

  const property = {
    titleEs: "Departamento frente al mar",
    type: "Departamento",
    operation: "sale",
    state: "Quintana Roo",
    city: "Cancún / Benito Juárez",
    zone: "Puerto Cancún",
    neighborhood: "Marina Puerto Cancún",
    address: "Marina Puerto Cancún",
    priceUsd: 1250000,
    beds: 3,
    baths: 3,
    parking: 2,
    area: 105.08,
    lot: 250.75,
    mls: "TEST-001",
    amenities: ["Alberca", "Marina", "Gimnasio", "Seguridad 24/7", "Spa", "Terraza", "Elevador"],
    descriptionEs: "Propiedad de prueba con superficie decimal, distribución funcional, acabados residenciales y espacios amplios. ".repeat(24),
  };

  const brandedPdf = await buildPdf(property, brandedImages, "branded");
  const neutralPdf = await buildPdf(property, neutralImages, "neutral");
  const brandedPageCount = (brandedPdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length;
  const neutralPageCount = (neutralPdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length;

  assert.ok(brandedPdf.length > 10000);
  assert.ok(neutralPdf.length > brandedPdf.length);
  assert.equal(brandedPageCount, 1);
  assert.ok(neutralPageCount >= 4);

  if (process.env.PDF_FIXTURE_DIR) {
    fs.mkdirSync(process.env.PDF_FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.PDF_FIXTURE_DIR, "property-branded.pdf"), brandedPdf);
    fs.writeFileSync(path.join(process.env.PDF_FIXTURE_DIR, "property-neutral.pdf"), neutralPdf);
  }
});

test("todas las propiedades ofrecen PDF institucional y neutro", () => {
  const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const serverSource = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  const routeStart = serverSource.indexOf('app.post("/api/admin/documents/generate"');
  const routeEnd = serverSource.indexOf('app.get("/api/admin/documents/:id/download"', routeStart);
  const generateRoute = serverSource.slice(routeStart, routeEnd);

  assert.match(indexSource, /data-generate-selected-property-pdf="branded"/);
  assert.match(indexSource, /data-generate-selected-property-pdf="neutral"/);
  assert.match(appSource, /data-generate-property-pdf=.*data-pdf-mode="branded"/s);
  assert.match(appSource, /data-generate-property-pdf=.*data-pdf-mode="neutral"/s);
  assert.match(generateRoute, /SELECT \* FROM properties WHERE id = \$1/);
  assert.match(generateRoute, /options\.brandMode === "neutral" \? 12 : 4/);
  assert.doesNotMatch(generateRoute, /is_public\s*=|status\s*=/i);
});
