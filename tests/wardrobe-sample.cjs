const {setup}=require('./browser-helper.cjs'); const assert=require('node:assert/strict');
(async()=>{ const {browser,page,errors,base}=await setup();try{
 await page.goto(base+'/wardrobe-sample.html');
 await page.waitForSelector('[data-category="hat"]',{timeout:6000});
 assert.equal(await page.locator('[data-category]').count(),10);
 await page.getByRole('button',{name:'圆润脸',exact:true}).click();
 await page.getByRole('button',{name:'侧分短发',exact:true}).click();
 await page.getByRole('button',{name:'跑步',exact:true}).click();
 await page.waitForTimeout(500);
 const s=await page.evaluate(()=>window.__wardrobeSample());
 assert.equal(s.outfit.face,'face-round');assert.equal(s.outfit.hair,'hair-parted');assert.equal(s.animation,'sprint');
 assert.equal(s.headCount,1);assert.equal(s.finite,true);assert.equal(s.partCount,10);
 assert.deepEqual(errors,[]); console.log('PASS: modular sample, ten categories, face/hair replacement, running animation');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
