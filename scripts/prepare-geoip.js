"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { createGunzip } = require("node:zlib");

// Install one DB-IP City Lite edition alongside dependencies. Queries never leave the server.
const dataPath = path.join(__dirname, "../node_modules/.cache/pcc-geoip/city.mmdb");
async function prepare() {
  if (process.env.GEOIP_CITY_DB_PATH) return;
  const installed = await fs.promises.stat(dataPath).catch(() => null);
  if (installed && installed.mtime.toISOString().slice(0,7) === new Date().toISOString().slice(0,7)) return;
  await fs.promises.mkdir(path.dirname(dataPath), { recursive: true });
  const temporary = dataPath + "." + process.pid;
  const month = new Date();
  month.setUTCDate(1);
  for (let attempt = 0; attempt < 2; attempt++) {
    const edition = month.toISOString().slice(0, 7);
    try {
      const url = "https://download.db-ip.com/free/dbip-city-lite-" + edition + ".mmdb.gz";
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error("HTTP " + response.status);
      await pipeline(Readable.fromWeb(response.body), createGunzip(), fs.createWriteStream(temporary));
      await fs.promises.rename(temporary, dataPath);
      console.info("[geoip] DB-IP City Lite " + edition);
      return;
    } catch (error) {
      await fs.promises.rm(temporary, { force: true });
      console.warn("[geoip] " + edition + ": " + error.message);
    }
    month.setUTCMonth(month.getUTCMonth() - 1);
  }
  console.warn("[geoip] " + (installed ? "Keeping the previous local edition." : "Using available hosting location headers until a database is installed."));
}
if (require.main === module) prepare().catch(error => { console.warn("[geoip] " + error.message); });
module.exports = { dataPath, prepare };
