const test = require('node:test');
const assert = require('node:assert/strict');
const { renderCatalog } = require('../catalog-view');
const page = { lang: 'es', category: {} };

test('unmatched subarea and development remain selected instead of widening the search', () => {
  const html = renderCatalog(page, [], { zone: 'Merida', development: 'retired-development' }, () => '');
  assert.match(html, /<option value="Merida" selected>Merida \(sin coincidencias actuales\)<\/option>/);
  assert.match(html, /<option value="retired-development" selected>/);
  assert.match(html, /id="categoryInventoryCount" role="status">0 propiedades</);
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

test('compact search submits the complete filter form and presents localized locations', () => {
  for (const [lang, label, city] of [['es', 'Ubicaciones', 'Ciudad de Cancún'], ['en', 'Locations', 'Cancun City']]) {
    const html = renderCatalog({ lang, category: { location: 'cancun-city' } }, [], { q: 'Marina' }, () => '');
    assert.match(html, /name="q" form="catalogFilters" value="Marina"/);
    assert.match(html, /type="submit" form="catalogFilters"/);
    assert.match(html, /<details class="catalog-filter-panel"><summary>/);
    assert.ok(html.includes('<legend>' + label + '</legend>'));
    assert.ok(html.includes('value="cancun-city" checked /><span>' + city + '</span>'));
  }
});

test('large catalogs retain adjacent pages and endpoints without printing every page', () => {
  const rows = Array.from({ length: 2400 }, (_, index) => ({ id: `fixture-${index}`, status: 'active', currency: 'USD', price: 1000000, operation: 'sale', zone: 'Puerto Cancún' }));
  for (const lang of ['es', 'en']) {
    const html = renderCatalog({ lang, category: {} }, rows, { page: '50', currency: 'USD', location: 'puerto-cancun', compare: 'fixture-0,fixture-1' }, () => '');
    const pagination = html.match(/<nav class="catalog-pagination"[^]*?<\/nav>/)[0];
    const links = [...pagination.matchAll(/<a [^]*?href="([^"]+)">/g)];
    assert.equal(links.length, 7);
    for (const [, href] of links) {
      const params = new URL(href.replace(/&amp;/g, '&'), 'https://example.test').searchParams;
      assert.equal(params.get('currency'), 'USD');
      assert.equal(params.get('location'), 'puerto-cancun');
      assert.equal(params.get('compare'), 'fixture-0,fixture-1');
    }
    assert.match(pagination, /page=1(?:&amp;|\")/);
    assert.match(pagination, /page=100(?:&amp;|\")/);
    assert.match(pagination, /aria-current="page"/);
    assert.ok(pagination.includes(lang === 'en' ? 'Previous page' : 'Página anterior'));
  }
});
