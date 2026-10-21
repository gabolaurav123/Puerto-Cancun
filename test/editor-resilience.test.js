const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');

function runtime(names, bindings = {}) {
  const source = names.map(name => {
    const match = app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n}`));
    assert.ok(match, name);
    return match[0];
  }).join('\n');
  return vm.runInNewContext(`${source}\n({${names.join(',')}})`, bindings);
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function imageRuntime(readImageFiles) {
  const messages = [];
  const functions = runtime(['cancelFormImageProcessing', 'processFormImages', 'formImagesReady'], {
    formImageJobs: new WeakMap(), readImageFiles,
    setFormMessage: (_, text) => messages.push(text),
  });
  return { ...functions, messages };
}

test('image processing captures input before the event expires and blocks premature saving', async () => {
  const pending = deferred();
  const api = imageRuntime(() => pending.promise);
  const form = { dataset: {} };
  const input = { form, files: ['photo'], disabled: false, value: 'photo.jpg' };
  let applied;
  const work = api.processFormImages(input, result => { applied = result; }, assert.fail);
  assert.equal(input.disabled, true);
  assert.equal(api.formImagesReady(form), false);
  pending.resolve({ images: ['compressed'] });
  await work;
  assert.deepEqual(applied, { images: ['compressed'] });
  assert.equal(input.disabled, false);
  assert.equal(input.value, '');
  assert.equal(api.formImagesReady(form), true);
});

test('resetting a form cancels both late upload success and late errors', async () => {
  for (const fails of [false, true]) {
    const pending = deferred();
    const api = imageRuntime(() => pending.promise);
    const form = { dataset: {} };
    const input = { form, files: ['photo'], disabled: false };
    const work = api.processFormImages(input, () => assert.fail('stale image'), () => assert.fail('stale error'));
    api.cancelFormImageProcessing(form);
    if (fails) pending.reject(new Error('bad photo'));
    else pending.resolve({ images: ['old record'] });
    await work;
    assert.equal(input.disabled, false);
    assert.equal(form.dataset.processingImages, 'false');
  }
});

test('an old upload cannot unlock a newer upload; invalid images preserve the previous gallery', async () => {
  const first = deferred(), second = deferred();
  let count = 0;
  const api = imageRuntime(() => (++count === 1 ? first : second).promise);
  const form = { dataset: { currentImages: '["previous"]' } };
  const input = { form, files: ['photo'], disabled: false };
  const a = api.processFormImages(input, assert.fail, assert.fail);
  const errors = [];
  const b = api.processFormImages(input, assert.fail, e => errors.push(e.message));
  first.resolve({ images: ['stale'] });
  await a;
  assert.equal(input.disabled, true);
  second.reject(new Error('invalid image'));
  await b;
  assert.equal(input.disabled, false);
  assert.equal(form.dataset.currentImages, '["previous"]');
  assert.deepEqual(errors, ['invalid image']);
});

test('IndexedDB failures are reported without rejecting or discarding the draft', async () => {
  for (const database of [null, { transaction() { throw new Error('quota'); } }]) {
    const api = runtime(['writePersistentDraft', 'readPersistentDraft'], { openDraftDatabase: async () => database });
    assert.equal(await api.writePersistentDraft('draft', { title: 'retained' }), false);
    assert.equal(await api.readPersistentDraft('draft'), null);
  }
});

test('seller draft recovery does not resurrect photos deliberately removed from the gallery', async () => {
  const form = { dataset: { currentImages: '[]' } };
  const local = { fields: { title: 'Seller request' }, images: [], imageCount: 0, mediaDirty: true, galleryRevision: 'cleared', idempotencyKey: 'same', savedAt: '2026-10-21T11:00:00Z' };
  const rich = { ...local, images: ['old.jpg'], imageCount: 1, galleryRevision: 'before-clear', savedAt: '2026-10-21T10:00:00Z' };
  const api = runtime(['restoreSellerDraft'], {
    $: () => form, currentSellerDraftKey: () => 'same-key', sellerDraftSnapshot: () => ({ fields: {} }),
    localStorage: { getItem: () => JSON.stringify(local) }, readPersistentDraft: async () => rich,
    formField: () => ({}), updateSellerImagePreview() {}, updateMapPickerForForm() {}, setFormMessage() {},
  });
  await api.restoreSellerDraft();
  assert.equal(form.dataset.currentImages, '[]');
  assert.equal(form.dataset.missingDraftMedia, 'false');
  assert.equal(form.dataset.galleryRevision, 'cleared');
});

function draftRuntime({ local, rich, cloud, property } = {}) {
  const fields = { title: { value: '' }, status: { value: '' }, isPublic: { checked: false } };
  const form = { dataset: { draftGeneration: 'one' } };
  const statuses = [];
  const api = runtime(['restoreListingDraft'], {
    $: () => form, listingDraftStorageKey: () => 'key', listingDraftSlot: () => 'slot',
    localStorage: { getItem: () => JSON.stringify(local || null) }, readPersistentDraft: async () => rich,
    state: { listingDrafts: cloud ? [{ ...cloud, key: 'slot' }] : [], properties: property ? [property] : [] },
    setLocationFormValues() {}, formField: (_, name) => fields[name], LOCATION_FIELD_ORDER: [],
    setListingFormRecordId() {}, setSelectedDevelopmentPropertyIds() {},
    storedImages: p => p.images, normalizedImageMetadata: (meta, count) => Array.from({ length: count }, (_, i) => meta?.[i] || { descriptionEs: '', descriptionEn: '' }),
    updateListingImagePreview() {}, configureListingFormMode() {}, renderListingKeywordChips() {},
    updateListingDescriptionCounter() {}, updateMapPickerForForm() {}, listingDraftStatus: text => statuses.push(text),
  });
  return { ...api, form, fields, statuses };
}

const published = { id: 'existing', images: ['published.jpg'], imageMetadata: [{ descriptionEs: 'Original', descriptionEn: 'Original' }] };
const baseDraft = { fields: { id: 'existing', title: 'Working copy' }, idempotencyKey: 'same', galleryRevision: 'gallery-one', savedAt: '2026-10-21T10:00:00Z' };

test('the most recent captions are not overwritten by an older IndexedDB snapshot', async () => {
  const local = { ...baseDraft, images: [], imageCount: 1, mediaDirty: true, imageMetadata: [{ descriptionEs: 'Latest caption' }] };
  const rich = { ...local, images: ['new.jpg'], imageMetadata: [{ descriptionEs: 'Old caption' }], savedAt: '2026-10-21T09:00:00Z' };
  const api = draftRuntime({ local, rich, property: published });
  await api.restoreListingDraft('slot');
  assert.equal(JSON.parse(api.form.dataset.imageMetadata)[0].descriptionEs, 'Latest caption');
  assert.equal(api.form.dataset.currentImages, '["new.jpg"]');
  assert.equal(api.form.dataset.missingDraftMedia, 'false');
});

test('a cloud text draft retains published photo captions', async () => {
  const api = draftRuntime({ cloud: baseDraft, property: published });
  await api.restoreListingDraft('slot');
  assert.deepEqual(JSON.parse(api.form.dataset.imageMetadata), published.imageMetadata);
  assert.equal(api.form.dataset.currentImages, '["published.jpg"]');
});

test('missing or stale draft media never becomes a request to delete published photos', async () => {
  for (const rich of [null, { ...baseDraft, images: ['stale.jpg'], galleryRevision: 'wrong', savedAt: '2026-10-21T09:00:00Z' }]) {
    const local = { ...baseDraft, mediaDirty: true, images: [], imageCount: 1 };
    const api = draftRuntime({ local, rich, property: published });
    await api.restoreListingDraft('slot');
    assert.equal(api.form.dataset.currentImages, '["published.jpg"]');
    assert.equal(api.form.dataset.removeImage, 'false');
    assert.equal(api.form.dataset.missingDraftMedia, 'true');
    assert.equal(imageRuntime().formImagesReady(api.form), false);
    assert.match(api.statuses.at(-1), /bloqueado/);
  }
});

test('an explicit empty gallery can be restored without IndexedDB', async () => {
  const api = draftRuntime({ local: { ...baseDraft, mediaDirty: true, images: [], imageCount: 0 }, property: published });
  await api.restoreListingDraft('slot');
  assert.equal(api.form.dataset.currentImages, '[]');
  assert.equal(api.form.dataset.removeImage, 'true');
  assert.equal(api.form.dataset.missingDraftMedia, 'false');
});

test('autosave retains captions of missing media instead of replacing them with published captions', async () => {
  const metadata = [{ descriptionEs: 'Caption for missing new photo' }];
  const api = draftRuntime({ local: { ...baseDraft, images: [], imageCount: 1, mediaDirty: true, imageMetadata: metadata }, property: published });
  await api.restoreListingDraft('slot');
  api.form.elements = [{ name: 'title', value: 'Edited text', type: 'text' }];
  const snapshots = runtime(['listingDraftSnapshot'], {
    listingFormRecordId: () => 'existing', listingFormIsDevelopment: () => false, selectedDevelopmentPropertyIds: () => [],
    safeParseImages: JSON.parse, safeParseImageMetadata: JSON.parse,
  });
  const snapshot = snapshots.listingDraftSnapshot(api.form);
  assert.equal(snapshot.missingDraftMedia, true);
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot.imageMetadata)), metadata);
  assert.equal(snapshot.imageCount, 1);
  assert.equal(snapshot.images.length, 0);
});

test('gallery-only save advances the form version, preserves text drafts and unlocks after failure', async () => {
  for (const fails of [false, true]) {
    const pending = deferred();
    const form = { dataset: { currentImages: '["photo.jpg"]', imageMetadata: '[]', contentDirty: 'true', expectedUpdatedAt: 'form-version' }, setAttribute() {}, removeAttribute() {} };
    let body, drafts = 0;
    const state = { properties: [{ id: 'record', updatedAt: 'older-list-version' }] };
    const api = runtime(['saveListingImagesOnly'], {
      $: selector => selector === '#listingForm' ? form : {}, listingFormRecordId: () => 'record', formImagesReady: () => true,
      safeParseImages: JSON.parse, normalizedImageMetadata: () => [], state,
      api: async (_, request) => { body = request.body; return pending.promise; },
      setButtonLoading() {}, setFormMessage() {}, storedImages: p => p.images,
      updateListingImagePreview() {}, saveListingDraft: () => { drafts++; }, clearListingDraft: () => assert.fail('text draft lost'),
      renderAdminListings() {}, renderProperties() {}, showToast() {}, crypto: { randomUUID: () => 'new-gallery' },
    });
    const work = api.saveListingImagesOnly();
    assert.equal(body.expectedUpdatedAt, 'form-version');
    assert.equal(form.inert, true);
    assert.equal(form.dataset.saving, 'true');
    if (fails) pending.reject(new Error('conflict'));
    else pending.resolve({ property: { id: 'record', images: ['saved.jpg'], updatedAt: 'saved-version' } });
    await work;
    assert.equal(form.inert, false);
    assert.equal(form.dataset.saving, 'false');
    assert.equal(form.dataset.expectedUpdatedAt, fails ? 'form-version' : 'saved-version');
    assert.equal(drafts, fails ? 0 : 1);
  }
});

test('translation preserves Spanish edits made while the provider was responding', async () => {
  const pending = deferred();
  const fields = { title: { value: 'Original title' }, description: { value: 'Original text' }, titleEn: { value: '' }, descriptionEn: { value: '' } };
  const form = { dataset: { draftGeneration: 'same' } };
  const messages = [];
  const api = runtime(['translateListingToEnglish'], {
    $: () => form, formField: (_, name) => fields[name], listingDraftSlot: () => 'same', listingFormRecordId: () => 'id',
    api: () => pending.promise, setButtonLoading() {}, setFormMessage: (_, text) => messages.push(text), saveListingDraft: () => assert.fail('stale translation saved'),
  });
  const work = api.translateListingToEnglish();
  fields.description.value = 'New Spanish text';
  pending.resolve({ titleEn: 'Old title', descriptionEn: 'Old translation' });
  await work;
  assert.equal(fields.descriptionEn.value, '');
  assert.equal(fields.description.value, 'New Spanish text');
  assert.match(messages.at(-1), /conservaron tus cambios/);
});
