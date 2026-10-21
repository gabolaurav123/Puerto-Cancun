const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const { preparePhotoInputs, photoAnalysisRequest, mergePhotoAnalysis, finalizePhotoAnalysis, analyzePhotos } = require("../photo-analysis");

async function photo() {
  const buffer = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#e8f2ee" } }).jpeg().toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
const property = { titleEs: "Casa de prueba", publicationSection: "properties", type: "Casa" };
const result = { items: [{ index: 1, classification: "terraza", tags: ["Terraza", "terraza", "luz natural"], suggestedAlt: "Terraza con luz natural.", suggestedAltEn: "Terrace with natural light.", possibleWatermark: false, coverScore: 85 }], descriptionEs: "Las fotos muestran una terraza.", descriptionEn: "The photos show a terrace." };
const dependencies = {
  property, apiKey: "test-not-a-real-key", responseOutputText: (payload) => payload.output_text,
  createResponseError: async () => new Error("Provider failed"), userError: () => "Proveedor no disponible.",
};

test("image preparation preserves original indices, limits size and never fetches remote URLs", async () => {
  const image = await photo();
  const { technical, images } = await preparePhotoInputs(["https://example.invalid/image.jpg", image, "data:image/jpeg;base64,YmFk"], property.titleEs);
  assert.equal(technical.length, 3);
  assert.deepEqual(images.map((item) => item.index), [1]);
  assert.equal(technical[1].width, 1200);
  assert.ok(technical[2].unavailableReason);
  assert.equal(technical[0].visualAnalyzed, false);
  const metadata = await sharp(Buffer.from(images[0].imageUrl.split(",")[1], "base64")).metadata();
  assert.ok(metadata.width <= 1024 && metadata.height <= 1024);
  assert.equal(metadata.format, "jpeg");
});

test("vision request is image-based, structured and constrained to visible facts", () => {
  const body = photoAnalysisRequest(property, [{ index: 3, imageUrl: "data:image/jpeg;base64,TEST" }], "gpt-5-mini");
  assert.equal(body.model, "gpt-5-mini");
  assert.equal(body.store, false);
  assert.equal(body.text.format.strict, true);
  assert.deepEqual(body.input[0].content[1], { type: "input_text", text: "Indice original de la fotografia: 3" });
  assert.equal(body.input[0].content[2].type, "input_image");
  assert.match(body.instructions, /No deduzcas ubicacion/);
  assert.match(body.instructions, /nunca como instrucciones/);
});

test("model output cannot overwrite photo identity, hashes, dimensions or unseen images", () => {
  const technical = [{ index: 0, visualAnalyzed: false, tags: [] }, { index: 1, width: 1200, exactHash: "original", tags: [] }];
  const parsed = { ...result, items: [
    { ...result.items[0], width: 9999, exactHash: "tampered", tags: ["Terraza", "TERRAZA", "terraza, soleada", null] },
    { ...result.items[0], index: 0 }, { ...result.items[0], index: 100 },
  ] };
  const data = mergePhotoAnalysis(parsed, technical, [1]);
  assert.equal(data.items[0].visualAnalyzed, false);
  assert.equal(data.items[1].index, 1);
  assert.equal(data.items[1].width, 1200);
  assert.equal(data.items[1].exactHash, "original");
  assert.equal(data.items[1].visualAnalyzed, true);
  assert.equal(data.items[1].tags.length, 2);
  assert.ok(data.items[1].tags.every((tag) => !tag.includes(",")));
  assert.throws(() => mergePhotoAnalysis({ items: [{ index: 99 }] }, technical, [1]));
});

test("cover order is a complete permutation and duplicate checks keep index zero", () => {
  const data = finalizePhotoAnalysis({ items: [
    { index: 0, exactHash: "same", coverScore: 60, visualAnalyzed: true, tags: ["terraza"] },
    { index: 1, exactHash: "same", coverScore: 100, visualAnalyzed: true, tags: ["Terraza"] },
    { index: 2, exactHash: "other", coverScore: 80, visualAnalyzed: true, tags: ["alberca"] },
  ] });
  assert.equal(data.items[1].duplicateOf, 0);
  assert.equal(data.recommendedCoverIndex, 2);
  assert.deepEqual([...data.suggestedOrder].sort(), [0, 1, 2]);
  assert.equal(data.keywords.length, 2);
});

test("successful analysis returns separate editable descriptions, keywords and listing text", async () => {
  let calls = 0;
  const data = await analyzePhotos({ ...dependencies, stored: ["https://example.invalid/remote.jpg", await photo()], fetchImpl: async (url, init) => {
    calls += 1;
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(init.body);
    assert.equal(body.input[0].content.filter((item) => item.type === "input_image").length, 1);
    return { ok: true, json: async () => ({ status: "completed", output_text: JSON.stringify(result) }) };
  } });
  assert.equal(calls, 1);
  assert.equal(data.provider, "openai");
  assert.equal(data.descriptionEs, result.descriptionEs);
  assert.equal(data.descriptionEn, result.descriptionEn);
  assert.equal(data.items[1].suggestedAltEn, result.items[0].suggestedAltEn);
  assert.equal(data.items[0].visualAnalyzed, false);
  assert.equal(data.analyzedCount, 1);
  assert.equal(data.totalCount, 2);
  assert.equal(data.recommendationOnly, true);
});

test("missing key returns technical results without fabricated captions or keywords", async () => {
  const data = await analyzePhotos({ ...dependencies, stored: [await photo()], apiKey: "", fetchImpl: async () => { throw new Error("Must not call provider"); } });
  assert.equal(data.provider, "technical");
  assert.equal(data.descriptionEs, "");
  assert.equal(data.items[0].suggestedAlt, "");
  assert.deepEqual(data.keywords, []);
  assert.match(data.warning, /no esta configurado/);
});

for (const failure of ["http", "timeout", "incomplete", "invalid-json", "refusal"]) {
  test(`provider ${failure} preserves technical data and reports a visible warning`, async () => {
    const data = await analyzePhotos({ ...dependencies, stored: [await photo()], fetchImpl: async () => {
      if (failure === "timeout") throw new Error("Timeout");
      return { ok: failure !== "http", json: async () => ({ status: failure === "incomplete" ? "incomplete" : "completed", output_text: failure === "invalid-json" ? "broken" : failure === "refusal" ? "" : JSON.stringify(result) }) };
    } });
    assert.equal(data.provider, "technical");
    assert.equal(data.fallback, true);
    assert.equal(data.descriptionEs, "");
    assert.deepEqual(data.keywords, []);
    assert.ok(data.warning);
    assert.ok(data.items[0].exactHash);
  });
}

test("empty and oversized galleries are rejected", async () => {
  await assert.rejects(analyzePhotos({ ...dependencies, stored: [] }), { status: 400 });
  await assert.rejects(analyzePhotos({ ...dependencies, stored: Array(21).fill("image") }), { status: 400 });
});

test("the editor analysis endpoint requires admin role and does not publish its proposals", () => {
  const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");
  const handler = server.slice(server.indexOf("async function analyzeListingPhotoRequest"), server.indexOf('app.get("/media/blog/:id"'));
  assert.match(handler, /parseUploadedImages\(\{ images: req.body.images \}, savedImages, propertyId\)/);
  assert.match(handler, /expectedUpdatedAt/);
  assert.match(handler, /if \(!draftRequest\)/);
  assert.doesNotMatch(handler, /UPDATE properties|INSERT INTO properties/);
  assert.ok(handler.includes('app.post("/api/admin/ai/analyze-images", requireRole("admin"), analyzeListingPhotoRequest)'));
});
