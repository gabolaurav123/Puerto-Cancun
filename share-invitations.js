"use strict";
const { randomBytes } = require("node:crypto");
const { hashTrackingId, cleanText } = require("./visitor-analytics");
const { publicPages, propertyPath } = require("./seo-pages");
const { sharePath, shareToken } = require("./public-sharing");
const { projectRecords } = require("./catalog-directory");
const { isPublic } = require("./inventory-contract");
const { internalRoleAllows } = require("./auth-utils");

const tokenPattern = /^[a-f0-9]{32}$/;
const shortPattern = /^\/(?:en\/)?s\/([A-Za-z0-9_-]{12})$/;
const pages = new Map(publicPages().map(page => [page.path, page]));
const adminRoute = "/api/admin/visitor-leads/invitations";

const migration = {
  id: "0010-share-invitations",
  description: "Enlaces compartidos, aperturas consentidas y consultas voluntarias",
  up: db => db.query(`
    CREATE TABLE share_invitations (
      token text PRIMARY KEY, source_path text NOT NULL, landing_path text NOT NULL, title text NOT NULL,
      creator_id text, creator_name text, intended_for text, created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX invitation_recency ON share_invitations(created_at DESC, token);
    CREATE TABLE share_invitation_opens (
      token text NOT NULL REFERENCES share_invitations ON DELETE CASCADE,
      session_id text NOT NULL REFERENCES visitor_sessions ON DELETE CASCADE,
      channel text, opened_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(token, session_id)
    );
    CREATE TABLE share_invitation_leads (
      lead_id text PRIMARY KEY REFERENCES lead_requests ON DELETE CASCADE,
      token text NOT NULL, session_id text NOT NULL,
      FOREIGN KEY(token,session_id) REFERENCES share_invitation_opens ON DELETE CASCADE
    ); CREATE INDEX invitation_leads_token ON share_invitation_leads(token);`)
};

function parseSiteUrl(raw, siteUrl) {
  if (typeof raw !== "string" || raw.length > 1800 || /[\\\x00-\x1f]/.test(raw) || !/^(?:https?:\/\/|\/(?!\/))/.test(raw)) return null;
  try {
    const base = new URL(siteUrl);
    const url = new URL(raw, base);
    return url.origin === base.origin && !url.username && !url.password ? url : null;
  } catch { return null; }
}

async function resolveTarget(raw, { siteUrl, inventory, directory, aliases, query }, onlyListing = false) {
  const url = parseSiteUrl(raw, siteUrl);
  if (!url) return null;
  const path = aliases()[url.pathname] || url.pathname.replace(/\/$/, "") || "/";
  const short = path.match(shortPattern);
  const project = url.searchParams.get("project");
  const lang = /^\/en(?:\/|$)/.test(path) ? "en" : "es";
  if (!onlyListing && !project && pages.has(path)) {
    const filters = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (/^(entity|location|locations|subarea|type|operation|modality|view|sort|rentPeriod|currency|zone|q|page)$/.test(key) && value.length <= 160) filters.append(key,value);
    }
    const landing = path + (filters.size ? "?" + filters : "");
    return { source: landing, landing, title: pages.get(path).h1 || pages.get(path).title };
  }
  const blog = !onlyListing && path.match(/^\/(?:en\/)?blog\/([a-z0-9-]+)$/);
  if (blog) {
    const post = (await query("SELECT title_es, title_en, content_en FROM blog_posts WHERE slug=$1 AND status='published'", [blog[1]])).rows[0];
    const title = lang === "en" ? post?.content_en?.trim() && post.title_en : post?.title_es;
    return title ? { source:path, landing:path, title } : null;
  }
  if (!short && (onlyListing || !project && !/^\/(propiedades|en\/properties)\/[^/]+$/.test(path))) return null;
  const records = (await inventory()).filter(isPublic);
  const projects = projectRecords(directory(), records);
  const destination = record => record.presaleProject ? (lang === "en" ? record.urlEn : record.urlEs) : propertyPath(record,lang);
  const requested = project ? path + "?project=" + encodeURIComponent(project) : path;
  const matches = [...records, ...projects].filter(record => short ? shareToken(record) === short[1] : destination(record) === requested);
  if (matches.length !== 1) return null;
  const record = matches[0];
  return { source:sharePath(record,lang), landing:destination(record), title:(lang === "en" && record.titleEn) || record.titleEs || record.titleEn };
}

async function recordOpen(db, body, sessionId) {
  if (!tokenPattern.test(body.invitation || "")) return;
  const channel = ["whatsapp","facebook","instagram","copy"].includes(body.inviteChannel) ? body.inviteChannel : null;
  await db.query(`INSERT INTO share_invitation_opens(token,session_id,channel)
    SELECT token,$2,$3 FROM share_invitations WHERE token=$1 AND split_part(landing_path,'?',1)=$4
      AND (landing_path NOT LIKE '%?project=%' OR split_part(landing_path,'?project=',2)=$5)
    ON CONFLICT DO NOTHING`, [body.invitation, sessionId, channel, body.path, String(body.inviteProject || "").slice(0,180)]);
}

async function linkContact(db, body, leadId, secret) {
  const attribution = body.invitationVisit;
  if (attribution?.analyticsConsent !== true || !tokenPattern.test(attribution.token || "") || !attribution.visitorId || !attribution.sessionId) return;
  const key = hashTrackingId(attribution.visitorId + ":" + attribution.sessionId,secret);
  if (!key) return;
  await db.query(`INSERT INTO share_invitation_leads(lead_id,token,session_id)
    SELECT $1, token, session_id FROM share_invitation_opens WHERE token=$2 AND session_id=$3
    AND opened_at > now()-interval '24 hours' ON CONFLICT DO NOTHING`, [leadId,attribution.token,"visit-"+key.slice(0,32)]);
}

function register(app, deps) {
  const { query, requireRole, siteUrl } = deps;
  const create = fromPanel => async (req,res,next) => {
    try {
      const user = req.session?.user;
      if (!fromPanel && req.body?.analyticsConsent !== true && user?.role !== "admin") return res.sendStatus(204);
      const target = await resolveTarget(req.body?.path, deps, !fromPanel);
      if (!target) return res.status(400).json({ error: req.body?.lang === "en" ? "Choose a published page on this site." : "Elige una página publicada de este sitio." });
      const token = randomBytes(16).toString("hex");
      await query(`INSERT INTO share_invitations(token,source_path,landing_path,title,creator_id,creator_name,intended_for) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [token,target.source,target.landing,cleanText(target.title,240),user?.id || null,user?.name || null,fromPanel ? cleanText(req.body.recipient,120) || null : null]);
      res.status(201).set("Cache-Control","no-store").json({ path:"/i/"+token });
    } catch (error) { next(error); }
  };
  app.post("/api/invitations", create(false));
  app.post(adminRoute, requireRole("admin"), create(true));
  app.get("/i/:token", async (req,res,next) => {
    try {
      res.set({ "Cache-Control":"no-store", "X-Robots-Tag":"noindex, follow", "Referrer-Policy":"strict-origin-when-cross-origin" });
      const token = req.params.token;
      const invite = tokenPattern.test(token) && (await query("SELECT source_path,landing_path FROM share_invitations WHERE token=$1",[token])).rows[0];
      if (!invite) return res.sendStatus(404);
      const target = await resolveTarget(invite.source_path, deps);
      if (!target) return res.sendStatus(404);
      if (target.landing !== invite.landing_path) await query("UPDATE share_invitations SET landing_path=$2 WHERE token=$1",[token,target.landing]);
      const url = new URL(target.landing,siteUrl);
      url.searchParams.set("inv",token);
      if (["whatsapp","facebook","instagram","copy"].includes(req.query.via)) url.searchParams.set("via",req.query.via);
      return res.redirect(302, url.pathname + url.search);
    } catch (error) { next(error); }
  });
  app.get(adminRoute, requireRole("admin"), async (req,res,next) => {
    try {
      const offset = Math.min(1000000,Math.max(0,parseInt(req.query.offset,10) || 0));
      const showContact = internalRoleAllows({method:"GET",originalUrl:"/api/admin/contacts"},req.session.user);
      const rows = (await query(`WITH page AS (SELECT * FROM share_invitations ORDER BY created_at DESC,token LIMIT 21 OFFSET $1)
        SELECT p.token,p.title,p.landing_path,p.creator_name,CASE WHEN $2 OR p.creator_id=$3 THEN p.intended_for ELSE NULL END AS intended_for,p.created_at,
          metrics.opens, metrics.places, metrics.channels, contacts.count AS inquiries, contacts.details
        FROM page p
        CROSS JOIN LATERAL (SELECT count(*)::int AS opens,
          array_remove(array_agg(DISTINCT NULLIF(concat_ws(', ',v.city,v.country_name),'')),NULL) AS places,
          array_remove(array_agg(DISTINCT o.channel),NULL) AS channels
          FROM share_invitation_opens o JOIN visitor_sessions v ON v.id=o.session_id WHERE o.token=p.token) metrics
        CROSS JOIN LATERAL (SELECT count(*)::int AS count,
          CASE WHEN $2 THEN jsonb_agg(jsonb_build_object('name',l.name,'phone',l.phone,'email',l.email) ORDER BY l.created_at DESC) END AS details
          FROM share_invitation_leads i JOIN lead_requests l ON l.id=i.lead_id WHERE i.token=p.token) contacts
        ORDER BY p.created_at DESC,p.token`,[offset,showContact,req.session.user.id])).rows;
      res.set("Cache-Control","private, no-store").json({items:rows.slice(0,20),more:rows.length>20,offset,canCreate:internalRoleAllows({method:"POST",originalUrl:adminRoute},req.session.user)});
    } catch(error) { next(error); }
  });
}
module.exports = { register, migration, resolveTarget, recordOpen, linkContact };
