const test = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { randomUUID } = require('node:crypto');
const { purgeExpiredDocuments } = require('../pdf-retention');
const base = process.env.PCC_TEST_BASE;
const connectionString = process.env.PCC_TEST_DATABASE_URL;

test('expired PDFs disappear from history, downloads and sharing; cleanup preserves live sheets and inventory', { skip: !base || !connectionString }, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(connectionString).hostname));
  const pool = new Pool({ connectionString, ssl: false });
  const suffix = randomUUID();
  const ids = [`qa-expired-${suffix}`, `qa-live-${suffix}`];
  let cookie = '', csrf = '';
  const request = async (route, method = 'GET', body) => {
    const response = await fetch(base + route, { method, headers: { Origin: base, Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json', 'X-Forwarded-For': '127.0.0.126' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (response.headers.getSetCookie().length) cookie = response.headers.getSetCookie()[0].split(';')[0];
    return response;
  };
  try {
    csrf = (await (await request('/api/session')).json()).csrfToken;
    const login = await request('/api/auth/login', 'POST', { username: 'qa-admin', password: 'qa-admin-password-only-local' });
    assert.equal(login.status, 200);
    csrf = (await login.json()).csrfToken;
    const property = (await pool.query('SELECT id FROM properties LIMIT 1')).rows[0].id;
    const before = (await pool.query('SELECT COUNT(*)::int AS count FROM properties')).rows[0].count;
    for (let i = 0; i < ids.length; i += 1) {
      await pool.query(`INSERT INTO generated_documents (id, document_type, title, property_id, file_name, content_base64, created_at) VALUES ($1, 'property', 'QA retention', $2, 'test.pdf', $3, NOW() - $4::interval)`, [ids[i], property, Buffer.from('%PDF-1.4\n%%EOF').toString('base64'), i === 0 ? '73 hours' : '1 hour']);
      await pool.query(`INSERT INTO document_share_links (code, document_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`, [ids[i], ids[i]]);
    }
    assert.equal((await request('/f/' + ids[0])).status, 410);
    assert.equal((await request('/f/' + ids[1])).status, 200);
    assert.equal((await request('/api/admin/documents/' + ids[0] + '/download')).status, 404);
    assert.equal((await request('/api/admin/documents/' + ids[0] + '/share', 'POST', {})).status, 404);
    const share = await request('/api/admin/documents/' + ids[1] + '/share', 'POST', {});
    assert.equal(share.status, 200);
    const shareData = await share.json();
    assert.ok(Date.parse(shareData.expiresAt) - Date.now() <= 71 * 3600000 + 1000);
    const documents = (await (await request('/api/admin/documents')).json()).documents;
    assert.ok(!documents.some(document => document.id === ids[0]));
    assert.ok(documents.some(document => document.id === ids[1] && document.expiresAt));
    await purgeExpiredDocuments((...args) => pool.query(...args));
    assert.equal((await pool.query('SELECT id FROM generated_documents WHERE id = $1', [ids[0]])).rowCount, 0);
    assert.equal((await pool.query('SELECT code FROM document_share_links WHERE document_id = $1', [ids[0]])).rowCount, 0);
    assert.equal((await pool.query('SELECT id FROM generated_documents WHERE id = $1', [ids[1]])).rowCount, 1);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM properties')).rows[0].count, before);
  } finally {
    await pool.query('DELETE FROM generated_documents WHERE id = ANY($1::text[])', [ids]);
    await pool.end();
  }
});
