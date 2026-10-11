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
 ['hat','hat-beret','藏蓝贝雷帽',900],['hair','hair-curly','蓬松卷短发',900],
 ['face','face-angular','棱角脸',1550],['eyes','eyes-focused','专注眼',1200],
 ['brows','brows-bold','英气眉',900],['nose','nose-bridge','挺直鼻',1550],
 ['mouth','mouth-grin','含笑嘴',1200],['shirt','shirt-vest','反光执勤马甲',1550],
 ['pants','pants-knee','机动护膝裤',1200],['shoes','shoes-tactical','机动高帮靴',1550],
 ['shoes','shoes-duty','黑色执勤鞋',0],['shoes','shoes-boots','深色短靴',60],
];
export const ITEMS=entries.map(([category,id,label,requiredXP])=>({category,id,label,requiredXP,resource:['shirt','pants','shoes'].includes(category)?'assets/wardrobe/uniforms.json':'procedural',compatibility:'shared-skeleton'}));
export const DEFAULT_OUTFIT=Object.fromEntries(CATEGORIES.map(c=>[c.id,ITEMS.find(i=>i.category===c.id && i.requiredXP===0).id]));
DEFAULT_OUTFIT.hat='hat-cap';
export function itemById(id) { return ITEMS.find(i=>i.id===id); }
export function compatibilityIssues(outfit) {
 return CATEGORIES.flatMap(c=>itemById(outfit?.[c.id])?.category===c.id?[]:[`${c.label}选项无效`]);
}

export const WARDROBE_SAMPLES=[
 {id:'duty',title:'日常执勤',description:'浅蓝短袖 · 翻领领带 · 直筒裤 · 低帮鞋',outfit:{...DEFAULT_OUTFIT}},
 {id:'jacket',title:'巡逻夹克',description:'深蓝长袖 · 立领拉链 · 侧袋裤 · 短靴',outfit:{...DEFAULT_OUTFIT,shirt:'shirt-jacket',pants:'pants-patrol',shoes:'shoes-boots'}},
 {id:'traffic',title:'机动执勤',description:'贝雷帽 · 反光马甲 · 护膝裤 · 高帮靴',outfit:{hat:'hat-beret',hair:'hair-curly',face:'face-angular',eyes:'eyes-focused',brows:'brows-bold',nose:'nose-bridge',mouth:'mouth-grin',shirt:'shirt-vest',pants:'pants-knee',shoes:'shoes-tactical'}},
];
