// Render the actual game camera at multiple route positions, independent of play speed.
const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base);await page.waitForSelector('#menu.show');
 const audio=await page.evaluate(async()=>{
  const {CITY_MUSIC,scoreAt,playCityNote}=await import('./city-music.mjs');const results={};
  for(const id of Object.keys(CITY_MUSIC)){
   const ac=new OfflineAudioContext(1,44100*4,44100),p=CITY_MUSIC[id],sp=60/p.bpm/4;
   for(let i=0;i*sp<3;i++)for(const n of scoreAt(id,i))playCityNote(ac,ac.destination,n,.05+i*sp);
   const b=await ac.startRendering(),d=b.getChannelData(0);let energy=0,peak=0;for(const v of d){energy+=v*v;peak=Math.max(peak,Math.abs(v));}
   results[id]={rms:Math.sqrt(energy/d.length),peak};
  }return results;
 });
 for(const [id,a]of Object.entries(audio)){assert.ok(a.rms>.005,`${id} audible render`);assert.ok(a.peak<1,`${id} no clipping`);}
 console.log('PASS: seven scores render audible, finite PCM without clipping',JSON.stringify(audio));
 await page.evaluate(async()=>{
  // Pause the normal game renderer; keep its state untouched.
  const {World}=await import('./world.js');const old=World.prototype.update;World.prototype.update=function(...a){if(this===window.cityReviewWorld)old.apply(this,a);};
  const c=document.createElement('canvas');c.id='city-review';c.style='z-index:20';document.body.append(c);
  const w=new World(c);await w.load();w.resize(1280,800);window.cityReviewWorld=w;
 });
 fs.mkdirSync('docs/cities-review',{recursive:true});
 const shots=[['dalian',0,'dalian'],['dalian',43,'dalian-crystal'],['dalian',94,'dalian-square'],['tokyo',0,'tokyo'],['paris',0,'paris'],['rio',0,'rio'],['newyork',0,'newyork'],['manarola',0,'manarola'],['dresden',0,'dresden'],['dresden',57,'dresden-zwinger'],['dresden',130,'dresden-opera']];
 for(const [city,d,name]of shots){
  await page.evaluate(({city,d})=>{
   const w=window.cityReviewWorld;w.setAppearance(city,'classic');w.update(.016,{copDist:d,thiefDist:d+24,thiefX:1.3,mode:'play',timer:0,copAnim:{name:'run'},thiefAnim:{name:'run'},thiefLook:0,snap:true});
  },{city,d});
  await page.locator('#city-review').screenshot({path:`docs/cities-review/${name}-world.png`});
 }
 const lifetime=await page.evaluate(()=>{
  const w=window.cityReviewWorld;w.setAppearance('dalian','classic');w.updateChunks(0);
  const bridge=w.chunks.get(0);w.updateChunks(40);const bridgeAhead=w.scene.children.includes(bridge);
  w.updateChunks(800);const bridgeReleased=!w.scene.children.includes(bridge);
  w.setAppearance('newyork','classic');w.updateChunks(0);const tower=w.chunks.get(3);w.updateChunks(64);
  const towerAhead=w.scene.children.includes(tower);w.updateChunks(800);
  return {bridgeAhead,bridgeReleased,towerAhead,towerReleased:!w.scene.children.includes(tower),chunks:w.chunks.size};
 });
 const rioAhead=await page.evaluate(()=>{const w=window.cityReviewWorld;w.setAppearance('rio','classic');w.updateChunks(0);const mountain=w.chunks.get(3);w.updateChunks(64);return w.scene.children.includes(mountain);});
 assert.equal(rioAhead,true,'Rio mountain remains while its geometry is ahead');
 assert.equal(lifetime.bridgeAhead,true,'bridge remains while its geometry is ahead of the camera');
 assert.equal(lifetime.towerAhead,true,'tower remains while its geometry is ahead of the camera');
 assert.equal(lifetime.bridgeReleased,true);assert.equal(lifetime.towerReleased,true);assert.ok(lifetime.chunks<=40);
 assert.deepEqual(errors,[]);console.log('PASS: actual world camera rendered all seven cities and four additional landmark sections');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
