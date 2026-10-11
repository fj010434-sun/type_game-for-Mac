import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { DEFAULT_OUTFIT, compatibilityIssues } from './wardrobe-catalog.mjs';
let bodyData;
export async function loadWardrobeAssets() {
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
 const o=new THREE.Mesh(geo,mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=false;parent.add(o);return o;
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
 for(const [name,data] of Object.entries(bodyData.parts)) {
  const geometry=new THREE.BufferGeometry();
  for(const [key,attribute,size,type] of [['positions','position',3,Float32Array],['normals','normal',3,Float32Array],['uv','uv',2,Float32Array],['joints','skinIndex',4,Uint16Array],['weights','skinWeight',4,Float32Array]])
   geometry.setAttribute(attribute,new THREE.BufferAttribute(new type(data[key].flat()),size));
  geometry.setIndex(data.indices);
  const position=geometry.attributes.position;
  // 外套略宽、短靴提高鞋帮；保持关节连接处原坐标以免接缝开裂。
  if(name==='shirt'&&outfit.shirt==='shirt-jacket') for(let i=0;i<position.count;i++) {
   const y=position.getY(i);if(y>.19&&y<.33)position.setX(i,position.getX(i)*1.035);
  }
  if(name==='shoes'&&outfit.shoes==='shoes-boots') for(let i=0;i<position.count;i++) {
   const y=position.getY(i);if(y>.025&&y<.055)position.setY(i,y+.016*(y-.025)/.03);
  }
  const material=name==='skin'?ch.body.material:mat(name==='shirt'?(outfit.shirt==='shirt-jacket'?0x263e60:0x617dac):name==='pants'?(outfit.pants==='pants-patrol'?0x34465c:0x343b46):0x242a34);
  const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='wardrobe-'+name;
  mesh.bind(ch.body.skeleton,ch.body.bindMatrix);mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;
  ch.body.parent.add(mesh);ch.clothes.push(mesh);
 }
 const parts=new THREE.Group();parts.name='wardrobe-head';ch.head.add(parts);ch.parts=parts;
 const round=outfit.face==='face-round',skin=0xe4b18c;
 const width=round?.46:.43,height=round?.38:.41;
 part(parts,rounded(width,height,.34,round?.08:.045),skin,0,.205,0);
 for(const side of [-1,1])part(parts,new THREE.SphereGeometry(.045,8,6),skin,side*(width/2+.005),.205,-.005);
 // 发型贴合头型；帽内版本收起顶部头发，保留鬓角。
 const covered=outfit.hat!=='hat-none',hairColor=outfit.hair==='hair-parted'?0x503629:0x634432;
 if(!covered){
  part(parts,rounded(width+.018,.115,.38,.035),hairColor,0,.365,-.005);
  const fringe=part(parts,rounded(outfit.hair==='hair-parted'?.22:.33,.07,.025,.015),hairColor,outfit.hair==='hair-parted'?-.06:0,.327,.20);
  if(outfit.hair==='hair-parted')fringe.rotation.z=-.12;
 }
 part(parts,rounded(width+.012,.24,.045,.025),hairColor,0,.245,-.185);
 for(const side of [-1,1])part(parts,rounded(.04,.10,.15,.015),hairColor,side*width/2,.285,-.04);
 const front=.177;
 for(const side of [-1,1]){
  const x=side*.092;
  const eye=part(parts,rounded(.068,outfit.eyes==='eyes-calm'?.045:.061,.012,.013),0xfffaf0,x,.226,front);
  part(parts,rounded(.026,.038,.015,.006),0x303138,x,.225,front+.009);
  part(parts,new THREE.SphereGeometry(.007,6,4),0xffffff,x-.006,.233,front+.019);
  const brow=part(parts,rounded(.078,.018,.009,.004),hairColor,x,.281,front+.003);
  brow.rotation.z=outfit.brows==='brows-natural'?side*.10:0;
 }
 const nose=part(parts,new THREE.SphereGeometry(outfit.nose==='nose-round'?.032:.024,8,6),0xd99f79,0,.183,front+.004);
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
 // Collar, badge and pockets move with torso. Add to separate owned group.
 const uniform=new THREE.Group();ch.torso.add(uniform);ch.clothes.push(uniform);
 part(uniform,new THREE.CircleGeometry(.023,5),0xf4c565,-.085,.118,.14);
 for(const side of [-1,1]){
  const collar=part(uniform,rounded(.048,.05,.012,.004),outfit.shirt==='shirt-jacket'?0x3c597c:0x8dacce,side*.028,.154,.121);collar.rotation.z=side*.5;
  if(outfit.shirt==='shirt-jacket')part(uniform,rounded(.064,.054,.015,.006),0x1f344f,side*.092,.06,.137);
 }
 if(outfit.pants==='pants-patrol')for(const side of [-1,1])part(uniform,rounded(.042,.052,.018,.005),0x28384f,side*.124,-.039,.096);
}
