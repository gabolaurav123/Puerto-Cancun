const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const { sourceLinks, imageCandidates, parsePublicUrl, validateDestination, fetchBounded, validateImage, inspectDevelopment } = require("../development-cover-recovery");

const source = { sources: [{ file: "inventory.xlsx", sheet: "Projects", row: 3, title: "Example Homes", photoOrGalleryUrl: "https://example.com/image.webp", representativeUrl: "https://example.com/project" }] };

test("cover recovery keeps row evidence and excludes local or search-page sources", () => {
  const links = sourceLinks({ source: { sources: [...source.sources, { row: 4, photoOrGalleryUrl: "https://example.com/image.webp" }, { photoOrGalleryUrl: "http://127.0.0.1/x.jpg https://www.google.com/search?q=example" }] } });
  assert.equal(links.length, 2);
  assert.equal(links[0].references.length, 2);
  assert.equal(links[0].references[0].row, 3);
  assert.equal(links[0].kind, "image");
  for (const url of ["http://127.1/x", "http://10.0.0.1/x", "http://[::1]/x", "http://[::ffff:127.0.0.1]/x", "http://metadata.google.internal/x", "file:///x", "https://user:password@example.com/x"]) assert.throws(() => parsePublicUrl(url));
});

test("DNS and redirects cannot point image downloads at private network destinations", async () => {
  await assert.rejects(validateDestination("https://example.com", async () => [{ address: "127.0.0.1" }]), /no pública/);
  let requests = 0;
  await assert.rejects(fetchBounded("https://example.com", {
    lookup: async () => [{ address: "93.184.216.34" }],
    fetchImpl: async () => { requests++; return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/" } }); },
  }), /privada/);
  assert.equal(requests, 1);
});

test("candidate extraction rejects branding and always requires a visual review", () => {
  const candidates = imageCandidates(`<title>Example Homes — developer</title><meta property="og:image" content="/logo.jpg"><meta content="https://cdn.example.com/hero.jpg?a=1&amp;b=2" property="og:image"><img src="/example-pool.jpg" alt="Example Homes pool"><img src="/other.jpg" alt="Unrelated tower">`, "https://example.com/project", "Example Homes");
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].url, "https://cdn.example.com/hero.jpg?a=1&b=2");
  assert.ok(candidates.every(item => item.requiresVisualReview));
});

test("image validation decodes bytes and rejects tiny images and non-images", async () => {
  const bytes = await sharp({ create: { width: 640, height: 400, channels: 3, background: "#123456" } }).png().toBuffer();
  const image = await validateImage(bytes);
  assert.equal(image.width, 640);
  assert.equal(image.sha256.length, 64);
  assert.equal((await sharp(image.bytes).metadata()).format, "webp");
  await assert.rejects(validateImage(Buffer.from("not an image")));
  await assert.rejects(validateImage(await sharp(bytes).resize(40, 40).png().toBuffer()), /tamaño/);
});

test("recovery preserves existing covers and archived records without fetching", async () => {
  const fetchResource = async () => { throw new Error("Must not fetch"); };
  assert.equal((await inspectDevelopment({ id: "archived", status: "archived", source }, { fetchResource })).skipped, "archived");
  assert.equal((await inspectDevelopment({ id: "existing", status: "active", images: ["/media/0"], source }, { fetchResource })).skipped, "has-existing-images");
});

test("successful recovery remains unpublished and includes immutable source evidence", async () => {
  const bytes = await sharp({ create: { width: 640, height: 400, channels: 3, background: "#abccdd" } }).png().toBuffer();
  const result = await inspectDevelopment({ id: "development-a", titleEs: "Example Homes", status: "draft", source, updatedAt: "2026-11-03T12:00:00Z" }, {
    fetchResource: async url => ({ url, bytes, contentType: "image/png", fetchedAt: "2026-11-03T13:00:00Z" }),
  });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.writesToInventory, false);
  assert.equal(result.candidates[0].approved, false);
  assert.equal(result.candidates[0].references[0].file, "inventory.xlsx");
  assert.equal(result.updatedAt, "2026-11-03T12:00:00Z");
});
