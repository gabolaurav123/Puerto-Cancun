"use strict";

// The only network operation is one unauthenticated GET. No application/DB modules load.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const REPO = path.resolve(__dirname, "..");
const ROOT = path.resolve(REPO, "../..");
const PRIOR = path.join(ROOT, "output/excel-import-20261026");
const OUT = path.join(ROOT, "output/master-20261029/audit");
const contractPath = path.join(REPO, "inventory-contract.js");
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const contractHash = sha(fs.readFileSync(contractPath));
const inventory = require(contractPath);
const stable = (v) => JSON.stringify(canonical(v));
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])]));
  return v;
}
const digest = (v) => sha(stable(v));
const read = (dir, name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const write = (name, value) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(value, null, 2) + "\n");
const norm = (v) => inventory.fold(v).replace(/[^a-z0-9]+/g, " ").trim();
const idSet = (rows) => new Set(rows.map((p) => p.id));
const counts = (values) => values.reduce((a, v) => (a[v] = (a[v] || 0) + 1, a), {});
const safeText = (s) => String(s ?? "").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email omitted]").replace(/(?:\+\d[\d ()-]{8,}\d)/g, "[phone omitted]");

function publicProjection(p) {
  const fields = ["id", "titleEs", "type", "publicationSection", "status", "isPublic", "mls", "zone", "city", "neighborhood", "address", "latitude", "longitude", "locationPrecision", "googleMapsUrl", "operation", "currency", "priceUnit", "price", "priceUsd", "priceMxn", "area", "lot", "beds", "baths", "developmentId", "slug", "urlEs", "createdAt", "updatedAt"];
  const result = Object.fromEntries(fields.filter((key) => p[key] !== undefined).map((key) => [key, typeof p[key] === "string" ? safeText(p[key]) : p[key]]));
  result.parentDevelopment = p.parentDevelopment ? { id: p.parentDevelopment.id, propertyId: p.parentDevelopment.propertyId, nameEs: safeText(p.parentDevelopment.nameEs) } : null;
  result.imageCount = Array.isArray(p.images) ? p.images.length : Number(Boolean(p.image));
  result.descriptionSha256 = sha(String(p.descriptionEs || ""));
  result.descriptionPlaceholder = inventory.isPlaceholder(p.descriptionEs);
  result.location = inventory.resolveLocation(p);
  result.normalizedPrice = inventory.priceOf(p);
  result.quality = inventory.quality(p);
  return result;
}

function reconcile(label, items) {
  const report = inventory.reconcile(items);
  const ids = counts(items.map((p) => p.id || "[missing]"));
  assert.equal(report.counts.reduce((sum, group) => sum + group.total, 0), report.total);
  for (const group of report.counts) assert.equal(group.locations.reduce((sum, l) => sum + l.total, 0), group.total);
  return {
    label, contractVersion: report.version, contractSha256: contractHash, rawRows: items.length, uniqueInternalIds: report.total,
    duplicateInternalIds: Object.entries(ids).filter(([, count]) => count > 1), missingInternalIds: items.filter((p) => !p.id).length,
    counts: report.counts,
    records: report.records.map((r) => ({ id: r.id, entity: r.entity, public: r.public, status: r.status,
      location: r.location, qualityIssueCodes: r.quality.issues.map((issue) => issue.code),
      ...(r.public ? { title: safeText(r.title), mls: r.mls, duplicateMlsIds: r.duplicateMlsIds } : { privateDetailsOmitted: true }) })),
  };
}

function comparePublic(before, after) {
  const bm = new Map(before.map((p) => [p.id, p])), am = new Map(after.map((p) => [p.id, p]));
  const fields = ["titleEs", "type", "publicationSection", "status", "isPublic", "mls", "zone", "city", "neighborhood", "address", "latitude", "longitude", "googleMapsUrl", "operation", "currency", "priceUnit", "price", "priceUsd", "priceMxn", "area", "lot", "descriptionEs", "developmentId", "parentDevelopment", "images"];
  return {
    beforeRows: before.length, afterRows: after.length,
    addedIds: [...am.keys()].filter((id) => !bm.has(id)), removedIds: [...bm.keys()].filter((id) => !am.has(id)),
    changed: [...am].filter(([id]) => bm.has(id)).map(([id, p]) => ({ id, fields: fields.filter((key) => stable(p[key]) !== stable(bm.get(id)[key])) })).filter((p) => p.fields.length),
    comparisonFields: fields,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const evidence = read(OUT, "xlsx-evidence.json");
  const manifest = read(PRIOR, "import-manifest.json");
  const applied = read(PRIOR, "import-result.json");
  const verified = read(PRIOR, "import-verification.json");
  const before = read(PRIOR, "admin-inventory-before.json").properties;
  const publicBefore = read(PRIOR, "public-inventory-snapshot.json").properties;
  const publicAfter = read(PRIOR, "public-inventory-after.json").properties;
  const preview = read(PRIOR, "import-preview.json");
  const visibility = read(PRIOR, "public-visibility-verification.json");
  const historyFiles = ["analyze.py", "build-manifest.cjs", "import-drafts.cjs", "final-report.cjs", "preflight.json", "import-preview.json", "admin-inventory-before.json", "import-manifest.json", "import-result.json", "import-verification.json", "public-inventory-snapshot.json", "public-inventory-after.json", "public-visibility-verification.json"];
  const historyHashes = historyFiles.map((name) => ({ file: name, sha256: sha(fs.readFileSync(path.join(PRIOR, name))) }));
  for (const book of evidence.books) assert.equal(sha(fs.readFileSync(book.path)), book.sha256, "XLSX changed since extraction");
  assert.equal(sha(fs.readFileSync(path.join(PRIOR, "import-manifest.json"))), applied.manifestSha256);
  assert.equal(sha(fs.readFileSync(path.join(PRIOR, "admin-inventory-before.json"))), manifest.inventoryBeforeSha256);
  const databaseComparisons = ["properties", "developments"].map((table) => {
    const bm = new Map(applied.before[table].map((r) => [r.id, r.digest]));
    const am = new Map(applied.after[table].map((r) => [r.id, r.digest]));
    return { table, before: bm.size, after: am.size, added: [...am.keys()].filter((id) => !bm.has(id)).length,
      removed: [...bm.keys()].filter((id) => !am.has(id)).length, changedExisting: [...bm].filter(([id, hash]) => am.has(id) && am.get(id) !== hash).length };
  });
  const createdIds = idSet(applied.created), verifiedIds = idSet(verified.rows);
  assert.deepEqual([...createdIds].sort(), [...verifiedIds].sort());
  assert.deepEqual([...createdIds].sort(), [...idSet(manifest.entries)].sort());
  const mainGroups = new Map();
  for (const row of evidence.rows) mainGroups.set(row.nameKey, [...(mainGroups.get(row.nameKey) || []), row]);
  const excluded = new Map(manifest.excluded.map((r) => [norm(r.title), r]));
  const entries = new Map(manifest.entries.map((r) => [norm(r.titleEs), r]));
  const ledger = [];
  for (const [name, group] of mainGroups) {
    // The historical Python normalizer drops curly apostrophes; JS replaces them.
    const manifestName = norm(group[0].title);
    const entry = entries.get(manifestName), omission = excluded.get(manifestName);
    assert.ok(Boolean(entry) !== Boolean(omission), "Each normalized group must be created OR excluded");
    group.forEach((row, index) => ledger.push({ file: row.file, sheet: row.sheet, row: row.row, title: row.title,
      sourceSha256: row.sourceSha256, rowSha256: row.rowSha256, sourceRowKey: row.sourceRowKey,
      historicalDisposition: index > 0 ? "additional-normalized-name-occurrence" : entry ? "new-private-draft" : "excluded-existing-or-alias",
      historicalTargetId: entry?.id || omission?.existingId || null, reason: omission?.reason || (index > 0 ? "prior-name-consolidation-not-proof-of-identity" : "manifest-and-result"),
      humanReviewRequired: group.length > 1 || omission?.reason === "possible-alias-preserved", plannedWrite: false }));
  }
  assert.equal(ledger.length, evidence.summary.mainDataRows);
  const byPosition = new Map(evidence.rows.map((r) => [[r.file, r.sheet, r.row].join("|"), r]));
  const sourceMismatches = [], sourcePositions = new Set();
  for (const entry of manifest.entries) for (const source of entry.developmentData.importSource.sources) {
    const key = [source.file, source.sheet, source.row].join("|");
    sourcePositions.add(key);
    const actual = byPosition.get(key);
    const fields = ["title", "description", "representativeUrl", "photoOrGalleryUrl", "addressReference", "googleMapsUrl"];
    if (!actual || fields.some((f) => actual[f] !== source[f])) sourceMismatches.push({ id: entry.id, file: source.file, sheet: source.sheet, row: source.row });
  }
  const history = {
    batch: manifest.batch, appliedAt: applied.finishedAt, verifiedAt: verified.verifiedAt, scope: "stored-2026-10-26-evidence-not-live-admin",
    sourceFiles: evidence.books.length, sourceHashesMatch: evidence.books.every((b) => b.matchesImportedSourceHash), sourceRows: ledger.length,
    categories: counts(ledger.map((r) => r.historicalDisposition)), normalizedGroups: mainGroups.size,
    exclusionsByReason: counts(manifest.excluded.map((r) => r.reason)), excluded: manifest.excluded.map((r) => ({ title: r.title, existingId: r.existingId, reason: r.reason })),
    manifestEntries: manifest.entries.length, createdUniqueIds: createdIds.size, verifiedPrivateDrafts: verified.rows.filter((r) => r.status === "draft" && r.is_public === false).length,
    referencedSourceRows: sourcePositions.size, sourceMismatches, priorPreflightMismatches: evidence.rows.filter((r) => !r.priorPreflightMatched || r.priorValueDifferences.length).length,
    databaseComparisons, visibility: { before: visibility.before, after: visibility.after, publicIdsUnchanged: visibility.publicIdsUnchanged, newPrivateRecordsExposed: visibility.newPrivateRecordsExposed },
    publicSemanticChangesDuringImport: comparePublic(publicBefore, publicAfter), historyHashes,
    previewCategoryCounts: preview.counts,
    previewToManifestExclusions: manifest.excluded.map((r) => ({ title: r.title, manifestReason: r.reason, previewAction: preview.entries.find((p) => p.title === r.title)?.action })),
    historicalNormalizerDifferences: evidence.rows.filter((r) => r.nameKey !== norm(r.title)).map((r) => ({ title: r.title, pythonKey: r.nameKey, javascriptKey: norm(r.title) })),
  };
  const historicalReconstructed = [...before, ...manifest.entries];
  const countReports = [reconcile("admin-before-20261026", before), reconcile("public-before-20261026", publicBefore), reconcile("public-after-20261026", publicAfter), reconcile("imported-draft-manifest-20261026", manifest.entries), reconcile("historical-reconstruction-not-current-admin", historicalReconstructed)];
  let current = null;
  const request = { url: "https://www.puertocancun.center/api/properties", method: "GET", credentials: "none", requestedAt: new Date().toISOString() };
  try {
    const response = await fetch(request.url, { method: "GET", redirect: "error", signal: AbortSignal.timeout(45000), headers: { "User-Agent": "PCC-ReadOnly-Audit/20261029" } });
    request.status = response.status;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    const body = JSON.parse(raw);
    assert.ok(Array.isArray(body.properties), "API properties array is required");
    assert.ok(body.properties.every((p) => p && typeof p.id === "string" && inventory.isPublic(p)), "Unexpected private or malformed record; do not persist response");
    current = body.properties;
    Object.assign(request, { capturedAt: new Date().toISOString(), rawResponseSha256: sha(raw), rawResponseBytes: Buffer.byteLength(raw), rawResponseNotStored: true, rows: current.length });
    write("public-snapshot-sanitized.json", { request, properties: current.map(publicProjection) });
    countReports.push(reconcile("public-current", current));
  } catch (error) {
    request.error = safeText(error.message);
    request.currentInventoryUnavailable = true;
  }
  write("api-request.json", request);
  const selected = current || publicAfter;
  const sourceTerms = { "1707": ["la amada", "aldea zama"], N1412: ["x towers"], "1017": ["novo cancun"], "1882": ["sls harbour"], "188": ["allure"], "1944": [], "2015": ["portofino"], PUNTACANCUN: ["punta cancun"] };
  const cases = Object.entries(sourceTerms).map(([key, terms]) => {
    const records = selected.filter((p) => key === "PUNTACANCUN" ? /punta\s*cancun/.test(norm(p.titleEs)) : String(p.mls) === key);
    return { key, snapshot: current ? "public-current" : "public-after-20261026-fallback", plannedWrite: false, humanConfirmationRequired: true,
      sourceLimit: "Development catalogs contain no unit MLS, unit price, rent period or unit surface columns; project-name match is supporting evidence, not identity proof.",
      records: records.map((p) => ({ ...publicProjection(p),
        descriptionEvidence: safeText(p.descriptionEs || "").split(/\n\n/).filter((s, i) => i === 0 || /4,200|10,617|226\.55|por definir/i.test(s)).map((s) => s.slice(0, 950)),
        priorSnapshots: [["public-before-20261026", publicBefore], ["public-after-20261026", publicAfter]].map(([label, items]) => {
          const previous = items.find((r) => r.id === p.id);
          return { label, found: Boolean(previous), changesToSelected: previous ? comparePublic([previous], [p]).changed[0]?.fields || [] : [] };
        }),
        linkedPublicUnits: selected.filter((r) => r.parentDevelopment?.propertyId === p.id).map((r) => ({ id: r.id, mls: r.mls })),
        parentPublicRecord: selected.find((r) => r.id === p.parentDevelopment?.propertyId) ? publicProjection(selected.find((r) => r.id === p.parentDevelopment.propertyId)) : null,
      })),
      xlsxRows: evidence.rows.filter((r) => terms.some((term) => r.nameKey.includes(term))).map((r) => ({ file: r.file, sheet: r.sheet, row: r.row, title: r.title, sourceSha256: r.sourceSha256, rowSha256: r.rowSha256, addressReference: r.addressReference, googleMapsUrl: r.googleMapsUrl,
        historicalTargetId: ledger.find((l) => l.file === r.file && l.sheet === r.sheet && l.row === r.row)?.historicalTargetId })),
    };
  });
  const currentDiff = current ? comparePublic(publicAfter, current) : null;
  const exposedCreatedIds = current ? current.filter((p) => createdIds.has(p.id)).map((p) => p.id) : null;
  const publicMlsGroups = new Map();
  for (const p of selected) if (p.mls) publicMlsGroups.set(inventory.fold(p.mls), [...(publicMlsGroups.get(inventory.fold(p.mls)) || []), p.id]);
  const classificationReview = selected.filter((p) => /playa mujeres|costa mujeres|punta sam/.test(norm(p.zone)) || ["1017", "1882", "188", "2015"].includes(String(p.mls))).map((p) => ({ id: p.id, mls: p.mls, zone: p.zone, city: p.city, contractLocation: inventory.resolveLocation(p), source: "public-current-or-marked-fallback", notApplied: true }));
  assert.equal(sha(fs.readFileSync(contractPath)), contractHash, "Shared contract changed during audit; rerun for consistent counts");
  for (const original of historyHashes) assert.equal(sha(fs.readFileSync(path.join(PRIOR, original.file))), original.sha256, "Historical evidence changed during audit");
  const checks = {
    sourceFilesUnchanged: evidence.books.every((b) => sha(fs.readFileSync(b.path)) === b.sha256),
    allImportedSourceHashesMatch: history.sourceHashesMatch, manifestHashMatchesResult: true, adminSnapshotHashMatchesManifest: true,
    everySourceRowAccountedFor: ledger.length === evidence.summary.mainDataRows, sourceReferenceValuesMatch: sourceMismatches.length === 0,
    preflightValuesMatch: history.priorPreflightMismatches === 0,
    storedExistingDatabaseRowsUnchanged: databaseComparisons.every((r) => r.removed === 0 && r.changedExisting === 0),
    storedPrivateDraftVerificationMatches: history.verifiedPrivateDrafts === createdIds.size,
    noImportedIdsInCurrentPublicResponse: current ? exposedCreatedIds.length === 0 : null,
    contractStableDuringRun: true, historicalFilesStableDuringRun: true,
    noDatabaseConnection: true, noImportExecuted: true, noPublicationWrites: true,
  };
  const summary = { generatedAt: new Date().toISOString(), mode: "READ_ONLY_NO_IMPORT", xlsx: evidence.summary, history,
    contract: { version: inventory.VERSION, sha256: contractHash, file: "inventory-contract.js" }, request, counts: countReports.map(({ records, ...r }) => r),
    currentVsHistoricalPublic: currentDiff, importedIdsPublicNow: exposedCreatedIds,
    duplicatePublicMls: [...publicMlsGroups].filter(([, ids]) => ids.length > 1).map(([mls, ids]) => ({ mls, ids })), classificationReview, checks,
    limits: ["No current administrative snapshot or DB connection; private draft existence/edit history today cannot be established by a public endpoint.", "Historical digest equality attests only to the recorded transaction interval, not later edits.", "Excel files are development catalogs, not a confirmed unit-level listing source.", "No workbook URL was fetched/resolved; map searches do not confirm coordinates.", "Normalized-name consolidation describes prior behavior, not confirmed identity equivalence."] };
  write("reconciliation.json", summary);
  write("source-row-ledger.json", ledger);
  write("inventory-counts-by-id.json", { contract: summary.contract, snapshots: countReports });
  write("case-review.json", cases);
  write("checks.json", checks);
  console.log(JSON.stringify({ xlsx: evidence.summary, categories: history.categories, databaseComparisons, current: request, currentVsHistoricalPublic: currentDiff, counts: summary.counts.map((r) => ({ label: r.label, uniqueInternalIds: r.uniqueInternalIds, counts: r.counts })), checks }, null, 2));
}

module.exports = { canonical, publicProjection, reconcile, comparePublic };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
