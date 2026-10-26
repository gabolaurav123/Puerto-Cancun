const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');

function shareRuntime() {
  const options = [];
  let selected = '';
  const select = {
    set innerHTML(value) { options.length = 0; selected = ''; },
    append(option) { options.push(option); },
    get value() { return selected; },
    set value(value) { selected = options.some(option => option.value === value) ? value : ''; },
  };
  const fields = { propertyId: select, documentId: { value: '' }, neutral: { checked: false } };
  const propertyField = { hidden: false };
  const form = { reset() {}, querySelector: () => propertyField };
  const nodes = {
    '#pdfShareModal': { hidden: true }, '#pdfShareForm': form,
    '#pdfSharePropertySearch': { value: '', focus() {} }, '#pdfSharePropertyMatches': { hidden: true },
  };
  const state = {
    properties: [
      { id: 'property-1', titleEs: 'Casa', publicationSection: 'properties' },
      { id: 'development-1', titleEs: 'Torre', publicationSection: 'developments' },
      { id: 'development-2', titleEs: 'Otra torre', publicationSection: 'developments' },
    ], documents: [],
  };
  const requests = [];
  const names = ['selectPdfShareProperty', 'openPdfShareModal', 'preparePdfShareDocument'];
  const functions = names.map(name => app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`))[0]).join('\n');
  const api = vm.runInNewContext(`${functions}\n({${names.join(',')}})`, {
    state, $: id => nodes[id], formField: (form, name) => fields[name],
    Option: function(label, value) { this.label = label; this.value = value; },
    propertySearchLabel: property => property.titleEs,
    document: { body: { classList: { add() {} } } },
    resetPdfShareFallback() {}, setFormMessage() {}, refreshIcons() {}, renderPdfSharePropertyMatches() {}, renderDocuments() {},
    pdfOptionsFromForm: (form, brandMode) => ({ brandMode }),
    async api(url, request) { requests.push({ url, request }); return { document: { id: 'generated', propertyId: request.body.propertyId } }; },
  });
  return { ...api, fields, propertyField, nodes, state, requests, options };
}

for (const id of ['property-1', 'development-1']) {
  for (const neutral of [false, true]) {
    test(`inventory share preserves ${id} for ${neutral ? 'neutral' : 'branded'} PDFs`, async () => {
      const ui = shareRuntime();
      const before = JSON.stringify(ui.state.properties);
      ui.openPdfShareModal({ dataset: { openPdfShare: 'property', shareProperty: id } });
      assert.equal(ui.fields.propertyId.value, id);
      assert.equal(ui.propertyField.hidden, true);
      assert.equal(ui.nodes['#pdfShareModal'].hidden, false);
      assert.ok(!ui.options.some(option => option.value === 'development-2'));
      ui.fields.neutral.checked = neutral;
      await ui.preparePdfShareDocument();
      assert.equal(ui.requests[0].request.body.propertyId, id);
      assert.equal(ui.requests[0].request.body.options.brandMode, neutral ? 'neutral' : 'branded');
      assert.equal(JSON.stringify(ui.state.properties), before);
    });
  }
}

test('history preserves the selected development and reuses its matching PDF', async () => {
  const ui = shareRuntime();
  const existing = { id: 'history-1', propertyId: 'development-1', options: { brandMode: 'neutral' } };
  ui.state.documents.push(existing);
  ui.openPdfShareModal({ dataset: { openPdfShare: 'history', shareDocument: existing.id } });
  assert.equal(ui.fields.propertyId.value, existing.propertyId);
  assert.equal(ui.fields.neutral.checked, true);
  assert.equal(await ui.preparePdfShareDocument(), existing);
  assert.equal(ui.requests.length, 0);
});

test('the general PDF picker still limits its list to properties', () => {
  const ui = shareRuntime();
  ui.openPdfShareModal({ dataset: { openPdfShare: 'selected' } });
  assert.equal(ui.propertyField.hidden, false);
  assert.deepEqual(ui.options.map(option => option.value), ['property-1']);
});
