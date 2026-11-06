const test = require('node:test');
const assert = require('node:assert/strict');
const seo = require('../seo-pages');
const { publicProperty } = require('../inventory-metadata');

// Opt-in browser regression on the full local Express shell. Only synthetic GET responses are replaced.
test('mobile catalog: filters, history, pagination, touch map and contextual inquiries on full SSR', { skip: process.env.PCC_MOBILE_BROWSER !== '1', timeout: 180000 }, async (t) => {
  const { chromium } = require('playwright');
  const base = process.env.PCC_TEST_BASE;
  assert.ok(base && ['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use a disposable local HTTP server');
  const records = Array.from({ length: 88 }, (_, i) => {
    const development = i >= 80;
    const row = publicProperty({
      id: `qa-mobile-${i}`, status: 'active', isPublic: true, publicationSection: development ? 'developments' : 'properties',
      titleEs: `${development ? 'Desarrollo' : 'Casa'} de prueba ${String(i).padStart(3, '0')}`, titleEn: `${development ? 'Development' : 'Home'} sample ${String(i).padStart(3, '0')}`,
      descriptionEs: 'Publicación sintética para verificar el catálogo.', descriptionEn: 'Synthetic listing for catalog checks.',
      type: development ? 'Desarrollo' : 'Casa', zone: i === 87 ? 'Ciudad de Cancún' : 'Puerto Cancún', operation: 'sale', currency: i % 2 ? 'USD' : 'MXN', price: 1000000 + i,
      beds: 3, images: ['/assets/og-puerto-cancun-center.webp'], latitude: 21.161234 + i / 100000, longitude: -86.812345,
      locationPrecision: i === 0 ? 'hidden' : i % 2 ? 'approximate' : 'exact', catalogData: { locationId: i === 87 ? 'cancun-city' : 'puerto-cancun' },
      developmentData: development ? { id: `dev-${i}`, stage: 'presale' } : {},
    });
    return { ...row, urlEs: seo.propertyPath(row, 'es'), urlEn: seo.propertyPath(row, 'en') };
  });
  const browser = await chromium.launch({ headless: true, ...(process.env.PCC_MOBILE_CHROMIUM ? { executablePath: process.env.PCC_MOBILE_CHROMIUM } : { channel: 'msedge' }) });
  t.after(() => browser.close());
  for (const [width, height] of [[320, 740], [360, 800], [390, 844], [430, 932], [844, 390]].filter(([width]) => !process.env.PCC_MOBILE_WIDTH || width === Number(process.env.PCC_MOBILE_WIDTH))) {
    for (const lang of ['es', 'en']) await t.test(`${lang} ${width}x${height}`, async () => {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      try {
        await context.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.origin !== base || !['GET', 'HEAD'].includes(route.request().method())) return route.abort();
          if (url.pathname === '/api/properties') return route.fulfill({ json: { properties: records } });
          const page = seo.getPageByPath(url.pathname);
          if (!page?.category) return route.continue();
          const response = await route.fetch();
          const params = Object.fromEntries(url.searchParams);
          const fixture = seo.renderCategoryPage(page, records, params).match(/<section id="category-inventory"[^]*?<\/section>/)[0];
          const body = (await response.text()).replace(/<section id="category-inventory"[^]*?<\/section>/, fixture);
          return route.fulfill({ response, body });
        });
        const page = await context.newPage(); page.setDefaultTimeout(10000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        const en = lang === 'en', path = en ? '/en/properties' : '/propiedades';
        await page.goto(base + path + (en ? '/homes-cancun' : '/casas-cancun'));
        const cookie = page.locator('[data-cookie-choice=essential]'); if (await cookie.isVisible()) await cookie.click();
        await page.waitForFunction(() => window.PccCatalog);
        const root = page.locator('[data-catalog-root]');
        assert.equal(await root.locator('[data-compare-id], [data-start-comparison]').count(), 0);
        assert.equal(await root.locator('[data-category-property]').count(), 24);
        const image = root.locator('.seo-property-image img').first();
        assert.equal(await image.evaluate(el => getComputedStyle(el).objectFit), 'contain');
        assert.ok(await root.locator('.seo-property-actions').first().evaluate(el => [...el.querySelectorAll('a')].every(link => link.getBoundingClientRect().height >= 44 && link.getBoundingClientRect().right <= innerWidth)));
        await root.locator('.catalog-filter-panel>summary').click();
        assert.ok(await root.locator('[name=type]').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16));
        await root.locator('.catalog-advanced>summary').click();
        await root.locator('[name=beds]').fill('0');
        await root.locator('#catalogFilters [type=submit]').click();
        await page.waitForURL(/beds=0/);
        assert.equal(new URL(page.url()).searchParams.get('type'), 'Casa');
        await page.waitForFunction(() => document.activeElement.classList.contains('catalog-result-bar'));
        assert.ok(await root.locator('.catalog-result-bar').evaluate(el => el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom < innerHeight));
        await root.getByRole('link', { name: en ? 'Next page' : 'Página siguiente', exact: true }).click();
        await page.waitForURL(/page=2/);
        assert.ok(await root.locator('[data-category-property]').first().evaluate(el => el.getBoundingClientRect().top < innerHeight));
        const second = await root.locator('[data-category-property]').first().getAttribute('data-category-property');
        await page.goBack(); await page.waitForFunction(() => !new URL(location).searchParams.has('page') && !document.querySelector('[data-catalog-root]').hasAttribute('aria-busy'));
        assert.notEqual(await root.locator('[data-category-property]').first().getAttribute('data-category-property'), second);
        await root.locator('[name=q]').fill('testobuscador'.repeat(15));
        await page.waitForURL(/q=/);
        assert.ok(await root.locator('.catalog-chip').evaluateAll(nodes => nodes.every(el => el.getBoundingClientRect().right <= innerWidth && el.getBoundingClientRect().left >= 0)));
        await page.goBack(); await page.waitForFunction(() => !new URL(location).searchParams.has('q') && !document.querySelector('[data-catalog-root]').hasAttribute('aria-busy'));
        // Typed debounces must not change the URL after native Back.
        await root.locator('[name=q]').fill('stale'); await page.goBack(); await page.waitForTimeout(450);
        assert.equal(new URL(page.url()).searchParams.has('q'), false);
        await page.goto(base + path);
        await page.evaluate(async () => { const L = await PccCatalogMap.loadLeaflet(document); L.Map.addInitHook(function () { if (this.getContainer().closest('[data-catalog-map]')) window.qaCatalogMap = this; }); });
        await root.locator('[data-catalog-view=map]').click(); await page.waitForFunction(() => window.qaCatalogMap?.getZoom() >= 2);
        await page.waitForFunction(() => document.querySelector('.catalog-map-status').textContent.includes(document.documentElement.lang.startsWith('en') ? 'tiles' : 'imagenes'));
        assert.ok(await root.locator('img.leaflet-tile').evaluateAll(images => images.every(image => image.dataset.fallbackApplied !== 'true')), 'a failed tile must never become a property photo');
        const canvas = root.locator('.catalog-map-canvas');
        await canvas.scrollIntoViewIfNeeded();
        assert.equal(await page.evaluate(() => qaCatalogMap.dragging.enabled()), false);
        assert.ok((await canvas.boundingBox()).height < height);
        const cdp = await context.newCDPSession(page);
        const swipe = async () => {
          const box = await canvas.boundingBox(); const x = Math.round(box.x + box.width / 2), start = Math.round(Math.min(height - 30, box.y + box.height * .75)), end = Math.round(Math.max(140, box.y + box.height * .25));
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start, id: 0 }] });
          for (let step = 1; step <= 6; step++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(start + (end - start) * step / 6), id: 0 }] }); await page.waitForTimeout(20); }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        };
        const scroll = await page.evaluate(() => scrollY); await swipe(); await page.waitForFunction(y => scrollY > y + 10, scroll);
        const gestures = root.locator('[data-catalog-map-gestures]'); await gestures.click();
        assert.equal(await page.evaluate(() => qaCatalogMap.dragging.enabled() && qaCatalogMap.touchZoom.enabled()), true);
        await canvas.scrollIntoViewIfNeeded();
        const initialZoom = await page.evaluate(() => qaCatalogMap.getZoom());
        await root.getByRole('button', { name: en ? 'Zoom in' : 'Acercar mapa', exact: true }).click();
        await page.waitForFunction(z => qaCatalogMap.getZoom() > z, initialZoom);
        await root.getByRole('button', { name: en ? 'Zoom out' : 'Alejar mapa', exact: true }).click();
        await page.waitForFunction(z => qaCatalogMap.getZoom() === z, initialZoom);
        await canvas.scrollIntoViewIfNeeded();
        const box = await canvas.boundingBox(), x = Math.round(box.x + box.width / 2), y = Math.round(Math.max(150, Math.min(height - 50, box.y + box.height / 2)));
        const touches = distance => [{ x: x - distance, y, id: 0 }, { x: x + distance, y, id: 1 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(15) });
        for (const distance of [25, 35, 50, 70]) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(distance) }); await page.waitForTimeout(40); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(z => qaCatalogMap.getZoom() > z, initialZoom);
        const center = await page.evaluate(() => qaCatalogMap.getCenter().lat), mapScroll = await page.evaluate(() => scrollY);
        await swipe(); await page.waitForFunction(lat => qaCatalogMap.getCenter().lat !== lat, center);
        assert.ok(Math.abs(await page.evaluate(() => scrollY) - mapScroll) < 5, 'active map drag does not scroll the page');
        const zoom = await page.evaluate(() => qaCatalogMap.getZoom()), pins = await root.locator('.pcc-catalog-map-pin').count();
        const savedCenter = await page.evaluate(() => qaCatalogMap.getCenter());
        await gestures.click(); assert.equal(await page.evaluate(() => qaCatalogMap.dragging.enabled()), false);
        assert.equal(await page.evaluate(() => qaCatalogMap.getZoom()), zoom); assert.equal(await root.locator('.pcc-catalog-map-pin').count(), pins);
        assert.deepEqual(await page.evaluate(() => qaCatalogMap.getCenter()), savedCenter);
        await root.locator('[data-catalog-search-area]').click(); await page.waitForURL(/bounds=/); await page.waitForFunction(() => document.querySelector('[data-catalog-view=map]').getAttribute('aria-pressed') === 'true');
        await page.goto(base + path + '?entity=developments');
        assert.equal(await root.locator('[data-category-property]').count(), 8);
        assert.equal(await root.locator('.seo-property-price').count(), 0, 'developments do not imply a unit price');
        assert.equal(await root.locator('#catalogFilters select[name=currency], #catalogFilters input[name=beds]').count(), 0);
        const contact = root.locator('[data-category-property] [data-contact-inquiry]').first();
        assert.equal(await contact.getAttribute('data-intent'), 'buy');
        assert.ok(await contact.getAttribute('data-development'));
        await page.goto(base + path + '?location=puerto-cancun');
        await root.locator('.catalog-entity-nav a[href*="entity=developments"]').click();
        await page.waitForURL(/entity=developments/);
        assert.equal(new URL(page.url()).searchParams.get('location'),'puerto-cancun');
        assert.equal(await root.locator('[data-category-property]').count(), 7);
        await root.locator('.catalog-entity-nav a[href*="entity=properties"]').click();
        await page.waitForURL(/entity=properties/);
        await root.locator('.catalog-filter-panel>summary').click();
        await root.locator('[name=development]').selectOption('qa-mobile-80');
        await page.waitForURL(/development=qa-mobile-80/);
        await root.locator('[name=location][value=cancun-city]').check();
        await page.waitForURL(url => url.searchParams.get('location')?.includes('cancun-city'));
        await root.locator('[name=location][value=puerto-cancun]').uncheck();
        await page.waitForURL(url => url.searchParams.get('location') === 'cancun-city' && !url.searchParams.has('development'));
        assert.match(await root.locator('.catalog-request-status').textContent(), en ? /area cleared/ : /zona cambió/);
        assert.equal(await root.locator('.catalog-demand [data-intent=buy]').getAttribute('data-zone'),en ? 'Cancun City' : 'Ciudad de Cancún');
        assert.ok(await root.evaluate(el => [...el.querySelectorAll('.seo-property-card,.catalog-pagination,.catalog-view-toggle')].every(node => node.getBoundingClientRect().right <= innerWidth + 1)));
        assert.deepEqual(errors, []);
        t.diagnostic(`${lang} ${width}×${height}: filters, pagination/history, maps, 8 developments and contextual contact passed`);
      } finally { await context.close(); }
    });
  }
});
