const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("privacy consent does not interrupt panel event registration", () => {
  const source = read("app.js");
  assert.match(source, /submit\?\.parentNode\) submit\.parentNode\.insertBefore\(consent, submit\)/);
  assert.doesNotMatch(source, /form\.insertBefore\(consent, submit\)/);
});

test("authenticated admin HTML starts with only the dashboard visible", () => {
  const server = read("server.js");
  assert.match(server, /data-admin-section-panel/);
  assert.match(server, /includes\("dashboard"\)/);
  assert.match(server, /data-admin-listing-view/);
  assert.match(server, /return `\$\{start\} hidden\$\{end\}`/);
});

test("the private panel keeps its route when the saved language is English", () => {
  const source = read("app.js");
  assert.match(source, /document\.body\.dataset\.page !== "panel" && storedLanguage/);
  assert.match(source, /applyTranslations\(\{ renderPanelContent: document\.body\.dataset\.page !== "panel" \}\)/);
  assert.match(source, /element\.id === "panelTitle"/);
});

test("the server checks PostgreSQL before accepting traffic", () => {
  const server = read("server.js");
  assert.match(server, /async function startServer\(\)/);
  assert.match(server, /await initializeDatabaseWithRetry\(\);[\s\S]*app\.listen/);
});
