const test = require("node:test");
const assert = require("node:assert/strict");
const { getPageByPath, renderCategoryPage } = require("../seo-pages");
const portal = require("../portal-directory");

const development = {
  id: "master", type: "Desarrollo", publicationSection: "developments", status: "active", isPublic: true,
  titleEs: "Residencias del Muelle", titleEn: "Pier Residences", descriptionEs: "Residencias frente al muelle.",
  descriptionEn: "Residences on the pier.", zone: "Puerto Cancún", city: "Cancún", neighborhood: "Marina", state: "Quintana Roo",
  address: "7, Circuito Marina", latitude: 21.161, longitude: -86.811, locationPrecision: "exact",
  amenities: ["Alberca"], catalogData: { salesModality: "presale" }, images: ["/media/properties/master/0"],
  urlEs: "/propiedades/residencias-del-muelle", urlEn: "/en/properties/pier-residences",
};

function render(master, lang, detail, edit = () => {}) {
  const config = portal.materialize(null, [master]);
  edit(config);
  const directory = portal.publicDirectory(config, [master]);
  const page = { ...getPageByPath(lang === "en" ? "/en/cancun-presales" : "/preventas-cancun"), portalDirectory: directory };
  return renderCategoryPage(page, portal.enrichProperties([master], directory), detail ? {project: "presale-master"} : {});
}

test("a linked presale keeps its public description and cover, with compact card location and full detail location in each language", () => {
  for (const lang of ["es", "en"]) {
    const en = lang === "en";
    for (const detail of [false, true]) {
      const html = render(development, lang, detail);
      assert.ok(html.includes(en ? development.descriptionEn : development.descriptionEs));
      assert.match(html, /Puerto Canc(?:u|ú)n/);
      assert.match(html, /src="\/media\/properties\/master\/0\?w=(640|960)"/);
      if (detail) {
        assert.ok(html.includes(development.address));
        assert.match(html, /data-public-location[^>]*data-location-precision="exact"/);
        assert.ok(html.includes(en ? "Swimming pool" : "Alberca"));
        assert.ok(html.includes(`href="${en ? development.urlEn : development.urlEs}"`));
        assert.ok(html.includes(en ? ">View development details</a>" : ">Ver ficha del desarrollo</a>"));
        assert.match(html, /data-origin="presale-project"/);
        assert.match(html, /data-reference="master"/);
      } else {
        assert.ok(!html.includes(development.address), "the street belongs in the detail location section");
      }
    }
  }
});

test("editorial descriptions and images take precedence per language, and approximate locations withhold the street", () => {
  const master = { ...development, locationPrecision: "approximate" };
  const edit = config => Object.assign(config.presales[0], {
    descriptionEs: "Nueva descripción de preventa.", descriptionEn: "Pending.", image: "/assets/presale-approved.webp",
  });
  const es = render(master, "es", true, edit);
  assert.match(es, /Nueva descripción de preventa/); assert.doesNotMatch(es, /Residencias frente al muelle/);
  assert.ok(es.includes("/assets/presale-approved.webp"));
  assert.ok(es.includes("Marina")); assert.ok(es.includes("Puerto Cancún")); assert.ok(!es.includes(development.address));
  assert.match(es, /data-public-location[\s\S]*data-location-precision="unavailable"/);
  assert.match(es, /Ubicación por confirmar/);
  assert.doesNotMatch(es, /data-location-query|data-location-canvas/);
  assert.ok(render(master, "en", true, edit).includes(development.descriptionEn));
});

test("presale project office buttons open each WhatsApp number directly with its localized project context", () => {
  const contacts = require("../contact-config").contacts;
  for (const lang of ["es", "en"]) {
    const html = render(development,lang,true,config => { config.presales[0].reference = "PRESALE-7"; });
    const projectPath = (lang === "en" ? "/en/cancun-presales" : "/preventas-cancun") + "?project=presale-master";
    for (const {id,number,display} of contacts) {
      const tag = html.match(new RegExp('<a [^>]*data-origin="presale-whatsapp"[^>]*data-office="' + id + '"[^>]*>.*?</a>'))?.[0];
      assert.ok(tag,`${lang}: office ${id}`);
      const url = new URL(tag.match(/href="([^"]+)"/)[1].replaceAll("&amp;","&"));
      assert.equal(url.origin,"https://wa.me");
      assert.equal(url.pathname,"/" + number);
      const message = url.searchParams.get("text");
      assert.ok(message.includes(lang === "en" ? development.titleEn : development.titleEs));
      assert.ok(message.includes("PRESALE-7"));
      assert.ok(message.includes("https://www.puertocancun.center" + projectPath));
      assert.ok(!tag.includes(display));
      assert.doesNotMatch(tag,/data-contact-inquiry|data-business-contact/);
      assert.match(tag,/target="_blank" rel="noopener noreferrer"/);
    }
    assert.match(html,/data-contact-inquiry[^>]*data-intent="buy"[^>]*data-project-id="presale-master"/);
    assert.doesNotMatch(html,/data-intent="(?:sell|rent|let)"/);
  }
});

test("presale listings respect hidden development blocks and unpublished linked developments", () => {
  const edit = config => {
    config.assignments.master = { areaId: "puerto-cancun", hiddenBlocks: ["gallery", "location", "description", "amenities"] };
    config.presales[0].image = development.images[0];
  };
  for (const detail of [true, false]) {
    const html = render(development, "en", detail, edit);
    for (const value of [development.address, development.descriptionEn, development.images[0], "Swimming pool", "21.161"]) assert.ok(!html.includes(value), value);
  }
  const privateHtml = render({ ...development, isPublic: false }, "en", true);
  assert.doesNotMatch(privateHtml, /data-origin="presale-project"|Pier Residences|Residences on the pier/);
});
