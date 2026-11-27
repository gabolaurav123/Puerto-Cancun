"use strict";
const fs = require("node:fs");
const { isIP } = require("node:net");
const ipaddr = require("ipaddr.js");
const { Reader } = require("mmdb-lib");
const { dataPath } = require("./scripts/prepare-geoip");

let database;
function publicIp(value) {
  if (!isIP(value || "")) return false;
  const address = ipaddr.process(value);
  return address.range() === "unicast" && !(address.kind() === "ipv6" && address.match(ipaddr.parse("2001:db8::"), 32));
}

function lookupIp(ip) {
  if (!publicIp(ip)) return null;
  if (database === undefined || database === null && fs.existsSync(process.env.GEOIP_CITY_DB_PATH || dataPath)) {
    try { database = new Reader(fs.readFileSync(process.env.GEOIP_CITY_DB_PATH || dataPath)); }
    catch (error) { database = null; console.warn("[geoip] " + error.message); }
  }
  const entry = database?.get(ip);
  if (!entry?.country?.iso_code) return null;
  const countryCode = entry.country.iso_code;
  return { countryCode, countryName: new Intl.DisplayNames(["es"], { type: "region" }).of(countryCode),
    region: entry.subdivisions?.[0]?.names?.es || entry.subdivisions?.[0]?.names?.en || "",
    city: entry.city?.names?.es || entry.city?.names?.en || "" };
}

async function enrichStoredLocations(query) {
  // Paginate by immutable ID so an unlocatable address is visited only once per run.
  for (const table of ["visitor_profiles", "visitor_sessions"]) {
    let cursor = "";
    for (;;) {
      const { rows } = await query(`SELECT id, ip_address, country_code FROM ${table}
        WHERE id > $1 AND ip_address IS NOT NULL AND (NULLIF(country_code,'') IS NULL OR NULLIF(city,'') IS NULL)
        ORDER BY id LIMIT 250`, [cursor]);
      if (!rows.length) break;
      const updates = [];
      for (const row of rows) {
        const geo = lookupIp(row.ip_address);
        if (geo && (!row.country_code || row.country_code === geo.countryCode)) updates.push({ ...row, ...geo });
      }
      if (updates.length) await query(`UPDATE ${table} AS v SET
        country_code=COALESCE(NULLIF(v.country_code,''), u."countryCode"), country_name=COALESCE(NULLIF(v.country_name,''), u."countryName"),
        region=COALESCE(NULLIF(v.region,''), NULLIF(u.region,'')), city=COALESCE(NULLIF(v.city,''), NULLIF(u.city,''))
        FROM jsonb_to_recordset($1::jsonb) AS u(id text, ip_address text, "countryCode" text, "countryName" text, region text, city text)
        WHERE v.id=u.id AND v.ip_address=u.ip_address AND (NULLIF(v.country_code,'') IS NULL OR v.country_code=u."countryCode")`, [JSON.stringify(updates)]);
      cursor = rows.at(-1).id;
    }
  }
}
module.exports = { lookupIp, publicIp, enrichStoredLocations };
