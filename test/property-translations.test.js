const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");
const translation = require("../property-translations");

const server = fs.readFileSync(require.resolve("../server"), "utf8");
function functions(names, bindings = {}) {
  const source = names.map((name) => server.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0]).join("\n");
  return vm.runInNewContext(`${source}\n({ ${names.join(",")} })`, {
    ...translation,
    process: { env: { OPENAI_API_KEY: "test-only" } },
    prompts: { translation: "Translate" },
    DESCRIPTION_MAX_LENGTH: 24000,
    AbortSignal,
    console,
    ...bindings,
  });
}
function providerResult(value) {
  return async () => ({ ok: true, json: async () => ({ output_text: JSON.stringify(value) }) });
}

test("decoded NUL is removed without changing accents, line breaks or literal escape text", () => {
  assert.equal(translation.sanitizeTranslationText(" \0Kaána\0\n\nCancún 🌴\0 "), "Kaána\n\nCancún 🌴");
  assert.equal(translation.sanitizeTranslationText("literal \\u0000"), "literal \\u0000");
  assert.equal(translation.sanitizeTranslationText("\0\0abc\0de", 4), "abcd");
  assert.equal(translation.sanitizeTranslationText(" \0 \0 "), "");
});

test("development names remain recognizable in English, including a missing English name", () => {
  for (const title_en of ["", "Kaána"]) {
    assert.equal(translation.englishPropertyTitle({ publication_section: "developments", title_es: "Kaána", title_en }), "Kaána");
  }
  assert.equal(translation.englishPropertyTitle({ type: "Desarrollo", title_es: "Vita Residenze" }), "Vita Residenze");
  assert.equal(translation.englishPropertyTitle({ publication_section: "developments", title_es: "Kaána", title_en: "Kaána Residences" }), "Kaána Residences");
  assert.equal(translation.englishPropertyTitle({ type: "Casa", title_es: "Casa frente al mar", title_en: "Casa frente al mar" }), "");
});

test("public English fallback keeps development names and still translates ordinary listing titles", () => {
  const { propertyEnglishFallback } = functions(["propertyEnglishFallback"]);
  const row = { publication_section: "developments", type: "Desarrollo", title_es: "Kaána", title_en: "Kaána", description_es: "Frente al mar", description_en: "Oceanfront", zone: "Zona Hotelera" };
  assert.deepEqual(JSON.parse(JSON.stringify(propertyEnglishFallback(row))), { title: "Kaána", description: "Oceanfront" });
  assert.equal(propertyEnglishFallback({ ...row, publication_section: "properties", type: "Casa" }).title, "Home for sale in Zona Hotelera");
});

test("automatic property translations sanitize provider strings before returning persistence values", async () => {
  const { requestAutomaticPropertyTranslation } = functions(["requestAutomaticPropertyTranslation"], {
    fetch: providerResult({ titleEn: "Ka\0ána", descriptionEn: "Pool\0 and sea\n\nCancún" }),
  });
  const result = await requestAutomaticPropertyTranslation("Kaána", "Alberca");
  assert.equal(result.titleEn, "Kaána");
  assert.equal(result.descriptionEn, "Pool and sea\n\nCancún");
});

test("a NUL-only provider field is rejected instead of replacing a missing translation with empty text", async () => {
  for (const data of [{ titleEn: "\0", descriptionEn: "Description" }, { titleEn: "Title", descriptionEn: "\0\0" }]) {
    const { requestAutomaticPropertyTranslation } = functions(["requestAutomaticPropertyTranslation"], { fetch: providerResult(data) });
    await assert.rejects(requestAutomaticPropertyTranslation("Título", "Descripción"), /incompleta/);
  }
});

test("image translations strip decoded NUL before JSONB and discard empty results", async () => {
  const { requestAutomaticImageMetadataTranslation } = functions(["requestAutomaticImageMetadataTranslation"], {
    fetch: providerResult({ translations: [{ index: 0, descriptionEn: "Pool\0 in Cancún" }, { index: 1, descriptionEn: "\0" }] }),
  });
  const result = await requestAutomaticImageMetadataTranslation([{ index: 0, descriptionEs: "Alberca" }, { index: 1, descriptionEs: "Jardín" }]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.translations)), [{ index: 0, descriptionEn: "Pool in Cancún" }]);
  assert.doesNotMatch(JSON.stringify(result.translations), /\\u0000/);
});

function automaticBindings(row, queries) {
  return {
    query: async (sql, params) => { queries.push({ sql, params }); return { rows: sql.startsWith("SELECT") ? [row] : [] }; },
    normalizeImageMetadata: (value) => value,
    safeJsonArray: (value) => value,
    invalidatePublicPropertyCache() {},
    logAiOperation: async () => {},
    PROMPT_VERSION: "test",
  };
}

test("a translated development no longer requests translation every startup just because its name matches", async () => {
  const row = { id: "kaana", publication_section: "developments", title_es: "Kaána", title_en: "Kaána", description_es: "Alberca", description_en: "Pool", image_metadata: [] };
  const queries = [];
  const { automaticallyTranslateProperty } = functions(["automaticallyTranslateProperty"], {
    ...automaticBindings(row, queries),
    requestAutomaticPropertyTranslation: async () => { throw new Error("unnecessary translation"); },
  });
  await automaticallyTranslateProperty(row.id);
  assert.equal(queries.length, 1);
});

test("description and caption backfill persists clean values while preserving the development name", async () => {
  const row = { id: "kaana", publication_section: "developments", title_es: "Kaána", title_en: "Kaána", description_es: "Alberca", description_en: "", image_metadata: [{ descriptionEs: "Alberca", descriptionEn: "" }] };
  const queries = [];
  const { automaticallyTranslateProperty } = functions(["requestAutomaticPropertyTranslation", "requestAutomaticImageMetadataTranslation", "automaticallyTranslateProperty"], {
    ...automaticBindings(row, queries),
    fetch: async (_url, request) => providerResult(JSON.parse(request.body).text.format.name === "automatic_property_translation"
      ? { titleEn: "A different\0 title", descriptionEn: "Pool\0 by the sea" }
      : { translations: [{ index: 0, descriptionEn: "Pool\0" }] })(),
  });
  await automaticallyTranslateProperty(row.id);
  const updates = queries.filter(({ sql }) => sql.startsWith("UPDATE"));
  assert.equal(updates.length, 2);
  assert.equal(updates[0].params[2], "Pool by the sea");
  assert.equal(updates[0].params[3], false, "SQL must not overwrite a development brand while translating its description");
  assert.match(updates[0].sql, /WHEN \$4::boolean AND/);
  assert.equal(JSON.parse(updates[1].params[1])[0].descriptionEn, "Pool");
  for (const { params } of updates) for (const value of params) if (typeof value === "string") assert.equal(value.includes("\0"), false);
});

test("manual translation cache also receives only sanitized provider fields", async () => {
  const start = server.indexOf('app.post("/api/admin/ai/translate-property"');
  const end = server.indexOf("\n});", start) + 4;
  let handler;
  const writes = [];
  vm.runInNewContext(server.slice(start, end), {
    ...translation,
    app: { post: (_path, _guard, fn) => { handler = fn; } },
    requireRole: () => null,
    query: async (sql, params) => { if (sql.includes("INSERT INTO translation_cache")) writes.push(params); return { rows: [] }; },
    crypto: require("node:crypto"),
    uuid: () => "translation-test",
    PROMPT_VERSION: "test",
    DESCRIPTION_MAX_LENGTH: 24000,
    process: { env: { OPENAI_API_KEY: "test-only" } },
    prompts: { translation: "Translate" },
    AbortSignal,
    fetch: providerResult({ titleEn: "Ka\0ána", descriptionEn: "Pool\0" }),
    logAiOperation: async () => {},
  });
  let payload;
  await handler({ body: { title: "Kaána", description: "Alberca" }, session: { user: { id: "admin" } } }, { json: (value) => { payload = value; } }, (error) => { throw error; });
  assert.equal(writes[0][5], "Kaána");
  assert.equal(writes[0][6], "Pool");
  assert.equal(payload.titleEn, "Kaána");
});
