const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { contactPhone, contactRouting, destination, messageFor, recordIncomingInquiry } = require("../contact-inquiries");

test("the phone country's ISO code stays separate from its dialing code and the business destination", () => {
  assert.deepEqual(contactPhone("416 555 0199","CA","en"), { phone: "14165550199", country: "CA", prefix: "+1" });
  assert.deepEqual(contactPhone("202-555-0199","US","es"), { phone: "12025550199", country: "US", prefix: "+1" });
  assert.equal(contactPhone("+1 800 555 0199","CA","en").country, "CA");
  assert.equal(contactPhone("998 216 6563","MX","en").phone, "529982166563");
  assert.throws(() => contactPhone("+34 612 345 678","MX","en"), /country/);
  assert.throws(() => contactPhone("123abc","MX","es"), /teléfono/);
  assert.throws(() => contactPhone("123","MX","en"), /phone/);
  assert.equal(destination(contactRouting(), "CA"), "19562518956");
  assert.equal(destination(contactRouting({ us: "" }), "US"), "5219982166563");
  assert.equal(destination(contactRouting({ rule: "us" }), "ES"), "19562518956");
  assert.throws(() => contactRouting({ us: "", mx: "" }, true), /respaldo/);
});

test("the bilingual message describes the specific intent and omits missing details", () => {
  for (const lang of ["en","es"]) {
    const texts = ["buy","rent","sell","let"].map(intent => messageFor({ intent, lang, propertyType: "Terreno", project: "Proyecto QA", reference: "REF-QA", whatsappRef: "7df7aac712283fef", preferences: "Acceso", area: "520 m²" }, "https://example.invalid/terrenos"));
    assert.equal(new Set(texts.map(t => t.split("\n")[0])).size,4);
    for (const text of texts) {
      assert.match(text, /REF-QA/); assert.match(text, /520 m²/); assert.match(text, /Acceso/);
      assert.doesNotMatch(text, /undefined|null|Budget|Presupuesto/);
      assert.match(text, lang === "en" ? /land\./ : /un terreno\./);
    }
  }
});

test("message receipt requires an incoming sender and the exact inquiry reference", async () => {
  const calls = [];
  const query = (...args) => { calls.push(args); };
  await recordIncomingInquiry(query, "5219982166563@s.whatsapp.net", "Hola", new Date());
  await recordIncomingInquiry(query, "566@g.us", "Ref. PCC-7df7aac712283fef", new Date());
  assert.equal(calls.length,0);
  await recordIncomingInquiry(query, "5219982166563@s.whatsapp.net", "Ref. PCC-7df7aac712283fef", new Date());
  assert.equal(calls.length,2);
  assert.deepEqual(calls[0][1][0], ["5219982166563","529982166563"]);
  assert.equal(calls[0][1][1], "7df7aac712283fef");
});

// Runs against an explicitly enabled disposable local instance, with the same CSRF, Express and PostgreSQL path as the site.
test("real HTTP / PostgreSQL inquiry, CRM, status, history, click and retry", { skip: !process.env.PCC_INQUIRY_TEST_URL }, async () => {
  const base = new URL(process.env.PCC_INQUIRY_TEST_URL);
  assert.ok(["localhost","127.0.0.1"].includes(base.hostname));
  let cookie = "", csrf = "";
  const call = async (path, method = "GET", body) => {
    const r = await fetch(new URL(path, base), { method, headers: { "Content-Type": "application/json", Origin: base.origin, Cookie: cookie, "X-CSRF-Token": csrf }, body: body && JSON.stringify(body) });
    const set = r.headers.getSetCookie();
    if (set.length) cookie = set[0].split(";")[0];
    const data = await r.json().catch(() => ({}));
    if (data.csrfToken) csrf = data.csrfToken;
    return { status: r.status, data };
  };
  await call("/api/session");
  const options = (await call("/api/inquiries/options")).data;
  assert.ok(options.countries.length > 240);
  const phone = "41655501" + String(Date.now()).slice(-2);
  const origin = "e2e-" + randomUUID();
  const budget = 250000;
  const req = { phone, country: "CA", lang: "en", intent: "buy", budget, currency: "USD", preferences: origin,
    sourcePath: "/en/properties?q=land", propertyType: "Terreno", zone: "Puerto Cancún", project: "Proyecto QA", reference: "QA-PRJ",
    origin: "test-presale", formStartedAt: Date.now()-3000, consent: true, requestId: randomUUID() };
  assert.equal((await call("/api/inquiries","POST",{ ...req, phone: "bad" })).status,400);
  const results = await Promise.all([call("/api/inquiries","POST", req),call("/api/inquiries","POST", req)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);
  const first = results[0].data;
  assert.equal(first.id,results[1].data.id);
  assert.deepEqual(Object.keys(first).sort(),["id","whatsappUrl","clickToken"].sort());
  const url = new URL(first.whatsappUrl);
  assert.equal(url.hostname,"wa.me");
  assert.match(url.searchParams.get("text"),/250,000 USD/);
  assert.match(url.searchParams.get("text"),/Proyecto QA/);
  assert.match(url.searchParams.get("text"),/QA-PRJ/);
  const rent = await call("/api/inquiries","POST",{ ...req, intent: "rent", requestId: randomUUID() });
  assert.equal(rent.status,201);
  assert.notEqual(rent.data.id,first.id);
  for (const intent of ["sell", "let"]) {
    const response = await call("/api/inquiries","POST",{ ...req, lang: "es", intent, budget: "", area: "450 m²", requestId: randomUUID() });
    assert.equal(response.status, 201);
    assert.match(new URL(response.data.whatsappUrl).searchParams.get("text"), /450 m²/);
  }
  const sale = { title: "Guest " + randomUUID(), type: "Terreno", location: "Puerto Cancún", country: "CA", phone, preferredContact: "whatsapp", lang: "en", consent: true, formStartedAt: Date.now()-2500, sourcePath: "/en/sell-property-cancun" };
  assert.equal((await call("/api/guest-sale-requests","POST",{ ...sale, phone: "", email: "optional@example.test" })).status,400);
  const guest = await call("/api/guest-sale-requests","POST",sale);
  assert.equal(guest.status,201);
  assert.match(new URL(guest.data.action.whatsappUrl).searchParams.get("text"),/sell land/);
  const guestRetry = await call("/api/guest-sale-requests","POST",sale);
  assert.equal(guestRetry.data.request.id,guest.data.request.id);
  const estimate = { leadType: "validar-precio", lang: "en", country: "CA", phone, ownerEstimate: "42500", currency: "USD", zone: "QA " + randomUUID(), consent: true, formStartedAt: Date.now()-2500, sourcePath: "/en/review-property-price" };
  const review = await call("/api/leads","POST",estimate);
  assert.equal(review.status,201);
  assert.match(new URL(review.data.action.whatsappUrl).searchParams.get("text"),/My estimate: 42500 USD/);
  const admin = await call("/api/auth/login","POST",{ username: process.env.PCC_INQUIRY_TEST_ADMIN, password: process.env.PCC_INQUIRY_TEST_PASSWORD });
  assert.equal(admin.status,200);
  const leads = async () => (await call("/api/admin/leads?interest=" + encodeURIComponent(origin))).data.leads;
  let rows = await leads();
  assert.equal(rows.length,4);
  assert.equal(new Set(rows.map(r=>r.contactId)).size,1);
  const lead = rows.find(r=>r.id === first.id);
  assert.equal(lead.status,"new"); assert.equal(lead.phone, "1" + phone);
  assert.equal(lead.payload.country,"CA"); assert.equal(lead.payload.prefix,"+1");
  assert.equal(lead.payload.whatsappClickedAt,undefined); assert.equal(lead.payload.whatsappReceivedAt,undefined);
  assert.equal((await call("/api/admin/leads?intent=let&interest=" + encodeURIComponent(origin))).data.leads.length,1);
  assert.equal((await call("/api/inquiries/" + first.id + "/whatsapp-click","POST",{ token:"bad" })).status,403);
  assert.equal((await call("/api/inquiries/" + first.id + "/whatsapp-click","POST",{ token:first.clickToken })).status,204);
  const updated = await call("/api/admin/leads/" + first.id,"PATCH",{ internalNotes:"QA local" });
  assert.equal(updated.data.lead.status,"new"); assert.equal(updated.data.lead.internalNotes,"QA local");
  assert.ok(updated.data.lead.payload.whatsappClickedAt); assert.equal(updated.data.lead.payload.whatsappReceivedAt,undefined);
  assert.equal((await call("/api/admin/leads/" + first.id,"PATCH",{ status:"contacted" })).data.lead.status,"contacted");
  const info = await call("/api/admin/contacts/" + lead.contactId + "/intelligence");
  assert.equal(info.status,200);
  assert.match(JSON.stringify(info.data), /Proyecto QA/);
  assert.ok(JSON.stringify(info.data).includes(sale.title));
  const guestFromPanel = (await call("/api/admin/guest-sale-requests")).data.requests.find(row=>row.id===guest.data.request.id);
  assert.equal(guestFromPanel.country,"CA"); assert.equal(guestFromPanel.countryCode,"+1"); assert.equal(guestFromPanel.contactId,lead.contactId);
  assert.equal((await call("/api/inquiries/"+guestFromPanel.id+"/whatsapp-click","POST",{token:guest.data.action.clickToken})).status,204);
  const refreshedGuest = (await call("/api/admin/guest-sale-requests")).data.requests.find(row=>row.id===guestFromPanel.id);
  assert.ok(refreshedGuest.inquiry.whatsappClickedAt); assert.equal(refreshedGuest.inquiry.whatsappReceivedAt,undefined);
  const valuation = (await call("/api/admin/valuations")).data.valuations.find(row=>row.requestId===review.data.lead.id);
  assert.equal(valuation.country,"CA"); assert.equal(valuation.expectedCurrency,"USD"); assert.equal(valuation.contactId,lead.contactId);
});
