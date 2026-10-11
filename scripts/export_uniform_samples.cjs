// Capture the actual runtime assembler, including facial and uniform details and all original clips.
const {setup}=require('../tests/browser-helper.cjs');const fs=require('node:fs');
(async()=>{const {browser,page,base,errors}=await setup();try{
 await page.goto(base+'/wardrobe-sample.html');await page.waitForFunction(()=>window.__wardrobeSample);
 for(const style of ['duty','jacket']){
  const bytes=await page.evaluate(async style=>{
   const THREE=await import('three');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
   const {createWardrobeCharacter}=await import('./wardrobe-character.js');const {DEFAULT_OUTFIT}=await import('./wardrobe-catalog.mjs');
   const base=await new GLTFLoader().loadAsync('assets/characters/character-male-c.glb');const c=createWardrobeCharacter(base,style==='jacket'?{...DEFAULT_OUTFIT,shirt:'shirt-jacket',pants:'pants-patrol',shoes:'shoes-boots'}:DEFAULT_OUTFIT);
   c.model.rotation.y=0;c.model.updateMatrixWorld(true);
   const materials=[];c.root.traverse(o=>{if(o.isMesh&&o.visible){const m=new THREE.MeshStandardMaterial({color:o.material.color,roughness:.82,metalness:0});materials.push(m);o.material=m;}});
   const binary=await new GLTFExporter().parseAsync(c.root,{binary:true,onlyVisible:true,animations:base.animations});
   c.dispose();for(const m of materials)m.dispose();return Array.from(new Uint8Array(binary));
  },style);
  fs.writeFileSync(`art/wardrobe/${style}.glb`,Buffer.from(bytes));
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS: full runtime uniforms and original animation library exported to GLB');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
