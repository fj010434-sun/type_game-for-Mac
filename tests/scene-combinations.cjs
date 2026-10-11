const {chromium} = require(process.env.PLAYWRIGHT_PATH || '/Users/sunyifeng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765');await page.waitForSelector('#menu.show');
 for (const [scene,name] of [['city','城市街道'],['coast','海滨大道'],['forest','林间小镇']]) {
  for(const [officer,label] of [['classic','经典警察'],['patrol','巡逻警察'],['motor','机动警察']]) {
   await page.getByRole('button',{name,exact:false}).click();
   await page.getByRole('button',{name:label,exact:false}).click();
   await page.locator('#startBtn').click();await page.waitForTimeout(3300);
   const state=await page.evaluate(()=>window.__kcState());
   assert.equal(state.scene,scene);assert.equal(state.officer,officer);assert.equal(state.state,'play');assert.equal(state.copVisible,true);
   await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  }
 }
 assert.deepEqual(errors,[]); await browser.close();
 console.log('PASS: all 9 scene/officer combinations start, show the officer, and return to menu without page errors');
})().catch(e=>{console.error(e);process.exit(1)});
