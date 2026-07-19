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
    const document = new PDFDocument({ size: "LETTER", margin: 48, compress: false });
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

test("prepara cuatro imágenes y genera ambas fichas en una sola página", async () => {
  const sources = await Promise.all(["#184e77", "#52b788", "#f4a261", "#9d4edd"].map(imageDataUrl));
  const images = await preparePropertyPdfImages(sources);
  assert.equal(images.length, 4);

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
    lot: 0,
    mls: "TEST-001",
    descriptionEs: "Propiedad de prueba con superficie decimal para verificar la ficha comercial.",
  };

  for (const brandMode of ["branded", "neutral"]) {
    const pdf = await buildPdf(property, images, brandMode);
    assert.ok(pdf.length > 10000);
    assert.equal((pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length, 1);
    if (process.env.PDF_FIXTURE_DIR) {
      fs.mkdirSync(process.env.PDF_FIXTURE_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.PDF_FIXTURE_DIR, `property-${brandMode}.pdf`), pdf);
    }
  }
});
