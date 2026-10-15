// 与当前 Kenney 模型共用比例和动画；所有资源离线可用。
export const SCENES = [
  { id: 'city', name: '城市街道', note: '彩色街区 · 午后阳光', icon: '🏙️' },
  { id: 'forest', name: '林间小镇', note: '松林木屋 · 林荫小路', icon: '🌲' },
  { id: 'coast', name: '海滨大道', note: '碧蓝海岸 · 棕榈长廊', icon: '🌴' },
  { id:'dalian', name:'中国 · 大连', note:'跨海大桥 · 星海广场', icon:'🌉' },
  { id:'tokyo', name:'日本 · 东京', note:'樱花木屋 · 琴笛小调', icon:'🌸' },
  { id:'paris', name:'法国 · 巴黎', note:'铁塔咖啡馆 · 圆舞曲', icon:'🗼' },
  { id:'rio', name:'巴西 · 里约', note:'海岸彩屋 · 桑巴节拍', icon:'🌴' },
  { id:'newyork', name:'美国 · 纽约', note:'砖楼黄出租 · 爵士放克', icon:'🚕' },
  { id:'manarola', name:'意大利 · 马纳罗拉', note:'五渔村彩屋 · 曼陀铃', icon:'⛵' },
  { id:'dresden', name:'德国 · 德累斯顿', note:'穹顶与宫殿 · 室内乐', icon:'🏛️' },
];
export const OFFICERS = [
  { id: 'classic', name: '经典警察', note: '原版搭档', icon: '👮' },
  { id: 'patrol', name: '巡逻警察', note: '警帽 · 金色徽章', icon: '⭐' },
  { id: 'motor', name: '机动警察', note: '头盔 · 护目镜', icon: '🪖' },
];
export function validChoice(items, id) { return items.some(item => item.id === id) ? id : items[0].id; }
