"use strict";
const directory = require("./portal-directory");
const KEY = "portal_directory";

async function readStored(client) {
  const result = await client.query("SELECT value FROM app_settings WHERE key = $1", [KEY]);
  return result.rows[0]?.value || null;
}
async function readRecords(client) {
  const result = await client.query(`SELECT p.id, p.title_es AS "titleEs", COALESCE(NULLIF(p.title_en,''),p.title_es) AS "titleEn",
    p.type,p.publication_section AS "publicationSection",p.state,p.city,p.zone,p.neighborhood,p.address,p.latitude,p.longitude,p.location_precision AS "locationPrecision",p.mls,p.featured,p.is_public AS "isPublic",p.status,
    p.catalog_data AS "catalogData",p.parent_development_id AS "developmentId", jsonb_build_object('id',d.id) AS "developmentData",
    CASE WHEN p.image IS NOT NULL OR jsonb_array_length(COALESCE(p.images,'[]'::jsonb))>0 THEN '/media/properties/' || p.id || '/0' ELSE '' END AS image
    FROM properties p LEFT JOIN developments d ON d.property_id=p.id ORDER BY p.featured DESC,p.updated_at DESC,p.id`);
  return result.rows;
}
function adminPayload(stored, records) {
  const config = directory.materialize(stored, records);
  return {config, records, effective:directory.adminAssignments(config, records)};
}
function registerPortalDirectory({app, pool, query, requireRole, getPublicProperties, publicSnapshot, invalidate}) {
  app.get("/api/portal-directory", async (_req,res,next) => {
    try {
      const properties = await getPublicProperties();
      const result = publicSnapshot() || directory.publicDirectory(await readStored({query}), properties);
      res.set("Cache-Control","no-cache").json({directory:result});
    } catch (error) { next(error); }
  });
  app.get("/api/admin/portal-directory", requireRole("admin"), async (_req,res,next) => {
    try {
      const [stored,records] = await Promise.all([readStored({query}),readRecords({query})]);
      res.json(adminPayload(stored,records));
    } catch (error) { next(error); }
  });
  app.put("/api/admin/portal-directory", requireRole("admin"), async (req,res,next) => {
    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      // Serializes first creation too, without locking any inventory or unrelated setting.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[KEY]);
      const stored = await readStored(client), revision = stored?.revision || 0;
      if (req.body?.revision !== revision) throw Object.assign(new Error("Otra persona actualizó el directorio. Recarga para revisar los cambios."),{status:409});
      const records = await readRecords(client);
      const value = {...directory.validate(req.body,records,directory.materialize(stored,records)),revision:revision+1};
      await client.query(`INSERT INTO app_settings (key,value,updated_by) VALUES ($1,$2::jsonb,$3)
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_by=EXCLUDED.updated_by,updated_at=NOW()`,[KEY,JSON.stringify(value),req.session.user.id]);
      await client.query("COMMIT");
      invalidate(); res.json(adminPayload(value,records));
    } catch (error) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      next(error);
    } finally { client?.release(); }
  });
}
module.exports = {readStored,registerPortalDirectory};
