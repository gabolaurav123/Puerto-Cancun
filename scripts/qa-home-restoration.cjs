const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.PCC_TEST_BASE || 'http://127.0.0.1:3072';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Local QA only');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '../../output/home-restoration-20261030');
fs.mkdirSync(output, { recursive: true });
const baseline = execFileSync('git', ['show', 'e3d610b:index.html'], { cwd: root, encoding: 'utf8' });
const baselineStyles = execFileSync('git', ['show', 'e3d610b:styles.css'], { cwd: root, encoding: 'utf8' });
const report = { base, baseline: 'e3d610b', checks: [], layouts: [], errors: [] };

async function check(name, task) {
  try { await task(); report.checks.push({ name, passed: true }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); }
}

function appearance() {
  const selectors = ['.hero', '.hero h1', '.hero-subtitle', '.hero-actions a', '.search-panel', '.contact-strip h2'];
  return Object.fromEntries(selectors.map(selector => {
    const element = document.querySelector(selector);
    const css = getComputedStyle(element);
    return [selector, Object.fromEntries(['fontSize', 'lineHeight', 'fontWeight', 'textTransform', 'color', 'backgroundImage', 'padding', 'minHeight', 'maxWidth'].map(key => [key, css[key]]))];
  }));
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
  try {
    const before = await browser.newContext({ javaScriptEnabled: false });
    await before.route(base + '/qa-before', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: baseline }));
    await before.route('**/styles.css*', route => route.fulfill({ contentType: 'text/css; charset=utf-8', body: baselineStyles }));
    const previous = await before.newPage();
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('pcc-cookie-consent', 'essential'));
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    for (const width of [1920, 1440, 768, 390, 375, 320]) {
      const viewport = { width, height: width > 900 ? 1080 : 844 };
      await previous.setViewportSize(viewport);
      await previous.goto(base + '/qa-before', { waitUntil: 'networkidle' });
      await previous.evaluate(() => document.fonts.ready);
      const reference = await previous.evaluate(appearance);
      await page.setViewportSize(viewport);
      for (const route of ['/', '/en']) {
        const lang = route === '/' ? 'es' : 'en';
        await page.goto(base + route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await check(`${lang} ${width}px: original hero and contact typography`, async () => {
          assert.deepEqual(await page.evaluate(appearance), reference);
        });
        await check(`${lang} ${width}px: no overflow, clipping or featured block`, async () => {
          const layout = await page.evaluate(() => {
            const title = document.querySelector('.hero h1');
            const subtitle = document.querySelector('.hero-subtitle');
            const actions = document.querySelector('.hero-actions');
            const search = document.querySelector('.search-panel');
            return {
              width: innerWidth, documentWidth: document.documentElement.scrollWidth,
              titleSize: getComputedStyle(title).fontSize,
              titleFits: title.scrollWidth <= title.clientWidth + 1,
              titleBottom: title.getBoundingClientRect().bottom,
              subtitleTop: subtitle.getBoundingClientRect().top,
              subtitleBottom: subtitle.getBoundingClientRect().bottom,
              actionsTop: actions.getBoundingClientRect().top,
              actionsBottom: actions.getBoundingClientRect().bottom,
              searchTop: search.getBoundingClientRect().top,
              featuredCards: document.querySelectorAll('#propertyGrid .property-card').length,
            };
          });
          report.layouts.push({ lang, ...layout });
          assert.ok(layout.documentWidth <= width + 1, JSON.stringify(layout));
          assert.equal(layout.titleFits, true);
          assert.ok(layout.titleBottom <= layout.subtitleTop);
          assert.ok(layout.subtitleBottom <= layout.actionsTop);
          assert.ok(layout.actionsBottom <= layout.searchTop);
          assert.equal(layout.featuredCards, 0);
          assert.equal(await page.locator('#properties').isVisible(), false);
          assert.equal(await page.getByRole('heading', { name: /^(Propiedades destacadas|Featured properties)$/ }).count(), 0);
          assert.equal(await page.locator('.zone-card:visible').count(), 4);
          assert.equal(await page.locator('.type-tile:visible').count(), 4);
          assert.equal(await page.locator('.type-section .presale-feature').count(), 1);
          assert.equal(await page.locator('.presale-feature:visible').count(), 1);
          assert.equal(await page.locator('[data-business-contact="mx"]').getAttribute('href'), 'https://wa.me/5219982166563');
          assert.equal(await page.locator('[data-business-contact="us"]').getAttribute('href'), 'https://wa.me/19562518956');
          assert.equal(await page.locator('[data-contact-number]').count(), 2);
          assert.equal(await page.locator('[data-contact-number]').evaluateAll(numbers => numbers.every(number => {
            const box = number.getBoundingClientRect();
            return number.getClientRects().length === 1 && box.left >= 0 && box.right <= innerWidth;
          })), true, 'phone numbers stay complete within the viewport');
        });
        await page.screenshot({ path: path.join(output, `${lang}-${width}-hero.png`) });
        await page.locator('.contact-strip').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `${lang}-${width}-contact.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto(base, { waitUntil: 'networkidle' });
    const targets = await page.locator('.zone-card, .type-tile').evaluateAll(links => links.map(link => link.getAttribute('href')));
    for (const target of targets) {
      await check(`catalog link ${target}`, async () => {
        const response = await page.goto(base + target, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('[data-catalog-root]').count(), 1);
        assert.equal(await page.locator('#catalogFilters').isVisible(), true);
      });
    }
    await check('search and seller options still work from the restored hero', async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#heroSellButton').click();
      assert.equal(await page.locator('#sellerOptionsModal').isVisible(), true);
      await page.locator('[data-close-seller-options]').click();
      assert.equal(await page.locator('#sellerOptionsModal').isVisible(), false);
      await page.locator('#searchInput').fill('Casas en venta');
      await page.locator('#searchForm button[type=submit]').click();
      await page.waitForURL(/\/propiedades\?/);
      assert.equal(new URL(page.url()).searchParams.get('type'), 'Casa');
      assert.equal(new URL(page.url()).searchParams.get('operation'), 'sale');
    });
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({ checks: report.checks, errors: report.errors, output }, null, 2));
  if (report.errors.length || report.checks.some(item => !item.passed)) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
