const test = require('node:test');
const assert = require('node:assert/strict');
const { renderCatalog } = require('../catalog-view');
const page = { lang: 'es', category: {} };

test('unmatched subarea and development remain selected instead of widening the search', () => {
  const html = renderCatalog(page, [], { zone: 'Merida', development: 'retired-development' }, () => '');
  assert.match(html, /<option value="Merida" selected>Merida \(sin coincidencias actuales\)<\/option>/);
  assert.match(html, /<option value="retired-development" selected>/);
  assert.match(html, /Encontramos 0 propiedades/);
});

test('retained options are escaped and comparison survives chips and native form submission', () => {
  const html = renderCatalog(page, [], { zone: '<script>', compare: 'a,b', beds: '3' }, () => '');
  assert.ok(!html.includes('<script>'));
  assert.match(html, /value="&lt;script&gt;" selected/);
  assert.match(html, /name="compare" value="a,b"/);
  const links = [...html.matchAll(/class="catalog-chip"/g)];
  assert.equal(links.length, 2);
  assert.match(html, /compare=a%2Cb/);
});

test('selected monetary context opens advanced controls even without a budget', () => {
  const html = renderCatalog(page, [], { currency: 'USD', priceBasis: 'sqm' }, () => '');
  assert.match(html, /class="catalog-advanced" open/);
  assert.match(html, /name="priceBasis">[\s\S]*?<option value="sqm" selected/);
});

test('effective category criteria are exposed to conversational search without URL query parameters', () => {
  const html = renderCatalog({ lang: 'es', category: { zone: 'Puerto Canc\u00fan' } }, [], {}, () => '');
  assert.match(html, /data-catalog-query="[^"]*location=puerto-cancun/);
});
