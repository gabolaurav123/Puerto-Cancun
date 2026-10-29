const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { Blob } = require("node:buffer");
const csv = require("../csv-utils");
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const server = fs.readFileSync(require.resolve("../server.js"), "utf8");
const html = fs.readFileSync(require.resolve("../index.html"), "utf8");
const fn = (name) => app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0];
const unquoteCell = (encoded) => encoded.slice(1, -1).replace(/""/g, '"');

test("formula prefixes after whitespace, Unicode format and control characters become literal text", () => {
  const prefixes = ["", " ", "\t", "\r", "\n", "\r\n\t ", "\0", "\x01\x1f", "\x7f\x85", "\u00a0", "\u2003", "\u200b", "\u202e", "\ufeff"];
  for (const prefix of prefixes) for (const operator of ["=", "+", "-", "@"]) {
    const value = `${prefix}${operator}SUM(1,2)\n"quoted"\r\nnext`;
    const result = csv.cell(value);
    assert.ok(result.startsWith('"\''));
    assert.equal(unquoteCell(result), "'" + value, "No trimming or replacement of original content");
  }
});

test("safe text, quotes, commas and line breaks round-trip unchanged; null cells stay empty", () => {
  for (const value of ["", "Ana", 'Text "quoted", comma\r\nsecond\nthird', "mail@example.invalid", "a+b", "a-b", "a=1", "'=SUM(1,2)", "  ordinary text", "\tplain", "東京", 0, false]) {
    assert.equal(unquoteCell(csv.cell(value)), String(value));
  }
  assert.equal(csv.cell(null), '""');
  assert.equal(csv.cell(undefined), '""');
  assert.equal(csv.cell(-12), '"\'-12"');
  assert.equal(csv.cell('"=1"'), '"""=1"""');
});

test("serializer preserves row separators, embedded line breaks and input arrays", () => {
  const rows = [["Name", "Value"], ['A,"B"\nC', "\t=1"]];
  const before = structuredClone(rows);
  assert.equal(csv.stringify(rows), '"Name","Value"\r\n"A,""B""\nC","\'\t=1"');
  assert.equal(csv.stringify(rows, "\n"), '"Name","Value"\n"A,""B""\nC","\'\t=1"');
  assert.deepEqual(rows, before);
  assert.equal(csv.stringify([]), "");
});

test("UMD exposes the same browser serializer and is loaded, allowed and hashed", () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve("../csv-utils.js"), "utf8"), context);
  assert.equal(context.PccCsv.stringify([["\t=1", 'a"b']]), csv.stringify([["\t=1", 'a"b']]));
  const helper = html.indexOf('<script src="/csv-utils.js?');
  assert.ok(helper >= 0 && helper < html.indexOf('<script src="/app.js?'));
  assert.match(server.match(/const publicStaticFiles = new Set\([\s\S]*?\]\);/)[0], /"\/csv-utils\.js"/);
  assert.match(server, /const staticAssetVersion = require\("\.\/asset-version"\)\.computeAssetVersion\(__dirname\);/);
  assert.ok(require("../asset-version").RUNTIME_FILES.includes("csv-utils.js"));
  assert.ok(server.split(/\r?\n/).some((line) => line.includes("html.replace(") && line.includes("csv-utils\\.js") && line.includes("assetVersion")));
});

function browserRuntime(names, bindings = {}) {
  const blobs = [], downloads = [], revoked = [];
  const api = vm.runInNewContext(`${names.map(fn).join("\n")}\n({ ${names.join(",")} })`, {
    window: { PccCsv: csv }, Blob, URLSearchParams,
    URL: { createObjectURL(blob) { blobs.push(blob); return "blob:isolated-export"; }, revokeObjectURL(url) { revoked.push(url); } },
    document: { createElement(tag) { assert.equal(tag, "a"); const link = { click() { downloads.push(link.download); } }; return link; } },
    ...bindings,
  });
  return { ...api, blobs, downloads, revoked };
}

test("contacts export uses shared protection for every field without altering contacts", async () => {
  const state = { contacts: [{ name: ' \t=SUM(1,2)\r\n"Name"', email: "@email", phone: "+525512345678", contactType: "-type", leadScore: "=score", preferredZones: ["\u200b+zone", 'A,"B"'] }] };
  const before = structuredClone(state);
  const api = browserRuntime(["exportContactsCsv"], { state });
  api.exportContactsCsv();
  const output = Buffer.from(await api.blobs[0].arrayBuffer()).toString("utf8");
  assert.ok(output.includes('"\' \t=SUM(1,2)\r\n""Name"""'));
  for (const value of ["@email", "+525512345678", "-type", "=score", '\u200b+zone | A,"B"']) assert.ok(output.includes(csv.cell(value)));
  assert.equal(api.downloads[0], "puerto-cancun-contactos.csv");
  assert.deepEqual(api.revoked, ["blob:isolated-export"]);
  assert.deepEqual(state, before);
});

test("visitor lead export protects dynamic values and preserves BOM, pagination and multiline text", async () => {
  const visitor = { userName: ' \n=Name("A")', userEmail: "+mail", city: 'Safe,"City"\r\nNext', utmMedium: "\t@medium", utmCampaign: "\0-campaign", visitCount: 2 };
  const before = structuredClone(visitor);
  const calls = [], loading = [];
  const api = browserRuntime(["visitorLeadCsvRows", "exportVisitorLeadsCsv"], {
    $: () => ({}), setButtonLoading: (_button, value) => loading.push(value), visitorLeadCopy: (es) => es,
    visitorLeadSourceLabel: () => "\u202e=source", visitorLeadFilterParams: (values) => new URLSearchParams(values), showToast() {},
    api: async (url) => { calls.push(url); return { visitors: [visitor], pagination: { total: 1, limit: 100 } }; },
  });
  await api.exportVisitorLeadsCsv();
  const output = Buffer.from(await api.blobs[0].arrayBuffer()).toString("utf8");
  assert.equal(output.charCodeAt(0), 0xfeff);
  assert.ok(output.includes('"\' \n=Name(""A"")"'));
  assert.ok(output.includes('"Safe,""City""\r\nNext"'));
  for (const value of ["+mail", "\t@medium", "\0-campaign", "\u202e=source"]) assert.ok(output.includes(csv.cell(value)));
  assert.equal(calls.length, 1);
  assert.match(calls[0], /offset=0&limit=100/);
  assert.deepEqual(loading, [true, false]);
  assert.equal(api.revoked.length, 1);
  assert.deepEqual(visitor, before);
});

test("campaign CSV protects contacts and campaign names in segment and selected exports without DB", async () => {
  const source = server.match(/app\.get\("\/api\/admin\/campaigns\/:id\/export"[\s\S]*?\n\}\);/)[0];
  const contact = { name: '=HYPERLINK("https://example.invalid")', email: "person@example.invalid", phone: "+123", contact_type: "\n-type", lead_score: "@score" };
  for (const mode of ["selected", "segment"]) {
    const campaign = { id: "campaign-id", name: '\t+Campaign,"Name"\r\nNext', recipient_mode: mode, recipient_emails: [contact.email] };
    let handler, body, count = 0;
    const headers = {};
    vm.runInNewContext(source, {
      csvUtils: csv, app: { get(_path, _guard, callback) { handler = callback; } }, requireRole: (role) => assert.equal(role, "admin"),
      normalizeRecipientEmails: (emails) => emails,
      query: async (sql) => { assert.match(sql, /^SELECT\b/); count++; return { rows: count === 1 ? [campaign] : [contact] }; },
    });
    const res = { type(value) { headers.type = value; return this; }, setHeader(key, value) { headers[key] = value; return this; }, send(value) { body = value; } };
    await handler({ params: { id: campaign.id } }, res, (error) => { throw error; });
    assert.equal(count, 2);
    assert.equal(headers.type, "text/csv");
    assert.equal(body.charCodeAt(0), 0xfeff);
    assert.ok(body.includes('"\'=HYPERLINK(""https://example.invalid"")"'));
    assert.ok(body.includes('"\'\t+Campaign,""Name""\r\nNext"'));
    for (const value of [contact.phone, contact.contact_type, contact.lead_score]) assert.ok(body.includes(csv.cell(value)));
  }
});
