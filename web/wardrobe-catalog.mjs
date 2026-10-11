export const CATEGORIES = [
 ['hat','帽子'],['hair','头发'],['face','脸型'],['eyes','眼睛'],['brows','眉毛'],
 ['nose','鼻子'],['mouth','嘴'],['shirt','上衣'],['pants','裤子'],['shoes','鞋'],
].map(([id,label])=>({id,label}));
const entries = [
 ['hat','hat-none','不戴帽子',0],['hat','hat-cap','蓝色警帽',0],['hat','hat-helmet','白色机动头盔',60],
 ['hair','hair-short','短发',0],['hair','hair-parted','侧分短发',150],
 ['face','face-standard','标准脸',0],['face','face-round','圆润脸',660],
 ['eyes','eyes-bright','明亮眼',0],['eyes','eyes-calm','沉稳眼',450],
 ['brows','brows-natural','自然眉',0],['brows','brows-straight','平直眉',150],
 ['nose','nose-small','小鼻',0],['nose','nose-round','圆鼻',660],
 ['mouth','mouth-smile','自然微笑',0],['mouth','mouth-happy','开朗微笑',450],
 ['shirt','shirt-duty','蓝色执勤上衣',0],['shirt','shirt-jacket','深蓝巡逻外套',280],
 ['pants','pants-duty','深色执勤裤',0],['pants','pants-patrol','藏蓝巡逻裤',280],
 ['shoes','shoes-duty','黑色执勤鞋',0],['shoes','shoes-boots','深色短靴',60],
];
export const ITEMS=entries.map(([category,id,label,requiredXP])=>({category,id,label,requiredXP,resource:['shirt','pants','shoes'].includes(category)?'assets/wardrobe/parts.json':'procedural',compatibility:'all-first-edition'}));
export const DEFAULT_OUTFIT=Object.fromEntries(CATEGORIES.map(c=>[c.id,ITEMS.find(i=>i.category===c.id).id]));
DEFAULT_OUTFIT.hat='hat-cap';
export function itemById(id) { return ITEMS.find(i=>i.id===id); }
export function compatibilityIssues(outfit) {
 return CATEGORIES.flatMap(c=>itemById(outfit?.[c.id])?.category===c.id?[]:[`${c.label}选项无效`]);
}
