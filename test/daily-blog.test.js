const test = require("node:test");
const assert = require("node:assert/strict");
const { collectOfficialNews, parseOfficialFeed, createDailyBlogService, generateArticle: generateRealArticle, localDay, localHour, renderBlogParagraph, renderBlogSources, researchSources, safeSourceUrl, editorialSourceUrl, editorialSearchPlan, publicResearchActions, DISCOVERY_DOMAINS, validateArticle } = require("../daily-blog");
const noOfficialNews = async () => ({ sources: [], checks: [] });
const generateArticle = options => generateRealArticle({ collectNews: noOfficialNews, ...options });

const now = new Date("2026-11-03T15:00:00.000Z");
const sources = [
  { title: "Comunicado sobre el turismo de Cancún", url: "https://sedetur.qroo.gob.mx/noticia-cancun/", publishedAt: "2026-11-02" },
  { title: "Actualización del aeropuerto de Cancún", url: "https://cgc.qroo.gob.mx/comunicado-cancun/", publishedAt: "2026-11-01" },
];
function candidate() {
  return {
    ready: true, readinessReason: "ready", titleEs: "Novedades de Cancún y la Riviera Maya", titleEn: "News from Cancun and the Riviera Maya",
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
  assert.deepEqual(researchSources(payload).map(source => source.url), [sources[1].url, sources[0].url]);
});

test("editorial discovery excludes government administrative files, indexes and unrelated hosts", () => {
  const rejected = [
    "https://transparenciafocalizada.qroo.gob.mx/viaticos/turismo-2026.pdf",
    "https://transparencia.cancun.gob.mx/noticia", "https://qroo.gob.mx/noticia/", "https://www.asur.com.mx/estados-financieros",
    "https://cgc.qroo.gob.mx/general/secretarias-de-gobierno/sedetur/", "https://cgc.qroo.gob.mx/sedetur/",
    "https://cgc.qroo.gob.mx/cjg/wp-content/uploads/2026/informe.pdf", "https://cgc.qroo.gob.mx/%77p-content/uploads/article.html",
    "https://sedetur.qroo.gob.mx/transparencia/informe", "https://sedetur.qroo.gob.mx/informe.xlsx",
    "https://cgc.qroo.gob.mx/noticias/?s=Cancun", "https://cgc.qroo.gob.mx/noticia%ZZ",
  ];
  for (const url of rejected) assert.equal(editorialSourceUrl(url), "", url);
  for (const source of sources) assert.equal(editorialSourceUrl(source.url), source.url);
  const payload = { output: [{ type: "web_search_call", action: { sources: [...rejected.map(url => ({ url })), ...sources] } }] };
  assert.deepEqual(researchSources(payload).map(s => s.url), sources.map(s => s.url));
});

test("Spanish discovery queries calculate exact windows and month names across year boundaries", () => {
  const plan = editorialSearchPlan("2027-01-03");
  assert.equal(plan.since, "2026-12-27");
  assert.equal(plan.before, "2027-01-04");
  assert.equal(plan.queries.length, 4);
  assert.match(plan.queries[0], /site:cgc\.qroo\.gob\.mx "enero" "2027"/);
  assert.match(plan.queries[1], /"diciembre" "2026" SEDETUR/);
  assert.ok(plan.queries.every(query => query.includes("after:2026-12-27 before:2027-01-04")));
  assert.equal(editorialSearchPlan("2028-03-01").since, "2028-02-23");
  assert.throws(() => editorialSearchPlan("2027-02-30"), { code: "BLOG_INVALID_DAY" });
});

test("public research diagnostics normalize actions without persisting credentials or full result text", () => {
  const actions = publicResearchActions({ output: [
    { type: "web_search_call", action: { type: "search", queries: ["site:cgc.qroo.gob.mx Cancún noviembre 2026", "api_key=private-value Bearer private-header sk-private-secret a@example.com https://user:pass@cgc.qroo.gob.mx/x", 12], sources: [{ content: "private full source text" }] } },
    { type: "web_search_call", action: { type: "open_page", url: "https://cgc.qroo.gob.mx/noticia?token=private-value" } },
    { type: "web_search_call", action: { type: "search", query: "https://cgc.qroo.gob.mx/noticia?session=private-value" } },
  ] });
  assert.equal(actions[0].queries[0], "site:cgc.qroo.gob.mx Cancún noviembre 2026");
  assert.equal(actions[1].type, "open_page");
  assert.equal(actions[2].queries[0], "https://cgc.qroo.gob.mx/noticia");
  assert.doesNotMatch(JSON.stringify(actions), /private|example\.com|user:pass/);
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
  assert.equal(requests[0].tool_choice, "auto");
  assert.equal(requests[0].tools[0].type, "web_search");
  assert.deepEqual(requests[0].tools[0].filters.allowed_domains, ["cgc.qroo.gob.mx", "sedetur.qroo.gob.mx"]);
  assert.equal(requests[0].tools[0].search_context_size, "high");
  assert.equal(requests[0].tools[0].external_web_access, true);
  assert.equal(requests[1].text.format.strict, true);
  assert.match(requests[0].input, /https:\/\/cgc.qroo.gob.mx\/general\/comunicados-recientes\//);
  assert.match(requests[0].input, /2026-10-27 through 2026-11-03/);
  assert.equal(article.diagnostics.stage, "validation");
  await assert.rejects(generateArticle({ apiKey: "test-only", model: "test-model", day: "2026-11-03", fetchImpl: async () => ({ ok: true, json: async () => ({ status: "completed", output_text: "A story without searching." }) }) }), { code: "BLOG_SEARCH_REQUIRED" });
});

test("diagnostics distinguish insufficient retrieved sources from an editorial evidence refusal", async () => {
  const researched = includedSources => ({ status: "completed", output: [{ type: "web_search_call", status: "completed", action: { sources: includedSources } }, { content: [{ type: "output_text", text: "Research result" }] }] });
  await assert.rejects(generateArticle({ apiKey: "test-only", model: "test-model", day: "2026-11-03", fetchImpl: async () => ({ ok: true, json: async () => researched([sources[0]]) }) }), error => {
    assert.equal(error.code, "BLOG_INSUFFICIENT_SOURCES");
    const { discoveryDomains, plannedQueries, searchMode, researchActions, ...result } = error.diagnostics;
    assert.deepEqual(result, { stage: "research", searchCalls: 1, retrievedSources: 1, researchTextCharacters: 15, officialSources: 0, feedChecks: [], sourceUrls: [sources[0].url] });
    assert.deepEqual(discoveryDomains, DISCOVERY_DOMAINS);
    assert.equal(plannedQueries.length, 4);
    return true;
  });
  const refused = { ...candidate(), ready: false, readinessReason: "missing_dates" };
  const replies = [researched(sources), { status: "completed", output_text: JSON.stringify(refused) }];
  await assert.rejects(generateArticle({ apiKey: "test-only", model: "test-model", day: "2026-11-03", fetchImpl: async () => ({ ok: true, json: async () => replies.shift() }) }), error => {
    assert.equal(error.code, "BLOG_NO_VERIFIED_NEWS");
    const { discoveryDomains, plannedQueries, searchMode, researchActions, ...result } = error.diagnostics;
    assert.deepEqual(result, { stage: "validation", searchCalls: 1, retrievedSources: 2, researchTextCharacters: 15, officialSources: 0, feedChecks: [], sourceUrls: sources.map(s => s.url), ready: false, reason: "missing_dates" });
    return true;
  });
});

test("cited sources remain available when broad search results exceed the source cap", () => {
  const broad = Array.from({ length: 25 }, (_, index) => ({ url: `https://cgc.qroo.gob.mx/older-result-${index}` }));
  const payload = { output: [{ type: "web_search_call", action: { sources: broad } }, { content: [{ annotations: sources.map(source => ({ type: "url_citation", ...source })) }] }] };
  const selected = researchSources(payload);
  assert.equal(selected.length, 20);
  assert.deepEqual(selected.slice(0, 2).map(source => source.url), sources.map(source => source.url));
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
  assert.equal((await job.run()).status, "waiting");
  for (const hour of [19, 23]) { current = new Date(`2026-11-03T${hour}:01:00Z`); assert.equal((await job.run()).status, "failed"); }
  current = new Date("2026-11-04T03:30:00Z");
  assert.equal((await job.run()).status, "waiting");
  assert.equal(attempts, 3);
  assert.equal(pool.state.posts.size, 0);
  assert.equal(pool.state.locked, false);
});

test("only one fourth attempt is available manually and the scheduler never consumes it", async () => {
  const pool = mockPool();
  let current = now;
  const job = service(pool, { now: () => current, generate: async () => { throw Object.assign(new Error("no dated sources"), { code: "BLOG_NO_VERIFIED_NEWS" }); } });
  assert.equal((await job.run()).status, "skipped");
  assert.equal((await job.run()).status, "waiting");
  assert.equal((await job.run({ manual: true })).status, "skipped");
  assert.equal((await job.run({ manual: true })).status, "skipped");
  current = new Date("2026-11-03T23:01:00Z");
  assert.equal((await job.run()).status, "waiting");
  assert.equal(pool.state.runs.get("2026-11-03").attempts, 3);
  assert.equal((await job.run({ manual: true })).status, "skipped");
  assert.equal((await job.run()).status, "waiting");
  assert.equal((await job.run({ manual: true })).status, "waiting");
  assert.equal(pool.state.runs.get("2026-11-03").attempts, 4);
  assert.equal((await job.getStatus()).manualAttemptLimit, 4);
  assert.equal((await job.getStatus()).automaticAttemptLimit, 3);
  const publishedPool = mockPool();
  const published = service(publishedPool);
  assert.equal((await published.run()).status, "published");
  assert.equal((await published.run({ manual: true })).existing, true);
  assert.equal(publishedPool.state.posts.size, 1);
  assert.equal((await published.getStatus()).today, "2026-11-03");
});

test("a persisted third failure can recover once manually without resetting history or duplicating publication", async () => {
  const pool = mockPool();
  const failing = service(pool, { generate: async () => { throw Object.assign(new Error("no dated sources"), { code: "BLOG_NO_VERIFIED_NEWS" }); } });
  for (let attempt = 0; attempt < 3; attempt++) await failing.run({ manual: true });
  const recoveredWorker = service(pool);
  assert.equal((await recoveredWorker.run()).status, "waiting");
  assert.equal((await recoveredWorker.run({ manual: true })).status, "published");
  assert.equal(pool.state.runs.get("2026-11-03").attempts, 4);
  assert.equal((await service(pool).run({ manual: true })).existing, true);
  assert.equal(pool.state.posts.size, 1);
  assert.equal(pool.state.locked, false);
});

test("local environments, missing credentials and pre-schedule times produce no provider calls", async () => {
  const pool = mockPool();
  assert.equal((await service(pool, { env: {} }).run()).status, "disabled");
  assert.equal((await service(pool, { env: { NODE_ENV: "production" } }).run()).status, "unconfigured");
  assert.equal((await service(pool, { now: () => new Date("2026-11-03T12:00:00Z") }).run()).status, "scheduled");
  assert.equal(pool.state.calls.length, 0);
});

function feedItem({ url = "https://cgc.qroo.gob.mx/noticia-cancun/", date = "Thu, 29 Oct 2026 16:00:00 +0000", content = "Información oficial del turismo de Cancún. ".repeat(12), title = "Noticias oficiales del turismo de Cancún" } = {}) {
  return `<item><title><![CDATA[${title}]]></title><link>${url}</link><pubDate>${date}</pubDate><content:encoded><![CDATA[<p>${content}</p>]]></content:encoded></item>`;
}

test("official RSS evidence preserves publisher dates, full content and deduplicated exact URLs", () => {
  const xml = `<rss><channel>${feedItem()}${feedItem()}</channel></rss>`;
  const parsed = parseOfficialFeed(xml, "2026-11-03");
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].publishedAt, "2026-10-29");
  assert.equal(parsed[0].dateEvidence, "official-rss-pubDate");
  assert.match(parsed[0].content, /turismo de Cancún/);
  assert.doesNotMatch(parsed[0].content, /<p>/);
});

test("RSS evidence rejects stale, future, missing dates, incomplete text, irrelevant topics and hostile URLs", () => {
  const invalidItems = [
    { date: "Mon, 19 Oct 2026 16:00:00 +0000" }, { date: "Thu, 05 Nov 2026 16:00:00 +0000" }, { date: "" },
    { content: "Noticia sin cuerpo" }, { url: "https://attacker.test/noticia" },
    { title: "Informe de política nacional", content: "Informe nacional sin relación con el destino. ".repeat(12) },
  ];
  for (const item of invalidItems) assert.deepEqual(parseOfficialFeed(`<rss>${feedItem(item)}</rss>`, "2026-11-03"), []);
  assert.deepEqual(parseOfficialFeed(`<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss>${feedItem()}</rss>`, "2026-11-03"), []);
  assert.deepEqual(parseOfficialFeed("x".repeat(1500001), "2026-11-03"), []);
});

test("bounded official feed collector records public diagnostics and refuses redirects off the publisher", async () => {
  const called = [];
  const result = await collectOfficialNews({ day: "2026-11-03", fetchImpl: async (url, options) => {
    called.push({ url, options });
    if (url.includes("secretarias")) return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
    return new Response(`<rss>${feedItem()}</rss>`, { headers: { "content-type": "application/rss+xml" } });
  } });
  assert.equal(called.length, 2);
  assert.ok(called.every(call => call.options.redirect === "manual"));
  assert.equal(result.sources.length, 1);
  assert.equal(result.checks[0].code, "BLOG_FEED_DESTINATION");
  assert.equal(result.checks[1].status, "verified");
  assert.doesNotMatch(JSON.stringify(result.checks), /127\.0\.0\.1|Información|Authorization/);
  const tooLarge = await collectOfficialNews({ day: "2026-11-03", fetchImpl: async () => new Response("x".repeat(1500001), { headers: { "content-type": "application/rss+xml" } }) });
  assert.ok(tooLarge.checks.every(check => check.code === "BLOG_FEED_TOO_LARGE"));
});

test("draft receives independently retrieved dates even when search only finds an archive", async () => {
  const officialSources = sources.map(source => ({ ...source, content: "Información oficial verificada sobre turismo de Cancún. ".repeat(6), dateEvidence: "official-rss-pubDate" }));
  const requests = [];
  const responses = [
    { status: "completed", output: [{ type: "web_search_call", status: "completed", action: { sources: [{ url: "https://cgc.qroo.gob.mx/sedetur/" }] } }], output_text: "El índice no contiene fechas en el extracto disponible." },
    { status: "completed", output_text: JSON.stringify(candidate()) },
  ];
  const article = await generateArticle({ apiKey: "test-only", model: "test", day: "2026-11-03", collectNews: async () => ({ sources: officialSources, checks: [] }), fetchImpl: async (_url, options) => {
    requests.push(JSON.parse(options.body)); return { ok: true, json: async () => responses.shift() };
  } });
  assert.equal(article.sources.length, 2);
  assert.equal(article.diagnostics.officialSources, 2);
  const draftInput = JSON.parse(requests[1].input);
  assert.equal(draftInput.officialDatedArticles[0].publishedAt, sources[0].publishedAt);
  assert.match(draftInput.officialDatedArticles[0].content, /verificada/);
  const badDate = candidate(); badDate.sources[0].publishedAt = "2026-11-01";
  assert.throws(() => validateArticle(badDate, officialSources, "2026-11-03"), { code: "BLOG_UNVERIFIED_SOURCE" });
});

test("unreachable feeds allow dated official article text retrieved through the search index", async () => {
  const research = sources.map(source => `${source.url}\nEvidence: indexed official article text; publisher could not be opened. Publisher-stated publication date: ${source.publishedAt}.\nThe official announcement identifies Cancun as the location. It describes a tourism coordination meeting held that week. It names the public office responsible for the follow-up and explains where visitors can consult the published information.`).join("\n\n");
  const requests = [];
  const responseBodies = [
    { status: "completed", output: [{ type: "web_search_call", status: "completed", action: { sources } }], output_text: research },
    { status: "completed", output_text: JSON.stringify(candidate()) },
  ];
  let apiCalls = 0;
  const article = await generateRealArticle({ apiKey: "test-only", model: "test", day: "2026-11-03", fetchImpl: async (url, options) => {
    if (url.startsWith("https://cgc.qroo.gob.mx/")) {
      assert.ok(options.signal instanceof AbortSignal);
      throw new DOMException("network message that should remain private", "TimeoutError");
    }
    apiCalls++;
    assert.equal(url, "https://api.openai.com/v1/responses");
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => responseBodies.shift() };
  } });
  assert.equal(apiCalls, 2);
  assert.equal(article.sources.length, 2);
  assert.equal(article.sources[0].publishedAt, sources[0].publishedAt);
  assert.match(requests[0].input, /Start with topic-and-date-window searches/);
  assert.match(requests[0].input, /after at most two failed opens/);
  assert.match(requests[0].input, /substantial article text supporting at least three distinct concrete facts/);
  assert.match(requests[1].instructions, /Opening failures alone do not invalidate/);
  assert.equal(requests[0].tools[0].external_web_access, false);
  assert.equal(article.diagnostics.searchMode, "indexed");
  assert.match(requests[0].input, /Use the search index only; do not attempt live page opens/);
  assert.deepEqual(article.diagnostics.discoveryDomains, DISCOVERY_DOMAINS);
  assert.equal(JSON.parse(requests[1].input).research, research);
  assert.ok(article.diagnostics.feedChecks.every(check => check.code === "BLOG_FEED_UNAVAILABLE"));
  assert.doesNotMatch(JSON.stringify(article.diagnostics), /remain private|test-only/);
});

test("indexed headlines without publication dates remain an editorial refusal", async () => {
  const requests = [];
  const replies = [
    { status: "completed", output: [{ type: "web_search_call", status: "completed", action: { sources } }], output_text: "Only brief headlines and crawl dates were indexed. No explicit publication dates or sufficient article facts were available; both articles are unusable." },
    { status: "completed", output_text: JSON.stringify({ ...candidate(), ready: false, readinessReason: "missing_dates", sources: [], sections: [] }) },
  ];
  await assert.rejects(generateArticle({ apiKey: "test-only", model: "test", day: "2026-11-03", fetchImpl: async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => replies.shift() };
  } }), error => {
    assert.equal(error.code, "BLOG_NO_VERIFIED_NEWS");
    assert.equal(error.diagnostics.reason, "missing_dates");
    return true;
  });
  assert.match(requests[0].input, /Never infer a missing publication date/);
  assert.match(requests[1].instructions, /A headline, brief snippet or date inferred.*is insufficient; reject that source/);
});

test("source preflight cancels both stalled feeds before a ten-second browser deadline", { timeout: 11000 }, async () => {
  const start = performance.now();
  let cancelled = 0;
  const result = await collectOfficialNews({ day: "2026-11-03", fetchImpl: (_url, { signal }) => new Promise((resolve, reject) => {
    // Keep the event loop alive and fail clearly if the production abort stops working.
    const watchdog = setTimeout(() => reject(new Error("Feed deadline exceeded")), 10000);
    signal.addEventListener("abort", () => { clearTimeout(watchdog); cancelled++; reject(signal.reason); }, { once: true });
  }) });
  assert.equal(cancelled, 2);
  assert.ok(performance.now() - start < 9500, "Both feeds must share a parallel deadline below the browser timeout");
  assert.deepEqual(result.sources, []);
  assert.ok(result.checks.every(check => check.status === "unavailable"));
});

test("source preflight never consumes an attempt, calls AI or writes to PostgreSQL", async () => {
  const pool = mockPool();
  const job = service(pool, { fetchImpl: async url => {
    assert.ok(url.startsWith("https://cgc.qroo.gob.mx/"));
    return new Response(`<rss>${feedItem()}</rss>`, { headers: { "content-type": "application/rss+xml" } });
  } });
  const result = await job.inspectSources();
  assert.equal(result.day, "2026-11-03");
  assert.equal(result.sources[0].publishedAt, "2026-10-29");
  assert.match(result.sources[0].excerpt, /Información oficial/);
  assert.ok(result.sources[0].excerpt.length <= 1200);
  assert.equal(pool.state.calls.length, 0);
  assert.equal(pool.state.runs.size, 0);
});

test("tool calls without a research report fail before draft generation when no independent full articles exist", async () => {
  let calls = 0;
  await assert.rejects(generateArticle({ apiKey: "test-only", model: "test", day: "2026-11-03", fetchImpl: async () => {
    calls++;
    return { ok: true, json: async () => ({ status: "completed", output: [{ type: "web_search_call", status: "completed", action: { sources } }] }) };
  } }), error => {
    assert.equal(error.code, "BLOG_EMPTY_RESEARCH");
    assert.equal(error.diagnostics.researchTextCharacters, 0);
    assert.equal(error.diagnostics.searchCalls, 1);
    assert.deepEqual(error.diagnostics.sourceUrls, sources.map(s => s.url));
    return true;
  });
  assert.equal(calls, 1);
});
