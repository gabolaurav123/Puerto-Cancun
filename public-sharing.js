"use strict";
const { createHash } = require("node:crypto");
const inventory = require("./inventory-contract");

const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);

function shareToken(record) {
  if (!record?.id) return "";
  const kind = record.presaleProject ? "presale" : "listing";
  return createHash("sha256").update(`pcc-public-share-v1:${kind}:${record.presaleProject?.id || record.id}`).digest("base64url").slice(0, 12);
}

function sharePath(record, lang = "es") {
  const token = shareToken(record);
  return token ? `${lang === "en" ? "/en" : ""}/s/${token}` : "";
}

function shareButton(record, lang = "es") {
  const path = sharePath(record, lang);
  if (!path) return "";
  const title = (lang === "en" ? record.titleEn : record.titleEs) || record.titleEs || record.titleEn || "";
  const label = lang === "en" ? "Share" : "Compartir";
  return `<button type="button" class="pdf-share-trigger public-share-trigger" data-public-share="${path}" data-share-title="${escape(require("./whatsapp-message").titleWithMls(title, record.mls))}" aria-label="${label} ${escape(title)}" title="${label}" aria-haspopup="dialog"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></svg></button>`;
}

function resolveSharePath(token, properties, directory, lang = "es") {
  if (!/^[A-Za-z0-9_-]{12}$/.test(String(token || ""))) return "";
  const records = properties.filter(inventory.isPublic);
  const projects = require("./catalog-directory").projectRecords(directory, records);
  const matches = [...records, ...projects].filter(record => shareToken(record) === token);
  // Never choose arbitrarily if a token is ambiguous or a listing is withdrawn.
  if (matches.length !== 1) return "";
  const record = matches[0];
  return record.presaleProject ? (lang === "en" ? record.urlEn : record.urlEs) : require("./seo-pages").propertyPath(record, lang);
}

module.exports = { shareToken, sharePath, shareButton, resolveSharePath };
