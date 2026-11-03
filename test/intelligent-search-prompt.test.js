const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const css = fs.readFileSync(require.resolve('../styles.css'), 'utf8');

test('search uses a short area or property prompt in both languages', () => {
  assert.match(app, /searchPlaceholder: "Zona o propiedad"/);
  assert.match(app, /searchPlaceholder: "Area or property"/);
  assert.doesNotMatch(app, /searchPlaceholder: "(?:Ciudad, dirección, código postal|City, address, zip code)"/);
  assert.match(html, /id="searchInput"[^>]*placeholder="Zona o propiedad"/);
});

test('the prompt can wrap without changing the search input or covering typed text', () => {
  assert.match(html, /class="search-field-prompt" data-i18n="searchPlaceholder" aria-hidden="true"/);
  assert.match(html, /id="searchInput"\s+type="search"/);
  assert.match(css, /#searchForm \.search-field-prompt \{[^}]*pointer-events: none/);
  assert.match(css, /#searchInput:not\(:placeholder-shown\) \+ \.search-field-prompt \{\s+visibility: hidden/);
});
