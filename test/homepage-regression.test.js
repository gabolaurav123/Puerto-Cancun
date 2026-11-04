const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const inventory = require("../inventory-contract");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("la portada restaura su jerarquia sin el bloque de destacadas y conserva sus enlaces", () => {
  const app = read("app.js");
  const index = read("index.html");
  const styles = read("styles.css");
  const catalogStyles = read("catalog.css");
  assert.match(index, /class="properties-section home-only" id="properties" hidden/);
  assert.match(app, /if \(section\) section\.hidden = isHome/);
  assert.match(catalogStyles, /body\[data-page=home\] #properties \{ display: none; \}/);
  assert.doesNotMatch(catalogStyles, /body\[data-page=home\] \.hero(?:\s|[.{-])/);
  assert.match(index, /class="contact-strip home-only"/);
  assert.match(index, /data-i18n="contactToday"/);
  assert.match(index, /data-business-contact="mx"/);
  assert.match(index, /data-business-contact="us"/);
  assert.equal((index.match(/class="presale-feature"/g) || []).length, 1);
  assert.ok(index.indexOf('class="presale-feature"') > index.indexOf('class="type-grid"'));
  assert.ok(index.indexOf('class="presale-feature"') < index.indexOf('id="categoryPage"'));
  assert.match(index, /<a class="login-link" href="\/\?auth=login" id="loginOpen"/);
  assert.match(index, /id="whatsappButton"[\s\S]*href="https:\/\/wa\.me\/5219982166563/);
  assert.match(styles, /body\[data-page="home"\] \.hero h1[\s\S]*font-size: 4\.25rem/);
});

function homeCoverRuntime(properties) {
  const selectors = [
    ...Array.from({ length: 4 }, (_, i) => `.type-grid .type-tile:nth-child(${i + 1})`),
    ...Array.from({ length: 4 }, (_, i) => `.zone-grid .zone-card:nth-child(${i + 1})`),
    ".presale-feature",
  ];
  const cards = selectors.map((selector, index) => {
    const classes = new Set(["has-home-cover"]);
    const image = {
      hidden: false, src: "/old-photo.webp", srcset: "/old-photo-large.webp 2x", alt: "Anterior",
      dataset: { fallbackApplied: "true" }, removeAttribute(name) { delete this[name]; },
    };
    return {
      selector, image, classes, href: `/destination-${index}`, hidden: false,
      classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
      querySelector: selector => selector === "[data-home-cover]" ? image : null,
    };
  });
  const state = { properties };
  const source = read("app.js");
  const functions = ["updateHomeEditorialImages", "storedImages", "optimizedMediaUrl"].map(name => {
    const match = source.match(new RegExp(`function ${name}\\([^]*?\\n}`));
    assert.ok(match, `missing function ${name}`);
    return match[0];
  });
  const update = vm.runInNewContext(`${functions.join("\n")}\nupdateHomeEditorialImages`, {
    state, window: { PccInventory: inventory }, localizedTitle: property => property.titleEs,
    document: { querySelector: selector => cards.find(card => card.selector === selector) || null },
  }, { timeout: 1000 });
  return { update, state, cards };
}

function homeProperty(id, type, zone, extra = {}) {
  return {
    id, titleEs: `Fotografía de ${id}`, type, zone, city: "Cancún", status: "active", isPublic: true,
    publicationSection: type === "Desarrollo" ? "developments" : "properties",
    images: [`/media/properties/${id}/0`], ...extra,
  };
}

test("las tarjetas de inicio parten de un fondo neutro sin mostrar fotos de stock", () => {
  const index = read("index.html");
  const covers = [...index.matchAll(/<img\b[^>]*\bdata-home-cover\b[^>]*>/g)].map(match => match[0]);
  assert.equal(covers.length, 9, "cuatro tipos, cuatro zonas y preventas");
  for (const image of covers) {
    assert.match(image, /\bhidden\b/);
    assert.doesNotMatch(image, /\s(?:src|srcset)=/);
  }
});

test("las portadas respetan tipo y zona, excluyen imágenes externas y registros privados, y no mutan el inventario", () => {
  const properties = [
    homeProperty("private-house", "Casa", "Puerto Cancún", { isPublic: false }),
    homeProperty("draft-house", "Casa", "Puerto Cancún", { status: "draft" }),
    homeProperty("archived-condo", "Departamento", "Zona Hotelera", { status: "archived" }),
    homeProperty("stock-house", "Casa", "Puerto Cancún", { images: ["https://images.example.test/stock.jpg"] }),
    homeProperty("stock-land", "Terreno", "Tulum", { images: ["/assets/type-land-cancun-720.webp"] }),
    homeProperty("house", "Casa", "Puerto Cancún", { images: ["https://images.example.test/stock.jpg", "/media/properties/house/0"] }),
    homeProperty("condo", "Departamento", "Zona Hotelera", { images: [], image: "/media/properties/condo/0" }),
    homeProperty("land", "Terreno", "Tulum"),
    homeProperty("office", "Comercial", "Huayacán"),
    homeProperty("hotel-zone", "Desarrollo", "Zona Hotelera"),
    homeProperty("puerto", "Desarrollo", "Puerto Cancún"),
    homeProperty("city", "Desarrollo", "Huayacán"),
    homeProperty("outside", "Desarrollo", "Tulum"),
    homeProperty("presale", "Desarrollo", "Puerto Cancún", { salesModality: "presale" }),
  ];
  const before = JSON.stringify(properties);
  for (const property of properties) { Object.freeze(property.images); Object.freeze(property); }
  Object.freeze(properties);
  const { update, cards } = homeCoverRuntime(properties);
  update();
  const expected = ["house", "condo", "land", "office", "hotel-zone", "puerto", "city", "outside", "presale"];
  cards.forEach((card, index) => {
    assert.equal(card.image.src, `/media/properties/${expected[index]}/0?w=640`);
    assert.equal(card.image.alt, `Fotografía de ${expected[index]}`);
    assert.equal(card.image.hidden, false);
    assert.equal(card.classes.has("has-home-cover"), true);
    assert.equal(card.image.srcset, undefined);
    assert.equal(card.image.dataset.fallbackApplied, undefined);
    assert.equal(card.hidden, false);
  });
  assert.equal(new Set(cards.map(card => card.image.src)).size, 9);
  assert.equal(JSON.stringify(properties), before);
});

test("sin una foto compatible la tarjeta conserva su enlace y limpia la portada anterior", () => {
  const property = homeProperty("only-house", "Casa", "Puerto Cancún");
  const { update, state, cards } = homeCoverRuntime([property]);
  update();
  assert.equal(cards[0].image.src, "/media/properties/only-house/0?w=640");
  assert.equal(cards[5].image.src, cards[0].image.src, "reutilizar una foto pertinente es válido si no hay otra para la zona");
  assert.equal(cards[2].image.src, undefined, "un terreno no puede usar la foto de una casa");
  assert.equal(cards[2].image.hidden, true);
  state.properties = [];
  update();
  cards.forEach((card, index) => {
    assert.equal(card.image.hidden, true);
    assert.equal(card.image.src, undefined);
    assert.equal(card.image.srcset, undefined);
    assert.equal(card.image.alt, "");
    assert.equal(card.classes.has("has-home-cover"), false);
    assert.equal(card.hidden, false);
    assert.equal(card.href, `/destination-${index}`);
  });
});

test("el panel privado no se convierte en otra portada", () => {
  const app = read("app.js");
  const server = read("server.js");
  assert.match(app, /document\.body\.dataset\.page === "panel"[\s\S]*window\.location\.assign\("\/"\)/);
  assert.match(server, /new URLSearchParams\(\{ auth: "login" \}\)/);
  assert.match(server, /res\.redirect\(302, `\/\?\$\{context\}`\)/);
  assert.match(server, /res\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(server, /function renderAuthenticatedPanelEntry\(html, role\)/);
  assert.match(server, /id="siteShell" hidden/);
  assert.match(server, /renderAuthenticatedPanelEntry\(panelHtml, req\.session\.user\.role\)/);
});

test("el acceso conserva la accion al redirigir el idioma", () => {
  const app = read("app.js");
  const server = read("server.js");
  assert.match(app, /window\.location\.assign\(alternate \? `\$\{alternate\}\$\{window\.location\.search\}\$\{window\.location\.hash\}`/);
  assert.doesNotMatch(app, /if \(storedLanguage[^]*?window\.location\.replace/);
  assert.match(server, /function renderAuthEntry\(html, requestedTab\)/);
  assert.match(server, /html = renderAuthEntry\(html, req\.query\.auth\)/);
});

test("el blog nace con articulos editoriales bilingues publicados", () => {
  const server = read("server.js");
  assert.match(server, /const seedBlogPosts = \[/);
  assert.match(server, /post-guia-compra-cancun/);
  assert.match(server, /post-preparar-venta-cancun/);
  assert.match(server, /post-elegir-zona-cancun/);
  assert.match(server, /VALUES[\s\S]*'published', 'Puerto Cancun Center'/);
});

test("la ficha ofrece el Blog únicamente si hay artículos publicados en su idioma", async (t) => {
  const { app } = require("../server");
  const { Pool } = require("pg");
  let hasEnglish = false;
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  t.mock.method(Pool.prototype, "query", async (sql, params) => {
    if (sql.includes("FROM blog_posts")) return { rows: [{ available: params[0] === "es" || hasEnglish }] };
    if (sql.includes("FROM properties p WHERE p.is_public")) {
      return { rows: [{ id: "test-blog-nav", slug: "test-blog-nav", type: "Casa", is_public: true, status: "active", title_es: "Casa", title_en: "House" }] };
    }
    return { rows: [] };
  });
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.once("listening", resolve));
  const menu = async (path) => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /data-page="property"/);
    return html.match(/<a\s+href="(\/[^"]*blog)"[^>]*data-i18n="resourceBlog"/)?.[1];
  };
  assert.equal(await menu("/propiedades/test-blog-nav"), "/blog");
  assert.equal(await menu("/en/properties/test-blog-nav"), undefined);
  hasEnglish = true;
  now += 61_000;
  assert.equal(await menu("/en/properties/test-blog-nav"), "/en/blog");
});
