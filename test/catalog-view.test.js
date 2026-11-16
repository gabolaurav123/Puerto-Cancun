const test = require('node:test');
const assert = require('node:assert/strict');
const { renderCatalog } = require('../catalog-view');
const page = { lang: 'es', category: {} };

test('the main Featured link shows the two properties and three developments once, including on its map and after filtering', () => {
  const {getPageByPath, renderCategoryPage} = require('../seo-pages');
  const directory = require('../portal-directory');
  const rows = ['Casa','Desarrollo','Departamento','Desarrollo','Desarrollo','Casa'].map((type,index) => ({
    id:'item-'+index, slug:'item-'+index, type, titleEs:'Ficha '+index, titleEn:'Listing '+index, zone:'Puerto Cancún',
    featured:index !== 5, status:'active', isPublic:true, catalogData:{homeOrder:index},
    urlEs:'/propiedades/item-'+index, urlEn:'/en/properties/item-'+index
  }));
  rows.push({...rows[0], id:'private', isPublic:false});
  const portalDirectory = directory.publicDirectory(null,rows);
  const ids = html => [...html.matchAll(/data-category-property="([^"]+)"/g)].map(match=>match[1]);
  for (const [path,count] of [['/propiedades/destacadas-cancun','5 resultados destacados'],['/en/properties/featured-cancun','5 featured results']]) {
    const page = {...getPageByPath(path),portalDirectory};
    const html = renderCategoryPage(page,rows,{});
    assert.ok(html.includes(count));
    assert.deepEqual(ids(html),rows.slice(0,5).map(row=>row.id));
    assert.deepEqual(JSON.parse(html.match(/data-catalog-map-data>([^<]+)</)[1]).map(row=>row.id),ids(html));
    assert.deepEqual(ids(renderCategoryPage(page,rows,{entity:'developments'})),['item-1','item-3','item-4']);
    assert.deepEqual(ids(renderCategoryPage(page,rows,{entity:'properties'})),['item-0','item-2']);
    assert.deepEqual(ids(renderCategoryPage(page,rows,{location:'puerto-cancun',q:'Listing 2'})),['item-2']);
    assert.ok(html.includes('action="'+path+'"'));
  }
});

test('Featured includes public curated zones and presales in editorial order and respects placements in other pages', () => {
  const {getPageByPath,renderCategoryPage} = require('../seo-pages');
  const directory = require('../portal-directory');
  const rows = [{id:'unit',slug:'unit',type:'Casa',titleEs:'Unidad',zone:'Puerto Cancún'},{id:'dev',slug:'dev',type:'Desarrollo',titleEs:'Proyecto',zone:'Puerto Cancún',catalogData:{salesModality:'presale'}}];
  const config=directory.materialize(null,rows);
  config.featured=[
    {id:'z',kind:'area',targetId:'puerto-cancun',placement:'home',active:true},
    {id:'p',kind:'presale',targetId:'presale-dev',placement:'home',active:true},
    {id:'d',kind:'development',targetId:'dev',placement:'area',contextId:'puerto-cancun',active:true},
    {id:'u',kind:'property',targetId:'unit',placement:'home',active:false}
  ];
  const page={...getPageByPath('/en/properties/featured-cancun'),portalDirectory:directory.publicDirectory(config,rows)};
  const html=renderCategoryPage(page,rows,{});
  assert.deepEqual([...html.matchAll(/data-category-property="([^"]+)"/g)].map(match=>match[1]),['area:puerto-cancun','presale:presale-dev']);
  assert.ok(html.includes('/en/cancun-presales?project=presale-dev'));
  assert.match(html,/href="\/en\/properties\?location=puerto-cancun&amp;entity=properties"/);
});

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
  for (const [lang, label, city] of [['es', 'Zonas', 'Ciudad de Cancún'], ['en', 'Zones', 'Cancun City']]) {
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
  assert.match(dev,/Gated community/); assert.match(dev,/View development/);
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

test('the map includes all filtered pages and withholds hidden coordinates; project CTA preserves confirmed context', () => {
  const { getPageByPath, renderCategoryPage } = require('../seo-pages');
  const areas = [{id:'puerto-cancun',nameEs:'Puerto Cancún',nameEn:'Puerto Cancun',subareas:[]}];
  const rows = Array.from({ length: 30 }, (_,i) => ({ id:'record-'+i, status:'active', isPublic:true,type:'Casa',titleEs:'Casa '+i,zone:'Puerto Cancún',
    latitude:21.16123,longitude:-86.81123,locationPrecision:'exact',portalHiddenBlocks:['location'], urlEs:'/propiedades/record-'+i }));
  const catalog = renderCategoryPage({...getPageByPath('/propiedades'),catalogAreas:areas},rows,{page:'2'});
  const map = JSON.parse(catalog.match(/data-catalog-map-data>([^<]*)<\/script>/)[1]);
  const cardIds = [...catalog.matchAll(/data-category-property="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(cardIds.length,6); assert.ok(cardIds.every(id => map.some(point=>point.id===id)));
  assert.equal(map.length,30); assert.ok(map.every(p=>p.locationPrecision === 'hidden' && !('latitude' in p)));
  const contact = new URL(map[0].contactUrl,'https://www.puertocancun.center');
  assert.equal(contact.pathname,'/contacto'); assert.equal(contact.searchParams.get('propertyId'),map[0].id);
  assert.equal(contact.searchParams.get('sourcePath'),'/propiedades?page=2');
  const project = {id:'confirmed',nameEs:'Proyecto Coral',nameEn:'Coral Project',areaId:'puerto-cancun',propertyIds:['record-1'],reference:'P-42',status:'confirmed'};
  const page = {...getPageByPath('/en/cancun-presales'),catalogAreas:areas,portalDirectory:{areas,presales:[project,{...project,id:'draft',status:'draft'}],featured:[]}};
  const results = renderCategoryPage(page,rows,{});
  assert.match(results,/href="\/en\/cancun-presales\?project=confirmed"/); assert.doesNotMatch(results,/project=draft|data-category-property="record-/);
  const detail = renderCategoryPage(page,rows,{project:'confirmed'});
  assert.match(detail,/data-project="Coral Project"/); assert.match(detail,/data-reference="P-42"/); assert.match(detail,/data-zone="Puerto Cancun"/);
  assert.match(detail,/<h1>Coral Project<\/h1>/);
  assert.match(detail,/Back to presales/);
  assert.doesNotMatch(detail,/data-catalog-root|id="catalogFilters"|id="categoryInventoryCount"|data-catalog-view=/);
});

test('map scope intersects entity, zone and property type before pagination', () => {
  const {getPageByPath,renderCategoryPage} = require('../seo-pages');
  const rows = ['Casa','Terreno','Desarrollo'].flatMap(type => Array.from({length:28},(_,i)=>({id:type+'-'+i,type,titleEs:type+' '+i,zone:i===27?'Zona Hotelera':'Puerto Cancún',status:'active',isPublic:true,urlEs:'/propiedades/'+type+'-'+i,latitude:21.17,longitude:-86.81,locationPrecision:'exact'})));
  for (const [type,entity] of [['Casa','properties'],['Terreno','properties'],['Desarrollo','developments']]) {
    const query = {entity,location:'puerto-cancun',page:'2',...(entity==='properties'?{type}:{})};
    const html = renderCategoryPage(getPageByPath('/propiedades'),rows,query);
    const points = JSON.parse(html.match(/data-catalog-map-data>([^<]*)<\/script>/)[1]);
    assert.equal(points.length,27); assert.ok(points.every(point=>point.id.startsWith(type+'-') && !point.id.endsWith('-27')));
    assert.equal([...html.matchAll(/data-category-property=/g)].length,3);
    assert.ok(points.every(point=>new URL(point.contactUrl,'https://example.test').searchParams.get('zone')==='Puerto Cancún'));
  }
});

test('Hotel Zone retains the property type filter even for uniform inventory', () => {
  const rows = [{id:'a',type:'Departamento',zone:'Zona Hotelera',titleEs:'A'}];
  const render = (items,query={}) => renderCatalog(page,items,{location:'zona-hotelera',...query},()=> 'cards');
  assert.match(render(rows),/<select name="type"/);
  assert.match(render([...rows,{id:'b',type:'Casa',zone:'Zona Hotelera',titleEs:'B'}]),/<select name="type"/);
  assert.match(render(rows,{type:'Casa'}),/<select name="type"/);
});

test('an empty community inventory offers contextual help while presales remain buy-only', () => {
  const development = {id:'empty-project',type:'Desarrollo',titleEs:'Residencial Coral',zone:'Puerto Cancún',status:'active',catalogData:{salesModality:'resale'}};
  const html = renderCatalog(page,[development],{development:development.id},()=> '');
  assert.match(html,/Encontrar vivienda aquí/); assert.match(html,/Quiero vender aquí/);
  assert.match(html,/data-development-id="empty-project"/); assert.match(html,/data-intent="sell"/);
  const presale = {...development,catalogData:{salesModality:'presale'}};
  const presaleHtml = renderCatalog(page,[presale],{development:presale.id},()=> '');
  assert.match(presaleHtml,/Encontrar vivienda aquí/); assert.doesNotMatch(presaleHtml,/data-intent="(?:sell|let|rent)"/);
});

test('presale directory maps resolve the linked verified community and still respect hidden locations', () => {
  const {getPageByPath,renderCategoryPage} = require('../seo-pages');
  const portal = require('../portal-directory');
  const {projectRecords} = require('../catalog-directory');
  const source = {id:'prop-xlsx-3d0d5ff2d8b69246286aaa67',titleEs:'Mondrian Residences at Grand Island Cancún',titleEn:'Mondrian Residences at Grand Island Cancún',type:'Desarrollo',publicationSection:'developments',status:'active',isPublic:true,zone:'Zona Hotelera',city:'Cancún',catalogData:{salesModality:'presale'},images:[],latitude:null,longitude:null,locationPrecision:'approximate'};
  for (const lang of ['es','en']) {
    for (const hidden of [false,true]) {
      const row = {...source,...(hidden ? {locationPrecision:'hidden',portalHiddenBlocks:['location']} : {})};
      const directory = portal.publicDirectory(null,[row]);
      const enriched = portal.enrichProperties([row],directory);
      const records = projectRecords(directory,enriched);
      assert.equal(records.length,1);
      const page = {...getPageByPath(lang === 'en' ? '/en/cancun-presales' : '/preventas-cancun'),portalDirectory:directory};
      const html = renderCategoryPage(page,enriched,{});
      const points = JSON.parse(html.match(/data-catalog-map-data>([^<]*)<\/script>/)[1]);
      assert.equal(points.length,1);
      assert.equal(points[0].kind,'presale');
      const contact = new URL(points[0].contactUrl,'https://example.test');
      assert.equal(contact.searchParams.get('developmentId'),source.id);
      assert.equal(contact.searchParams.get('intent'),'buy');
      if (hidden) {
        assert.equal(points[0].locationPrecision,'hidden');
        assert.equal(points[0].latitude,undefined);
        assert.equal(points[0].longitude,undefined);
        assert.equal(points[0].locationScope,undefined);
        assert.equal(points[0].evidenceLabel,undefined);
        assert.equal(records[0].latitude,null);
      } else {
        assert.equal(points[0].locationPrecision,'exact');
        assert.equal(points[0].locationScope,'complex');
        assert.equal(points[0].evidenceLabel,lang === 'en' ? 'Verified complex location' : 'Ubicación verificada del conjunto');
        assert.equal(points[0].latitude,21.0653125);
        assert.equal(points[0].longitude,-86.7831875);
        assert.equal(records[0].latitude,21.0653125);
        assert.equal(records[0].longitude,-86.7831875);
      }
    }
  }
});
