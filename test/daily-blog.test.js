const test = require("node:test");
const assert = require("node:assert/strict");
const { createDailyBlogService, generateArticle, localDay, localHour, renderBlogParagraph, renderBlogSources, researchSources, safeSourceUrl, validateArticle } = require("../daily-blog");

const now = new Date("2026-11-03T15:00:00.000Z");
const sources = [
  { title: "Comunicado sobre el turismo de Cancún", url: "https://sedetur.qroo.gob.mx/noticia-cancun/", publishedAt: "2026-11-02" },
  { title: "Actualización del aeropuerto de Cancún", url: "https://www.asur.com.mx/comunicado-cancun", publishedAt: "2026-11-01" },
];
function candidate() {
  return {
    ready: true, titleEs: "Novedades de Cancún y la Riviera Maya", titleEn: "News from Cancun and the Riviera Maya",
    excerptEs: "Una revisión de los anuncios oficiales recientes de turismo y conectividad local.",
    excerptEn: "A review of recent official announcements about tourism and local connectivity.",
    sources: structuredClone(sources),
    sections: sources.map((source, index) => ({ headingEs: source.title, headingEn: "Official local update",
      textEs: "La fuente oficial describe las novedades del destino y las fechas correspondientes. Este resumen conserva el contexto del anuncio para facilitar su consulta.",
      textEn: "The official source describes local developments and their corresponding dates. This summary preserves the announcement's context so readers can consult its details.",
      sourceIds: [index + 1] })),
  };
}

test("Cancun editorial day and hour do not depend on server timezone", () => {
  assert.equal(localDay(new Date("2026-11-03T03:30:00Z")), "2026-11-02");
  assert.equal(localHour(new Date("2026-11-03T13:00:00Z")), 8);
});

test("official source URLs reject deceptive domains, credentials, roots and non-HTTPS protocols", () => {
  for (const url of ["https://qroo.gob.mx.evil.test/news", "https://evilqroo.gob.mx/news", "http://qroo.gob.mx/news", "https://user:pass@qroo.gob.mx/news", "https://qroo.gob.mx:8443/news", "https://qroo.gob.mx/", "javascript:alert(1)"]) assert.equal(safeSourceUrl(url), "");
  assert.equal(safeSourceUrl("https://sedetur.qroo.gob.mx/noticia?utm_source=test#news"), "https://sedetur.qroo.gob.mx/noticia");
});

test("source evidence is extracted from search results and annotations, not generated prose URLs", () => {
  const payload = { output: [{ type: "web_search_call", action: { sources: [sources[0]] } }, { content: [{ text: "https://qroo.gob.mx/invented", annotations: [{ type: "url_citation", ...sources[1] }, { url: "https://attacker.test/news" }] }] }] };
  assert.deepEqual(researchSources(payload).map(source => source.url), sources.map(source => source.url));
});

test("bilingual daily article preserves clickable citation references", () => {
  const article = validateArticle(candidate(), sources, "2026-11-03");
  assert.match(article.contentEs, /\[1\]/);
  assert.match(article.contentEn, /\[2\]/);
  assert.equal(article.sources.length, 2);
  const paragraph = renderBlogParagraph('Información <script>alert(1)</script> [1]', article.sources);
  assert.match(paragraph, /&lt;script&gt;/);
  assert.match(paragraph, /href="https:\/\/sedetur.qroo.gob.mx\/noticia-cancun\/"/);
  assert.doesNotMatch(paragraph, /<script>/);
  assert.match(renderBlogParagraph("## Nota del día", article.sources), /^<h2>/);
  assert.match(renderBlogSources(article.sources, "en"), /<h2>Sources<\/h2>/);
});

test("publication rejects missing, unobserved, old or future source evidence", () => {
  for (const mutate of [
    article => { article.sources[0].url = "https://qroo.gob.mx/not-consulted"; },
    article => { article.sources[0].publishedAt = "2026-10-20"; },
    article => { article.sources[0].publishedAt = "2026-11-04"; },
    article => { article.sources[0].publishedAt = ""; },
    article => { article.sections[0].sourceIds = [9]; },
    article => { article.sources = [article.sources[0]]; },
    article => { article.ready = false; },
  ]) { const article = candidate(); mutate(article); assert.throws(() => validateArticle(article, sources, "2026-11-03")); }
  assert.throws(() => validateArticle(candidate(), sources, "2026-11-03", sources.map(source => source.url)), { code: "BLOG_DUPLICATE_NEWS" });
});

test("source-based summaries cannot exceed the editorial attribution budget", () => {
  const article = candidate();
  article.sections[0].textEs = Array(192).fill("texto").join(" ");
  assert.throws(() => validateArticle(article, sources, "2026-11-03"), { code: "BLOG_SOURCE_TOO_LONG" });
});

test("an unused new source cannot disguise a previously covered daily edition", () => {
  const article = candidate();
  article.sources.push({ title: "Otra novedad oficial", url: "https://qroo.gob.mx/otra-novedad", publishedAt: "2026-11-03" });
  assert.throws(() => validateArticle(article, article.sources, "2026-11-03", sources.map(source => source.url)), { code: "BLOG_DUPLICATE_NEWS" });
  assert.throws(() => validateArticle(article, article.sources, "2026-11-03"), { code: "BLOG_UNUSED_SOURCE" });
});

test("generation requires completed web research and validates structured bilingual output", async () => {
  const requests = [];
  const replies = [
    { status: "completed", output: [{ type: "web_search_call", status: "completed", action: { sources } }, { content: [{ type: "output_text", text: "Verified source facts with dates." }] }] },
    { status: "completed", output_text: JSON.stringify(candidate()) },
  ];
  const article = await generateArticle({ apiKey: "test-only", model: "test-model", day: "2026-11-03", fetchImpl: async (url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => replies.shift() }; } });
  assert.equal(article.sources.length, 2);
  assert.equal(requests[0].tool_choice, "required");
  assert.equal(requests[0].tools[0].type, "web_search");
  assert.equal(requests[1].text.format.strict, true);
  await assert.rejects(generateArticle({ apiKey: "test-only", model: "test-model", day: "2026-11-03", fetchImpl: async () => ({ ok: true, json: async () => ({ status: "completed", output_text: "A story without searching." }) }) }), { code: "BLOG_SEARCH_REQUIRED" });
});

function mockPool() {
  const state = { runs: new Map(), posts: new Map(), locked: false, released: 0, calls: [] };
  async function query(sql, args = []) {
    state.calls.push(sql);
    if (sql.startsWith("SELECT pg_try")) { const locked = !state.locked; if (locked) state.locked = true; return { rows: [{ locked }] }; }
    if (sql.startsWith("SELECT pg_advisory_unlock")) { state.locked = false; return { rows: [] }; }
    if (sql.startsWith("SELECT * FROM daily_blog_runs")) return { rows: state.runs.has(args[0]) ? [state.runs.get(args[0])] : [] };
    if (sql.startsWith("INSERT INTO daily_blog_runs")) {
      const existing = state.runs.get(args[0]);
      state.runs.set(args[0], { status: "running", attempts: (existing?.attempts || 0) + 1, next_retry_at: args[2] });
    }
    if (sql.startsWith("SELECT title_es")) return { rows: [...state.posts.values()].map(post => ({ title_es: post.title, source_links: post.sources })) };
    if (sql.startsWith("INSERT INTO blog_posts")) state.posts.set(args[0], { title: args[2], sources: JSON.parse(args[9]) });
    if (sql.startsWith("UPDATE daily_blog_runs SET status = 'published'")) Object.assign(state.runs.get(args[0]), { status: "published", post_id: args[1], next_retry_at: null });
    if (sql.startsWith("UPDATE daily_blog_runs SET status = $2")) Object.assign(state.runs.get(args[0]), { status: args[1], error_code: args[2] });
    return { rows: [] };
  }
  return { state, query, connect: async () => ({ query, release: () => state.released++ }) };
}

function service(pool, options = {}) {
  return createDailyBlogService({ pool, env: { NODE_ENV: "production", OPENAI_API_KEY: "test-only" }, now: () => now, generate: async () => validateArticle(candidate(), sources, "2026-11-03"), logger: { warn() {} }, ...options });
}

test("daily publication is idempotent and accumulates without overwriting earlier posts", async () => {
  const pool = mockPool();
  let current = now;
  let count = 0;
  const job = service(pool, { now: () => current, onPublish: () => count++ });
  assert.equal((await job.run()).status, "published");
  assert.equal((await job.run()).existing, true);
  current = new Date("2026-11-04T15:00:00Z");
  assert.equal((await job.run()).status, "published");
  assert.equal(pool.state.posts.size, 2);
  assert.equal(count, 2);
  assert.equal(pool.state.locked, false);
});

test("concurrent workers cannot publish duplicate daily editions", async () => {
  const pool = mockPool();
  let finish;
  const first = service(pool, { generate: () => new Promise(resolve => { finish = resolve; }) });
  const pending = first.run();
  while (!finish) await new Promise(resolve => setImmediate(resolve));
  assert.equal((await service(pool).run()).status, "running");
  assert.equal((await first.run()).status, "running");
  finish(validateArticle(candidate(), sources, "2026-11-03"));
  assert.equal((await pending).status, "published");
  assert.equal(pool.state.posts.size, 1);
});

test("failed generation publishes nothing and applies persisted retry limits", async () => {
  const pool = mockPool();
  let current = now;
  let attempts = 0;
  const job = service(pool, { now: () => current, generate: async () => { attempts++; throw Object.assign(new Error("sensitive provider details"), { code: "BLOG_PROVIDER_429" }); } });
  assert.deepEqual(await job.run(), { status: "failed", errorCode: "BLOG_PROVIDER_429" });
  assert.equal((await job.run({ manual: true })).status, "waiting");
  for (const hour of [19, 23]) { current = new Date(`2026-11-03T${hour}:01:00Z`); assert.equal((await job.run()).status, "failed"); }
  current = new Date("2026-11-04T03:30:00Z");
  assert.equal((await job.run()).status, "waiting");
  assert.equal(attempts, 3);
  assert.equal(pool.state.posts.size, 0);
  assert.equal(pool.state.locked, false);
});

test("local environments, missing credentials and pre-schedule times produce no provider calls", async () => {
  const pool = mockPool();
  assert.equal((await service(pool, { env: {} }).run()).status, "disabled");
  assert.equal((await service(pool, { env: { NODE_ENV: "production" } }).run()).status, "unconfigured");
  assert.equal((await service(pool, { now: () => new Date("2026-11-03T12:00:00Z") }).run()).status, "scheduled");
  assert.equal(pool.state.calls.length, 0);
});
