const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = path.resolve(__dirname, '../../../output/master-20261029/measurements');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
  const report = { date: new Date().toISOString(), mode: 'Laboratory, unthrottled, one sample per viewport; not field p75', samples: [] };
  try {
    for (const [name, base] of [['production-before', 'https://www.puertocancun.center'], ['local-after', 'http://127.0.0.1:3072']]) {
      for (const width of [1440, 768, 390, 375]) {
        const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
        await context.addInitScript(() => {
          window.qaMetrics = { lcp: null, cls: 0 };
          new PerformanceObserver(list => { for (const entry of list.getEntries()) window.qaMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.qaMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
        });
        const page = await context.newPage();
        for (const [kind, route] of [['home', '/'], ['catalog', '/propiedades']]) {
          await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
          const consent = page.getByRole('button', { name: /Solo esenciales|Only essential/i });
          if (await consent.isVisible()) await consent.click();
          const data = await page.evaluate(() => {
            const price = document.querySelector('.seo-property-price, .property-price');
            const nav = performance.getEntriesByType('navigation')[0];
            return { ...window.qaMetrics, firstPriceY: price?.getBoundingClientRect().top ?? null, overflow: document.documentElement.scrollWidth > innerWidth + 1, ttfb: nav?.responseStart, domReady: nav?.domContentLoadedEventEnd, assets: performance.getEntriesByType('resource').length };
          });
          report.samples.push({ source: name, kind, width, ...data });
          await page.screenshot({ path: path.join(output, `${name}-${kind}-${width}.png`) });
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
