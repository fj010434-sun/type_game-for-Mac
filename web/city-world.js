// Stylised city architecture. Shared geometry/materials survive chunk recycling.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cityRoute } from './city-surfaces.js';
export const CITY_PALETTES={
 dalian:{ground:0x96b98c,walk:0xe9e3d2,fog:0xc8e6f2,sky:0x60b8eb,sun:0xfff1d6},
 tokyo:{ground:0xb1bd98,walk:0xd9d2c9,fog:0xf0dfe7,sky:0x99b8df,sun:0xffe4da},
 paris:{ground:0xa3ad88,walk:0xe0d5c3,fog:0xe8dfce,sky:0xadc4d9,sun:0xffe5bd},
 rio:{ground:0xccd69a,walk:0xf1e4b5,fog:0xb9e4e9,sky:0x4eafe1,sun:0xffefbb},
 newyork:{ground:0x8b9c89,walk:0xbfc5cc,fog:0xd3dce6,sky:0x82afd6,sun:0xffead4},
 manarola:{ground:0xc9ba91,walk:0xe5cda6,fog:0xc7e4e8,sky:0x65b6dc,sun:0xffe7b6},
 dresden:{ground:0x9aaf8b,walk:0xd6c6aa,fog:0xe4e0d4,sky:0x9abbd9,sun:0xffe8c5},
};
const geo=new Map(),mats=new Map(),models=new Map();
function mesh(kind,args,color){
 const k=kind+':'+args.join(',');
 if(!geo.has(k))geo.set(k,kind==='box'?new THREE.BoxGeometry(...args):kind==='sphere'?new THREE.SphereGeometry(...args):kind==='cone'?new THREE.ConeGeometry(...args):kind==='torus'?new THREE.TorusGeometry(...args):kind==='circle'?new THREE.CircleGeometry(...args):new THREE.CylinderGeometry(...args));
 if(!mats.has(color))mats.set(color,new THREE.MeshLambertMaterial({color,flatShading:true}));
 const m=new THREE.Mesh(geo.get(k),mats.get(color));m.castShadow=m.receiveShadow=true;return m;
}
function part(g,kind,args,color,x=0,y=0,z=0){const m=mesh(kind,args,color);m.position.set(x,y,z);g.add(m);return m;}
function box(g,w,h,d,c,x=0,y=0,z=0){return part(g,'box',[w,h,d],c,x,y,z);}
function ball(g,r,c,x,y,z=0){return part(g,'sphere',[r,16,12],c,x,y,z);}
function rod(g,a,b,r,c){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=part(g,'cyl',[r,r,v.length(),6],c);m.position.copy(new THREE.Vector3(...a).addScaledVector(v,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
function cached(key,build){if(!models.has(key)){const g=new THREE.Group();build(g);models.set(key,g);}return models.get(key).clone(true);}
function windows(g,width,height,color=0x5c8190){
 for(let y=1.4;y<height-.5;y+=1.8)for(const x of [-width*.29,width*.29]){
  box(g,.85,1.05,.12,0xf5e9d5,x,y,2.55);box(g,.63,.84,.14,color,x,y,2.63);
 }
}
function townHouse(city,variant){return cached(city+'-house-'+variant,g=>{
 const palettes={dalian:[0xf3dec1,0xe7e6dc,0xd3bca7],tokyo:[0x785c50,0x997866,0xdecbb1],paris:[0xe5d5b6,0xd6c7ae,0xeaddc6],rio:[0xefad65,0x76b9b2,0xe9878a],newyork:[0x9c5546,0xb57152,0x806b61],manarola:[0xefb660,0xe38f7c,0xe4cb83],dresden:[0xd5bf98,0xe6d4b3,0xc7b48f]};
 const c=palettes[city][variant%3],height=city==='newyork'?10+variant*2:city==='tokyo'?4.2:6+variant;
 box(g,5.6,height,5,c,0,height/2);
 if(city==='tokyo'){
  box(g,5.8,.3,5.4,0x4b4249,0,4.3);
  const roof=part(g,'cone',[4.3,1.5,4],0x39454c,0,5);roof.rotation.y=Math.PI/4;roof.scale.z=.9;
  for(const x of [-2.4,0,2.4])box(g,.15,4,.18,0x453d39,x,2,2.6);
  box(g,5.7,.14,.2,0x453d39,0,2.8,2.6);
  for(const x of [-1.2,1.2]){box(g,1.65,1.6,.1,0xf4e6cf,x,1.6,2.6);for(const dx of [-.5,0,.5])box(g,.06,1.6,.12,0x826d5a,x+dx,1.6,2.68);}
  for(const x of [-2,2]){part(g,'cyl',[.3,.3,.6,10],0xf0a08b,x,3,3);box(g,.45,.08,.45,0x594449,x,3.35,3);}
 }else{
  windows(g,5.6,height,city==='newyork'?0x405564:0x6b9da6);
  box(g,5.9,.25,5.3,0xf2e6cd,0,height+.05);
  if(['paris','dresden'].includes(city)){
   const roof=box(g,6,1.3,5.4,city==='paris'?0x596574:0x748c83,0,height+.8);roof.scale.x=.9;
   for(const x of [-1.7,1.7]){box(g,.7,.9,.5,0xe6d7bd,x,height+.8,2.6);part(g,'cone',[.6,.45,4],0x596574,x,height+1.45,2.6).rotation.y=Math.PI/4;}
   for(const y of [3.1,4.9])box(g,5.75,.13,.3,0xf0e3cd,0,y,2.65);
  }else{const roof=part(g,'cone',[4.2,1.2,4],0xaf6650,0,height+.6);roof.rotation.y=Math.PI/4;roof.scale.z=.95;}
  if(city==='newyork'){
   // Exterior fire escape with staggered stair flights.
   for(let y=2.3;y<height;y+=2){box(g,1.8,.12,.85,0x343f48,.1,y,2.95);rod(g,[-.7,y,3.3],[.9,y+1.9,3.3],.045,0x343f48);box(g,1.8,.06,.06,0x343f48,.1,y+.6,3.3);}
   for(const x of [-2.6,2.6])box(g,.15,height,.12,0xc49576,x,height/2,2.6);
  }
  if(['paris','manarola','rio'].includes(city)){
   const aw=box(g,4.3,.18,1.5,city==='paris'?0x44736a:0xf4ede0,0,2,3.1);aw.rotation.x=.12;
   for(const x of [-1.6,1.6]){box(g,.9,.35,.45,0xa9674f,x,3.65,2.9);ball(g,.34,0x6b9458,x,4,2.9);ball(g,.16,0xe48b9b,x+.15,4.2,3.05);}
  }
 }
 box(g,1.1,1.8,.15,0x4c666c,0,.9,2.6);
});}
function sakura(){return cached('sakura',g=>{
 rod(g,[0,0,0],[.15,3.3,0],.18,0x765443);
 rod(g,[0,2,0],[-1.3,3.5,0],.1,0x765443);rod(g,[0,2.2,0],[1.2,3.8,.5],.1,0x765443);
 for(const [x,y,z,r]of [[0,4,0,1.4],[-1.2,3.6,0,1],[1.1,4,.3,1],[-.3,4.6,.1,.9]])ball(g,r,0xf2b9d0,x,y,z);
});}
function bridge(){return cached('xinghai-bridge',g=>{
 // Curved twin-deck bridge, paired portal towers and suspension cables.
 const deck=[];for(let j=0;j<=20;j++){const t=j/20;deck.push([Math.sin(t*Math.PI)*13,5,-65+t*130]);}
 for(let j=0;j<20;j++){
  const a=deck[j],b=deck[j+1];const beam=box(g,5,.38,Math.hypot(b[0]-a[0],b[2]-a[2]),0xc0c8ca,(a[0]+b[0])/2,5,(a[2]+b[2])/2);beam.rotation.y=Math.atan2(b[0]-a[0],b[2]-a[2]);
  const lower=beam.clone();lower.position.y=3.8;g.add(lower);
 }
 for(const z of [-30,30]){const x=13*Math.sin((z+65)/130*Math.PI);
  for(const side of [-1,1])box(g,.8,22,1.1,0xe5e7df,x+side*2.5,11,z);
  for(const y of [9,19,21])box(g,5.7,.7,1.1,0xe5e7df,x,y,z);
 }
 for(const side of [-1,1]){
  const pts=[];for(let j=0;j<=24;j++){const z=-60+j*5,x=13*Math.sin((z+65)/130*Math.PI)+side*2.5;const y=Math.abs(z)<=30?10+10*(z/30)**2:20-(Math.abs(z)-30)*.45;pts.push([x,y,z]);rod(g,[x,5,z],[x,y,z],.055,0xe8e6d9);}
  for(let j=0;j<pts.length-1;j++)rod(g,pts[j],pts[j+1],.11,0xf1e9d4);
 }
});}
function soccer(){return cached('labor-football',g=>{
 box(g,5,.6,5,0xb8b8ae,0,.3);ball(g,2.8,0xf5f1e5,0,3.35);
 const ico=new THREE.IcosahedronGeometry(1,0),v=ico.getAttribute('position'),seen=new Set();
 for(let i=0;i<v.count;i++){
  const n=new THREE.Vector3().fromBufferAttribute(v,i).normalize(),key=n.toArray().map(x=>x.toFixed(3)).join();if(seen.has(key))continue;seen.add(key);
  const p=part(g,'circle',[.68,5],0xc64d48);p.position.copy(n.clone().multiplyScalar(2.82));p.position.y+=3.35;p.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
 }ico.dispose();
});}
function crystal(){return cached('friendship-crystal',g=>{
 part(g,'cyl',[2.5,3,.5,20],0xd1ccc2,0,.25);
 for(let j=0;j<5;j++){
  const t=j*Math.PI*2/5,c=[0xd5b15b,0x42413f,0xbd6d53,0xeee4d1,0x8d654b][j],x=Math.cos(t),z=Math.sin(t);
  rod(g,[x*1.8,.5,z*1.8],[x*.9,2.35,z*.9],.26,c);
  const palm=ball(g,.37,c,x*.9,2.35,z*.9);palm.scale.y=.65;
  for(const offset of [-.20,0,.20])rod(g,[x*.9+z*offset,2.35,z*.9-x*offset],[x*.8+z*offset,2.7,z*.8-x*offset],.075,c);
 }
 const globe=ball(g,2.15,0x9bd7e6,0,4.35);
 globe.material=globe.material.clone();globe.material.transparent=true;globe.material.opacity=.65;
 for(let j=0;j<8;j++){const ring=part(g,'torus',[2.18,.035,4,32],0xe5f8fa,0,4.35);ring.rotation.y=j*Math.PI/8;}
 for(const a of [-.9,-.45,0,.45,.9]){const ring=part(g,'torus',[2.18*Math.cos(a),.035,4,32],0xf6e2a8,0,4.35+2.18*Math.sin(a));ring.rotation.x=Math.PI/2;}
 const core=ball(g,.55,0xffe8b5,0,4.35);core.material=new THREE.MeshBasicMaterial({color:0xffe7a4});
});}
function square(){return cached('xinghai-square',g=>{
 part(g,'cyl',[9,9,.15,32],0xe8d9c1,0,.05);
 for(const r of [4,7]){const ring=part(g,'torus',[r,.09,4,48],0xc7a67f,0,.15);ring.rotation.x=Math.PI/2;}
 // Open-book sculpture on the seaward edge.
 for(const side of [-1,1]){const page=box(g,4,.22,4.5,0xf7efe3,side*1.8,1.1,-4);page.rotation.z=side*.38;}
 for(const x of [-6,6]){ball(g,1.8,0x7ca978,x,1,2);}
});}
function dome(g,r,y,color){const d=part(g,'sphere',[r,20,12,0,Math.PI*2,0,Math.PI/2],color,0,y);return d;}
function frauenkirche(){return cached('frauenkirche',g=>{
 box(g,9,9,8,0xd6c5a4,0,4.5);box(g,10,.5,9,0xe5d6b7,0,9);
 part(g,'cyl',[3.4,3.8,3.5,16],0xdac9a7,0,10.7);dome(g,4,12.3,0xc9b79c);
 part(g,'cyl',[.85,1,2,10],0xe0d0ad,0,17);dome(g,1.05,18,0x8a9c90);
 rod(g,[0,18.7,0],[0,20,0],.06,0xc09b55);rod(g,[-.4,19.6,0],[.4,19.6,0],.06,0xc09b55);
 for(const x of [-3.7,3.7])for(const z of [-3,3]){part(g,'cyl',[.7,.8,11,8],0xe5d6b7,x,5.5,z);domeAt(g,.85,x,11,z);}
 for(const x of [-2.7,0,2.7])for(const y of [3,6.4]){box(g,1,1.8,.14,0x65746f,x,y,4.1);part(g,'sphere',[.5,10,6,0,Math.PI*2,0,Math.PI/2],0x65746f,x,y+.9,4.1).scale.z=.15;}
});}
function domeAt(g,r,x,y,z){const m=dome(g,r,y,0x879b8f);m.position.x=x;m.position.z=z;}
function palace(){return cached('zwinger',g=>{
 box(g,21,4.5,5,0xd8c39e,0,2.25);box(g,22,.4,5.5,0xf0dfbb,0,4.6);
 for(let x=-9;x<=9;x+=2){box(g,.26,3.4,.5,0xf0dfbb,x,1.9,2.8);part(g,'sphere',[.75,10,6,0,Math.PI*2,0,Math.PI/2],0x526d69,x+1,2.9,2.6).scale.z=.16;box(g,1.5,2,.12,0x526d69,x+1,1.9,2.6);}
 box(g,4,7,5.5,0xe3d0aa,0,3.5);part(g,'cyl',[1.7,2.2,1.3,8],0x729388,0,7.6);
 ball(g,1.3,0xbda166,0,8.8);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;part(g,'cone',[.28,1.1,5],0xe3bd64,Math.cos(a)*1.1,9.5,Math.sin(a)*1.1);}
});}
function opera(){return cached('semperoper',g=>{
 part(g,'cyl',[6.3,6.3,6,18,1,false,-Math.PI/2,Math.PI],0xd1b891,0,3);box(g,12,6,3,0xd1b891,0,3,-1.5);
 for(let j=0;j<=8;j++){const a=j*Math.PI/8;const x=Math.cos(a)*6.4,z=Math.sin(a)*6.4;const pillar=part(g,'cyl',[.22,.26,5.6,8],0xe8d8b8,x,2.8,z);pillar.castShadow=false;
 const w=box(g,.85,1.5,.15,0x4f6866,Math.cos(a)*6.05,3.5,Math.sin(a)*6.05);w.rotation.y=Math.PI/2-a;}
 box(g,13,.5,8,0xe8d8b8,0,6.2);box(g,11,1.1,6,0x6c857e,0,7);box(g,3,1.2,1,0xbaa17f,0,7.8,2.5);
});}
function eiffel(){return cached('eiffel',g=>{
 const c=0x8c7d68;for(const s of [-1,1])for(const z of [-1,1]){
  rod(g,[s*4,0,z*4],[s*1.3,12,z*1.3],.4,c);rod(g,[s*1.3,12,z*1.3],[s*.3,22,z*.3],.22,c);
  for(let j=0;j<4;j++){let y=j*2.5;const w=4-y*.225,nw=4-(y+2.5)*.225;rod(g,[s*w,y,-w],[s*nw,y+2.5,nw],.08,c);rod(g,[-w,y,z*w],[nw,y+2.5,z*nw],.08,c);}
 }
 box(g,6,.45,6,c,0,5);box(g,3.5,.4,3.5,c,0,12);rod(g,[0,22,0],[0,25,0],.1,c);
});}
function torii(){return cached('torii',g=>{
 for(const x of [-2.5,2.5]){part(g,'cyl',[.22,.32,5.2,8],0xb44c3e,x,2.6);box(g,.7,.35,.7,0x3c4445,x,.18);}
 box(g,6.8,.4,.55,0xbc5346,0,5.3);box(g,5.8,.28,.4,0xbc5346,0,4.25);box(g,7.2,.15,.8,0x3d4649,0,5.6);box(g,.4,.9,.35,0x3d4649,0,4.75);
});}
function empire(){return cached('empire',g=>{
 for(const [w,h,y] of [[10,16,8],[8,9,20.5],[6,8,29],[3,5,35.5]]){box(g,w,h,w,0xa5adb0,0,y);for(const x of [-w*.3,0,w*.3])box(g,.35,h-.7,.12,0x587382,x,y,w/2+.06);}
 rod(g,[0,38,0],[0,47,0],.13,0xd6dbdb);
});}
function rioMountain(){return cached('sugarloaf',g=>{
 const m=ball(g,12,0x73978a,0,8);m.scale.set(.8,1.5,.85);ball(g,8,0x7ca292,15,4,-12);
});}
function coast(g,i,color=0x61b9c9){box(g,180,.06,8,color,102,-.005);box(g,10,.07,8,0xead9b1,17,0);box(g,.18,.18,8,0xece6d7,7.5,1);for(const z of [-3,1])box(g,.18,1,.18,0xece6d7,7.5,.5,z);}
// Merge each small prop by material once, rather than drawing every slat and petal.
function streetProp(key,build){return cached('street:'+key,g=>{
 build(g);g.updateMatrixWorld(true);const batches=new Map();
 g.traverse(o=>{if(o.isMesh){if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o.geometry.clone().applyMatrix4(o.matrixWorld));}});
 g.clear();
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts,false);for(const p of parts)p.dispose();const m=new THREE.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;g.add(m);}
});}
function bench(iron=false){return streetProp(iron?'iron-bench':'wood-bench',g=>{
 const wood=iron?0x9c805a:0xa78156,frame=iron?0x394e4b:0x556870;
 for(const x of [-.7,.7]){box(g,.12,.55,.66,frame,x,.28);box(g,.10,.95,.10,frame,x,.7,-.29);box(g,.14,.1,.65,frame,x,.88);}
 for(const z of [-.22,0,.22])box(g,1.7,.10,.15,wood,0,.58,z);
 for(const y of [.83,1.04])box(g,1.65,.14,.10,wood,0,y,-.29);
});}
function planter(theme='flowers'){return streetProp('planter:'+theme,g=>{
 const clay=theme==='pots',c=clay?0xb87352:theme==='tropical'?0xdfc99b:0xc0b49c;
 if(clay){part(g,'cyl',[.37,.26,.6,10],c,0,.3);part(g,'torus',[.36,.055,4,12],c,0,.6).rotation.x=Math.PI/2;}
 else{box(g,1.6,.4,.8,c,0,.2);box(g,1.4,.08,.65,0x6d5941,0,.43);}
 const xs=clay?[0]:[-.48,0,.48];
 for(const [j,x]of xs.entries()){
  ball(g,clay?.35:.32,theme==='tropical'?0x3c8b54:0x668b50,x,.64);
  for(const dx of [-.12,.13]){rod(g,[x+dx,.65,0],[x+dx,.93,.02],.025,0x53864c);ball(g,.12,[0xe4a6b3,0xf0ce73,0xc987a9][j%3],x+dx,.96,.02);}
 }
});}
function sign(text){return streetProp('sign:'+text,g=>{
 box(g,.10,1.6,.10,0x56656a,0,.8);box(g,1.3,.65,.12,0x56656a,0,1.65);
 const c=document.createElement('canvas');c.width=384;c.height=192;const ctx=c.getContext('2d');
 ctx.fillStyle='#f1ead7';ctx.fillRect(0,0,384,192);ctx.fillStyle='#354a53';ctx.font='bold 58px -apple-system,"PingFang SC",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,192,96,350);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.55),new THREE.MeshLambertMaterial({map:tex}));panel.position.set(0,1.65,.067);g.add(panel);
});}
function vending(){return streetProp('vending',g=>{
 box(g,1.05,1.85,.72,0xd86b66,0,.925);box(g,.83,1.12,.05,0xdee6dc,0,1.16,.39);
 for(const y of [.85,1.2,1.55])for(const x of [-.25,0,.25])part(g,'cyl',[.07,.07,.19,8],x===0?0xf1d28a:0x8fb6bb,x,y,.44);
 box(g,.6,.18,.05,0x4c5c67,0,.32,.4);box(g,.08,.22,.05,0xe4d8bd,.4,.54,.4);
});}
function lanterns(){return streetProp('lanterns',g=>{
 for(const x of [-.55,.55]){box(g,.08,1.8,.08,0x685342,x,.9);rod(g,[x,1.8,0],[x,1.8,.4],.035,0x685342);part(g,'cyl',[.20,.20,.42,12],0xe5a28b,x,1.52,.4);box(g,.35,.06,.35,0x574640,x,1.76,.4);}
});}
function cafe(){return streetProp('cafe',g=>{
 part(g,'cyl',[.5,.5,.08,16],0xeee8d6,0,.82);part(g,'cyl',[.065,.09,.78,8],0x41645c,0,.4);
 for(const z of [-.87,.87]){box(g,.48,.09,.48,0x55746b,0,.45,z);for(const x of [-.17,.17])for(const dz of [-.17,.17])box(g,.045,.43,.045,0x41645c,x,.22,z+dz);box(g,.48,.35,.06,0x55746b,0,.75,z+Math.sign(z)*.22);}
 part(g,'cyl',[.09,.07,.17,8],0xc28b70,0,.94);ball(g,.12,0x92a56c,0,1.08);
});}
function beachChair(){return streetProp('beach-chair',g=>{
 for(const x of [-.33,.33]){rod(g,[x,.05,-.7],[x,.6,.5],.035,0xd6c8a9);rod(g,[x,.05,.7],[x,.6,-.5],.035,0xd6c8a9);}
 const back=box(g,.7,.09,1.6,0xf0dfac,0,.48);back.rotation.x=-.3;
 for(const x of [-.23,.23]){const stripe=box(g,.13,.015,1.58,0x60a1aa,x,.54);stripe.rotation.x=-.3;}
});}
function hydrant(){return streetProp('hydrant',g=>{
 part(g,'cyl',[.15,.2,.7,10],0xbf6450,0,.35);ball(g,.18,0xbf6450,0,.74);box(g,.55,.17,.2,0xbf6450,0,.45);part(g,'cyl',[.26,.26,.08,12],0x777e7f,0,.04);
});}
function bin(){return streetProp('bin',g=>{
 part(g,'cyl',[.32,.28,.78,12],0x4d6260,0,.39);part(g,'cyl',[.35,.35,.09,12],0x344a4c,0,.83);box(g,.38,.12,.17,0x253b3d,0,.65,.29);
});}
function subway(){return streetProp('subway',g=>{
 box(g,2.2,.14,3.1,0x515c60,0,.08);box(g,1.65,.02,2.7,0x293b40,0,.16);
 for(let j=0;j<6;j++)box(g,1.65,.07,.30,0x929a98,0,.18+j*.035,-1.1+j*.35);
 for(const x of [-1.05,1.05]){for(const z of [-1.4,0,1.4])box(g,.065,1.0,.065,0x385e52,x,.6,z);box(g,.08,.08,3,0x385e52,x,1.1);}
 for(const x of [-1.05,1.05]){box(g,.09,2.1,.09,0x385e52,x,1.05,-1.4);ball(g,.16,0xd6ddad,x,2.17,-1.4);}
 box(g,2.3,.4,.2,0x385e52,0,1.9,-1.4);
});}
function crates(){return streetProp('crates',g=>{
 for(const [x,y,z,s]of [[-.4,.32,0,.65],[.4,.23,.25,.48]]){
  box(g,s,s,s,0xb68e60,x,y,z);
  for(const dy of [-s*.3,0,s*.3])box(g,s+.04,.04,s+.04,0x816444,x,y+dy,z);
 }
});}
function fishing(){return streetProp('fishing',g=>{
 for(const z of [-.8,.8])rod(g,[0,0,z],[0,1.35,z],.045,0x9a7a53);
 for(let j=0;j<5;j++)rod(g,[0,.45+j*.18,-.8],[0,.45+j*.18,.8],.012,0xa6a18a);
 for(let j=0;j<6;j++)rod(g,[0,.45,-.8+j*.32],[0,1.17,-.8+j*.32],.012,0xa6a18a);
 part(g,'cyl',[.33,.3,.55,10],0x839b94,.5,.28,.35);part(g,'torus',[.31,.04,4,12],0xbebaa4,.5,.58,.35).rotation.x=Math.PI/2;
});}
function fence(){return streetProp('fence',g=>{
 for(const z of [-1.8,-1.2,-.6,0,.6,1.2,1.8]){box(g,.045,1,.045,0x465d56,0,.5,z);part(g,'cone',[.07,.12,5],0x465d56,0,1.06,z);}
 for(const y of [.3,.82])box(g,.06,.06,3.8,0x465d56,0,y);
});}
function seagulls(){return streetProp('seagulls',g=>{
 for(const [x,y,z]of [[0,0,0],[1.5,.4,-1]]){rod(g,[x-.65,y+.2,z],[x,y,z],.045,0xf2f1dd);rod(g,[x,y,z],[x+.65,y+.2,z],.045,0xf2f1dd);}
});}
function addStreetDetails(world,parent,i,city){
 const g=new THREE.Group();g.name='street-details';parent.add(g);
 const phase=((i%8)+8)%8;
 const put=(object,x,z=0,rotation=0,y=.14)=>{object.position.set(x,y,z);object.rotation.y=rotation;g.add(object);};
 const toward=side=>side>0?-Math.PI/2:Math.PI/2;
 // One principal prop on each side per tile; occasional extra props make small clusters.
 for(const side of [-1,1]){
  const x=side*6.25,rot=toward(side);
  if(city==='dalian')put(phase%3===0?bench():planter(),x,phase%2?1:-1,rot);
  if(city==='tokyo')put(side<0&&phase===3?vending():phase===5?lanterns():planter('pots'),side*6.6,0,rot);
  if(city==='paris')put(phase%3===0?cafe():planter(),x,0,rot);
  if(city==='rio')put(phase%4===3?beachChair():planter('tropical'),x,0,rot);
  if(city==='newyork')put(phase%4===1?hydrant():bin(),side*5.65,1,rot);
  if(city==='manarola')put(phase%4===3?crates():planter('pots'),side*6.35,0,rot);
  if(city==='dresden'){put(phase%3===0?bench(true):planter(),x,0,rot);if(phase%2===0)put(fence(),side*7.35);}
 }
 if(city==='dalian'&&phase===6)put(sign('星海湾'),8.8,1,-Math.PI/4);
 if(city==='dalian'&&((i%16)+16)%16===4)put(seagulls(),13,-2,0,6);
 if(city==='paris'&&phase===5)put(sign('CAFÉ'),-6.5,2,Math.PI/4);
 if(city==='rio'&&phase===3){const parasol=world.inst('detail-parasol-a',5);put(parasol,9,0);}
 if(city==='newyork'&&((i%32)+32)%32===4)put(subway(),9.6,0,Math.PI/5,0);
 if(city==='manarola'&&phase===5)put(fishing(),9.2,0);
}

export function buildCityChunk(world,i,city){
 const g=new THREE.Group();g.position.z=-i*8;const road=cityRoute(city);g.add(road);
 const n=((i%32)+32)%32,variant=((i%3)+3)%3;
 const put=(m,x,y=0,z=0,rotation=0)=>{m.position.set(x,y,z);m.rotation.y=rotation;g.add(m);return m;};
 const seaside=['dalian','rio','manarola'].includes(city);
 if(seaside)coast(g,i,city==='manarola'?0x529db7:0x60b8cd);
 if(city==='dresden'){box(g,45,.06,8,0x7cafb8,40,0);box(g,12,.07,8,0x9cb37f,16,.02);box(g,.25,.8,8,0xc3b79d,8,.4);}
 for(const side of [-1,1]){
  if((seaside||city==='dresden')&&side===1)continue;
  const house=townHouse(city,variant);put(house,side*(city==='tokyo'?10:11),0,0,side>0?-Math.PI/2:Math.PI/2);
  if(city==='manarola'){
   box(g,12,5,8,0xb4a386,-18,2.5);const rear=townHouse(city,(variant+1)%3);put(rear,-19,5,-1,Math.PI/2);
  }
  if(city==='tokyo'&&i%2===0)put(sakura(),side*6.1);
  else if(i%3===0){const t=city==='rio'?world.palm(i):world.tree(i+side);put(t,side*5.8);}
  if(i%4===1){const light=world.inst('light-curved',6);put(light,side*4.8,0,0,side>0?Math.PI/2:-Math.PI/2);}
 }
 // Keep a clear view corridor around landmark forecourts.
 const clearSide=(side)=>{for(const child of [...g.children])if(child!==road && Math.sign(child.position.x)===side && Math.abs(child.position.x)>=4.5 && Math.abs(child.position.x)<24)g.remove(child);};
 if(city==='dalian'&&([0,1,2,3,4,6,7,8,9,10].includes(n)))clearSide(-1);
 if(city==='dresden'&&([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,26].includes(n)))clearSide(-1);
 if((city==='paris'||city==='newyork')&&n<=8)clearSide(1);
 if(city==='dalian'){
  if(n===0)put(bridge(),26,0,-95);
  if(n===2)put(soccer(),-12,0,-5);
  if(n===8)put(crystal(),-12,0);
  if(n===14)put(square(),18,0);
  // Low park planting around landmark forecourts.
  if([1,2,3,7,8,9].includes(n)){const house=g.children.find(o=>o!==road&&o.position.x===-11);if(house)g.remove(house);box(g,20,.12,8,0xb1c594,-17,.03);}
 }
 if(city==='tokyo'&&n%8===2)put(torii(),15,0,-1,Math.PI/2);
 if(city==='paris'){
  if(n===3)put(eiffel(),20,0,-40).scale.setScalar(.72);
 }
 if(city==='rio'){
  if(i%2===0)put(world.palm(i),6);
  if(n===3)put(rioMountain(),38,0,-70);
  // Copacabana-inspired contrasting mosaic waves on the promenade.
  for(let j=0;j<4;j++){const m=box(g,.4,.025,2,0x465c60,5.3+Math.sin(j*Math.PI/2)*.65,.15,-3+j*2);m.rotation.y=j%2?.45:-.45;}
 }
 if(city==='newyork'){
  if(n===3)put(empire(),22,0,-70).scale.setScalar(.65);
  if(i%3===0){const taxi=world.tinted('taxi',1.2,0xffc62b);put(taxi,3.1,0);}
  if(i%4===2){box(g,.3,6,.3,0x485864,-6,3);box(g,2.4,1,.15,0x3c7567,-6,5.5);}
 }
 if(city==='manarola'&&n%8===3){
  const boat=new THREE.Group();const hull=part(boat,'sphere',[1.5,12,8],0xf2e9d6);hull.scale.set(.6,.3,1.7);rod(boat,[0,0,0],[0,5,0],.06,0xa38561);const sail=part(boat,'cone',[1.6,3.4,3],0xfff4d6,.6,2.9);sail.scale.z=.04;put(boat,28,.4);}
 if(city==='dresden'){
  box(g,15,.08,8,0xdfd0b4,-16,.02);
  if(i%3===0){const t=world.tree(i);put(t,11,.1);const l=world.inst('light-curved',6);put(l,-5.3,0,0,Math.PI/2);}
  if(n===2)put(frauenkirche(),-15,0,-34).scale.setScalar(.85);
  if(n===10)put(palace(),-16,0,-24,Math.PI/4);
  if(n===19)put(opera(),-16,0,-26,Math.PI/4);
 }
 addStreetDetails(world,g,i,city);
 // A landmark may extend beyond its road tile. Retire by its actual far edge,
 // so bridges, skyline buildings and mountains survive until the camera passes.
 const bounds=new THREE.Box3().setFromObject(g);
 g.userData.retainUntilDistance=-bounds.min.z;
 world.scene.add(g);return g;
}
