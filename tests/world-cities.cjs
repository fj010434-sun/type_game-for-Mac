// Catches missing city selection, lost settings and music that does not follow scenery.
const {chromium}=require(process.env.PLAYWRIGHT_PATH || '/Users/sunyifeng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message);});
 page.on('console',m=>{if(m.type()==='error'||/context lost/i.test(m.text()))console.error('BROWSER:',m.text());});
 const menuReady=async()=>{try{await page.waitForSelector('#menu.show');}catch(e){console.error('LOAD DIAGNOSTIC',await page.evaluate(()=>({text:document.getElementById('loadText')?.textContent,progress:document.getElementById('loadBar')?.style.width,state:window.__kcState?.(),visibility:document.visibilityState})));throw e;}};
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8765');await menuReady();
 const cities=['dalian','tokyo','paris','rio','newyork','manarola','dresden'];
 fs.mkdirSync('docs/cities-review',{recursive:true});
 for(const city of cities){
  console.log('Checking city:',city);
  const card=page.locator(`#scenes button[data-id="${city}"]`);
  assert.equal(await card.count(),1,`${city} can be selected`);
  await card.click();
  assert.equal((await page.evaluate(()=>window.__kcState())).scene,city);
  await page.reload();await menuReady();
  assert.equal((await page.evaluate(()=>window.__kcState())).scene,city,'choice survives reload');
  for(const officer of ['classic','patrol','motor']) {
  await page.locator(`#officers button[data-id="${officer}"]`).click();
  await page.locator('#startBtn').click();await page.waitForFunction(()=>window.__kcState().state==='play');
  const state=await page.evaluate(()=>window.__kcState());
  assert.equal(state.state,'play');assert.equal(state.copVisible,true);assert.equal(state.musicTheme,city);assert.equal(state.officer,officer);
  assert.equal(state.audio,'running');
  if(officer==='classic')await page.screenshot({path:`docs/cities-review/${city}.png`});
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  }
 }
 await page.setViewportSize({width:960,height:620});
 await page.locator('#scenes button[data-id="dalian"]').click();
 assert.equal(await page.locator('#startBtn').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('PASS: seven cities select, persist, all 21 officer combinations start with matching music; minimum window and no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
