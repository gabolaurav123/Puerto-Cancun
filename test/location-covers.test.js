const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const inventory = require('../inventory-contract');
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');

test('Location images come only from eligible listings in that Location, with no unrelated stock fallback', () => {
  const cards = inventory.LOCATIONS.map(location => {
    const image = { removeAttribute(key) { delete this[key]; } };
    return { dataset: { commercialLocation: location.id }, image, querySelector: () => image, classList: { toggle() {} } };
  });
  const hydrate = vm.runInNewContext(source.match(/function hydrateLocationCovers\([^]*?\n}/)[0] + '\nhydrateLocationCovers', {
    window: { PccInventory: inventory }, document: { querySelectorAll: () => cards }, localizedTitle: item => item.titleEs, fallbackImage: '/assets/generic.webp',
  });
  const p = { id: 'real', titleEs: 'Real listing', type: 'Casa', status: 'active', isPublic: true, zone: 'Puerto Cancun', images: ['/media/properties/real/0'] };
  hydrate([p, { ...p, id: 'private', isPublic: false, zone: 'Merida', images: ['/media/properties/private/0'] }]);
  assert.equal(cards[1].image.src, p.images[0]);
  assert.equal(cards[1].image.alt, p.titleEs);
  assert.equal(cards[1].image.hidden, false);
  for (const card of [cards[0], cards[2], cards[3]]) {
    assert.equal(card.image.hidden, true);
    assert.equal(card.image.src, undefined);
  }
});
