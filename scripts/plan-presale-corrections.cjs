"use strict";
// Read-only, repeatable review of the exact public projection applied at runtime.
// No database client, credentials, UPDATE, or network write is involved.
const fs = require("node:fs");
const portal = require("../portal-directory");
const policy = require("../presale-policy");
const snapshotPath = process.argv[2];
if (!snapshotPath) throw new Error("Usage: node scripts/plan-presale-corrections.cjs PUBLIC_SNAPSHOT.json [OUTPUT.json]");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath,"utf8"));
const records = snapshot.properties;
if (!Array.isArray(records)) throw new Error("Snapshot must contain properties[] from GET /api/properties.");
const directory = snapshot.directory || portal.initialConfig();
const config = {...portal.initialConfig(),...directory,subareas:directory.subareas || (directory.areas || []).flatMap(area=>area.subareas || [])};
const projectedDirectory=portal.publicDirectory(config,records), projected=portal.enrichProperties(records,projectedDirectory);
const result={...policy.reviewedCorrectionPlan(records,directory),source:snapshotPath,
  before:{inventoryIds:records.map(row=>row.id).sort(),projects:directory.presales?.map(row=>row.id) || []},
  after:{inventoryIds:projected.map(row=>row.id).sort(),projects:projectedDirectory.presales.map(row=>row.id),confirmed:projected.filter(row=>row.portalPresale?.isPresale).length},
  pending:projected.filter(row=>row.portalPresale?.status==="needs-verification").map(row=>({id:row.id,title:row.titleEs,decision:"No automatic reclassification; verify commercial stage."}))};
if (JSON.stringify(result.before.inventoryIds)!==JSON.stringify(result.after.inventoryIds)) throw new Error("Projection unexpectedly changed inventory IDs.");
const output=JSON.stringify(result,null,2)+"\n";
if(process.argv[3])fs.writeFileSync(process.argv[3],output);else process.stdout.write(output);
