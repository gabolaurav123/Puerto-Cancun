const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCatalogData, publicProperty } = require('../inventory-metadata');
const { savedCatalogQuery } = require('../saved-catalog-search');
test('commercial metadata is explicit and null order stays absent', () => {
  assert.equal(normalizeCatalogData({ homeOrder: null }).homeOrder, null);
  assert.equal(normalizeCatalogData({ homeOrder: 0 }).homeOrder, 0);
  assert.throws(() => normalizeCatalogData({ locationId: 'unknown' }));
  assert.throws(() => normalizeCatalogData({ homeOrder: -1 }));
  assert.equal(normalizeCatalogData({ priceOnRequest: 'true' }).priceOnRequest, false);
});
test('public coordinates honor precision without mutating admin record', () => {
  const p = { id: 'qa', locationPrecision: 'approximate', latitude: 21.123456, longitude: -86.754321,
    address: 'Private street', mapPlace: 'Private address', verifiedBy: 'admin-private', sourceRequestId: 'private', idempotencyKey: 'private',
    catalogData: { locationId: 'puerto-cancun', provenance: { email: 'private' } },
    developmentData: { id: 'dev-qa', stage: 'presale', internalNotes: 'private' } };
  const clean = publicProperty(p);
  assert.equal(clean.latitude, 21.12); assert.equal(clean.longitude, -86.75);
  assert.equal(clean.address, ''); assert.equal(clean.mapPlace, '');
  for (const key of ['verifiedBy', 'sourceRequestId', 'idempotencyKey']) assert.equal(clean[key], undefined);
  assert.equal(clean.catalogData.provenance, undefined); assert.equal(clean.developmentData.internalNotes, undefined);
  assert.equal(p.latitude, 21.123456); assert.equal(p.address, 'Private street');
  assert.equal(publicProperty({ ...p, locationPrecision: 'hidden' }).googleMapsUrl, '');
  assert.equal(publicProperty({ ...p, locationPrecision: 'hidden' }).latitude, null);
  assert.equal(publicProperty({ ...p, locationPrecision: 'exact' }).latitude, p.latitude);
});
test('legacy alerts never guess missing monetary context or ignore unsupported constraints', () => {
  assert.ok(savedCatalogQuery({ maxPrice: 700000, currency: 'USD' }).errors.length);
  assert.ok(savedCatalogQuery({ operation: 'rent', maxPrice: 5000, currency: 'USD' }).errors.length);
  assert.ok(savedCatalogQuery({ bathrooms: 2 }).errors.length);
  const q = savedCatalogQuery({ operation: 'sale', propertyType: 'Casa', currency: 'USD', maxPrice: 700000 });
  assert.equal(q.errors.length, 0); assert.equal(q.max, 700000); assert.equal(q.type, 'Casa');
});
