const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const html = fs.readFileSync(require.resolve("../index.html"), "utf8");
const contract = require("../inventory-contract");

function runtime(names, bindings = {}) {
  const source = names.map((name) => {
    const match = app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, `Missing function ${name}`);
    return match[0];
  }).join("\n");
  return vm.runInNewContext(`${source}\n({ ${names.join(",")} })`, { URLSearchParams, URL, structuredClone, ...bindings });
}
const plain = (value) => JSON.parse(JSON.stringify(value));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function sellerRuntime(search = "?intent=sell&location=puerto-cancun&type=Departamento", options = {}) {
  const storage = new Map();
  const state = { session: options.user || null, lang: "es" };
  const fields = Object.fromEntries(["contextLocations", "contextType", "contextZone", "type", "state", "city", "zone", "address", "latitude", "longitude"].map((name) => [name, { value: "" }]));
  const form = { dataset: {}, fields };
  const summary = {};
  let saved = 0;
  const window = { PccInventory: contract, location: { search, pathname: "/vender-casa-cancun" } };
  const api = runtime(["parseSellerContext", "rememberSellerContext", "sellerPanelUrl", "applySellerContext"], {
    window, state,
    sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => { if (options.blockStorage) throw new Error("blocked"); storage.set(key, value); } },
    $: () => summary, formField: (_, name) => fields[name], saveSellerDraft() { saved++; form.dataset.dirty = "true"; },
  });
  return { ...api, state, fields, form, summary, storage, window, saved: () => saved };
}

test("T30: seller CTA parses only recognized commercial Locations and the four property types", () => {
  const api = sellerRuntime();
  const result = api.parseSellerContext("?intent=sell&location=Puerto%20Cancun,costa%20mujeres,unknown&location=puerto-cancun&type=Departamento&zone=Referencia", "/panel");
  assert.deepEqual(plain(result), { locations: ["puerto-cancun", "zona-hotelera"], type: "Departamento", zone: "Referencia" });
  assert.equal(api.parseSellerContext("?type=Casa&location=puerto-cancun", "/propiedades"), null);
  assert.equal(api.parseSellerContext("?intent=sell&type=Preventa", "/").type, "");
  assert.equal(api.parseSellerContext("?intent=sell&type=Casa&latitude=20&city=Invented", "/").city, undefined);
});

test("T30: login destination preserves criteria and cannot become an open redirect", () => {
  const api = sellerRuntime("?intent=sell&location=puerto-cancun&type=Comercial&zone=Punta%20Sam&returnTo=https://evil.example", { user: { id: "seller", role: "seller" } });
  const url = new URL(api.sellerPanelUrl(), "https://test.invalid");
  assert.equal(url.pathname, "/panel");
  assert.equal(url.origin, "https://test.invalid");
  assert.equal(url.searchParams.get("location"), "puerto-cancun");
  assert.equal(url.searchParams.get("type"), "Comercial");
  assert.equal(url.searchParams.has("returnTo"), false);
  assert.equal(api.sellerPanelUrl({ role: "admin" }), "/panel");
});

test("T30: public context survives URL cleanup, reload and unavailable sessionStorage", () => {
  for (const blockStorage of [false, true]) {
    const api = sellerRuntime(undefined, { blockStorage });
    api.rememberSellerContext();
    api.window.location = { search: "?auth=login", pathname: "/" };
    api.state.session = { id: "seller", role: "seller" };
    assert.match(api.sellerPanelUrl(), /location=puerto-cancun/);
    if (!blockStorage) { delete api.state.sellerIntentContext; assert.match(api.sellerPanelUrl(), /type=Departamento/); }
  }
});

test("seller context expires and a context bound to another user is not applied", () => {
  for (const saved of [{ savedAt: Date.now() - 86400001 }, { savedAt: Date.now() + 60000 }, { savedAt: Date.now(), userId: "other" }]) {
    const api = sellerRuntime("", { user: { id: "seller", role: "seller" } });
    api.window.location.pathname = "/panel";
    api.storage.set("pcc.seller-context.v1", JSON.stringify({ locations: ["puerto-cancun"], type: "Casa", ...saved }));
    assert.equal(api.rememberSellerContext(), null);
  }
});

test("T30: commercial context sets a pristine type but never fabricates physical geography", () => {
  const api = sellerRuntime(undefined, { user: { id: "seller", role: "seller" } });
  api.applySellerContext(api.form);
  assert.equal(api.fields.type.value, "Departamento");
  assert.equal(api.fields.contextLocations.value, "puerto-cancun");
  assert.match(api.summary.textContent, /Referencia comercial/);
  for (const name of ["state", "city", "zone", "address", "latitude", "longitude"]) assert.equal(api.fields[name].value, "");
  api.applySellerContext(api.form);
  assert.equal(api.saved(), 1);
});

test("T30: restored drafts and typing retain their type and their earlier context", () => {
  const api = sellerRuntime(undefined, { user: { id: "seller", role: "seller" } });
  api.form.dataset.dirty = "true";
  api.fields.type.value = "Terreno";
  api.fields.zone.value = "Zona original";
  api.fields.contextLocations.value = "fuera-de-cancun";
  api.fields.contextType.value = "Terreno";
  api.applySellerContext(api.form);
  assert.equal(api.fields.type.value, "Terreno");
  assert.equal(api.fields.zone.value, "Zona original");
  assert.equal(api.fields.contextLocations.value, "fuera-de-cancun");
  assert.equal(api.saved(), 0);
});

test("prepareSellerForm awaits restoration and ignores a late response after account change", async () => {
  const pending = deferred();
  const state = { session: { id: "one", role: "seller", email: "one@example.invalid" } };
  const form = { email: { value: "" }, phone: { value: "" }, preferredContact: { value: "" } };
  let applied = 0;
  const api = runtime(["prepareSellerForm"], { state, $: () => form, restoreSellerDraft: () => pending.promise, applySellerContext: () => { applied++; } });
  const work = api.prepareSellerForm();
  assert.equal(applied, 0);
  state.session = { id: "two", role: "seller" };
  pending.resolve(); await work;
  assert.equal(applied, 0);
});

test("T20: Enter in ordinary fields is blocked; multiline, IME and explicit buttons retain behavior", () => {
  const api = runtime(["preventImplicitListingSubmit"]);
  const cases = [[{ tagName: "INPUT", type: "text" }, false, true], [{ tagName: "SELECT" }, false, true], [{ tagName: "INPUT", type: "checkbox" }, false, true], [{ tagName: "TEXTAREA" }, false, false], [{ tagName: "INPUT", type: "text" }, true, false], [{ tagName: "BUTTON", closest: () => ({}) }, false, false], [{ type: "file" }, false, false], [{ isContentEditable: true }, false, false]];
  for (const [target, isComposing, blocked] of cases) {
    let prevented = false;
    api.preventImplicitListingSubmit({ key: "Enter", target, isComposing, preventDefault() { prevented = true; } });
    assert.equal(prevented, blocked);
  }
});

test("T20: submit without the explicit save/request button never writes or opens confirmation", async () => {
  const api = runtime(["listingSubmit", "sellerRequestSubmit"], { $: () => ({ id: "explicit" }), formImagesReady: () => assert.fail("implicit submit reached validation") });
  for (const fn of [api.listingSubmit, api.sellerRequestSubmit]) await fn({ preventDefault() {}, currentTarget: {}, submitter: null });
});

test("T20: editor and confirmation use explicit secondary-button types", () => {
  assert.match(html, /type="button" id="listingReturnButton"/);
  assert.match(html, /type="submit" value="cancel" autofocus/);
  assert.match(app, /#listingPublishDialog"\)\?\.addEventListener\("keydown", preventImplicitListingSubmit\)/);
});

test("T20: return context deep-clones filters/pagination and restores focus and both scroll positions", () => {
  const filters = { location: "puerto-cancun", quality: "incomplete", featured: true, page: 3, nested: { ids: ["a"] } };
  const state = { session: { id: "admin" }, adminSection: "developments", adminListingFilters: filters, adminListingSort: "title_asc", adminListingPage: 3, adminListingPagination: { offset: 40 } };
  let focused = 0, scrolled, renders = 0;
  const list = { scrollTop: 260, scrollLeft: 5, querySelectorAll: () => [{ dataset: { editListing: "a" }, focus: () => { focused++; } }] };
  const history = { state: { unrelated: "keep" }, pushState(value) { this.state = value; }, replaceState(value) { this.state = value; } };
  const api = runtime(["captureListingReturnContext", "restoreListingReturnContext"], {
    state, $: () => list, document: { activeElement: { dataset: { editListing: "a" } } },
    window: { scrollX: 2, scrollY: 720, history, requestAnimationFrame: (fn) => fn(), scrollTo: (value) => { scrolled = value; } },
    setAdminSection(section) { state.adminSection = section; state.adminListingFilters = {}; },
    renderAdminListingFilters() {}, renderAdminListings() { renders++; },
  });
  api.captureListingReturnContext("new-development");
  filters.nested.ids.push("changed");
  state.adminSection = "new-development"; state.adminListingPage = 1;
  list.scrollTop = 0;
  assert.equal(api.restoreListingReturnContext(), true);
  assert.equal(state.adminSection, "developments");
  assert.deepEqual(plain(state.adminListingFilters.nested.ids), ["a"]);
  assert.equal(state.adminListingPage, 3);
  assert.equal(state.adminListingPagination.offset, 40);
  assert.equal(state.adminListingSort, "title_asc");
  assert.equal(list.scrollTop, 260);
  assert.equal(scrolled.top, 720);
  assert.equal(focused, 1);
  assert.equal(renders, 1);
  assert.equal(history.state.unrelated, "keep");
});

function returnRuntime({ dirty = true, confirmed = true, saved = true, saving = false, video = false } = {}) {
  const state = { session: { id: "admin" } };
  const form = { dataset: { dirty: String(dirty), saving: String(saving), draftGeneration: "one" } };
  let saves = 0, returns = 0, confirmations = 0;
  const api = runtime(["returnToAdminListings"], {
    state, $: (selector) => selector === "#listingForm" ? form : {},
    confirmAction: async () => { confirmations++; return confirmed; }, formField: () => ({ files: video ? [{}] : [] }),
    saveListingProgress: async () => { saves++; return saved; }, showToast() {}, listingFormIsDevelopment: () => true,
    restoreListingReturnContext: (section) => { assert.equal(section, "developments"); returns++; return true; },
  });
  return { ...api, form, stats: () => ({ saves, returns, confirmations }) };
}

test("T20/T21: back confirms unpublished changes, waits for draft success and stays on failure", async () => {
  for (const [options, expected, stats] of [[{ confirmed: false }, false, { saves: 0, returns: 0, confirmations: 1 }], [{ saved: false }, false, { saves: 1, returns: 0, confirmations: 1 }], [{}, true, { saves: 1, returns: 1, confirmations: 1 }], [{ dirty: false }, true, { saves: 0, returns: 1, confirmations: 0 }], [{ saving: true }, false, { saves: 0, returns: 0, confirmations: 0 }], [{ video: true }, false, { saves: 0, returns: 0, confirmations: 1 }]]) {
    const api = returnRuntime(options);
    assert.equal(await api.returnToAdminListings(), expected);
    assert.deepEqual(api.stats(), stats);
    if (!expected && options.dirty !== false) assert.equal(api.form.dataset.dirty, "true");
  }
});

function progressRuntime({ images = [], mediaSaved = true, fails = false, lateEdit = false, accountChanges = false } = {}) {
  const form = { dataset: { draftGeneration: "generation", expectedUpdatedAt: "original-version" } };
  const fields = { title: "Draft title" };
  const state = { session: { id: "admin" } };
  const statuses = [], calls = [], storageKeys = [];
  const api = runtime(["listingDraftContentKey", "saveListingProgress"], {
    state, $: (selector) => selector === "#listingForm" ? form : {}, formField: () => ({ value: "Draft title" }),
    formImagesReady: () => true, listingDraftSlot: () => "edit-a", listingDraftStorageKey: () => `draft.${state.session.id}.edit-a`,
    listingDraftSnapshot: () => ({ fields: { ...fields }, images, savedAt: String(Date.now()) }),
    setButtonLoading() {}, beginOperation: () => ({ remove() {} }), saveListingDraft() {},
    window: { clearTimeout() {} }, listingCloudTimers: new Map(), listingCloudQueue: Promise.resolve(),
    queueDraftOperation: (fn) => Promise.resolve().then(fn), writePersistentDraft: async (key) => { storageKeys.push(key); return mediaSaved; },
    api: async (route, options) => { calls.push({ route, options }); if (lateEdit) fields.title = "New edit"; if (accountChanges) state.session = { id: "other" }; if (fails) throw new Error("offline"); },
    listingDraftStatus: (text) => statuses.push(text), showToast() {},
  });
  return { ...api, statuses, calls, form, storageKeys };
}

test("T21: progress success requires server confirmation and recoverable new media", async () => {
  for (const [options, success] of [[{}, true], [{ fails: true }, false], [{ images: ["new.jpg"], mediaSaved: false }, false], [{ mediaSaved: false }, true], [{ lateEdit: true }, false], [{ accountChanges: true }, false]]) {
    const api = progressRuntime(options);
    assert.equal(await api.saveListingProgress(), success);
    assert.equal(api.form.dataset.savingDraft, "false");
    assert.equal(api.form.dataset.expectedUpdatedAt, "original-version");
    assert.equal(api.calls[0].options.body.fields._expectedUpdatedAt, "original-version");
    assert.deepEqual(api.storageKeys, ["draft.admin.edit-a"]);
    if (options.fails) assert.ok(api.statuses.every((value) => !value.startsWith("Borrador sincronizado")));
  }
});

test("T22: conflict comparison is read-only and does not advance the editor version", async () => {
  const form = { dataset: { draftGeneration: "same", expectedUpdatedAt: "old" } };
  const output = {};
  const calls = [];
  const api = runtime(["compareListingConflict"], {
    state: { session: { id: "admin" } }, $: (selector) => selector === "#listingForm" ? form : selector === "#listingConflictContent" ? output : {},
    listingFormRecordId: () => "id", formField: () => ({ value: "local draft" }), setButtonLoading() {},
    api: async (route, options) => { calls.push({ route, options }); return { properties: [{ id: "id", titleEs: "new server text", updatedAt: "new" }] }; },
    escapeHtml: (value) => String(value).replace(/</g, "&lt;"),
  });
  await api.compareListingConflict();
  assert.match(output.innerHTML, /local draft/);
  assert.match(output.innerHTML, /new server text/);
  assert.equal(form.dataset.expectedUpdatedAt, "old");
  assert.equal(calls[0].options.method, undefined);
  assert.equal(calls[0].route, "/api/admin/properties");
});

test("price-on-request remains optional after configure, restore and development mode changes", () => {
  for (const [mode, onRequest, required] of [["new-property", true, false], ["new-property", false, true], ["new-development", false, false]]) {
    const fields = new Map([["priceOnRequest", { checked: onRequest }], ["price", { value: "" }]]);
    const form = { dataset: {}, querySelector: () => null, querySelectorAll: () => [] };
    const api = runtime(["configureListingFormMode", "listingEditorTitle"], {
      state: { adminSection: mode, properties: [], lang: "es" }, $: (selector) => selector === "#listingForm" ? form : null,
      listingFormRecordId: () => "id", formField: (_, name) => { if (!fields.has(name)) fields.set(name, { value: "", closest: () => null }); return fields.get(name); },
      renderDevelopmentPropertyLinker() {}, t: (key) => key,
    });
    api.configureListingFormMode(mode);
    assert.equal(fields.get("price").required, required);
    assert.equal(fields.get("price").value, "");
  }
});

test("T21: authenticated same-user session renewal retains the open editor", async () => {
  const user = { id: "admin", role: "admin", internalRole: "admin" };
  const state = { session: user };
  let redirected = false;
  const api = runtime(["loginSubmit", "handleGoogleCredential"], {
    state, $: () => ({ hidden: false }), api: async () => ({ user }), setButtonLoading() {}, setFormMessage() {}, closeAuth() {}, updateAuthNav() {}, showToast() {},
    window: { location: { assign() { redirected = true; } } }, sellerPanelUrl: () => assert.fail("renewal lost context"),
  });
  await api.loginSubmit({ preventDefault() {}, currentTarget: { username: { value: "admin" }, password: { value: "test-only" }, querySelector: () => ({}) } });
  await api.handleGoogleCredential({ credential: "test-only" });
  assert.equal(redirected, false);
});

test("confirmed seller submission cancels pending autosave before clearing the draft", () => {
  const events = [];
  const form = { dataset: { dirty: "true" } };
  const api = runtime(["clearSellerDraft"], {
    window: { clearTimeout: (id) => events.push(["cancel", id]) }, sellerDraftTimer: 42,
    currentSellerDraftKey: () => "seller.draft", localStorage: { removeItem: (key) => events.push(["remove", key]) },
    queueDraftOperation: (fn) => fn(), deletePersistentDraft: (key) => events.push(["delete", key]),
    $: () => form, cancelFormImageProcessing() {},
  });
  api.clearSellerDraft();
  assert.deepEqual(events, [["cancel", 42], ["remove", "seller.draft"], ["delete", "seller.draft"]]);
  assert.equal(form.dataset.dirty, "false");
});

test("savedSearchForm explicitly offers operation and rent period with no inferred selection", () => {
  const form = html.match(/<form id="savedSearchForm"[\s\S]*?<\/form>/)[0];
  for (const [name, expected] of [["operation", ["", "sale", "rent"]], ["rentPeriod", ["", "month", "day", "year"]]]) {
    const select = form.match(new RegExp(`<select name="${name}"[^>]*>[\\s\\S]*?<\\/select>`))[0];
    assert.deepEqual([...select.matchAll(/<option value="([^"]*)"/g)].map((match) => match[1]), expected);
    assert.doesNotMatch(select, /\bselected\b/);
  }
});

test("isolated browser: explicit submission, dialog focus and blank saved-search criteria", { skip: !process.env.PCC_EDITOR_BROWSER_QA, timeout: 60000 }, async () => {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const context = await browser.newContext();
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const forms = ["listingForm", "sellerRequestForm", "savedSearchForm"].map((id) => html.match(new RegExp(`<form id="${id}"[\\s\\S]*?<\\/form>`))[0]).join("\n");
    const dialog = html.match(/<dialog id="listingPublishDialog"[\s\S]*?<\/dialog>/)[0];
    const functions = ["preventImplicitListingSubmit", "listingSubmit", "sellerRequestSubmit", "confirmListingPublication"].map((name) => app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0]).join("\n");
    await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><style>${fs.readFileSync(require.resolve("../styles.css"), "utf8")}</style><main>${forms}${dialog}</main>`);
    await page.addScriptTag({ content: `
      const $ = (selector) => document.querySelector(selector);
      const formField = (form, name) => form.elements.namedItem(name);
      const listingFormIsDevelopment = () => false;
      window.validationCalls = 0;
      const formImagesReady = () => { window.validationCalls++; return false; };
      ${functions}
      [[$("#listingForm"), listingSubmit], [$("#sellerRequestForm"), sellerRequestSubmit]].forEach(([form, submit]) => {
        form.noValidate = true;
        form.addEventListener("submit", submit);
        form.addEventListener("keydown", preventImplicitListingSubmit);
      });
      $("#listingPublishDialog").addEventListener("keydown", preventImplicitListingSubmit);
    ` });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => { window.validationCalls = 0; });
      for (const [id, button] of [["listingForm", "listingSubmitButton"], ["sellerRequestForm", "sellerRequestSubmitButton"]]) {
        const field = page.locator(`#${id} input:not([type=hidden]):not([type=file])`).first();
        await field.fill("QA");
        await field.press("Enter");
        assert.equal(await page.evaluate(() => window.validationCalls), 0);
        await page.locator(`#${button}`).click();
        assert.equal(await page.evaluate(() => window.validationCalls), 1);
        await page.evaluate(() => { window.validationCalls = 0; });
      }
      await page.locator("#listingSubmitButton").focus();
      await page.evaluate(() => { window.publishResult = null; confirmListingPublication(document.querySelector("#listingForm")).then((value) => { window.publishResult = value; }); });
      assert.equal(await page.locator("#listingPublishDialog [value=cancel]").evaluate((button) => button === document.activeElement), true);
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.publishResult === false);
      assert.equal(await page.locator("#listingSubmitButton").evaluate((button) => button === document.activeElement), true);
      for (const name of ["operation", "rentPeriod"]) {
        const select = page.locator(`#savedSearchForm select[name=${name}]`);
        assert.equal(await select.inputValue(), "");
        const box = await select.boundingBox();
        assert.ok(box.width > 0 && box.width <= width, `${name} fits at ${width}px`);
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  } finally { await browser.close(); }
});
