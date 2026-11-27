"use strict";
const { randomBytes, createHmac, timingSafeEqual } = require("node:crypto");
const { hashTrackingId, cleanText } = require("./visitor-analytics");
const { publicPages, propertyPath } = require("./seo-pages");
const { sharePath, shareToken } = require("./public-sharing");
const { projectRecords } = require("./catalog-directory");
const { isPublic } = require("./inventory-contract");
const { internalRoleAllows } = require("./auth-utils");

const tokenPattern = /^[a-f0-9]{32}$/;
const shortPattern = /^\/(?:en\/)?s\/([A-Za-z0-9_-]{12})$/;
const channels = ["whatsapp", "facebook", "instagram", "copy"];
const publicSharesRoute = "/api/admin/visitor-leads/public-shares";
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

const publicSharesMigration = {
  id: "0011-public-listing-shares",
  description: "Separar las acciones del botón público Compartir y sus aperturas",
  up: db => db.query(`
    ALTER TABLE share_invitations
      ADD COLUMN origin text,
      ADD COLUMN public_channel text,
      ADD COLUMN shared_at timestamptz,
      ADD COLUMN sender_visitor_id text,
      ADD COLUMN sender_session_id text;
    CREATE INDEX public_shares_recency ON share_invitations(shared_at DESC, token)
      WHERE origin = 'public' AND shared_at IS NOT NULL;
    CREATE INDEX unused_share_links ON share_invitations(created_at)
      WHERE origin = 'public' AND shared_at IS NULL;`)
};

function shareProof(token, secret) {
  return createHmac("sha256", secret).update("public-share-action:" + token).digest("base64url");
}

function validShareProof(token, proof, secret) {
  return typeof token === "string" && tokenPattern.test(token) && typeof proof === "string" && proof.length === 43 && /^[A-Za-z0-9_-]{43}$/.test(proof)
    && timingSafeEqual(Buffer.from(proof), Buffer.from(shareProof(token, secret)));
}

function pageOffset(value) {
  return Math.min(1000000, Math.max(0, parseInt(value, 10) || 0));
}

function maySeeContacts(req) {
  return internalRoleAllows({method:"GET", originalUrl:"/api/admin/contacts"}, req.session.user);
}

function parseSiteUrl(raw, siteUrl) {
  if (typeof raw !== "string" || raw.length > 1800 || /[\\\x00-\x1f]/.test(raw) || !/^(?:https?:\/\/|\/(?!\/))/.test(raw)) return null;
  try {
    const base = new URL(siteUrl);
    const url = new URL(raw, base);
    const officialHosts = ["puertocancun.center","www.puertocancun.center"];
    const sameSite = url.origin === base.origin || (url.protocol === "https:" && !url.port && officialHosts.includes(base.hostname) && officialHosts.includes(url.hostname));
    return sameSite && !url.username && !url.password ? url : null;
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
  return { source:sharePath(record,lang), landing:destination(record), title:(lang === "en" && record.titleEn) || record.titleEs || record.titleEn, mls:record.mls };
}

async function recordOpen(db, body, sessionId) {
  if (!tokenPattern.test(body.invitation || "")) return;
  const channel = channels.includes(body.inviteChannel) ? body.inviteChannel : null;
  await db.query(`INSERT INTO share_invitation_opens(token,session_id,channel)
    SELECT i.token,$2,COALESCE(i.public_channel,$3) FROM share_invitations i JOIN visitor_sessions v ON v.id=$2
    WHERE i.token=$1 AND v.visitor_id IS DISTINCT FROM i.sender_visitor_id
      AND (i.origin IS DISTINCT FROM 'public' OR i.creator_id IS NULL OR v.user_id IS DISTINCT FROM i.creator_id)
      AND split_part(landing_path,'?',1)=$4
      AND (landing_path NOT LIKE '%?project=%' OR split_part(landing_path,'?project=',2)=$5)
    ON CONFLICT DO NOTHING`, [body.invitation, sessionId, channel, body.path, String(body.inviteProject || "").slice(0,180)]);
}

async function linkContact(db, body, leadId, secret) {
  const attribution = body.invitationVisit;
  if (attribution?.analyticsConsent !== true || !tokenPattern.test(attribution.token || "") || !attribution.visitorId || !attribution.sessionId) return;
  const key = hashTrackingId(attribution.visitorId + ":" + attribution.sessionId,secret);
  if (!key) return;
  const source = parseSiteUrl(body.sourcePath, "https://www.puertocancun.center");
  await db.query(`INSERT INTO share_invitation_leads(lead_id,token,session_id)
    SELECT $1,o.token,o.session_id FROM share_invitation_opens o JOIN share_invitations i ON i.token=o.token
    WHERE o.token=$2 AND o.session_id=$3 AND o.opened_at > now()-interval '24 hours'
      AND (i.origin IS DISTINCT FROM 'public' OR (split_part(i.landing_path,'?',1)=$4
        AND (i.landing_path NOT LIKE '%?project=%' OR split_part(i.landing_path,'?project=',2)=$5)))
    ON CONFLICT DO NOTHING`, [leadId,attribution.token,"visit-"+key.slice(0,32),source?.pathname || null,source?.searchParams.get("project") || null]);
}

async function expireAttribution(db, days) {
  await db.query("DELETE FROM share_invitation_opens WHERE opened_at < NOW() - make_interval(days => $1)",[days]);
  // Unused public tokens always fall back to the stable listing short link.
  await db.query("DELETE FROM share_invitations WHERE origin='public' AND shared_at IS NULL AND created_at < now() - interval '7 days'");
  // Keep public links usable after personal attribution reaches its retention limit.
  await db.query(`UPDATE share_invitations SET creator_id=NULL, creator_name=NULL, intended_for=NULL, sender_visitor_id=NULL, sender_session_id=NULL
    WHERE COALESCE(shared_at,created_at) < NOW() - make_interval(days => $1)
    AND (creator_id IS NOT NULL OR creator_name IS NOT NULL OR intended_for IS NOT NULL OR sender_visitor_id IS NOT NULL OR sender_session_id IS NOT NULL)`,[days]);
}

// All four options work immediately with the user's gesture, including mobile clipboard access.
// Each channel gets a different public URL. The private proof stays in the sharing tab.
async function publicShareLanding(query, source, target, token) {
  if (typeof token !== "string" || !tokenPattern.test(token)) return target;
  try {
    const invite = (await query("SELECT landing_path FROM share_invitations WHERE token=$1 AND source_path=$2 AND origin='public'", [token, source])).rows[0];
    if (!invite) return target;
    if (invite.landing_path !== target) await query("UPDATE share_invitations SET landing_path=$2 WHERE token=$1", [token, target]);
    const url = new URL(target, "https://listing.invalid");
    url.searchParams.set("inv", token);
    return url.pathname + url.search;
  } catch {
    return target; // A measurement failure must not prevent visiting a published listing.
  }
}

function registerPublicShares(app, deps) {
  const { query, requireRole, sessionSecret } = deps;
  app.post("/api/invitations/prepare", async (req, res, next) => {
    try {
      if (req.body?.analyticsConsent !== true) return res.sendStatus(204);
      const target = await resolveTarget(req.body.path, deps, true);
      if (!target) return res.sendStatus(404);
      const tokens = channels.map(() => randomBytes(16).toString("hex"));
      const title = require("./whatsapp-message").titleWithMls(target.title, target.mls);
      await query(`INSERT INTO share_invitations(token, public_channel, source_path, landing_path, title, origin)
        SELECT t.token,t.channel,$3,$4,$5,'public' FROM unnest($1::text[], $2::text[]) AS t(token,channel)`,
        [tokens, channels, target.source, target.landing, cleanText(title, 280)]);
      const links = Object.fromEntries(channels.map((channel, index) => {
        const token = tokens[index];
        return [channel, { path:target.source + "?inv=" + token, token, proof:shareProof(token, sessionSecret) }];
      }));
      res.status(201).set("Cache-Control", "no-store").json({links});
    } catch (error) { next(error); }
  });

  app.post("/api/invitations/activate", async (req, res, next) => {
    try {
      const { token, proof, channel, analyticsConsent, visitorId, sessionId, senderName } = req.body || {};
      if (analyticsConsent !== true) return res.sendStatus(204);
      if (!validShareProof(token, proof, sessionSecret) || !channels.includes(channel)) return res.sendStatus(400);
      const visitor = hashTrackingId(visitorId, sessionSecret);
      const session = visitor && sessionId && hashTrackingId(visitorId + ":" + sessionId, sessionSecret);
      const user = req.session?.user;
      await query(`UPDATE share_invitations SET shared_at=now(), creator_id=$3, creator_name=$4,
          sender_visitor_id=$5, sender_session_id=$6
        WHERE token=$1 AND public_channel=$2 AND origin='public' AND shared_at IS NULL`,
        [token,channel,user?.id || null,cleanText(user?.name || senderName,110) || null,
          visitor ? "visitor-" + visitor.slice(0,32) : null, session ? "visit-" + session.slice(0,32) : null]);
      res.sendStatus(204);
    } catch (error) { next(error); }
  });

  // A sender checking their own link is not part of the audience. Never infer identity from an IP.
  const differentVisitor = `v.visitor_id IS DISTINCT FROM p.sender_visitor_id
    AND (p.creator_id IS NULL OR v.user_id IS DISTINCT FROM p.creator_id)`;
  const audienceKey = "COALESCE('account:' || v.user_id, v.visitor_id)";
  app.get(publicSharesRoute, requireRole("admin"), async (req, res, next) => {
    try {
      const offset = pageOffset(req.query.offset);
      const rows = (await query(`WITH page AS (
        SELECT * FROM share_invitations WHERE origin='public' AND shared_at IS NOT NULL
        ORDER BY shared_at DESC, token LIMIT 21 OFFSET $1)
        SELECT p.token,p.title,p.source_path,p.public_channel,p.shared_at,
          CASE WHEN $2 OR p.creator_id=$3 THEN p.creator_name END AS sender_name,
          p.creator_id IS NOT NULL AS sender_registered,
          p.creator_name IS NOT NULL AS sender_named,
          CASE WHEN p.sender_visitor_id IS NOT NULL THEN left(md5(p.sender_visitor_id),8) END AS sender_alias,
          NULLIF(concat_ws(', ',NULLIF(s.city,''),NULLIF(s.country_name,'')),'') AS sender_place,
          audience.visitors,audience.inquiries
        FROM page p LEFT JOIN visitor_sessions s ON s.id=p.sender_session_id
        CROSS JOIN LATERAL (
          SELECT count(DISTINCT ${audienceKey})::int AS visitors, count(DISTINCT l.lead_id)::int AS inquiries
          FROM share_invitation_opens o JOIN visitor_sessions v ON v.id=o.session_id
          LEFT JOIN share_invitation_leads l ON l.token=o.token AND l.session_id=o.session_id
          WHERE o.token=p.token AND ${differentVisitor}) audience
        ORDER BY p.shared_at DESC,p.token`, [offset,maySeeContacts(req),req.session.user.id])).rows;
      res.set("Cache-Control","private, no-store").json({items:rows.slice(0,20),more:rows.length>20,offset});
    } catch (error) { next(error); }
  });

  app.get(publicSharesRoute + "/:token/visitors", requireRole("admin"), async (req, res, next) => {
    try {
      const {token} = req.params;
      if (!tokenPattern.test(token)) return res.sendStatus(404);
      const offset = pageOffset(req.query.offset);
      const rows = (await query(`WITH audience AS (
          SELECT ${audienceKey} AS person,v.id AS session_id,v.user_id,v.city,v.country_name,o.opened_at
          FROM share_invitations p JOIN share_invitation_opens o ON o.token=p.token
          JOIN visitor_sessions v ON v.id=o.session_id
          WHERE p.token=$1 AND p.origin='public' AND p.shared_at IS NOT NULL AND ${differentVisitor}
        ), people AS (
          SELECT person,min(opened_at) AS first_open,max(opened_at) AS last_open,count(*)::int AS sessions,
            array_remove(array_agg(DISTINCT NULLIF(concat_ws(', ',NULLIF(city,''),NULLIF(country_name,'')),'')),NULL) AS places,
            max(user_id) AS user_id
          FROM audience GROUP BY person ORDER BY last_open DESC,person LIMIT 21 OFFSET $2)
        SELECT left(md5($1 || person),8) AS alias, first_open,last_open,sessions,places,
          u.user_id IS NOT NULL AS registered,
          CASE WHEN $3 THEN NULLIF(trim(concat_ws(' ',a.first_name,a.last_name)),'') END AS account_name,
          leads.inquiries, leads.contacts
        FROM people u LEFT JOIN seller_accounts a ON a.id=u.user_id
        CROSS JOIN LATERAL (
          SELECT count(*)::int AS inquiries, CASE WHEN $3 THEN jsonb_agg(jsonb_build_object(
            'name',l.name,'phone',l.phone,'email',l.email) ORDER BY l.created_at DESC) END AS contacts
          FROM audience v JOIN share_invitation_leads i ON i.session_id=v.session_id AND i.token=$1
          JOIN lead_requests l ON l.id=i.lead_id WHERE v.person=u.person
        ) leads ORDER BY last_open DESC,person`, [token,offset,maySeeContacts(req)])).rows;
      res.set("Cache-Control","private, no-store").json({items:rows.slice(0,20),more:rows.length>20,offset});
    } catch (error) { next(error); }
  });
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
      await query(`INSERT INTO share_invitations(token,source_path,landing_path,title,creator_id,creator_name,intended_for,origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [token,target.source,target.landing,cleanText(target.title,240),user?.id || null,user?.name || null,fromPanel ? cleanText(req.body.recipient,120) || null : null, fromPanel ? "panel" : null]);
      res.status(201).set("Cache-Control","no-store").json({ path:"/i/"+token });
    } catch (error) { next(error); }
  };
  registerPublicShares(app, deps);
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
      if (channels.includes(req.query.via)) url.searchParams.set("via",req.query.via);
      return res.redirect(302, url.pathname + url.search);
    } catch (error) { next(error); }
  });
  app.get(adminRoute, requireRole("admin"), async (req,res,next) => {
    try {
      const offset = pageOffset(req.query.offset);
      const showContact = maySeeContacts(req);
      const rows = (await query(`WITH page AS (SELECT * FROM share_invitations WHERE origin IS DISTINCT FROM 'public' ORDER BY created_at DESC,token LIMIT 21 OFFSET $1)
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
module.exports = { register, migration, publicSharesMigration, resolveTarget, recordOpen, linkContact, expireAttribution, publicShareLanding };
