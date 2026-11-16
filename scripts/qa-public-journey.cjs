"use strict";
// Full public templates and client scripts against a read-only inventory snapshot.
// Only localhost is allowed. Persistence is checked separately against the DEV DB.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), http = require("node:http");
const express = require("express");
const root = path.resolve(__dirname, "..");
const snapshotPath = process.env.PCC_PUBLIC_SNAPSHOT;
if (!snapshotPath) throw Error("Set PCC_PUBLIC_SNAPSHOT to a previously captured public inventory.");
Object.assign(process.env, { NODE_ENV: "test", DATABASE_URL: "postgres://qa:unused@127.0.0.1:1/unused", DATABASE_SSL: "false", PUBLIC_PROPERTY_ADVISOR_ENABLED: "false", SESSION_SECRET: "local-only-public-journey" });
const seo = require("../seo-pages"), portal = require("../portal-directory"), inventory = require("../inventory-contract");
const { decoratePublicHtml } = require("../server");
const { resolveInquiryContext } = require("../inquiry-context");
const { getCountries, getCountryCallingCode } = require("libphonenumber-js/max");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const directory = portal.publicDirectory(null, snapshot.properties);
const properties = portal.enrichProperties(snapshot.properties, directory);
const rate = { status: "available", rate: 20, base: "USD", quote: "MXN", date: new Date().toISOString().slice(0,10), checkedAt: new Date(Date.now()-1000).toISOString(), source: { provider: "BANXICO" } }; // Deliberate QA rate, never published.
const report = { mode: "LOCAL_READ_ONLY_SNAPSHOT", inventory: properties.length, checks: [], pageErrors: [], blockedWrites: 0 };
const output = path.resolve(root, "outputs/qa-20261115/journey"); fs.mkdirSync(output, { recursive: true });
const app = express();
app.use((req,res,next)=>{ if (req.method !== "GET") { report.blockedWrites++; return res.status(403).json({error:"Read-only visual QA"}); } next(); });
app.get("/api/properties", (_req,res)=>res.json({properties,directory}));
app.get("/api/session", (_req,res)=>res.json({user:null,csrfToken:"local-qa"}));
app.get("/api/config", (_req,res)=>res.json({currencyExchange:rate}));
app.get("/api/location-options", (_req,res)=>res.json({options:[]}));
app.get("/api/inquiries/options", (_req,res)=>res.json({countries:getCountries().map(country=>({country,prefix:"+"+getCountryCallingCode(country)})),featuredCountry:"MX",channels:{email:false,whatsapp:false}}));
app.get("/api/inquiries/context", (req,res)=>{try{res.json(resolveInquiryContext(req.query,properties,{directory}));}catch(error){res.status(400).json({error:error.message});}});
app.get("/api/geocode", (_req,res)=>res.status(503).json({error:"Deliberate map provider failure"}));
app.get("/api/*", (_req,res)=>res.json({}));
app.use(express.static(root, { index: false }));
app.get("*", (req,res)=>{
  const lang = req.path.startsWith("/en") ? "en" : "es";
  const property = properties.find(p=>seo.propertyPath(p,lang)===req.path);
  let page, head, content, bodyPage="seo";
  if(property){ const rendered=seo.renderPropertyPage(property,lang,[],directory,properties,rate);page=rendered.page;head=seo.renderPropertyHead(property,"http://127.0.0.1",lang,rate);content=rendered.html; }
  else {
    const base = seo.getPageByPath(req.path);if(!base)return res.status(404).send("Missing QA route");
    page={...base,portalDirectory:directory,catalogAreas:directory.areas,currencyExchange:rate};
    head=seo.renderSeoHead(page,"http://127.0.0.1");
    bodyPage=["/","/en"].includes(page.path)?"home":"seo";
    content=bodyPage==="home"?"":page.category?seo.renderCategoryPage(page,properties,req.query):seo.renderSeoPage(page.path,{directory,properties});
  }
  res.type("html").send(decoratePublicHtml({page,seo:head,pageContent:content,bodyPage,noindex:true}));
});
const server=http.createServer(app);
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE || "playwright");
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || chromium.executablePath()});
  try {
    const byTitle=q=>properties.find(p=>(p.titleEs||"").toLowerCase().includes(q));
    const cases=[byTitle("mondrian"),byTitle("al mare"),byTitle("azürea"),properties.find(p=>p.mls==="2013"),properties.find(p=>p.mls==="1877"),properties.find(p=>p.type==="Terreno"&&inventory.resolveLocation(p).id==="fuera-de-cancun"),properties.find(p=>p.mls==="M7612")].filter(Boolean);
    assert.ok(cases.length>=6,"critical inventory cases must exist in the snapshot");
    for(const lang of ["es","en"])for(const width of [390,1366]){
      const page=await browser.newPage({viewport:{width,height:900}});
      page.on("pageerror",error=>report.pageErrors.push({lang,width,message:error.message}));
      await page.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const prefix=lang==="en"?"/en":"";
      const routes=[prefix||"/",lang==="en"?"/en/contact":"/contacto",lang==="en"?"/en/properties":"/propiedades",(lang==="en"?"/en/properties":"/propiedades")+"?q=zznoresultsnov15",lang==="en"?"/en/cancun-presales":"/preventas-cancun",...cases.map(p=>seo.propertyPath(p,lang))];
      for(const route of routes){
        await page.goto(base+route);await page.waitForFunction(()=>Boolean(window.PccInquiry));
        assert.equal(await page.locator('.advisor-launcher,.advisor-dialog').count(),0,"AI removed");
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${route} ${width}: page fits`);
        const officeLinks=page.locator('.office-inquiry-button');
        if(await officeLinks.count()) {
          assert.equal(await officeLinks.count(),2,"both offices available");
          for(const office of await officeLinks.all()) {
            const href=new URL(await office.getAttribute("href"));
            assert.equal(href.origin,"https://wa.me","office opens WhatsApp directly");
            assert.ok(href.searchParams.get("text"),"message is prepared");
            assert.equal(await office.getAttribute("data-contact-inquiry"),null,"no intervening form");
          }
        }
        if(["/contacto","/en/contact"].includes(route)) {
          report.checks.push({lang,width,route,contact:"both offices: direct WhatsApp with prepared message"});
          continue;
        }
        const primary=page.locator('.seo-page [data-contact-inquiry]:visible, main [data-contact-inquiry]:visible').first();
        assert.ok(await primary.count(),`${route}: human contact present`);
        await primary.click();await page.locator('.contextual-inquiry [name="contactChannel"]').waitFor();
        assert.ok(await page.locator('.contextual-inquiry [type="submit"]').isVisible());
        await page.locator('.contextual-inquiry [name="contactChannel"]').selectOption("email");
        assert.equal(await page.locator('.contextual-inquiry [name="phone"]').isVisible(),false);
        assert.ok(await page.locator('.contextual-inquiry [name="email"]').isVisible());
        const presale=cases.find(p=>seo.propertyPath(p,lang)===route&&p.portalPresale?.isPresale);
        if(presale) assert.equal(await page.locator('.contextual-inquiry select[name="intent"]').count(),0,"presale intent is fixed");
        await page.keyboard.press("Escape");
        assert.equal(page.url(),base+route,"close preserves origin");
        report.checks.push({lang,width,route,contact:"one step, email only, close returns",presale:!!presale});
      }
      const mondrian=cases.find(p=>(p.titleEs||"").toLowerCase().includes("mondrian"));
      await page.goto(base+seo.propertyPath(mondrian,lang));
      await page.locator('[data-public-location]').scrollIntoViewIfNeeded();
      assert.ok(await page.locator('.public-location-summary').innerText());
      await page.screenshot({path:path.join(output,`${lang}-${width}-location.png`)});
      await page.locator('.property-contact-cta').first().click();await page.locator('.contextual-inquiry [name="contactChannel"]').waitFor();
      await page.screenshot({path:path.join(output,`${lang}-${width}-contact.png`)});
      await page.close();
    }
    assert.deepEqual(report.pageErrors,[],"no runtime errors");assert.equal(report.blockedWrites,0,"UI does not silently create leads");
    fs.writeFileSync(path.join(output,"report.json"),JSON.stringify(report,null,2));
    console.log(JSON.stringify({checks:report.checks.length,errors:report.pageErrors,blockedWrites:report.blockedWrites}));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().then(()=>process.exit(0)).catch(error=>{console.error(error);fs.writeFileSync(path.join(output,"report.json"),JSON.stringify(report,null,2));process.exit(1);});
