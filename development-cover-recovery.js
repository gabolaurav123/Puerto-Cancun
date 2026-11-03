"use strict";

const dns = require("node:dns/promises");
const net = require("node:net");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_EXT = /\.(?:jpg|jpeg|png|webp|avif)(?:[?#]|$)/i;
const NON_SOURCE_HOST = /(^|\.)(?:google\.[a-z.]+|bing\.com|facebook\.com|instagram\.com|youtube\.com|youtu\.be|maps\.app\.goo\.gl)$/i;
const BAD_IMAGE_NAME = /(?:^|[/_.-])(?:logo|icon|favicon|placeholder|avatar|sprite|badge)(?:[/_.-]|$)/i;
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const fold = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function parsePublicUrl(value, base) {
  let url;
  try { url = new URL(value, base); } catch { throw new Error("URL inválida"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("URL no permitida");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || (!host.includes(".") && !net.isIP(host))) throw new Error("Destino local no permitido");
  if (net.isIP(host) && !publicAddress(host)) throw new Error("Dirección privada no permitida");
  url.hash = "";
  return url;
}

function publicAddress(address) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) || (a === 198 && [18, 19].includes(b)));
  }
  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return !(/^(?:::|fc|fd|fe[89ab]|ff)/.test(normalized) || normalized.startsWith("2001:db8:"));
  }
  return false;
}

async function validateDestination(url, lookup = dns.lookup) {
  const parsed = parsePublicUrl(url);
  const addresses = await lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error("El destino resuelve a una red no pública");
  return parsed;
}

async function fetchBounded(value, { maxBytes = MAX_PAGE_BYTES, fetchImpl = fetch, lookup = dns.lookup } = {}) {
  let url = parsePublicUrl(value);
  for (let redirects = 0; redirects <= 4; redirects++) {
    await validateDestination(url.href, lookup);
    const response = await fetchImpl(url.href, { redirect: "manual", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "PuertoCancun-CoverReview/1.0", Accept: "text/html,image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.5" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location || redirects === 4) throw new Error("Redirección inválida o excesiva");
      url = parsePublicUrl(location, url.href);
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
    if (Number(response.headers.get("content-length")) > maxBytes) { await response.body?.cancel(); throw new Error("Archivo demasiado grande"); }
    const parts = []; let length = 0;
    for await (const chunk of response.body || []) {
      length += chunk.length;
      if (length > maxBytes) { throw new Error("Archivo demasiado grande"); }
      parts.push(chunk);
    }
    return { url: url.href, contentType: (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase(), bytes: Buffer.concat(parts), fetchedAt: new Date().toISOString() };
  }
  throw new Error("No se pudo resolver la fuente");
}

function sourceLinks(development) {
  const source = development.source || development.developmentData?.importSource || development.development_data?.importSource || {};
  const rows = Array.isArray(source.sources) ? source.sources : [];
  const found = new Map();
  for (const row of rows) {
    for (const field of ["photoOrGalleryUrl", "representativeUrl"]) {
      for (const text of String(row[field] || "").match(/https?:\/\/[^\s<>"|]+/gi) || []) {
        try {
          const url = parsePublicUrl(text.replace(/[),;]+$/, ""));
          if (NON_SOURCE_HOST.test(url.hostname)) continue;
          const existing = found.get(url.href) || { url: url.href, kind: IMAGE_EXT.test(url.href) ? "image" : "page", references: [] };
          existing.references.push({ file: row.file || "", sheet: row.sheet || "", row: row.row ?? null, title: row.title || "", field });
          found.set(url.href, existing);
        } catch { /* Invalid, private and non-web URLs cannot be recovery sources. */ }
      }
    }
  }
  return [...found.values()];
}

function decodeHtml(value) {
  return String(value || "").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#(?:39|x27);/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#(\d+);/g, (_all, code) => Number(code) <= 0x10ffff ? String.fromCodePoint(Number(code)) : "");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4]);
  return result;
}

function imageCandidates(html, pageUrl, developmentTitle) {
  const title = decodeHtml(String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const candidates = new Map();
  const add = (value, reason, caption = "") => {
    if (!value) return;
    try {
      const url = parsePublicUrl(value, pageUrl);
      if (BAD_IMAGE_NAME.test(url.pathname) || NON_SOURCE_HOST.test(url.hostname)) return;
      if (!candidates.has(url.href)) candidates.set(url.href, { url: url.href, reason, pageTitle: title, caption: caption.slice(0, 300), requiresVisualReview: true });
    } catch { /* Ignore malformed or unsafe candidates. */ }
  };
  for (const match of String(html).matchAll(/<meta\b[^>]*>/gi)) {
    const attr = attributes(match[0]);
    if (["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes((attr.property || attr.name || "").toLowerCase()) && attr.content) add(attr.content, "page-social-image");
  }
  const uniqueTokens = fold(developmentTitle).split(/[^a-z0-9]+/).filter(token => token.length >= 4 && !["cancun", "puerto", "residencial", "residences", "residential", "condos", "departamentos", "torres", "towers", "desarrollo"].includes(token));
  if (uniqueTokens.length) for (const match of String(html).matchAll(/<img\b[^>]*>/gi)) {
    const attr = attributes(match[0]);
    const name = fold([attr.alt, attr.title, attr.src, attr["data-src"]].join(" "));
    if (uniqueTokens.some(token => name.includes(token))) add(attr["data-src"] || attr.src, "named-image-in-source", attr.alt || attr.title || "");
  }
  return [...candidates.values()].slice(0, 6);
}

async function validateImage(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Imagen vacía o demasiado grande");
  const metadata = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
  if (!["jpeg", "png", "webp", "avif"].includes(metadata.format) || metadata.pages > 1 || metadata.width < 480 || metadata.height < 270) throw new Error("No es una fotografía estática de tamaño suficiente");
  const output = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" }).rotate().resize({ width: 1400, height: 1100, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  return { bytes: output, width: metadata.width, height: metadata.height, sourceSha256: hash(bytes), sha256: hash(output) };
}

async function inspectDevelopment(development, { outputDir, fetchResource = fetchBounded } = {}) {
  const id = String(development.id || "");
  if (!/^[a-zA-Z0-9-]{1,160}$/.test(id)) throw new Error("ID de desarrollo inválido");
  const result = { id, title: development.titleEs || development.title || "", status: development.status, updatedAt: development.updatedAt || null, sources: sourceLinks(development), candidates: [], errors: [], action: "review-only", writesToInventory: false };
  if (development.status === "archived") return { ...result, skipped: "archived" };
  if (development.images?.length || development.imageCount > 0) return { ...result, skipped: "has-existing-images" };
  if (!result.sources.length) return { ...result, skipped: "no-recoverable-source" };
  const seen = new Set();
  for (const source of result.sources.slice(0, 8)) {
    try {
      const response = await fetchResource(source.url, { maxBytes: source.kind === "image" ? MAX_IMAGE_BYTES : MAX_PAGE_BYTES });
      const direct = response.contentType.startsWith("image/");
      const candidates = direct ? [{ url: response.url, reason: "source-image", requiresVisualReview: true }] : response.contentType === "text/html" ? imageCandidates(response.bytes.toString("utf8"), response.url, result.title) : [];
      for (const candidate of candidates) {
        if (seen.has(candidate.url) || result.candidates.length >= 3) continue;
        seen.add(candidate.url);
        try {
          const imageResponse = direct ? response : await fetchResource(candidate.url, { maxBytes: MAX_IMAGE_BYTES });
          if (!imageResponse.contentType.startsWith("image/")) throw new Error("La URL no responde con una imagen");
          const image = await validateImage(imageResponse.bytes);
          if (result.candidates.some(item => item.sha256 === image.sha256)) continue;
          const fileName = `${id}-${image.sha256.slice(0, 12)}.webp`;
          if (outputDir) { await fs.mkdir(outputDir, { recursive: true }); await fs.writeFile(path.join(outputDir, fileName), image.bytes); }
          result.candidates.push({ ...candidate, resolvedUrl: imageResponse.url, sourceUrl: source.url, references: source.references, width: image.width, height: image.height, sourceSha256: image.sourceSha256, sha256: image.sha256, fileName, fetchedAt: imageResponse.fetchedAt, approved: false });
        } catch (error) { result.errors.push({ url: candidate.url, reason: error.message }); }
      }
      if (result.candidates.length >= 3) break;
    } catch (error) { result.errors.push({ url: source.url, reason: error.message }); }
  }
  return result;
}

module.exports = { sourceLinks, imageCandidates, parsePublicUrl, publicAddress, validateDestination, fetchBounded, validateImage, inspectDevelopment };
