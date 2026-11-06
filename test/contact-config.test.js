const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const contacts = require("../contact-config");
const seo = require("../seo-pages");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const property = {
  id: "contact-test", slug: "contact-test", status: "active", publicationSection: "properties",
  titleEs: 'Casa "Mar & Sol" + 50% #1 \u00e1', titleEn: 'Home "Sea & Sun" + 50% #1',
  descriptionEs: "Descripcion", descriptionEn: "Description", type: "Casa", operation: "sale",
  zone: "Puerto Cancun", currency: "USD", price: 1000000, images: [],
};

function whatsappLinks(html) {
  return [...html.matchAll(/<a\b[^>]*href="(https:\/\/wa\.me\/[^\"]+)"[^>]*>(.*?)<\/a>/gs)]
    .map((match) => ({ url: new URL(match[1].replace(/&amp;/g, "&")), label: match[2] }));
}

test("CommonJS and browser contacts preserve actual MX/USA numbers and encode context once", () => {
  const browser = {};
  vm.runInNewContext(read("contact-config.js"), browser);
  assert.deepEqual(contacts.contacts.map(({ id, number }) => [id, number]), [["mx", "5219982166563"], ["us", "19562518956"]]);
  const before = JSON.stringify(contacts.contacts);
  const message = 'Casa \u00e1 & "Sol" + 50% #1\nhttps://example.invalid/p?q=a&lang=en';
  for (const contact of contacts.contacts) {
    const url = new URL(contacts.whatsappUrl(contact.id, message));
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, `/${contact.number}`);
    assert.equal(url.searchParams.get("text"), message);
    assert.equal([...url.searchParams].length, 1);
    assert.equal(url.hash, "");
    assert.equal(browser.PccContacts.whatsappUrl(contact.id, message), url.href);
    assert.equal(contacts.whatsappUrl(contact.id), `https://wa.me/${contact.number}`);
  }
  assert.equal(JSON.stringify(contacts.contacts), before);
  assert.equal(contacts.whatsappUrl("unknown"), contacts.whatsappUrl("mx"));
});

test("Spanish and English contact pages open the inquiry before offering WhatsApp", () => {
  for (const [route, lang] of [["/contacto", "es"], ["/en/contact", "en"]]) {
    const html = seo.renderSeoPage(route);
    assert.equal(whatsappLinks(html).length, 0);
    assert.ok(html.includes(lang === "en" ? "Talk to an advisor" : "Hablar con un asesor"));
    for (const [origin, buttons] of [["contact-page", html], ["home-contact", seo.officeInquiryButtons(lang, "home-contact")]]) {
      for (const { id, display } of contacts.contacts) {
        const tag = buttons.match(new RegExp('<a [^>]*data-office="' + id + '"[^>]*>.*?</a>'))[0];
        const href = new URL(tag.match(/href="([^"]*)"/)[1].replaceAll("&amp;", "&"), "https://example.test");
        assert.equal(href.pathname, route);
        assert.equal(href.searchParams.get("office"), id);
        assert.equal(href.searchParams.get("inquiry"), "1");
        assert.equal(href.searchParams.get("origin"), origin);
        assert.ok(tag.includes(display));
      }
    }
    const custom = seo.renderSeoPage(route, { offices: [{ id: "us", display: "+1 202 555 0199" }] });
    assert.match(custom, /\+1 202 555 0199/);
    assert.doesNotMatch(custom, /data-office="mx"/);
  }
  assert.equal(seo.business.telephone, contacts.contacts.find(({ id }) => id === "mx").display);
  assert.doesNotMatch(read("seo-pages.js"), /wa\.me\/\d+|5219982166563|19562518956/);
});

test("property and development inquiries retain the localized title and listing reference", () => {
  for (const lang of ["es", "en"]) {
    for (const publicationSection of ["properties", "developments"]) {
      const item = { ...property, publicationSection };
      const html = seo.renderPropertyPage(item, lang).html;
      const links = whatsappLinks(html);
      const title = lang === "en" ? item.titleEn : item.titleEs;
      assert.equal(links.length, 0);
      assert.ok(html.includes('data-property-id="' + item.id + '"'));
      assert.ok(html.includes('data-property-title="' + title.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"'));
      for (const intent of publicationSection === "developments" ? ["buy","rent","sell","let"] : ["buy"]) assert.ok(html.includes('data-intent="' + intent + '"'));
      assert.doesNotMatch(html, /data-business-contact=/, "Catalog hydration must not remove contextual messages");
    }
  }
});

test("catalog cards offer one inquiry preserving the original listing and its language", () => {
  for (const lang of ["es", "en"]) {
    const page = { path: lang === "en" ? "/en/properties" : "/propiedades", lang, h1: "Inventory", filter: {} };
    const html = seo.renderCategoryPage(page, [property], {});
    const card = html.match(/<article class="seo-property-card"[\s\S]*?<\/article>/)[0];
    assert.equal(whatsappLinks(card).length, 0);
    const cta = card.match(/<a\b[^>]+data-contact-inquiry[^>]*>/g);
    assert.equal(cta.length, 1);
    const href = new URL(cta[0].match(/href="([^"]+)"/)[1].replace(/&amp;/g, "&"), "https://example.invalid");
    assert.equal(href.pathname, lang === "en" ? "/en/contact" : "/contacto");
    assert.equal(href.searchParams.get("propertyId"), property.id);
    assert.equal(href.searchParams.get("propertyTitle"), lang === "en" ? property.titleEn : property.titleEs);
    assert.doesNotMatch(card, /data-business-contact=/);
  }
});

test("legacy listing and general contact helpers open the same inquiry with the correct context", () => {
  const source = read("app.js");
  const start = source.indexOf("function openPropertyWhatsApp(");
  const end = source.indexOf("function closeMobileNav(", start);
  assert.ok(start > 0 && end > start);
  const helpers = source.slice(start, end);
  const calls = [];
  const context = {
    window: {
      PccInquiry: { open: data => calls.push(data) },
    },
    localizedTitle: (item) => item.titleEs,
  };
  vm.runInNewContext(helpers, context);
  context.openPropertyWhatsApp(property);
  let prevented = false;
  context.openGeneralWhatsApp({ preventDefault: () => { prevented = true; } });
  assert.ok(prevented);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].propertyTitle, property.titleEs);
  assert.equal(calls[0].propertyId, property.id);
  assert.equal(calls[0].intent, "buy");
  assert.equal(calls[1].origin, "general-contact");
  assert.doesNotMatch(helpers, /wa\.me|sent|delivered|sendMessage/);
});
