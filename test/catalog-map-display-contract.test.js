const test = require('node:test');
const assert = require('node:assert/strict');
const { getPageByPath, renderCategoryPage } = require('../seo-pages');

const points = html => JSON.parse(html.match(/data-catalog-map-data>([^<]*)<\/script>/)[1]);

test('property map bounds use the rounded public point without exposing the stored precise coordinates', () => {
  const row = { id:'rounded-unit', titleEs:'Departamento reservado', titleEn:'Private apartment',
    type:'Departamento', operation:'sale', status:'active', isPublic:true, zone:'Puerto Cancún',
    latitude:21.1649, longitude:-86.8149, locationPrecision:'approximate',
    urlEs:'/propiedades/rounded-unit', urlEn:'/en/properties/rounded-unit' };
  const before = JSON.stringify(row);
  for (const path of ['/propiedades','/en/properties']) {
    const render = bounds => points(renderCategoryPage(getPageByPath(path),[row],{bounds,view:'map',location:'puerto-cancun'}));
    const displayed = render('-86.8101,21.1599,-86.8099,21.1601');
    assert.equal(displayed.length,1);
    assert.equal(displayed[0].latitude,21.16);
    assert.equal(displayed[0].longitude,-86.81);
    assert.equal(displayed[0].locationPrecision,'approximate');
    assert.doesNotMatch(JSON.stringify(displayed),/21\.1649|-86\.8149/);
    assert.equal(render('-86.8150,21.1648,-86.8148,21.1650').length,0);
  }
  assert.equal(JSON.stringify(row),before);
});

test('presale map bounds inherit the linked verified development and keep contextual inquiry and map return filters', () => {
  const verified = require('../verified-development-location-data').find(row => row.title === 'Riva Puerto Cancún');
  const development = { id:verified.id, type:'Desarrollo', publicationSection:'developments',
    titleEs:verified.title, titleEn:verified.title, status:'active', isPublic:true, zone:'Puerto Cancún',
    locationPrecision:'approximate', latitude:null, longitude:null,
    urlEs:'/propiedades/riva', urlEn:'/en/properties/riva' };
  const areas = [{id:'puerto-cancun',nameEs:'Puerto Cancún',nameEn:'Puerto Cancun',subareas:[]},
    {id:'zona-hotelera',nameEs:'Zona Hotelera',nameEn:'Hotel Zone',subareas:[]}];
  const project = {id:'presale-riva-fixture',nameEs:'Proyecto Riva',nameEn:'Riva Project',status:'confirmed',
    developmentId:development.id,areaId:'puerto-cancun',reference:'TEST-RIVA',propertyIds:[]};
  const bounds = [verified.longitude-.001,verified.latitude-.001,verified.longitude+.001,verified.latitude+.001].join(',');
  for (const [path,lang] of [['/preventas-cancun','es'],['/en/cancun-presales','en']]) {
    const page = {...getPageByPath(path),catalogAreas:areas,portalDirectory:{areas,presales:[project],featured:[]}};
    const render = (row=development,query={}) => points(renderCategoryPage(page,[row],{bounds,view:'map',location:'puerto-cancun',...query}));
    const mapped = render();
    assert.equal(mapped.length,1);
    assert.equal(mapped[0].kind,'presale');
    assert.equal(mapped[0].latitude,verified.latitude);
    assert.equal(mapped[0].longitude,verified.longitude);
    const inquiry = new URL(mapped[0].contactUrl,'https://example.test');
    assert.equal(inquiry.pathname,lang === 'en' ? '/en/contact' : '/contacto');
    assert.equal(inquiry.searchParams.get('developmentId'),development.id);
    assert.equal(inquiry.searchParams.get('reference'),'TEST-RIVA');
    assert.equal(inquiry.searchParams.get('project'),lang === 'en' ? 'Riva Project' : 'Proyecto Riva');
    assert.equal(inquiry.searchParams.get('origin'),'presale-map');
    const source = new URL(inquiry.searchParams.get('sourcePath'),'https://example.test');
    assert.equal(source.pathname,path);
    assert.equal(source.searchParams.get('view'),'map');
    assert.equal(source.searchParams.get('bounds'),bounds);
    assert.equal(source.searchParams.get('location'),'puerto-cancun');
    for (const patch of [{locationPrecision:'hidden'},{location_precision:'hidden'},{portalHiddenBlocks:['location']}]) {
      assert.equal(render({...development,...patch}).length,0);
    }
    assert.equal(render(development,{location:'zona-hotelera'}).length,0);
  }
});

test('public API queries, map suggestions and saved searches agree on verified locations without changing inventory', async () => {
  const { queryPublicInventory, createPublicLocationResolver } = require('../public-inventory-query');
  const inventory = require('../inventory-contract');
  const { enrichCommercialInquiry, matchingListings } = require('../commercial-workflow');
  const { analyzeDemand } = require('../demand-analysis');
  const { savedCatalogQuery } = require('../saved-catalog-search');
  const verified = require('../verified-development-location-data').find(row => row.title === 'Riva Puerto Cancún');
  const development = { id:verified.id, type:'Desarrollo', publicationSection:'developments',
    titleEs:verified.title, titleEn:verified.title, status:'active', isPublic:true, zone:'Puerto Cancún',
    locationPrecision:'approximate', latitude:null, longitude:null,
    urlEs:'/propiedades/riva', urlEn:'/en/properties/riva' };
  const bounds = [verified.longitude-.001,verified.latitude-.001,verified.longitude+.001,verified.latitude+.001].join(',');
  const filters = {entity:'developments',q:'Riva',location:'puerto-cancun',bounds};
  for (const patch of [{},{locationPrecision:'hidden'},{location_precision:'hidden'},{portalHiddenBlocks:['location']},{isPublic:false}]) {
    const row = {...development,...patch}, rows = [row], before = JSON.stringify(rows);
    const expected = Object.keys(patch).length ? [] : [row.id];
    const html = renderCategoryPage(getPageByPath('/propiedades'),rows,filters);
    const api = queryPublicInventory(rows,filters);
    assert.deepEqual(api.all.map(item=>item.id),expected);
    assert.deepEqual(points(html).map(item=>item.id),expected);
    assert.equal(/class="catalog-suggestions"/.test(html),expected.length === 1);
    const criteria = savedCatalogQuery(filters,{properties:rows});
    const data = await enrichCommercialInquiry({service:'search-watch',searchFilters:filters}, {intent:'buy',lang:'es'}, rows, {});
    assert.deepEqual(data.searchWatch.knownPropertyIds,expected);
    assert.deepEqual(matchingListings({payload:data},rows).matches.map(item=>item.id),expected);
    assert.equal(analyzeDemand([{id:'watch',filters}],rows).matched,expected.length);
    const publicLocationFor = createPublicLocationResolver(rows);
    assert.equal(inventory.matches(row,criteria,{publicLocationFor}),expected.length === 1);
    assert.equal(JSON.stringify(rows),before);
    assert.equal(api.items[0]?.latitude ?? null,null);
  }
});
