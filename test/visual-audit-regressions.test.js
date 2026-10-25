const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { getPageByPath, renderCategoryPage } = require('../seo-pages');
const source = fs.readFileSync(require.resolve('../app.js'), 'utf8');

function runtime(names, bindings) {
  const functions = names.map(name => source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0]);
  return vm.runInNewContext(functions.join('\n') + `\n({${names.join(',')}})`, bindings);
}

test('category filtering keeps the main heading and live count synchronized in both languages', () => {
  const nodes = Object.fromEntries(['#categoryKeywordSearch', '#categorySearchStatus', '#categoryInventoryCount', '#categorySearchEmpty'].map(id => [id, {}]));
  const cards = ['Lagos del Sol', 'Puerto Cancun', 'Lagos del Sol'].map(text => ({ dataset: { categorySearch: text } }));
  const state = { lang: 'es' };
  const api = runtime(['filterServerRenderedCategory'], {
    state, $: id => nodes[id], $$: () => cards, normalizeSearchText: value => String(value || '').toLowerCase(),
  });
  for (const [query, count] of [['Lagos', 2], ['Puerto', 1], ['absent', 0], ['', 3]]) {
    nodes['#categoryKeywordSearch'].value = query;
    api.filterServerRenderedCategory();
    assert.equal(cards.filter(card => !card.hidden).length, count);
    assert.equal(nodes['#categoryInventoryCount'].textContent, nodes['#categorySearchStatus'].textContent);
    assert.equal(nodes['#categorySearchEmpty'].hidden, count > 0);
    assert.equal(nodes['#categorySearchStatus'].textContent, `${count} ${count === 1 ? 'propiedad disponible' : 'propiedades disponibles'}`);
  }
  state.lang = 'en';
  nodes['#categoryKeywordSearch'].value = 'Puerto';
  api.filterServerRenderedCategory();
  assert.equal(nodes['#categoryInventoryCount'].textContent, '1 available listing');
});

test('server-rendered inventory exposes a stable heading target without changing card order', () => {
  const property = { id: 'audit-test', titleEs: 'Terreno', type: 'Terreno', status: 'active', isPublic: true, operation: 'sale', images: [] };
  const html = renderCategoryPage(getPageByPath('/propiedades/terrenos-cancun'), [property]);
  assert.match(html, /id="categoryInventoryCount">1 propiedad disponible/);
  assert.ok(html.indexOf('categoryInventoryCount') < html.indexOf('categoryKeywordSearch'));
  assert.ok(html.indexOf('categoryKeywordSearch') < html.indexOf('data-category-property'));
});

test('loading and connection errors are not presented as an empty inventory', () => {
  const state = { lang: 'es', properties: [], publicInventoryStatus: 'loading' };
  const nodes = { '#resultCount': {}, '#homeCatalogCta': {} };
  const attrs = {};
  const grid = { setAttribute: (key, value) => { attrs[key] = value; } };
  const api = runtime(['renderPublicInventoryStatus'], { state, $: id => nodes[id], refreshIcons() {}, escapeHtml: text => text });
  assert.equal(api.renderPublicInventoryStatus(grid), true);
  assert.match(grid.innerHTML, /Cargando propiedades/);
  assert.doesNotMatch(grid.innerHTML, /data-retry-inventory/);
  assert.equal(attrs['aria-busy'], 'true');
  state.publicInventoryStatus = 'error';
  api.renderPublicInventoryStatus(grid);
  assert.match(grid.innerHTML, /data-retry-inventory/);
  assert.equal(attrs['aria-busy'], 'false');
  state.publicInventoryStatus = 'ready';
  assert.equal(api.renderPublicInventoryStatus(grid), false);
  state.properties = [{ id: 'existing' }];
  state.publicInventoryStatus = 'error';
  assert.equal(api.renderPublicInventoryStatus(grid), false);
});

test('inventory retry prevents duplicate requests and recovers without changing the session or filters', async () => {
  const state = { publicInventoryStatus: 'error', properties: [], session: { id: 'admin' }, filters: { text: 'Lagos' } };
  let resolve;
  let calls = 0;
  const api = runtime(['retryPublicInventory'], { state, renderProperties() {}, api: async path => {
    assert.equal(path, '/api/properties');
    calls++;
    return new Promise(done => { resolve = done; });
  } });
  const work = api.retryPublicInventory();
  await api.retryPublicInventory();
  assert.equal(calls, 1);
  resolve({ properties: [{ id: 'loaded' }] });
  await work;
  assert.equal(state.publicInventoryStatus, 'ready');
  assert.equal(state.properties[0].id, 'loaded');
  assert.deepEqual(state.session, { id: 'admin' });
  assert.deepEqual(state.filters, { text: 'Lagos' });
  const failing = runtime(['retryPublicInventory'], { state, renderProperties() {}, api: async () => { throw new Error('offline'); } });
  await failing.retryPublicInventory();
  assert.equal(state.publicInventoryStatus, 'error');
  assert.equal(state.properties[0].id, 'loaded');
});

test('editor headings distinguish creation from editing without changing the record id', () => {
  for (const section of ['new-property', 'new-development']) {
    for (const id of ['', 'persisted-record']) {
      const form = { dataset: {}, querySelector: () => null, querySelectorAll: () => [] };
      const nodes = { '#listingForm': form, '#listingModeIntro': {}, '#adminListingsTitle': {}, '#listingSubmitButton': { dataset: {} } };
      const fields = new Map();
      const api = runtime(['configureListingFormMode', 'listingEditorTitle'], {
        $: key => nodes[key], state: { adminSection: section, properties: [], lang: 'es' }, listingFormRecordId: () => id,
        formField: (_form, name) => {
          if (!fields.has(name)) fields.set(name, { value: '', closest: () => null });
          return fields.get(name);
        }, renderDevelopmentPropertyLinker() {}, t: key => key,
      });
      api.configureListingFormMode(section);
      const kind = section === 'new-development' ? 'desarrollo' : 'propiedad';
      assert.match(nodes['#listingModeIntro'].innerHTML, new RegExp(id ? `Editar ${kind}` : kind === 'desarrollo' ? 'Nuevo desarrollo' : 'Nueva propiedad'));
      assert.equal(nodes['#adminListingsTitle'].textContent, api.listingEditorTitle(kind === 'desarrollo', Boolean(id)));
      assert.equal(form.dataset.listingMode, kind === 'desarrollo' ? 'development' : 'property');
      assert.equal(fields.has('id'), false);
    }
  }
});

test('mobile navigation closes accessibly and catalog image sizes override fixed HTML heights', () => {
  const attributes = {};
  let open = true;
  const api = runtime(['closeMobileNav'], { $: id => id === '#mainNav'
    ? { classList: { remove: () => { open = false; } } }
    : { setAttribute: (key, value) => { attributes[key] = value; } },
  });
  api.closeMobileNav();
  assert.equal(open, false);
  assert.equal(attributes['aria-expanded'], 'false');
  const styles = fs.readFileSync(require.resolve('../styles.css'), 'utf8');
  assert.match(styles, /\.seo-property-card > \.seo-property-image img\s*\{[^}]*height: auto;/);
  assert.match(styles, /\.category-live-search \.category-search-control:focus-within/);
  assert.match(source, /event\.key !== "Escape"[^]*?closeMobileNav\(\);[^]*?\$\("#menuToggle"\)\.focus\(\)/);
});

test('image fallback repairs early failures, preserves loaded photos and never loops', () => {
  class Image {
    constructor(src, complete, naturalWidth) {
      Object.assign(this, { src, currentSrc: src, complete, naturalWidth, dataset: {}, srcset: 'broken-2x.jpg 2x' });
    }
    getAttribute(name) { return this[name]; }
    removeAttribute(name) { delete this[name]; }
  }
  const failed = new Image('https://example.test/failed.jpg', true, 0);
  const loaded = new Image('https://example.test/loaded.jpg', true, 640);
  const pending = new Image('https://example.test/pending.jpg', false, 0);
  const localPreview = new Image('blob:local-photo', true, 0);
  let listener;
  const api = runtime(['installImageFallbacks'], {
    HTMLImageElement: Image, fallbackImage: '/assets/fallback.webp',
    document: {
      addEventListener(type, fn, capture) { assert.equal(type, 'error'); assert.equal(capture, true); listener = fn; },
      querySelectorAll: () => [failed, loaded, pending, localPreview],
    },
  });
  api.installImageFallbacks();
  assert.equal(failed.src, '/assets/fallback.webp');
  assert.equal(failed.srcset, undefined);
  assert.equal(loaded.src, 'https://example.test/loaded.jpg');
  assert.equal(pending.src, 'https://example.test/pending.jpg');
  assert.equal(localPreview.src, 'blob:local-photo');
  listener({ target: pending });
  assert.equal(pending.src, '/assets/fallback.webp');
  pending.src = '/assets/replacement.webp';
  listener({ target: pending });
  assert.equal(pending.src, '/assets/replacement.webp');
  assert.doesNotThrow(() => listener({ target: {} }));
});
