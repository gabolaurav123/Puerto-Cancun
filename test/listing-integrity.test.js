"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const sharp = require("sharp");
const inventoryContract = require("../inventory-contract");
const { normalizeCatalogData } = require("../inventory-metadata");
const source = fs.readFileSync(require.resolve("../server.js"), "utf8");
const copy = value => JSON.parse(JSON.stringify(value));

function runtime(names, extra = {}) {
  const declarations = names.map(name => {
    const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, name);
    return match[0];
  }).join("\n");
  return vm.runInNewContext(`${declarations}\n({${names.join(",")}})`, {
    inventoryContract, normalizeCatalogData, DESCRIPTION_MAX_LENGTH: 50000, IMAGE_MAX_COUNT: 60, IMAGE_MAX_BYTES: 240 * 1024,
    PROPERTY_STATUSES: new Set(["active", "draft", "archived", "sold", "rented"]), PUBLIC_PROPERTY_STATUSES: new Set(["active"]),
    IMAGE_TYPES: new Set(["image/png", "image/jpeg", "image/webp"]), Buffer, sharp, ...extra,
  });
}
const normalizer = runtime(["normalizePropertyInput", "parseOptionalPrice", "parseOptionalCoordinate", "parseNonNegativeInteger", "parseNonNegativeNumber", "parseUploadedImages", "normalizeImageMetadata", "normalizeKeywords", "normalizeStatus", "safeJsonArray"], { KEYWORD_MAX_COUNT: 40 });
const existing = {
  id: "unit", title_es: "Departamento muestra", title_en: "Show apartment", type: "Departamento", publication_section: "properties",
  state: "Quintana Roo", city: "Cancún", zone: "Zona Hotelera", neighborhood: "Grand Island", address: "Boulevard Kukulcán",
  latitude: "21.0500", longitude: "-86.7800", location_precision: "approximate", map_place: "Grand Island",
  operation: "sale", status: "draft", is_public: false, price_amount: null, price_currency: "USD", price_unit: "total",
  price_usd: null, price_mxn: null, parent_development_id: "legacy-mondrian", catalog_data: { locationId: "zona-hotelera", priceOnRequest: true },
  beds: 2, baths: 2, area: 160, lot: 0, amenities: ["Terraza"], description_es: "Descripción original", images: ["stored-photo"],
  image_metadata: [{ descriptionEs: "Sala", descriptionEn: "Living room" }],
};

test("a title edit preserves unit photos, location, development, availability and omitted specifications", () => {
  const result = normalizer.normalizePropertyInput({ title: "Nuevo título" }, "unit", existing.images, existing);
  assert.equal(result.developmentId, "legacy-mondrian");
  assert.equal(result.zone, "Zona Hotelera");
  assert.equal(result.latitude, 21.05);
  assert.equal(result.longitude, -86.78);
  assert.equal(result.catalogData.locationId, "zona-hotelera");
  assert.deepEqual(copy(result.images), ["stored-photo"]);
  assert.equal(result.imageMetadata[0].descriptionEs, "Sala");
  assert.equal(result.area, 160);
  assert.equal(result.beds, 2);
  assert.equal(result.status, "draft");
  assert.equal(result.isPublic, false);
});

test("empty location controls and an absent development option cannot unlink a saved record", () => {
  const result = normalizer.normalizePropertyInput({ title: "Edit", zone: "", neighborhood: "", address: "", latitude: "", longitude: "", developmentId: "", catalogData: { locationId: "" } }, "unit", existing.images, existing);
  assert.equal(result.developmentId, existing.parent_development_id);
  assert.equal(result.zone, existing.zone);
  assert.equal(result.address, existing.address);
  assert.equal(result.neighborhood, existing.neighborhood);
  assert.equal(result.catalogData.locationId, "zona-hotelera");
  assert.equal(result.latitude, 21.05);
});

test("explicit unlink is supported without changing the gallery or location", () => {
  const result = normalizer.normalizePropertyInput({ developmentId: "", unlinkDevelopment: true }, "unit", existing.images, existing);
  assert.equal(result.developmentId, null);
  assert.equal(result.zone, existing.zone);
  assert.deepEqual(copy(result.images), ["stored-photo"]);
});

test("editing development media leaves unit links untouched unless the linker was edited", async () => {
  const development = { ...existing, publication_section: "developments", type: "Desarrollo" };
  const result = normalizer.normalizePropertyInput({ title: "Mondrian actualizado" }, "master", existing.images, development);
  assert.equal(result.publicationSection, "developments");
  assert.equal(result.linkedPropertyIds, null);
  const { syncDevelopmentLinks } = runtime(["syncDevelopmentLinks"]);
  await syncDevelopmentLinks(result, { query: async () => { throw new Error("Links must not be rewritten"); } });
});

test("linker uses the existing development ID, never a synthesized duplicate", async () => {
  const calls = [];
  const { syncDevelopmentLinks } = runtime(["syncDevelopmentLinks"]);
  await syncDevelopmentLinks({ id: "master", publicationSection: "developments", linkedPropertyIds: ["unit"] }, {
    query: async (sql, params) => {
      calls.push({ sql, params: copy(params) });
      return { rows: sql.startsWith("SELECT id FROM developments") ? [{ id: "legacy-mondrian" }] : sql.startsWith("SELECT id FROM properties") ? [{ id: "unit" }] : [] };
    },
  });
  const updates = calls.filter(call => call.sql.includes("UPDATE properties"));
  assert.equal(updates.length, 2);
  assert.ok(updates.every(call => call.params[0] === "legacy-mondrian"));
  assert.ok(updates.every(call => !call.sql.includes("INSERT")));
});

test("renaming a development preserves legacy structured amenities, delivery date and identity", async () => {
  const { syncDevelopmentEntity } = runtime(["syncDevelopmentEntity"], { propertySlug: () => "renamed-slug" });
  let saved;
  await syncDevelopmentEntity({ id: "master", publicationSection: "developments", titleEs: "Renamed", developmentData: {} }, {
    query: async (sql, params) => {
      if (sql.startsWith("SELECT *")) return { rows: [{ id: "legacy-master", delivery_date: new Date("2027-05-01T00:00:00Z"), amenities: ["Alberca"], total_units: 100, available_units: 20, developer: "Grupo original" }] };
      saved = params; return { rows: [] };
    },
  });
  assert.equal(saved[0], "legacy-master");
  assert.equal(saved[5], "Grupo original");
  assert.equal(saved[7], "2027-05-01");
  assert.equal(saved[8], 100);
  assert.deepEqual(JSON.parse(saved[12]), ["Alberca"]);
});

test("saved gallery revisions change media URLs, including summary placeholders", () => {
  const { publicMediaUrls } = runtime(["publicMediaUrls"]);
  const old = publicMediaUrls(["data:image/png;base64,YQ=="], "properties", "master", "2026-11-09T10:00:00Z");
  const next = publicMediaUrls(["/media/properties/master/0"], "properties", "master", "2026-11-09T10:01:00Z");
  assert.notEqual(old[0], next[0]);
  assert.match(next[0], /^\/media\/properties\/master\/0\?v=\d+$/);
  assert.equal(publicMediaUrls(["https://example.com/photo.jpg"], "properties", "master", "2026-11-09")[0], "https://example.com/photo.jpg");
});

test("server validates and retains a mixed gallery of four new photos and the saved first photo", async () => {
  const { sanitizePropertyImageBody, sanitizePropertyImage, parseUploadedImages } = runtime(["sanitizePropertyImageBody", "sanitizePropertyImage", "parseUploadedImages", "validateImagePayload", "decodeDataImage", "safeJsonArray"], {
    parseDataUrl: value => { const parts = value.match(/^data:([^;]+);base64,(.*)$/); return { mimeType: parts[1], buffer: Buffer.from(parts[2], "base64") }; },
  });
  const png = await sharp({ create: { width: 40, height: 40, channels: 3, background: "#abcabc" } }).png().toBuffer();
  const image = `data:image/png;base64,${png.toString("base64")}`;
  const sanitized = await sanitizePropertyImageBody({ images: ["/media/properties/master/0?v=100", image, image, image, image] });
  const result = parseUploadedImages(sanitized, [image], "master");
  assert.equal(result.length, 5);
  assert.equal(result[0], image);
  for (const photo of result.slice(1)) assert.equal((await sharp(Buffer.from(photo.split(",")[1], "base64")).metadata()).format, "webp");
});
