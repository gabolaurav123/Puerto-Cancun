"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/public-inquiry-harness");

test("direct WhatsApp inquiries preserve selected details, email preference and origin in mobile and desktop ES/EN", {
  skip: process.env.PCC_LAYOUT_BROWSER !== "1",
}, async t => {
  const { chromium } = require(process.env.PCC_PLAYWRIGHT_MODULE || "playwright");
  const h = await createHarness({ browser:true });t.after(h.close);
  const browser=await chromium.launch({headless:true,executablePath:process.env.PCC_LAYOUT_CHROMIUM || undefined});t.after(()=>browser.close());
  for(const [lang,width] of [["es",360],["en",390],["es",768],["en",1440]]) {
    const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600});
    await context.addInitScript(()=>{window.openedWhatsApp=[];window.open=(url)=>{window.openedWhatsApp.push(url);return null;};});
    const page=await context.newPage();
    const origin=h.base+(lang==='en'?'/en/catalog':'/catalogo')+'?view=map';
    await page.goto(origin);await page.locator('#openInquiry').click();
    let dialog=page.locator('dialog.contextual-inquiry[open]');
    const field=name=>dialog.locator('[name="'+name+'"]');
    await field('contactChannel').waitFor();
    assert.equal(await field('phone').count(),0);assert.equal(await field('country').count(),0);
    assert.equal(await field('intent').inputValue(),'buy');assert.equal(await field('propertyType').count(),0);
    assert.doesNotMatch(await dialog.innerText(),/QA100|PCC-|prop-xlsx/);
    assert.equal(await field('email').isVisible(),false);
    await field('contactChannel').selectOption('email');assert.equal(await field('email').isVisible(),true);
    assert.equal(await field('email').evaluate(node=>node.required),true);
    await field('email').fill('buyer+'+lang+'@example.test');
    await dialog.locator('[data-inquiry-close]').click();assert.equal(page.url(),origin);
    assert.equal(await page.locator('#openInquiry').evaluate(node=>document.activeElement===node),true);
    await page.locator('#openInquiry').click();await field('contactChannel').waitFor();
    assert.equal(await field('email').inputValue(),'buyer+'+lang+'@example.test');
    await dialog.locator('details.inquiry-optional summary').last().click();
    await field('preferences').fill('Vista al mar y terraza');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    for(const href of await dialog.locator('[data-inquiry-office]').evaluateAll(nodes=>nodes.map(node=>node.href))) {
      const url=new URL(href);assert.equal(url.hostname,'wa.me');assert.match(url.searchParams.get('text'),/Vista al mar y terraza/);assert.match(url.searchParams.get('text'),/buyer\+/);
    }
    await dialog.locator('[type="submit"]').click();await dialog.locator('[data-inquiry-success]').waitFor({state:'visible'});
    const url=new URL(await page.evaluate(()=>window.openedWhatsApp.at(-1))),message=url.searchParams.get('text');
    assert.equal(url.hostname,'wa.me');assert.match(message,/Vista al mar y terraza/);assert.match(message,/buyer\+/);
    assert.match(message,lang==='en'?/Please contact me by email/:/Deseo que me contacten por correo electrónico/);
    assert.equal(page.url(),origin);assert.equal(h.records.size,0);assert.equal(h.contacts.length,0);
    assert.doesNotMatch(await dialog.locator('[data-inquiry-success]').innerText(),/recibida|received/);
    assert.equal(await dialog.locator('[data-inquiry-whatsapp]').getAttribute('href'),url.href);
    await dialog.locator('[data-inquiry-done]').click();assert.equal(page.url(),origin);

    const open=async values=>{
      await page.evaluate(values=>{void window.PccInquiry.open(values);},values);
      dialog=page.locator('dialog.contextual-inquiry[open]');await field('contactChannel').waitFor();
    };
    await open({developmentId:'fixture-presale',intent:'rent'});
    assert.equal(await field('intent').inputValue(),'buy');await field('topic').selectOption('photos');
    await field('contactChannel').selectOption('whatsapp');await dialog.locator('[type="submit"]').click();
    const presaleText=new URL(await page.evaluate(()=>window.openedWhatsApp.at(-1))).searchParams.get('text');
    assert.match(presaleText,lang==='en'?/More photos/:/Más fotografías/);assert.doesNotMatch(presaleText,/buyer\+/);
    await dialog.locator('[data-inquiry-done]').click();

    await open({service:'property-search',intent:'buy',searchFilters:{type:'Departamento',locations:['zona-hotelera'],beds:2,baths:2,max:19000000,currency:'MXN'}});
    assert.equal(await field('propertyType').inputValue(),'Departamento');assert.equal(await field('zone').inputValue(),'Zona Hotelera');
    await dialog.locator('details.inquiry-optional summary').last().click();await field('beds').selectOption('3');await field('baths').selectOption('2');
    await field('budget').fill('900000');await field('contactChannel').selectOption('whatsapp');
    await dialog.locator('[type="submit"]').click();
    const searchText=new URL(await page.evaluate(()=>window.openedWhatsApp.at(-1))).searchParams.get('text');
    assert.match(searchText,/900,000 USD/);assert.match(searchText,lang==='en'?/Bedrooms: 3/:/Recámaras: 3/);assert.match(searchText,/Zona Hotelera/);
    assert.doesNotMatch(searchText,/19,000,000/);await dialog.locator('[data-inquiry-done]').click();
    await open({intent:'buy',zone:'Zona Hotelera'});assert.equal(await field('propertyType').count(),0);assert.equal(await field('zone').count(),0);
    await dialog.locator('[data-inquiry-close]').click();assert.equal(page.url(),origin);
    await context.close();
  }
});
