const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base);await page.waitForSelector('#menu.show');await page.locator('#wardrobeBtn').click();
 await page.locator('#wardrobeSave').focus();await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.getElementById('wardrobe').contains(document.activeElement)),true,'Tab stays within wardrobe');
 await page.keyboard.press('Escape');
 await page.evaluate(async()=>{const {WardrobePreview}=await import('./wardrobe-preview.js');const render=WardrobePreview.prototype.render;WardrobePreview.prototype.render=function(dt){render.call(this,dt);window.__previewMemory={...this.renderer.info.memory};};});
 await page.locator('#wardrobeBtn').click();const memoryBefore=await page.evaluate(()=>window.__previewMemory);await page.keyboard.press('Escape');
 for(let i=0;i<20;i++){await page.locator('#wardrobeBtn').click();await page.keyboard.press('Escape');}
 assert.equal(await page.locator('canvas').count(),3,'no additional canvases on reopening');
 assert.deepEqual(await page.evaluate(()=>window.__previewMemory),memoryBefore,'GPU geometry/texture counts do not grow on reopening');
 await page.evaluate(()=>localStorage.setItem('kc-progress-v1',JSON.stringify({version:1,xp:660,active:true,outfit:{}})));
 await page.reload();await page.waitForSelector('#menu.show');await page.locator('#wardrobeBtn').click();
 const variants={hat:'hat-helmet',hair:'hair-parted',face:'face-round',eyes:'eyes-calm',brows:'brows-straight',nose:'nose-round',mouth:'mouth-happy',shirt:'shirt-jacket',pants:'pants-patrol',shoes:'shoes-boots'};
 for(const [category,id]of Object.entries(variants)){await page.locator(`[data-category="${category}"]`).click();await page.locator(`[data-item="${id}"]`).click();}
 await page.screenshot({path:'docs/wardrobe-review/wardrobe-complete.png'});await page.locator('#wardrobeSave').click();
 for(const scene of ['city','forest','coast']){await page.locator(`#scenes [data-id="${scene}"]`).click();await page.locator('#startBtn').click();await page.waitForFunction(()=>window.__kcState().state==='play');
 const s=await page.evaluate(()=>window.__kcState());assert.equal(s.officer,'custom');assert.equal(s.scene,scene);assert.equal(s.copVisible,true);assert.deepEqual(s.outfit,variants);
 await page.screenshot({path:`docs/wardrobe-review/custom-${scene}.png`});await page.keyboard.press('Escape');await page.keyboard.press('Escape');}
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')};});
 await page.locator('#wardrobeBtn').click();await page.locator('#wardrobeSave').click();assert.match(await page.locator('#progressError').textContent(),/未保存/);
 await page.goto(base+'/wardrobe-sample.html');await page.waitForSelector('[data-category="hat"]');
 for(const hat of ['hat-none','hat-cap','hat-helmet'])for(const hair of ['hair-short','hair-parted'])for(const face of ['face-standard','face-round']){
 for(const id of [hat,hair,face])await page.locator(`[data-item="${id}"]`).click();const s=await page.evaluate(()=>window.__wardrobeSample());assert.equal(s.headCount,1);assert.equal(s.finite,true);}
 for(const shirt of ['shirt-duty','shirt-jacket'])for(const pants of ['pants-duty','pants-patrol'])for(const shoes of ['shoes-duty','shoes-boots']){
 for(const id of [shirt,pants,shoes])await page.locator(`[data-item="${id}"]`).click();await page.getByRole('button',{name:'跑步',exact:true}).click();await page.waitForTimeout(80);assert.equal((await page.evaluate(()=>window.__wardrobeSample())).finite,true);}
 assert.deepEqual(errors,[]);console.log('PASS: focus containment, 20 reopenings, all ten equipped parts, 3 custom scenes, storage error, 12 head and 8 uniform combinations');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
