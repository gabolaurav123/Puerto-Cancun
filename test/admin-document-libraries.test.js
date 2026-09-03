const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("propiedades y desarrollos tienen bibliotecas privadas separadas", () => {
  const html = source("index.html");
  const app = source("app.js");

  assert.match(html, /data-admin-section-link="property-files"/);
  assert.match(html, /data-admin-section-link="development-files"/);
  assert.match(html, /data-admin-section-panel="property-files development-files"/);
  assert.match(html, /id="scopedFolderForm"/);
  assert.match(html, /id="scopedMediaUploadForm"/);
  assert.match(app, /currentScopedLibraryScope/);
  assert.match(app, /file\.libraryScope === scope/);
  assert.match(app, /data-move-library-file/);
  assert.match(app, /scopedMediaSearch.*addEventListener\("input", renderScopedMediaLibrary\)/s);
});

test("las carpetas y archivos usan almacenamiento persistente con permisos administrativos", () => {
  const server = source("server.js");
  const schema = source("db/schema.sql");

  assert.match(schema, /CREATE TABLE IF NOT EXISTS media_folders/);
  assert.match(schema, /library_scope TEXT NOT NULL CHECK \(library_scope IN \('property', 'development'\)\)/);
  assert.match(schema, /folder_id TEXT REFERENCES media_folders\(id\) ON DELETE SET NULL/);
  assert.match(server, /app\.get\("\/api\/admin\/file-folders", requireRole\("admin"\)/);
  assert.match(server, /app\.post\("\/api\/admin\/file-folders", requireRole\("admin"\)/);
  assert.match(server, /app\.patch\("\/api\/admin\/file-folders\/:id", requireRole\("admin"\)/);
  assert.match(server, /app\.delete\("\/api\/admin\/file-folders\/:id", requireRole\("admin"\)/);
  assert.match(server, /La carpeta contiene archivos\. Muévelos o elimínalos antes de borrar la carpeta/);
  assert.match(server, /app\.patch\("\/api\/admin\/files\/:id", requireRole\("admin"\)/);
  assert.match(server, /req\.query\.inline === "1"/);
});

