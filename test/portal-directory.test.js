const test = require("node:test");
const assert = require("node:assert/strict");
const directory = require("../portal-directory");
const {internalRoleAllows} = require("../auth-utils");

const dev = { id:"master",type:"Desarrollo",publicationSection:"developments",titleEs:"Al Mare Puerto Cancún",titleEn:"Al Mare Puerto Cancún",zone:"Puerto Cancún",city:"Cancún",status:"active",isPublic:true,catalogData:{salesModality:"presale"},developmentData:{id:"dev-master"},image:"/assets/project.webp" };
const unit = { id:"unit",type:"Departamento",publicationSection:"properties",titleEs:"Unidad",status:"active",isPublic:true,developmentId:"dev-master",zone:"Zona Hotelera",city:"Cancún",catalogData:{} };
const land = {id:"land",type:"Terreno",publicationSection:"properties",titleEs:"Lote",zone:"Punta Sam",city:"Isla Mujeres",status:"active",isPublic:true};
function assignment(areaId, subareaId = "", extra = {}) { return {areaId,subareaId,gated:null,hiddenBlocks:[],...extra}; }
test("Public directory groups only proven geography and never manufactures a development for a standalone lot", () => {
  const cityDevelopment = {...dev,id:"south",zone:"Corredor Colosio",titleEs:"Residencial Campestre",catalogData:{},developmentData:{id:"dev-south"}};
  const bonfil = {...land,id:"locality",zone:"Alfredo V. Bonfil",city:"Cancún"};
  const explicit = {...land,id:"reviewed",catalogData:{locationId:"puerto-cancun"}};
  const rows=[dev,unit,land,cityDevelopment,bonfil,explicit];
  const before=structuredClone(rows);
  const d=directory.publicDirectory(null,rows);
  assert.deepEqual(rows,before);
  assert.equal(d.areas.length,4);
  assert.equal(d.assignments.south.subareaId,"huayacan-colosio");
  assert.equal(d.assignments.locality.subareaId,"alfredo-v-bonfil");
  assert.equal(d.assignments.land.areaId,"fuera-de-cancun");
  assert.equal(d.assignments.reviewed.areaId,"puerto-cancun");
  assert.equal(d.assignments.land.developmentId,"");
  assert.equal(d.assignments.unit.developmentId,dev.id);
  assert.equal(d.assignments.unit.areaId,"puerto-cancun");
  assert.deepEqual(d.presales.map(p=>[p.nameEs,p.developmentId,p.propertyIds]),[["Al Mare Puerto Cancún",dev.id,[]]]);
  assert.ok(!JSON.stringify(d).includes("ALMAR-REVISION"));
});
test("Moving a development moves its linked units and presale without changing the physical property fields", () => {
  const rows=[dev,unit,land], cfg=directory.materialize(null,rows);
  cfg.assignments.master=assignment("cancun-city","huayacan-colosio",{hiddenBlocks:["units","location"]});
  cfg.presales[0].propertyIds=["unit"];
  const valid=directory.validate(cfg,rows,cfg);
  const d=directory.publicDirectory(valid,rows), fresh=directory.enrichProperties(rows,d);
  assert.equal(d.assignments.unit.areaId,"cancun-city");
  assert.equal(d.assignments.unit.subareaId,"huayacan-colosio");
  assert.equal(fresh[1].zone,"Zona Hotelera");
  assert.equal(fresh[1].catalogData.locationId,"cancun-city");
  assert.deepEqual(fresh[0].portalHiddenBlocks,["units","location"]);
  assert.equal(fresh[0].locationPrecision,"hidden");
  assert.equal(fresh[0].latitude,null);
  assert.equal(fresh[0].address,"");
  assert.equal(d.presales[0].areaId,"cancun-city");
  assert.deepEqual(d.presales[0].propertyIds,["unit"]);
  valid.areas.find(a=>a.id==="cancun-city").active=false;
  const inactive=directory.publicDirectory(directory.validate(valid,rows,valid),rows);
  assert.equal(inactive.presales.length,0);
  assert.equal(inactive.assignments.unit.areaId,"");
  assert.equal(inactive.areas.some(a=>a.id==="cancun-city"),false);
});
test("Featured placements preserve editorial order, remove only the placement, and filter private targets or contexts", () => {
  const privateDev={...dev,id:"private",isPublic:false,titleEs:"PRIVATE INTERNAL TITLE",catalogData:{}};
  const rows=[dev,unit,land,privateDev],cfg=directory.materialize(null,rows);
  cfg.featured=[
    {id:"f1",kind:"property",targetId:"land",placement:"home",contextId:"",active:true},
    {id:"f2",kind:"area",targetId:"puerto-cancun",placement:"home",contextId:"",active:true},
    {id:"f3",kind:"development",targetId:"private",placement:"home",contextId:"",active:true},
    {id:"f4",kind:"property",targetId:"unit",placement:"development",contextId:"private",active:true},
    {id:"f5",kind:"property",targetId:"unit",placement:"home",contextId:"",active:false},
  ];
  const d=directory.publicDirectory(directory.validate(cfg,rows,cfg),rows);
  assert.deepEqual(d.featured.map(f=>f.id),["f1","f2"]);
  assert.equal(d.assignments.private,undefined);
  cfg.featured.reverse();
  assert.deepEqual(directory.publicDirectory(cfg,rows).featured.map(f=>f.id),["f2","f1"]);
  cfg.featured=cfg.featured.filter(f=>f.id!=="f1");
  assert.ok(directory.publicDirectory(cfg,rows).assignments.land);
});
test("inventory marks stay in sync after saving the directory and removing or moving one keeps it off the general page", () => {
  const rows=[{...dev,featured:true},{...unit,featured:false},{...land,featured:false}];
  const saved=directory.materialize(null,rows);
  rows[0].featured=false;
  rows[1].featured=true;
  const updated=directory.materialize(saved,rows);
  assert.deepEqual(updated.featured.map(slot=>slot.targetId),["unit"]);
  for (const scope of ["removed","area"]) {
    const edited=structuredClone(updated);
    if (scope === "removed") edited.featured=[];
    else Object.assign(edited.featured[0],{placement:"area",contextId:"puerto-cancun"});
    const stored=directory.validate(edited,rows,updated);
    const next=directory.publicDirectory(stored,rows);
    assert.equal(next.featured.some(slot=>slot.placement==="home"),false);
    assert.equal(next.featured.some(slot=>slot.placement==="area"),scope==="area");
    assert.equal(new Set(stored.featured.map(slot=>slot.id)).size,stored.featured.length);
    rows[2].featured=true;
    assert.deepEqual(directory.publicDirectory(stored,rows).featured.filter(slot=>slot.placement==="home").map(slot=>slot.targetId),["land"]);
    rows[2].featured=false;
  }
});
test("An illustration does not confirm a presale; Almar preview and unverified evidence never reach the public response", () => {
  const renderOnly={...dev,id:"render-only",titleEs:"Torre de ejemplo",catalogData:{},developmentData:{stage:"construcción"},image:"/assets/render.webp"};
  const cfg=directory.materialize(null,[renderOnly]);
  assert.deepEqual(cfg.presales.map(p=>p.status),["draft"]);
  assert.equal(directory.publicDirectory(cfg,[renderOnly]).presales.length,0);
  cfg.presales[0].status="confirmed";cfg.presales[0].areaId="puerto-cancun";cfg.presales[0].evidence="";
  assert.throws(()=>directory.validate(cfg,[renderOnly]),/fuente/);
  const explicitCfg=directory.materialize(null,[dev,unit]);
  explicitCfg.presales[0].status="inactive";
  assert.equal(directory.publicDirectory(explicitCfg,[dev,unit]).presales.length,0);
  assert.equal(directory.materialize(explicitCfg,[dev,unit]).presales.length,1);
});
test("Rejects invalid relationships and unsafe image URLs; public geographic IDs remain dynamic", () => {
  const rows=[dev,unit,land], cfg=directory.materialize(null,rows);
  cfg.areas.push({...cfg.areas[0],id:"quinta-zona",nameEs:"Quinta zona",nameEn:"Fifth area"});
  cfg.assignments.land=assignment("quinta-zona");
  const visit=directory.publicDirectory(directory.validate(cfg,rows),rows);
  assert.equal(visit.areas[4].id,"quinta-zona");assert.equal(visit.assignments.land.areaId,"quinta-zona");
  const mismatch=structuredClone(cfg);mismatch.assignments.land.subareaId="huayacan-colosio";
  assert.throws(()=>directory.validate(mismatch,rows),/compatibles/);
  const invalidProject=structuredClone(cfg);invalidProject.presales[0].propertyIds=["land"];
  assert.throws(()=>directory.validate(invalidProject,rows),/unidades/);
  const invalidImage=structuredClone(cfg);invalidImage.areas[0].image="javascript:alert(1)";
  assert.throws(()=>directory.validate(invalidImage,rows),/imagen/);
  const retired=structuredClone(cfg);retired.areas.shift();
  assert.throws(()=>directory.validate(retired,rows,cfg),/Desactiva/);
});
test("Directory editing follows existing editorial permissions; viewers cannot save", () => {
  const request={originalUrl:"/api/admin/portal-directory",method:"PUT"};
  assert.equal(internalRoleAllows(request,{internalRole:"editor"}),true);
  assert.equal(internalRoleAllows(request,{internalRole:"viewer",permissions:["properties:write"]}),false);
  assert.equal(internalRoleAllows({...request,method:"GET"},{internalRole:"viewer"}),true);
  assert.equal(internalRoleAllows(request,{internalRole:"advisor"}),false);
});

test("a verified complete project address and exact coordinates link a unit; manual correction, private or near matches prevail", () => {
  const address="Central Park Towers Cancun, Manzana 1, Lote 8, Supermanzana 10, Cancún, Benito Juárez, Quintana Roo";
  const park={...dev,id:"prop-d277bf6d-750a-4e2d-9231-c263336c721c",titleEs:"Central Park Towers Cancún",city:"Cancún",state:"Quintana Roo",zone:"SM10",neighborhood:"Supermanzana 10",address,locationPrecision:"exact",latitude:21.12546,longitude:-86.830299,catalogData:{}};
  const match={...unit,developmentId:"",city:"Cancún",state:"Quintana Roo",zone:"Benito Juárez",neighborhood:"Supermanzana 10",address,locationPrecision:"exact",latitude:park.latitude,longitude:park.longitude};
  const near={...match,id:"near",longitude:-86.8303}, blocked={...match,id:"blocked",portalSuppressInferredLink:true};
  const rows=[park,match,near,blocked],cfg=directory.materialize(null,rows),d=directory.publicDirectory(cfg,rows);
  assert.equal(d.assignments.master,undefined);
  assert.equal(d.assignments[park.id].areaId,"cancun-city");assert.equal(d.assignments[park.id].gated,true);
  assert.match(cfg.assignments[park.id].gatedEvidence,/centralparkcancun\.com/);
  assert.equal(d.assignments.unit.developmentId,park.id);assert.equal(d.assignments.near.developmentId,"");assert.equal(d.assignments.blocked.developmentId,"");
  cfg.assignments.unit={...assignment("fuera-de-cancun"),developmentId:""};
  const manual=directory.publicDirectory(directory.validate(cfg,rows,cfg),rows);
  assert.equal(manual.assignments.unit.developmentId,"");assert.equal(manual.assignments.unit.areaId,"fuera-de-cancun");
  cfg.assignments.unit.developmentId=park.id;
  const privateMaster=directory.publicDirectory(cfg,[{...park,isPublic:false},match]);
  assert.equal(privateMaster.assignments.unit.developmentId,"");assert.equal(JSON.stringify(privateMaster).includes(park.id),false);
});

test("the private inventory counts and filters a fifth area, keeping hidden coordinates and source fields intact for editors", () => {
  const admin=require("../admin-inventory-ui"), rows=[{...land,latitude:22,longitude:-86,catalogData:{locationId:"fuera-de-cancun"}},dev,unit];
  const cfg=directory.materialize(null,rows);
  cfg.areas.push({...cfg.areas[0],id:"custom",nameEs:"Zona editable",nameEn:"Editable area",active:false});
  cfg.assignments.land=assignment("custom","",{hiddenBlocks:["location"]});
  const prepared=directory.adminInventory(cfg,rows), snap=admin.currentSnapshot(prepared.properties,prepared.areas);
  assert.equal(snap.counts[0].locations.find(a=>a.id==="custom").total,1);
  assert.deepEqual(admin.selectRecords(snap.records,{location:"custom"},"properties").map(r=>r.id),["land"]);
  assert.equal(prepared.properties[0].latitude,22);assert.equal(prepared.properties[0].catalogData.locationId,"fuera-de-cancun");
  assert.equal(directory.publicDirectory(cfg,rows).areas.some(a=>a.id==="custom"),false);
});
