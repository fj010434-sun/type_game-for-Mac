import {WardrobePreview} from './wardrobe-preview.js';
import {DEFAULT_OUTFIT} from './wardrobe-catalog.mjs';
const previews=[new WardrobePreview(document.getElementById('duty')),new WardrobePreview(document.getElementById('patrol'))];
await Promise.all(previews.map((p,i)=>p.load(i?{...DEFAULT_OUTFIT,shirt:'shirt-jacket',pants:'pants-patrol',shoes:'shoes-boots'}:DEFAULT_OUTFIT)));
const status=document.getElementById('status');let animation='idle';
function button(parent,label,action){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{action();if(!b.dataset.toggle)for(const sibling of b.parentElement.children)if(!sibling.dataset.toggle)sibling.setAttribute('aria-pressed',String(sibling===b));};document.getElementById(parent).append(b);return b;}
for(const [label,name] of [['站立','idle'],['行走','walk'],['跑步','sprint'],['抓捕','interact-right']]){
 const b=button('actions',label,()=>{animation=name;for(const p of previews)p.animate(name);status.textContent=`正在同步播放：${label}`;});b.setAttribute('aria-pressed',String(name==='idle'));
}
for(const [label,angle] of [['正面',0],['侧面',Math.PI/2],['背面',Math.PI],['三分之四',.55]])button('views',label,()=>{for(const p of previews)p.angle=angle;});
const clay=button('views','灰色材质',()=>{for(const p of previews)p.setClay(!p.clay);clay.setAttribute('aria-pressed',String(previews[0].clay));});clay.dataset.toggle='true';clay.setAttribute('aria-pressed','false');
// One clock advances both previews: frames and loop boundaries stay exactly in sync.
let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;for(const p of previews)p.render(dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);
status.textContent='样板已加载，动作同步播放。';
window.__uniformCompare=()=>({animation,finite:previews.every(p=>p.character.clothes.filter(m=>m.isSkinnedMesh).every(m=>m.geometry.attributes.position.array.every(Number.isFinite))),outfits:previews.map(p=>p.character.outfit)});
