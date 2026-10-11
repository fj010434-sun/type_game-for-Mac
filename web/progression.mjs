import {ITEMS,DEFAULT_OUTFIT,CATEGORIES,itemById,compatibilityIssues} from './wardrobe-catalog.mjs';
const THRESHOLDS=[0,60,150,280,450,660];
const KEY='kc-progress-v1';
const zero=()=>({total:0,accuracyBonus:0,comboBonus:0});
const count=n=>Number.isSafeInteger(n)&&n>=0;
export function captureReward({win,correct,wrong,maxCombo,demo}={}) {
 if(!win||demo||![correct,wrong,maxCombo].every(count)||correct===0)return zero();
 const accuracy=correct/(correct+wrong),accuracyBonus=(accuracy>=.9?5:0)+(accuracy>=.97?5:0),comboBonus=maxCombo>=20?5:0;
 return {total:20+accuracyBonus+comboBonus,accuracyBonus,comboBonus};
}
export function levelForXP(xp) {
 xp=count(xp)?xp:0;let index=0;while(index+1<THRESHOLDS.length&&xp>=THRESHOLDS[index+1])index++;
 return {level:index+1,currentThreshold:THRESHOLDS[index],nextThreshold:THRESHOLDS[index+1]??null};
}
export function canEquip(outfit,progress) {
 const reasons=compatibilityIssues(outfit);
 for(const id of Object.values(outfit||{})){const item=itemById(id);if(item&&item.requiredXP>progress.xp)reasons.push(`${item.label}还差 ${item.requiredXP-progress.xp} 经验`);}
 return {ok:reasons.length===0,reasons};
}
export function normalizeProgress(raw) {
 raw=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const xp=count(raw.xp)?raw.xp:0;
 const unlocked=ITEMS.filter(i=>i.requiredXP<=xp).map(i=>i.id);
 const outfit={...DEFAULT_OUTFIT};
 for(const c of CATEGORIES){const item=itemById(raw.outfit?.[c.id]);if(item?.category===c.id&&unlocked.includes(item.id))outfit[c.id]=item.id;}
 const awardedRounds=Array.isArray(raw.awardedRounds)?[...new Set(raw.awardedRounds.filter(id=>typeof id==='string'&&id.length>0&&id.length<=128))].slice(-100):[];
 return {version:1,xp,unlocked,outfit,awardedRounds,active:raw.active===true};
}
export function awardCapture(progress,roundId,stats) {
 const before=normalizeProgress(progress),reward=captureReward(stats);
 if(typeof roundId!=='string'||!roundId||roundId.length>128||before.awardedRounds.includes(roundId)||!reward.total)
  return {progress:before,reward:zero(),newlyUnlocked:[],changed:false};
 const after=normalizeProgress({...before,xp:Math.min(Number.MAX_SAFE_INTEGER,before.xp+reward.total),awardedRounds:[...before.awardedRounds,roundId]});
 return {progress:after,reward,newlyUnlocked:ITEMS.filter(i=>after.unlocked.includes(i.id)&&!before.unlocked.includes(i.id)),changed:true};
}
export function loadProgress(storage) {try{return normalizeProgress(JSON.parse(storage.getItem(KEY)||'null'));}catch{return normalizeProgress(null);}}
export function saveProgress(storage,progress) {try{storage.setItem(KEY,JSON.stringify(normalizeProgress(progress)));return {ok:true,error:null};}catch{return {ok:false,error:'本次进度未保存，请检查可用存储空间。'};}}
