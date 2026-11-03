"use strict";

function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }

function normalizeBlogPagination({ page = 1, limit = 24 } = {}) {
  const pageNumber = /^\d+$/.test(String(page)) ? Number(page) : 1;
  const pageSize = /^\d+$/.test(String(limit)) ? Number(limit) : 24;
  const safePage = Math.min(100000, Math.max(1, Number.isSafeInteger(pageNumber) ? pageNumber : 1));
  const safeLimit = Math.min(60, Math.max(1, Number.isSafeInteger(pageSize) ? pageSize : 24));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function blogListQuery({ lang = "es", ...options } = {}) {
  const pagination = normalizeBlogPagination(options);
  return {
    text: `SELECT id, slug, title_es, title_en, excerpt_es, excerpt_en, cover_image, status,
      author_name, seo_title, seo_description, source_links, automation_date, published_at, created_at, updated_at
      FROM blog_posts WHERE status = 'published'
      AND ($2::text = 'es' OR (NULLIF(BTRIM(title_en), '') IS NOT NULL AND NULLIF(BTRIM(content_en), '') IS NOT NULL))
      ORDER BY published_at DESC NULLS LAST, updated_at DESC, id DESC LIMIT $1 OFFSET $3`,
    values: [pagination.limit + 1, lang === "en" ? "en" : "es", pagination.offset],
    pagination,
  };
}

function paginateBlogRows(rows, pagination) {
  return { rows: rows.slice(0, pagination.limit), pagination: { page: pagination.page, limit: pagination.limit, hasNext: rows.length > pagination.limit } };
}

function renderBlogList(posts, lang = "es", pagination = {}) {
  const english = lang === "en";
  const base = english ? "/en/blog" : "/blog";
  const { page } = normalizeBlogPagination(pagination);
  const cards = posts.map(post => {
    const title = english ? post.titleEn : post.titleEs;
    const excerpt = english ? post.excerptEn : post.excerptEs;
    const href = `${base}/${encodeURIComponent(post.slug)}`;
    const date = new Date(post.publishedAt || post.updatedAt);
    const dateLabel = Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(english ? "en-US" : "es-MX", { dateStyle: "medium", timeZone: "America/Cancun" }).format(date) : "";
    const cover = /^\/media\/blog\//.test(post.coverImage || "") ? `<a href="${href}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(post.coverImage)}?w=720" alt="" loading="lazy" width="720" height="450" /></a>` : "";
    return `<article class="public-blog-card">${cover}<div>${dateLabel ? `<time class="seo-eyebrow" datetime="${date.toISOString()}">${escapeHtml(dateLabel)}</time>` : ""}<h2><a href="${href}">${escapeHtml(title)}</a></h2><p>${escapeHtml(excerpt)}</p><a class="text-link" href="${href}">${english ? "Read article" : "Leer artículo"}</a></div></article>`;
  }).join("");
  const empty = `<p class="empty-state">${english ? "There are no articles on this page." : "No hay artículos en esta página."}</p>`;
  const previous = page > 1 ? `<a class="ghost-button" rel="prev" href="${base}${page === 2 ? "" : `?page=${page - 1}`}">${english ? "Newer articles" : "Artículos más recientes"}</a>` : "";
  const next = pagination.hasNext ? `<a class="ghost-button" rel="next" href="${base}?page=${page + 1}">${english ? "Older articles" : "Artículos anteriores"}</a>` : "";
  const navigation = previous || next ? `<nav class="blog-pagination" aria-label="${english ? "Article archive" : "Archivo de artículos"}">${previous}<span>${english ? "Page" : "Página"} ${page}</span>${next}</nav>` : "";
  return `<section class="public-blog-grid" id="publicBlogList" data-server-rendered="true">${cards || empty}</section>${navigation}`;
}

module.exports = { blogListQuery, normalizeBlogPagination, paginateBlogRows, renderBlogList };
