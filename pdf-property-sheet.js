const sharp = require("sharp");

const COLORS = {
  navy: "#032f3a",
  teal: "#086a78",
  gold: "#d3a63c",
  ink: "#12343b",
  muted: "#5d7478",
  line: "#d4e4e1",
  surface: "#f4f8f6",
  white: "#ffffff",
};

function decodeImageDataUrl(value) {
  const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([a-z0-9+/=\s]+)$/i.exec(String(value || ""));
  return match ? Buffer.from(match[1], "base64") : null;
}

async function fetchImageBuffer(value) {
  const dataBuffer = decodeImageDataUrl(value);
  if (dataBuffer) return dataBuffer;
  if (!/^https?:\/\//i.test(String(value || ""))) return null;
  const response = await fetch(value, { signal: AbortSignal.timeout(9000) });
  if (!response.ok) return null;
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 12 * 1024 * 1024) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.length <= 12 * 1024 * 1024 ? buffer : null;
}

async function preparePropertyPdfImages(images) {
  const selected = (Array.isArray(images) ? images : []).filter(Boolean).slice(0, 2);
  const prepared = await Promise.all(selected.map(async (image) => {
    try {
      const input = await fetchImageBuffer(image);
      if (!input) return null;
      return await sharp(input)
        .rotate()
        .resize({ width: 1400, height: 1000, fit: "inside", withoutEnlargement: true })
        .flatten({ background: COLORS.white })
        .jpeg({ quality: 84, chromaSubsampling: "4:4:4" })
        .toBuffer();
    } catch {
      return null;
    }
  }));
  return prepared.filter(Boolean);
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatMoney(property, currencyPreference = "") {
  const useMxn = currencyPreference === "MXN" && property.priceMxn;
  const value = useMxn ? property.priceMxn : property.priceUsd || property.priceMxn;
  const currency = useMxn ? "MXN" : property.priceUsd ? "USD" : "MXN";
  return value ? `${currency} ${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value)}` : "Precio a consultar";
}

function drawPill(document, text, x, y) {
  const width = Math.max(66, Math.min(130, document.widthOfString(text, { font: "Helvetica-Bold", size: 8 }) + 22));
  document.roundedRect(x, y, width, 24, 3).fillAndStroke(COLORS.surface, COLORS.line);
  document.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(8).text(text, x + 10, y + 8, { width: width - 20, align: "center", lineBreak: false });
  return width;
}

function drawImageFrame(document, image, x, y, width, height) {
  document.rect(x, y, width, height).fillAndStroke(COLORS.surface, COLORS.line);
  document.image(image, x + 5, y + 5, { fit: [width - 10, height - 10], align: "center", valign: "center" });
}

function conciseDescription(value, limit = 720) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit).trimEnd()}...` : clean;
}

function drawPropertyPdf(document, { property, images = [], propertyUrl, logoPath, options = {} }) {
  document.info.Title = property.titleEs;
  document.info.Subject = "Ficha comercial de propiedad";
  document.info.Author = "Puerto Cancún Center";

  document.rect(0, 0, 595.28, 86).fill(COLORS.navy);
  document.rect(0, 84, 595.28, 3).fill(COLORS.gold);
  if (logoPath) {
    try {
      document.image(logoPath, 38, 12, { fit: [62, 62], align: "center", valign: "center" });
    } catch {
      // The text identity remains visible if the optional logo cannot be read.
    }
  }
  document.fillColor(COLORS.white).font("Times-Bold").fontSize(19).text("PUERTO CANCÚN CENTER", 112, 24, { width: 330 });
  document.fillColor("#cfe8e6").font("Helvetica").fontSize(8.5).text("SELECCIÓN INMOBILIARIA · CANCÚN, QUINTANA ROO", 112, 50, { characterSpacing: 0.7 });
  document.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(8).text("FICHA COMERCIAL", 445, 32, { width: 108, align: "right" });

  document.fillColor(COLORS.ink).font("Times-Bold").fontSize(22).text(property.titleEs, 42, 106, { width: 511, height: 58, ellipsis: true, lineGap: 1 });
  document.fillColor(COLORS.teal).font("Helvetica-Bold").fontSize(9).text(
    [property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(" · ").toUpperCase(),
    42,
    166,
    { width: 511, height: 14, ellipsis: true }
  );

  const galleryY = 188;
  const galleryHeight = 200;
  if (images.length >= 2) {
    drawImageFrame(document, images[0], 42, galleryY, 249, galleryHeight);
    drawImageFrame(document, images[1], 304, galleryY, 249, galleryHeight);
  } else if (images.length === 1) {
    drawImageFrame(document, images[0], 42, galleryY, 511, galleryHeight);
  } else {
    document.rect(42, galleryY, 511, galleryHeight).fillAndStroke(COLORS.surface, COLORS.line);
    document.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text("Fotografías disponibles en la publicación web", 42, galleryY + 94, { width: 511, align: "center" });
  }

  document.fillColor(COLORS.gold).font("Times-Bold").fontSize(25).text(
    options.showPrice === false ? "INFORMACIÓN COMERCIAL" : formatMoney(property, options.currency),
    42,
    410,
    { width: 330 }
  );
  document.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8).text(
    `${property.type || "Propiedad"} · ${property.operation === "rent" ? "EN RENTA" : "EN VENTA"}`.toUpperCase(),
    385,
    420,
    { width: 168, align: "right" }
  );

  const facts = [
    property.beds ? `${formatNumber(property.beds)} recámaras` : "",
    property.baths ? `${formatNumber(property.baths)} baños` : "",
    property.area ? `${formatNumber(property.area)} m² construcción` : "",
    property.lot ? `${formatNumber(property.lot)} m² terreno` : "",
    property.parking ? `${formatNumber(property.parking)} estacionamientos` : "",
    property.mls ? `MLS# ${property.mls}` : "",
  ].filter(Boolean);
  let pillX = 42;
  let pillY = 455;
  for (const fact of facts) {
    const estimatedWidth = Math.max(66, Math.min(130, fact.length * 5.1 + 22));
    if (pillX + estimatedWidth > 553) {
      pillX = 42;
      pillY += 30;
    }
    pillX += drawPill(document, fact, pillX, pillY) + 7;
  }

  const detailY = pillY + 43;
  document.fillColor(COLORS.ink).font("Times-Bold").fontSize(15).text("Detalles de la propiedad", 42, detailY);
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(9.5).text(
    conciseDescription(property.descriptionEs || "Consulta la información completa con nuestro equipo inmobiliario."),
    42,
    detailY + 24,
    { width: 511, height: 88, lineGap: 3, ellipsis: true, align: "justify" }
  );

  if (options.showAddress && property.address) {
    document.fillColor(COLORS.teal).font("Helvetica-Bold").fontSize(8).text(`DIRECCIÓN: ${property.address}`, 42, detailY + 119, { width: 511, height: 12, ellipsis: true });
  }

  const ctaY = 704;
  document.roundedRect(42, ctaY, 250, 38, 3).fill(COLORS.teal);
  document.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(10).text("VER MÁS FOTOS Y DETALLES", 54, ctaY + 14, { width: 226, align: "center", link: propertyUrl, underline: false });
  document.link(42, ctaY, 250, 38, propertyUrl);
  document.fillColor(COLORS.teal).font("Helvetica-Bold").fontSize(8.5).text("ABRIR PUBLICACIÓN", 320, ctaY + 4, { width: 233, link: propertyUrl, underline: true });
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(propertyUrl, 320, ctaY + 19, { width: 233, height: 22, link: propertyUrl, underline: false, ellipsis: true });

  document.strokeColor(COLORS.line).lineWidth(1).moveTo(42, 752).lineTo(553, 752).stroke();
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(7).text(
    String(options.disclaimer || "Información sujeta a disponibilidad, validación y cambios sin previo aviso."),
    42,
    762,
    { width: 390, height: 24, ellipsis: true }
  );
  document.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(8).text("+52 1 998 216 6563", 442, 762, { width: 111, align: "right", lineBreak: false });
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(6.8).text(
    `Generado: ${new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date())}`,
    442,
    776,
    { width: 111, align: "right", lineBreak: false }
  );
}

module.exports = { drawPropertyPdf, preparePropertyPdfImages };
