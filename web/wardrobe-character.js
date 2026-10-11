import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { DEFAULT_OUTFIT, compatibilityIssues } from './wardrobe-catalog.mjs';
let bodyData, uniformData;
export async function loadWardrobeAssets() {
 if(!uniformData){const r=await fetch('assets/wardrobe/uniforms.json');if(!r.ok)throw new Error('制服素材加载失败');uniformData=await r.json();}
 if (!bodyData) { const r=await fetch('assets/wardrobe/parts.json'); if(!r.ok) throw new Error('换装素材加载失败'); bodyData=await r.json(); }
}
const materials = new Map();
function mat(color) {
 if(!materials.has(color)) materials.set(color,new THREE.MeshLambertMaterial({color}));
 return materials.get(color);
}
function rounded(w,h,d,r=.025) {
 const s=new THREE.Shape(); const x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
 s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
 s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const bevel=d>.08?Math.min(.015,r/2):0;
 const g=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:3});g.translate(0,0,-(d-2*bevel)/2);return g;
}
function part(parent,geo,color,x=0,y=0,z=0) {
 const o=new THREE.Mesh(geo,mat(color));o.name=(parent.name||'wardrobe-detail')+'-'+parent.children.length;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=false;parent.add(o);return o;
}
function release(group) {group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.userData.ownMaterial)o.material.dispose();}});group.removeFromParent();}
export function disposeCharacterSkeletons(model) {
 for(const skeleton of new Set(model.getObjectsByProperty('isSkinnedMesh',true).map(mesh=>mesh.skeleton)))skeleton.dispose();
}
export function createWardrobeCharacter(baseGLTF,outfit=DEFAULT_OUTFIT) {
 if(!bodyData) throw new Error('请先加载换装素材');
 const model=clone(baseGLTF.scene);model.scale.setScalar(2);model.rotation.y=Math.PI;
 const root=new THREE.Group();root.add(model);
 const mixer=new THREE.AnimationMixer(model),actions={};
 for(const clip of baseGLTF.animations) actions[clip.name]=mixer.clipAction(clip);
 let head,torso,body,oldHead;
 model.traverse(o=>{if(o.name==='head')head=o;if(o.name==='torso')torso=o;if(o.name==='body-mesh')body=o;if(o.name==='head-mesh')oldHead=o;});
 model.updateMatrixWorld(true);body.visible=false;oldHead.visible=false;
 const ch={root,model,mixer,actions,head,torso,body,current:null,parts:null,outfit:null};
 ch.dispose=()=>{mixer.stopAllAction();mixer.uncacheRoot(model);disposeCharacterSkeletons(model);if(ch.parts)release(ch.parts);for(const o of ch.clothes||[])release(o);root.removeFromParent();};
 applyOutfit(ch,outfit);return ch;
}
export function applyOutfit(ch,outfit) {
 if(compatibilityIssues(outfit).length)throw new Error('穿搭部件无效');
 if(ch.parts)release(ch.parts);for(const o of ch.clothes||[])release(o);
 ch.outfit={...outfit};ch.clothes=[];
 const jacket=outfit.shirt==='shirt-jacket',boots=outfit.shoes==='shoes-boots';
 const variant=uniformData.variants[jacket?'jacket':'duty'];
 const regions={shirt:variant.shirt,skin:variant.skin,pants:variant.pants,shoes:uniformData.variants[boots?'jacket':'duty'].shoes};
 for(const [name,data] of Object.entries(regions)) {
  const geometry=new THREE.BufferGeometry();
  for(const [key,attribute,size,type] of [['positions','position',3,Float32Array],['normals','normal',3,Float32Array],['uv','uv',2,Float32Array],['joints','skinIndex',4,Uint16Array],['weights','skinWeight',4,Float32Array]])
   geometry.setAttribute(attribute,new THREE.BufferAttribute(new type(data[key].flat()),size));
  geometry.setIndex(data.indices);
  const material=mat(name==='skin'?0xe4b18c:name==='shirt'?(jacket?0x294464:0x708fbc):name==='pants'?(outfit.pants==='pants-patrol'?0x3d536d:0x343b46):0x242e3d);
  const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='wardrobe-'+name;
  mesh.bind(ch.body.skeleton,ch.body.bindMatrix);mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;
  ch.body.parent.add(mesh);ch.clothes.push(mesh);
 }
 const parts=new THREE.Group();parts.name='wardrobe-head';ch.head.add(parts);ch.parts=parts;
 const round=outfit.face==='face-round',skin=0xe4b18c;
 const width=round?.48:.43,height=round?.37:.41;
 part(parts,rounded(width,height,.34,round?.105:.045),skin,0,.205,0);
 for(const side of [-1,1])part(parts,new THREE.SphereGeometry(.045,8,6),skin,side*(width/2+.005),.205,-.005);
 // 发型贴合头型；帽内版本收起顶部头发，保留鬓角。
 const covered=outfit.hat!=='hat-none',hairColor=outfit.hair==='hair-parted'?0x503629:0x634432;
 if(covered&&outfit.hair==='hair-parted'){
  const fringe=part(parts,rounded(.21,.072,.045,.02),hairColor,-.057,.322,.188);fringe.rotation.z=-.20;
 }
 if(!covered){
  if(outfit.hair==='hair-parted'){
   const swept=part(parts,new THREE.SphereGeometry(1,16,10),hairColor,-.067,.378,-.012);swept.scale.set(width*.58,.097,.199);
   const side=part(parts,new THREE.SphereGeometry(1,12,8),hairColor,.15,.353,-.012);side.scale.set(.092,.067,.188);
  }else part(parts,rounded(width+.018,.105,.38,.035),hairColor,0,.362,-.005);
  const fringe=part(parts,rounded(outfit.hair==='hair-parted'?.22:.33,.07,.025,.015),hairColor,outfit.hair==='hair-parted'?-.06:0,.327,.20);
  if(outfit.hair==='hair-parted')fringe.rotation.z=-.12;
 }
 part(parts,rounded(width+.012,.24,.045,.025),hairColor,0,.245,-.185);
 for(const side of [-1,1])part(parts,rounded(.04,outfit.hair==='hair-parted'?.145:.078,.15,.015),hairColor,side*width/2,outfit.hair==='hair-parted'?.26:.293,-.04);
 const front=.177;
 for(const side of [-1,1]){
  const x=side*.092;
  const eye=part(parts,rounded(outfit.eyes==='eyes-calm'?.086:.068,outfit.eyes==='eyes-calm'?.035:.071,.012,.013),0xfffaf0,x,.226,front);
  part(parts,rounded(.026,outfit.eyes==='eyes-calm'?.025:.046,.015,.006),0x303138,x,.225,front+.009);
  part(parts,new THREE.SphereGeometry(.007,6,4),0xffffff,x-.006,.233,front+.019);
  if(outfit.brows==='brows-natural'){
   const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x-.044,.277,front+.009),new THREE.Vector3(x,.302,front+.009),new THREE.Vector3(x+.044,.277,front+.009));
   part(parts,new THREE.TubeGeometry(curve,8,.007,5,false),hairColor);
  }else part(parts,rounded(.10,.025,.012,.005),hairColor,x,.281,front+.009);
 }
 const nose=part(parts,new THREE.SphereGeometry(outfit.nose==='nose-round'?.041:.021,8,6),0xd99f79,0,.183,front+.004);
 nose.scale.z=.85;
 if(outfit.mouth==='mouth-happy'){
  part(parts,rounded(.104,.044,.012,.018),0x965b4d,0,.129,front);
  part(parts,rounded(.082,.012,.014,.005),0xfff9ef,0,.139,front+.008);
 }else{
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.042,.136,front+.009),new THREE.Vector3(0,.108,front+.012),new THREE.Vector3(.042,.136,front+.009));
  part(parts,new THREE.TubeGeometry(curve,10,.005,5,false),0x9b604d);
 }
 if(outfit.hat==='hat-cap'){
  part(parts,new THREE.CylinderGeometry(.30,.29,.105,12),0x213754,0,.405,-.006);
  part(parts,rounded(.49,.028,.19,.02),0x172a46,0,.348,.13);
  part(parts,new THREE.CircleGeometry(.028,5),0xffd17a,0,.405,.29);
 }else if(outfit.hat==='hat-helmet'){
  part(parts,new THREE.SphereGeometry(.31,16,10,0,Math.PI*2,0,Math.PI/2),0xf1f1e7,0,.33,-.006);
  part(parts,rounded(.51,.025,.12,.018),0xd4d9d7,0,.332,.13);
  part(parts,rounded(.43,.077,.018,.02),0x324d62,0,.295,.20);
 }
 // Every detail is fitted in its owner's rest-pose coordinates, including leg pockets.
 const attach=bone=>{const g=new THREE.Group();g.name='uniform-'+bone.name;bone.add(g);ch.clothes.push(g);return g;};
 const uniform=attach(ch.torso);
 const navy=0x203751,trim=0x8da9c7,metal=0xe5bd72;
 part(uniform,new THREE.CircleGeometry(.022,5),metal,-.075,.105,.15);
 if(jacket){
  for(const side of [-1,1]){
   const collar=part(uniform,rounded(.073,.061,.036,.011),navy,side*.045,.148,.123);collar.rotation.z=side*-.16;
   part(uniform,rounded(.088,.051,.02,.007),navy,side*.085,.035,.151);
   part(uniform,rounded(.088,.016,.026,.004),trim,side*.085,.056,.154);
  }
  part(uniform,rounded(.011,.124,.014,.003),0xbac5cf,0,.068,.152).name='jacket-zipper';
  part(uniform,rounded(.022,.018,.025,.004),metal,0,.092,.159);
  part(uniform,rounded(.244,.023,.025,.006),navy,0,-.008,.142);
 }else{
  for(const side of [-1,1]){
   const collar=part(uniform,rounded(.064,.049,.015,.005),0xa6bfdb,side*.041,.148,.131);collar.rotation.z=side*.58;
   part(uniform,rounded(.075,.041,.013,.005),0x5877a1,side*.079,.046,.147);
   part(uniform,rounded(.077,.011,.02,.004),trim,side*.079,.068,.15);
  }
  const tie=part(uniform,rounded(.026,.085,.012,.006),navy,0,.089,.145);tie.name='duty-tie';
  part(uniform,rounded(.036,.024,.02,.004),navy,0,.137,.148);
  part(uniform,rounded(.232,.019,.022,.004),navy,0,-.009,.141);
 }
 for(const side of [-1,1]){
  const arm=ch.model.getObjectByName(side===1?'arm-left':'arm-right');const details=attach(arm);
  part(details,rounded(.063,.018,.114,.006),navy,side*.037,.065,.035);
  part(details,rounded(.046,.008,.047,.003),metal,side*.037,.077,.073);
  if(jacket){
   // Cuff is on the arm, never the torso: it follows the entire stride and reach.
   part(details,rounded(.03,.119,.153,.012),navy,side*.223,0,.035).name='jacket-cuff-'+arm.name;
   part(details,rounded(.135,.009,.02,.003),trim,side*.096,.023,.10);
  }
  const leg=ch.model.getObjectByName(side===1?'leg-left':'leg-right');const legDetails=attach(leg);
  if(outfit.pants==='pants-patrol'){
   part(legDetails,rounded(.031,.066,.107,.006),0x263c55,side*.071,-.058,.019).name='cargo-pocket-'+leg.name;
   part(legDetails,rounded(.04,.018,.119,.005),0x6a829e,side*.074,-.029,.019);
  }
  if(boots){
   part(legDetails,rounded(.161,.02,.189,.007),0x172331,0,-.043,.01).name='boot-cuff-'+leg.name;
   for(const y of [-.075,-.092])part(legDetails,rounded(.061,.011,.016,.003),0x7a8a9d,0,y,.128);
  }
 }
}
