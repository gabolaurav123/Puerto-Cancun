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

test("Spanish and English contact pages expose both countries from central config", () => {
  for (const [route, lang] of [["/contacto", "es"], ["/en/contact", "en"]]) {
    const page = seo.getPageByPath(route);
    const html = seo.renderSeoPage(route);
    const links = whatsappLinks(html);
    assert.equal(links.length, 4);
    for (const contact of contacts.contacts) {
      const countryLinks = links.filter(({ url }) => url.pathname === `/${contact.number}`);
      assert.equal(countryLinks.length, 2);
      assert.ok(countryLinks.every(({ url, label }) => url.searchParams.get("text") === page.whatsappMessage && label.includes(lang === "en" ? contact.labelEn : contact.label)));
      assert.ok(countryLinks.some(({ label }) => label.includes(contact.display)));
    }
  }
  assert.equal(seo.business.telephone, contacts.contacts.find(({ id }) => id === "mx").display);
  assert.doesNotMatch(read("seo-pages.js"), /wa\.me\/\d+|5219982166563|19562518956/);
});

test("property and development WhatsApp links retain localized title and canonical context for both countries", () => {
  for (const lang of ["es", "en"]) {
    for (const publicationSection of ["properties", "developments"]) {
      const item = { ...property, publicationSection };
      const html = seo.renderPropertyPage(item, lang).html;
      const links = whatsappLinks(html);
      const title = lang === "en" ? item.titleEn : item.titleEs;
      assert.ok(links.length >= 3);
      for (const contact of contacts.contacts) assert.ok(links.some(({ url }) => url.pathname === `/${contact.number}`));
      for (const { url } of links) {
        const message = url.searchParams.get("text");
        assert.ok(message.includes(title));
        assert.ok(message.includes(seo.absoluteUrl(seo.propertyPath(item, lang))));
        assert.equal([...url.searchParams].length, 1);
        assert.equal(url.hash, "");
      }
      assert.doesNotMatch(html, /data-business-contact=/, "Catalog hydration must not remove contextual messages");
    }
  }
});

test("catalog cards offer both destinations without mixing the property context", () => {
  for (const lang of ["es", "en"]) {
    const page = { path: lang === "en" ? "/en/properties" : "/propiedades", lang, h1: "Inventory", filter: {} };
    const html = seo.renderCategoryPage(page, [property], {});
    const card = html.match(/<article class="seo-property-card"[\s\S]*?<\/article>/)[0];
    const links = whatsappLinks(card);
    assert.equal(links.length, 2);
    for (const contact of contacts.contacts) {
      const { url } = links.find(({ url }) => url.pathname === `/${contact.number}`);
      assert.ok(url.searchParams.get("text").includes(lang === "en" ? property.titleEn : property.titleEs));
      assert.ok(url.searchParams.get("text").includes(seo.absoluteUrl(seo.propertyPath(property, lang))));
    }
    assert.doesNotMatch(card, /data-business-contact=/);
  }
});

test("public browser helpers delegate to contact config, preserve settings and only track clicks", () => {
  const source = read("app.js");
  const start = source.indexOf("function openPropertyWhatsApp(");
  const end = source.indexOf("function closeMobileNav(", start);
  assert.ok(start > 0 && end > start);
  const helpers = source.slice(start, end);
  const requests = [], events = [], opened = [], calls = [];
  const state = { settings: { site: { phone: "keep-phone", whatsapp: "keep-whatsapp" } } };
  const before = JSON.stringify(state);
  const context = {
    state,
    window: {
      location: { pathname: "/propiedades" },
      PccContacts: { whatsappUrl: (id, message) => { calls.push({ id, message }); return contacts.whatsappUrl(id, message); } },
      open: (...args) => opened.push(args),
    },
    api: (route, options) => { requests.push({ route, options }); return Promise.resolve({}); },
    trackAnalyticsEvent: (event) => { events.push(event); return Promise.resolve(); },
    localizedTitle: (item) => item.titleEs, formatPriceSummary: () => "USD $1,000,000",
    displayLocation: (item) => item.zone, displayType: (type) => type,
  };
  vm.runInNewContext(helpers, context);
  context.openPropertyWhatsApp(property);
  let prevented = false;
  context.openGeneralWhatsApp({ preventDefault: () => { prevented = true; } });
  assert.ok(prevented);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(({ id }) => id === "mx"));
  assert.ok(calls[0].message.includes(property.titleEs));
  assert.equal(new URL(opened[0][0]).searchParams.get("text"), calls[0].message);
  assert.ok(opened.every(([url, target, rel]) => new URL(url).pathname === "/5219982166563" && target === "_blank" && rel === "noopener,noreferrer"));
  assert.deepEqual(events, ["property_contact_clicked", "whatsapp_clicked"]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].route, "/api/leads");
  assert.equal(requests[0].options.body.propertyId, property.id);
  assert.equal(JSON.stringify(state), before);
  assert.doesNotMatch(helpers, /wa\.me|sent|delivered|sendMessage/);
});
