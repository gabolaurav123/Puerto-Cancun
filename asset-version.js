"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

// Explicit runtime sources only: never enumerate the checkout or read environment files.
const RUNTIME_FILES = Object.freeze([
  "admin-inventory-ui.js", "admin-inventory.css", "admin-quality-query.js",
  "ai-prompts.js", "app.js", "asset-version.js", "auth-utils.js",
  "catalog-assistant.js", "catalog-map.js", "catalog-search.js", "catalog-ui.js",
  "catalog-view.js", "catalog.css", "comparison-ui.js", "comparison.css",
  "completion-utils.js", "contact-config.js", "csv-utils.js", "demand-analysis.js",
  "external-property-utils.js", "feature-registry.js", "index.html",
  "intelligence-utils.js", "inventory-contract.js", "inventory-metadata.js",
  "location-catalog.js", "pdf-property-sheet.js", "pdf-retention.js",
  "photo-analysis.js", "platform-utils.js", "saved-catalog-search.js",
  "seo-pages.js", "server.js", "site.webmanifest", "styles.css",
  "visitor-analytics.js", "whatsapp-service.js", "package.json", "package-lock.json",
  "db/migrations.js", "db/schema.sql",
]);

function computeAssetVersion(root = __dirname, readFile = fs.readFileSync) {
  const hash = crypto.createHash("sha256").update("pcc-runtime-assets-v1\0");
  for (const file of RUNTIME_FILES) {
    const text = readFile(path.join(root, file), "utf8").replace(/\r\n?/g, "\n");
    // Frame filenames and lengths so different file boundaries cannot share input bytes.
    hash.update(`${file}\0${Buffer.byteLength(text, "utf8")}\0`).update(text).update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

module.exports = { RUNTIME_FILES, computeAssetVersion };

if (require.main === module) process.stdout.write(`${computeAssetVersion()}\n`);
