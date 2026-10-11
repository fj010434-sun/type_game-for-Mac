import { CATEGORIES, ITEMS, DEFAULT_OUTFIT } from './wardrobe-catalog.mjs';
import { WardrobePreview } from './wardrobe-preview.js';
const outfit={...DEFAULT_OUTFIT};const preview=new WardrobePreview(document.getElementById('preview'));
await preview.load(outfit);preview.start();
const buttons=[];
for(const c of CATEGORIES){const section=document.createElement('section');section.dataset.category=c.id;const h=document.createElement('h3');h.textContent=c.label;section.append(h);
 for(const item of ITEMS.filter(i=>i.category===c.id)){const b=document.createElement('button');b.textContent=item.label;b.onclick=()=>{outfit[c.id]=item.id;preview.setOutfit(outfit);refresh();};b.dataset.item=item.id;section.append(b);buttons.push(b);}document.getElementById('categories').append(section);
}
function refresh(){for(const b of buttons)b.setAttribute('aria-pressed',String(Object.values(outfit).includes(b.dataset.item)));}refresh();
for(const [label,action] of [['全身',()=>preview.closeup=false],['面部近景',()=>preview.closeup=true],['向左转',()=>preview.angle-=.6],['向右转',()=>preview.angle+=.6],['站立',()=>preview.animate('idle')],['跑步',()=>preview.animate('sprint')]]){
 const b=document.createElement('button');b.textContent=label;b.onclick=action;document.getElementById('controls').append(b);
}
document.getElementById('status').textContent='人物已加载，可自由组合与查看动画。';
window.__wardrobeSample=()=>({outfit:{...outfit},animation:preview.animation,headCount:preview.character.model.getObjectsByProperty('name','wardrobe-head').length,partCount:Object.keys(preview.character.outfit).length,finite:preview.character.model.getObjectsByProperty('isSkinnedMesh',true).every(m=>m.geometry.attributes.position.array.every(Number.isFinite))});
