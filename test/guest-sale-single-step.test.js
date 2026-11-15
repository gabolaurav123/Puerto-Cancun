const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { contactIdentity, sourcePath } = require("../contact-inquiries");
const root = path.join(__dirname, "..");
const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const modal = index.slice(index.indexOf('<div class="modal-backdrop" id="guestSaleModal"'), index.indexOf('<div class="modal-backdrop" id="externalShareModal"'));
const handlerSource = serverSource.slice(serverSource.indexOf('app.post("/api/guest-sale-requests"'), serverSource.indexOf('\nconst inquiryChannels ='));
const functionSource = name => { const match = appSource.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`)); assert.ok(match, name); return match[0]; };

function fixture() {
  const rows = [], contacts = [], queries = [];
  let route, nextId = 0;
  const client = {
    release() {},
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (sql.includes("WHERE g.idempotency_key=$1")) return { rows: rows.filter(row => row.idempotency_key === params[0]) };
      if (sql.includes("FROM guest_sale_requests g") && sql.includes("lower(g.title)")) return { rows: rows.filter(row => row.title.toLowerCase() === params[0].toLowerCase() && row.location.toLowerCase() === params[2].toLowerCase() && row.type.toLowerCase() === params[3].toLowerCase() && row.preferred_contact === params[4] && (params[4] === "email" ? row.email === params[5] : row.phone === params[1])) };
      if (sql.includes("INSERT INTO guest_sale_requests")) {
        const fields = ["id","title","type","location","description","image","images","preferred_contact","email","country_code","phone","contact_id","state","city","zone","neighborhood","address","latitude","longitude","map_place","location_precision","google_maps_url","priority","idempotency_key"];
        const row = Object.fromEntries(fields.map((name, i) => [name, params[i]])); rows.push(row); return { rows: [{ id: row.id }] };
      }
      if (sql.includes("INSERT INTO activity_logs")) rows.find(row => row.id === params[0]).inquiry_context = JSON.parse(params[1]);
      return { rows: [] };
    },
  };
  vm.runInNewContext(handlerSource, {
    app: { post(url, fn) { assert.equal(url, "/api/guest-sale-requests"); route = fn; } }, pool: { connect: async () => client },
    sanitizePropertyImageBody: async body => body, parseUploadedImages: body => body.images || [], contactIdentity,
    GUEST_SALE_REQUEST_SUMMARY_COLUMNS: "g.*", serviceChannel: async (_client, country) => ({ country, destination: country === "US" || country === "CA" ? "19562518956" : "5219982166563", whatsappRef: "test" }),
    upsertContact: async (_client, value) => { contacts.push(value); return { id: "contact-" + contacts.length }; },
    inquirySourcePath: sourcePath, inquiryAction: (id, data) => ({ id, destination: data.destination }), siteUrl: "http://localhost", sessionSecret: "local-only", uuid: prefix => prefix + "-" + (++nextId),
  });
  return { rows, contacts, queries, async send(body, key = "") {
    let status = 200, data;
    await route({ body, get: name => name === "Idempotency-Key" ? key : "" }, { status(value) { status = value; return this; }, json(value) { data = value; return this; } }, error => { throw error; });
    return { status, data };
  } };
}
const request = extra => ({ type: "Terreno", location: "Cozumel", preferredContact: "email", email: "owner@example.test", consent: true, lang: "en", formStartedAt: Date.now() - 2000, sourcePath: "/en/sell-property-cancun", ...extra });

test("guest sale is a single basic form; map, images, name and title are optional", () => {
  assert.equal((modal.match(/type="submit"/g) || []).length, 1);
  assert.doesNotMatch(modal, /data-guest-sale-step|continueGuestSale|backGuestSale/);
  for (const name of ["title", "name", "description", "imageFile"]) assert.doesNotMatch(modal.match(new RegExp(`<(?:input|textarea)[^>]*name="${name}"[^>]*>`))[0], /required/);
  assert.match(modal, /<details data-guest-optional-map>/);
  assert.match(modal, /name="latitude" type="hidden"/); assert.match(modal, /name="longitude" type="hidden"/);
  assert.doesNotMatch(functionSource("openGuestSale"), /bindMapPickers|setGuestSaleStep/);
  assert.doesNotMatch(functionSource("resetGuestSaleForm"), /resetMapPickerForForm/);
  assert.match(functionSource("bindMapPickers"), /data-guest-optional-map/);
});

test("the real guest handler accepts email only, stores consent/context and safely defaults optional title", async () => {
  const f = fixture();
  const result = await f.send(request(), "email-key");
  assert.equal(result.status, 201); assert.equal(f.rows.length, 1);
  const row = f.rows[0];
  assert.equal(row.title, "Terreno · Cozumel"); assert.equal(row.email, "owner@example.test"); assert.equal(row.phone, "");
  assert.equal(row.latitude, null); assert.equal(row.longitude, null); assert.equal(row.location_precision, "approximate"); assert.equal(row.images, "[]");
  assert.equal(row.inquiry_context.contactChannel, "email"); assert.equal(row.inquiry_context.consentContact, true); assert.equal(row.inquiry_context.intent, "sell");
  assert.equal(row.inquiry_context.sourcePath, "/en/sell-property-cancun"); assert.equal(f.contacts[0].consentContact, true);
  assert.ok(f.queries.some(query => query.sql === "COMMIT"));
});

test("WhatsApp uses Mexico by default and ignores an unused malformed email", async () => {
  const f = fixture();
  const result = await f.send(request({ preferredContact: "whatsapp", phone: "9982166563", email: "irrelevant-invalid" }));
  assert.equal(result.status, 201); assert.equal(f.rows[0].phone, "529982166563"); assert.equal(f.rows[0].email, null); assert.equal(f.rows[0].country_code, "+52");
  assert.equal(f.rows[0].inquiry_context.country, "MX");
});

test("the selected contact alone is validated; optional map errors never silently become a public exact point", async () => {
  for (const patch of [{ email: "bad" }, { preferredContact: "whatsapp", phone: "" }, { preferredContact: "sms" }, { consent: false }, { type: "Unknown" }, { location: "" }, { latitude: 30, longitude: "" }, { latitude: 0, longitude: 0 }]) {
    const f = fixture(); assert.equal((await f.send(request(patch))).status, 400); assert.equal(f.rows.length, 0);
  }
  const f = fixture(); assert.equal((await f.send(request({ phone: "bad", country: "xx" }))).status, 201);
});

test("retries and duplicate submissions keep a single request, contact and notification for each channel", async () => {
  for (const patch of [{}, { preferredContact: "whatsapp", phone: "2025550199", country: "US" }]) {
    const f = fixture(), body = request(patch);
    const first = await f.send(body, "stable-key"), retry = await f.send(body, "stable-key"), duplicate = await f.send(body);
    assert.equal(first.data.request.id, retry.data.request.id); assert.equal(first.data.request.id, duplicate.data.request.id);
    assert.equal(retry.data.idempotent, true); assert.equal(duplicate.data.duplicate, true);
    assert.equal(f.rows.length, 1); assert.equal(f.contacts.length, 1); assert.equal(f.queries.filter(query => query.sql.includes("INSERT INTO notifications")).length, 1);
  }
  const f = fixture(); await f.send(request(), "stable-key");
  assert.equal((await f.send(request({ email: "different@example.test" }), "stable-key")).status, 409);
  await f.send(request({ email: "different@example.test" }), "different-key"); assert.equal(f.rows.length, 2);
});

test("browser: visible one-step email flow preserves values and idempotency on failure, then confirms once", { skip: process.env.PCC_GUEST_BROWSER !== "1", timeout: 30000 }, async t => {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true, ...(process.env.PCC_MAP_CHROMIUM ? { executablePath: process.env.PCC_MAP_CHROMIUM } : {}) }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(6000);
  await page.setContent(`<html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fs.readFileSync(path.join(root,"styles.css"),"utf8")}</style><body>${modal.replace('id="guestSaleModal" hidden','id="guestSaleModal"')}</body></html>`);
  await page.addScriptTag({ content: `window.state={lang:'en'}; window.$=s=>document.querySelector(s);window.formField=(form,name)=>form.elements[name];window.formImagesReady=()=>true;window.safeParseImages=()=>[];window.setButtonLoading=(button,loading)=>{button.disabled=loading};window.setFormMessage=(node,text)=>{node.textContent=text};window.showToast=()=>{};window.crypto.randomUUID=()=> 'stable-browser-key';window.submissions=[];window.api=async(path,options)=>{submissions.push(options);if(submissions.length===1)throw new Error('Retry safely');return {request:{id:'local-saved'},message:'Request saved'};};${functionSource("updateGuestContactFields")}\n${functionSource("guestSaleSubmit")}\ndocument.querySelectorAll('[name=preferredContact]').forEach(input=>input.addEventListener('change',updateGuestContactFields));document.querySelector('#guestSaleForm').addEventListener('submit',guestSaleSubmit);updateGuestContactFields();` });
  assert.equal(await page.locator('[name="country"]').inputValue(), "MX");
  await page.getByText("Correo", { exact: true }).click();
  assert.equal(await page.locator('[name="phone"]').isVisible(), false); assert.equal(await page.locator('[name="phone"]').isDisabled(), true);
  await page.locator('[name="location"]').fill("Cozumel"); await page.locator('[name="email"]').fill("owner@example.test"); await page.locator('[name="consent"]').check();
  assert.equal(await page.locator('[name="title"]').isVisible(), false); assert.equal(await page.locator('[data-map-frame]').getAttribute("src"), null);
  await page.locator('#guestSaleForm [type="submit"]').click(); await page.waitForFunction(()=>document.querySelector('#guestSaleMessage').textContent==='Retry safely');
  assert.equal(await page.locator('[name="email"]').inputValue(), "owner@example.test");
  await page.locator('#guestSaleForm [type="submit"]').click(); await page.waitForFunction(()=>document.querySelector('#guestSaleMessage').textContent==='Request saved');
  const sent = await page.evaluate(()=>submissions.map(item=>({key:item.headers['Idempotency-Key'],body:item.body})));
  assert.equal(sent.length, 2); assert.equal(sent[0].key, sent[1].key); assert.equal(sent[1].body.email, "owner@example.test"); assert.equal(sent[1].body.phone, undefined); assert.equal(sent[1].body.country, undefined);
  assert.equal(await page.locator('#guestSaleForm [type="submit"]').isDisabled(), true);
  assert.equal(await page.locator('#guestSaleModal').isVisible(), true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), true);
});
