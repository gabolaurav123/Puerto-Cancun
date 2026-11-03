const assert = require("node:assert/strict");
const test = require("node:test");
const { renderPropertyPage, renderSeoPage, getPageByPath } = require("../seo-pages");

test("cada revisión de precio conserva idioma, campos comerciales y moneda", () => {
  for (const [review, valuation, sell] of [
    ["/revisar-precio-propiedad", "/valuacion-inmobiliaria-cancun", "/vender-casa-cancun"],
    ["/en/review-property-price", "/en/property-valuation-cancun", "/en/sell-property-cancun"],
  ]) {
    const form = renderSeoPage(review);
    assert.match(form, /name="leadType" value="validar-precio"/);
    assert.match(form, /name="ownerEstimate"[^>]*required/);
    assert.match(form, /name="currency"[\s\S]*?>MXN<\/option>[\s\S]*?>USD<\/option>/);
    assert.doesNotMatch(form, /ChatGPT|name="aiResponse"|name="aiMessage"/i);
    const fullPage = renderSeoPage(valuation);
    const factors = fullPage.match(/<details class="valuation-options"><summary>[^<]+<\/summary><div class="valuation-factors">([\s\S]*?)<\/details>/)[1];
    assert.equal((factors.match(/<h3>[^<]+<\/h3><p>[^<]+<\/p>/g) || []).length, 10);
    assert.ok(fullPage.indexOf('id="valuation-form"') < fullPage.indexOf(factors));
    for (const html of [fullPage, renderSeoPage(sell)]) {
      const valuationForm = html.match(/<form [^>]*data-lead-form>\s*<input [^>]*value="valuacion-inmobiliaria"[\s\S]*?<\/form>/)[0];
      const optional = valuationForm.match(/<details class="valuation-options">[\s\S]*?<\/details>/)[0];
      assert.doesNotMatch(optional, /\brequired\b/);
      assert.match(optional, /name="propertyType"/);
      assert.match(optional, /name="ownerEstimate"/);
      const main = valuationForm.replace(optional, "");
      assert.deepEqual([...main.matchAll(/name="([^"]+)"[^>]*?\brequired\b/g)].map(m => m[1]), ["contact", "zone"]);
    }
    assert.match(fullPage, /name="leadType" value="valuacion-inmobiliaria"/);
    assert.match(form, review.startsWith("/en") ? /Which references/ : /Qué referencias/);
  }
  assert.equal(getPageByPath("/revisar-precio-propiedad").alternate, "/en/review-property-price");
});

test("la ficha ofrece video si existe y reserva el pie de foto para la galería abierta", () => {
  const item = {
    id: "test-media", titleEs: "Ficha de prueba", titleEn: "Test listing", type: "Casa",
    images: ["/media/properties/test-media/0"], imageMetadata: [{ descriptionEs: "Pie de prueba", descriptionEn: "Gallery caption" }],
    videoUrl: "/media/properties/test-media/video?v=2", videoMimeType: "video/webm",
  };
  for (const [lang, caption] of [["es", "Pie de prueba"], ["en", "Gallery caption"]]) {
    const html = renderPropertyPage(item, lang).html;
    assert.match(html, /<video controls playsinline preload="metadata"[^>]*src="\/media\/properties\/test-media\/video\?v=2"/);
    assert.ok(html.includes(`data-caption="${caption}"`) && html.includes(`alt="${caption}"`));
    assert.ok(!html.replace(/<[^>]*>/g, "").includes(caption));
    assert.match(html, /data-gallery-caption hidden/);
  }
  assert.doesNotMatch(renderPropertyPage({ ...item, videoUrl: "" }, "es").html, /<video\b/);
});

const base = process.env.PCC_TEST_BASE;
test("el acceso principal a revisión conserva su idioma antes de ejecutar JavaScript", { skip: !base }, async () => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
  for (const [home, destination, label] of [
    ["/", "/revisar-precio-propiedad", "Revisar mi estimación"],
    ["/en", "/en/review-property-price", "Review my estimate"],
  ]) {
    const html = await (await fetch(base + home)).text();
    const button = html.match(/href="([^"]+)" data-i18n="heroPriceReviewCta">([^<]+)<\/a>/);
    assert.ok(button);
    assert.equal(button[1], destination);
    assert.equal(button[2], label);
    const target = await fetch(base + button[1]);
    assert.equal(target.status, 200);
    assert.match(await target.text(), /name="leadType" value="validar-precio"/);
  }
});

test("la valoración conserva la moneda original y un importe antiguo sin moneda", { skip: !base }, async () => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
  let cookie = "", csrf = "";
  const clientIp = `127.80.${10 + process.pid % 200}.${10 + Date.now() % 200}`;
  const request = async (route, body, expectedStatus) => {
    const response = await fetch(base + route, {
      method: body ? "POST" : "GET",
      headers: { Origin: base, Cookie: cookie, "X-CSRF-Token": csrf, "Content-Type": "application/json", "X-Forwarded-For": clientIp },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.headers.getSetCookie().length) cookie = response.headers.getSetCookie()[0].split(";")[0];
    const data = await response.json();
    if (expectedStatus) assert.equal(response.status, expectedStatus, data.error);
    else assert.ok(response.ok, data.error);
    if (data.csrfToken) csrf = data.csrfToken;
    return data;
  };
  await request("/api/session");
  const inquiry = { leadType: "valuacion-inmobiliaria", zone: "Zona QA", consent: true, formStartedAt: Date.now() - 3000 };
  await request("/api/leads", { ...inquiry, name: "Solo nombre" }, 400);
  await request("/api/leads", { ...inquiry, contact: "abc1234567890def" }, 400);
  const contact = `+52 998 ${String(Date.now()).slice(-7)}`;
  await request("/api/leads", { ...inquiry, contact, consent: false }, 400);
  await request("/api/leads", { ...inquiry, contact, formStartedAt: Date.now() }, 400);
  assert.deepEqual(await request("/api/leads", { ...inquiry, contact, website: "bot" }, 201), { ok: true });
  const minimal = (await request("/api/leads", { ...inquiry, contact }, 201)).lead;
  assert.equal(minimal.phone, contact.replace(/\D/g, ""));
  assert.deepEqual((await request("/api/leads", { ...inquiry, contact }, 200)).lead, { id: minimal.id });
  const expected = [];
  for (const currency of ["MXN", "USD", null]) {
    const lead = await request("/api/leads", { name: "QA", email: `owner-${Date.now()}-${currency}@example.test`, consent: true,
      formStartedAt: Date.now() - 3000, leadType: "validar-precio", ownerEstimate: 123456.5, ...(currency && { currency }) });
    expected.push([lead.lead.id, currency]);
  }
  await request("/api/auth/login", { username: process.env.PCC_TEST_ADMIN || "qa-admin", password: process.env.PCC_TEST_PASSWORD || "qa-admin-password-only-local" });
  const { valuations } = await request("/api/admin/valuations");
  const requested = valuations.find(row => row.requestId === minimal.id);
  assert.ok(requested);
  assert.equal(requested.phone, minimal.phone);
  assert.equal(requested.zone, inquiry.zone);
  assert.equal(requested.expectedPrice, null);
  assert.equal(requested.expectedCurrency, null);
  for (const [id, currency] of expected) {
    const value = valuations.find(row => row.requestId === id);
    assert.equal(value.expectedPrice, 123456.5);
    assert.equal(value.expectedCurrency, currency);
  }
});
