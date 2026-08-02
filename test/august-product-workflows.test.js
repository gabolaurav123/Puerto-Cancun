const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("el blog administra portada e imágenes internas", () => {
  assert.match(indexSource, /name="coverFile"[^>]+accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(indexSource, /name="contentFiles"[^>]+multiple/);
  assert.match(appSource, /blogContentImageFiles/);
  assert.match(appSource, /data-remove-blog-image/);
  assert.match(serverSource, /content_images JSONB NOT NULL/);
  assert.match(serverSource, /app\.get\("\/media\/blog\/:id\/content\/:index"/);
  assert.match(serverSource, /class="blog-content-figure"/);
  assert.match(stylesSource, /\.blog-content-image-preview/);
});

test("marketing conserva la fotografía real sin ampliarla ni simular botones", () => {
  const start = serverSource.indexOf("async function composePropertyMarketingImage");
  const end = serverSource.indexOf('app.post("/api/admin/ai/generate-image"', start);
  const composer = serverSource.slice(start, end);
  assert.match(composer, /fit: "inside", withoutEnlargement: true/);
  assert.match(composer, /blur\(/);
  assert.match(composer, /puertocancuncenter\.com/);
  assert.doesNotMatch(composer, /AGENDA UNA VISITA/);
  assert.match(serverSource, /sort\(\(a, b\) => b\.pixels - a\.pixels\)/);
});

test("herramientas IA están separadas de creación de campañas", () => {
  for (const category of ["publication", "commercial", "operation"]) {
    assert.match(indexSource, new RegExp(`data-ai-category="${category}"`));
    assert.match(indexSource, new RegExp(`data-ai-tool-panel="${category}"`));
  }
  for (const tool of ["quality_audit", "duplicate_risk", "market_position", "lead_priority", "negotiation", "visit_brief"]) {
    assert.match(indexSource, new RegExp(`data-ai-tool="${tool}"`));
    assert.match(serverSource, new RegExp(`${tool}:`));
  }
  assert.match(appSource, /function setAiToolCategory/);
  assert.match(appSource, /function selectAiTool/);
});

test("Match explica su puntuación y el dashboard prioriza trabajo real", () => {
  assert.match(indexSource, /class="match-explainer"/);
  assert.match(indexSource, /id="matchLiveSummary"/);
  assert.match(appSource, /dashboard-priority-list/);
  assert.match(appSource, /dashboard-zone-bars/);
  assert.match(stylesSource, /\.dashboard-operations/);
  assert.match(stylesSource, /\.match-score-legend/);
});
