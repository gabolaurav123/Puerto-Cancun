const PDF_RETENTION_HOURS = 72;

function documentExpiresAt(createdAt) {
  const time = new Date(createdAt).getTime();
  return Number.isFinite(time) ? new Date(time + PDF_RETENTION_HOURS * 60 * 60 * 1000).toISOString() : null;
}

async function purgeExpiredDocuments(query) {
  // Bound each run; foreign keys remove only links belonging to expired generated sheets.
  const result = await query(`DELETE FROM generated_documents WHERE id IN (
    SELECT id FROM generated_documents WHERE created_at <= NOW() - INTERVAL '72 hours'
    ORDER BY created_at LIMIT 200
  ) RETURNING id`);
  return result.rowCount;
}

module.exports = { PDF_RETENTION_HOURS, documentExpiresAt, purgeExpiredDocuments };
