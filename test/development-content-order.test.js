const assert = require("node:assert/strict");
const test = require("node:test");
const { propertyPath, renderPropertyPage } = require("../seo-pages");

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
  test(`development linked properties precede the visit form (${lang})`, () => {
    const { html } = renderPropertyPage(development, lang, [unit]);
    const relatedIndex = html.indexOf('<section class="similar-properties">');
    const leadIndex = html.indexOf('<section class="property-lead">');
    assert.ok(relatedIndex > html.indexOf('class="property-long-description"'));
    assert.ok(leadIndex > relatedIndex);
    const cards = html.slice(relatedIndex, leadIndex);
    assert.match(cards, /data-category-property/);
    assert.ok(cards.includes(lang === "en" ? unit.titleEn : unit.titleEs));
    assert.ok(cards.includes(`href="${propertyPath(unit, lang)}"`));
    assert.equal((html.match(/class="similar-properties"/g) || []).length, 1);
    assert.equal((html.match(/class="property-lead"/g) || []).length, 1);
    assert.ok(html.slice(leadIndex).includes(`name="propertyId" value="${development.id}"`));
  });

  test(`development without linked properties keeps the visit form (${lang})`, () => {
    const { html } = renderPropertyPage(development, lang, []);
    assert.doesNotMatch(html, /class="similar-properties"/);
    assert.equal((html.match(/class="property-lead"/g) || []).length, 1);
  });

  test(`ordinary property recommendations retain their existing order (${lang})`, () => {
    const { html } = renderPropertyPage(unit, lang, [{ ...unit, id: "other-unit", slug: "other-unit" }]);
    const leadIndex = html.indexOf('<section class="property-lead">');
    const relatedIndex = html.indexOf('<section class="similar-properties">');
    assert.ok(leadIndex > 0);
    assert.ok(relatedIndex > leadIndex);
  });
}
