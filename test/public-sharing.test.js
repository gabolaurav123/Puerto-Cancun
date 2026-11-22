const test = require("node:test");
const assert = require("node:assert/strict");
const { shareToken, sharePath, shareButton, resolveSharePath } = require("../public-sharing");
const { safePublicImages } = require("../public-listing-details");
const { renderPropertyPage, renderInventoryCards, propertyPath } = require("../seo-pages");
const { projectRecords, projectDetail } = require("../catalog-directory");

const property = { id:"unit-123", titleEs:"Casa junto al lago", titleEn:"Lakefront home", type:"Casa", publicationSection:"properties", status:"active", isPublic:true,
  images:["/media/properties/unit-123/0", "/media/properties/unit-123/1"], developmentImages:["/media/properties/project-456/0"], zone:"Lagos del Sol" };
const development = { ...property, id:"project-456", type:"Desarrollo", publicationSection:"developments", images:["/media/properties/project-456/0"], developmentImages:[] };

test("property photos stay separate from a linked development in galleries, cards and schema", () => {
  assert.deepEqual(safePublicImages(property),property.images);
  const html = renderPropertyPage(property).html;
  assert.match(html, /1 \/ 2/);
  assert.doesNotMatch(html,/\/media\/properties\/project-456/);
  assert.deepEqual(safePublicImages({...property, images:[]}),[]);
  assert.deepEqual(safePublicImages(development),development.images);
});

test("short links survive title changes, preserve language and never resolve withdrawn inventory", () => {
  const token = shareToken(property);
  assert.match(sharePath(property), /^\/s\/[\w-]{12}$/);
  assert.equal(shareToken({...property,titleEs:"Nuevo título",zone:"Nueva zona"}),token);
  assert.equal(resolveSharePath(token,[property],{},"es"),propertyPath(property,"es"));
  assert.equal(resolveSharePath(token,[property],{},"en"),propertyPath(property,"en"));
  for (const row of [{...property,isPublic:false},{...property,status:"draft"},{...property,status:"archived"}]) assert.equal(resolveSharePath(token,[row],{}),"");
  assert.equal(resolveSharePath("../../panel",[property],{}),"");
  assert.equal(resolveSharePath("AAAAAAAAAAAA",[property],{}),"");
  assert.equal(resolveSharePath(token,[property,property],{}),"");
});

test("property, development and presale cards and details expose share links for the right listing", () => {
  for (const lang of ["es","en"]) for (const row of [property,development]) {
    assert.ok(renderInventoryCards([row],lang).includes(`data-public-share="${sharePath(row,lang)}"`));
    assert.ok(renderPropertyPage(row,lang).html.includes(`data-public-share="${sharePath(row,lang)}"`));
  }
  const directory={areas:[],presales:[{id:"presale-1",status:"confirmed",nameEs:"Preventa del lago",developmentId:development.id}]};
  const project=projectRecords(directory,[development])[0];
  assert.notEqual(shareToken(project),shareToken(development));
  assert.equal(resolveSharePath(shareToken(project),[development],directory),project.urlEs);
  assert.equal(resolveSharePath(shareToken(project),[development],directory,"en"),project.urlEn);
  assert.ok(projectDetail(project,[],"es",project.urlEs).includes(sharePath(project)));
  assert.ok(renderInventoryCards([project]).includes(sharePath(project)));
  assert.equal(resolveSharePath(shareToken(project),[{...development,isPublic:false}],directory),"");
});

test("share button safely escapes listing text and has its own visible SVG icon", () => {
  const html=shareButton({...property,titleEs:'<img src=x onerror="bad()">'});
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
  assert.match(html,/aria-haspopup="dialog"/);
  assert.match(html,/<svg/);
  assert.equal(shareButton({}),"");
});
