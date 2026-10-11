const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base+'/wardrobe-compare.html');await page.waitForFunction(()=>window.__uniformCompare);
 for(const name of ['行走','跑步','抓捕','站立']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(240);assert.equal((await page.evaluate(()=>window.__uniformCompare())).finite,true);}
 await page.getByRole('button',{name:'侧面',exact:true}).click();
 for(let i=0;i<2;i++){await page.getByRole('button',{name:'灰色材质',exact:true}).click();assert.equal(await page.getByRole('button',{name:'侧面',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.getByRole('button',{name:'灰色材质',exact:true}).getAttribute('aria-pressed'),String(i===0));}
 const result=await page.evaluate(async()=>{
  const THREE=await import('three');const {WardrobePreview}=await import('./wardrobe-preview.js');const {DEFAULT_OUTFIT}=await import('./wardrobe-catalog.mjs');
  const canvas=document.createElement('canvas');canvas.style.cssText='width:128px;height:128px';document.body.append(canvas);const p=new WardrobePreview(canvas);await p.load(DEFAULT_OUTFIT);
  p.renderer.setPixelRatio(1);p.resize();p.angle=.30;p.setClay(true);
  const render=outfit=>{p.setOutfit(outfit);p.character.mixer.stopAllAction();p.character.actions.static.reset().play();p.character.mixer.setTime(0);p.render(0);const a=new Uint8Array(128*128*4);p.renderer.getContext().readPixels(0,0,128,128,p.renderer.getContext().RGBA,p.renderer.getContext().UNSIGNED_BYTE,a);return a;};
  const a=render(DEFAULT_OUTFIT),b=render({...DEFAULT_OUTFIT,shirt:'shirt-jacket',pants:'pants-patrol',shoes:'shoes-boots'});let difference=0;
  for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>35)difference++;
  let samples=0;
  for(const shirt of ['shirt-duty','shirt-jacket'])for(const pants of ['pants-duty','pants-patrol'])for(const shoes of ['shoes-duty','shoes-boots']){
   p.setOutfit({...DEFAULT_OUTFIT,shirt,pants,shoes});
   for(const clip of ['idle','walk','sprint','interact-right']){
    p.character.mixer.stopAllAction();const action=p.character.actions[clip].reset().play();
    for(let frame=0;frame<=24;frame++){
     p.character.mixer.setTime(frame/24*action.getClip().duration);p.character.model.updateMatrixWorld(true);
     for(const mesh of p.character.clothes.filter(m=>m.isSkinnedMesh)){
      if(mesh.skeleton!==p.character.body.skeleton)throw new Error('服装未使用原骨骼');
      for(const i of new Set(mesh.geometry.index.array)){const v=mesh.getVertexPosition(i,new THREE.Vector3());if(!v.toArray().every(Number.isFinite)||v.length()>2)throw new Error('动作周期中顶点失效或脱离人物');}
     }samples++;
    }
   }
  }
  p.dispose();canvas.remove();return {difference,samples};
 });
 assert.ok(result.difference>128*128*.01,'128像素灰色材质下仍应有可见轮廓差异');assert.equal(result.samples,800);assert.deepEqual(errors,[]);
 console.log('PASS: 128px clay render differences',result.difference,'pixels; 8 combinations × 4 clips × 25 frames =',result.samples,'valid bone poses');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
