const test = require("node:test");
const assert = require("node:assert/strict");
const { publicAmenities, parsePlacePin, resolvePublicLocation } = require("../public-listing-details");
const { titleWithMls, messageFor } = require("../whatsapp-message");
const { renderPresaleHead, getPageByPath } = require("../seo-pages");
const { resolveInquiryContext } = require("../inquiry-context");
const { sharePath } = require("../public-sharing");

test("the same public MLS appears once across localized titles and WhatsApp intents", () => {
  for (const title of ["BVG", "BVG MLS# 2589", "BVG · MLS 2589"]) {
    const msg = messageFor({lang:"en",intent:"buy",propertyId:"unit",propertyTitle:title,mls:"2589"}, "https://example.org/s/abc");
    assert.equal(msg.match(/2589/g)?.length,1);
    assert.equal(msg.match(/https:\/\//g)?.length,1);
  }
  assert.equal(titleWithMls("Riva", "MLS-42"), "Riva · MLS-42");
  const seller = messageFor({intent:"sell",propertyType:"Desarrollo",mls:"PCC-14"}, "https://example.org/");
  assert.match(seller,/un desarrollo/);
  assert.equal(seller.match(/MLS PCC-14/g)?.length,1);
  assert.doesNotMatch(seller,/http|Lo vi/);
});

test("project preview and inquiry use the project's own photo, URL and public reference", () => {
  const dev={id:"community",titleEs:"Marina",titleEn:"Marina",type:"Desarrollo",publicationSection:"developments",status:"active",isPublic:true,mls:"PCC-90",images:["/media/properties/community/0"]};
  const project={id:"presale-marina",developmentId:"community",nameEs:"Marina en preventa",nameEn:"Marina presale",status:"confirmed"};
  const directory={presales:[project],areas:[]};
  const row=require("../catalog-directory").projectRecords(directory,[dev])[0];
  const ctx=resolveInquiryContext({projectId:project.id,developmentId:dev.id,lang:"en"},[dev],{directory});
  assert.equal(ctx.listingPath,sharePath(row,"en"));
  assert.equal(ctx.mls,dev.mls);
  const head=renderPresaleHead(getPageByPath("/en/cancun-presales"),row,"https://example.org");
  assert.equal(head.image,"https://example.org/media/properties/community/0");
  assert.ok(head.title.includes("Marina presale"));
  assert.equal(head.canonical,"https://example.org/en/cancun-presales?project=presale-marina");
  assert.equal(head.alternate,"/preventas-cancun?project=presale-marina");
  const featured={...row,id:"presale:"+row.id};
  assert.equal(sharePath(featured),sharePath(row));
});

test("public amenities combine stored formats and respect the development's visibility", () => {
  const dev={id:"d",developmentData:{id:"dev-d",amenities:["Marina"]},amenities:["Alberca","Marina"]};
  assert.deepEqual(publicAmenities(dev),["Alberca","Marina"]);
  assert.deepEqual(publicAmenities({...dev,portalHiddenBlocks:["amenities"]}),[]);
  const unit={amenities:["Balcón"],parentDevelopment:{id:"dev-d",propertyId:"d",amenities:["Marina"]}};
  assert.deepEqual(publicAmenities(unit,[{...dev,portalHiddenBlocks:["amenities"]}]),["Balcón"]);
  assert.deepEqual(publicAmenities(null),[]);
});

test("only coordinates of an actual Maps place can be pasted as a pin", () => {
  const point={latitude:21.240692,longitude:-86.8032359};
  assert.deepEqual(parsePlacePin("21.240692, -86.8032359"),point);
  assert.deepEqual(parsePlacePin("https://www.google.com/maps/place/La+Amada/@20.0,-86.0,10z/data=!3d21.240692!4d-86.8032359"),point);
  assert.deepEqual(parsePlacePin("https://maps.google.com/?q=21.240692%2C-86.8032359"),point);
  for (const value of ["https://www.google.com/maps/@20,-86,12z","https://example.com/?q=21,-86","0,0","91,0",""]) assert.equal(parsePlacePin(value),null);
});

test("a unit at the master pin is identified as a development reference", () => {
  const parent={id:"master",type:"Desarrollo",publicationSection:"developments",titleEs:"Marina",locationPrecision:"exact",latitude:21.1,longitude:-86.8,isPublic:true,status:"active"};
  const unit={id:"unit",publicationSection:"properties",type:"Casa",portalDevelopmentId:"master",locationPrecision:"exact",latitude:21.1,longitude:-86.8};
  assert.equal(resolvePublicLocation(unit,{properties:[parent]}).coordinateSource,"development");
  assert.equal(resolvePublicLocation({...unit,latitude:21.11},{properties:[parent]}).coordinateSource,"listing");
  assert.equal(resolvePublicLocation({...unit,locationPrecision:"hidden"},{properties:[parent]}).precision,"hidden");
});
