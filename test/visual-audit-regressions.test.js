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
  assert.match(html, /id="categoryInventoryCount" role="status">1 propiedad</);
  assert.ok(html.indexOf('catalogFilters') < html.indexOf('categoryInventoryCount'));
  assert.ok(html.indexOf('categoryInventoryCount') < html.indexOf('data-category-property='));
});

test('full SEO pages keep their heading below the menu and the count beside the view switch', {
  skip: process.env.PCC_LAYOUT_BROWSER !== '1' || !process.env.PCC_TEST_BASE,
}, async (t) => {
  const base = new URL(process.env.PCC_TEST_BASE);
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname));
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.PCC_LAYOUT_CHROMIUM });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  for (const width of [320, 390, 1440, 1905]) {
    await page.setViewportSize({ width, height: 900 });
    for (const pathname of ['/propiedades/casas-cancun', '/zonas-cancun', '/valuacion-inmobiliaria-cancun']) {
      assert.equal((await page.goto(new URL(pathname, base).href)).status(), 200);
      const heading = page.locator('.seo-page h1');
      const menu = await page.locator('#mainHeader').boundingBox();
      assert.ok((await heading.boundingBox()).y >= menu.y + menu.height, `${pathname} at ${width}px`);
      if (pathname !== '/propiedades/casas-cancun') continue;
      assert.equal(await heading.innerText(), 'Casas en Cancún');
      const directNav = page.locator(width <= 1180 ? '.public-quick-nav' : '.public-nav-primary');
      for (const [label, href] of [
        ...(width <= 1180 ? [['Comunidades', '/zonas-cancun']] : [['Buscar', '/propiedades']]),
        ['Desarrollos', '/propiedades/desarrollos-cancun'],
        ['Destacadas', '/propiedades/destacadas-cancun'],
      ]) {
        const link = directNav.getByRole('link', { name: label, exact: true });
        assert.ok(await link.isVisible(), `${label} at ${width}px`);
        assert.equal(await link.getAttribute('href'), href);
      }
      const count = await page.locator('#categoryInventoryCount').boundingBox();
      const views = await page.locator('.catalog-view-toggle').boundingBox();
      assert.ok(count.y < views.y + views.height && views.y < count.y + count.height, `result controls at ${width}px`);
    }
  }
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
  const events = [];
  const document = { dispatchEvent: event => events.push(event.type) };
  const api = runtime(['retryPublicInventory'], { state, Event, document, renderProperties() {}, mountPublicComparison() {}, api: async path => {
    assert.equal(path, '/api/properties');
    calls++;
    return new Promise(done => { resolve = done; });
  } });
  const work = api.retryPublicInventory();
  await api.retryPublicInventory();
  assert.equal(calls, 1);
  resolve({ properties: [{ id: 'loaded' }], directory: { areas: [{ id: 'puerto-cancun' }] } });
  await work;
  assert.equal(state.publicInventoryStatus, 'ready');
  assert.equal(state.properties[0].id, 'loaded');
  assert.equal(state.portalDirectory.areas[0].id, 'puerto-cancun');
  assert.deepEqual(state.session, { id: 'admin' });
  assert.deepEqual(state.filters, { text: 'Lagos' });
  const failing = runtime(['retryPublicInventory'], { state, Event, document, renderProperties() {}, mountPublicComparison() {}, api: async () => { throw new Error('offline'); } });
  await failing.retryPublicInventory();
  assert.equal(state.publicInventoryStatus, 'error');
  assert.deepEqual(events, ['pcc:inventory-ready']);
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
      assert.match(nodes['#adminListingsTitle'].textContent, new RegExp(id ? `Editar ${kind}` : kind === 'desarrollo' ? 'Nuevo desarrollo' : 'Nueva propiedad'));
      assert.equal(nodes['#listingModeIntro'].innerHTML, undefined, 'The static instructions do not repeat the heading');
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
    document: { body: { classList: { remove() {} }, style: { removeProperty() {} } }, documentElement: { style: { removeProperty() {} } } },
    mobileNavScrollState: null,
  });
  api.closeMobileNav();
  assert.equal(open, false);
  assert.equal(attributes['aria-expanded'], 'false');
  const styles = fs.readFileSync(require.resolve('../styles.css'), 'utf8');
  assert.match(styles, /\.seo-property-card > \.seo-property-image img\s*\{[^}]*height: auto;/);
  assert.match(styles, /\.category-live-search \.category-search-control:focus-within/);
  assert.match(source, /event\.key !== "Escape"[^]*?closeMobileNav\(\);[^]*?\$\("#menuToggle"\)\.focus\(\{ preventScroll: true \}\)/);
});

test('mobile menu preserves a scrolled page, has independent viewport sizing and unlocks on desktop resize', () => {
  const classes = (initial = []) => {
    const values = new Set(initial);
    return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value) };
  };
  const properties = {};
  const style = { setProperty: (key, value) => { properties[key] = value; }, removeProperty: key => { delete properties[key]; } };
  const attributes = {};
  const groups = [{ open: true }];
  const nodes = {
    '#mainNav': { classList: classes(), scrollTop: 320, querySelectorAll: () => groups },
    '#mainHeader': { classList: classes(['is-hidden']) },
    '#menuToggle': { setAttribute: (key, value) => { attributes[key] = value; } },
  };
  const document = { body: { classList: classes(), style }, documentElement: { style } };
  const restored = [];
  const window = { innerWidth: 390, innerHeight: 844, scrollX: 0, scrollY: 2450, visualViewport: { height: 720, offsetTop: 0 }, scrollTo: value => restored.push(value) };
  const api = runtime(['openMobileNav', 'closeMobileNav', 'syncMobileNavViewport'], {
    $: key => nodes[key], document, window, mobileNavScrollState: null, mobileNavRestoreVersion: 0, lastScrollY: 0,
  });
  api.openMobileNav();
  assert.equal(nodes['#mainNav'].classList.contains('open'), true);
  assert.equal(nodes['#mainHeader'].classList.contains('is-hidden'), false);
  assert.equal(document.body.classList.contains('public-nav-open'), true);
  assert.equal(properties['--public-nav-scroll-offset'], '-2450px');
  assert.equal(properties['--public-nav-page-width'], '390px');
  assert.equal(properties['--public-nav-viewport-height'], '720px');
  assert.equal(nodes['#mainNav'].scrollTop, 0);
  assert.equal(attributes['aria-expanded'], 'true');

  // A second open call must not replace the original scroll position after locking.
  window.scrollY = 0;
  api.openMobileNav();
  api.closeMobileNav();
  assert.equal(document.body.classList.contains('public-nav-open'), false);
  assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(groups[0].open, false);
  assert.equal(properties['--public-nav-scroll-offset'], undefined);
  assert.equal(properties['--public-nav-page-width'], undefined);
  assert.equal(restored[0].top, 2450);
  api.closeMobileNav();
  assert.equal(restored.length, 1);

  window.scrollY = 1600;
  api.openMobileNav();
  window.visualViewport.height = 490;
  window.visualViewport.offsetTop = 20;
  api.syncMobileNavViewport();
  assert.equal(properties['--public-nav-viewport-height'], '490px');
  assert.equal(properties['--public-nav-viewport-top'], '20px');
  window.innerWidth = 1440;
  api.syncMobileNavViewport();
  assert.equal(nodes['#mainNav'].classList.contains('open'), false);
  assert.equal(document.body.classList.contains('public-nav-open'), false);
  assert.equal(properties['--public-nav-viewport-height'], undefined);
  assert.equal(restored[1].top, 1600);
});

test('mobile header stays available while scrolling down and desktop keeps its existing auto-hide behavior', () => {
  const headerClasses = new Set(['is-hidden']);
  const header = { classList: { remove: key => headerClasses.delete(key), toggle: (key, value) => value ? headerClasses.add(key) : headerClasses.delete(key) } };
  const window = { innerWidth: 390, scrollY: 10450 };
  const api = runtime(['updateHeaderVisibility'], {
    $: key => key === '#mainHeader' ? header : key === '#mainNav' ? { classList: { contains: () => false } } : null,
    document: { body: { classList: { contains: () => false, toggle() {} } } }, window, lastScrollY: 9000,
  });
  api.updateHeaderVisibility();
  assert.equal(headerClasses.has('is-hidden'), false);
  assert.equal(headerClasses.has('is-sticky'), true);
  window.innerWidth = 768; window.scrollY = 11000;
  api.updateHeaderVisibility();
  assert.equal(headerClasses.has('is-hidden'), false);
  window.innerWidth = 1440; window.scrollY = 12000;
  api.updateHeaderVisibility();
  assert.equal(headerClasses.has('is-hidden'), true);
  window.scrollY = 11900;
  api.updateHeaderVisibility();
  assert.equal(headerClasses.has('is-hidden'), false);
});

test('mobile menu restores after reflow without overriding a new anchor destination', () => {
  const frames = [], positions = [], rootClasses = new Set();
  const nodes = {
    '#mainNav': { classList: { remove() {}, contains: () => false } },
    '#menuToggle': { setAttribute() {} },
  };
  const style = { removeProperty() {} };
  const window = { location: { href: 'https://example.test/properties' }, scrollTo: value => positions.push(value.top), requestAnimationFrame: fn => frames.push(fn) };
  const bindings = { $: key => nodes[key], window,
    document: { body: { style, offsetHeight: 12000, classList: { remove() {} } }, documentElement: { style, classList: { remove: key => rootClasses.delete(key) } } },
    mobileNavScrollState: { x: 0, y: 9936 }, mobileNavRestoreVersion: 0, lastScrollY: 0,
  };
  rootClasses.add('public-nav-scroll-lock');
  const api = runtime(['closeMobileNav'], bindings);
  api.closeMobileNav();
  assert.deepEqual(positions, [9936]);
  frames.shift()();
  assert.deepEqual(positions, [9936, 9936]);
  frames.shift()();
  assert.equal(rootClasses.has('public-nav-scroll-lock'), false);

  bindings.mobileNavScrollState = { x: 0, y: 1500 };
  api.closeMobileNav();
  window.location.href += '#contact';
  frames.shift()();
  frames.shift()();
  assert.deepEqual(positions, [9936, 9936, 1500]);
});

test('image fallback repairs early failures, preserves loaded photos and never loops', () => {
  class Image {
    constructor(src, complete, naturalWidth) {
      Object.assign(this, { src, currentSrc: src, complete, naturalWidth, dataset: {}, srcset: 'broken-2x.jpg 2x' });
    }
    getAttribute(name) { return this[name]; }
    removeAttribute(name) { delete this[name]; }
    matches(selector) {
      return selector === '[data-location-cover]' && this.dataset.locationCover !== undefined
        || selector === '[data-home-cover]' && this.dataset.homeCover !== undefined
        || selector === '.leaflet-tile' && this.isMapTile;
    }
    closest() { return this.card || null; }
  }
  const failed = new Image('https://example.test/failed.jpg', true, 0);
  const loaded = new Image('https://example.test/loaded.jpg', true, 640);
  const pending = new Image('https://example.test/pending.jpg', false, 0);
  const localPreview = new Image('blob:local-photo', true, 0);
  const locationCover = new Image('https://example.test/location.jpg', true, 0);
  locationCover.dataset.locationCover = '';
  const homeCover = new Image('/media/properties/home-photo/0?w=640', false, 0);
  homeCover.dataset.homeCover = '';
  const homeClasses = new Set(['has-home-cover']);
  homeCover.card = { hidden: false, href: '/propiedades/casas-cancun', classList: { remove: name => homeClasses.delete(name) } };
  const mapTile = new Image('https://tile.openstreetmap.org/12/1/1.png', true, 0);
  mapTile.isMapTile = true;
  let listener;
  const api = runtime(['installImageFallbacks'], {
    HTMLImageElement: Image, fallbackImage: '/assets/fallback.webp',
    document: {
      addEventListener(type, fn, capture) { assert.equal(type, 'error'); assert.equal(capture, true); listener = fn; },
      querySelectorAll: () => [failed, loaded, pending, localPreview, locationCover, homeCover, mapTile],
    },
  });
  api.installImageFallbacks();
  assert.equal(failed.src, '/assets/fallback.webp');
  assert.equal(failed.srcset, undefined);
  assert.equal(loaded.src, 'https://example.test/loaded.jpg');
  assert.equal(pending.src, 'https://example.test/pending.jpg');
  assert.equal(localPreview.src, 'blob:local-photo');
  assert.equal(locationCover.hidden, true);
  assert.equal(locationCover.src, 'https://example.test/location.jpg', 'never replace a Location photo with an unrelated property');
  listener({ target: homeCover });
  assert.equal(homeCover.hidden, true);
  assert.equal(homeClasses.has('has-home-cover'), false);
  assert.equal(homeCover.src, '/media/properties/home-photo/0?w=640', 'failed home covers must not become a generic hero image');
  assert.equal(homeCover.dataset.fallbackApplied, undefined);
  assert.equal(homeCover.card.hidden, false);
  assert.equal(homeCover.card.href, '/propiedades/casas-cancun');
  listener({ target: mapTile });
  assert.equal(mapTile.src, 'https://tile.openstreetmap.org/12/1/1.png', 'a failed map tile must not become a property photo');
  assert.equal(mapTile.dataset.fallbackApplied, undefined);
  listener({ target: pending });
  assert.equal(pending.src, '/assets/fallback.webp');
  pending.src = '/assets/replacement.webp';
  listener({ target: pending });
  assert.equal(pending.src, '/assets/replacement.webp');
  assert.doesNotThrow(() => listener({ target: {} }));
});
