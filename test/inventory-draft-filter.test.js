const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

function runtime(names, bindings) {
  return vm.runInNewContext(names.map(name => app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0]).join('\n') + `\n({${names.join(',')}})`, bindings);
}

const emptyFilters = () => ({ search: '', type: '', zone: '', operation: '', status: '', quality: '', missingCover: false });
function inventoryRuntime(section = 'developments') {
  const iconRefreshes = [];
  const nodes = new Map(['#adminListings', '#adminListingSummary', '#listingDraftShelf', '#listingDraftList'].map(id => [id, { innerHTML: '', textContent: '', hidden: false }]));
  const properties = ['properties', 'developments'].flatMap(publicationSection => ['active', 'draft', 'pending', 'disabled', 'sold', 'rented', 'archived'].map((status, index) => ({
    id: `${publicationSection}-${status}`, titleEs: `${publicationSection} ${status}`, publicationSection, status,
    type: publicationSection === 'developments' ? 'Desarrollo' : 'Casa', descriptionEs: 'Description',
    zone: status === 'draft' ? 'Draft zone' : 'Existing zone', operation: 'sale', qualityScore: 30,
    featured: ['active', 'draft', 'archived'].includes(status), createdAt: `2026-10-${10 + index}T12:00:00Z`, images: [],
  })));
  const state = { properties, adminSection: section, adminListingFilters: emptyFilters(), adminListingSort: 'created_desc', lang: 'es', config: { exchangeRate: 20 }, listingDrafts: [
    { key: 'development-autosave', fields: { title: 'Development progress', publicationSection: 'developments' }, savedAt: '2026-10-26T12:00:00Z' },
    { key: 'property-autosave', fields: { title: 'Property progress', publicationSection: 'properties' }, savedAt: '2026-10-26T12:00:00Z' },
  ] };
  const api = runtime(['normalizeSearchText', 'renderListingDraftShelf', 'renderAdminListings'], {
    state, $: id => nodes.get(id), localizedTitle: p => p.titleEs, localizedDescription: p => p.descriptionEs,
    primaryImage: () => '/placeholder.jpg', fallbackImage: '/placeholder.jpg', storedImages: p => p.images,
    escapeHtml: value => String(value ?? ''), t: key => key, displayType: value => value,
    propertyStatusLabel: value => value, formatPriceSummary: () => '', displayLocation: p => p.zone,
    qualityLevelLabel: () => '', truncateText: text => text, canManageListings: () => true,
    refreshIcons() { iconRefreshes.push(nodes.get('#adminListings').innerHTML); },
  });
  const ids = () => [...nodes.get('#adminListings').innerHTML.matchAll(/data-edit-listing="([^"]+)"/g)].map(match => match[1]);
  return { ...api, state, nodes, ids, iconRefreshes };
}

for (const section of ['properties', 'developments']) {
  test(`${section}: share icons are initialized after every inventory render`, () => {
    const api = inventoryRuntime(section);
    for (const status of ['', 'draft', 'active', '']) {
      api.state.adminListingFilters.status = status;
      api.iconRefreshes.length = 0;
      api.renderAdminListings();
      const markup = api.nodes.get('#adminListings').innerHTML;
      assert.equal(api.iconRefreshes.at(-1), markup);
      assert.match(markup, /data-open-pdf-share="property"[^>]+title="Compartir ficha PDF"><i data-lucide="share-2"><\/i>/);
    }
  });

  test(`${section}: general inventory excludes drafts and archives without changing records`, () => {
    const api = inventoryRuntime(section);
    const before = JSON.stringify(api.state.properties);
    api.renderAdminListings();
    assert.deepEqual(api.ids().sort(), ['active', 'pending', 'disabled', 'sold', 'rented'].map(s => `${section}-${s}`).sort());
    assert.equal(JSON.stringify(api.state.properties), before);
    assert.match(api.nodes.get('#adminListingSummary').textContent, /5 en inventario general · 1 borradores · 1 eliminados · 1 destacados/);
    assert.equal(api.nodes.get('#listingDraftShelf').hidden, true);
  });

  test(`${section}: draft view, search, zone, quality and sorting stay scoped to drafts`, () => {
    const api = inventoryRuntime(section);
    Object.assign(api.state.adminListingFilters, { status: 'draft', search: 'draft', zone: 'Draft zone', quality: 'incomplete', missingCover: true });
    api.state.adminListingSort = 'title_asc';
    api.renderAdminListings();
    assert.deepEqual(api.ids(), [`${section}-draft`]);
    assert.equal(api.nodes.get('#listingDraftShelf').hidden, false);
    assert.match(api.nodes.get('#listingDraftList').innerHTML, new RegExp(section === 'developments' ? 'Development progress' : 'Property progress'));
    assert.doesNotMatch(api.nodes.get('#listingDraftList').innerHTML, new RegExp(section === 'developments' ? 'Property progress' : 'Development progress'));
    api.state.adminListingFilters.zone = 'Existing zone';
    api.renderAdminListings();
    assert.deepEqual(api.ids(), []);
  });

  test(`${section}: clearing filters restores general inventory; search alone cannot reveal drafts`, () => {
    const api = inventoryRuntime(section);
    api.state.adminListingFilters.status = 'draft';
    api.renderAdminListings();
    api.state.adminListingFilters = emptyFilters();
    api.renderAdminListings();
    assert.equal(api.nodes.get('#listingDraftShelf').hidden, true);
    assert.ok(!api.ids().includes(`${section}-draft`));
    api.state.adminListingFilters.search = 'draft';
    api.renderAdminListings();
    assert.deepEqual(api.ids(), []);
    api.state.adminListingFilters.status = 'draft';
    api.renderAdminListings();
    assert.deepEqual(api.ids(), [`${section}-draft`]);
  });

  test(`${section}: explicit status filters still work`, () => {
    const api = inventoryRuntime(section);
    for (const status of ['active', 'pending', 'disabled', 'sold', 'rented', 'archived']) {
      api.state.adminListingFilters.status = status;
      api.renderAdminListings();
      assert.deepEqual(api.ids(), [`${section}-${status}`]);
    }
  });
}

test('draft shelf stays hidden in the editor and with no autosaved drafts', () => {
  const api = inventoryRuntime();
  api.state.adminListingFilters.status = 'draft';
  api.state.adminSection = 'new-development';
  api.renderListingDraftShelf();
  assert.equal(api.nodes.get('#listingDraftShelf').hidden, true);
  api.state.adminSection = 'developments';
  api.state.listingDrafts = [];
  api.renderListingDraftShelf();
  assert.equal(api.nodes.get('#listingDraftShelf').hidden, true);
});

test('English summary keeps drafts separate from the general inventory', () => {
  const api = inventoryRuntime();
  api.state.lang = 'en';
  api.renderAdminListings();
  assert.match(api.nodes.get('#adminListingSummary').textContent, /5 in general inventory · 1 drafts/);
});

test('global search and quality shortcuts select the correct section and draft/archive filter', () => {
  const { state } = inventoryRuntime();
  const calls = [];
  const api = runtime(['focusAdminListing'], { state,
    setAdminSection(section) { state.adminSection = section; state.adminListingFilters = emptyFilters(); },
    renderAdminListingFilters() { calls.push('filters'); }, renderAdminListings() { calls.push('list'); },
  });
  for (const section of ['properties', 'developments']) {
    for (const status of ['draft', 'active', 'archived']) {
      api.focusAdminListing(`${section}-${status}`);
      assert.equal(state.adminSection, section);
      assert.equal(state.adminListingFilters.status, status === 'active' ? '' : status);
      assert.equal(state.adminListingFilters.search, `${section}-${status}`);
    }
  }
  assert.equal(calls.length, 12);
  api.focusAdminListing('missing');
  assert.equal(calls.length, 12);
});

test('status filter clearly names general inventory and drafts', () => {
  assert.match(html, /id="adminListingStatusFilter"><option value="" data-i18n="inventoryGeneral">Inventario general<\/option><option value="draft" data-i18n="inventoryDrafts">Borradores<\/option>/);
});
