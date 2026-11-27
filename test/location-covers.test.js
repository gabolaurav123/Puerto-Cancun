const test = require("node:test");
const assert = require("node:assert/strict");
const inventory = require("../inventory-contract");
const { publicDirectory } = require("../portal-directory");
const { areaCards, renderHomeCovers } = require("../exploration-view");
const { homeEditorialCovers } = require("../public-listing-details");

const house = {
  id: "real", type: "Casa", status: "active", isPublic: true, zone: "Puerto Cancún",
  titleEs: 'Casa "Mar" & Sol', titleEn: 'House "Sea" & Sun', images: ["/media/properties/real/0"],
};

test("las portadas de zona usan únicamente fotos públicas del lugar y respetan la selección editorial", () => {
  const areas = inventory.LOCATIONS.map(area => area.id === "zona-hotelera" ? { ...area, image: "/media/editorial/hotel.webp" } : area);
  const rows = [
    house,
    { ...house, id: "private", isPublic: false, zone: "Mérida", images: ["/media/properties/private/0"] },
    { ...house, id: "stock", zone: "Cancún Centro", images: ["https://example.test/stock.jpg"] },
    { ...house, id: "hidden", zone: "Tulum", portalHiddenBlocks: ["gallery"], images: ["/media/properties/hidden/0"] },
    { ...house, id: "hotel", zone: "Zona Hotelera", images: ["/media/properties/hotel/0"] },
  ];
  const covers = homeEditorialCovers(rows, areas);
  assert.deepEqual(covers.get("area:puerto-cancun"), { src: house.images[0] + "?w=640", alt: house.titleEs });
  assert.deepEqual([...covers.keys()].filter(key => key.startsWith("area:")), ["area:puerto-cancun"]);
  const html = renderHomeCovers(areaCards({ areas }, "es"), rows, areas, "es");
  assert.match(html, /data-home-cover="area:zona-hotelera"[^>]+src="\/media\/editorial\/hotel.webp"/);
  assert.doesNotMatch(html, /properties\/(?:hidden|private)|example\.test/);
});

test("las fotos elegidas se entregan en el HTML antes de JavaScript y coinciden con el idioma y el inventario", () => {
  const { getPageByPath, renderSeoHead } = require("../seo-pages");
  const { decoratePublicHtml } = require("../server");
  const directory = publicDirectory(null, []);
  for (const lang of ["es", "en"]) {
    const page = getPageByPath(lang === "es" ? "/" : "/en");
    const html = decoratePublicHtml({ page, seo: renderSeoHead(page, "https://example.test"), bodyPage: "home", homeProperties: [house] });
    const covers = homeEditorialCovers([house], directory.areas, lang);
    const tags = [...html.matchAll(/<img\b[^>]*\bdata-home-cover="([^"]+)"[^>]*>/g)];
    assert.equal(tags.length, 5 + directory.areas.length);
    for (const [tag, slot] of tags) {
      if (covers.has(slot)) {
        assert.ok(tag.includes(`src="${covers.get(slot).src}"`));
        assert.ok(tag.includes(lang === "es" ? "Casa &quot;Mar&quot; &amp; Sol" : "House &quot;Sea&quot; &amp; Sun"));
        assert.doesNotMatch(tag, /\shidden\b/);
      } else {
        assert.match(tag, /\shidden\b/);
        assert.doesNotMatch(tag, /\ssrc=/);
      }
    }
  }
});
