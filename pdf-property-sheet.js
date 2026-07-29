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

async function preparePropertyPdfImages(images, limit = 4) {
  const safeLimit = Math.max(1, Math.min(12, Number(limit) || 4));
  const selected = (Array.isArray(images) ? images : []).filter(Boolean).slice(0, safeLimit);
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

function formatMoney(property) {
  const currency = property.currency === "MXN" || (!property.price && !property.priceUsd && property.priceMxn) ? "MXN" : "USD";
  const value = Number(property.price || (currency === "MXN" ? property.priceMxn : property.priceUsd) || 0);
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

function propertyLocation(property) {
  return [property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(" · ");
}

function drawNeutralHeader(document, title) {
  document.rect(0, 0, 595.28, 70).fill(COLORS.white);
  document.rect(0, 68, 595.28, 3).fill(COLORS.teal);
  document.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10).text(title, 42, 30, {
    width: 511,
    align: "center",
    characterSpacing: 1.1,
  });
}

function drawNeutralFooter(document, disclaimer) {
  document.strokeColor(COLORS.line).lineWidth(1).moveTo(42, 744).lineTo(553, 744).stroke();
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(7).text(
    String(disclaimer || "Información sujeta a disponibilidad, validación y cambios sin previo aviso."),
    42,
    752,
    { width: 365, height: 24, ellipsis: true }
  );
  document.text(
    `Generado: ${new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date())}`,
    403,
    765,
    { width: 150, align: "right", lineBreak: false }
  );
}

function drawNeutralPropertyPdf(document, { property, images, options }) {
  document.page.margins.bottom = 10;
  drawNeutralHeader(document, "FICHA NEUTRA DE PROPIEDAD");
  document.fillColor(COLORS.ink).font("Times-Bold").fontSize(20).text(property.titleEs, 42, 84, {
    width: 511,
    height: 46,
    ellipsis: true,
  });
  document.fillColor(COLORS.teal).font("Helvetica-Bold").fontSize(8.5).text(propertyLocation(property).toUpperCase(), 42, 132, {
    width: 511,
    height: 13,
    ellipsis: true,
  });

  const galleryImages = images.slice(0, 6);
  const galleryY = 153;
  if (galleryImages.length >= 3) {
    const cellWidth = 165;
    const cellHeight = 91;
    galleryImages.forEach((image, index) => {
      const x = 42 + (index % 3) * 173;
      const y = galleryY + Math.floor(index / 3) * 99;
      drawImageFrame(document, image, x, y, cellWidth, cellHeight);
    });
  } else if (galleryImages.length === 2) {
    drawImageFrame(document, galleryImages[0], 42, galleryY, 249, 190);
    drawImageFrame(document, galleryImages[1], 304, galleryY, 249, 190);
  } else if (galleryImages.length === 1) {
    drawImageFrame(document, galleryImages[0], 42, galleryY, 511, 190);
  } else {
    document.rect(42, galleryY, 511, 190).fillAndStroke(COLORS.surface, COLORS.line);
    document.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text("Fotografías no disponibles", 42, galleryY + 84, {
      width: 511,
      align: "center",
    });
  }

  document.fillColor(COLORS.gold).font("Times-Bold").fontSize(25).text(
    options.showPrice === false ? "INFORMACIÓN COMERCIAL" : formatMoney(property),
    42,
    359,
    { width: 330 }
  );
  document.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8).text(
    `${property.type || "Propiedad"} · ${property.operation === "rent" ? "EN RENTA" : "EN VENTA"}`.toUpperCase(),
    385,
    369,
    { width: 168, align: "right" }
  );

  const facts = [
    Number(property.beds) > 0 ? `${formatNumber(property.beds)} recámaras` : "",
    Number(property.baths) > 0 ? `${formatNumber(property.baths)} baños` : "",
    Number(property.area) > 0 ? `${formatNumber(property.area)} m² construcción` : "",
    Number(property.lot) > 0 ? `${formatNumber(property.lot)} m² terreno` : "",
    Number(property.parking) > 0 ? `${formatNumber(property.parking)} estacionamientos` : "",
    property.mls ? `MLS# ${property.mls}` : "",
  ].filter(Boolean);
  let pillX = 42;
  let pillY = 401;
  for (const fact of facts) {
    const estimatedWidth = Math.max(66, Math.min(130, fact.length * 5.1 + 22));
    if (pillX + estimatedWidth > 553) {
      pillX = 42;
      pillY += 30;
    }
    pillX += drawPill(document, fact, pillX, pillY) + 7;
  }

  let contentY = pillY + 39;
  if (options.showAddress && property.address) {
    document.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7.5).text("UBICACIÓN", 42, contentY);
    document.fillColor(COLORS.ink).font("Helvetica").fontSize(9).text(property.address, 106, contentY - 1, {
      width: 447,
      height: 14,
      ellipsis: true,
    });
    contentY += 22;
  }
  document.fillColor(COLORS.ink).font("Times-Bold").fontSize(14).text("Descripción", 42, contentY);
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(9.5).text(
    conciseDescription(property.descriptionEs || "Consulta la información completa de esta propiedad.", 980),
    42,
    contentY + 21,
    { width: 511, height: 105, lineGap: 2.5, ellipsis: true, align: "justify" }
  );
  const amenities = Array.isArray(property.amenities) ? property.amenities.filter(Boolean) : [];
  const amenitiesY = contentY + 136;
  document.fillColor(COLORS.ink).font("Times-Bold").fontSize(13).text("Amenidades", 42, amenitiesY);
  document.fillColor(COLORS.ink).font("Helvetica").fontSize(8.5).text(
    amenities.length ? amenities.slice(0, 12).map((item) => `• ${item}`).join("     ") : "No se registraron amenidades.",
    42,
    amenitiesY + 21,
    { width: 511, height: 44, lineGap: 4, ellipsis: true }
  );
  drawNeutralFooter(document, options.disclaimer);
}

function drawPropertyPdf(document, { property, images = [], propertyUrl, logoPath, options = {} }) {
  const branded = options.brandMode !== "neutral";
  document.page.margins.bottom = 10;
  document.info.Title = property.titleEs;
  document.info.Subject = branded ? "Ficha comercial de propiedad" : "Ficha detallada de propiedad";
  document.info.Author = branded ? "Puerto Cancún Center" : "Ficha de propiedad";
  document.info.Producer = branded ? "Puerto Cancún Center" : "Generador de ficha de propiedad";

  if (!branded) {
    drawNeutralPropertyPdf(document, { property, images, options });
    return;
  }

  document.rect(0, 0, 595.28, 86).fill(branded ? COLORS.navy : COLORS.white);
  document.rect(0, 84, 595.28, 3).fill(branded ? COLORS.gold : COLORS.line);
  if (branded && logoPath) {
    try {
      document.image(logoPath, 38, 12, { fit: [62, 62], align: "center", valign: "center" });
    } catch {
      // The text identity remains visible if the optional logo cannot be read.
    }
  }
  if (branded) {
    document.fillColor(COLORS.white).font("Times-Bold").fontSize(19).text("PUERTO CANCÚN CENTER", 112, 24, { width: 330 });
    document.fillColor("#cfe8e6").font("Helvetica").fontSize(8.5).text("SELECCIÓN INMOBILIARIA · CANCÚN, QUINTANA ROO", 112, 50, { characterSpacing: 0.7 });
    document.fillColor(COLORS.gold).font("Helvetica-Bold").fontSize(8).text("FICHA COMERCIAL", 445, 32, { width: 108, align: "right" });
  } else {
    document.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(11).text("FICHA DE PROPIEDAD", 42, 36, { width: 511, align: "center", characterSpacing: 1.1 });
  }

  document.fillColor(COLORS.ink).font("Times-Bold").fontSize(22).text(property.titleEs, 42, 106, { width: 511, height: 58, ellipsis: true, lineGap: 1 });
  document.fillColor(COLORS.teal).font("Helvetica-Bold").fontSize(9).text(
    [property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(" · ").toUpperCase(),
    42,
    166,
    { width: 511, height: 14, ellipsis: true }
  );

  const galleryY = 188;
  const galleryHeight = 220;
  if (images.length >= 3) {
    const cellWidth = 249;
    const cellHeight = 105;
    images.slice(0, 4).forEach((image, index) => {
      const x = index % 2 === 0 ? 42 : 304;
      const y = galleryY + Math.floor(index / 2) * 115;
      drawImageFrame(document, image, x, y, cellWidth, cellHeight);
    });
  } else if (images.length === 2) {
    drawImageFrame(document, images[0], 42, galleryY, 249, galleryHeight);
    drawImageFrame(document, images[1], 304, galleryY, 249, galleryHeight);
  } else if (images.length === 1) {
    drawImageFrame(document, images[0], 42, galleryY, 511, galleryHeight);
  } else {
    document.rect(42, galleryY, 511, galleryHeight).fillAndStroke(COLORS.surface, COLORS.line);
    document.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text("Fotografías disponibles en la publicación web", 42, galleryY + 94, { width: 511, align: "center" });
  }

  document.fillColor(COLORS.gold).font("Times-Bold").fontSize(25).text(
    options.showPrice === false ? "INFORMACIÓN COMERCIAL" : formatMoney(property),
    42,
    430,
    { width: 330 }
  );
  document.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8).text(
    `${property.type || "Propiedad"} · ${property.operation === "rent" ? "EN RENTA" : "EN VENTA"}`.toUpperCase(),
    385,
    440,
    { width: 168, align: "right" }
  );

  const facts = [
    Number(property.beds) > 0 ? `${formatNumber(property.beds)} recámaras` : "",
    Number(property.baths) > 0 ? `${formatNumber(property.baths)} baños` : "",
    Number(property.area) > 0 ? `${formatNumber(property.area)} m² construcción` : "",
    Number(property.lot) > 0 ? `${formatNumber(property.lot)} m² terreno` : "",
    Number(property.parking) > 0 ? `${formatNumber(property.parking)} estacionamientos` : "",
    property.mls ? `MLS# ${property.mls}` : "",
  ].filter(Boolean);
  let pillX = 42;
  let pillY = 475;
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

  const ctaY = 696;
  if (branded && propertyUrl) {
    document.roundedRect(42, ctaY, 250, 38, 3).fill(COLORS.teal);
    document.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(10).text("VER MÁS FOTOS Y DETALLES", 54, ctaY + 14, { width: 226, align: "center", link: propertyUrl, underline: false });
    document.link(42, ctaY, 250, 38, propertyUrl);
    document.fillColor(COLORS.teal).font("Helvetica-Bold").fontSize(8.5).text("ABRIR PUBLICACIÓN", 320, ctaY + 4, { width: 233, link: propertyUrl, underline: true });
    document.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(propertyUrl, 320, ctaY + 19, { width: 233, height: 22, link: propertyUrl, underline: false, ellipsis: true });
  }

  document.strokeColor(COLORS.line).lineWidth(1).moveTo(42, 742).lineTo(553, 742).stroke();
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(7).text(
    String(options.disclaimer || "Información sujeta a disponibilidad, validación y cambios sin previo aviso."),
    42,
    750,
    { width: 390, height: 22, ellipsis: true }
  );
  if (branded) document.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(8).text("+52 1 998 216 6563", 442, 750, { width: 111, align: "right", lineBreak: false });
  document.fillColor(COLORS.muted).font("Helvetica").fontSize(6.8).text(
    `Generado: ${new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date())}`,
    442,
    764,
    { width: 111, align: "right", lineBreak: false }
  );
}

module.exports = { drawPropertyPdf, preparePropertyPdfImages };
