const assert = require("node:assert/strict");
const test = require("node:test");

// Opt in against a disposable local database, never the production deployment.
const base = process.env.PCC_TEST_BASE;
let clientNumber = 1;
const testSubnet = `127.${10 + process.pid % 200}.${10 + Date.now() % 200}`;
function client() {
  let cookie = "";
  let csrf = "";
  const ip = `${testSubnet}.${++clientNumber}`;
  return async (route, method = "GET", body, expected = 200) => {
    const response = await fetch(`${base}${route}`, {
      method,
      headers: { "Content-Type": "application/json", Origin: base, Cookie: cookie, "X-CSRF-Token": csrf, "X-Forwarded-For": ip },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const setCookie = response.headers.getSetCookie();
    if (setCookie.length) cookie = setCookie[0].split(";")[0];
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(data)}`);
    if (data.csrfToken) csrf = data.csrfToken;
    return { ...data, setCookie };
  };
}

test("cuentas, permisos, sesiones y borradores en PostgreSQL aislado", { skip: !base }, async (t) => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Only a local QA server is allowed");
  const suffix = Date.now();
  const root = client();
  await root("/api/session");
  const session = await root("/api/auth/login", "POST", { username: process.env.PCC_TEST_ADMIN || "qa-admin", password: process.env.PCC_TEST_PASSWORD || "qa-admin-password-only-local" });
  const expires = /Expires=([^;]+)/.exec(session.setCookie.join(";"));
  assert.ok(expires && Date.parse(expires[1]) - Date.now() > 6 * 86400000, "Session lasts seven days");
  const account = { firstName: "QA", lastName: "Cliente", email: `client-${suffix}@example.test`, phone: "+529981234567", password: "123456", confirmPassword: "123456", consent: true };
  const member = client();
  const otherSession = client();
  await member("/api/session");
  await otherSession("/api/session");
  let memberId;
  await t.test("registro con seis caracteres, sesión y cambio de contraseña", async () => {
    await member("/api/auth/register", "POST", { ...account, password: "12345", confirmPassword: "12345" }, 400);
    await member("/api/auth/register", "POST", account, 201);
    await member("/api/auth/login", "POST", { username: account.email, password: "incorrecta" }, 401);
    memberId = (await member("/api/auth/login", "POST", { username: account.email, password: "123456" })).user.id;
    await otherSession("/api/auth/login", "POST", { username: account.email, password: "123456" });
    await member("/api/auth/update-password", "POST", { currentPassword: "incorrecta", newPassword: "abcdef", confirmNewPassword: "abcdef" }, 401);
    await member("/api/auth/update-password", "POST", { currentPassword: "123456", newPassword: "abcdef", confirmNewPassword: "abcdef" });
    assert.equal((await member("/api/session")).user.id, memberId);
    assert.equal((await otherSession("/api/session")).user, null, "Other sessions must be revoked");
    await otherSession("/api/auth/login", "POST", { username: account.email, password: "123456" }, 401);
  });
  let editorId;
  const editor = client();
  await editor("/api/session");
  await t.test("solicitudes se aprueban en su inventario y la galería admite guardados sucesivos", async () => {
    const sharp = require('sharp');
    const image = 'data:image/jpeg;base64,' + (await sharp({ create: { width: 64, height: 64, channels: 3, background: '#dde8e4' } }).jpeg().toBuffer()).toString('base64');
    for (const type of ['Casa', 'Desarrollo']) {
      let property;
      try {
        const request = (await member('/api/seller/requests', 'POST', {
          title: `QA Solicitud ${type} ${suffix}`, type, state: 'Quintana Roo', city: 'Cancun', zone: 'Puerto Cancun',
          price: 1000000, currency: 'MXN', address: 'Direccion de prueba', description: 'Prueba aislada',
          consent: true, email: account.email, phone: account.phone, images: [image],
        }, 201)).request;
        property = (await root(`/api/admin/requests/${request.id}/approve`, 'POST', {})).property;
        assert.equal(property.publicationSection, type === 'Desarrollo' ? 'developments' : 'properties');
        assert.equal(property.isPublic, true);
        assert.equal(property.images.length, 1);
        assert.equal((await root(`/api/admin/requests/${request.id}/approve`, 'POST', {})).property.id, property.id);
        const update = (await root(`/api/admin/properties/${property.id}/images`, 'PATCH', {
          images: property.images, imageMetadata: [{ descriptionEs: 'Foto actualizada', descriptionEn: 'Updated photo' }], expectedUpdatedAt: property.updatedAt,
        })).property;
        assert.equal(update.imageMetadata[0].descriptionEs, 'Foto actualizada');
        await root(`/api/admin/properties/${property.id}/images`, 'PATCH', { images: update.images, expectedUpdatedAt: property.updatedAt }, 409);
        await root('/api/admin/ai/analyze-images', 'POST', { propertyId: property.id, images: update.images, expectedUpdatedAt: update.updatedAt });
        await root(`/api/admin/properties/${property.id}/images`, 'PATCH', { images: [], removeImage: true, expectedUpdatedAt: update.updatedAt }, 400);
      } finally {
        if (property) await root(`/api/admin/properties/${property.id}`, 'DELETE');
      }
    }
  });
  await t.test("directorio unificado, restablecimiento y roles sin elevación", async () => {
    const users = (await root("/api/admin/users")).users;
    assert.ok(users.some(user => user.id === memberId && user.source === "registered"));
    assert.ok(users.every(user => !user.password_hash && !user.password));
    await root(`/api/admin/users/${memberId}`, "PATCH", { password: "654321" });
    assert.equal((await member("/api/session")).user, null);
    await member("/api/auth/login", "POST", { username: account.email, password: "654321" });
    const created = await root("/api/admin/users", "POST", { name: "QA Editor", email: `editor-${suffix}@example.test`, password: "editor", role: "editor", permissions: [] }, 201);
    editorId = created.user.id;
    await editor("/api/auth/login", "POST", { username: created.user.email, password: "editor" });
    await editor("/api/admin/users", "GET", undefined, 403);
    await editor(`/api/admin/users/${editorId}`, "PATCH", { role: "super_admin" }, 403);
    await root(`/api/admin/users/${memberId}`, "PATCH", { role: "admin" });
    assert.equal((await member("/api/session")).user, null);
    assert.equal((await member("/api/auth/login", "POST", { username: account.email, password: "654321" })).user.internalRole, "admin");
    await member(`/api/admin/users/${memberId}`, "PATCH", { status: "inactive" }, 400);
    await member(`/api/admin/users/${editorId}`, "PATCH", { role: "super_admin" }, 403);
  });
  await t.test("borradores privados no crean ni modifican inventario", async () => {
    const before = (await root("/api/admin/properties")).properties;
    const draft = { fields: { title: "QA titulo solamente", publicationSection: "properties" }, savedAt: new Date().toISOString(),
      mediaDirty: true, imageCount: 1, galleryRevision: 'qa-revision', imageMetadata: [{ descriptionEs: 'Foto pendiente', descriptionEn: 'Pending photo' }],
      images: ['not-persisted-by-autosave'],
    };
    await editor("/api/admin/listing-drafts/new-properties", "PUT", draft);
    const own = (await editor("/api/admin/listing-drafts")).drafts;
    assert.equal(own[0].payload.fields.title, draft.fields.title);
    assert.equal(own[0].payload.mediaDirty, true);
    assert.equal(own[0].payload.imageCount, 1);
    assert.equal(own[0].payload.galleryRevision, 'qa-revision');
    assert.deepEqual(own[0].payload.imageMetadata, draft.imageMetadata);
    assert.equal(own[0].payload.images, undefined, 'Autosave never stores media bytes');
    assert.ok(!(await root("/api/admin/listing-drafts")).drafts.some(d => d.payload.fields.title === draft.fields.title));
    assert.deepEqual((await root("/api/admin/properties")).properties, before);
    await editor("/api/admin/listing-drafts/new-properties", "DELETE");
    assert.equal((await editor("/api/admin/listing-drafts")).drafts.length, 0);
    await editor("/api/admin/ai/improve-description", "POST", { title: "QA", description: "Texto original", language: "es" }, 503);
  });
  await t.test("desarrollo y unidades vinculadas aparecen en búsqueda, antes del contacto y sin exponer borradores", async () => {
    const { propertyPath } = require('../seo-pages');
    const sharp = require('sharp');
    const image = 'data:image/jpeg;base64,' + (await sharp({ create: { width: 64, height: 64, channels: 3, background: '#dde8e4' } }).jpeg().toBuffer()).toString('base64');
    const common = { state: 'Quintana Roo', city: 'Cancun', zone: 'Puerto Cancun', status: 'active', isPublic: true, images: [image] };
    let unit, development;
    try {
      unit = (await root('/api/admin/properties', 'POST', { ...common, title: `QA Unidad ${suffix}`, titleEn: 'QA Linked unit', descriptionEn: 'A linked property for testing.', type: 'Departamento', publicationSection: 'properties', price: 1000000, currency: 'MXN' }, 201)).property;
      development = (await root('/api/admin/properties', 'POST', { ...common, title: `QAVinculado${suffix}`, titleEn: 'QA Linked development', descriptionEn: 'A development for testing.', type: 'Desarrollo', publicationSection: 'developments', linkedPropertyIds: [unit.id] }, 201)).property;
      const results = (await root('/api/search/intelligent', 'POST', { query: development.titleEs })).properties;
      assert.ok(results.some(item => item.id === development.id));
      assert.ok(results.some(item => item.id === unit.id));
      assert.ok((await root('/api/developments')).developments.some(item => item.id === development.id));
      for (const lang of ['es', 'en']) {
        const response = await fetch(base + propertyPath(development, lang));
        assert.equal(response.status, 200);
        const html = await response.text();
        const cards = html.indexOf('<section class="similar-properties">');
        const contact = html.indexOf('<section class="property-lead">');
        assert.ok(cards >= 0 && cards < contact);
        assert.ok(html.slice(cards, contact).includes(propertyPath(unit, lang)));
      }
      await root(`/api/admin/properties/${development.id}/status`, 'PATCH', { status: 'active', isPublic: false });
      assert.ok(!(await root('/api/properties')).properties.some(item => item.id === development.id));
      assert.ok(!(await root('/api/developments')).developments.some(item => item.id === development.id));
      await root(`/api/admin/properties/${development.id}`, 'DELETE');
      development = null;
      const remaining = (await root('/api/admin/properties')).properties.find(item => item.id === unit.id);
      assert.ok(remaining, 'Deleting a development must not delete its units');
      assert.ok(remaining.developmentId, 'Soft archive retains the relationship for recovery');
    } finally {
      if (development) await root(`/api/admin/properties/${development.id}`, 'DELETE');
      if (unit) await root(`/api/admin/properties/${unit.id}`, 'DELETE');
    }
  });
  await t.test("visibilidad de un desarrollo de prueba y desactivación de usuarios", async () => {
    const created = await root("/api/admin/properties", "POST", { title: `QA Desarrollo ${suffix}`, publicationSection: "developments", type: "Desarrollo", state: "Quintana Roo", city: "Cancún", zone: "Puerto Cancún", status: "draft", isPublic: false }, 201);
    const id = created.property.id;
    assert.equal((await root(`/api/admin/properties/${id}/status`, "PATCH", { status: "active", isPublic: true })).property.isPublic, true);
    assert.ok((await root('/api/developments')).developments.some(item => item.id === id));
    assert.equal((await root(`/api/admin/properties/${id}/status`, "PATCH", { status: "active", isPublic: false })).property.isPublic, false);
    assert.ok(!(await root('/api/developments')).developments.some(item => item.id === id));
    assert.ok((await root('/api/admin/developments')).developments.some(item => item.id === id));
    await root(`/api/admin/properties/${id}`, "DELETE");
    await root(`/api/admin/users/${editorId}`, "PATCH", { status: "inactive" });
    await editor("/api/admin/properties", "GET", undefined, 401);
    await root(`/api/admin/users/${memberId}`, "PATCH", { status: "inactive" });
    await member("/api/auth/login", "POST", { username: account.email, password: "654321" }, 401);
  });
});
