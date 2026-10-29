const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { qualityQuery } = require('../admin-quality-query');

const rows = [
  { id: 'dev-a', type: 'Desarrollo', publicationSection: 'developments', zone: 'Puerto Cancun', status: 'draft', isPublic: false },
  { id: 'dev-b', type: 'Desarrollo', publicationSection: 'developments', zone: 'Puerto Cancún', status: 'active', isPublic: true, image: '/assets/cover.jpg' },
  { id: 'dev-c', type: 'Desarrollo', publicationSection: 'developments', zone: 'Zona Hotelera', status: 'active', isPublic: true },
  { id: 'unit-a', type: 'Casa', publicationSection: 'properties', zone: 'Puerto Cancun', status: 'active', isPublic: true },
];
test('quality assistant returns exact IDs, including private drafts only in admin', () => {
  const result = qualityQuery('Muéstrame los desarrollos de Puerto Cancún sin portada', rows);
  assert.deepEqual(result.ids, ['dev-a']);
  assert.equal(result.entity, 'developments');
  assert.equal(result.filters.status, 'all');
});
test('quality assistant keeps entity and physical type separate', () => {
  assert.deepEqual(qualityQuery('Casas incompletas', rows).ids, ['unit-a']);
});
test('unknown scope never widens to the whole inventory', () => {
  assert.equal(qualityQuery('Desarrollos de Mérida sin portada', rows), null);
});
test('single record diagnostics use shared field rules without writes', () => {
  const before = structuredClone(rows);
  const result = qualityQuery('Qué le falta', rows, { entityId: 'dev-a' });
  assert.deepEqual(result.ids, ['dev-a']);
  assert.ok(result.quality.missingFields.some(row => row.field === 'images'));
  assert.deepEqual(rows, before);
});

const completeDevelopment = { id: 'dev-complete', type: 'Desarrollo', publicationSection: 'developments', zone: 'Puerto Cancun', titleEs: 'Desarrollo de prueba', descriptionEs: 'Descripcion documentada del desarrollo y sus caracteristicas. '.repeat(3), image: '/assets/cover.jpg', developmentData: { stage: 'En construccion' } };

test('quality queries accept masculine completeness without widening unknown scope', () => {
  const items = [...rows, completeDevelopment];
  const before = structuredClone(items);
  for (const question of ['Desarrollos incompletos', 'Desarrollo incompleto']) {
    const result = qualityQuery(question, items);
    assert.deepEqual(result.ids, ['dev-a', 'dev-b', 'dev-c']);
    assert.equal(result.filters.quality, 'incomplete');
  }
  for (const question of ['Desarrollos completos', 'Desarrollo completo']) {
    assert.deepEqual(qualityQuery(question, items).ids, ['dev-complete']);
    assert.equal(qualityQuery(question, items).filters.quality, 'ready');
  }
  assert.equal(qualityQuery('Desarrollos incompletos de Merida', items), null);
  assert.equal(qualityQuery('Desarrollos completos baratos', items), null);
  assert.deepEqual(items, before);
});

test('properties for review retain exact IDs and do not claim editorial completeness', () => {
  const items = [...rows, { ...rows[3], id: 'shared-a', mls: '1707' }, { ...rows[3], id: 'shared-b', mls: '1707' }];
  const result = qualityQuery('Propiedades por revisar', items);
  assert.deepEqual(result.ids, ['shared-a', 'shared-b']);
  assert.equal(result.filters.review, true);
  assert.match(result.explanation, /datos por revisar/);
  assert.doesNotMatch(result.explanation, /campos editoriales completos/);
});

test('Copilot dispatches masculine and review requests to the exact quality selection', async () => {
  const source = fs.readFileSync(require.resolve('../server.js'), 'utf8');
  const code = source.match(/async function getCopilotOperationalResult\([^]*?\n}/)[0];
  const items = [...rows, completeDevelopment, { ...rows[3], id: 'shared-a', mls: '1707' }, { ...rows[3], id: 'shared-b', mls: '1707' }];
  const calls = [];
  const handler = vm.runInNewContext(`${code}\ngetCopilotOperationalResult`, {
    qualityQuery, PROPERTY_SUMMARY_COLUMNS: 'id', toProperty: row => row, withPropertyMediaPlaceholders: row => row,
    query: async sql => { calls.push(sql); return { rows: items }; },
  });
  for (const [question, expected] of [['Desarrollos incompletos', ['dev-a', 'dev-b', 'dev-c']], ['Desarrollos completos', ['dev-complete']], ['Propiedades por revisar', ['shared-a', 'shared-b']]]) {
    const result = await handler(question);
    assert.equal(result.tool, 'queryInventoryQuality');
    assert.deepEqual(Array.from(result.selection.ids), expected);
  }
  assert.equal(calls.length, 3);
  assert.ok(calls.every(sql => /^SELECT\b/.test(sql)));
});
