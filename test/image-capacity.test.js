const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { normalizeExternalPropertyInput } = require("../external-property-utils");
const { PHOTO_LIMIT, analyzePhotos, photoAnalysisRequest } = require("../photo-analysis");
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const server = fs.readFileSync(require.resolve("../server.js"), "utf8");

function runtime(source, names, bindings = {}) {
  const constants = source.match(/const IMAGE_MAX_COUNT = \d+;/)[0];
  const functions = names.map((name) => {
    const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, name);
    return match[0];
  }).join("\n");
  return vm.runInNewContext(`${constants}\n${functions}\n({${names.join(",")}})`, bindings);
}

const gallery = Array.from({ length: 60 }, (_, index) => `photo-${index}.webp`);

test("client accepts 60 photos in order and rejects 61 before processing", async () => {
  let processed = 0;
  const api = runtime(app, ["readImageFiles"], {
    readImageFile: async (file) => { processed += 1; return file; },
    t: () => "Maximum 60 images",
  });
  const result = await api.readImageFiles(gallery);
  assert.deepEqual(Array.from(result.images), gallery);
  await assert.rejects(api.readImageFiles([...gallery, "extra.webp"]), /60/);
  assert.equal(processed, 60);
});

test("server preserves all 60 photos on save, reload and external-property updates", async () => {
  const api = runtime(server, ["safeJsonArray", "mergeLegacyImages", "parseUploadedImages", "parseExternalUploadedImages", "sanitizePropertyImageBody"]);
  assert.deepEqual(Array.from(api.mergeLegacyImages(JSON.stringify(gallery), gallery[0])), gallery);
  for (const parse of [api.parseUploadedImages, api.parseExternalUploadedImages]) {
    assert.deepEqual(Array.from(parse({}, gallery, "test")), gallery);
    assert.deepEqual(Array.from(parse({ images: gallery }, gallery, "test")), gallery);
    assert.throws(() => parse({ images: [...gallery, "extra.webp"] }, gallery, "test"), { status: 400 });
  }
  const result = await api.sanitizePropertyImageBody({ images: gallery });
  assert.deepEqual(Array.from(result.images), gallery);
  await assert.rejects(api.sanitizePropertyImageBody({ images: [...gallery, "extra.webp"] }), { status: 400 });
});

test("external publication normalization retains photo 60 and its captions", () => {
  const property = normalizeExternalPropertyInput({
    title: "Test property", type: "Casa", zone: "Cancun", externalCompany: "Test",
    imageMetadata: gallery.map((_, index) => ({ descriptionEs: `Foto ${index}`, descriptionEn: `Photo ${index}` })),
  }, { id: "external-test", images: gallery });
  assert.deepEqual(property.images, gallery);
  assert.equal(property.imageMetadata[59].descriptionEs, "Foto 59");
});

test("server drafts retain all 60 image captions and their count", () => {
  const route = server.slice(server.indexOf('app.put("/api/admin/listing-drafts/:key"'));
  const payload = route.match(/const payload = \{[^]*?\n    };/)[0];
  const draft = { fields: { title: "Test" }, imageCount: 60,
    imageMetadata: gallery.map((_, index) => ({ descriptionEs: `Foto ${index}`, descriptionEn: `Photo ${index}` })) };
  const result = vm.runInNewContext(`${server.match(/const IMAGE_MAX_COUNT = \d+;/)[0]}\n${payload}\npayload`, { draft });
  assert.equal(result.imageCount, 60);
  assert.equal(result.imageMetadata.length, 60);
  assert.equal(result.imageMetadata[59].descriptionEn, "Photo 59");
});

test("photo analysis accepts galleries of 60 without truncating their indices", async () => {
  assert.equal(PHOTO_LIMIT, 60);
  const result = await analyzePhotos({ stored: gallery, property: { titleEs: "Test" }, apiKey: "" });
  assert.equal(result.totalCount, 60);
  assert.equal(result.items[59].index, 59);
  const request = photoAnalysisRequest({ titleEs: "Test" }, gallery.map((imageUrl, index) => ({ imageUrl, index })), "gpt-5-mini");
  assert.equal(request.input[0].content.filter((item) => item.type === "input_image").length, 60);
  assert.equal(request.max_output_tokens, 30000);
});

test("60 maximum-size optimized photos and captions fit the existing JSON request limit", () => {
  const maxBytes = Number(app.match(/const IMAGE_MAX_BYTES = (\d+) \* 1024;/)[1]) * 1024;
  const imageDataUrl = `data:image/webp;base64,${Buffer.alloc(maxBytes).toString("base64")}`;
  const body = { images: gallery.map(() => ({ imageDataUrl, imageType: "image/webp", imageSize: maxBytes })),
    imageMetadata: gallery.map(() => ({ descriptionEs: "a".repeat(500), descriptionEn: "b".repeat(500) })),
    description: "a".repeat(50000), descriptionEn: "b".repeat(50000) };
  assert.match(server, /express\.json\(\{ limit: "20mb" }\)/);
  assert.ok(Buffer.byteLength(JSON.stringify(body)) < 20 * 1024 * 1024);
});

test("published form labels and translations consistently advertise 60 photos", () => {
  const html = fs.readFileSync(require.resolve("../index.html"), "utf8");
  assert.doesNotMatch(app + html, /(?:20 imagenes|20 images)/);
  assert.match(app, /Up to 60 images/);
  assert.match(html, /Maximo 60 imagenes/);
});
