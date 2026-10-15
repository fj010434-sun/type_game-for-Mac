// Detects a shared asphalt road, missing roadside props, or props entering the chase lane.
const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base);await page.waitForSelector('#menu.show');
 await page.evaluate(async()=>{
  const {World}=await import('./world.js');const original=World.prototype.update;
  World.prototype.update=function(...args){window.streetWorld=this;if(!window.streetFrozen)original.apply(this,args);};
  window.streetUpdate=original;
 });
 await page.waitForFunction(()=>!!window.streetWorld);
 await page.evaluate(()=>window.streetFrozen=true);
 const cities=['dalian','tokyo','paris','rio','newyork','manarola','dresden'];const fingerprints=[];
 fs.mkdirSync('docs/streets-review',{recursive:true});
 for(const city of cities){
  const result=await page.evaluate(async city=>{
   const THREE=await import('three'),w=window.streetWorld;w.setAppearance(city,'classic');w.updateChunks(0);
   const tile=w.chunks.get(2),route=tile.getObjectByName('route-surface'),details=tile.getObjectByName('street-details');
   if(!route?.material?.map)return {surface:false};
   const canvas=route.material.map.image,ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let r=0,g=0,b=0,sum=0,squared=0,hash=2166136261;
   for(let j=0;j<pixels.length;j+=4){r+=pixels[j];g+=pixels[j+1];b+=pixels[j+2];const y=(pixels[j]+pixels[j+1]+pixels[j+2])/3;sum+=y;squared+=y*y;hash=Math.imul(hash^pixels[j],16777619);}
   const count=pixels.length/4,boxes=(details?.children||[]).map(o=>new THREE.Box3().setFromObject(o));
   const output={surface:true,r:r/count,g:g/count,b:b/count,variance:squared/count-(sum/count)**2,hash:hash>>>0,props:boxes.length,clear:boxes.every(b=>b.max.x< -4.25||b.min.x>4.25)};
   window.streetUpdate.call(w,.016,{copDist:0,thiefDist:24,thiefX:1.3,mode:'play',timer:0,copAnim:{name:'run'},thiefAnim:{name:'run'},thiefLook:0,snap:true});
   document.querySelectorAll('.overlay,#hud,#musicBtn').forEach(o=>o.style.display='none');
   return output;
  },city);
  assert.equal(result.surface,true,`${city}: actual route has a city texture`);
  assert.ok(result.props>=2,`${city}: both roadsides have decorative assets`);
  assert.equal(result.clear,true,`${city}: decorations leave the chase lane clear`);
  assert.ok(result.variance>12,`${city}: visible surface detail, not a flat colour`);
  if(city==='rio')assert.ok(result.g>result.r*1.15 && result.g>result.b*1.15,'Rio has a green grass route');
  if(city==='dresden')assert.ok(Math.abs(result.r-result.g)<35 && result.r>result.b,'Dresden has warm stone paving');
  fingerprints.push(result.hash);
  await page.screenshot({path:`docs/streets-review/${city}.png`});
 }
 assert.equal(new Set(fingerprints).size,7,'each city has a distinct road surface');
 await page.evaluate(()=>{const w=window.streetWorld;w.setAppearance('city','classic');w.updateChunks(0);});
 assert.deepEqual(errors,[]);console.log('PASS: seven distinct detailed surfaces, grass Rio, stone Dresden, roadside props and clear chase lanes');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
