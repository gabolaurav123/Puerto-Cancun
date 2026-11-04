"use strict";

// Read an authenticated sources export saved locally. This script never connects
// to the application database or publishes/edits inventory records.
const fs = require("node:fs/promises");
const path = require("node:path");
const { inspectDevelopment } = require("../development-cover-recovery");

async function main() {
  const [input, output, rawLimit] = process.argv.slice(2);
  if (!input || !output) throw new Error("Uso: node scripts/audit-development-covers.cjs FUENTES.json DIRECTORIO [LIMITE]");
  const data = JSON.parse(await fs.readFile(input, "utf8"));
  const records = Array.isArray(data) ? data : data.developments || data.sources;
  if (!Array.isArray(records)) throw new Error("El archivo no contiene desarrollos");
  const limit = rawLimit ? Number(rawLimit) : records.length;
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Límite inválido");
  const outputDir = path.resolve(output);
  await fs.mkdir(outputDir, { recursive: true });
  const results = [];
  let index = 0;
  const selected = records.slice(0, limit);
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (index < selected.length) {
      const item = selected[index++];
      const result = await inspectDevelopment(item, { outputDir: path.join(outputDir, "images") });
      results.push(result);
      await fs.writeFile(path.join(outputDir, `${result.id}.json`), JSON.stringify(result, null, 2) + "\n");
      console.log(JSON.stringify({ id: result.id, candidates: result.candidates.length, skipped: result.skipped || null, errors: result.errors.length }));
    }
  }));
  const hashes = new Map();
  for (const result of results) for (const candidate of result.candidates) {
    const ids = hashes.get(candidate.sha256) || new Set();
    ids.add(result.id);
    hashes.set(candidate.sha256, ids);
  }
  const sharedImages = [...hashes].filter(([, ids]) => ids.size > 1).map(([sha256, ids]) => ({ sha256, developmentIds: [...ids], reviewReason: "La misma imagen aparece en varios desarrollos; confirmar identidad antes de publicarla." }));
  const report = { capturedAt: new Date().toISOString(), mode: "READ_ONLY_CANDIDATES_REQUIRE_VISUAL_REVIEW", records: results, sharedImages, summary: { total: results.length, withCandidates: results.filter(item => item.candidates.length).length, candidates: results.reduce((sum, item) => sum + item.candidates.length, 0), sharedImageHashes: sharedImages.length, published: 0 } };
  await fs.writeFile(path.join(outputDir, "cover-review.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
