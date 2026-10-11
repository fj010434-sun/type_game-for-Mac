import {CATEGORIES,ITEMS} from './wardrobe-catalog.mjs';
import {canEquip,levelForXP} from './progression.mjs';
import {WardrobePreview} from './wardrobe-preview.js';
export async function createWardrobeUI({container,progress,onSave,onCancel}) {
 container.innerHTML=`<div class="panel"><h2>警察衣柜</h2><p class="wardrobe-intro">组合你的警察形象。抓到小偷积攒经验，解锁更多装备。</p><div class="wardrobe-layout"><div class="wardrobe-left"><div class="wardrobe-preview"><canvas id="wardrobeCanvas" aria-label="警察三维预览"></canvas></div><div class="wardrobe-controls" id="wardrobeControls"></div><div class="wardrobe-status" id="wardrobeStatus" aria-live="polite"></div></div><div><div class="wardrobe-tabs" id="wardrobeTabs"></div><div class="wardrobe-items" id="wardrobeItems"></div></div></div><div class="wardrobe-footer"><span class="wardrobe-progress" id="wardrobeProgress"></span><button class="btn ghost" id="wardrobeCancel">取消</button><button class="btn" id="wardrobeSave">保存并穿戴</button></div></div>`;
 const $=id=>container.querySelector('#'+id);
 const preview=new WardrobePreview($('wardrobeCanvas'));await preview.load(progress.outfit);
 let draft={...progress.outfit},category='hat',current=progress,opener=null;
 const thumbnails={};
 // 同一组装器生成每件物品的真实预览，包括尚未解锁的款式。
 preview.renderer.setSize(260,200,false);preview.camera.aspect=1.3;preview.camera.updateProjectionMatrix();
 for(const item of ITEMS){preview.setFrame(item.category);preview.setOutfit({...progress.outfit,...(item.category==='hair'?{hat:'hat-none'}:{}),[item.category]:item.id});thumbnails[item.id]=preview.canvas.toDataURL();}
 preview.closeup=false;preview.frame='full';preview.setOutfit(progress.outfit);
 const controls=[['全身',()=>{preview.closeup=false;preview.frame='full';}],['面部近景',()=>{preview.closeup=true;}],['向左转',()=>{preview.angle-=.5;}],['向右转',()=>{preview.angle+=.5;}],['站立',()=>preview.animate('idle')],['跑步',()=>preview.animate('sprint')]];
 for(const [label,action] of controls){const b=document.createElement('button');b.textContent=label;b.type='button';b.onclick=()=>{action();preview.render(0);};$('wardrobeControls').append(b);}
 for(const c of CATEGORIES){const b=document.createElement('button');b.type='button';b.textContent=c.label;b.dataset.category=c.id;b.onclick=()=>{category=c.id;preview.setFrame(category);render();};$('wardrobeTabs').append(b);}
 function render(){
  for(const b of $('wardrobeTabs').children)b.setAttribute('aria-pressed',String(b.dataset.category===category));
  $('wardrobeItems').replaceChildren();
  for(const item of ITEMS.filter(i=>i.category===category)){
   const b=document.createElement('button');b.type='button';b.className='wardrobe-item';b.dataset.item=item.id;b.setAttribute('aria-pressed',String(draft[category]===item.id));
   const img=document.createElement('img');img.src=thumbnails[item.id];img.alt='';
   const name=document.createElement('b');name.textContent=item.label;if(category==='hair'){const hint=document.createElement('span');hint.textContent=' · 无帽展示';hint.className='wardrobe-hair-hint';name.append(hint);}
   const status=document.createElement('small');const locked=current.xp<item.requiredXP;status.className=locked?'wardrobe-lock':'';status.textContent=locked?`🔒 Lv.${levelForXP(item.requiredXP).level} · 还差 ${item.requiredXP-current.xp} 经验`:'已解锁 · 可以穿戴';
   b.append(img,name,status);b.onclick=()=>{draft[category]=item.id;preview.setOutfit(draft);render();};$('wardrobeItems').append(b);
  }
  const eligible=canEquip(draft,current);$('wardrobeSave').disabled=!eligible.ok;
  $('wardrobeStatus').textContent=eligible.ok?'当前搭配可以保存。保存后，追捕中的警察也会穿上这一套。':'仅试穿，尚不能保存：'+eligible.reasons.join('；');
  $('wardrobeProgress').textContent=`Lv.${levelForXP(current.xp).level} · 累计 ${current.xp} 经验`;
 }
 container.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!container.classList.contains('show'))return;
  const buttons=[...container.querySelectorAll('button:not(:disabled)')];
  const first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 function close(){container.classList.remove('show');preview.stop();container.removeAttribute('aria-modal');opener?.focus();}
 $('wardrobeCancel').onclick=()=>{onCancel();close();};
 $('wardrobeSave').onclick=()=>{if(!canEquip(draft,current).ok)return;const result=onSave({...draft});close();if(result?.ok===false)document.getElementById('progressError').textContent=result.error;};
 return {open(progress){current=progress;draft={...progress.outfit};opener=document.activeElement;preview.setOutfit(draft);preview.angle=.15;preview.closeup=false;preview.frame='full';preview.animate('idle');category='hat';render();container.classList.add('show');container.setAttribute('aria-modal','true');container.setAttribute('role','dialog');preview.resize();preview.start();$('wardrobeTabs').firstElementChild.focus();},close,resize(){preview.resize();},dispose(){preview.dispose();},cancel(){onCancel();close();},thumbnail(outfit){preview.setOutfit(outfit);preview.closeup=false;preview.frame='full';preview.angle=.15;preview.render(0);return preview.canvas.toDataURL();}};
}
