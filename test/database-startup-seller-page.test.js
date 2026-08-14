const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const seoPages = fs.readFileSync(path.join(root, "seo-pages.js"), "utf8");

test("guest sale indexes are created only after their table exists", () => {
  const tablePosition = server.indexOf("CREATE TABLE IF NOT EXISTS guest_sale_requests");
  const statusIndexPosition = server.indexOf("CREATE INDEX IF NOT EXISTS idx_guest_sale_requests_status_created");
  const contactIndexPosition = server.indexOf("CREATE INDEX IF NOT EXISTS idx_guest_sale_requests_contact");

  assert.ok(tablePosition >= 0, "guest_sale_requests table must be defined");
  assert.ok(statusIndexPosition > tablePosition, "status index must be created after the table");
  assert.ok(contactIndexPosition > tablePosition, "contact index must be created after the table");
});

test("sell pages begin with the process summary and retain both selling calls to action", () => {
  const spanishStart = seoPages.indexOf('path: "/vender-casa-cancun"');
  const spanishEnd = seoPages.indexOf('path: "/comprar-casa-cancun"', spanishStart);
  const spanishPage = seoPages.slice(spanishStart, spanishEnd);
  const englishStart = seoPages.indexOf("function renderEnglishSellPage");
  const englishEnd = seoPages.indexOf("function renderSeoPage", englishStart);
  const englishPage = seoPages.slice(englishStart, englishEnd);

  assert.doesNotMatch(spanishPage, /ELIGE CÓMO EMPEZAR|Cómo empezamos a preparar tu venta/);
  assert.match(spanishPage, /Como trabajamos tu venta/);
  assert.match(spanishPage, /Por que usar Puerto Cancun Center/);
  assert.match(spanishPage, /PUBLICA CON ACOMPAÑAMIENTO/);
  assert.match(spanishPage, /PUBLICA DE MANERA SENCILLA/);

  assert.doesNotMatch(englishPage, /CHOOSE HOW TO START|Understand the process before registering/);
  assert.match(englishPage, /How we support your sale/);
  assert.match(englishPage, /Benefits of listing with us/);
  assert.match(englishPage, /LIST WITH GUIDANCE/);
  assert.match(englishPage, /START WITH THE ESSENTIALS/);
});
