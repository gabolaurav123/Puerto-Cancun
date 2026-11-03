const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const { applyDevelopmentCoverBatch, validateCoverItem } = require("../development-cover-publish");

const date = "2026-11-03T12:00:00.000Z";
const bytes = sharp({ create: { width: 640, height: 400, channels: 3, background: "#123456" } }).webp().toBuffer();
const item = async (overrides = {}) => ({ id: "development-one", expectedUpdatedAt: date, publish: true, sourcePageUrl: "https://example.com/development", sourceImageUrl: "https://example.com/cover.webp", imageDataUrl: `data:image/webp;base64,${(await bytes).toString("base64")}`, ...overrides });
const row = overrides => ({ id: "development-one", title_es: "Desarrollo de ejemplo", description_es: "Descripción de un desarrollo residencial que conserva los detalles comerciales actuales de la ficha original.", publication_section: "developments", status: "draft", is_public: false, updated_at: date, images: [], image: null, development_data: { importSource: { batch: "original" }, stage: "Reventa" }, ...overrides });
const client = records => {
  const updates = [];
  return { updates, async query(sql, values) {
    if (sql.trim().startsWith("SELECT")) return { rows: records };
    updates.push({ sql, values });
    return { rows: [{ id: values[0], title_es: records.find(r => r.id === values[0]).title_es, status: values[5] ? "active" : "draft", is_public: values[5], updated_at: date }] };
  } };
};

test("cover publication rejects edited, archived and already illustrated records before any update", async () => {
  for (const overrides of [{ updated_at: "2026-11-04T12:00:00Z" }, { status: "archived" }, { images: ["existing.webp"] }, { image: "existing.webp" }, { publication_section: "properties" }]) {
    const db = client([row(overrides)]);
    await assert.rejects(applyDevelopmentCoverBatch(db, [await item()]));
    assert.equal(db.updates.length, 0);
  }
});

test("a mixed invalid batch does not update the valid record", async () => {
  const db = client([row(), row({ id: "development-two", status: "archived" })]);
  await assert.rejects(applyDevelopmentCoverBatch(db, [await item(), await item({ id: "development-two" })]));
  assert.equal(db.updates.length, 0);
});

test("recovered cover preserves import provenance and all commercial fields", async () => {
  const db = client([row()]);
  const [result] = await applyDevelopmentCoverBatch(db, [await item({ caption: '<img src="x"> Vista de la alberca' })]);
  assert.equal(result.isPublic, true);
  const saved = db.updates[0];
  assert.deepEqual(JSON.parse(saved.values[4]).importSource, { batch: "original" });
  assert.equal(JSON.parse(saved.values[4]).stage, "Reventa");
  assert.equal(JSON.parse(saved.values[4]).coverRecovery.reviewed, true);
  assert.equal(JSON.parse(saved.values[3])[0].descriptionEs, "Vista de la alberca");
  assert.doesNotMatch(saved.sql, /(?:price|title_es|description_es|zone|latitude)\s*=/);
});

test("draft-only images preserve visibility and unsafe image or URL input fails", async () => {
  const db = client([row()]);
  const [result] = await applyDevelopmentCoverBatch(db, [await item({ publish: false })]);
  assert.equal(result.isPublic, false);
  assert.equal(result.status, "draft");
  await assert.rejects(validateCoverItem(await item({ imageDataUrl: "data:image/svg+xml;base64,PHN2Zz4=" })));
  await assert.rejects(validateCoverItem(await item({ sourceImageUrl: "http://127.0.0.1/image.webp" })));
  await assert.rejects(applyDevelopmentCoverBatch(client([row()]), [await item(), await item()]), /duplicados/);
});
