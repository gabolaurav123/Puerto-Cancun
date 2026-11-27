const assert = require("node:assert/strict");
const test = require("node:test");

test("homepage search, property types and press feedback on touch and desktop", {
  skip: process.env.PCC_HOME_MOTION_BROWSER !== "1", timeout: 150000,
}, async t => {
  const { chromium } = require("playwright");
  const base = process.env.PCC_TEST_BASE;
  assert.ok(base && ["127.0.0.1", "localhost"].includes(new URL(base).hostname));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCC_MOBILE_CHROMIUM });
  t.after(() => browser.close());

  for (const touch of [true, false]) for (const lang of ["es", "en"]) {
    await t.test(`${lang} / ${touch ? "touch" : "mouse"}`, async () => {
      const viewport = touch ? { width: 390, height: 844 } : { width: 1440, height: 900 };
      const context = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch, reducedMotion: "no-preference" });
      try {
        await context.addCookies([{ name: "pcc_lang", value: lang, url: base }]);
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const home = base + (lang === "en" ? "/en" : "/");
        const catalog = lang === "en" ? "/en/properties" : "/propiedades";
        const control = page.locator('#searchForm button[type="submit"]');
        const tile = page.locator(".type-grid .type-tile").first();
        const activate = el => touch ? el.tap() : el.click();
        // A delayed response keeps the real submit handler in its working state for inspection.
        let releaseSearch;
        const searchResponse = new Promise(resolve => { releaseSearch = resolve; });
        await page.route("**/api/search/intelligent", async route => {
          await searchResponse;
          await route.fulfill({ json: { url: catalog + "?type=Casa" } });
        });
        await page.goto(home);
        await page.locator('[data-cookie-choice="essential"]').click();
        assert.equal(await control.evaluate(el => getComputedStyle(el, "::after").animationName), "pcc-search-sweep");
        const input = page.locator("#searchInput");
        await activate(input);
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#searchForm .search-field"), "::after").transform === "matrix(1, 0, 0, 1, 0, 0)");
        await input.fill(lang === "en" ? "Homes" : "Casas");
        await activate(control);
        await page.waitForFunction(() => document.querySelector("#searchForm button:disabled"));
        assert.equal(await control.evaluate(el => getComputedStyle(el, "::after").animationIterationCount), "infinite");
        releaseSearch();
        await page.waitForURL(base + catalog + "?type=Casa");
        await page.goto(home);
        if (touch) await page.locator("#menuToggle").tap();
        const summary = page.locator('#mainNav summary[data-i18n="navPropertyType"]');
        await activate(summary);
        assert.equal(await summary.evaluate(el => getComputedStyle(el.nextElementSibling).animationName), "pcc-panel-arrive");
        await activate(summary);
        if (touch) await page.locator("#menuToggle").tap();

        await tile.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector(".type-grid .type-tile").classList.contains("public-card-arriving"));
        assert.equal(await tile.locator("> span").evaluate(el => getComputedStyle(el).animationName), "pcc-type-label");
        const photo = tile.locator("img[src]:not([hidden])");
        if (await photo.count()) {
          await photo.evaluate(img => img.decode());
          assert.equal(await photo.evaluate(img => getComputedStyle(img).animationName), "pcc-type-photo");
        }
        const href = await tile.getAttribute("href");
        const originalLabel = await tile.innerText();
        const bounds = await tile.boundingBox();
        const point = { x: Math.round(bounds.x + bounds.width / 2), y: Math.round(bounds.y + bounds.height / 2) };
        const cdp = touch ? await context.newCDPSession(page) : null;
        if (touch) await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
        else { await page.mouse.move(point.x, point.y); await page.mouse.down(); }
        const wave = tile.locator(".home-press-wave");
        assert.equal(await wave.getAttribute("aria-hidden"), "true");
        assert.ok(await wave.evaluate(el => el.getAnimations().some(animation => animation.playState === "running")));
        assert.equal(await tile.innerText(), originalLabel);
        if (touch) await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        else await page.mouse.up();
        await page.waitForURL(new URL(href, home).href);

        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(home);
        await tile.scrollIntoViewIfNeeded();
        assert.equal(await tile.locator("> span").evaluate(el => getComputedStyle(el).animationName), "none");
        assert.equal(await control.evaluate(el => getComputedStyle(el, "::after").animationName), "none");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      } finally { await context.close(); }
    });
  }
});
