const test = require("node:test");
const assert = require("node:assert/strict");
const directory = require("../portal-directory");
const { publicIp, enrichStoredLocations } = require("../ip-geography");
const { resolveTarget, recordOpen, linkContact } = require("../share-invitations");
const seo = require("../seo-pages");
const { sharePath } = require("../public-sharing");
const dev = {id:"development-qa",type:"Desarrollo",publicationSection:"developments",titleEs:"Proyecto QA",titleEn:"QA development",status:"active",isPublic:true,zone:"Puerto Cancún",developmentData:{id:"dev-development-qa"},catalogData:{salesModality:"presale"}};
const unit = {id:"unit-qa",type:"Departamento",publicationSection:"properties",titleEs:"Unidad QA",status:"active",isPublic:true,zone:"Puerto Cancún",developmentId:dev.developmentData.id,catalogData:{salesModality:"presale"}};

test("removing a presale also retires its featured placement and automatic seeds across subsequent edits", () => {
  const inventory = [dev,unit];
  const original = directory.materialize(null,inventory);
  const project = original.presales.find(x=>x.developmentId === dev.id);
  assert.ok(project.propertyIds.includes(unit.id));
  const input = structuredClone(original);
  input.presales = [];
  input.featured.push({id:"featured-qa",kind:"presale",targetId:project.id,placement:"home",contextId:"",active:true});
  const saved = directory.validate(input,inventory,original);
  assert.ok(!saved.featured.some(f=>f.targetId===project.id));
  assert.deepEqual(directory.materialize(saved,inventory).presales,[]);
  const again = directory.validate({...saved,suppressedPresaleSources:[]},inventory,saved);
  assert.deepEqual(directory.publicDirectory(again,inventory).presales,[]);
  assert.equal(directory.enrichProperties(inventory,directory.publicDirectory(again,inventory)).length,2);
  const restored = directory.validate({...again,presales:[project]},inventory,again);
  assert.equal(directory.materialize(restored,inventory).presales.length,1);
});

test("a draft presale can start with just a Spanish name and keeps a stable reference on edits",() => {
  const original = directory.materialize(null,[]);
  const input = {...original,presales:[{id:"p-qa",nameEs:"Playa",developmentId:"",propertyIds:[],status:"draft"}]};
  const saved = directory.validate(input,[],original);
  assert.equal(saved.presales[0].reference,"p-qa");
  assert.equal(saved.presales[0].nameEn,"Playa");
  assert.throws(()=>directory.validate({...saved,presales:[{...saved.presales[0],status:"confirmed"}]},[],saved),/fuente/);
});

test("invitations accept only published local destinations, keep project identity and drop private query parameters",async()=>{
  const siteUrl = "https://www.puertocancun.center";
  const dir = directory.publicDirectory(null,[dev,unit]);
  const deps = { siteUrl, query:async()=>({rows:[]}), inventory:async()=>[dev,unit], directory:()=>dir, aliases:()=>({"/zonas":"/zonas-cancun"}) };
  const token = sharePath(unit,"en"), result = await resolveTarget(token,deps,true);
  assert.equal(result.landing,seo.propertyPath(unit,"en"));
  assert.equal((await resolveTarget(result.landing,deps)).source,token);
  assert.equal((await resolveTarget("/zonas?email=private@example.org",deps)).landing,"/zonas-cancun");
  const path = "/preventas-cancun?project="+dir.presales[0].id;
  assert.equal((await resolveTarget(path,deps)).landing,path);
  for (const unsafe of ["/panel","/api/session","//outside.test",siteUrl+"/missing","https://other.test/","/preventas-cancun?project=unknown"]) assert.equal(await resolveTarget(unsafe,deps),null);
  assert.equal(await resolveTarget(token,{...deps,inventory:async()=>[]}),null);
});

test("only a consented recorded session can attach a voluntarily submitted lead",async()=>{
  const token="a".repeat(32), calls=[], db={query:(sql,values)=>calls.push({sql,values})};
  await recordOpen(db,{invitation:"none",path:"/"},"sample");
  await linkContact(db,{invitationVisit:{token,analyticsConsent:false}},"lead","secret");
  assert.equal(calls.length,0);
  await recordOpen(db,{invitation:token,path:"/en",inviteChannel:"whatsapp"},"sample");
  assert.equal(calls[0].values[2],"whatsapp");
  await linkContact(db,{invitationVisit:{token,visitorId:"visitor-accepted-1234",sessionId:"session-accepted-1234",analyticsConsent:true}},"lead","secret");
  assert.match(calls[1].sql,/FROM share_invitation_opens/);
  assert.match(calls[1].values[2],/^visit-[a-f0-9]{32}$/);
});

test("private, test and carrier NAT addresses cannot be assigned a city, including mapped IPv4",async()=>{
  for(const ip of ["127.0.0.1","::1","10.0.0.2","100.64.0.1","::ffff:192.168.1.2","192.0.2.3","2001:db8::1","::"]) assert.equal(publicIp(ip),false,ip);
  assert.equal(publicIp("8.8.8.8"),true);
  assert.equal(publicIp("2606:4700:4700::1111"),true);
  const batches=[];
  await enrichStoredLocations(async(sql,params)=>{batches.push(params);return {rows:params[0] ? [] : [{id:"a",ip_address:"10.1.2.3"}]};});
  assert.deepEqual(batches,[[""],["a"],[""],["a"]]);
});
