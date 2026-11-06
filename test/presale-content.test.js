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

test("a linked presale shows the same public description, cover and location on its card and detail in each language", () => {
  for (const lang of ["es", "en"]) {
    const en = lang === "en";
    for (const detail of [false, true]) {
      const html = render(development, lang, detail);
      assert.ok(html.includes(en ? development.descriptionEn : development.descriptionEs));
      assert.ok(html.includes(development.address));
      assert.match(html, /src="\/media\/properties\/master\/0\?w=(640|960)"/);
      if (detail) {
        assert.ok(html.includes(en ? "Swimming pool" : "Alberca"));
        assert.ok(html.includes(`href="${en ? development.urlEn : development.urlEs}"`));
        assert.match(html, /data-origin="presale-project"/);
        assert.match(html, /data-reference="master"/);
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
  assert.ok(es.includes("Marina, Cancún, Quintana Roo")); assert.ok(!es.includes(development.address));
  assert.ok(render(master, "en", true, edit).includes(development.descriptionEn));
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
