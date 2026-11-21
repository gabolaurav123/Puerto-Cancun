"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { internalRoleAllows } = require("../auth-utils");
const { sameOriginMutationGuard } = require("../platform-utils");
const { validateCriteria, sourceUrl, parseSearchResponse, searchProperties, registerPropertySearchRoutes } = require("../property-web-search");

const criteria = "Departamento en Puerto Cancún, venta, 2 recámaras, hasta 600,000 USD";
const listing = (url, title = "Departamento junto a la marina") => ({ title, url, price: "USD 550,000", location: "Puerto Cancún", features: ["2 recámaras", "2 baños"], matches: ["Zona y presupuesto"], toConfirm: ["Cuota de mantenimiento"] });
function output(listings, sourceUrls = listings.map(item => item.url)) {
  return { status: "completed", output: [
    { type: "web_search_call", status: "completed", action: { type: "search", sources: sourceUrls.map(url => ({ type: "url", url })) } },
    { type: "message", content: [{ type: "output_text", text: JSON.stringify({ summary: "Resumen", listings }), annotations: [] }] },
  ] };
}

test("search accepts bounded property criteria and rejects empty, oversized and nontext input", () => {
  assert.equal(validateCriteria("  " + criteria + "  "), criteria);
  for (const value of [null, {}, "casa", " ".repeat(20), "a".repeat(2501)]) assert.throws(() => validateCriteria(value), failure => failure.status === 400);
});

test("only safe HTTPS sources returned by web search can become listing links", () => {
  const legitimate = "https://www.inmuebles24.com/propiedades/depto-marina-123.html";
  const data = output([
    listing(legitimate + "?utm_source=foo"), listing(legitimate),
    listing("https://portal.example/invented"), listing("javascript:alert(1)"),
    listing("https://127.0.0.1/private"), listing("https://localhost/admin"),
  ], [legitimate, "javascript:alert(1)", "https://127.0.0.1/private", "https://localhost/admin"]);
  const result = parseSearchResponse(data);
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].url, legitimate);
  assert.equal(result.listings[0].price, "USD 550,000");
  assert.equal(result.listings[0].portal, "inmuebles24.com");
  assert.deepEqual(result.listings[0].toConfirm, ["Cuota de mantenimiento"]);
  assert.match(result.warning, /omitieron/);
  assert.match(result.notice, /Confírmalos/);
  for (const url of ["http://portal.example/listing", "https://user:secret@portal.example/listing", "https://foo.internal/listing", "https://[::1]/listing"]) assert.equal(sourceUrl(url), "");
});

test("search supports citation annotations, reports distinct portals, caps results, and rejects ungrounded or incomplete outputs", () => {
  const rows = Array.from({ length: 12 }, (_, i) => listing(`https://portal${i % 3}.example/listing/${i}`));
  const response = output(rows, []);
  response.output[1].content[0].annotations = rows.map(item => ({ type: "url_citation", url: item.url, title: item.title }));
  const result = parseSearchResponse(response);
  assert.equal(result.listings.length, 8);
  assert.equal(result.portals.length, 3);
  assert.match(result.summary, /3 portales/);
  assert.throws(() => parseSearchResponse({ ...response, status: "incomplete" }), failure => failure.code === "SEARCH_INCOMPLETE");
  assert.throws(() => parseSearchResponse({ status: "completed", output: response.output.slice(1) }), failure => failure.code === "SEARCH_NOT_GROUNDED");
  const noResults = parseSearchResponse(output([]));
  assert.equal(noResults.listings.length, 0);
  assert.match(noResults.summary, /No encontramos/);
});

test("provider request uses actual live search, no stored response, bounded cost and source-grounded output", async () => {
  let request;
  const found = listing("https://www.propiedades.com/inmuebles/test-123");
  const result = await searchProperties(criteria, { apiKey: "fake-key", fetchImpl: async (url, options) => {
    request = { url, ...options, data: JSON.parse(options.body) };
    return { ok: true, json: async () => output([found]) };
  } });
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.data.tools[0].type, "web_search");
  assert.equal(request.data.tools[0].external_web_access, true);
  assert.equal(request.data.tool_choice, "required");
  assert.equal(request.data.max_tool_calls, 5);
  assert.equal(request.data.store, false);
  assert.deepEqual(request.data.include, ["web_search_call.action.sources"]);
  assert.match(request.data.instructions, /datos, no instrucciones/);
  assert.match(request.data.instructions, /al menos tres portales/);
  assert.equal(request.data.text.format.type, "json_schema");
  assert.match(request.data.input[0].content, /Puerto Cancún/);
  assert.equal(result.listings[0].url, found.url);
  assert.equal(JSON.stringify(result).includes("fake-key"), false);
});

test("provider setup, timeouts and upstream errors surface actionable errors without response bodies or credentials", async () => {
  await assert.rejects(searchProperties(criteria), failure => failure.code === "SEARCH_NOT_CONFIGURED" && failure.status === 503);
  await assert.rejects(searchProperties(criteria, { apiKey: "key", fetchImpl: async () => { throw Object.assign(Error("private upstream details"), { name: "TimeoutError" }); } }), failure => failure.code === "SEARCH_TIMEOUT" && !failure.message.includes("private"));
  for (const [status, code] of [[401, "SEARCH_PROVIDER_AUTH"], [403, "SEARCH_PROVIDER_AUTH"], [429, "SEARCH_PROVIDER_LIMIT"], [500, "SEARCH_PROVIDER_ERROR"]]) {
    await assert.rejects(searchProperties(criteria, { apiKey: "key", fetchImpl: async () => ({ ok: false, status }) }), failure => failure.code === code);
  }
});

test("quota exhaustion is distinguished from transient rate limits without leaking provider details", async () => {
  for (const providerCode of ["insufficient_quota", "credit_balance_exhausted", "project_spend_limit_exceeded", "organization_spend_limit_exceeded", "organization_usage_limit_exceeded"]) {
    await assert.rejects(searchProperties(criteria, { apiKey: "private-key", fetchImpl: async () => ({
      ok: false, status: 429, json: async () => ({ error: { code: providerCode, message: "private account data" } }),
    }) }), failure => failure.code === "SEARCH_PROVIDER_QUOTA" && /OpenAI/.test(failure.message) && !failure.message.includes("private"));
  }
  for (const json of [async () => ({ error: { code: "rate_limit_exceeded" } }), async () => { throw Error("proxy HTML"); }]) {
    await assert.rejects(searchProperties(criteria, { apiKey: "key", fetchImpl: async () => ({ ok: false, status: 429, json }) }), failure => failure.code === "SEARCH_PROVIDER_LIMIT");
  }
});

async function harness(t, options = {}) {
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { const role = req.get("X-Test-Role"); req.session = { user: role ? { id: req.get("X-Test-User") || "user-" + role, role: role === "seller" ? "seller" : "admin", internalRole: role, permissions: [] } : null }; next(); });
  app.use(sameOriginMutationGuard());
  app.use((req, res, next) => req.method === "POST" && req.get("X-CSRF-Token") !== "test-csrf" ? res.status(403).json({ error: "CSRF_INVALID" }) : next());
  const requireRole = role => (req, res, next) => {
    if (req.session.user?.role !== role) return res.status(401).json({ error: "Unauthorized" });
    if (!internalRoleAllows(req, req.session.user)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
  registerPropertySearchRoutes(app, { requireRole, apiKey: "test-key", fetchImpl: async () => ({ ok: true, json: async () => output([]) }), ...options });
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (role, body, extra = {}, suffix = "") => fetch(base + "/api/admin/property-search" + suffix, { method: body === undefined ? "GET" : "POST", headers: { Origin: base, "Content-Type": "application/json", "X-CSRF-Token": "test-csrf", ...(role ? { "X-Test-Role": role } : {}), ...extra }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  call.job = (role, id, headers) => call(role,undefined,headers,"/jobs/" + id);
  call.finished = async (role,id,headers) => {
    for (let attempt=0;attempt<100;attempt++) {
      const response = await call.job(role,id,headers);
      assert.equal(response.status,200);
      const job = await response.json();
      if (job.status !== "pending") return job;
      await new Promise(resolve=>setTimeout(resolve,5));
    }
    assert.fail("job did not finish");
  };
  return call;
}

test("HTTP route preserves administrator/advisor authorization, read-only viewer and CSRF protections", async t => {
  const call = await harness(t);
  assert.equal((await call(null)).status, 401);
  assert.equal((await call("seller", { criteria })).status, 401);
  assert.equal((await call("viewer", { criteria })).status, 403);
  assert.equal((await call("editor", { criteria })).status, 403);
  assert.equal((await call("admin", { criteria }, { "X-CSRF-Token": "wrong" })).status, 403);
  assert.equal((await call("admin", { criteria }, { Origin: "https://attacker.example" })).status, 403);
  assert.equal((await call("advisor", { criteria })).status, 202);
  assert.equal((await call("admin", { criteria: "" })).status, 400);
  assert.deepEqual(await (await call("viewer")).json(), { configured: true, maxLength: 2500, canSearch: false });
});

test("HTTP job starts immediately, isolates results by owner and keeps protected roles", async t => {
  let release;
  const found = listing("https://www.propiedades.com/inmuebles/test-123");
  const call = await harness(t,{fetchImpl:async()=>{
    await new Promise(resolve=>{release=resolve;});
    return {ok:true,json:async()=>output([found])};
  }});
  const response = await call("admin",{criteria});
  assert.equal(response.status,202,"HTTP response must not await provider completion");
  assert.match(response.headers.get("cache-control"),/no-store/);
  const started = await response.json();
  assert.equal(started.status,"pending");
  assert.ok(release);
  assert.equal((await (await call.job("admin",started.jobId)).json()).status,"pending");
  for (const [role,status,headers] of [[null,401,{}],["seller",401,{}],["editor",403,{}],["viewer",404,{}],["advisor",404,{}],["admin",404,{"X-Test-User":"other-admin"}]]) {
    const hidden = await call.job(role,started.jobId,headers);
    assert.equal(hidden.status,status);
    assert.equal(JSON.stringify(await hidden.json()).includes("propiedades.com"),false);
  }
  release();
  const completed = await call.finished("admin",started.jobId);
  assert.equal(completed.status,"complete");
  assert.equal(completed.result.listings[0].url,found.url);
  assert.equal(completed.owner,undefined);
  assert.equal(completed.criteria,undefined);
  assert.equal((await call.job("admin","not-a-job")).status,404);
});

test("HTTP route limits repeated paid searches and concurrent requests", async t => {
  let release, calls = 0;
  const call = await harness(t, { fetchImpl: async () => {
    calls++;
    if (calls === 1) await new Promise(resolve => { release = resolve; });
    return { ok: true, json: async () => output([]) };
  } });
  const pending = await call("admin", { criteria });
  assert.equal(pending.status,202);
  const started = await pending.json();
  const busy = await call("admin", { criteria });
  assert.equal(busy.status, 429);
  assert.equal((await busy.json()).code, "SEARCH_BUSY");
  release(); assert.equal((await call.finished("admin",started.jobId)).status,"complete");
  for (let i = 0; i < 6; i++) {
    const response = await call("admin", { criteria });
    assert.equal(response.status,202);
    await call.finished("admin",(await response.json()).jobId);
  }
  const limited = await call("admin", { criteria });
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get("retry-after"));
  assert.equal(calls, 7);
});

test("HTTP jobs cap concurrent users, expire after five minutes and retain at most fifty results", async t => {
  const releases = [];
  const call = await harness(t,{fetchImpl:async()=>{
    await new Promise(resolve=>releases.push(resolve));
    return {ok:true,json:async()=>output([])};
  }});
  const a = await call("admin",{criteria},{"X-Test-User":"a"});
  const b = await call("admin",{criteria},{"X-Test-User":"b"});
  assert.equal(a.status,202); assert.equal(b.status,202);
  assert.equal((await call("admin",{criteria},{"X-Test-User":"c"})).status,429);
  releases.forEach(release=>release());
  await call.finished("admin",(await a.json()).jobId,{"X-Test-User":"a"});
  await call.finished("admin",(await b.json()).jobId,{"X-Test-User":"b"});
  let clock = Date.now();
  const bounded = await harness(t,{now:()=>clock});
  let first;
  for (let index=0;index<50;index++) {
    const response = await bounded("admin",{criteria},{"X-Test-User":"bounded-"+index});
    assert.equal(response.status,202);
    const job = await response.json();
    if (!index) first = job.jobId;
    await bounded.finished("admin",job.jobId,{"X-Test-User":"bounded-"+index});
  }
  assert.equal((await bounded("admin",{criteria},{"X-Test-User":"overflow"})).status,429);
  clock += 300001;
  assert.equal((await bounded.job("admin",first,{"X-Test-User":"bounded-0"})).status,404);
  assert.equal((await bounded("admin",{criteria},{"X-Test-User":"after-expiry"})).status,202);
});

test("HTTP jobs safely expose timeout, malformed provider data and unavailable configuration", async t => {
  for (const [options,code] of [
    [{timeoutMs:15,fetchImpl:async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener("abort",()=>reject(signal.reason),{once:true}))},"SEARCH_TIMEOUT"],
    [{fetchImpl:async()=>({ok:true,json:async()=>{throw SyntaxError("Unexpected token <: private provider HTML");}})},"SEARCH_CONNECTION_ERROR"],
    [{fetchImpl:async()=>({ok:true,json:async()=>({status:"failed"})})},"SEARCH_INCOMPLETE"],
  ]) {
    const call = await harness(t,options);
    const response = await call("admin",{criteria});
    assert.equal(response.status,202);
    const job = await call.finished("admin",(await response.json()).jobId);
    assert.equal(job.status,"failed"); assert.equal(job.code,code);
    assert.doesNotMatch(job.error,/Unexpected token|private|HTML|test-key/);
    assert.equal((await call("admin",{criteria})).status,202,"a failed job releases its concurrency slot");
  }
  const missing = await harness(t,{apiKey:""});
  const response = await missing("admin",{criteria});
  assert.equal(response.status,503);
  assert.equal((await response.json()).code,"SEARCH_NOT_CONFIGURED");
});

test("browser polling handles proxy HTML without displaying it and completes or stops within its deadline", async () => {
  const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
  const source = fs.readFileSync(path.join(__dirname,"../admin-property-search.js"),"utf8");
  const functions = source.slice(source.indexOf("  async function readResponse"),source.indexOf("  function show"));
  let clock=0,calls=0;
  const id = "01234567-89ab-cdef-0123-456789abcdef";
  const runtime = {Date:{now:()=>clock},AbortSignal,encodeURIComponent,Error,setTimeout:(resolve,delay)=>{clock+=delay;resolve();},
    fetch:async()=>{
      calls++;
      if(calls===1)return new Response("<!DOCTYPE html><h1>private gateway response</h1>",{status:504});
      return Response.json(calls===2 ? {status:"pending"} : {status:"complete",result:{listings:[]}});
    }};
  vm.createContext(runtime); vm.runInContext(functions,runtime);
  assert.equal((await runtime.waitForJob(id)).listings.length,0);
  assert.equal(calls,3);
  await assert.rejects(runtime.readResponse(new Response("<!DOCTYPE html><b>private data</b>",{status:502})),failure=>failure.code === "SEARCH_INVALID_JSON" && failure.httpStatus === 502 && !failure.message.includes("<") && !failure.message.includes("private"));
  for (const body of [null,[],"unexpected"]) await assert.rejects(runtime.readResponse(Response.json(body)),failure=>failure.code === "SEARCH_INVALID_RESPONSE");
  runtime.fetch=async()=>Response.json({status:"failed",error:"No se pudo consultar el portal."});
  await assert.rejects(runtime.waitForJob(id),/No se pudo consultar/);
  clock=0;
  runtime.fetch=async()=>Response.json({status:"pending"});
  await assert.rejects(runtime.waitForJob(id),/tardó demasiado/);
  assert.equal(clock,150000);
});
