"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const inventory = require("../inventory-contract");
const { savedCatalogQuery } = require("../saved-catalog-search");
const { interpretCatalogSearch } = require("../catalog-search");
const { renderCatalog } = require("../catalog-view");
const seo = require("../seo-pages");
const { publicExchangeFixture } = require("./helpers/public-exchange-fixture");
const property = overrides => ({
  id: "monthly", slug: "monthly", titleEs: "Casa Marina", titleEn: "Marina Home", type: "Casa",
  operation: "rent", price: 25000, currency: "MXN", priceUnit: "total", status: "active", isPublic: true,
  zone: "Puerto Cancún", catalogData: { rentPeriod: "month" }, area: 120, lot: 250, beds: 3, baths: 2.5, parking: 2,
  urlEs: "/propiedades/monthly", urlEn: "/en/properties/monthly", ...overrides,
});

test("dimensions filter independently without substituting lot for construction or unknown values", () => {
  const rows = [property(), property({ id:"reversed", area:250, lot:120 }), property({id:"missing", area:null}), property({id:"few-baths", baths:1}), property({id:"no-parking", parking:0})];
  const raw = { minBuilt:100, maxBuilt:150, minLot:200, maxLot:300, baths:2.5, parking:2 };
  const parsed = inventory.parseQuery(raw);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(inventory.queryInventory(rows, parsed.query).all.map(row => row.id), ["monthly"]);
  assert.deepEqual(inventory.parseQuery(inventory.toSearchParams(parsed.query)), parsed);
  for (const invalid of [{minBuilt:200,maxBuilt:100},{minLot:300,maxLot:200},{baths:-1},{parking:"x"},{minBuilt:"Infinity"}]) {
    assert.ok(inventory.queryInventory(rows, invalid).errors.length);
    assert.equal(inventory.queryInventory(rows, invalid).total, 0);
  }
});

test("saved searches preserve custom zones, subzones, gated access and dimensions through matching", () => {
  const areas = [{id:"custom-zone",nameEs:"Zona nueva",nameEn:"New zone",subareas:[{id:"north",nameEs:"Norte",nameEn:"North"}]}];
  const filters = {locations:["custom-zone"],subarea:"north",gated:true,minBuilt:100,maxBuilt:140,minLot:200,maxLot:300,baths:2,parking:1};
  const saved = savedCatalogQuery(filters,{areas});
  assert.deepEqual(saved.errors,[]);
  assert.equal(saved.subarea,"north"); assert.equal(saved.gated,true);
  const match = property({portalAreaId:"custom-zone",portalSubareaId:"north",portalGated:true});
  const rows = [match, {...match,id:"south",portalSubareaId:"south"}, {...match,id:"open",portalGated:false}, {...match,id:"large",area:150}];
  assert.deepEqual(inventory.queryInventory(rows,saved,{areas}).all.map(row=>row.id),["monthly"]);
  const changed = savedCatalogQuery({...filters,queryText:"All zones"},{areas,lang:"en"});
  assert.ok(changed.errors.length, "saved intent may not silently broaden location or subzone");
});

test("bathroom and parking search uses recorded minimum counts while exact/max requests need clarification", () => {
  for (const query of ["Casa con 2 baños y 2 estacionamientos", "House with two bathrooms and two parking spaces"]) {
    const result = interpretCatalogSearch(query);
    assert.equal(result.clarificationRequired,false);
    assert.equal(result.filters.baths,2); assert.equal(result.filters.parking,2);
    assert.deepEqual(inventory.queryInventory([property(),property({id:"one",baths:1})],result.filters).all.map(row=>row.id),["monthly"]);
  }
  const saved = savedCatalogQuery({queryText:"Buy house with 3 bathrooms under 700000 USD"});
  assert.deepEqual(saved.errors,[]); assert.equal(saved.baths,3); assert.equal(saved.max,700000);
  for (const query of ["House with exactly 2 bathrooms", "Casa con máximo 2 estacionamientos"]) assert.equal(interpretCatalogSearch(query).clarificationRequired,true);
});

test("a rental period implies rental but cannot be applied to a sale, and sold/rented records stay excluded", () => {
  assert.equal(inventory.parseQuery({rentPeriod:"month"}).query.operation,"rent");
  assert.ok(inventory.parseQuery({operation:"sale",rentPeriod:"month"}).errors.length);
  const rows = [property(),property({id:"daily",catalogData:{rentPeriod:"day"}}),property({id:"sold",status:"sold"}),property({id:"rented",status:"rented"})];
  assert.deepEqual(inventory.queryInventory(rows,{rentPeriod:"month",currency:"MXN",max:30000}).all.map(row=>row.id),["monthly"]);
});

test("suggestions cannot offer a different transaction, budget, type or availability as a match", () => {
  const rows = [property(), property({id:"expensive",price:50000}),property({id:"sale",operation:"sale"}),property({id:"sold",status:"sold"}),property({id:"condo",type:"Departamento"})]
    .map(row=>({...row,urlEs:"/propiedades/"+row.id}));
  const html = renderCatalog({lang:"es",category:{}},rows,{q:"Marina",type:"Casa",operation:"rent",rentPeriod:"month",currency:"MXN",max:30000},()=>"cards");
  const suggestions = html.match(/<nav class="catalog-suggestions"[^]*?<\/nav>/)?.[0];
  assert.ok(suggestions); assert.match(suggestions,/href="\/propiedades\/monthly"/);
  assert.doesNotMatch(suggestions,/href="\/propiedades\/(expensive|sale|sold|condo)"/);
});

test("project search cannot erase explicit unit constraints", () => {
  const html = renderCatalog({lang:"en",category:{}},[{id:"dev",type:"Desarrollo",titleEs:"Marina"}],{entity:"developments",max:100000,currency:"USD",operation:"sale"},()=>"must-not-render");
  assert.match(html,/Your requirements have not been ignored/);
  assert.doesNotMatch(html,/must-not-render/);
  assert.match(html,/max=100000/);
});

test("zero matches offer saved intent with all filters and no alert delivery promise", () => {
  const html = renderCatalog({lang:"en",category:{}},[],{operation:"rent",rentPeriod:"month",currency:"MXN",max:30000,subarea:"north",minBuilt:100},()=>"");
  assert.match(html,/data-save-search/); assert.match(html,/Save search and check alerts/);
  assert.match(html,/data-search-filters="[^"\n]*&quot;subarea&quot;:&quot;north&quot;/);
  assert.match(html,/&quot;minBuilt&quot;:100/);
  assert.doesNotMatch(renderCatalog({lang:"en",category:{}},[],{max:"invalid"},()=>""),/data-save-search/);
});

test("cards and details show the same converted USD rent and label both surface concepts", () => {
  const row = property();
  const exchangeRate = publicExchangeFixture();
  const original = JSON.stringify(row);
  const page = { ...seo.getPageByPath("/propiedades"), currencyExchange: exchangeRate };
  const cards = seo.renderCategoryPage(page,[row],{});
  const detail = seo.renderPropertyPage(row,"es",[],{},[],exchangeRate).html;
  for (const html of [cards,detail]) {
    assert.match(html,/≈ USD \$1,250 \/ mes · TC /);
    assert.match(html,/120 m² construcción/); assert.match(html,/250 m² terreno/);
  }
  assert.equal(JSON.stringify(row),original);
  assert.match(seo.renderPropertyHead(property({status:"sold"}),undefined,"es",exchangeRate).jsonLd, /https:\/\/schema.org\/OutOfStock/);
});

test("inquiry links preserve rental criteria as structured context instead of a technical preferences paragraph", () => {
  const html = seo.renderCategoryPage(seo.getPageByPath("/en/properties"),[property()],{operation:"rent",rentPeriod:"month",currency:"MXN",max:30000,minBuilt:100,baths:2,parking:1});
  const contexts = [...html.matchAll(/data-search-filters="([^"]+)"/g)].map(match=>JSON.parse(match[1].replaceAll("&quot;",'"').replaceAll("&amp;","&")));
  assert.ok(contexts.length >= 2);
  for (const context of contexts) {
    assert.equal(context.operation,"rent"); assert.equal(context.rentPeriod,"month");
    assert.equal(context.minBuilt,100); assert.equal(context.baths,2); assert.equal(context.parking,1);
    assert.equal(context.max,30000); assert.equal(context.currency,"MXN");
  }
  assert.doesNotMatch(html,/data-preferences=/);
});

test("gated properties and switched land filters are not silently relaxed", () => {
  const rows = [property({portalGated:true}),property({id:"open",portalGated:false})];
  const html = renderCatalog({lang:"es",category:{}},rows,{gated:"1"},items=>items.map(row=>row.id).join(","));
  assert.match(html,/name="gated" value="1" checked/);
  assert.match(html,/data-catalog-list>monthly</);
  const land = renderCatalog({lang:"es",category:{}},rows,{type:"Terreno",beds:2},()=>"");
  assert.match(land,/name="beds"[^>]*value="2"/);
});
