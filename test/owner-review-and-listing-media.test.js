const assert = require("node:assert/strict");
const test = require("node:test");
const { renderPropertyPage, renderSeoPage, getPageByPath } = require("../seo-pages");

test("cada revisión de precio conserva idioma, campos comerciales y moneda", () => {
  for (const [review, valuation] of [
    ["/revisar-precio-propiedad", "/valuacion-inmobiliaria-cancun"],
    ["/en/review-property-price", "/en/property-valuation-cancun"],
  ]) {
    const form = renderSeoPage(review);
    assert.match(form, /name="leadType" value="validar-precio"/);
    assert.match(form, /name="ownerEstimate"[^>]*required/);
    assert.match(form, /name="currency"[\s\S]*?>MXN<\/option>[\s\S]*?>USD<\/option>/);
    assert.doesNotMatch(form, /ChatGPT|name="aiResponse"|name="aiMessage"/i);
    const fullPage = renderSeoPage(valuation);
    const factors = fullPage.match(/<section class="valuation-factors">([\s\S]*?)<\/section>/)[1];
    assert.equal((factors.match(/<h3>[^<]+<\/h3><p>[^<]+<\/p>/g) || []).length, 10);
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
test("la valoración conserva la moneda original y un importe antiguo sin moneda", { skip: !base }, async () => {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
  let cookie = "", csrf = "";
  const request = async (route, body) => {
    const response = await fetch(base + route, {
      method: body ? "POST" : "GET",
      headers: { Origin: base, Cookie: cookie, "X-CSRF-Token": csrf, "Content-Type": "application/json", "X-Forwarded-For": "127.80.99.7" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.headers.getSetCookie().length) cookie = response.headers.getSetCookie()[0].split(";")[0];
    const data = await response.json();
    assert.ok(response.ok, data.error);
    if (data.csrfToken) csrf = data.csrfToken;
    return data;
  };
  await request("/api/session");
  const expected = [];
  for (const currency of ["MXN", "USD", null]) {
    const lead = await request("/api/leads", { name: "QA", email: `owner-${Date.now()}-${currency}@example.test`, consent: true,
      formStartedAt: Date.now() - 3000, leadType: "validar-precio", ownerEstimate: 123456.5, ...(currency && { currency }) });
    expected.push([lead.lead.id, currency]);
  }
  await request("/api/auth/login", { username: process.env.PCC_TEST_ADMIN || "qa-admin", password: process.env.PCC_TEST_PASSWORD || "qa-admin-password-only-local" });
  const { valuations } = await request("/api/admin/valuations");
  for (const [id, currency] of expected) {
    const value = valuations.find(row => row.requestId === id);
    assert.equal(value.expectedPrice, 123456.5);
    assert.equal(value.expectedCurrency, currency);
  }
});
