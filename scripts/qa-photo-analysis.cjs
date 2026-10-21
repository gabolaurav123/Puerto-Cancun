const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const sharp = require("sharp");
const { chromium } = require(require.resolve("playwright", { paths: [process.env.PLAYWRIGHT_MODULES || process.cwd()] }));
const base = process.env.PCC_TEST_BASE;
if (!base || !["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Use a disposable local QA server.");
const output = path.resolve(process.env.PCC_QA_OUTPUT || "tmp/photo-analysis-qa");
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCC_CHROME_PATH });
  let page;
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: { "X-Forwarded-For": "127.0.0.119" } });
    page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let acceptDialog = true;
    page.on("dialog", (dialog) => acceptDialog ? dialog.accept() : dialog.dismiss());
    await page.goto(`${base}/panel`);
    await page.locator("#loginForm [name=username]").fill("qa-admin");
    await page.locator("#loginForm [name=password]").fill("qa-admin-password-only-local");
    await page.locator("#loginForm button[type=submit]").click();
    await page.waitForSelector("#adminPanel:not([hidden])");
    const consent = page.getByRole("button", { name: "Solo esenciales", exact: true });
    if (await consent.isVisible()) await consent.click();
    const select = async (section, child) => {
      if (page.viewportSize().width <= 980 && await page.locator("#adminPanel").evaluate((el) => el.classList.contains("sidebar-collapsed"))) await page.locator("#adminSidebarToggle").click();
      await page.locator(`[data-admin-section="${section}"]`).click();
      if (child) await page.locator(`.admin-sidebar-subnav [data-admin-section-link="${child}"]`).click();
    };
    await select("properties", "new-property");
    await page.locator("#resetListingForm").click();
    if (await page.locator("#confirmModal").isVisible()) await page.locator("#confirmModalAccept").click();
    await page.waitForFunction(() => document.querySelector("#listingForm [name=title]").value === "");
    const title = page.locator("#listingForm [name=title]");
    const description = page.locator("#listingForm [name=description]");
    await title.fill("QA Analisis fotografico");
    await description.fill("Descripcion original manual.");
    await page.locator("#listingKeywords").fill("terraza, manual");
    const buffer = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#e7eeeb" } }).jpeg().toBuffer();
    const upload = (name) => ({ name, mimeType: "image/jpeg", buffer });
    await page.locator("#listingForm [name=imageFile]").setInputFiles([upload("primera.jpg"), upload("segunda.jpg")]);
    await page.waitForFunction(() => document.querySelectorAll("#listingImagePreview [data-image-index].image-preview-item").length === 2);

    let calls = 0;
    let release;
    let delayed = false;
    let technical = false;
    // Paid vision is isolated here. The service request/response contract is tested separately.
    await page.route("**/api/admin/ai/analyze-images", async (route) => {
      calls += 1;
      const body = route.request().postDataJSON();
      assert.ok(body.images.length);
      assert.ok(body.images[0].startsWith("data:image/"));
      if (delayed) await new Promise((resolve) => { release = resolve; });
      const data = {
        provider: technical ? "technical" : "openai", totalCount: body.images.length, analyzedCount: technical ? 0 : body.images.length,
        items: body.images.map((image, index) => ({ index, width: 1200, height: 800, classification: "terraza", visualAnalyzed: !technical, duplicateOf: null,
          suggestedAlt: technical ? "" : `Terraza de la foto ${index + 1}.`, suggestedAltEn: technical ? "" : `Terrace in photo ${index + 1}.` })),
        keywords: technical ? [] : ["terraza", "alberca", "luz natural"], recommendedCoverIndex: 0, suggestedOrder: body.images.map((_, index) => index),
        descriptionEs: technical ? "" : "Las fotografias muestran una terraza con luz natural.",
        descriptionEn: technical ? "" : "The photos show a terrace with natural light.",
        ...(technical ? { warning: "OpenAI no esta configurado. No se generaron descripciones." } : {}),
      };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    });
    await page.locator("#analyzeListingImages").click();
    await page.locator("#listingPhotoKeywords").waitFor({ state: "visible" });
    assert.equal(await description.inputValue(), "Descripcion original manual.");
    assert.equal(await page.locator("#listingKeywords").inputValue(), "terraza, manual");
    assert.equal(await page.locator('#listingImagePreview [data-image-description="es"]').first().inputValue(), "");
    await page.locator('#listingPhotoKeywordOptions [data-photo-keyword="1"]').uncheck();
    await page.locator("#applyPhotoKeywords").click();
    assert.equal(await page.locator("#listingKeywords").inputValue(), "terraza, manual, luz natural");
    await page.locator("#applyPhotoKeywords").click();
    assert.equal(await page.locator("#listingKeywords").inputValue(), "terraza, manual, luz natural");
    await page.locator("#clearPhotoKeywords").click();
    assert.equal(await page.locator("#applyPhotoKeywords").isDisabled(), true);
    await page.locator("#selectAllPhotoKeywords").click();
    await page.locator('[data-apply-photo-caption="1"]').click();
    assert.equal(await page.locator('#listingImagePreview [data-image-description="es"]').first().inputValue(), "");
    assert.equal(await page.locator('#listingImagePreview [data-image-description="es"]').nth(1).inputValue(), "Terraza de la foto 2.");
    await page.locator('[data-photo-caption-es="1"]').fill("Descripcion revisada de la segunda foto.");
    acceptDialog = false;
    await page.locator('[data-apply-photo-caption="1"]').click();
    assert.equal(await page.locator('#listingImagePreview [data-image-description="es"]').nth(1).inputValue(), "Terraza de la foto 2.");
    acceptDialog = true;
    await page.locator('[data-apply-photo-caption="1"]').click();
    assert.equal(await page.locator('#listingImagePreview [data-image-description="es"]').nth(1).inputValue(), "Descripcion revisada de la segunda foto.");
    const generate = page.locator('[data-generate-photo-description="description"]').last();
    await generate.click();
    await page.locator("#listingAiReview").waitFor({ state: "visible" });
    assert.equal(calls, 1, "Reuse the current visual analysis instead of spending twice");
    await description.fill("Edicion manual posterior.");
    await page.locator("#applyListingAi").click();
    assert.equal(await description.inputValue(), "Edicion manual posterior.");
    await page.locator("#discardListingAi").click();
    await generate.click();
    await page.locator("#applyListingAi").click();
    assert.match(await description.inputValue(), /fotografias muestran/);
    await page.locator('[data-generate-photo-description="descriptionEn"]').click();
    await page.locator("#applyListingAi").click();
    assert.match(await page.locator('#listingForm [name="descriptionEn"]').inputValue(), /photos show/);
    await page.locator("#listingImageAnalysis").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, "photo-analysis-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#listingPhotoKeywords").scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, "photo-keywords-mobile.png") });
    await page.locator('[data-photo-caption-es="1"]').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, "photo-caption-mobile.png") });
    await generate.click();
    await page.locator("#listingForm [name=imageFile]").setInputFiles(upload("tercera.jpg"));
    await page.waitForFunction(() => document.querySelectorAll("#listingImagePreview .image-preview-item").length === 3);
    assert.equal(await page.locator("#listingImageAnalysis").isVisible(), false);
    await page.locator("#applyListingAi").click();
    assert.match(await page.locator("#listingAiMessage").innerText(), /galería o publicación cambió/);
    await page.locator("#discardListingAi").click();
    await page.waitForFunction(() => document.querySelector("#listingDraftStatus").textContent.includes("sincronizado"));
    await page.reload();
    await page.waitForSelector("#adminPanel:not([hidden])");
    await select("properties");
    await page.locator('[data-open-listing-draft="new-properties"]').click();
    await page.waitForFunction(() => document.querySelectorAll("#listingImagePreview .image-preview-item").length === 3);
    assert.equal(await page.locator('#listingImagePreview [data-image-description="es"]').nth(1).inputValue(), "Descripcion revisada de la segunda foto.");
    assert.equal(await page.locator("#listingKeywords").inputValue(), "terraza, manual, luz natural");
    technical = true;
    await page.locator('[data-generate-photo-description="description"]').last().click();
    await page.waitForFunction(() => document.querySelector("#listingAiMessage").textContent.includes("no esta configurado"));
    assert.equal(await page.locator("#listingPhotoKeywords").isVisible(), false);
    assert.match(await description.inputValue(), /fotografias muestran/);
    technical = false;
    delayed = true;
    await page.locator("#analyzeListingImages").click();
    while (!release) await new Promise((resolve) => setTimeout(resolve, 20));
    await select("developments", "new-development");
    await title.fill("QA Desarrollo separado");
    const lateResponse = page.waitForResponse("**/api/admin/ai/analyze-images");
    release();
    await lateResponse;
    await page.waitForFunction(() => document.querySelector("#analyzeListingImages").disabled === false);
    assert.equal(await title.inputValue(), "QA Desarrollo separado");
    assert.equal(await page.locator("#listingImageAnalysis").isVisible(), false);
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log("PASS: unsaved gallery, caption confirmation, keyword selection/dedup, bilingual description review/apply, stale guards, draft reload, mobile layout and failure preservation; provider mocked.");
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(output, "photo-analysis-failure.png") }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
