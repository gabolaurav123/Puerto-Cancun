const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

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

test("zonas y tipos no repiten una sola imagen", () => {
  const index = read("index.html");
  const app = read("app.js");
  const section = index.match(/<div class="zone-grid">([\s\S]*?)<\/div>[\s\S]*?<div class="type-grid">([\s\S]*?)<\/div>/);
  assert.ok(section, "deben existir las zonas y los tipos editoriales");
  const images = [...section[0].matchAll(/src="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(new Set(images).size >= 4, "deben existir por lo menos cuatro imagenes distintas");
  assert.match(app, /const usedImages = new Set\(\)/);
  assert.match(app, /\.type-grid \.type-tile:nth-child\(3\)/);
  assert.match(app, /PccInventory\.resolveLocation\(property\)/);
  assert.match(index, /data-commercial-location="cancun-city"/);
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
