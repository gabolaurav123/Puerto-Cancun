"use strict";

// Read-only evidence collection. This does not classify, publish or alter a record.
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require("sharp");

async function main() {
  const [snapshotPath, archivePath, sourcesPath, outputPath] = process.argv.slice(2);
  if (!outputPath) throw Error("Usage: node scripts/audit-presale-galleries.cjs PUBLIC.json ADMIN_ARCHIVE.json SOURCES.json OUTPUT_DIRECTORY");
  const [snapshot, archive, sourceData] = await Promise.all([snapshotPath, archivePath, sourcesPath].map(async file => JSON.parse(await fs.readFile(file, "utf8"))));
  const out = path.resolve(outputPath); await fs.mkdir(path.join(out, "images"), { recursive: true });
  const publicRows = snapshot.properties.filter(row => row.publicationSection === "developments");
  const publicIds = new Set(publicRows.map(row => row.id));
  const rows = [...publicRows, ...archive.developments.filter(row => !publicIds.has(row.id))].sort((a, b) => a.titleEs.localeCompare(b.titleEs, "es"));
  const sources = new Map(sourceData.developments.map(row => [row.id, row.source]));
  const records = [], images = [];
  for (const row of rows) {
    const source = sources.get(row.id);
    const record = { id: row.id, title: row.titleEs, public: publicIds.has(row.id), status: row.status, sourceSnapshot: publicIds.has(row.id) ? snapshotPath : archivePath,
      sourceCommercialStatus: source?.commercialStatusFromSource || [], sourceFiles: source?.sources?.map(item => ({ file: item.file, sheet: item.sheet, row: item.row, title: item.title, url: item.photoOrGalleryUrl || item.representativeUrl })) || [],
      explicitModality: row.catalogData?.salesModality || "unclassified", stage: row.developmentData?.stage || "", imageIndices: [] };
    const gallery = [...new Set([...(row.images || []), row.image].filter(Boolean))];
    for (let i = 0; i < gallery.length; i++) {
      const number = images.length + 1;
      images.push({ number, id: row.id, title: row.titleEs, imageIndex: i, source: gallery[i], public: record.public, localFile: `images/${String(number).padStart(4, "0")}.jpg` });
      record.imageIndices.push(number);
    }
    records.push(record);
  }
  // The control unit is reviewed separately and is never treated as a development.
  for (const row of snapshot.properties.filter(row => String(row.mls) === "2013" && row.publicationSection === "properties")) {
    const record = { id: row.id, title: row.titleEs, public: true, entity: "property", mls: row.mls, status: row.status, explicitModality: row.catalogData?.salesModality || "unclassified", sourceCommercialStatus: ["Public title and description explicitly state preventa"], sourceFiles: [], imageIndices: [] };
    for (const [i, source] of (row.images || []).entries()) {
      const number = images.length + 1; images.push({ number, id: row.id, title: row.titleEs, imageIndex: i, source, public: true, localFile: `images/${String(number).padStart(4, "0")}.jpg` }); record.imageIndices.push(number);
    }
    records.push(record);
  }
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < images.length) {
      const item = images[cursor++];
      try {
        let bytes;
        if (item.source.startsWith("data:image/")) bytes = Buffer.from(item.source.split(",")[1], "base64");
        else {
          const url = new URL(item.source, "https://www.puertocancun.center");
          if (url.hostname !== "www.puertocancun.center" && url.hostname !== "puertocancun.center") throw Error("External source requires separate review");
          url.searchParams.set("w", "640");
          const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
          if (!response.ok) throw Error(`HTTP ${response.status}`);
          bytes = Buffer.from(await response.arrayBuffer());
        }
        item.sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
        const meta = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
        item.width = meta.width; item.height = meta.height;
        await sharp(bytes).rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(path.join(out, item.localFile));
      } catch (error) { item.error = error.message; }
      if (item.number % 50 === 0) console.log(`Collected ${item.number}/${images.length}`);
    }
  }));
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" }[c]));
  const sheets = [];
  for (let offset = 0; offset < images.length; offset += 20) {
    const selected = images.slice(offset, offset + 20), overlays = [];
    for (let index = 0; index < selected.length; index++) {
      const item = selected[index], x = (index % 4) * 300, y = Math.floor(index / 4) * 230;
      if (!item.error) overlays.push({ input: await sharp(path.join(out, item.localFile)).resize(296, 185, { fit: "contain", background: "#e7eeee" }).toBuffer(), left: x + 2, top: y + 2 });
      const label = `<svg width="300" height="42"><rect width="300" height="42" fill="white"/><text x="5" y="15" font-size="13" font-family="Arial" font-weight="bold">${item.number} · ${escape(item.title.slice(0, 34))}</text><text x="5" y="34" font-size="12" font-family="Arial">imagen ${item.imageIndex + 1}${item.error ? " · ERROR" : ""}</text></svg>`;
      overlays.push({ input: Buffer.from(label), left: x, top: y + 187 });
    }
    const file = `sheet-${String(sheets.length + 1).padStart(2, "0")}.jpg`;
    await sharp({ create: { width: 1200, height: Math.ceil(selected.length / 4) * 230, channels: 3, background: "#c6d3d5" } }).composite(overlays).jpeg({ quality: 90 }).toFile(path.join(out, file));
    sheets.push({ file, images: selected.map(item => item.number) });
  }
  // Keep source data URLs out of the human-readable evidence index.
  for (const item of images) if (item.source.startsWith("data:")) item.source = `Archived embedded gallery image ${item.imageIndex + 1}`;
  const result = { capturedAt: new Date().toISOString(), mode: "READ_ONLY_REQUIRES_VISUAL_CLASSIFICATION", archiveCapturedAt: archive.capturedAt, records, images, sheets };
  await fs.writeFile(path.join(out, "manifest.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ records: records.length, images: images.length, errors: images.filter(item => item.error).length, sheets: sheets.length }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
