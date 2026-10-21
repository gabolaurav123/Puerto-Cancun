const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');
const { chromium } = require(require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_MODULES || process.cwd()] }));
const base = process.env.PCC_TEST_BASE;
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use a disposable local QA server.');
const output = path.resolve(process.env.PCC_QA_OUTPUT || 'tmp/editor-resilience-qa');
fs.mkdirSync(output, { recursive: true });

function client(context) {
  let csrf = '';
  return async (route, method = 'GET', data, expected = 200) => {
    const response = await context.request.fetch(base + route, { method, data, headers: { Origin: base, 'X-CSRF-Token': csrf } });
    const result = await response.json();
    assert.equal(response.status(), expected, `${method} ${route}: ${result.error || result.message || response.status()}`);
    if (result.csrfToken) csrf = result.csrfToken;
    return result;
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PCC_CHROME_PATH });
  let page, admin, sellerId;
  const createdIds = [];
  try {
    const suffix = Date.now();
    const errors = [];
    const buffer = await sharp({ create: { width: 480, height: 320, channels: 3, background: '#d9e8e5' } }).jpeg().toBuffer();
    const photo = { name: 'qa.jpg', mimeType: 'image/jpeg', buffer };
    const invalid = { name: 'bad.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') };
    const sellerContext = await browser.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { 'X-Forwarded-For': '127.0.0.128' } });
    const seller = client(sellerContext);
    const email = `upload-${suffix}@example.test`;
    await seller('/api/session');
    await seller('/api/auth/register', 'POST', { firstName: 'QA', lastName: 'Fotos', email, phone: '+529981234567', password: '123456', confirmPassword: '123456', consent: true }, 201);
    sellerId = (await seller('/api/auth/login', 'POST', { username: email, password: '123456' })).user.id;
    page = await sellerContext.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/panel');
    await page.waitForSelector('#sellerPanel:not([hidden])');
    const consent = page.getByRole('button', { name: 'Solo esenciales', exact: true });
    if (await consent.isVisible()) await consent.click();
    await page.locator('#sellerRequestForm [name=imageFile]').setInputFiles(photo);
    await page.waitForFunction(() => JSON.parse(document.querySelector('#sellerRequestForm').dataset.currentImages || '[]').length === 1);
    const sellerImages = await page.locator('#sellerRequestForm').getAttribute('data-current-images');
    await page.locator('#sellerRequestForm [name=imageFile]').setInputFiles(invalid);
    await page.waitForFunction(() => document.querySelector('#sellerRequestForm').dataset.processingImages === 'false');
    assert.equal(await page.locator('#sellerRequestForm').getAttribute('data-current-images'), sellerImages);
    await page.locator('#sellerRequestForm [name=title]').fill(`QA solicitud ${suffix}`);
    await page.locator('#sellerRequestForm [name=price]').fill('1000000');
    await page.locator('#sellerRequestForm [name=address]').fill('Direccion de prueba local');
    await page.locator('#sellerRequestForm [name=description]').fill('Descripcion de prueba con fotografia, sin datos reales.');
    await page.evaluate(() => setLocationFormValues(document.querySelector('#sellerRequestForm'), { state: 'Quintana Roo', city: 'Cancun', zone: 'Puerto Cancun' }));
    await page.locator('#sellerRequestForm [name=consent]').check();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, 'seller-upload-mobile.png') });
    const submitted = page.waitForResponse(r => r.url().endsWith('/api/seller/requests') && r.request().method() === 'POST');
    await page.locator('#sellerRequestForm [type=submit]').click();
    const requestResponse = await submitted;
    const request = (await requestResponse.json()).request;
    assert.equal(requestResponse.status(), 201);
    assert.ok(request.id);
    assert.equal((await seller('/api/seller/requests')).requests.some(item => item.id === request.id), true);
    console.log('PASS: real seller mobile upload, invalid-file preservation and request submission.');

    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: { 'X-Forwarded-For': '127.0.0.129' } });
    admin = client(adminContext);
    await admin('/api/session');
    await admin('/api/auth/login', 'POST', { username: 'qa-admin', password: 'qa-admin-password-only-local' });
    assert.ok((await admin('/api/admin/requests')).requests.some(item => item.id === request.id));
    const approved = (await admin(`/api/admin/requests/${request.id}/approve`, 'POST', {})).property;
    createdIds.push(approved.id);
    assert.equal(approved.status, 'active');
    assert.equal(approved.isPublic, true);
    const secondApproval = (await admin(`/api/admin/requests/${request.id}/approve`, 'POST', {})).property;
    assert.equal(secondApproval.id, approved.id, 'Approving twice must not duplicate the property');
    const notifications = (await seller('/api/seller/notifications')).notifications;
    assert.ok(notifications.some(item => item.related_entity_id === request.id || item.relatedEntityId === request.id));
    await seller('/api/admin/properties', 'GET', undefined, 401);
    await seller('/api/admin/ai/analyze-images', 'POST', { images: [] }, 401);
    console.log('PASS: request reaches administration, approval creates one listing, seller receives notification, admin routes deny seller access.');

    const development = (await admin('/api/admin/properties', 'POST', {
      title: `QA Galeria ${suffix}`, publicationSection: 'developments', type: 'Desarrollo',
      state: 'Quintana Roo', city: 'Cancun', zone: 'Puerto Cancun', status: 'draft', isPublic: false,
      images: ['data:image/jpeg;base64,' + buffer.toString('base64')],
      imageMetadata: [{ descriptionEs: 'Antes', descriptionEn: 'Before' }],
    }, 201)).property;
    createdIds.push(development.id);
    page = await adminContext.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/panel');
    await page.waitForFunction(id => typeof state !== 'undefined' && state.properties.some(p => p.id === id), development.id);
    const adminConsent = page.getByRole('button', { name: 'Solo esenciales', exact: true });
    if (await adminConsent.isVisible()) await adminConsent.click();
    await page.evaluate(id => editListing(id), development.id);
    await page.locator('#listingForm [name=title]').fill(`QA titulo pendiente ${suffix}`);
    await page.locator('#listingImagePreview [data-image-description=es]').fill('Descripcion actualizada');
    const galleryResponse = page.waitForResponse(r => r.url().endsWith('/images') && r.request().method() === 'PATCH');
    await page.locator('#saveListingImages').click();
    const gallery = await galleryResponse;
    assert.equal(gallery.status(), 200);
    const saved = (await gallery.json()).property;
    await page.waitForFunction(version => document.querySelector('#listingForm').dataset.expectedUpdatedAt === version, saved.updatedAt);
    assert.equal(await page.locator('#listingForm [name=title]').inputValue(), `QA titulo pendiente ${suffix}`);
    const analysisResponse = page.waitForResponse('**/api/admin/ai/analyze-images');
    await page.locator('#analyzeListingImages').click();
    const analysis = await analysisResponse;
    assert.equal(analysis.status(), 200, 'A gallery save must not make the following analysis stale');
    assert.equal((await analysis.json()).provider, 'technical', 'No paid provider is configured in QA');
    await admin(`/api/admin/properties/${development.id}/images`, 'PATCH', {
      images: saved.images, expectedUpdatedAt: development.updatedAt,
    }, 409);
    const completeResponse = page.waitForResponse(r => r.url().endsWith(`/api/admin/properties/${development.id}`) && r.request().method() === 'PUT');
    await page.locator('#listingForm [type=submit]').click();
    assert.equal((await completeResponse).status(), 200);
    console.log('PASS: real gallery save followed by analysis and full save; true concurrent edits remain blocked.');

    await page.evaluate(() => { setAdminSection('new-external-property'); resetExternalPropertyForm(); });
    await page.locator('#externalPropertyForm [name=imageFile]').setInputFiles(photo);
    await page.waitForFunction(() => JSON.parse(document.querySelector('#externalPropertyForm').dataset.currentImages || '[]').length === 1);
    const externalImages = await page.locator('#externalPropertyForm').getAttribute('data-current-images');
    await page.locator('#externalPropertyForm [name=imageFile]').setInputFiles(invalid);
    await page.waitForFunction(() => document.querySelector('#externalPropertyForm').dataset.processingImages === 'false');
    assert.equal(await page.locator('#externalPropertyForm').getAttribute('data-current-images'), externalImages);
    console.log('PASS: external gallery upload and invalid-file preservation.');

    await page.evaluate(() => {
      setAdminSection('new-property'); resetListingForm(false);
      window.qaReadImages = readImageFiles;
      readImageFiles = async files => {
        const result = await window.qaReadImages(files);
        await new Promise(resolve => { window.qaReleaseUpload = resolve; });
        return result;
      };
    });
    await page.locator('#listingForm [name=imageFile]').setInputFiles(photo);
    await page.waitForFunction(() => typeof window.qaReleaseUpload === 'function');
    await page.evaluate(() => { setAdminSection('new-development'); window.qaReleaseUpload(); readImageFiles = window.qaReadImages; });
    await page.waitForFunction(() => document.querySelector('#listingForm').dataset.processingImages === 'false');
    assert.equal(await page.locator('#listingForm').getAttribute('data-current-images'), '[]');
    console.log('PASS: switching records during image processing does not attach photos to another property.');

    const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const guest = await guestContext.newPage();
    guest.on('pageerror', e => errors.push(e.message));
    await guest.goto(base);
    await guest.evaluate(() => openGuestSale());
    await guest.locator('#guestSaleForm [name=imageFile]').setInputFiles(photo);
    await guest.waitForFunction(() => JSON.parse(document.querySelector('#guestSaleForm').dataset.images || '[]').length === 1);
    const guestImages = await guest.locator('#guestSaleForm').getAttribute('data-images');
    await guest.locator('#guestSaleForm [name=imageFile]').setInputFiles(invalid);
    await guest.waitForFunction(() => document.querySelector('#guestSaleForm').dataset.processingImages === 'false');
    assert.equal(await guest.locator('#guestSaleForm').getAttribute('data-images'), guestImages);
    assert.equal(await guest.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS: guest mobile gallery, no horizontal overflow, no browser exceptions across tested flows.');
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(output, 'editor-resilience-failure.png') }).catch(() => {});
    throw error;
  } finally {
    if (admin) {
      for (const id of createdIds) await admin(`/api/admin/properties/${id}`, 'DELETE').catch(() => {});
      if (sellerId) await admin(`/api/admin/users/${sellerId}`, 'PATCH', { status: 'inactive' }).catch(() => {});
    }
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
