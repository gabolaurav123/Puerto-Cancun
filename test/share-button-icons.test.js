const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const fallbackSource = app.match(/const fallbackIcons = \{[^]*?\n};/)[0];
const refreshSource = app.match(/function refreshIcons\([^]*?\n}/)[0];

test('share icon uses Lucide when available', () => {
  let calls = 0;
  vm.runInNewContext(`${fallbackSource}\n${refreshSource}\nrefreshIcons();`, {
    window: { lucide: { createIcons() { calls += 1; } } },
    $$() { assert.fail('Fallback should not run when Lucide is available'); },
  });
  assert.equal(calls, 1);
});

test('share icon stays visible when the icon CDN is unavailable, including new buttons', () => {
  const icon = () => ({ dataset: { lucide: 'share-2' }, innerHTML: '' });
  const icons = [icon()];
  const refresh = vm.runInNewContext(`${fallbackSource}\n${refreshSource}\nrefreshIcons;`, {
    window: {}, $$: () => icons,
  });
  refresh();
  const firstMarkup = icons[0].innerHTML;
  assert.match(firstMarkup, /<svg[^>]+stroke="currentColor"/);
  assert.equal((firstMarkup.match(/<circle /g) || []).length, 3);
  assert.equal((firstMarkup.match(/<line /g) || []).length, 2);
  icons.push(icon());
  refresh();
  assert.equal(icons[0].innerHTML, firstMarkup);
  assert.equal(icons[1].innerHTML, firstMarkup);
  assert.equal(icons[1].dataset.rendered, 'true');
});
