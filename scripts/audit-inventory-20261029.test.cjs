"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const audit = require("./audit-inventory-20261029.cjs");
const ROOT = path.resolve(__dirname, "../../..");
// Override only the evidence directory, never substitute originals or generated reports.
// Point PCC_AUDIT_EVIDENCE_DIR at an empty directory to exercise the portable CI path.
const OUT = process.env.PCC_AUDIT_EVIDENCE_DIR ? path.resolve(process.env.PCC_AUDIT_EVIDENCE_DIR) : path.join(ROOT, "output/master-20261029/audit");
const sha = (v) => crypto.createHash("sha256").update(v).digest("hex");

function readAvailable(t, filename, label) {
  try {
    return fs.readFileSync(filename);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    t.skip(`Required local evidence unavailable: ${label}`);
    return undefined;
  }
}

function readEvidence(t, name) {
  const content = readAvailable(t, path.join(OUT, name), name);
  // Corrupt or mismatched evidence must fail, not become a skip or empty fixture.
  return content === undefined ? undefined : JSON.parse(content.toString("utf8"));
}

function evidenceTest(name, files, run) {
  test(name, (t) => {
    const data = [];
    for (const file of files) {
      const value = readEvidence(t, file);
      if (value === undefined) return;
      data.push(value);
    }
    return run(t, ...data);
  });
}

evidenceTest("all five files still match the imported SHA256", ["xlsx-evidence.json"], (t, evidence) => {
  assert.equal(evidence.books.length, 5);
  for (const b of evidence.books) {
    const content = readAvailable(t, b.path, `original workbook ${path.win32.basename(b.path)}`);
    if (content === undefined) return;
    assert.equal(sha(content), b.sha256);
    assert.equal(b.matchesImportedSourceHash, true);
  }
});

evidenceTest("actual sheet rows do not double-count supporting records as developments", ["xlsx-evidence.json"], (_t, evidence) => {
  assert.equal(evidence.books.reduce((n, b) => n + b.sheets.length, 0), 20);
  assert.equal(evidence.summary.actualNonemptyRowsAllSheets, 573);
  assert.equal(evidence.summary.mainDataRows, 193);
  assert.deepEqual(evidence.books.map((b) => b.sheets.filter((s) => s.role === "development-inventory").reduce((n, s) => n + s.numberedDataRows, 0)), [41, 45, 38, 16, 53]);
});

evidenceTest("every main row has a unique source position and a content fingerprint", ["source-row-ledger.json"], (_t, ledger) => {
  assert.equal(ledger.length, 193);
  assert.equal(new Set(ledger.map((r) => `${r.file}|${r.sheet}|${r.row}`)).size, 193);
  assert.equal(new Set(ledger.map((r) => r.sourceRowKey)).size, 193);
  for (const r of ledger) for (const key of ["sourceSha256", "rowSha256", "sourceRowKey"]) assert.match(r[key], /^[a-f0-9]{64}$/);
});

evidenceTest("193 rows reconcile into disjoint historical dispositions", ["reconciliation.json"], (_t, result) => {
  assert.deepEqual(result.history.categories, { "new-private-draft": 163, "additional-normalized-name-occurrence": 17, "excluded-existing-or-alias": 13 });
  assert.equal(Object.values(result.history.categories).reduce((n, v) => n + v, 0), 193);
  assert.equal(result.history.normalizedGroups, 176);
  assert.deepEqual(result.history.exclusionsByReason, { "existing-name": 8, "possible-alias-preserved": 5 });
});

evidenceTest("all 180 imported source references and all 193 preflight rows match", ["reconciliation.json"], (_t, result) => {
  assert.equal(result.history.referencedSourceRows, 180);
  assert.deepEqual(result.history.sourceMismatches, []);
  assert.equal(result.history.priorPreflightMismatches, 0);
  assert.equal(result.history.manifestEntries, result.history.verifiedPrivateDrafts);
});

evidenceTest("stored before/after digests attest to zero prior-record changes", ["reconciliation.json"], (_t, result) => {
  assert.deepEqual(result.history.databaseComparisons, [
    { table: "properties", before: 125, after: 288, added: 163, removed: 0, changedExisting: 0 },
    { table: "developments", before: 18, after: 181, added: 163, removed: 0, changedExisting: 0 },
  ]);
  assert.deepEqual(result.history.publicSemanticChangesDuringImport.changed, []);
  assert.equal(result.history.visibility.newPrivateRecordsExposed, 0);
});

evidenceTest("all entity and Location counts reconcile by internal ID", ["inventory-counts-by-id.json"], (_t, inventory) => {
  for (const snapshot of inventory.snapshots) {
    assert.equal(snapshot.missingInternalIds, 0);
    assert.deepEqual(snapshot.duplicateInternalIds, []);
    assert.equal(snapshot.records.length, snapshot.uniqueInternalIds);
    assert.equal(snapshot.counts.reduce((n, group) => n + group.total, 0), snapshot.uniqueInternalIds);
    for (const group of snapshot.counts) assert.equal(group.locations.reduce((n, l) => n + l.total, 0), group.total);
  }
});

evidenceTest("the current public delta is measured, not assumed to be zero", ["reconciliation.json"], (t, result) => {
  if (result.request.currentInventoryUnavailable) {
    t.skip("Audit explicitly recorded that the current public inventory was unavailable");
    return;
  }
  const current = readEvidence(t, "public-snapshot-sanitized.json");
  if (current === undefined) return;
  const delta = result.currentVsHistoricalPublic;
  assert.equal(delta.afterRows - delta.beforeRows, delta.addedIds.length - delta.removedIds.length);
  assert.equal(result.checks.noImportedIdsInCurrentPublicResponse, result.importedIdsPublicNow.length === 0);
  const currentIds = new Set(current.properties.map((p) => p.id));
  for (const id of result.importedIdsPublicNow) assert.ok(currentIds.has(id));
});

evidenceTest("1707 preserves two different internal identities", ["case-review.json"], (_t, cases) => {
  const collision = cases.find((c) => c.key === "1707");
  assert.equal(collision.records.length, 2);
  assert.equal(new Set(collision.records.map((p) => p.id)).size, 2);
  assert.deepEqual(new Set(collision.records.map((p) => p.type)), new Set(["Casa", "Departamento"]));
  assert.equal(collision.plannedWrite, false);
});

evidenceTest("N1412, price basis, missing rent period and placeholder remain explicit", ["case-review.json"], (_t, cases) => {
  const row = (key) => cases.find((c) => c.key === key).records[0];
  assert.equal(row("N1412").type, "Casa");
  assert.ok(row("N1412").quality.issues.some((i) => i.code === "type-conflict"));
  assert.equal(row("1944").priceUnit, "sqm");
  assert.equal(row("1944").price, 4200);
  assert.equal(row("2015").operation, "rent");
  assert.equal(row("2015").normalizedPrice.period, "unclassified");
  assert.equal(row("PUNTACANCUN").descriptionPlaceholder, true);
});

evidenceTest("ambiguous apartment surfaces are not relabeled", ["case-review.json"], (_t, cases) => {
  for (const [key, lot] of [["1882", 262], ["188", 378]]) {
    const p = cases.find((c) => c.key === key).records[0];
    assert.equal(p.lot, lot);
    assert.equal(p.area, 0);
    assert.ok(p.quality.issues.some((i) => i.code === "area-concept"));
  }
});

evidenceTest("URLs are distinguished from embedded hyperlinks and map coordinates", ["xlsx-evidence.json"], (_t, evidence) => {
  assert.equal(evidence.summary.hyperlinkCells, 0);
  assert.equal(evidence.summary.textUrlOccurrences, 1050);
  assert.equal(evidence.summary.formulaCells, 0);
  assert.equal(evidence.summary.mainMapSearchRows, 193);
  assert.ok(evidence.links.every((l) => l.resolution === "not-fetched"));
  assert.equal(evidence.caseSourceCells.filter((c) => c.exactTokens.length).length, 0);
});

test("public projection discards account, ownership and nested admin metadata", () => {
  const safe = audit.publicProjection({ id: "fixture", titleEs: "Development", type: "Desarrollo", status: "active", isPublic: true,
    ownerEmail: "private@example.test", verifiedBy: "private-user", sourceRequestId: "private-request", developmentData: { privateSecret: "secret" },
    descriptionEs: "Never persist this full description", parentDevelopment: { id: "parent", nameEs: "Parent", owner: "private-owner" },
  });
  const text = JSON.stringify(safe);
  for (const value of ["private@example.test", "private-user", "private-request", "private-owner", "privateSecret", "Never persist this full description"]) assert.ok(!text.includes(value));
});

test("private historical listings expose only counting metadata", () => {
  const r = audit.reconcile("fixture", [{ id: "private-id", titleEs: "Private title", mls: "private-mls", type: "Desarrollo", status: "draft", isPublic: false, zone: "Puerto Canc\u00fan" }]);
  assert.equal(r.uniqueInternalIds, 1);
  assert.equal(r.records[0].privateDetailsOmitted, true);
  assert.ok(!JSON.stringify(r).includes("Private title"));
  assert.ok(!JSON.stringify(r).includes("private-mls"));
});

test("same MLS never merges IDs; duplicate internal IDs are reported", () => {
  const rows = [
    { id: "a", mls: "1707", titleEs: "A", type: "Casa", status: "active" },
    { id: "b", mls: "1707", titleEs: "B", type: "Departamento", status: "active" },
    { id: "a", mls: "1707", titleEs: "A updated", type: "Casa", status: "active" },
  ];
  const r = audit.reconcile("fixture", rows);
  assert.equal(r.uniqueInternalIds, 2);
  assert.deepEqual(r.duplicateInternalIds, [["a", 2]]);
  assert.deepEqual(new Set(r.records[0].duplicateMlsIds), new Set(["a", "b"]));
});

test("public comparisons use structured content, not property-key order", () => {
  const a = { id: "a", parentDevelopment: { id: "parent", nameEs: "Name" }, price: 5 };
  const b = { id: "a", parentDevelopment: { nameEs: "Name", id: "parent" }, price: 5 };
  assert.deepEqual(audit.comparePublic([a], [b]).changed, []);
  assert.deepEqual(audit.comparePublic([a], [{ ...b, price: 6 }]).changed, [{ id: "a", fields: ["price"] }]);
});

test("canonicalization is deterministic without sorting arrays or mutating input", () => {
  const value = { z: [{ b: 2, a: 1 }, 3], a: { y: 2, x: 1 } };
  const before = JSON.stringify(value);
  assert.equal(JSON.stringify(audit.canonical(value)), '{"a":{"x":1,"y":2},"z":[{"a":1,"b":2},3]}');
  assert.equal(JSON.stringify(value), before);
});

test("importing the audit does not read private evidence, write files or fetch", () => {
  const child = spawnSync(process.execPath, ["-e", `
    const assert = require("node:assert/strict");
    const fs = require("node:fs");
    const originalRead = fs.readFileSync;
    fs.readFileSync = function (filename, ...args) {
      assert.ok(!/\\.(?:json|xlsx)$/i.test(String(filename)), "Import must not read evidence");
      return originalRead.call(this, filename, ...args);
    };
    fs.writeFileSync = fs.mkdirSync = global.fetch = () => { throw new Error("Import must be read-only and offline"); };
    const audit = require(process.argv[1]);
    assert.deepEqual(Object.keys(audit).sort(), ["canonical", "comparePublic", "publicProjection", "reconcile"]);
  `, require.resolve("./audit-inventory-20261029.cjs")], { encoding: "utf8", timeout: 10000 });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr || child.stdout);
});

evidenceTest("reports contain no database identities, credentials or user metadata keys", ["reconciliation.json", "source-row-ledger.json", "inventory-counts-by-id.json", "case-review.json"], (t, result, ...reports) => {
  const forbidden = new Set(["password", "passwordHash", "connectionString", "DATABASE_URL", "ownerEmail", "verifiedBy", "sourceRequestId", "imageMetadata", "identity", "users", "sessions"]);
  const scan = (v) => {
    if (!v || typeof v !== "object") return;
    for (const [key, child] of Object.entries(v)) { assert.ok(!forbidden.has(key), `Unexpected private key ${key}`); scan(child); }
  };
  for (const report of [result, ...reports]) scan(report);
  if (!result.request.currentInventoryUnavailable) {
    const snapshot = readEvidence(t, "public-snapshot-sanitized.json");
    if (snapshot === undefined) return;
    scan(snapshot);
  }
});

evidenceTest("the shared contract file still matches the audited version", ["reconciliation.json"], (_t, result) => {
  assert.equal(sha(fs.readFileSync(path.resolve(__dirname, "../inventory-contract.js"))), result.contract.sha256);
});
