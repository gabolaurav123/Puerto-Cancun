"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const messages = require("../whatsapp-message");
const contacts = require("../contact-config");
const { messageFor: serverMessage } = require("../contact-inquiries");
const { createHarness } = require("./helpers/public-inquiry-harness");
const source = fs.readFileSync(require.resolve("../contextual-contact"), "utf8");
const functionSource = (start, end) => source.slice(source.indexOf("  function " + start), source.indexOf("  function " + end));
function clientUrl(english = false) {
  return vm.runInNewContext(functionSource("whatsappUrl", "contactControls") + "\nwhatsappUrl", {
    window: { PccWhatsAppMessage: messages, PccContacts: contacts }, handoffOptions:{}, URL, lang: () => english ? "en" : "es",
    location: { origin:"https://portal.example.test", pathname:"/propiedades", search:"?view=map" },
  });
}

test("server and browser automatic messages omit internal references while retaining natural context", () => {
  const sandbox={};vm.runInNewContext(fs.readFileSync(require.resolve("../whatsapp-message"),"utf8"),sandbox);
  for (const lang of ["es","en"]) {
    const data={lang,intent:"buy",propertyTitle:"RIVA Puerto Cancún",development:"RIVA Puerto Cancún",zone:"Puerto Cancún",propertyType:"Departamento",reference:"prop-xlsx-1999999",mls:"M7612",whatsappRef:"a123456789abcdef",preferences:'Vista al mar & terraza "amplia"'};
    const text=serverMessage(data,"https://portal.example.test/riva");
    assert.equal(text,sandbox.PccWhatsAppMessage.messageFor(data,"https://portal.example.test/riva"));
    assert.equal(text.match(/RIVA Puerto Cancún/g).length,1);
    assert.doesNotMatch(text,/prop-xlsx|PCC-|M7612|a123456789abcdef|Referencia|Reference/);
    assert.match(text,/Vista al mar & terraza "amplia"/);
    assert.match(text,/https:\/\/portal.example.test\/riva/);
  }
});

test("email preference opens the same WhatsApp destination and includes the requested email reply", () => {
  for (const english of [false,true]) {
    const url=clientUrl(english)({propertyTitle:"Mondrian",contactChannel:"email",email:"buyer+visit@example.test",topic:"photos",office:"us",sourcePath:"/propiedades/mondrian"},{});
    const parsed=new URL(url),text=parsed.searchParams.get("text");
    assert.equal(parsed.hostname,"wa.me");assert.equal(parsed.pathname,"/19568037838");
    assert.match(text,/buyer\+visit@example\.test/);
    assert.match(text,english?/Please contact me by email\. This is my email address:/ : /Deseo que me contacten por correo electrónico\. Este es mi correo electrónico:/);
    assert.match(text,english?/More photos/:/Más fotografías/);
    assert.match(text,/Mondrian/);assert.equal([...parsed.searchParams].length,1);
    const whatsappText=new URL(clientUrl(english)({contactChannel:"whatsapp",email:"hidden@example.test"},{})).searchParams.get("text");
    assert.doesNotMatch(whatsappText,/hidden@example|email address|correo electrónico/);
  }
});

test("all presale topics are human readable and unknown choices are omitted", () => {
  for (const [topic,labels] of Object.entries(messages.topics)) for(const [lang,index] of [["es",0],["en",1]]) {
    const text=messages.messageFor({lang,intent:"buy",project:"Mondrian",topic},"");
    assert.ok(text.includes(labels[index]));assert.match(text,/Mondrian/);
  }
  assert.doesNotMatch(messages.messageFor({topic:"not-a-real-topic"}),/not-a-real-topic/);
});

test("property search keeps the selected zone, bedrooms, baths and budget currency in the handoff", () => {
  const make=clientUrl();
  const filters={type:"Departamento",locations:["zona-hotelera"],max:18000000,currency:"MXN",beds:3,baths:2};
  const untouched=new URL(make({service:"property-search",intent:"buy",searchFilters:filters},{})).searchParams.get("text");
  assert.match(untouched,/conseguir mi propiedad ideal/);assert.match(untouched,/Zona Hotelera/);
  assert.match(untouched,/Recámaras: 3/);assert.match(untouched,/Baños: 2/);assert.match(untouched,/18,000,000 MXN/);
  const changed=new URL(make({service:"property-search",searchFilters:filters,budget:900000,currency:"USD",beds:4,zone:"Puerto Cancún"},{})).searchParams.get("text");
  assert.match(changed,/900,000 USD/);assert.match(changed,/Recámaras: 4/);assert.match(changed,/Zona: Puerto Cancún/);assert.doesNotMatch(changed,/18,000,000|Zona Hotelera/);
  const custom=new URL(make({office:"us"},{offices:[{id:"us",number:"12025550199"}]}));assert.equal(custom.pathname,"/12025550199");
});

test("office configuration for direct handoff is read-only and retains configured destination", async t => {
  const h=await createHarness();t.after(h.close);
  const result=await h.get("/api/inquiries/options");
  assert.equal(result.status,200);assert.equal(result.data.defaultOffice,"mx");
  assert.deepEqual(result.data.offices.map(({id,number})=>[id,number]),contacts.contacts.map(({id,number})=>[id,number]));
  assert.equal(h.records.size,0);assert.equal(h.calls.some(([sql])=>/^(INSERT|UPDATE|DELETE|BEGIN)/.test(sql)),false);
});

test("public valuation sends optional details and email preference to WhatsApp without asking for a phone or posting a lead", async () => {
  const app = fs.readFileSync(require.resolve("../app"), "utf8");
  const code = app.slice(app.indexOf("async function leadFormSubmit("), app.indexOf("\nfunction preparePersonalDataForms"));
  for (const english of [false, true]) for (const channel of ["email", "whatsapp"]) {
    const opened = [], notices = [], links = [];
    const message = { append: (...nodes) => links.push(...nodes), focus() {} };
    const form = { dataset: {}, reportValidity: () => true, hasAttribute: name => name === "data-whatsapp-inquiry", querySelector: () => message,
      data: { leadType: "validar-precio", zone: "Cozumel", contactChannel: channel, email: "owner@example.test", ownerEstimate: "250000", currency: "USD", landSize: "300", builtSize: "200", bedrooms: "3", bathrooms: "2", message: "Renovación de cocina", amenities: "Piscina", legalStatus: "Escritura", age: "5" } };
    const submit = vm.runInNewContext(code + "\nleadFormSubmit", {
      state: { lang: english ? "en" : "es" }, FormData: class { constructor(target) { this.target=target; } entries() { return Object.entries(this.target.data); } },
      setFormMessage: (_node,text) => notices.push(text), document: { createElement: tag => ({ tag }) },
      window: { location: { pathname: "/revisar-precio-propiedad", search: "", hash: "#review" }, PccInquiry: { whatsappUrl: clientUrl(english) }, open: (...args) => opened.push(args) },
      api: () => assert.fail("Direct contact must not POST a lead"),
    });
    await submit({ preventDefault() {}, currentTarget: form });
    assert.equal(opened.length,1); assert.equal(opened[0][2],"noopener,noreferrer");
    const text = new URL(opened[0][0]).searchParams.get("text");
    for (const value of ["Cozumel","250000 USD","300","200","Piscina","Escritura","Renovación de cocina"]) assert.ok(text.includes(value),value);
    assert.match(text,english ? /Bedrooms: 3/ : /Recámaras: 3/);
    if(channel==="email") { assert.match(text,/owner@example\.test/); assert.match(text,english ? /Please contact me by email/ : /Deseo que me contacten por correo electrónico/); }
    else assert.doesNotMatch(text,/owner@example/);
    assert.doesNotMatch(notices.at(-1),/saved|guardad|recibid|received/i);
    assert.equal(links.find(node=>node.tag==="a").href,opened[0][0]);
  }
});
