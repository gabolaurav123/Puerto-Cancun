const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const copy = require('../site-language.js');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const css = fs.readFileSync(require.resolve('../styles.css'), 'utf8');

test('the home search offers examples of locations, listings and transactions in both languages', () => {
  assert.equal(copy.es.searchPlaceholder, 'Zona, desarrollo, departamento, casa, terreno, renta o preventa');
  assert.equal(copy.en.searchPlaceholder, 'Zone, development, apartment, house, land, rental or presale');
  const input = html.match(/id="searchInput"[^>]*>/)[0];
  assert.ok(input.includes(`aria-label="${copy.es.searchPlaceholder}"`));
  assert.ok(input.includes(`placeholder="${copy.es.searchPlaceholder}"`));
  assert.ok(html.includes(`aria-hidden="true">${copy.es.searchPlaceholder}</span>`));
});

test('the prompt can wrap without changing the search input or covering typed text', () => {
  assert.match(html, /class="search-field-prompt" data-i18n="searchPlaceholder" aria-hidden="true"/);
  assert.match(html, /id="searchInput"\s+type="search"/);
  assert.match(css, /#searchForm \.search-field-prompt \{[^}]*pointer-events: none/);
  assert.match(css, /#searchInput:not\(:placeholder-shown\) \+ \.search-field-prompt \{\s+visibility: hidden/);
});
