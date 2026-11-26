"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const pricing = require("../public-pricing");
const contacts = require("../contact-config");
const messages = require("../whatsapp-message");
const source = fs.readFileSync(require.resolve("../contextual-contact"), "utf8");
const functionSource = (start, end) => source.slice(source.indexOf("  function " + start), source.indexOf("  function " + end));
const convert = vm.runInNewContext(functionSource("convertedBudget", "countryList") + "\nconvertedBudget", { window: { PccPublicPricing: pricing } });
const snapshot = () => ({ status: "available", base: "USD", quote: "MXN", rate: 18.5525, date: new Date(Date.now() - 86400000).toISOString().slice(0,10), checkedAt: new Date().toISOString(), source: { provider: "BANXICO" } });

test("only converted inquiry budgets round upward while using a dated, valid Banxico rate", () => {
  const rate = snapshot();
  const pesos = convert(1000000, "USD", "MXN", rate);
  assert.equal(pesos.amount, 18600000); assert.ok(pesos.amount >= 1000000 * rate.rate);
  const dollars = convert(10000000, "MXN", "USD", rate);
  assert.equal(dollars.amount, 540000); assert.ok(dollars.amount >= 10000000 / rate.rate);
  assert.equal(convert(800001, "USD", "USD", rate).amount, 800001, "Returning to the original input must not inflate it");
  assert.equal(convert(100, "USD", "MXN", null), null);
  assert.equal(convert(100, "USD", "MXN", { ...rate, date: "2020-01-01" }), null);
  assert.equal(convert(100, "USD", "MXN", { ...rate, source: { provider: "UNKNOWN" } }), null);
  assert.equal(convert(1e13, "USD", "MXN", rate), null);
});

test("direct office links contain the current listing and its short link without submitting a lead", () => {
  for (const english of [false, true]) {
    const links = vm.runInNewContext(functionSource("directOfficeLinks", "convertedBudget") + functionSource("whatsappUrl", "contactControls") + "\ndirectOfficeLinks", {
      window: { PccContacts: contacts, PccWhatsAppMessage: messages }, handoffOptions:{}, location: { origin: "https://preview.invalid", pathname: "/propiedades/riva", search: "" }, URL, lang:()=>english?'en':'es',
      tr: (es,en) => english ? en : es, escape: value => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;"),
    });
    const html = links({ propertyId: "riva", propertyTitle: "RIVA Puerto Cancún", mls: "M7612", zone: "Puerto Cancún", sourcePath: "/propiedades?location=puerto-cancun", listingPath:"/s/abc123" }, { publicSiteUrl: "https://www.puertocancun.center" });
    const urls = [...html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1].replace(/&amp;/g,"&")));
    assert.deepEqual(urls.map(url => url.pathname.slice(1)), contacts.contacts.map(contact => contact.number));
    for (const url of urls) {
      assert.equal(url.hostname, "wa.me"); assert.match(url.searchParams.get("text"), /RIVA Puerto Cancún/);
      assert.equal(url.searchParams.get("text").match(/MLS M7612/g)?.length, 1);
      assert.match(url.searchParams.get("text"), /https:\/\/www\.puertocancun\.center\/s\/abc123/);
    }
    assert.doesNotMatch(html, /data-contact-inquiry/);
  }
});
