const test = require('node:test');
const assert = require('node:assert/strict');
const base = process.env.PCC_TEST_BASE;
const databaseUrl = process.env.PCC_TEST_DATABASE_URL;

function priceRegressionDatabase() {
  const url = new URL(databaseUrl);
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol), 'PostgreSQL URL required');
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Price regression requires loopback PostgreSQL');
  assert.equal(url.port || '5432', '5432', 'Only the designated local PostgreSQL port is allowed');
  assert.equal(url.pathname, '/pcc_master_20261029', 'Only the disposable master QA database is allowed');
  assert.equal(url.search, '', 'Connection parameters must not override the guarded host/database');
  assert.equal(url.hash, '');
  const { Client } = require('pg');
  return new Client({ connectionString: databaseUrl, ssl: false, connectionTimeoutMillis: 5000, query_timeout: 5000 });
}

function client() {
  let cookie = '', csrf = '';
  return async (route, method = 'GET', body, expected = 200) => {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookie, 'X-CSRF-Token': csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (response.headers.getSetCookie().length) cookie = response.headers.getSetCookie()[0].split(';')[0];
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(data)}`);
    if (data.csrfToken) csrf = data.csrfToken;
    return data;
  };
}

test('master catalog contracts with real isolated PostgreSQL', { skip: !base }, async t => {
  assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local QA only');
  const admin = client(), buyer = client(), ids = [];
  const stamp = Date.now();
  await admin('/api/session');
  await admin('/api/auth/login', 'POST', { username: 'qa-admin', password: 'qa-admin-password-only-local' });
  const sharp = require('sharp');
  const image = 'data:image/jpeg;base64,' + (await sharp({ create: { width: 64, height: 64, channels: 3, background: '#e4eeee' } }).jpeg().toBuffer()).toString('base64');
  const common = { title: `QACatalog ${stamp}`, publicationSection: 'properties', type: 'Terreno', state: 'Quintana Roo', city: 'Cancun', zone: 'Puerto Cancun', status: 'active', isPublic: true, currency: 'USD', price: 100000, images: [image], description: 'Registro de prueba aislada, sin datos comerciales reales.' };
  let unit;
  try {
    unit = (await admin('/api/admin/properties', 'POST', { ...common, mls: 'QA-1707', latitude: 21.123456, longitude: -86.123456, address: 'QA direccion privada', locationPrecision: 'hidden', catalogData: { salesModality: 'resale', locationId: 'puerto-cancun', homeOrder: 3 } }, 201)).property;
    ids.push(unit.id);
    const duplicate = (await admin('/api/admin/properties', 'POST', { ...common, title: common.title + ' B', mls: 'QA-1707', priceUnit: 'sqm', price: 4200, catalogData: { locationId: 'cancun-city', salesModality: 'direct' } }, 201)).property;
    ids.push(duplicate.id);
    const draft = (await admin('/api/admin/properties', 'POST', { ...common, title: common.title + ' privado', status: 'draft', isPublic: false }, 201)).property;
    ids.push(draft.id);
    await t.test('public catalog and smart search exclude drafts and private location', async () => {
      const response = await buyer('/api/properties');
      const found = response.properties.find(row => row.id === unit.id);
      assert.equal(found.latitude, null); assert.equal(found.longitude, null);
      assert.equal(found.address, ''); assert.equal(found.googleMapsUrl, '');
      assert.equal(found.verifiedBy, undefined); assert.equal(found.completeness, undefined);
      assert.ok(!response.properties.some(row => row.id === draft.id));
      await buyer('/api/session');
      const search = await buyer('/api/search/intelligent', 'POST', { query: 'QA-1707' });
      assert.deepEqual(search.properties.filter(row => ids.includes(row.id)).map(row => row.id).sort(), [unit.id, duplicate.id].sort());
      assert.ok(!search.properties.some(row => row.id === draft.id));
    });
    await t.test('Location intersects price base without changing physical geography', async () => {
      const total = await buyer('/api/catalog?location=puerto-cancun&operation=sale&currency=USD&priceBasis=total&max=150000');
      assert.ok(total.items.some(row => row.id === unit.id));
      assert.ok(!total.items.some(row => row.id === duplicate.id));
      const sqm = await buyer('/api/catalog?location=cancun-city&priceBasis=sqm&operation=sale&currency=USD&max=5000');
      const found = sqm.items.find(row => row.id === duplicate.id);
      assert.ok(found); assert.equal(found.zone, common.zone); assert.equal(found.city, common.city);
      const box = await buyer('/api/catalog?bounds=-86.2,21.1,-86.1,21.2');
      assert.ok(!box.items.some(row => row.id === unit.id), 'Hidden coordinates cannot be inferred with bounds');
    });
    await t.test('conflicting edits return 409 and preserve newer changes', async () => {
      const first = await admin(`/api/admin/properties/${unit.id}`, 'PUT', { ...common, title: 'QA version guardada', images: unit.images, expectedUpdatedAt: unit.updatedAt, catalogData: unit.catalogData });
      await admin(`/api/admin/properties/${unit.id}`, 'PUT', { ...common, title: 'QA version obsoleta', images: unit.images, expectedUpdatedAt: unit.updatedAt }, 409);
      const listings = await admin('/api/admin/properties');
      assert.equal(listings.properties.find(row => row.id === unit.id).titleEs, first.property.titleEs);
    });
    await t.test('copilot exact pending IDs includes drafts but does not write', async () => {
      const before = await admin('/api/admin/properties');
      const answer = await admin('/api/admin/copilot/query', 'POST', { question: 'Muéstrame las propiedades de Puerto Cancún incompletas' });
      assert.equal(answer.tool, 'queryInventoryQuality');
      assert.ok(answer.selection.ids.includes(draft.id));
      const after = await admin('/api/admin/properties');
      assert.deepEqual(after.properties, before.properties);
    });
    await t.test('availability confirmation is atomic and separate from editing or publication', async () => {
      const before = (await admin('/api/admin/properties')).properties.find(row => row.id === unit.id);
      const policy = await admin(`/api/admin/properties/${unit.id}/verify`);
      assert.equal(policy.reviewPolicy.properties, 90);
      await admin(`/api/admin/properties/${unit.id}/verify`, 'POST', {}, 400);
      await admin(`/api/admin/properties/${draft.id}/verify`, 'POST', { confirmAvailability: true }, 409);
      const verified = (await admin(`/api/admin/properties/${unit.id}/verify`, 'POST', { confirmAvailability: true })).property;
      assert.ok(verified.lastVerifiedAt);
      assert.ok(verified.verifiedBy);
      assert.equal(verified.updatedAt, before.updatedAt);
      assert.equal(verified.status, before.status);
      assert.equal(verified.isPublic, before.isPublic);
      const publicRow = (await buyer('/api/properties')).properties.find(row => row.id === unit.id);
      assert.equal(publicRow.verifiedBy, undefined);
      assert.equal(publicRow.lastVerifiedAt, verified.lastVerifiedAt);
    });
    await t.test('price preservation through admin PUT retains raw isolated PostgreSQL values', { skip: !databaseUrl }, async t => {
      const db = priceRegressionDatabase();
      const ownedPriceIds = new Set();
      const priceColumns = row => Object.fromEntries(['price_amount', 'price_currency', 'price_unit', 'price_usd', 'price_mxn'].map(key => [key, row[key]]));
      const readOwn = async id => {
        assert.ok(ownedPriceIds.has(id), 'SQL is limited to IDs created by this price regression');
        const result = await db.query(`SELECT id, title_es, updated_at::text,
          price_amount::text, price_currency, price_unit, price_usd::text, price_mxn::text
          FROM properties WHERE id = $1`, [id]);
        assert.equal(result.rowCount, 1);
        return result.rows[0];
      };
      try {
        await db.connect();
        assert.equal((await db.query('SELECT current_database() AS name')).rows[0].name, 'pcc_master_20261029');
        const columns = (await db.query(`SELECT column_name, is_nullable FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'properties'
          AND column_name = ANY($1::text[])`, [['price_amount', 'price_currency', 'price_unit']])).rows;
        assert.equal(columns.length, 3);
        assert.equal(columns.find(column => column.column_name === 'price_amount').is_nullable, 'YES');
        for (const name of ['price_currency', 'price_unit']) {
          const nullable = columns.find(column => column.column_name === name).is_nullable;
          t.diagnostic(`${name}: nullable=${nullable}. ${nullable === 'NO' ? 'NULL cannot be seeded without altering the schema; unknown dimensions remain covered by function tests.' : 'This fixture retains supported, explicit dimensions.'}`);
        }
        // Never relax NOT NULL/CHECK constraints or modify an existing catalog record.
        for (const [label, amount] of [['null price', null], ['precise price', '123.456789']]) {
          await t.test(`${label}: title-only edits retain legacy aliases and explicit edits validate dimensions`, async () => {
            const title = `QAPrice ${stamp} ${label}`;
            const created = (await admin('/api/admin/properties', 'POST', {
              ...common, title, titleEn: `QA price fixture ${stamp} ${label}`, descriptionEn: 'Isolated price preservation fixture.',
              status: 'draft', isPublic: false, priceUnit: 'total',
            }, 201)).property;
            ids.push(created.id);
            ownedPriceIds.add(created.id);
            assert.equal(created.titleEs, title);
            const initial = await readOwn(created.id);
            assert.equal(initial.title_es, title, 'The HTTP server and SQL client must refer to the same newly created QA record');
            const seeded = await db.query(`UPDATE properties SET price_amount = $3, price_currency = 'USD',
              price_unit = 'total', price_usd = $4, price_mxn = $5
              WHERE id = $1 AND title_es = $2 RETURNING id`, [created.id, title, amount, '900.1200', '18000.3400']);
            assert.equal(seeded.rowCount, 1, 'Seed exactly one owned QA record');
            const before = await readOwn(created.id);
            assert.equal(before.price_amount, amount);
            assert.equal(before.price_usd, '900.1200');
            assert.equal(before.price_mxn, '18000.3400');
            const edit = {
              title: title + ' renamed', titleEn: created.titleEn, descriptionEn: created.descriptionEn,
              publicationSection: 'properties', type: common.type, state: common.state, city: common.city, zone: common.zone,
              status: 'draft', isPublic: false, preserveImages: true, expectedUpdatedAt: created.updatedAt,
            };
            for (const key of ['price', 'currency', 'priceUnit', 'priceUsd', 'priceMxn', 'catalogData']) {
              assert.equal(Object.hasOwn(edit, key), false, `Title-only PUT must omit ${key}`);
            }
            const saved = (await admin(`/api/admin/properties/${created.id}`, 'PUT', edit)).property;
            const after = await readOwn(created.id);
            assert.equal(after.title_es, edit.title);
            assert.deepEqual(priceColumns(after), priceColumns(before), 'All five raw price columns must be unchanged');
            assert.equal(saved.price, amount === null ? null : Number(amount), 'The DTO must not revive either legacy alias');
            assert.equal(saved.currency, 'USD');
            assert.equal(saved.priceUnit, 'total');
            for (const invalid of [
              { currency: null, priceUnit: 'total' }, { currency: 'USD', priceUnit: null },
              { currency: 'EUR', priceUnit: 'total' }, { currency: 'USD', priceUnit: 'from' },
            ]) {
              await admin(`/api/admin/properties/${created.id}`, 'PUT', {
                ...edit, expectedUpdatedAt: saved.updatedAt, price: 1250.75, ...invalid,
              }, 400);
              assert.deepEqual(await readOwn(created.id), after, 'Rejected commercial edits must not change any tested SQL value or version');
            }
            const explicit = (await admin(`/api/admin/properties/${created.id}`, 'PUT', {
              ...edit, expectedUpdatedAt: saved.updatedAt, price: 1250.75, currency: 'MXN', priceUnit: 'sqm',
            })).property;
            assert.deepEqual(priceColumns(await readOwn(created.id)), {
              price_amount: '1250.75', price_currency: 'MXN', price_unit: 'sqm', price_usd: null, price_mxn: '1250.75',
            });
            assert.equal(explicit.price, 1250.75);
            assert.equal(explicit.currency, 'MXN');
            assert.equal(explicit.priceUnit, 'sqm');
          });
        }
      } finally {
        await db.end();
      }
    });
  } finally {
    for (const id of ids.reverse()) await admin(`/api/admin/properties/${id}`, 'DELETE');
  }
});
