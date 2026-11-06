const test = require("node:test");
const assert = require("node:assert/strict");
const { blogArchiveHref, blogListQuery, editorialCover, normalizeBlogPagination, paginateBlogRows, renderBlogList } = require("../blog-list-view");

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
  assert.match(html, /href="\/blog\/slug%3F%22bad\?page=2"/);
  assert.match(html, /&lt;script&gt;hola&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|javascript:/);
  assert.match(html, /rel="prev" href="\/blog"/);
  assert.match(html, /rel="next" href="\/blog\?page=3"/);
  assert.match(renderBlogList([post], "en", { page: 1, hasNext: true }), /href="\/en\/blog\?page=2"/);
});

test("topic navigation preserves the filtered archive and page on article and pagination links in either language", () => {
  const post = { slug: "guia-para-comprar-en-cancun", titleEs: "Guía para comprar", titleEn: "Buying guide", publishedAt: "2026-07-20T15:00:00Z" };
  for (const [lang, base, label] of [["es", "/blog", "Guías para comprar"], ["en", "/en/blog", "Buying guides"]]) {
    const html = renderBlogList([post], lang, { page: 2, topic: "buy", hasNext: true });
    assert.ok(html.includes(`href="${base}?topic=buy" aria-current="page">${label}</a>`));
    assert.ok(html.includes(`href="${base}/${post.slug}?topic=buy&amp;page=2"`));
    assert.ok(html.includes(`rel="prev" href="${base}?topic=buy"`));
    assert.ok(html.includes(`rel="next" href="${base}?topic=buy&amp;page=3"`));
    assert.ok(html.includes(`href="${base}?topic=sell"`));
    assert.equal(blogArchiveHref(lang, { page: "2", topic: "buy", next: "https://example.com/" }), `${base}?topic=buy&page=2`);
    assert.equal(blogArchiveHref(lang, { page: "invalid", topic: ["buy"] }), base);
  }
});

test("category filters bind only known topics and preserve automated news and published guide covers", () => {
  for (const [topic, slug, automationDate] of [["buy", "guia-para-comprar-propiedad"], ["sell", "como-preparar-propiedad-para-vender"], ["areas", "como-elegir-zona-para-comprar"], ["news", "zona-para-comprar", "2026-11-03"]]) {
    const query = blogListQuery({ lang: "en", topic, page: 2, limit: 1 });
    assert.deepEqual(query.values, [2, "en", 1, topic]);
    assert.match(query.text, /END\) = \$4\s+ORDER BY[\s\S]+LIMIT \$1 OFFSET \$3/);
    assert.equal(editorialCover({ slug, automationDate }), `/assets/editorial-${topic}.svg`);
  }
  assert.equal(editorialCover({ slug: "zona", coverImage: "/media/blog/post-example" }), "/media/blog/post-example?w=720");
  for (const topic of ["__proto__", "constructor", "buy' OR 1=1", ["news"]]) {
    const query = blogListQuery({ topic });
    assert.deepEqual(query.values, [25, "es", 0]);
    assert.equal(query.pagination.topic, "");
  }
});

test("an empty deep archive page still provides a way back and never invents a next page", () => {
  const html = renderBlogList([], "en", { page: 10, hasNext: false });
  assert.match(html, /There are no articles/);
  assert.match(html, /href="\/en\/blog\?page=9"/);
  assert.doesNotMatch(html, /rel="next"/);
});
