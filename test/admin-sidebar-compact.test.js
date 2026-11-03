const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Opt-in against the running local app: the production DOM, styles and event handlers are used unchanged.
test('compact desktop sidebar retains readable names, counts and keyboard-accessible groups', {
  skip: !process.env.PCC_SIDEBAR_QA_BASE, timeout: 120000,
}, async () => {
  const base = process.env.PCC_SIDEBAR_QA_BASE;
  const url = new URL(base);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Only a loopback QA server is allowed');
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const out = process.env.PCC_QA_SCREENSHOT_DIR;
  if (out) fs.mkdirSync(out, { recursive: true });
  const results = [], errors = [], failures = [];
  try {
    const storage = process.env.PCC_QA_STORAGE_STATE;
    const context = await browser.newContext({ serviceWorkers: 'block', ...(storage ? { storageState: storage } : {}) });
    const session = await (await context.request.get(`${base}/api/session`)).json();
    if (!session.user) {
      assert.ok(process.env.PCC_SIDEBAR_QA_PASSWORD, 'Supply local QA credentials or an authenticated storage state');
      const response = await context.request.post(`${base}/api/auth/login`, { headers: { Origin: base, 'X-CSRF-Token': session.csrfToken }, data: { username: process.env.PCC_SIDEBAR_QA_USER || 'qa.admin', password: process.env.PCC_SIDEBAR_QA_PASSWORD } });
      assert.equal(response.status(), 200);
    }
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(6500);
    page.on('pageerror', error => errors.push(error.message));
    for (const lang of ['es', 'en']) for (const width of [1024, 1280, 1440, 1834]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/panel`);
      await page.locator('#adminPanel').waitFor();
      const cookie = page.locator('[data-cookie-choice=essential]');
      if (await cookie.isVisible()) await cookie.click();
      await page.evaluate(async () => { await Promise.allSettled([...adminResourceReads.values()].map(entry => entry.promise)); });
      if (await page.evaluate(() => state.lang) !== lang) await page.locator('#panelLanguageToggle').click();
      await page.addStyleTag({ content: '*{scroll-behavior:auto!important;transition-duration:0s!important;animation-duration:0s!important}' });
      if (await page.locator('#adminSidebarToggle').getAttribute('aria-expanded') === 'true') await page.locator('#adminSidebarToggle').click();
      assert.equal(await page.locator('#adminSidebarToggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('.admin-sidebar-subnav').evaluateAll(nodes => nodes.every(node => node.inert && !node.classList.contains('is-open'))), true);
      await page.evaluate(() => { window.qaSidebarOriginal = { tasks: state.tasks, requests: state.requests, guestSaleRequests: state.guestSaleRequests, leads: state.leads, valuations: state.valuations, overview: state.whatsapp.overview }; });
      for (const count of [0, 9, 99, 1000]) {
        // Only in-memory counts change; no administrative API mutation is sent.
        await page.evaluate(count => {
          state.tasks = Array.from({ length: count }, () => ({ status: 'pending' }));
          state.requests = Array.from({ length: count }, () => ({ status: 'pending' })); state.guestSaleRequests = [];
          state.leads = Array.from({ length: count }, () => ({ status: 'new' }));
          state.valuations = Array.from({ length: count }, () => ({ status: 'new' }));
          state.whatsapp.overview = { ...state.whatsapp.overview, counts: { unread: count } };
          updateAdminShell();
        }, count);
        const geometry = await page.locator('#adminMenu > button').evaluateAll(buttons => buttons.filter(button => !button.hidden).map(button => {
          const label = button.querySelector('span'), badge = button.querySelector('b'), box = button.getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(label);
          const labelBox = label.getBoundingClientRect(), badgeBox = badge?.getBoundingClientRect();
          const textRects = [...range.getClientRects()].filter(rect => rect.width && rect.height);
          const overlap = badgeBox && textRects.some(rect => Math.min(rect.right, badgeBox.right) - Math.max(rect.left, badgeBox.left) > .5 && Math.min(rect.bottom, badgeBox.bottom) - Math.max(rect.top, badgeBox.top) > .5);
          const clipped = textRects.some(rect => rect.left < labelBox.left - 1 || rect.right > labelBox.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1);
          return { section: button.dataset.adminSection, text: label.textContent.trim(), clipped, overlap: Boolean(overlap), labelWidth: labelBox.width, textWidth: Math.max(...textRects.map(rect => rect.width)), badge: badge?.textContent, aria: button.getAttribute('aria-label'), title: button.title };
        }));
        const bad = geometry.filter(item => item.clipped || item.overlap || item.aria !== item.text || item.title !== item.text);
        results.push({ lang, width, count, geometry });
        if (bad.length) { failures.push({ lang, width, count, bad }); console.log('SIDEBAR GEOMETRY', JSON.stringify(failures.at(-1))); }
      }
      await page.evaluate(() => { const { overview, ...collections } = window.qaSidebarOriginal; Object.assign(state, collections); state.whatsapp.overview = overview; updateAdminShell(); delete window.qaSidebarOriginal; });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const parent = page.locator('#adminMenu [data-admin-section=properties]');
      await parent.focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#adminSidebarToggle').getAttribute('aria-expanded'), 'true');
      assert.equal(await parent.getAttribute('aria-expanded'), 'true');
      const child = page.locator('#adminMenu [data-admin-section-link=new-property]');
      await page.locator('#adminSidebarToggle').click();
      assert.equal(await parent.getAttribute('aria-expanded'), 'false');
      assert.equal(await child.evaluate(node => node.closest('.admin-sidebar-subnav').inert), true);
      await parent.focus(); await page.keyboard.press('Enter');
      assert.equal(await parent.getAttribute('aria-expanded'), 'true');
      assert.equal(await child.evaluate(node => node.closest('.admin-sidebar-subnav').inert), false);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.adminSectionLink), 'properties');
      await page.keyboard.press('Tab');
      assert.equal(await child.evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => state.adminSection === 'new-property');
      assert.equal(await child.getAttribute('aria-current'), 'page');
      const files = page.locator('#adminMenu [data-admin-section-link=property-files]');
      await files.focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => state.adminSection === 'property-files');
      assert.equal(await files.getAttribute('aria-current'), 'page');
      await page.locator('#adminSidebarToggle').click();
      await page.locator('#adminMenu [data-admin-section=dashboard]').click();
      await page.waitForFunction(() => state.adminSection === 'dashboard');
      await page.evaluate(async () => { await Promise.allSettled([...adminResourceReads.values()].map(entry => entry.promise)); });
      if (out) {
        await page.locator('#adminMenu').evaluate(node => { node.scrollTop = 0; });
        await page.screenshot({ path: path.join(out, `sidebar-${lang}-${width}-top.png`) });
        await page.locator('#adminMenu').evaluate(node => { node.scrollTop = node.scrollHeight; });
        await page.screenshot({ path: path.join(out, `sidebar-${lang}-${width}-bottom.png`) });
        if (width === 1440) {
          await page.setViewportSize({ width, height: 2200 });
          await page.locator('#adminMenu').evaluate(node => { node.scrollTop = 0; });
          await page.locator('#adminSidebar').screenshot({ path: path.join(out, `sidebar-${lang}-complete.png`) });
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(() => window.innerWidth === 390);
      assert.equal(await page.locator('#adminMenu').isVisible(), false);
      await page.locator('#adminSidebarToggle').click();
      await page.locator('#adminMenu [data-admin-section=properties]').click();
      if (await parent.getAttribute('aria-expanded') !== 'true') await parent.click();
      await child.click();
      await page.waitForFunction(() => state.adminSection === 'new-property');
      assert.equal(await page.locator('#adminMenu').isVisible(), false);
      await page.locator('#adminSidebarToggle').click(); await page.keyboard.press('Escape');
      assert.equal(await page.locator('#adminSidebarToggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#adminSidebarToggle').evaluate(node => node === document.activeElement), true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      console.log('SIDEBAR NAV PASS', lang, width, 'desktop → mobile');
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, [], 'Labels must fit without touching counters');
  } finally {
    if (out) fs.writeFileSync(path.join(out, 'sidebar-results.json'), JSON.stringify({ results, errors, failures }, null, 2));
    await browser.close();
  }
});
