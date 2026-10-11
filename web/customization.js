// 与当前 Kenney 模型共用比例和动画；所有资源离线可用。
export const SCENES = [
  { id: 'city', name: '城市街道', note: '彩色街区 · 午后阳光', icon: '🏙️' },
  { id: 'forest', name: '林间小镇', note: '松林木屋 · 林荫小路', icon: '🌲' },
  { id: 'coast', name: '海滨大道', note: '碧蓝海岸 · 棕榈长廊', icon: '🌴' },
];
export const OFFICERS = [
  { id: 'classic', name: '经典警察', note: '原版搭档', icon: '👮' },
  { id: 'patrol', name: '巡逻警察', note: '警帽 · 金色徽章', icon: '⭐' },
  { id: 'motor', name: '机动警察', note: '头盔 · 护目镜', icon: '🪖' },
];
export function validChoice(items, id) { return items.some(item => item.id === id) ? id : items[0].id; }
