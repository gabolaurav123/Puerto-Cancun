const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {propertyPdfPrice}=require("../pdf-property-sheet");
const {createPublicPdfCache}=require("../public-pdf-cache");
const {renderExternalPropertyShareHtml,externalPropertyWhatsappText}=require("../external-property-utils");
const now=Date.parse("2026-11-15T15:00:00Z");
const rate={status:"available",base:"USD",quote:"MXN",rate:20,date:"2026-11-13",checkedAt:"2026-11-15T14:00:00Z",source:{provider:"BANXICO"}};

test("PDF USD conversion preserves original data, m² and rental period and marks a real dated conversion",()=>{
  const row={currency:"MXN",price:4200,priceUnit:"sqm",operation:"rent",catalogData:{rentPeriod:"month"}},before=JSON.stringify(row);
  const model=propertyPdfPrice(row,{exchangeRate:rate,now});
  assert.equal(model.text,"Aprox. USD $210 / m² / mes");assert.match(model.note,/13 nov 2026/);
  assert.equal(JSON.stringify(row),before);
  assert.equal(propertyPdfPrice(row,{priceMode:"original"}).text,"MXN $4,200 / m² / mes");
  assert.equal(propertyPdfPrice({...row,currency:"USD"},{now}).text,"USD $4,200 / m² / mes");
  assert.equal(propertyPdfPrice({...row,currency:"USD"},{now}).note,"");
});

test("PDF never invents a conversion without a usable source or when the quote is stale beyond policy",()=>{
  const row={currency:"MXN",price:20000000,priceUnit:"total",operation:"sale"};
  for(const exchangeRate of [null,{...rate,rate:0},{...rate,date:"2025-01-01"}]){
    const model=propertyPdfPrice(row,{exchangeRate,now});
    assert.equal(model.text,"Precio en USD por confirmar");assert.equal(model.note,"");
  }
  assert.equal(propertyPdfPrice({...row,catalogData:{priceOnRequest:true}},{exchangeRate:rate,now}).text,"Precio a consultar");
});

test("public PDF cache deduplicates work and invalidates by rate, revision and expiry without growing unbounded",async()=>{
  let clock=0,calls=0;const cache=createPublicPdfCache({maxEntries:2,maxBytes:12,ttlMs:100,now:()=>clock});
  const draw=async()=>{calls++;return Buffer.from("123456");};
  await Promise.all([cache.get({id:1,rate:20},draw),cache.get({id:1,rate:20},draw)]);assert.equal(calls,1);
  await cache.get({id:1,rate:21},draw);assert.equal(calls,2);
  await cache.get({id:2,rate:21},draw);assert.deepEqual(cache.stats(),{entries:2,bytes:12});
  clock=101;await cache.get({id:2,rate:21},draw);assert.equal(calls,4);
  await assert.rejects(cache.get({id:3},async()=>{throw new Error("retry");}),/retry/);
  await cache.get({id:3},draw);assert.equal(calls,5);
});

test("legacy public PDF is regenerated from the current listing while its stored original remains untouched",async()=>{
  const source=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
  const start=source.indexOf("async function renderCurrentSharedPropertyPdf(");
  const end=source.indexOf("\nfunction requireRole",start);
  const original={id:"p",updated_at:"one",price:20000000,currency:"MXN",priceUnit:"total",titleEs:"Casa",operation:"sale",locationPrecision:"approximate",portalHiddenBlocks:[],urlEs:"/propiedades/casa"};
  const stored={id:"old-pdf",property_id:"p",options:{brandMode:"neutral",priceMode:"original",showAddress:true},content_base64:Buffer.from("OLD MXN PDF").toString("base64")},before=JSON.stringify(stored);
  let calls=0;const queries=[],draws=[];
  const ctx={require:id=>require(path.join(__dirname,"..",id)),Date,path,Set,__dirname:path.join(__dirname,".."),siteUrl:"https://example.com",PROPERTY_SUMMARY_COLUMNS:"p.id, p.price_amount",withPropertyMediaPlaceholders:r=>r,
    query:async(sql)=>{queries.push(sql);return{rows:[original]};},getPublicProperties:async()=>[original],toProperty:r=>r,
    exchangeRateService:{getSnapshot:()=>rate},readContactRouting:async()=>({}),businessPhoneLabel:()=>"",absoluteUrl:(url,base)=>base+url,
    publicPropertyPdfCache:createPublicPdfCache(),preparePropertyPdfImages:async()=>{calls++;return[];},mergeLegacyImages:()=>[],
    pdfBuffer:async draw=>{draw({});return Buffer.from("NEW PUBLIC PDF");},drawPropertyPdf:(_doc,args)=>draws.push(args)};
  const render=vm.runInNewContext(`(${source.slice(start,end)})`,ctx);
  assert.equal((await render(stored)).toString(),"NEW PUBLIC PDF");await render(stored);
  assert.equal(calls,1);assert.equal(draws[0].options.priceMode,"public-usd");assert.equal(draws[0].options.showAddress,false);
  assert.equal(JSON.stringify(stored),before);assert.equal(original.currency,"MXN");
  assert.ok(queries.every(sql=>/^SELECT\b/.test(sql)));assert.ok(!queries.some(sql=>/generated_documents/.test(sql)));
  original.updated_at="two";await render(stored);assert.equal(calls,2);
});

test("Spanish external shares preserve the original currency and retain contact visibility rules",()=>{
  const source=fs.readFileSync(path.join(__dirname,"../external-property-utils.js"),"utf8");
  const realNow=Date.now;Date.now=()=>now;
  try{
    const row={titleEs:"Casa externa",price:20000000,currency:"MXN",priceUnit:"total",operation:"sale",images:[],features:[],amenities:[],externalContact:{name:"Persona privada",email:"private@example.com"}};
    const html=renderExternalPropertyShareHtml(row,{shareUrl:"https://example.com/ext/one",exchangeRate:rate});
    assert.match(html,/MXN \$20,000,000/);assert.doesNotMatch(html,/TC |Persona privada|private@example.com/);
    assert.match(externalPropertyWhatsappText(row,"https://example.com/ext/one",{exchangeRate:rate}),/MXN \$20,000,000/);
    assert.match(renderExternalPropertyShareHtml(row,{shareUrl:"https://example.com/ext/one"}),/MXN \$20,000,000/);
  }finally{Date.now=realNow;}
  assert.ok(source.includes("includeContact"));
});

test("the mortgage calculator uses coherent USD inputs and results in both languages",()=>{
  const {getPageByPath,renderSeoPage}=require("../seo-pages");
  for(const url of ["/calculadora-hipotecaria","/en/mortgage-calculator"]){
    const page=getPageByPath(url),html=renderSeoPage(url);
    assert.match(html,/name="currency" type="hidden" value="USD"/);
    assert.match(html,/name="price"[^>]+value="500000"/);assert.doesNotMatch(html,/<option value="MXN"/);
  }
  const source=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8"),start=source.indexOf("function initializeMortgageCalculator()"),end=source.indexOf("\nfunction ",start+10);
  const calculator=source.slice(start,end);assert.match(calculator,/`USD \$/);assert.doesNotMatch(calculator,/form\.currency\.value/);
});
