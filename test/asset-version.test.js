const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const { RUNTIME_FILES, computeAssetVersion } = require("../asset-version");

function fingerprint({ root = path.resolve("fixture"), eol = "\n", changes = {}, reads = [] } = {}) {
  return computeAssetVersion(root, (file, encoding) => {
    assert.equal(encoding, "utf8");
    const relative = path.relative(root, file).split(path.sep).join("/");
    assert.ok(RUNTIME_FILES.includes(relative), `Unexpected read: ${relative}`);
    reads.push(relative);
    return Object.hasOwn(changes, relative) ? changes[relative] : `${relative}${eol}runtime text${eol}`;
  });
}

test("assetVersion is deterministic across roots and CRLF/LF/CR checkouts", () => {
  const expected = fingerprint();
  assert.match(expected, /^[a-f0-9]{12}$/);
  assert.equal(fingerprint(), expected);
  assert.equal(fingerprint({ root: path.resolve("other-checkout"), eol: "\r\n" }), expected);
  assert.equal(fingerprint({ eol: "\r" }), expected);
});

test("every explicitly listed runtime source influences the fingerprint, without boundary collisions", () => {
  const original = fingerprint();
  for (const file of RUNTIME_FILES) assert.notEqual(fingerprint({ changes: { [file]: "changed runtime\n" } }), original, file);
  const [one, two] = RUNTIME_FILES;
  assert.notEqual(fingerprint({ changes: { [one]: "ab", [two]: "c" } }), fingerprint({ changes: { [one]: "a", [two]: "bc" } }));
  assert.notEqual(fingerprint({ changes: { [one]: `${one}\nruntime text` } }), original, "Trailing newline remains significant");
});

test("manifest preserves previous assets, covers runtime entrypoints, and never enumerates secrets", () => {
  const previous = ["app.js", "styles.css", "inventory-contract.js", "catalog-ui.js", "catalog.css", "catalog-map.js", "catalog-assistant.js", "admin-inventory-ui.js", "admin-inventory.css", "comparison-ui.js", "comparison.css", "contact-config.js", "csv-utils.js"];
  for (const file of [...previous, "index.html", "seo-pages.js", "catalog-view.js", "server.js", "asset-version.js", "package-lock.json"]) assert.ok(RUNTIME_FILES.includes(file));
  assert.equal(new Set(RUNTIME_FILES).size, RUNTIME_FILES.length);
  assert.ok(RUNTIME_FILES.every((file) => !file.startsWith(".") && !file.includes("..") && !path.isAbsolute(file)));
  const reads = [];
  fingerprint({ reads });
  assert.deepEqual(reads, [...RUNTIME_FILES]);
  assert.ok(Object.isFrozen(RUNTIME_FILES));
  assert.throws(() => computeAssetVersion("fixture", () => { throw new Error("missing runtime file"); }), /missing runtime file/);
  const source = fs.readFileSync(require.resolve("../asset-version"), "utf8");
  assert.doesNotMatch(source, /process\.env|readdir|dotenv|glob\(/);
});

test("server definition delegates to the same helper without importing the server or DB", () => {
  const source = fs.readFileSync(require.resolve("../server"), "utf8");
  const definition = source.match(/^const staticAssetVersion = .*;$/m)[0];
  let calls = 0;
  const result = vm.runInNewContext(`${definition}\nstaticAssetVersion`, {
    __dirname: "runtime-root",
    require: (name) => { assert.equal(name, "./asset-version"); return { computeAssetVersion(root) { assert.equal(root, "runtime-root"); calls++; return "abcdef123456"; } }; },
  });
  assert.equal(result, "abcdef123456");
  assert.equal(calls, 1);
  assert.match(computeAssetVersion(), /^[a-f0-9]{12}$/, "The real checkout contains all runtime sources");
});
