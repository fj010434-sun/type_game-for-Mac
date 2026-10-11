const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base+'/wardrobe-sample.html');await page.waitForSelector('[data-category=hat]');
 const released=await page.evaluate(async()=>{const {WardrobePreview}=await import('./wardrobe-preview.js');const {DEFAULT_OUTFIT}=await import('./wardrobe-catalog.mjs');const canvas=document.createElement('canvas');canvas.style='width:300px;height:300px';document.body.append(canvas);const preview=new WardrobePreview(canvas);await preview.load(DEFAULT_OUTFIT);const skeletons=[...new Set(preview.character.model.getObjectsByProperty('isSkinnedMesh',true).map(m=>m.skeleton))];const allocated=skeletons.some(s=>s.boneTexture!==null);preview.dispose();canvas.remove();return {allocated,released:skeletons.every(s=>s.boneTexture===null)};});
 assert.equal(released.allocated,true,'actual render allocates bone texture');assert.equal(released.released,true,'retired character releases bone textures');
 await page.goto(base);await page.waitForSelector('#menu.show');await page.evaluate(()=>localStorage.setItem('kc-progress-v1',JSON.stringify({xp:660,active:true,outfit:{}})));await page.reload();await page.waitForSelector('#menu.show');
 await page.evaluate(async()=>{const {World}=await import('./world.js');const update=World.prototype.update;World.prototype.update=function(...args){update.apply(this,args);window.__worldMemory={...this.renderer.info.memory};};});
 const sizes=[];
 for(let i=0;i<12;i++){await page.locator(`#scenes [data-id="${['city','forest','coast'][i%3]}"]`).click();await page.locator('#startBtn').click();await page.waitForFunction(()=>window.__kcState().state==='play');sizes.push((await page.evaluate(()=>window.__worldMemory)).textures);await page.keyboard.press('Escape');await page.keyboard.press('Escape');}
 assert.ok(Math.max(...sizes.slice(3))<=Math.max(...sizes.slice(0,3))+1,`bone textures do not grow: ${sizes}`);
 assert.deepEqual(errors,[]);console.log('PASS: owned skeleton disposal and texture counts stable across 12 custom game/scene replacements');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
