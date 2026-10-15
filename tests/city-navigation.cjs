const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base);await page.waitForSelector('#menu.show');
 await page.locator('#scenes [data-id=dresden]').click();await page.reload();await page.waitForSelector('#menu.show');
 const visible=await page.locator('#scenes').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('[aria-pressed=true]').getBoundingClientRect();return b.left>=a.left&&b.right<=a.right;});
 assert.equal(visible,true,'saved city is visible in the horizontal selector');
 await page.locator('#musicBtn').click();assert.equal(await page.locator('#musicBtn').textContent(),'🔇');
 await page.locator('#scenes [data-id=tokyo]').click();assert.equal(await page.locator('#musicBtn').textContent(),'🔇');
 await page.reload();await page.waitForSelector('#menu.show');assert.equal(await page.locator('#musicBtn').textContent(),'🔇');
 await page.setViewportSize({width:960,height:620});await page.screenshot({path:'docs/cities-review/menu-minimum.png'});
 const card=page.locator('#scenes [data-id=dalian]');await card.focus();await page.keyboard.press('Space');
 assert.equal((await page.evaluate(()=>window.__kcState())).scene,'dalian');
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'dalian','keyboard selection retains focus');
 assert.deepEqual(errors,[]);console.log('PASS: saved city visible, mute persists across cities/reload, keyboard focus retained');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
