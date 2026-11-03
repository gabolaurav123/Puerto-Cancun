const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const test = require("node:test");
const { renderPropertyPage } = require("../seo-pages");

test("la galería móvil conserva foto completa, navegación táctil y controles accesibles", {
  skip: process.env.PCC_LAYOUT_BROWSER !== "1",
}, async (t) => {
  const { chromium } = require("playwright");
  const appSource = fs.readFileSync(require.resolve("../app.js"), "utf8");
  const scripts = ["containDialogFocus", "initializePropertyGallery"]
    .map(name => appSource.match(new RegExp(`function ${name}\\([^]*?\\n}`))[0]).join("\n");
  const property = {
    id: "mobile-gallery", type: "Casa", titleEs: "Galería móvil", titleEn: "Mobile gallery",
    images: ["/media/properties/mobile-gallery/0", "/media/properties/mobile-gallery/1"],
    imageMetadata: [{ descriptionEs: "Imagen vertical" }, { descriptionEs: "Imagen horizontal" }],
  };
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    if (req.url === "/styles.css") {
      res.setHeader("Content-Type", "text/css");
      return res.end(fs.readFileSync(require.resolve("../styles.css")));
    }
    if (req.url.startsWith("/media/")) {
      const vertical = req.url.includes("/0?");
      res.setHeader("Content-Type", "image/svg+xml");
      return res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="${vertical ? 300 : 900}" height="${vertical ? 900 : 300}"><rect width="100%" height="100%" fill="teal"/></svg>`);
    }
    res.setHeader("Content-Type", "text/html");
    res.end(`<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css">${renderPropertyPage(property).html}<script>const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];${scripts}\ninitializePropertyGallery();</script>`);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ executablePath: process.env.PCC_LAYOUT_CHROMIUM });
  t.after(() => browser.close());
  for (const [width, height] of [[320, 740], [390, 844], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const modal = page.locator("[data-property-gallery-modal]");
    const image = modal.locator("[data-gallery-modal-image]");
    assert.equal(await image.getAttribute("src"), null, "The expanded image loads when the visitor opens it");
    await page.locator("[data-open-property-gallery]").tap();
    await page.waitForFunction(() => document.querySelector("[data-gallery-modal-image]").naturalWidth > 0);
    const dimensions = await image.evaluate(element => ({
      image: element.getBoundingClientRect().height,
      stage: element.parentElement.getBoundingClientRect().height,
      fit: getComputedStyle(element).objectFit,
    }));
    assert.equal(dimensions.fit, "contain");
    assert.ok(dimensions.image <= dimensions.stage + 1, "Landscape must not crop the image vertically");
    for (const button of await modal.locator("button").all()) {
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, "Gallery controls have a 44px touch target");
    }
    await modal.locator("[data-close-property-gallery]").focus();
    await page.keyboard.press("Shift+Tab");
    assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest("[data-property-gallery-modal]"))));
    await modal.locator("[data-gallery-next]").tap();
    assert.equal(await modal.locator("[data-gallery-caption]").innerText(), "Imagen horizontal");
    await page.keyboard.press("Escape");
    assert.equal(await modal.isVisible(), false);
    assert.ok(await page.locator("[data-open-property-gallery]").evaluate(element => document.activeElement === element));
    await page.close();
  }
  assert.ok(requests.some(url => url.includes("w=640")));
  assert.ok(requests.some(url => url.includes("w=1200")));
});
