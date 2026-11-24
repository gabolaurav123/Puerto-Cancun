"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const base = process.env.PCC_TEST_BASE;

test("publishing accepts optional location and persists linked development details", { skip: !base }, async () => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Only use the isolated local database");
  let cookie = "", csrf = "";
  async function request(path, method = "GET", body, expected = 200) {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie, "X-CSRF-Token": csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const cookies = response.headers.getSetCookie(); if (cookies.length) cookie = cookies[0].split(";")[0];
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
    if (data.csrfToken) csrf = data.csrfToken;
    return data;
  }
  await request("/api/session");
  await request("/api/auth/login", "POST", { username: process.env.PCC_TEST_ADMIN || "qa-admin", password: process.env.PCC_TEST_PASSWORD || "qa-admin-password-only-local" });
  const image = `data:image/webp;base64,${(await sharp({ create: { width: 80, height: 60, channels: 3, background: "#c6ab52" } }).webp().toBuffer()).toString("base64")}`;
  const ids = [], suffix = Date.now();
  try {
    const master = (await request("/api/admin/properties", "POST", { title: `QA Location ${suffix}`, type: "Desarrollo", publicationSection: "developments", status: "draft", isPublic: false,
      state: "Yucatán", city: "Mérida", zone: "Centro", neighborhood: "Centro histórico", address: "Calle QA 10", mapPlace: "Mapa QA", latitude: 20.97, longitude: -89.62,
      locationPrecision: "exact", catalogData: { locationId: "fuera-de-cancun" }, images: [image] }, 201)).property;
    ids.push(master.id);
    const input = { title: `QA Unit ${suffix}`, type: "Departamento", publicationSection: "properties", status: "active", isPublic: true,
      state: "", city: "", zone: "", price: 123456, currency: "USD", priceUnit: "total", beds: 2, images: [image] };
    const unit = (await request("/api/admin/properties", "POST", { ...input, developmentId: master.developmentData.id }, 201)).property;
    ids.push(unit.id);
    for (const name of ["state", "city", "zone", "neighborhood", "address", "mapPlace", "latitude", "longitude", "locationPrecision"]) assert.equal(unit[name], master[name], name);
    assert.equal(unit.catalogData.locationId, "fuera-de-cancun");
    assert.equal(unit.status, "active");
    assert.equal(unit.isPublic, true);
    assert.equal(unit.price, 123456);
    assert.equal(unit.beds, 2);
    assert.equal(unit.images.length, 1);
    assert.ok(unit.images[0].includes(unit.id), "Unit photo must not become a development photo");
    const independent = (await request("/api/admin/properties", "POST", { ...input, title: `QA Optional ${suffix}` }, 201)).property;
    ids.push(independent.id);
    assert.equal(independent.isPublic, true);
    assert.equal(independent.status, "active");
    for (const name of ["state", "city", "zone"]) assert.equal(independent[name], "");
    assert.equal(independent.latitude, null);
    const loaded = (await request("/api/admin/properties")).properties.find(row => row.id === unit.id);
    assert.equal(loaded.address, master.address);
    assert.equal(loaded.developmentId, master.developmentData.id);
    assert.equal(loaded.isPublic, true);
  } finally {
    for (const id of ids.reverse()) await request(`/api/admin/properties/${id}`, "DELETE");
  }
});
