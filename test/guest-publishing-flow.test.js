const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
function extract(name) {
  const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
  assert.ok(match, name);
  return match[0];
}

function fixture({ failOnce = false } = {}) {
  const calls = [], navigations = [], children = [];
  const button = { disabled: false, focus() {} };
  const prompt = { hidden: true, querySelector: () => button };
  const modal = { hidden: false };
  const message = { textContent: "", append(...nodes) { children.push(...nodes); } };
  const fields = { type: "Terreno", operation: "rent", location: "Puerto Cancún", preferredContact: "email", email: "owner@example.test", description: "Disponible a partir de junio", formStartedAt: "123" };
  const form = { dataset: { images: JSON.stringify([{ imageDataUrl: "data:image/jpeg;base64,test" }]) }, fields,
    reportValidity: () => true, querySelector: selector => selector.includes("preferredContact") ? { value: fields.preferredContact } : button };
  const nodes = { "#guestSaleForm": form, "#guestSaleMessage": message, "#guestSaleModal": modal, "#guestRegisterPromptModal": prompt, "#guestSaleForm [type=submit]": button };
  const context = {
    state: { lang: "es" }, URL, crypto: { randomUUID: () => "request-one" }, location: { pathname: "/vender-casa-cancun", search: "" },
    $: selector => nodes[selector], FormData: class { constructor(value) { this.value = value; } entries() { return Object.entries(this.value.fields); } },
    formImagesReady: () => true, safeParseImages: JSON.parse, refreshIcons() {},
    document: { createElement: tag => ({ tag }) },
    setButtonLoading(value, loading) { value.disabled = loading; },
    setFormMessage(value, text) { value.textContent = text; },
    openGuestWhatsApp(url) { navigations.push(url); },
    async api(url, options) { calls.push({ url, options }); if (failOnce && calls.length === 1) throw Error("Connection lost"); return { request: { id: "stored-private-id" }, action: { whatsappUrl: "https://wa.me/5219982166563?text=Quiero%20anunciar%20en%20renta" } }; },
  };
  vm.createContext(context);
  vm.runInContext(["guestSaleSubmit", "closeGuestRegistrationPrompt", "submitGuestProperty"].map(extract).join("\n"), context);
  return { ...context, form, prompt, modal, message, button, calls, navigations, children };
}

test("guest listing asks about registration before any request or WhatsApp handoff", () => {
  const f = fixture();
  f.guestSaleSubmit({ preventDefault() {}, currentTarget: f.form });
  assert.equal(f.calls.length, 0);
  assert.equal(f.navigations.length, 0);
  assert.equal(f.prompt.hidden, false);
  assert.equal(f.modal.hidden, true);
  f.closeGuestRegistrationPrompt();
  assert.equal(f.modal.hidden, false);
  assert.equal(f.form.fields.email, "owner@example.test");
});

test("skip saves optional photos once and opens WhatsApp with the selected rental request", async () => {
  const f = fixture();
  await f.submitGuestProperty();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "/api/guest-sale-requests");
  assert.equal(f.calls[0].options.body.operation, "rent");
  assert.equal(f.calls[0].options.body.email, "owner@example.test");
  assert.equal(f.calls[0].options.body.phone, undefined);
  assert.equal(f.calls[0].options.body.images.length, 1);
  assert.equal(f.calls[0].options.body.consent, true);
  assert.match(f.navigations[0], /^https:\/\/wa\.me\/5219982166563\?text=/);
  assert.doesNotMatch(decodeURIComponent(f.navigations[0]), /stored-private-id|PCC-|prop-/);
  assert.equal(f.children.at(-1).href, f.navigations[0]);
  await f.submitGuestProperty();
  assert.equal(f.calls.length, 1);
  assert.equal(f.button.disabled, true);
});

test("a failed guest save preserves entries and idempotency and does not open WhatsApp", async () => {
  const f = fixture({ failOnce: true });
  await f.submitGuestProperty();
  assert.equal(f.navigations.length, 0);
  assert.equal(f.message.textContent, "Connection lost");
  assert.equal(f.form.fields.location, "Puerto Cancún");
  assert.equal(f.button.disabled, false);
  await f.submitGuestProperty();
  assert.equal(f.calls[0].options.headers["Idempotency-Key"], f.calls[1].options.headers["Idempotency-Key"]);
  assert.equal(f.navigations.length, 1);
});

test("registration draft carries guest photos and rental details without replacing an existing draft", async () => {
  const fields = Object.fromEntries(["title", "type", "operation", "zone", "address", "email"].map(name => [name, { value: "" }]));
  const form = { dataset: {}, fields };
  const images = [{ imageDataUrl: "data:image/jpeg;base64,photo" }];
  const writes = [], cleared = [];
  const runtime = {
    state: { lang: "es", session: { id: "seller-one", role: "seller" } },
    readPersistentDraft: async () => ({ fields: { type: "Terreno", operation: "rent", location: "Puerto Cancún", email: "owner@example.test" }, images, savedAt: new Date().toISOString() }),
    formField: (target, name) => target.fields[name], saveSellerDraft() { writes.push(form.fields); form.dataset.dirty = "true"; },
    updateSellerImagePreview(value) { writes.push(value); }, deletePersistentDraft: async key => cleared.push(key),
    $: () => ({}), setFormMessage() {},
  };
  vm.createContext(runtime);
  vm.runInContext(extract("restoreGuestPropertyDraft"), runtime);
  await runtime.restoreGuestPropertyDraft(form);
  assert.equal(fields.title.value, "Terreno · Puerto Cancún");
  assert.equal(fields.operation.value, "rent");
  assert.equal(JSON.parse(form.dataset.currentImages)[0].imageDataUrl, images[0].imageDataUrl);
  assert.equal(cleared.length, 1);
  fields.title.value = "Existing edited draft";
  await runtime.restoreGuestPropertyDraft(form);
  assert.equal(fields.title.value, "Existing edited draft");
  assert.equal(cleared.length, 1);
});

test("late guest draft reads cannot write into a different signed-in account", async () => {
  let resolve;
  let saved = false;
  const runtime = {
    state: { session: { id: "seller-one", role: "seller" } },
    readPersistentDraft: () => new Promise(done => { resolve = done; }),
    saveSellerDraft() { saved = true; },
  };
  vm.createContext(runtime);
  vm.runInContext(extract("restoreGuestPropertyDraft"), runtime);
  const pending = runtime.restoreGuestPropertyDraft({ dataset: {} });
  runtime.state.session = { id: "seller-two", role: "seller" };
  resolve({ fields: { title: "Someone else's property" }, savedAt: new Date().toISOString() });
  await pending;
  assert.equal(saved, false);
});
