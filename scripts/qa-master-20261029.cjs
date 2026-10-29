const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.PCC_TEST_BASE || 'http://127.0.0.1:3072';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Local QA only');
const output = path.resolve(__dirname, '../../../output/master-20261029/browser');
fs.mkdirSync(output, { recursive: true });
const report = { base, at: new Date().toISOString(), checks: [], errors: [], layouts: [] };
async function run(name, fn) { try { await fn(); report.checks.push({ name, passed: true }); } catch (e) { report.checks.push({ name, passed: false, error: e.message }); } }
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await run('Home has four Locations and four types', async () => {
      assert.equal(await page.locator('.zone-grid .zone-card').count(), 4);
      assert.equal(await page.locator('.type-grid .type-tile').count(), 4);
      assert.equal(await page.locator('[data-business-contact="us"]').getAttribute('href'), 'https://wa.me/19562518956');
    });
    await run('Desktop hero supporting copy occupies two readable lines', async () => {
      const text = await page.locator('.hero-subtitle').evaluate(element => {
        const css = getComputedStyle(element);
        return { lines: element.clientHeight / parseFloat(css.lineHeight), size: parseFloat(css.fontSize) };
      });
      assert.ok(text.lines >= 1.95 && text.lines <= 2.05, JSON.stringify(text));
      assert.ok(text.size >= 16);
    });
    for (const width of [1440, 768, 390, 375]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      for (const [name, route] of [['home', '/'], ['catalog', '/propiedades'], ['english', '/en/properties?type=Casa&operation=sale']]) {
        await page.goto(base + route, { waitUntil: 'networkidle' });
        const consent = page.getByRole('button', { name: /Solo esenciales|Only essential/i });
        if (await consent.isVisible()) await consent.click();
        const layout = await page.evaluate(() => {
          const price = document.querySelector('.seo-property-price, .property-price');
          return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, priceY: price?.getBoundingClientRect().top ?? null, title: document.querySelector('h1')?.textContent, bodyPage: document.body.dataset.page };
        });
        report.layouts.push({ name, width, ...layout });
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
        await page.screenshot({ path: path.join(output, `${name}-${width}-viewport.png`) });
        if (name === 'catalog') {
          const first = page.locator('[data-category-property]').first();
          await first.scrollIntoViewIfNeeded();
          await run(`Catalog ${width}px price and comparison control do not overlap`, async () => {
            const price = await first.locator('.seo-property-price').boundingBox();
            const compare = await first.locator('[data-compare-id]').boundingBox();
            assert.ok(price && compare, 'both controls are rendered');
            const intersects = price.x < compare.x + compare.width && price.x + price.width > compare.x
              && price.y < compare.y + compare.height && price.y + price.height > compare.y;
            assert.equal(intersects, false);
            assert.ok(compare.height >= 44, 'touch target remains accessible');
          });
          await page.screenshot({ path: path.join(output, `catalog-${width}-first-card.png`) });
        }
        await run(`${name} ${width}px no horizontal overflow`, async () => assert.ok(layout.documentWidth <= width + 1, JSON.stringify(layout)));
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/propiedades/casas-cancun', { waitUntil: 'networkidle' });
    const clickedIds = await page.locator('[data-category-property]').evaluateAll(cards => cards.map(card => card.dataset.categoryProperty));
    await page.reload({ waitUntil: 'networkidle' });
    await run('SSR reload preserves category IDs', async () => assert.deepEqual(await page.locator('[data-category-property]').evaluateAll(cards => cards.map(card => card.dataset.categoryProperty)), clickedIds));
    await run('API and SSR use same property IDs', async () => {
      const data = await (await page.request.get(base + '/api/catalog?type=Casa')).json();
      assert.deepEqual(data.items.map(item => item.id), clickedIds);
    });
    await run('Invalid filters are not full inventory', async () => {
      await page.goto(base + '/propiedades?currency=INVALID&min=1');
      assert.equal(await page.locator('[data-category-property]').count(), 0);
      assert.equal(await page.locator('.catalog-errors').count(), 1);
    });
    await run('Intelligent search asks currency without relaxing', async () => {
      const result = await page.evaluate(() => window.api('/api/search/intelligent', { method: 'POST', body: { query: 'Comprar casa hasta 700000' } }));
      assert.equal(result.needsChoice, true); assert.equal(result.properties.length, 0);
    });
    await run('Intelligent search navigates to catalog', async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#searchInput').fill('Casas en venta');
      await page.locator('#searchForm button[type=submit]').click();
      await page.waitForURL(/\/propiedades\?/);
      assert.equal(new URL(page.url()).searchParams.get('operation'), 'sale');
      assert.equal(new URL(page.url()).searchParams.get('type'), 'Casa');
      await page.waitForSelector('[data-catalog-root]');
    });
    await run('Filter AJAX and browser Back retain state', async () => {
      await page.locator('#catalogFilters select[name=type]').selectOption('Terreno');
      await page.waitForURL(/type=Terreno/);
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('#catalogFilters select[name=type]')?.value === 'Casa');
    });
    await run('English keeps filter state', async () => {
      await page.locator('#languageToggle').click();
      await page.waitForURL(/\/en\/properties\?/);
      assert.equal(new URL(page.url()).searchParams.get('type'), 'Casa');
      assert.ok((await page.locator('#categoryInventoryCount').textContent()).includes('We found'));
    });
    await run('All Locations click, reload and API agree', async () => {
      for (const id of ['zona-hotelera', 'puerto-cancun', 'cancun-city', 'fuera-de-cancun']) {
        await page.goto(base + '/propiedades', { waitUntil: 'networkidle' });
        await page.locator(`#catalogFilters input[name=location][value="${id}"]`).check();
        await page.waitForURL(url => url.searchParams.get('location') === id);
        await page.waitForFunction(() => !document.querySelector('[data-catalog-root]')?.hasAttribute('aria-busy'));
        const ids = await page.locator('[data-category-property]').evaluateAll(cards => cards.map(card => card.dataset.categoryProperty));
        const apiResult = await (await page.request.get(base + '/api/catalog?location=' + id)).json();
        assert.deepEqual(ids, apiResult.items.map(item => item.id));
        await page.reload({ waitUntil: 'networkidle' });
        assert.deepEqual(await page.locator('[data-category-property]').evaluateAll(cards => cards.map(card => card.dataset.categoryProperty)), ids);
      }
    });
    await run('Conversational search keeps implicit category Location', async () => {
      await page.goto(base + '/propiedades/puerto-cancun', { waitUntil: 'networkidle' });
      await page.locator('.catalog-conversation summary').click();
      await page.locator('[data-catalog-assistant] input').fill('Casas');
      await page.locator('[data-catalog-assistant] button[type=submit]').click();
      await page.waitForURL(url => url.searchParams.get('type') === 'Casa');
      assert.equal(new URL(page.url()).searchParams.get('location'), 'puerto-cancun');
    });
    await run('Comparison controls, shareable IDs and reload', async () => {
      await page.goto(base + '/propiedades', { waitUntil: 'networkidle' });
      const buttons = page.locator('[data-compare-id]');
      assert.ok(await buttons.count() >= 2);
      await buttons.nth(0).click(); await buttons.nth(1).click();
      assert.equal(await page.locator('.pcc-comparison-table thead th').count(), 3);
      const compared = new URL(page.url()).searchParams.get('compare');
      assert.equal(compared.split(',').length, 2);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('.pcc-comparison-table thead th').count(), 3);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('.pcc-comparison').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, 'comparison-390.png') });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    });
    await run('Map external failure leaves listing functional', async () => {
      let deniedAssets = 0;
      await page.route('**/unpkg.com/leaflet@*/**', route => { deniedAssets++; return route.abort(); });
      await page.goto(base + '/propiedades', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('html').getAttribute('lang'), 'es');
      const count = await page.locator('[data-category-property]').count();
      // Local seed has no coordinates. A browser-only map fixture exercises the CDN failure path.
      await page.evaluate(() => {
        const card = document.querySelector('[data-category-property]');
        document.querySelector('[data-catalog-map-data]').textContent = JSON.stringify([{ id: card.dataset.categoryProperty, title: 'QA map fixture', latitude: 21.1, longitude: -86.8, locationPrecision: 'approximate', url: card.querySelector('a').getAttribute('href') }]);
      });
      await page.locator('[data-catalog-view=map]').click();
      await page.waitForFunction(() => /No se pudo cargar el mapa/.test(document.querySelector('.catalog-map-status')?.textContent || ''));
      assert.ok(deniedAssets > 0);
      assert.equal(await page.locator('[data-category-property]').count(), count);
      await page.locator('[data-catalog-view=list]').click();
      assert.ok(await page.locator('[data-catalog-list]').isVisible());
      await page.unroute('**/unpkg.com/leaflet@*/**');
    });
    await run('Anonymous seller deep link retains context', async () => {
      const response = await page.request.get(base + '/panel?intent=sell&location=puerto-cancun&type=Casa', { maxRedirects: 0 });
      assert.equal(response.status(), 302);
      const destination = new URL(response.headers().location, base);
      assert.equal(destination.searchParams.get('intent'), 'sell');
      assert.equal(destination.searchParams.get('location'), 'puerto-cancun');
      assert.equal(destination.searchParams.get('type'), 'Casa');
    });
    await run('Administrator desktop/mobile inventory and editor navigation', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => window.api('/api/auth/login', { method: 'POST', body: { username: 'qa-admin', password: 'qa-admin-password-only-local' } }));
      await page.goto(base + '/panel', { waitUntil: 'networkidle' });
      await page.locator('[data-admin-section=developments]').click();
      await page.locator('[data-admin-section-link=developments]').click();
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
        await page.screenshot({ path: path.join(output, `admin-developments-${width}.png`), fullPage: true });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      await page.evaluate(() => window.setAdminSection('new-development'));
      await page.locator('#listingForm input[name=title]').fill('QA Borrador sin publicar');
      await page.locator('#listingForm input[name=title]').press('Enter');
      assert.equal(await page.locator('#listingForm input[name=title]').inputValue(), 'QA Borrador sin publicar');
      assert.ok(await page.locator('#listingForm').isVisible());
      await page.locator('#listingForm').screenshot({ path: path.join(output, 'admin-editor-mobile.png') });
    });
    await run('No browser JavaScript errors', async () => assert.deepEqual(report.errors, []));
    await context.close();
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (report.checks.some(check => !check.passed)) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
