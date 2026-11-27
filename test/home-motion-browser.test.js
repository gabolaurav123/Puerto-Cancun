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
        let releaseInventory;
        const inventoryGate = new Promise(resolve => { releaseInventory = resolve; });
        await page.route("**/api/properties", async route => {
          const response = await route.fetch();
          const data = await response.json();
          const area = { id: "puerto-qa", nameEs: "Puerto QA", nameEn: "Puerto QA" };
          await inventoryGate;
          await route.fulfill({ response, json: { ...data, directory: { ...data.directory, areas: [...(data.directory?.areas || []), area] } } });
        }, { times: 1 });
        // A delayed response keeps the real submit handler in its working state for inspection.
        let releaseSearch;
        const searchResponse = new Promise(resolve => { releaseSearch = resolve; });
        await page.route("**/api/search/intelligent", async route => {
          await searchResponse;
          await route.fulfill({ json: { url: catalog + "?type=Casa" } });
        });
        await page.goto(home, { waitUntil: "domcontentloaded" });
        await page.locator('[data-cookie-choice="essential"]').click();
        for (const selector of [".hero h1", ".hero-subtitle", "#searchForm"]) {
          const centered = await page.locator(selector).evaluate(el => {
            const r = el.getBoundingClientRect();
            return Math.abs(r.left + r.width / 2 - document.documentElement.clientWidth / 2) < 2;
          });
          assert.ok(centered, selector + " centered in the viewport");
        }
        assert.equal(await page.locator(".hero h1").evaluate(el => getComputedStyle(el).textAlign), "center");
        const coast = page.locator(".hero-media img");
        const coastOffset = img => img.getBoundingClientRect().top - img.parentElement.getBoundingClientRect().top;
        const atRest = await coast.evaluate(coastOffset);
        await page.evaluate(() => window.scrollTo({ top: 140, behavior: "instant" }));
        await page.waitForFunction(() => Number(document.querySelector(".hero").style.getPropertyValue("--coast-scroll")) > .1);
        if (touch) assert.ok(await coast.evaluate(coastOffset) - atRest > 25, "the coast moves visibly inside the hero");
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForFunction(() => document.querySelector(".hero").style.getPropertyValue("--coast-scroll") === "0.0000");
        assert.ok(Math.abs(await coast.evaluate(coastOffset) - atRest) < 1);
        assert.equal(await control.evaluate(el => getComputedStyle(el, "::after").animationName), "pcc-search-sweep");
        const input = page.locator("#searchInput");
        await activate(input);
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#searchForm .search-field"), "::after").transform === "matrix(1, 0, 0, 1, 0, 0)");
        await input.fill("Puerto QA");
        releaseInventory();
        const suggestion = page.locator("#homeSearchSuggestions a").first();
        await suggestion.waitFor();
        assert.match(await suggestion.innerText(), /Puerto QA/);
        await page.waitForFunction(() => {
          const link = document.querySelector("#homeSearchSuggestions a");
          const r = link.getBoundingClientRect();
          return link.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        });
        await input.press("ArrowDown");
        assert.ok(await suggestion.evaluate(node => node === document.activeElement));
        await suggestion.press("Escape");
        assert.equal(await input.getAttribute("aria-expanded"), "false");
        await input.fill(lang === "en" ? "Homes" : "Casas");
        await activate(control);
        await page.waitForFunction(() => document.querySelector("#searchForm button:disabled"));
        assert.equal(await control.evaluate(el => getComputedStyle(el, "::after").animationIterationCount), "infinite");
        releaseSearch();
        await page.waitForURL(base + catalog + "?type=Casa");
        await page.goto(home);
        const footer = page.locator(".footer-section").first();
        assert.equal(await footer.evaluate(node => node.open), !touch);
        if (touch) {
          await activate(footer.locator("summary"));
          assert.ok(await footer.locator("a").first().isVisible());
          await activate(footer.locator("summary"));
          assert.equal(await footer.locator("a").first().isVisible(), false);
        }
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
        await page.locator(".sell-cta").evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
        await page.waitForFunction(() => !document.querySelector(".type-tile").classList.contains("public-card-arriving"));
        await tile.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
        await page.waitForFunction(() => document.querySelector(".type-tile").matches(".public-card-arriving.public-card-from-top"));
        assert.equal(await tile.locator("> span").evaluate(el => getComputedStyle(el).animationName), "pcc-type-label");
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
        assert.equal(await page.locator(".hero-media img").evaluate(el => getComputedStyle(el).translate), "none");
        assert.equal(await control.evaluate(el => getComputedStyle(el, "::after").animationName), "none");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      } finally { await context.close(); }
    });
  }
});
