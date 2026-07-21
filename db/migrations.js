async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function hasMigration(client, id) {
  const result = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [id]);
  return Boolean(result.rows[0]);
}

async function recordMigration(client, id, description) {
  await client.query(
    `INSERT INTO schema_migrations (id, description)
     VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [id, description]
  );
}

async function runMigration(client, migration) {
  if (!migration?.id || typeof migration.up !== "function") throw new Error("Invalid migration");
  await ensureMigrationTable(client);
  if (await hasMigration(client, migration.id)) return false;
  await migration.up(client);
  await recordMigration(client, migration.id, migration.description || migration.id);
  return true;
}

module.exports = { ensureMigrationTable, hasMigration, recordMigration, runMigration };
