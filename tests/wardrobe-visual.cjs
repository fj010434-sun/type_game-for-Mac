const {setup}=require('./browser-helper.cjs');const assert=require('node:assert/strict');
(async()=>{const {browser,page,errors,base}=await setup();try{
 await page.goto(base+'/wardrobe-sample.html');await page.waitForSelector('[data-category="shirt"]');
 const result=await page.evaluate(async()=>{
  const THREE=await import('three');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const {createWardrobeCharacter,loadWardrobeAssets}=await import('./wardrobe-character.js');const {DEFAULT_OUTFIT}=await import('./wardrobe-catalog.mjs');
  await loadWardrobeAssets();const base=await new GLTFLoader().loadAsync('assets/characters/character-male-c.glb');
  const summarize=outfit=>{const c=createWardrobeCharacter(base,outfit),meshes=c.clothes.filter(m=>m.isSkinnedMesh);const stats={};
   for(const m of meshes){const p=m.geometry.attributes.position;let count=0;const b=new THREE.Box3();for(const i of new Set(m.geometry.index.array)){const v=new THREE.Vector3().fromBufferAttribute(p,i);b.expandByPoint(v);count++;}stats[m.name]={count,min:b.min.toArray(),max:b.max.toArray()};}c.dispose();return stats;};
  return {duty:summarize(DEFAULT_OUTFIT),patrol:summarize({...DEFAULT_OUTFIT,shirt:'shirt-jacket',pants:'pants-patrol',shoes:'shoes-boots'})};
 });
 assert.ok(result.patrol['wardrobe-shirt'].max[0]-result.duty['wardrobe-shirt'].max[0]>.035,'夹克长袖必须形成明显不同轮廓');
 assert.ok(result.patrol['wardrobe-shoes'].max[1]-result.duty['wardrobe-shoes'].max[1]>.045,'短靴鞋帮必须明显高于低帮鞋');
 assert.deepEqual(errors,[]);console.log('PASS: distinct sleeve and boot silhouettes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
