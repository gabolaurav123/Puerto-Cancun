const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const inventory = require('../inventory-contract');
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');

test('Location images come only from eligible listings in that Location, with no unrelated stock fallback', () => {
  const cards = inventory.LOCATIONS.map(location => {
    const image = { dataset: {}, removeAttribute(key) { delete this[key]; } };
    return { dataset: { commercialLocation: location.id }, image, querySelector: selector => selector === '[data-home-cover]' ? image : null, classList: { toggle() {} } };
  });
  const p = { id: 'real', titleEs: 'Real listing', type: 'Casa', status: 'active', isPublic: true, zone: 'Puerto Cancun', images: ['/media/properties/real/0'] };
  const functions = ['updateHomeEditorialImages', 'storedImages', 'optimizedMediaUrl'].map(name => {
    const match = source.match(new RegExp(`function ${name}\\([^]*?\\n}`));
    assert.ok(match, `missing function ${name}`);
    return match[0];
  });
  const update = vm.runInNewContext(functions.join('\n') + '\nupdateHomeEditorialImages', {
    state: { properties: [
      p,
      { ...p, id: 'private', isPublic: false, zone: 'Merida', images: ['/media/properties/private/0'] },
      { ...p, id: 'stock', zone: 'Zona Hotelera', images: ['https://images.example.test/stock.jpg'] },
    ] },
    window: { PccInventory: inventory }, localizedTitle: item => item.titleEs,
    document: { querySelector: selector => {
      return cards.find(card => selector === `.zone-grid [data-commercial-location="${card.dataset.commercialLocation}"]`) || null;
    } },
  }, { timeout: 1000 });
  update();
  assert.equal(cards[1].image.src, `${p.images[0]}?w=640`);
  assert.equal(cards[1].image.alt, p.titleEs);
  assert.equal(cards[1].image.hidden, false);
  for (const card of [cards[0], cards[2], cards[3]]) {
    assert.equal(card.image.hidden, true);
    assert.equal(card.image.src, undefined);
  }
});
