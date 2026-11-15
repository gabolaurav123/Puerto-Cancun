const test = require("node:test");
const assert = require("node:assert/strict");
const policy = require("../presale-policy");
const portal = require("../portal-directory");
const catalog = require("../catalog-directory");
const inventory = require("../inventory-contract");
const review = require("../data/presale-review-20261115.json");
const reviewedImage = (id,index) => review.records.find(row=>row.id===id).images.find(image=>image.index===index).source;

function development(id="master",extra={}) { return {id,type:"Desarrollo",publicationSection:"developments",titleEs:"Desarrollo",titleEn:"Development",status:"active",isPublic:true,zone:"Puerto Cancún",operation:"sale",...extra}; }
function unit(id,extra={}) { return {id,type:"Departamento",publicationSection:"properties",titleEs:id,titleEn:id,status:"active",isPublic:true,zone:"Puerto Cancún",operation:"sale",...extra}; }

test("the same policy protects raw and enriched presales, and independent rental/resale units never inherit their parent's modality",()=>{
  const master=development(), newUnit=unit("new",{parentDevelopment:{propertyId:"master"}}), rental=unit("rental",{operation:"rent",parentDevelopment:{propertyId:"master"}}), resale=unit("resale",{catalogData:{salesModality:"resale"},parentDevelopment:{propertyId:"master"}}), unrelated=unit("independent",{parentDevelopment:{propertyId:"master"}});
  const records=[master,newUnit,rental,resale,unrelated],config=portal.initialConfig();
  config.presales=[{id:"project",nameEs:"Proyecto",nameEn:"Project",developmentId:"master",propertyIds:["new","rental","resale"],status:"confirmed",areaId:"puerto-cancun",subareaId:"",reference:"P1"}];
  assert.deepEqual(policy.inquiryPolicy(master,{directory:config,records}).allowedIntents,["buy"]);
  assert.equal(policy.inquiryPolicy(newUnit,{directory:config,records}).developmentId,"master");
  for (const record of [rental,resale,unrelated]) assert.equal(policy.isPresale(record,{directory:config,records}),false);
  const directory=portal.publicDirectory(config,records),enriched=portal.enrichProperties(records,directory);
  assert.deepEqual(directory.presales[0].propertyIds,["new"]);
  assert.equal(enriched.find(row=>row.id==="master").catalogData.salesModality,"presale");
  assert.equal(enriched.find(row=>row.id==="rental").operation,"rent");
  assert.equal(master.catalogData,undefined,"public projection must not mutate raw records");
});

test("reviewed Azürea and SM10 are projected repeatably without duplicate inventory or invented parents",()=>{
  const azurea=development("prop-xlsx-60231635df1962b7dc647b1a",{titleEs:"Azürea Marina Residences",images:[reviewedImage("prop-xlsx-60231635df1962b7dc647b1a",0)]});
  const sm10=unit("prop-6954a2d1-ba0e-43fd-917b-071a4a14f61b",{titleEs:"DEPARTAMENTO EN PREVENTA SM10 CANCÚN",zone:"Ciudad de Cancún",mls:"2013",descriptionEs:"Departamento en preventa de 3 recámaras.",images:[reviewedImage("prop-6954a2d1-ba0e-43fd-917b-071a4a14f61b",0)]});
  const raw=[azurea,sm10],before=JSON.stringify(raw),config=portal.materialize(portal.initialConfig(),raw),second=portal.materialize(config,raw);
  assert.equal(config.presales.length,2); assert.deepEqual(second,config);
  const directory=portal.publicDirectory(config,raw),rows=portal.enrichProperties(raw,directory),projects=catalog.projectRecords(directory,rows);
  assert.equal(rows.length,2);assert.equal(JSON.stringify(raw),before);
  assert.equal(rows[1].parentDevelopment,undefined);assert.equal(rows[1].portalPresale.developmentId,"");
  assert.equal(rows[1].portalPresale.propertyId,sm10.id);
  for (const row of rows) assert.equal(inventory.modalityOf(row),"presale");
  const single=projects.find(row=>row.linkedProperty);
  assert.equal(single.linkedProperty.id,sm10.id);assert.equal(single.linkedDevelopment,undefined);
  assert.equal(single.descriptionEs,sm10.descriptionEs);assert.equal(single.operation,"sale");
  assert.equal(single.portalPresale.isPresale,true);
  assert.match(catalog.projectDetail(single,directory.areas,"es","/preventas-cancun"),/data-property-id="prop-6954a2d1-ba0e-43fd-917b-071a4a14f61b"/);
});

test("a render with contrary commercial evidence remains pending; delivered status and title guards override reviewed automatic changes",()=>{
  const riva=development("prop-xlsx-6954138fa174d915e2b09278",{titleEs:"Riva Puerto Cancún",catalogData:{salesModality:"direct"},images:Array.from({length:10},(_,i)=>i===9?reviewedImage("prop-xlsx-6954138fa174d915e2b09278",9):`/photo-${i}.jpg`)});
  assert.equal(policy.presaleState(riva).status,"needs-verification");
  assert.equal(policy.isPresale(riva),false);
  assert.equal(policy.imagePresentation(riva,9,"es").label,"Render arquitectónico");
  const azurea=development("prop-xlsx-60231635df1962b7dc647b1a",{titleEs:"Azürea Marina Residences",developmentData:{stage:"delivered"}});
  assert.equal(policy.isPresale(azurea),false);
  assert.equal(policy.isPresale({...azurea,developmentData:{},titleEs:"Otro inmueble"}),false);
});

test("gallery labels follow source images even when an editor selects a different cover",()=>{
  const source=development("prop-8008c9bc-02ca-435f-9dcd-b5739cfed032",{titleEs:"Al Mare Puerto Cancún",catalogData:{salesModality:"presale"},images:[0,1,2].map(i=>i===1?reviewedImage("prop-8008c9bc-02ca-435f-9dcd-b5739cfed032",0).replace("/0?","/1?"):reviewedImage("prop-8008c9bc-02ca-435f-9dcd-b5739cfed032",i))});
  const config=portal.materialize(null,[source]);config.presales[0].image=source.images[1];
  const directory=portal.publicDirectory(config,[source]),rows=portal.enrichProperties([source],directory),project=catalog.projectRecords(directory,rows)[0];
  assert.equal(policy.imagePresentation(project,0).label,"");
  assert.equal(policy.imagePresentation(project,1).label,"Render arquitectónico");
  const html=catalog.projectDetail(project,directory.areas,"en","/en/cancun-presales");
  assert.match(html,/Architectural rendering/);assert.match(html,/data-development-id=/);assert.match(html,/data-project-id=/);
  assert.match(html,/data-public-location/);
});

test("versionless and outdated local project covers resolve to the current gallery without duplicates",()=>{
  const id="prop-xlsx-3d0d5ff2d8b69246286aaa67";
  const source=development(id,{titleEs:"Mondrian Residences at Grand Island Cancún",catalogData:{salesModality:"presale"},images:Array.from({length:5},(_,i)=>`/media/properties/${id}/${i}?v=1794000000000`)});
  const before=JSON.stringify(source);
  const projectWithCover=image=>{
    const config=portal.materialize(null,[source]);config.presales[0].image=image;
    const directory=portal.publicDirectory(config,[source]);
    return catalog.projectRecords(directory,portal.enrichProperties([source],directory))[0];
  };
  for (const cover of [`/media/properties/${id}/0`,`/media/properties/${id}/0?v=1780000000000&w=640`]) {
    const project=projectWithCover(cover);
    assert.deepEqual(project.images,source.images);
    assert.equal(project.images.length,5);
  }
  const differentCover=projectWithCover(`/media/properties/${id}/3`);
  assert.deepEqual(differentCover.images,[source.images[3],source.images[0],source.images[1],source.images[2],source.images[4]]);
  const remote=`https://other.example/media/properties/${id}/0`;
  assert.deepEqual(projectWithCover(remote).images,[remote,...source.images]);
  assert.equal(JSON.stringify(source),before);

  const renderId="prop-8008c9bc-02ca-435f-9dcd-b5739cfed032",render=reviewedImage(renderId,0);
  const renderedSource=development(renderId,{titleEs:"Al Mare Puerto Cancún",catalogData:{salesModality:"presale"},images:[render]});
  const config=portal.materialize(null,[renderedSource]);config.presales[0].image=render.split("?")[0];
  const directory=portal.publicDirectory(config,[renderedSource]),project=catalog.projectRecords(directory,portal.enrichProperties([renderedSource],directory))[0];
  assert.deepEqual(project.images,[render]);
  assert.equal(policy.imagePresentation(project,0).label,"Render arquitectónico");
});

test("render evidence follows versioned image identity after reorder and expires after replacement",()=>{
  const id="prop-xlsx-60231635df1962b7dc647b1a",source=reviewedImage(id,0);
  const original=development(id,{titleEs:"Azürea Marina Residences",images:[source]});
  const directory=portal.publicDirectory(null,[original]);
  const [enriched]=portal.enrichProperties([original],directory);
  const reordered={...enriched,images:["/new-real-photo.jpg",source+"&w=640&q=80"]};
  assert.equal(policy.imagePresentation(reordered,0).label,"");
  assert.equal(policy.imagePresentation(reordered,1).label,"Render arquitectónico");
  assert.equal(policy.isPresale(reordered,{directory}),true);
  for (const images of [[source.replace(/v=\d+/,"v=9999999999999")],["/new-real-photo.jpg"],[]]) {
    for (const record of [{...original,images},{...enriched,images}]) {
      const state=policy.presaleState(record,{directory});
      assert.equal(state.isPresale,false);assert.equal(state.status,"needs-verification");
      assert.equal(state.reason,"reviewed-gallery-changed");
      assert.equal(policy.imagePresentation(record,0).label,"");
    }
  }
  assert.equal(policy.isPresale({...original,images:[],catalogData:{salesModality:"presale"}}),true,"Explicit current commercial classification is independent evidence");
  assert.equal(policy.imagePresentation({...original,images:[],catalogData:{salesModality:"presale"}},0).label,"");
});

test("browser projection uses reviewed identities and never trusts bare render indices",()=>{
  const fs=require("node:fs"),vm=require("node:vm"),context={URL};
  vm.runInNewContext(fs.readFileSync(require.resolve("../presale-policy"),"utf8"),context);
  const source="/media/properties/example/0?v=1";
  const record=development("example",{images:[source],portalPresale:{isPresale:true,originalModality:"unclassified",reviewEvidence:"fixture",renderImages:[{index:0,source,kind:"render"}],renderImageIndices:[0]}});
  assert.equal(context.PccPresalePolicy.imagePresentation(record,0).label,"Render arquitectónico");
  assert.equal(context.PccPresalePolicy.imagePresentation({...record,images:[source.replace("v=1","v=2")]},0).label,"");
  assert.equal(context.PccPresalePolicy.isPresale({...record,images:["/new.jpg"]}),false);
  assert.equal(context.PccPresalePolicy.imagePresentation({...record,portalPresale:{renderImageIndices:[0]}},0).label,"");
});
