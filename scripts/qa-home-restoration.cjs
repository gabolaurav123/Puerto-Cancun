const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.PCC_TEST_BASE || 'http://127.0.0.1:3072';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Local QA only');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '../../output/home-contact-qa');
fs.mkdirSync(output, { recursive: true });
const report = { base, checks: [], layouts: [], errors: [] };

async function check(name, task) {
  try { await task(); report.checks.push({ name, passed: true }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || chromium.executablePath() });
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('pcc-cookie-consent', 'essential'));
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    for (const width of [1920, 1440, 768, 390, 375, 320]) {
      const viewport = { width, height: width > 900 ? 1080 : 844 };
      await page.setViewportSize(viewport);
      for (const route of ['/', '/en']) {
        const lang = route === '/' ? 'es' : 'en';
        await context.addCookies([{ name: 'pcc_lang', value: lang, url: base }]);
        await page.goto(base + route, { waitUntil: 'networkidle' });
        const cookie = page.locator('[data-cookie-choice=essential]');
        if (await cookie.isVisible()) await cookie.click();
        await page.evaluate(() => document.fonts.ready);
        await check(`${lang} ${width}px: no overflow, clipping or featured block`, async () => {
          const layout = await page.evaluate(() => {
            const title = document.querySelector('.hero h1');
            const subtitle = document.querySelector('.hero-subtitle');
            const search = document.querySelector('.search-panel');
            return {
              width: innerWidth, documentWidth: document.documentElement.scrollWidth,
              titleSize: getComputedStyle(title).fontSize,
              titleFits: title.scrollWidth <= title.clientWidth + 1,
              titleBottom: title.getBoundingClientRect().bottom,
              subtitleTop: subtitle.getBoundingClientRect().top,
              subtitleBottom: subtitle.getBoundingClientRect().bottom,
              searchTop: search.getBoundingClientRect().top,
              featuredCards: document.querySelectorAll('#propertyGrid .property-card').length,
            };
          });
          report.layouts.push({ lang, ...layout });
          assert.ok(layout.documentWidth <= width + 1, JSON.stringify(layout));
          assert.equal(layout.titleFits, true);
          assert.ok(layout.titleBottom <= layout.subtitleTop);
          assert.ok(layout.subtitleBottom <= layout.searchTop);
          const input = page.locator('#searchInput');
          const prompt = page.locator('#searchForm .search-field-prompt');
          assert.equal(await input.getAttribute('aria-label'), await prompt.innerText());
          const promptFits = await prompt.evaluate(element => {
            const field = element.closest('label').getBoundingClientRect();
            const text = document.createRange();
            text.selectNodeContents(element);
            const lines = Array.from(text.getClientRects());
            return lines.length > 0 && lines.every(line =>
              line.left >= field.left && line.right <= field.right &&
              line.top >= field.top && line.bottom <= field.bottom);
          });
          assert.ok(promptFits, 'all lines of the search hint fit inside the field');
          await input.fill(lang === 'es' ? 'Casa en renta' : 'House for rent');
          assert.equal(await prompt.isVisible(), false);
          await input.fill('');
          assert.equal(await prompt.isVisible(), true);
          assert.equal(await page.locator('.hero-actions').count(), 0);
          assert.equal(layout.featuredCards, 0);
          assert.equal(await page.locator('#properties').isVisible(), false);
          assert.equal(await page.getByRole('heading', { name: /^(Propiedades destacadas|Featured properties)$/ }).count(), 0);
          assert.ok(await page.locator('.zone-card:visible').count() > 0);
          assert.equal(await page.locator('.type-tile:visible').count(), 4);
          assert.equal(await page.locator('.type-section .presale-feature').count(), 1);
          assert.equal(await page.locator('.presale-feature:visible').count(), 1);
          for (const office of ['mx', 'us']) {
            const button = page.locator(`.contact-strip [data-office="${office}"]`);
            const url = new URL(await button.getAttribute('href'), base);
            assert.equal(url.searchParams.get('office'), office);
            assert.equal(url.pathname, lang === 'en' ? '/en/contact' : '/contacto');
          }
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
    await context.addCookies([{ name: 'pcc_lang', value: 'es', url: base }]);
    await page.goto(base, { waitUntil: 'networkidle' });
    const targets = await page.locator('.zone-card, .type-tile').evaluateAll(links => links.map(link => link.getAttribute('href')));
    for (const target of targets) {
      await check(`catalog link ${target}`, async () => {
        const response = await page.goto(base + target, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('[data-catalog-root]').count(), 1);
        assert.equal(await page.locator('.catalog-filter-panel > summary').isVisible(), true);
      });
    }
    await check('search, seller inquiries and office selection work from home', async () => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#sellCtaButton').click();
      const modal = page.locator('.contextual-inquiry[open]');
      assert.equal(await modal.locator('[name=intent]').inputValue(), 'sell');
      await modal.locator('[data-inquiry-close]').click();
      await page.locator('.contact-strip [data-office=us]').click();
      assert.match(await modal.locator('#inquiryTitle').innerText(), /Estados Unidos/);
      await modal.locator('[data-inquiry-close]').click();
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
