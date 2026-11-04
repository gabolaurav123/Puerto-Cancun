"use strict";

// PostgreSQL text and jsonb cannot store U+0000, even when it is valid JSON.
// Normalize decoded provider fields before validating or persisting them.
function sanitizeTranslationText(value, maxLength = Infinity) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function comparableTranslationText(value) {
  return sanitizeTranslationText(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX");
}

function hasDistinctEnglishTranslation(englishValue, spanishValue) {
  const english = comparableTranslationText(englishValue);
  return Boolean(english) && english !== comparableTranslationText(spanishValue);
}

function englishPropertyTitle(row) {
  const titleEn = sanitizeTranslationText(row.title_en);
  const titleEs = sanitizeTranslationText(row.title_es);
  // Development names are brands: Kaána remains Kaána in either language.
  if (row.publication_section === "developments" || row.type === "Desarrollo") {
    return titleEn || titleEs;
  }
  return hasDistinctEnglishTranslation(titleEn, titleEs) ? titleEn : "";
}

module.exports = { sanitizeTranslationText, hasDistinctEnglishTranslation, englishPropertyTitle };
