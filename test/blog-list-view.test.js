const test = require("node:test");
const assert = require("node:assert/strict");
const { blogListQuery, normalizeBlogPagination, paginateBlogRows, renderBlogList } = require("../blog-list-view");

test("archive pagination uses bounded numeric parameters and a stable query order", () => {
  for (const page of ["0", "-1", "1 OR 1=1", "Infinity", ["2", "3"]]) assert.equal(normalizeBlogPagination({ page }).page, 1);
  const query = blogListQuery({ page: "3", limit: "12", lang: "en" });
  assert.deepEqual(query.values, [13, "en", 24]);
  assert.match(query.text, /id DESC LIMIT \$1 OFFSET \$3/);
  assert.match(query.text, /content_en/);
  assert.equal(normalizeBlogPagination({ limit: 5000 }).limit, 60);
});

test("archive traverses all older posts without dropping or duplicating boundary items", () => {
  const inventory = Array.from({ length: 53 }, (_, id) => ({ id }));
  const visited = [];
  for (let page = 1; page <= 3; page++) {
    const query = blogListQuery({ page });
    const result = paginateBlogRows(inventory.slice(query.pagination.offset, query.pagination.offset + query.values[0]), query.pagination);
    visited.push(...result.rows.map(post => post.id));
    assert.equal(result.pagination.hasNext, page < 3);
  }
  assert.deepEqual(visited, inventory.map(post => post.id));
});

test("server-rendered cards and archive links remain usable without JavaScript and escape content", () => {
  const post = { slug: 'slug?"bad', titleEs: '<script>hola</script>', titleEn: 'Local news', excerptEs: 'Resumen & datos', excerptEn: 'Local summary', publishedAt: '2026-11-03T15:00:00Z', coverImage: 'javascript:alert(1)' };
  const html = renderBlogList([post], "es", { page: 2, hasNext: true });
  assert.match(html, /data-server-rendered="true"/);
  assert.match(html, /href="\/blog\/slug%3F%22bad"/);
  assert.match(html, /&lt;script&gt;hola&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|javascript:/);
  assert.match(html, /rel="prev" href="\/blog"/);
  assert.match(html, /rel="next" href="\/blog\?page=3"/);
  assert.match(renderBlogList([post], "en", { page: 1, hasNext: true }), /href="\/en\/blog\?page=2"/);
});

test("an empty deep archive page still provides a way back and never invents a next page", () => {
  const html = renderBlogList([], "en", { page: 10, hasNext: false });
  assert.match(html, /There are no articles/);
  assert.match(html, /href="\/en\/blog\?page=9"/);
  assert.doesNotMatch(html, /rel="next"/);
});
