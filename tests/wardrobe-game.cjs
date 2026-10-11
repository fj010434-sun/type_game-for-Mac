const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base);await page.waitForSelector('#menu.show');
 await page.evaluate(()=>localStorage.setItem('kc-progress-v1',JSON.stringify({xp:50})));await page.reload();await page.waitForSelector('#menu.show');
 const capture=async()=>{await page.locator('#startBtn').click();await page.waitForFunction(()=>window.__kcState().state==='play');
  for(let i=0;i<60;i++){const s=await page.evaluate(()=>window.__kcState());if(s.state!=='play')break;await page.keyboard.press(s.line[s.idx]===' '?'Space':s.line[s.idx]);await page.waitForTimeout(30);}
  await page.waitForSelector('#result.show');};
 await capture();assert.equal((await page.evaluate(()=>window.__kcState())).xp,85);
 assert.match(await page.locator('#xpSummary').textContent(),/白色机动头盔/);
 await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>window.__kcState())).xp,85);
 await page.locator('#wardrobeBtn').click();await page.getByRole('button',{name:/白色机动头盔/}).click();assert.equal(await page.locator('#wardrobeSave').isDisabled(),false);await page.locator('#wardrobeSave').click();
 await capture();assert.equal((await page.evaluate(()=>window.__kcState())).xp,120);
 await page.keyboard.press('Escape');await page.locator('#startBtn').click();await page.waitForFunction(()=>window.__kcState().state==='play');
 for(let i=0;i<35;i++){await page.keyboard.press('z');await page.waitForTimeout(25);}
 await page.waitForSelector('#result.show');assert.match(await page.locator('#rTitle').textContent(),/跑掉/);assert.equal((await page.evaluate(()=>window.__kcState())).xp,120);
 const stored=await page.evaluate(()=>localStorage.getItem('kc-progress-v1'));
 await page.goto(base+'/?demo=4&ff=20&miss=0&hold=1');await page.waitForSelector('#result.show');assert.equal(await page.evaluate(()=>localStorage.getItem('kc-progress-v1')),stored);
 assert.deepEqual(errors,[]);console.log('PASS: real capture XP, unlock and equip, second round reward, failed round zero reward, demo does not persist XP');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
