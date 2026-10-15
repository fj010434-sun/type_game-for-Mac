// Small, seamless, offline surface maps. One material per city, reused by every tile.
import * as THREE from 'three';
const surfaces=new Map();
const styles={
 dalian:{base:'#aeb9b9',stone:[179,188,187],w:128,h:64,offset:false,gap:3},
 tokyo:{base:'#8c969b',stone:[142,153,159],w:32,h:32,offset:false,gap:2},
 paris:{base:'#8e908b',stone:[157,157,146],w:42.6666667,h:25.6,offset:true,gap:3,round:5},
 rio:{base:'#659b45',grass:true},
 newyork:{base:'#424b56',asphalt:true},
 manarola:{base:'#b19c7a',stone:[201,180,144],w:85.3333333,h:51.2,offset:true,gap:3},
 dresden:{base:'#a39b8b',stone:[174,168,151],w:64,h:32,offset:true,gap:3},
};
function surfaceCanvas(style){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
 let seed=941;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=style.base;ctx.fillRect(0,0,512,512);
 if(style.grass){
  // Broad mowing bands, mottled turf and many short blades, without road markings.
  for(let y=0;y<512;y+=128){ctx.fillStyle=y%256?'#679d48':'#709f4b';ctx.fillRect(0,y,512,128);}
  for(let j=0;j<18000;j++){
   const x=random()*512,y=random()*512,v=Math.floor(random()*40);
   ctx.strokeStyle=`rgba(${44+v},${95+v},${29+v*.5},.48)`;ctx.lineWidth=.6+random();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*3-1.5,y-1-random()*4);ctx.stroke();
  }
 }else if(style.asphalt){
  for(let j=0;j<16000;j++){const v=65+Math.floor(random()*35);ctx.fillStyle=`rgba(${v},${v+7},${v+13},.5)`;ctx.fillRect(random()*512,random()*512,1+random(),1+random());}
  ctx.fillStyle='#d4cda9';for(let y=20;y<512;y+=128)ctx.fillRect(253,y,6,63);
  ctx.fillStyle='#afb6b8';ctx.fillRect(16,0,3,512);ctx.fillRect(493,0,3,512);
 }else{
  const rows=Math.round(512/style.h),cols=Math.round(512/style.w);
  for(let row=0;row<rows;row++){
   const offset=style.offset&&row%2?style.w/2:0;
   for(let col=-1;col<=cols;col++){
    const v=Math.floor(random()*23)-11,[r,g,b]=style.stone,x=col*style.w+offset,y=row*style.h,gap=style.gap;
    ctx.fillStyle=`rgb(${r+v},${g+v},${b+v})`;
    ctx.beginPath();ctx.roundRect(x+gap/2,y+gap/2,style.w-gap,style.h-gap,style.round||1);ctx.fill();
    ctx.strokeStyle='rgba(245,240,218,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+gap,y+style.h-gap);ctx.lineTo(x+gap,y+gap);ctx.lineTo(x+style.w-gap,y+gap);ctx.stroke();
   }
  }
  // Fine mineral grain, kept subtle enough that joints remain legible at game scale.
  for(let j=0;j<3500;j++){ctx.fillStyle=random()>.5?'rgba(255,255,245,.08)':'rgba(30,35,32,.07)';ctx.fillRect(random()*512,random()*512,1,1);}
 }
 return c;
}
function texture(canvas){const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export function citySurface(city){
 if(!styles[city])return null;
 if(!surfaces.has(city)){
  const style=styles[city],canvas=surfaceCanvas(style),map=texture(canvas);
  const material=new THREE.MeshStandardMaterial({map,roughness:1,metalness:0});
  const walkMap=texture(city==='rio'?surfaceCanvas({base:'#c4b998',stone:[226,213,180],w:64,h:64,gap:2}):canvas);
  walkMap.repeat.set(.4,75);
  surfaces.set(city,{material,walkMap});
 }
 return surfaces.get(city);
}
const routeGeometry=new THREE.PlaneGeometry(8,8);routeGeometry.rotateX(-Math.PI/2);
export function cityRoute(city){
 const m=new THREE.Mesh(routeGeometry,citySurface(city).material);m.position.y=.012;m.receiveShadow=true;m.name='route-surface';return m;
}
