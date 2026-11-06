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

test('retained options are escaped and the catalog omits legacy comparison controls', () => {
  const html = renderCatalog(page, [], { zone: '<script>', compare: 'a,b', beds: '3' }, () => '');
  assert.ok(!html.includes('<script>'));
  assert.match(html, /value="&lt;script&gt;" selected/);
  assert.doesNotMatch(html, /name="compare"|data-start-comparison|data-compare-id/);
  const links = [...html.matchAll(/class="catalog-chip"/g)];
  assert.equal(links.length, 2);
  const chipLinks = [...html.matchAll(/href="([^"]*)" class="catalog-chip"/g)];
  assert.ok(chipLinks.every(([, href]) => !href.includes('compare=')));
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

test('legacy Playa Mujeres category keeps its corridor instead of widening to the whole area', () => {
  const { categoryDefaults } = require('../catalog-view');
  const defaults = categoryDefaults({zone:'Punta Sam / Playa Mujeres'});
  assert.equal(defaults.location,'fuera-de-cancun');
  assert.equal(defaults.zone,'Punta Sam / Playa Mujeres');
  const rows = [{id:'coast',zone:'Punta Sam / Playa Mujeres'}, {id:'tulum',zone:'Tulum'}, {id:'hotel',zone:'Zona Hotelera'}];
  assert.deepEqual(require('../inventory-contract').queryInventory(rows,{}, {defaults}).all.map(row=>row.id),['coast']);
});

test('compact search submits the complete filter form and presents localized locations', () => {
  for (const [lang, label, city] of [['es', 'Zonas', 'Ciudad de Cancún'], ['en', 'Areas', 'Cancun City']]) {
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
    const links = [...pagination.matchAll(/<a href="([^"]+)"/g)];
    assert.equal(links.length, 7);
    for (const [, href] of links) {
      const params = new URL(href.replace(/&amp;/g, '&'), 'https://example.test').searchParams;
      assert.equal(params.get('currency'), 'USD');
      assert.equal(params.get('location'), 'puerto-cancun');
      assert.equal(params.has('compare'), false);
    }
    assert.match(pagination, /page=1(?:&amp;|\")/);
    assert.match(pagination, /page=100(?:&amp;|\")/);
    assert.match(pagination, /aria-current="page"/);
    assert.ok(pagination.includes(lang === 'en' ? 'Previous page' : 'Página anterior'));
  }
});

test('a new area scopes both entities, dependent selectors and counts; land has an independent path', () => {
  const { renderCategoryPage, getPageByPath } = require('../seo-pages');
  const areas = [
    { id:'coral',nameEs:'Costa Coral',nameEn:'Coral Coast',subareas:[{id:'north',nameEs:'Corredor norte',nameEn:'North corridor'}] },
    { id:'playa',nameEs:'Playa',nameEn:'Beach',subareas:[] },
  ];
  const make = (id, area, type, data = {}) => ({
    id,isPublic:true,status:'active',type,publicationSection:type === 'Desarrollo' ? 'developments' : 'properties',
    titleEs:id,titleEn:id,portalAreaId:area,zone:'',urlEs:'/propiedades/' + id,urlEn:'/en/properties/' + id,...data,
  });
  const rows = [
    make('project-a','coral','Desarrollo',{portalGated:true}), make('project-b','playa','Desarrollo'),
    make('independent-land','coral','Terreno',{lot:250,portalSubareaId:'north'}),
    make('large-land','coral','Terreno',{lot:900}),make('small-unit','coral','Casa',{portalDevelopmentId:'project-a'}),
  ];
  const page = {...getPageByPath('/en/properties'),catalogAreas:areas};
  const html = renderCategoryPage(page,rows,{location:'coral'});
  assert.match(html,/Properties \(3\)/); assert.match(html,/Developments \(1\)/);
  assert.match(html,/option value="project-a"/); assert.doesNotMatch(html,/option value="project-b"/);
  const dev = renderCategoryPage(page,rows,{entity:'developments',location:'coral',gated:'1'});
  assert.match(dev,/data-category-property="project-a"/); assert.doesNotMatch(dev,/data-category-property="project-b"|name="beds"|name="min"|name="currency"|data-compare-id/);
  assert.match(dev,/Gated community/); assert.match(dev,/Explore development/);
  const land = renderCategoryPage({...getPageByPath('/en/properties/land-cancun'),catalogAreas:areas},rows,{type:'Casa',entity:'developments',sort:'lot-desc'});
  const ids = [...land.matchAll(/data-category-property="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids,['large-land','independent-land']); assert.match(land,/I want to buy land/); assert.match(land,/I want to sell land/);
  assert.match(land,/data-property-type="Terreno"/); assert.match(land,/250 m²/);
  const subarea = renderCategoryPage(page,rows,{subarea:'north'});
  assert.match(subarea,/data-category-property="independent-land"/); assert.doesNotMatch(subarea,/data-category-property="small-unit"/);
  const grouped = renderCategoryPage(page,rows,{entity:'developments'});
  assert.ok(grouped.indexOf('>Coral Coast</a></h2>') < grouped.indexOf('>Beach</a></h2>'));
  const suggestions = renderCategoryPage(page,rows,{q:'project'});
  assert.match(suggestions,/<strong>Development<\/strong>/); assert.match(suggestions,/href="\/en\/properties\/project-a"/);
});

test('map pages use exactly the listed IDs and withhold hidden coordinates; project CTA preserves confirmed context', () => {
  const { getPageByPath, renderCategoryPage } = require('../seo-pages');
  const areas = [{id:'puerto-cancun',nameEs:'Puerto Cancún',nameEn:'Puerto Cancun',subareas:[]}];
  const rows = Array.from({ length: 30 }, (_,i) => ({ id:'record-'+i, status:'active', isPublic:true,type:'Casa',titleEs:'Casa '+i,zone:'Puerto Cancún',
    latitude:21.16123,longitude:-86.81123,locationPrecision:'exact',portalHiddenBlocks:['location'], urlEs:'/propiedades/record-'+i }));
  const catalog = renderCategoryPage({...getPageByPath('/propiedades'),catalogAreas:areas},rows,{page:'2'});
  const map = JSON.parse(catalog.match(/data-catalog-map-data>([^<]*)<\/script>/)[1]);
  assert.deepEqual(map.map(p=>p.id),[...catalog.matchAll(/data-category-property="([^"]+)"/g)].map(match=>match[1]));
  assert.equal(map.length,6); assert.ok(map.every(p=>p.locationPrecision === 'hidden' && !('latitude' in p)));
  const project = {id:'confirmed',nameEs:'Proyecto Coral',nameEn:'Coral Project',areaId:'puerto-cancun',propertyIds:['record-1'],reference:'P-42',status:'confirmed'};
  const page = {...getPageByPath('/en/cancun-presales'),catalogAreas:areas,portalDirectory:{areas,presales:[project,{...project,id:'draft',status:'draft'}],featured:[]}};
  const results = renderCategoryPage(page,rows,{});
  assert.match(results,/href="\/en\/cancun-presales\?project=confirmed"/); assert.doesNotMatch(results,/project=draft|data-category-property="record-/);
  const detail = renderCategoryPage(page,rows,{project:'confirmed'});
  assert.match(detail,/data-project="Coral Project"/); assert.match(detail,/data-reference="P-42"/); assert.match(detail,/data-zone="Puerto Cancun"/);
});
