const assert = require("node:assert/strict");
const test = require("node:test");
const { propertyPath, renderPropertyPage } = require("../seo-pages");
const { renderListingAmenities } = require("../public-listing-details");

const development = {
  id: "development-order-test",
  slug: "development-order-test",
  titleEs: "Residencial de prueba",
  titleEn: "Test development",
  descriptionEs: "Informacion del desarrollo.",
  descriptionEn: "Development information.",
  publicationSection: "developments",
  type: "Desarrollo",
  images: [],
};
const unit = {
  id: "unit-order-test",
  slug: "unit-order-test",
  titleEs: "Departamento vinculado",
  titleEn: "Linked apartment",
  descriptionEs: "Informacion de la propiedad.",
  descriptionEn: "Property information.",
  publicationSection: "properties",
  type: "Departamento",
  currency: "USD",
  price: 1200000,
  images: [],
};

for (const lang of ["es", "en"]) {
  test(`a property links to its published development in the current language (${lang})`, () => {
    const parent = { ...development, status: "active", titleEs: "Riva & Marina", titleEn: "Riva & Marina Residences", locationPrecision: "hidden" };
    const linkedUnit = { ...unit, portalDevelopmentId: parent.id, amenities: ["Alberca"] };
    const path = propertyPath(parent, lang);
    const label = lang === "en" ? "Linked development" : "Desarrollo vinculado";
    const name = lang === "en" ? "Riva &amp; Marina Residences" : "Riva &amp; Marina";
    const page = renderPropertyPage(linkedUnit, lang, [], {}, [parent]).html;
    const preview = renderListingAmenities(linkedUnit, { lang, properties: [parent] }, 3);
    for (const html of [page, preview]) {
      assert.equal(html.split(`href="${path}"`).length - 1, 1);
      const amenities = html.match(/<section class="property-amenities">([\s\S]*?)<\/section>/)[1];
      const link = amenities.match(/<a href="([^"]+)">([\s\S]*?)<\/a>/);
      assert.equal(link[1], path);
      assert.ok(link[2].includes(label) && link[2].includes(name));
      assert.ok(amenities.includes(lang === "en" ? "<li>Swimming pool</li>" : "<li>Alberca</li>"));
    }
  });

  test(`development linked properties precede the contextual inquiry (${lang})`, () => {
    const { html } = renderPropertyPage(development, lang, [unit]);
    const relatedIndex = html.indexOf('<section class="similar-properties">');
    const leadIndex = html.indexOf('<section class="property-lead"');
    assert.ok(relatedIndex > html.indexOf('class="property-long-description"'));
    assert.ok(leadIndex > relatedIndex);
    const cards = html.slice(relatedIndex, leadIndex);
    assert.match(cards, /data-category-property/);
    assert.ok(cards.includes(lang === "en" ? unit.titleEn : unit.titleEs));
    assert.ok(cards.includes(`href="${propertyPath(unit, lang)}"`));
    assert.equal((html.match(/class="similar-properties"/g) || []).length, 1);
    assert.equal((html.match(/class="property-lead"/g) || []).length, 1);
    assert.ok(html.slice(leadIndex).includes(`data-development-id="${development.id}"`));
    assert.ok(!html.slice(leadIndex).includes(`data-property-id="${development.id}"`), "A development must not be submitted as a specific unit");
  });

  test(`development without linked properties keeps the contextual inquiry (${lang})`, () => {
    const { html } = renderPropertyPage(development, lang, []);
    assert.doesNotMatch(html, /class="similar-properties"/);
    assert.equal((html.match(/class="property-lead"/g) || []).length, 1);
  });

  test(`ordinary property recommendations retain their existing order (${lang})`, () => {
    const { html } = renderPropertyPage(unit, lang, [{ ...unit, id: "other-unit", slug: "other-unit" }]);
    const leadIndex = html.indexOf('<section class="property-lead"');
    const relatedIndex = html.indexOf('<section class="similar-properties">');
    assert.ok(leadIndex > 0);
    assert.ok(relatedIndex > leadIndex);
  });
}

test("the development link remains when amenities are empty or hidden, including legacy relations", () => {
  const parent = { ...development, slug: "", status: "featured", developmentData: { id: "legacy-development" }, titleEn: "" };
  const legacy = { ...unit, parentDevelopment: { id: parent.developmentData.id } };
  for (const property of [legacy, { ...legacy, amenities: ["Gym"], portalHiddenBlocks: ["amenities"] }]) {
    const html = renderPropertyPage(property, "en", [], {}, [parent]).html;
    assert.ok(html.includes(`href="${propertyPath(parent, "en")}"`));
    assert.ok(html.includes(parent.titleEs));
    assert.doesNotMatch(html, /class="property-amenities"/);
  }
});

test("unpublished, unlinked and unrelated records have no development link", () => {
  const parent = { ...development, status: "active" };
  const linkedUnit = { ...unit, parentDevelopment: { propertyId: parent.id, nameEs: parent.titleEs } };
  for (const [property, records] of [
    [unit, [parent]], [linkedUnit, []], [linkedUnit, [{ ...parent, status: "draft" }]],
    [linkedUnit, [{ ...parent, isPublic: false }]], [linkedUnit, [{ ...unit, id: parent.id, status: "active" }]],
    [{ ...linkedUnit, portalDevelopmentId: "" }, [parent]], [{ ...linkedUnit, portalDevelopmentId: "other" }, [parent]],
    [{ ...parent, portalDevelopmentId: parent.id }, [parent]],
  ]) {
    assert.doesNotMatch(renderPropertyPage(property, "es", [], {}, records).html, /class="listing-development"/);
  }
});
