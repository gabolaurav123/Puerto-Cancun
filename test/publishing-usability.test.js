const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { photoAnalysisRequest, photoResearchSources, analyzePhotos } = require('../photo-analysis');
const { documentExpiresAt, purgeExpiredDocuments } = require('../pdf-retention');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const server = fs.readFileSync(require.resolve('../server.js'), 'utf8');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

function runtime(names, bindings) {
  return vm.runInNewContext(names.map(name => app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0]).join('\n') + `\n({${names.join(',')}})`, bindings);
}

test('all vision modes cap calls at ten images; public research is opt-in and only for development descriptions', async () => {
  const images = Array.from({ length: 51 }, (_, index) => ({ index, imageUrl: `image-${index}` }));
  for (const mode of ['captions', 'keywords', 'description']) {
    const body = photoAnalysisRequest({ titleEs: 'Test', analysisMode: mode }, images, 'gpt-5-mini');
    assert.equal(body.input[0].content.filter(item => item.type === 'input_image').length, 10);
    assert.equal(body.tools, undefined);
    const research = photoAnalysisRequest({ publicationSection: 'developments', research: true, analysisMode: mode }, images, 'gpt-5-mini');
    assert.equal(Boolean(research.tools), mode === 'description');
  }
  const data = await analyzePhotos({ stored: images.map(item => item.imageUrl), property: {}, apiKey: '' });
  assert.equal(data.sourceTotalCount, 51);
  assert.equal(data.totalCount, 10);
  assert.deepEqual(data.items.map(item => item.index), Array.from({ length: 10 }, (_, i) => i));
});

test('research sources exclude unsafe URLs and deduplicate citations', () => {
  const sources = photoResearchSources({ output: [
    { type: 'web_search_call', action: { sources: [{ url: 'https://example.com/project', title: 'Official' }, { url: 'javascript:alert(1)' }, { url: 'https://user:secret@example.com/' }] } },
    { type: 'message', content: [{ annotations: [{ url: 'https://example.com/project', title: 'Project' }] }] },
  ] });
  assert.deepEqual(sources, [{ url: 'https://example.com/project', title: 'Project' }]);
});

function batchRuntime({ failOffset, cancelOffset, staleOffset } = {}) {
  const context = { imagesKey: JSON.stringify(Array.from({ length: 51 }, (_, i) => 'photo-' + i)) };
  const state = {};
  const calls = [];
  const nodes = new Map();
  let matches = true;
  const bindings = { state, listingCaptionJob: null, $: selector => {
    if (!nodes.has(selector)) nodes.set(selector, { value: undefined });
    return nodes.get(selector);
  }, listingPhotoContext: () => context, listingPhotoContextMatches: () => matches,
  currentListingPhotoAnalysis: () => state.imageAnalysis, safeParseImages: JSON.parse,
  saveListingDraft() {}, setButtonLoading() {}, setFormMessage(node, message) { node.textContent = message; },
  renderListingImageAnalysis(data) { bindings.rendered = data; },
  requestListingPhotoAnalysis: async (_mode, offset) => {
    calls.push(offset);
    if (offset === failOffset) { failOffset = undefined; throw new Error('Provider quota'); }
    if (offset === cancelOffset) bindings.listingCaptionJob.cancelled = true;
    if (offset === staleOffset) { matches = false; return null; }
    return { provider: 'openai', items: Array.from({ length: Math.min(10, 51 - offset) }, (_, i) => ({ index: i, visualAnalyzed: true, suggestedAlt: 'Foto ' + (i + offset), duplicateOf: i === 1 ? 0 : null })) };
  } };
  return { ...runtime(['analyzeListingImages'], bindings), state, calls, nodes, bindings };
}

test('51 captions are generated in six sequential batches with original indices', async () => {
  const api = batchRuntime();
  await api.analyzeListingImages();
  assert.deepEqual(api.calls, [0, 10, 20, 30, 40, 50]);
  assert.equal(api.state.imageAnalysis.items.length, 51);
  assert.equal(api.state.imageAnalysis.items[50].index, 50);
  assert.equal(api.state.imageAnalysis.items[11].duplicateOf, 10);
  assert.equal(api.bindings.listingCaptionJob, null);
});

test('caption failures preserve completed proposals and retry only unfinished batches', async () => {
  const api = batchRuntime({ failOffset: 20 });
  await api.analyzeListingImages();
  assert.equal(api.state.imageAnalysis.items.length, 20);
  assert.match(api.nodes.get('#listingImageAnalysisMessage').textContent, /Provider quota/);
  await api.analyzeListingImages();
  assert.deepEqual(api.calls, [0, 10, 20, 20, 30, 40, 50]);
  assert.equal(api.state.imageAnalysis.items.length, 51);
});

test('caption cancellation stops after the active batch; switched records reject late output', async () => {
  const cancelled = batchRuntime({ cancelOffset: 0 });
  await cancelled.analyzeListingImages();
  assert.deepEqual(cancelled.calls, [0]);
  assert.equal(cancelled.state.imageAnalysis.items.length, 10);
  const stale = batchRuntime({ staleOffset: 0 });
  await stale.analyzeListingImages();
  assert.equal(stale.state.imageAnalysis, undefined);
});

test('generated PDF retention is 72 hours, bounded and never touches listings or private uploads', async () => {
  assert.equal(documentExpiresAt('2026-10-22T14:37:00Z'), '2026-10-25T14:37:00.000Z');
  assert.equal(documentExpiresAt('invalid'), null);
  let sql;
  assert.equal(await purgeExpiredDocuments(async query => { sql = query; return { rowCount: 3 }; }), 3);
  assert.match(sql, /created_at <= NOW\(\) - INTERVAL '72 hours'/);
  assert.match(sql, /LIMIT 200/);
  assert.doesNotMatch(sql, /DELETE FROM (properties|media_files|users)/);
  for (const route of ['/api/admin/documents/:id/download', '/api/admin/documents/:id/share', '/f/:code', '/fichas/:id']) {
    const start = server.indexOf(`"${route}"`);
    assert.ok(start > 0);
    assert.match(server.slice(start, server.indexOf('\napp.', start + 1)), /created_at > NOW\(\) - INTERVAL '72 hours'/);
  }
});

test('editor exposes separate actions, publication confirmation and private progress saving', () => {
  for (const id of ['generateListingKeywords', 'translateListingDescription', 'saveListingProgress', 'listingPublishDialog', 'listingPublishPrivate', 'operationStack']) assert.match(html, new RegExp(`id="${id}"`));
  assert.doesNotMatch(html, /data-admin-section="prompts"/);
  assert.match(app, /await confirmListingPublication\(form\)/);
  assert.match(app, /state\.photoKeywordAnalysis/);
});

test('location catalogs populate aliased seller search fields as well as cascading editor fields', () => {
  const editor = {};
  const search = {};
  const country = { name: 'country', form: editor };
  const zone = { name: 'zone', form: editor };
  const searchZone = { name: 'location', form: search, dataset: { locationSelect: 'zone' } };
  const standalone = { name: 'zone', form: null };
  const filled = [];
  const api = runtime(['refreshLocationSelects'], {
    $$: () => [country, zone, searchZone, standalone],
    LOCATION_FIELD_ORDER: ['country', 'zone'],
    formField: (form, name) => [country, zone, searchZone].find(field => field.form === form && field.name === name),
    fillLocationSelect: field => filled.push(field),
  });
  api.refreshLocationSelects();
  assert.deepEqual(filled, [country, zone, searchZone, standalone]);
});
