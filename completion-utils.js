const crypto = require("crypto");
const sharp = require("sharp");

function featureEnabled(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return !["0", "false", "off", "no"].includes(String(value).trim().toLowerCase());
}

function cleanText(value, limit = 20000) {
  return String(value || "").replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function sourceField(value, confidence, page = null) {
  return { value: value === undefined || value === "" ? null : value, confidence, page };
}

function extractBrochureFields(text) {
  const content = cleanText(text, 120000);
  const lines = content.split(/(?<=[.!?])\s+|\s{2,}/).map((line) => line.trim()).filter(Boolean);
  const first = lines.find((line) => line.length >= 8 && line.length <= 140) || null;
  const match = (pattern) => content.match(pattern)?.[1]?.trim() || null;
  const priceMatch = content.match(/(?:desde|precio(?:\s+desde)?|starting at)\s*[:\-]?\s*(?:MXN|USD|US\$|\$)?\s*([\d,.]+)\s*(MXN|USD|pesos|d[oó]lares)?/i);
  const currency = priceMatch?.[2]
    ? /mxn|peso/i.test(priceMatch[2]) ? "MXN" : "USD"
    : /\bMXN\b|pesos mexicanos/i.test(content) ? "MXN" : /\bUSD\b|US\$/i.test(content) ? "USD" : null;
  const price = priceMatch ? Number(String(priceMatch[1]).replace(/,/g, "")) || null : null;
  const amenityVocabulary = [
    "alberca", "piscina", "marina", "gimnasio", "spa", "coworking", "tenis", "pádel",
    "club de playa", "seguridad", "lobby", "roof garden", "salón de eventos", "jardines",
  ];
  const folded = content.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const amenities = amenityVocabulary.filter((item) => folded.includes(item.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
  const delivery = match(/(?:entrega|fecha de entrega|delivery)\s*[:\-]?\s*([^.;\n]{4,60})/i);
  const developer = match(/(?:desarrollador|developer|desarrollado por)\s*[:\-]?\s*([^.;\n]{2,100})/i);
  const address = match(/(?:ubicaci[oó]n|direcci[oó]n|address)\s*[:\-]?\s*([^.;\n]{4,180})/i);
  const units = match(/(?:unidades|residencias|departamentos)\s*[:\-]?\s*(\d{1,5})/i);
  const description = lines.filter((line) => line.length >= 80).slice(0, 4).join(" ").slice(0, 2500) || null;
  return {
    title: sourceField(first, first ? 0.58 : 0, 1),
    description: sourceField(description, description ? 0.52 : 0, 1),
    developer: sourceField(developer, developer ? 0.82 : 0),
    type: sourceField(/departamentos?|condominios?/i.test(content) ? "Departamento" : /casas?|villas?/i.test(content) ? "Casa" : null, 0.6),
    zone: sourceField(match(/(?:zona|zone)\s*[:\-]?\s*([^.;\n]{3,100})/i), 0.62),
    address: sourceField(address, address ? 0.72 : 0),
    amenities: sourceField(amenities, amenities.length ? 0.74 : 0),
    priceFrom: sourceField(price, price ? 0.78 : 0),
    currency: sourceField(currency, currency ? 0.82 : 0),
    status: sourceField(/preventa|pre-sale|presale/i.test(content) ? "Preventa" : null, 0.7),
    estimatedDelivery: sourceField(delivery, delivery ? 0.7 : 0),
    units: sourceField(units ? Number(units) : null, units ? 0.78 : 0),
    additionalInformation: sourceField(content.slice(0, 6000) || null, content ? 0.45 : 0, 1),
  };
}

function publicationReadiness(property = {}) {
  const images = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
  const blocking = [];
  const improvements = [];
  if (!cleanText(property.titleEs || property.title_es, 200)) blocking.push("Título en español");
  if (!cleanText(property.descriptionEs || property.description_es, 1000)) blocking.push("Descripción en español");
  if (!cleanText(property.zone, 120)) blocking.push("Zona");
  if (!Number(property.price || property.price_amount || property.price_usd || property.price_mxn)) blocking.push("Precio");
  if (!images.length && !property.image) blocking.push("Imagen de portada");
  if (!property.latitude || !property.longitude) improvements.push("Ubicación precisa");
  if (images.length < 5) improvements.push("Mínimo recomendado de 5 fotografías");
  if (cleanText(property.descriptionEs || property.description_es).length < 220) improvements.push("Descripción comercial más completa");
  if (!Array.isArray(property.amenities) || !property.amenities.length) improvements.push("Amenidades");
  const score = Math.max(0, Math.min(100, 100 - blocking.length * 20 - improvements.length * 6));
  return { score, publishable: blocking.length === 0, blocking, improvements };
}

async function analyzeImageBuffer(buffer, context = {}) {
  const exactHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const image = sharp(buffer, { limitInputPixels: 40_000_000, failOn: "warning" }).rotate();
  const metadata = await image.metadata();
  const { data } = await image.clone().resize(8, 8, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const average = data.reduce((sum, value) => sum + value, 0) / Math.max(1, data.length);
  const perceptualHash = Array.from(data, (value) => value >= average ? "1" : "0")
    .join("")
    .match(/.{1,4}/g)
    .map((bits) => Number.parseInt(bits, 2).toString(16))
    .join("");
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  const lowResolution = width < 1000 || height < 700;
  const title = cleanText(context.title || "propiedad", 140);
  return {
    exactHash,
    perceptualHash,
    width,
    height,
    format: metadata.format || "unknown",
    sizeBytes: buffer.length,
    lowResolution,
    possibleWatermark: null,
    classification: "sin_clasificar",
    tags: lowResolution ? ["revisar-resolución"] : ["alta-resolución"],
    suggestedAlt: `${title}, fotografía ${Number(context.index || 0) + 1}`,
    technicalNote: "La detección de marcas de agua y espacios requiere visión IA; la validación técnica, hashes y resolución son deterministas.",
  };
}

function hammingDistance(first, second) {
  const a = String(first || "");
  const b = String(second || "");
  if (!a || a.length !== b.length) return Infinity;
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) {
    const value = Number.parseInt(a[index], 16) ^ Number.parseInt(b[index], 16);
    distance += value.toString(2).replace(/0/g, "").length;
  }
  return distance;
}

module.exports = {
  analyzeImageBuffer,
  cleanText,
  extractBrochureFields,
  featureEnabled,
  hammingDistance,
  publicationReadiness,
};
