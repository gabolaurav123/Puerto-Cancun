"use strict";

const crypto = require("node:crypto");
const sharp = require("sharp");
const { parsePublicUrl } = require("./development-cover-recovery");

function problem(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function captionText(value) {
  return String(value || "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function validateCoverItem(item) {
  if (!item || !/^[a-zA-Z0-9-]{1,160}$/.test(String(item.id || ""))) throw problem("ID de desarrollo inválido.");
  const expected = Date.parse(item.expectedUpdatedAt);
  if (!Number.isFinite(expected)) throw problem(`Falta la fecha original de ${item.id}.`);
  if (typeof item.publish !== "boolean") throw problem("Indica si la portada se publicará.");
  let sourcePageUrl, sourceImageUrl;
  try {
    sourcePageUrl = parsePublicUrl(item.sourcePageUrl).href;
    sourceImageUrl = parsePublicUrl(item.sourceImageUrl).href;
  } catch { throw problem("Las fuentes deben ser enlaces públicos HTTP o HTTPS."); }
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(item.imageDataUrl || ""));
  if (!match || match[1].length > 5_600_000) throw problem("Adjunta una portada WebP de hasta 4 MB.");
  const input = Buffer.from(match[1], "base64");
  if (!input.length || input.length > 4 * 1024 * 1024 || input.toString("base64") !== match[1]) throw problem("La imagen codificada es inválida o demasiado grande.");
  let metadata, bytes;
  try {
    metadata = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
    if (metadata.format !== "webp" || (metadata.pages || 1) !== 1 || metadata.width < 480 || metadata.height < 270) throw new Error("Invalid cover");
    bytes = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate().resize({ width: 1400, height: 1100, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  } catch { throw problem("La portada debe ser una imagen WebP estática de al menos 480 × 270 px."); }
  return {
    id: String(item.id), expectedUpdatedAt: new Date(expected).toISOString(), publish: item.publish,
    sourcePageUrl, sourceImageUrl, caption: captionText(item.caption), captionEn: captionText(item.captionEn),
    imageDataUrl: `data:image/webp;base64,${bytes.toString("base64")}`,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"), width: metadata.width, height: metadata.height,
  };
}

/** Caller must BEGIN and COMMIT/ROLLBACK on this same dedicated PG client. */
async function applyDevelopmentCoverBatch(client, items) {
  if (!Array.isArray(items) || !items.length || items.length > 10) throw problem("Selecciona entre 1 y 10 portadas revisadas por lote.");
  const prepared = [];
  for (const item of items) prepared.push(await validateCoverItem(item));
  if (new Set(prepared.map(item => item.id)).size !== prepared.length) throw problem("El lote contiene desarrollos duplicados.");
  const { rows } = await client.query(
    `SELECT id, title_es, description_es, publication_section, status, is_public, updated_at, images, image,
            image_metadata, development_data, published_at
     FROM properties WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE`,
    [prepared.map(item => item.id)],
  );
  const records = new Map(rows.map(row => [row.id, row]));
  for (const item of prepared) {
    const row = records.get(item.id);
    if (!row || row.publication_section !== "developments") throw problem(`No se encontró el desarrollo ${item.id}.`, 404);
    if (!["draft", "active", "featured"].includes(row.status)) throw problem(`${row.title_es}: su estado impide publicar una portada por este flujo.`, 409);
    if (new Date(row.updated_at).toISOString() !== item.expectedUpdatedAt) throw problem(`${row.title_es}: fue editado después de la revisión; vuelve a consultarlo.`, 409);
    const images = typeof row.images === "string" ? JSON.parse(row.images) : row.images;
    if ((Array.isArray(images) && images.some(Boolean)) || String(row.image || "").trim()) throw problem(`${row.title_es}: ya tiene una portada. Se conservó la imagen existente.`, 409);
    if (!String(row.title_es || "").trim() || String(row.description_es || "").trim().length < 80) throw problem(`${row.title_es || item.id}: necesita título y descripción antes de publicar.`, 409);
  }
  const results = [];
  for (const item of prepared) {
    const row = records.get(item.id);
    const data = row.development_data && typeof row.development_data === "object" ? row.development_data : {};
    const recoveredAt = new Date().toISOString();
    const developmentData = { ...data, coverRecovery: {
      sourcePageUrl: item.sourcePageUrl, sourceImageUrl: item.sourceImageUrl, imageSha256: item.sha256,
      recoveredAt, reviewed: true, originalStatus: row.status, originalIsPublic: row.is_public,
    } };
    const saved = await client.query(
      `UPDATE properties SET image = $2, images = $3::jsonb, image_metadata = $4::jsonb, development_data = $5::jsonb,
         status = CASE WHEN $6::boolean AND status = 'draft' THEN 'active' ELSE status END,
         is_public = CASE WHEN $6::boolean THEN TRUE ELSE is_public END,
         published_at = CASE WHEN $6::boolean THEN COALESCE(published_at, NOW()) ELSE published_at END,
         updated_at = NOW()
       WHERE id = $1 AND date_trunc('milliseconds', updated_at) = date_trunc('milliseconds', $7::timestamptz)
       RETURNING id, title_es, status, is_public, updated_at`,
      [item.id, item.imageDataUrl, JSON.stringify([item.imageDataUrl]), JSON.stringify([{ descriptionEs: item.caption, descriptionEn: item.captionEn }]), JSON.stringify(developmentData), item.publish, item.expectedUpdatedAt],
    );
    if (saved.rows.length !== 1) throw problem(`${row.title_es}: cambió durante la revisión.`, 409);
    const current = saved.rows[0];
    results.push({ id: item.id, title: current.title_es, status: current.status, isPublic: current.is_public, updatedAt: current.updated_at, sha256: item.sha256, sourcePageUrl: item.sourcePageUrl, sourceImageUrl: item.sourceImageUrl });
  }
  return results;
}

module.exports = { applyDevelopmentCoverBatch, validateCoverItem };
