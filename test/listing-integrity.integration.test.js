"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const base = process.env.PCC_TEST_BASE;

test("gallery, draft and development links survive round trips through isolated PostgreSQL", { skip: !base }, async () => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Never run mutation tests against production");
  const createClient = () => {
    let cookie = "", csrf = "";
    return async (path, method = "GET", body, expected = 200) => {
      const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie, "X-CSRF-Token": csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      const cookies = response.headers.getSetCookie(); if (cookies.length) cookie = cookies[0].split(";")[0];
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
      if (data.csrfToken) csrf = data.csrfToken;
      return data;
    };
  };
  const admin = createClient();
  const login = async request => {
    await request("/api/session");
    await request("/api/auth/login", "POST", { username: process.env.PCC_TEST_ADMIN || "qa-admin", password: process.env.PCC_TEST_PASSWORD || "qa-admin-password-only-local" });
  };
  await login(admin);
  const suffix = Date.now();
  const photos = await Promise.all(["#abcabc", "#123456", "#654321", "#eeeeee"].map(async background => `data:image/webp;base64,${(await sharp({ create: { width: 80, height: 60, channels: 3, background } }).webp().toBuffer()).toString("base64")}`));
  const common = { state: "Quintana Roo", city: "Cancún", zone: "Zona Hotelera", latitude: 21.05, longitude: -86.78, neighborhood: "Grand Island", address: "Boulevard de prueba", status: "draft", isPublic: false, catalogData: { locationId: "zona-hotelera", priceOnRequest: true } };
  let master, unit;
  try {
    master = (await admin("/api/admin/properties", "POST", { ...common, title: `QA Mondrian ${suffix}`, publicationSection: "developments", type: "Desarrollo", images: [photos[0]] }, 201)).property;
    const initialUrl = master.images[0];
    master = (await admin(`/api/admin/properties/${master.id}/images`, "PATCH", { images: [master.images[0], ...photos.slice(1)], expectedUpdatedAt: master.updatedAt })).property;
    assert.equal(master.images.length, 4);
    assert.notEqual(master.images[0], initialUrl);
    unit = (await admin("/api/admin/properties", "POST", { ...common, title: `QA Unidad ${suffix}`, publicationSection: "properties", type: "Departamento", images: photos.slice(0, 2) }, 201)).property;
    unit = (await admin(`/api/admin/properties/${unit.id}`, "PUT", { developmentId: master.developmentData.id, expectedUpdatedAt: unit.updatedAt, preserveImages: true })).property;
    assert.equal(unit.developmentId, master.developmentData.id);
    master = (await admin(`/api/admin/properties/${master.id}`, "PUT", { title: `QA Mondrian renamed ${suffix}`, zone: "", address: "", latitude: "", longitude: "", catalogData: { locationId: "" }, expectedUpdatedAt: master.updatedAt, preserveImages: true })).property;
    assert.equal(master.address, common.address);
    assert.equal(master.latitude, common.latitude);
    assert.equal(master.catalogData.locationId, common.catalogData.locationId);
    const reload = (await admin("/api/admin/properties")).properties;
    assert.equal(reload.find(item => item.id === master.id).images.length, 4);
    assert.equal(reload.find(item => item.id === unit.id).developmentId, master.developmentData.id);
    unit = (await admin(`/api/admin/properties/${unit.id}`, "PUT", { title: `QA Unidad renamed ${suffix}`, developmentId: "", preserveImages: true, expectedUpdatedAt: unit.updatedAt })).property;
    assert.equal(unit.developmentId, master.developmentData.id);
    assert.equal(unit.images.length, 2);
    await admin("/api/admin/properties", "POST", { ...common, title: master.titleEs, publicationSection: "developments", type: "Desarrollo", images: photos }, 409);
    const draftKey = `edit-${master.id}`;
    const draft = { fields: { id: master.id, title: master.titleEs, publicationSection: "developments" }, imageCount: 4, mediaDirty: true, images: photos, galleryRevision: `qa-${suffix}`, idempotencyKey: `qa-${suffix}`, savedAt: new Date().toISOString() };
    await admin(`/api/admin/listing-drafts/${draftKey}`, "PUT", draft);
    // A later text-only autosave must retain the cloud gallery.
    await admin(`/api/admin/listing-drafts/${draftKey}`, "PUT", { ...draft, images: undefined, fields: { ...draft.fields, title: "Texto posterior" } });
    const otherDevice = createClient(); await login(otherDevice);
    const recovered = (await otherDevice(`/api/admin/listing-drafts/${draftKey}`)).draft;
    assert.equal(recovered.images.length, 4);
    assert.equal(recovered.fields.title, "Texto posterior");
    assert.ok(recovered.images.every(image => image.startsWith("data:image/webp;base64,")));
    const shelf = (await otherDevice("/api/admin/listing-drafts")).drafts.find(item => item.draft_key === draftKey);
    assert.equal(shelf.payload.images, undefined, "Shelf remains light");
    await admin(`/api/admin/listing-drafts/${draftKey}`, "DELETE");
  } finally {
    if (unit) await admin(`/api/admin/properties/${unit.id}`, "DELETE");
    if (master) await admin(`/api/admin/properties/${master.id}`, "DELETE");
  }
});
