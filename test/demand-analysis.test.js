const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeDemand } = require('../demand-analysis');
const base = { type: 'Casa', operation: 'sale', min: 1, max: 500, priceBasis: 'total' };
test('demand groups retain original currency and do not count malformed requests as empty', () => {
  const data = analyzeDemand([
    { id: 'a', filters: { ...base, currency: 'USD' } },
    { id: 'b', filters: { ...base, currency: 'MXN' } },
    { id: 'c', filters: { ...base, currency: 'USD' } },
    { id: 'invalid', filters: base },
  ], []);
  assert.equal(data.unmatched, 3);
  assert.equal(data.groups.length, 2);
  assert.equal(data.needsReview.length, 1);
});
test('private matching inventory does not satisfy a saved public search', () => {
  const search = { id: 'a', filters: { ...base, currency: 'USD' } };
  const property = { id: 'hidden', type: 'Casa', publicationSection: 'properties', status: 'draft', isPublic: false, price: 200, currency: 'USD', priceUnit: 'total', operation: 'sale' };
  assert.equal(analyzeDemand([search], [property]).unmatched, 1);
  assert.equal(analyzeDemand([search], [{ ...property, status: 'active', isPublic: true }]).matched, 1);
});

test('location sets group independently of order and duplicates without changing stored criteria', () => {
  const locations = ['puerto-cancun', 'zona-hotelera'];
  const searches = [
    { id: 'forward', filters: { ...base, currency: 'USD', locations } },
    { id: 'reverse', filters: { ...base, currency: 'USD', locations: [...locations].reverse() } },
    { id: 'duplicate', filters: { ...base, currency: 'USD', locations: [...locations, locations[0]] } },
    { id: 'different-set', filters: { ...base, currency: 'USD', locations: [locations[0]] } },
    { id: 'different-currency', filters: { ...base, currency: 'MXN', locations: [...locations].reverse() } },
  ];
  const before = structuredClone(searches);
  for (const input of [searches, [...searches].reverse()]) {
    const result = analyzeDemand(input, []);
    assert.equal(result.needsReview.length, 0);
    assert.equal(result.unmatched, 5);
    assert.equal(result.groups.length, 3);
    assert.deepEqual(result.groups.find(group => group.searches.length === 3).searches.map(search => search.id).sort(), ['duplicate', 'forward', 'reverse']);
  }
  assert.deepEqual(searches, before);
});
