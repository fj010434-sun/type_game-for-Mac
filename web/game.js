// 键盘小警察 · 3D 版：游戏逻辑、HUD、声音
import { World, COP_X, THIEF_X } from './world.js';
import { SCENES, OFFICERS, validChoice } from './customization.js';
let previews = null;

// ---------- 关卡与难度 ----------
const LESSONS = [
  { id: 'home',   icon: '🏠', name: '基准键',     desc: 'A S D F J K L ;', chars: 'asdfjkl;' },
  { id: 'home2',  icon: '👉', name: '加上 G H',   desc: '食指往中间伸',     chars: 'asdfghjkl', focus: 'gh' },
  { id: 'top',    icon: '⬆️', name: '上排键',     desc: 'Q W E R T Y U I O P', chars: 'qwertyuiop', mix: 'asdfjkl' },
  { id: 'bottom', icon: '⬇️', name: '下排键',     desc: 'Z X C V B N M',   chars: 'zxcvbnm', mix: 'asdfjkl' },
  { id: 'all',    icon: '🔤', name: '全部字母',   desc: 'A — Z 大混合',     chars: 'abcdefghijklmnopqrstuvwxyz' },
  { id: 'words',  icon: '🐶', name: '英文单词',   desc: 'cat dog sun …',
    words: 'cat dog sun red big run sit cup hat pen box fox egg map bus car bee fish bird book milk cake star moon tree frog duck lion bear ball home blue pink jump play good look rain snow apple happy water green zoo kite'.split(' ') },
  { id: 'pinyin', icon: '🀄', name: '拼音音节',   desc: 'ma ba ni hao …',
    words: 'ma ba pa da ta ni hao wo ai mama baba xue xiao shu hua tian di ren kou shou er mu huo shan shui ri yue niao yu da xiao shang xia zuo you lai qu peng you lao shi'.split(' ') },
  { id: 'num',    icon: '🔢', name: '数字键',     desc: '1 2 3 … 0',        chars: '1234567890', mix: 'asdfjkl' },
];

const DIFFS = [
  { name: '🐢 慢慢跑', tip: '刚开始学', escape: 0.22 },
  { name: '🐇 一般快', tip: '已经熟悉了', escape: 0.45 },
  { name: '🚀 飞毛腿', tip: '打字小高手', escape: 0.8 },
];

const START_GAP = 26;   // 开始时相距（米）
const MAX_GAP = 60;     // 超过就让小偷跑掉
const CATCH_GAP = 1.8;
const STEP = 0.95;      // 每敲对一个字往前追多少米
const MISS_PENALTY = 1.2;
const THIEF_SPEED = 6.5; // 画面里的跑动速度（只影响视觉）

// ---------- 键位与手指 ----------
const FINGERS = {
  lp: { name: '左手小指', color: '#f9a8d4' },
  lr: { name: '左手无名指', color: '#fdba74' },
  lm: { name: '左手中指', color: '#fde047' },
  li: { name: '左手食指', color: '#86efac' },
  ri: { name: '右手食指', color: '#7dd3fc' },
  rm: { name: '右手中指', color: '#fde047' },
  rr: { name: '右手无名指', color: '#fdba74' },
  rp: { name: '右手小指', color: '#f9a8d4' },
  th: { name: '大拇指', color: '#d8b4fe' },
};
const KB_ROWS = [
  [['`','lp'],['1','lp'],['2','lr'],['3','lm'],['4','li'],['5','li'],['6','ri'],['7','ri'],['8','rm'],['9','rr'],['0','rp'],['-','rp'],['=','rp'],['⌫','rp',1.6]],
  [['⇥','lp',1.5],['q','lp'],['w','lr'],['e','lm'],['r','li'],['t','li'],['y','ri'],['u','ri'],['i','rm'],['o','rr'],['p','rp'],['[','rp'],[']','rp'],['\\','rp',1.1]],
  [['⇪','lp',1.8],['a','lp'],['s','lr'],['d','lm'],['f','li'],['g','li'],['h','ri'],['j','ri'],['k','rm'],['l','rr'],[';','rp'],["'",'rp'],['↩','rp',1.8]],
  [['⇧','lp',2.3],['z','lp'],['x','lr'],['c','lm'],['v','li'],['b','li'],['n','ri'],['m','ri'],[',','rm'],['.','rr'],['/','rp'],['⇧','rp',2.3]],
  [[' ','th',6.5]],
];

function codeToChar(code) {
  if (code.startsWith('Key')) return code.slice(3).toLowerCase();
  if (code.startsWith('Digit')) return code.slice(5);
  return { Space: ' ', Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Quote: "'", Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Backquote: '`' }[code] || null;
}

// ---------- 小工具 ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function store(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; } }

// ---------- 声音：Kenney 音效 + 程序生成的背景音乐 ----------
let AC = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
function audio() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    master = AC.createGain(); master.connect(AC.destination);
    sfxBus = AC.createGain(); sfxBus.connect(master);
    musicBus = AC.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    loadSfx();
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
const SFX_FILES = ['hit1', 'hit2', 'miss', 'combo', 'tick', 'go', 'click', 'select', 'line', 'step0', 'step1', 'step2', 'step3', 'catch', 'cuff', 'stumble'];
const sfxBuf = {};
function loadSfx() {
  SFX_FILES.forEach(async n => {
    try { sfxBuf[n] = await AC.decodeAudioData(await (await fetch(`assets/sfx/${n}.m4a`)).arrayBuffer()); } catch (e) { /* 缺音效就静音 */ }
  });
}
function sfx(name, vol = 0.6, rate = 1, when = 0) {
  if (!AC || !sfxBuf[name]) return;
  const s = AC.createBufferSource(); s.buffer = sfxBuf[name]; s.playbackRate.value = rate;
  const g = AC.createGain(); g.gain.value = vol;
  s.connect(g).connect(sfxBus); s.start(AC.currentTime + when);
}
function tone(freq, dur, type = 'sine', vol = 0.15, when = 0, slide = 0, bus) {
  if (!AC) return;
  const t0 = AC.currentTime + when;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus || sfxBus); o.start(t0); o.stop(t0 + dur + 0.05);
}
const SFX = {
  hit(combo) { sfx(combo % 2 ? 'hit1' : 'hit2', 0.55, 1 + Math.min(combo, 30) * 0.012); },
  miss() { sfx('miss', 0.5); sfx('stumble', 0.35); },
  combo() { sfx('combo', 0.6); },
  line() { sfx('line', 0.45); },
  step() { sfx('step' + Math.floor(Math.random() * 4), 0.18, 0.9 + Math.random() * 0.2); },
  go() { sfx('go', 0.7); },
  beep() { sfx('tick', 0.7); },
  click() { sfx('click', 0.5); },
  select() { sfx('select', 0.4); },
  whistle() { tone(2300, 0.22, 'sine', 0.07, 0, 1.12); tone(2300, 0.4, 'sine', 0.07, 0.28, 1.08); },
  win() {
    sfx('catch', 0.8); sfx('cuff', 0.7, 1, 0.45);
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.22, 'triangle', 0.13, 0.6 + i * 0.11); tone(f / 2, 0.22, 'square', 0.03, 0.6 + i * 0.11); });
  },
  lose() { [523, 466, 415, 392].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.22, i === 3 ? 0.9 : 0)); },
};

// 背景音乐：C–Am–F–G 的轻快追逐小调
const Music = {
  on: true, timer: null, step: 0, next: 0, bpm: 138,
  chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
  lead: [0, 2, 1, 2, 0, 2, 1, 2],
  start() {
    if (!AC || this.timer) return;
    this.next = AC.currentTime + 0.05;
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
  setLevel(v) { if (musicBus) musicBus.gain.setTargetAtTime(this.on ? v : 0, AC.currentTime, 0.3); },
  tick() {
    const sp = 60 / this.bpm / 4;
    while (this.next < AC.currentTime + 0.15) { this.play(this.step, this.next); this.next += sp; this.step++; }
  },
  play(step, t) {
    const when = t - AC.currentTime;
    const s16 = step % 16, chord = this.chords[Math.floor(step / 16) % 4];
    const f = m => 440 * Math.pow(2, (m - 69) / 12);
    if (s16 % 4 === 0) tone(f(chord[0] - 12), 0.22, 'triangle', 0.5, when, 0, musicBus);
    if (s16 % 4 === 2) tone(f(chord[0]), 0.12, 'triangle', 0.3, when, 0, musicBus);
    if (s16 % 2 === 0) tone(f(chord[this.lead[(s16 / 2) % 8]] + 24), 0.14, 'square', 0.07, when, 0, musicBus);
    if (s16 === 0 || s16 === 8) tone(150, 0.15, 'sine', 0.6, when, 0.3, musicBus);
    if (s16 === 4 || s16 === 12) this.noise(when, 0.12, 0.25, 1800);
    if (s16 % 2 === 1) this.noise(when, 0.03, 0.08, 7000);
  },
  noise(when, dur, vol, hp) {
    const s = AC.createBufferSource(); s.buffer = noiseBuf;
    const fl = AC.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = hp;
    const g = AC.createGain(); const t0 = AC.currentTime + when;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl).connect(g).connect(musicBus); s.start(t0); s.stop(t0 + dur + 0.02);
  },
};

// ---------- 画布 ----------
const glCanvas = document.getElementById('gl');
const hud = document.getElementById('hud');
const ctx = hud.getContext('2d');
let W = 0, H = 0, DPR = 1;
const world = new World(glCanvas);
function resize() {
  DPR = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  hud.width = W * DPR; hud.height = H * DPR;
  world.resize(W, H);
}
window.addEventListener('resize', resize);
resize();

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

function speechBubble(x, y, text, size = 18) {
  ctx.font = `bold ${size}px -apple-system, "PingFang SC", sans-serif`;
  const w = ctx.measureText(text).width + 24, h = size + 18;
  const bx = clamp(x - w / 2, 8, W - w - 8), by = y - h - 12;
  ctx.fillStyle = 'white'; ctx.strokeStyle = '#1f2a44'; ctx.lineWidth = 2.5;
  rr(bx, by, w, h, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 7, by + h - 1); ctx.lineTo(x, by + h + 10); ctx.lineTo(x + 7, by + h - 1); ctx.fillStyle = 'white'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 7, by + h); ctx.lineTo(x, by + h + 10); ctx.lineTo(x + 7, by + h); ctx.stroke();
  ctx.fillStyle = '#1f2a44'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, by + h / 2 + 1); ctx.textBaseline = 'alphabetic';
}

// ---------- 游戏状态 ----------
const G = {
  state: 'loading', // loading | menu | ready | play | caught | escaped | pause
  lesson: 0, diff: 0,
  line: '', next: '', idx: 0,
  gap: START_GAP, shown: 14,
  thiefDist: 40,
  correct: 0, wrong: 0, combo: 0, maxCombo: 0,
  playTime: 0, timer: 0,
  wrongFlash: 0, keyPress: null, keyPressT: 0,
  confetti: [], floats: [],
  thiefSay: '', thiefSayT: 0, copSay: '', copSayT: 0, sayCd: 4,
  stumble: 0, sprint: 0, stepT: 0, snap: true,
};

const saved = store('kc-settings') || {};
G.lesson = clamp(saved.lesson | 0, 0, LESSONS.length - 1);
G.diff = clamp(saved.diff | 0, 0, DIFFS.length - 1);
G.scene = validChoice(SCENES, saved.scene);
G.officer = validChoice(OFFICERS, saved.officer);
Music.on = saved.music !== false;
const best = store('kc-best') || {};

function makeLine() {
  const L = LESSONS[G.lesson];
  const parts = [];
  let len = 0;
  while (len < 22) {
    let w = '';
    if (L.words) w = pick(L.words);
    else {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        let pool = L.chars;
        if (L.mix && Math.random() < 0.25) pool = L.mix;
        if (L.focus && Math.random() < 0.35) pool = L.focus;
        w += pool[Math.floor(Math.random() * pool.length)];
      }
    }
    if (len + w.length + 1 > 28 && parts.length) break;
    parts.push(w); len += w.length + 1;
  }
  return parts.join(' ');
}

function startGame() {
  audio(); Music.start(); Music.setLevel(0.55);
  SFX.click();
  saveSettings();
  world.setAppearance(G.scene, G.officer);
  hideAll();
  Object.assign(G, {
    state: 'ready', timer: 2.99, gap: START_GAP, shown: START_GAP, idx: 0,
    correct: 0, wrong: 0, combo: 0, maxCombo: 0, playTime: 0, resultShown: false,
    confetti: [], floats: [], stumble: 0, sprint: 0, snap: true,
    thiefSay: '嘿嘿，来追我呀！', thiefSayT: 3, copSay: '', copSayT: 0, sayCd: 6,
  });
  G.line = makeLine(); G.next = makeLine();
  G.lastCount = 4;
}

function hit(ch) {
  const expected = G.line[G.idx];
  G.keyPress = ch; G.keyPressT = 0.15;
  if (ch === expected) {
    G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const bonus = G.combo >= 20 ? 1.35 : G.combo >= 10 ? 1.15 : 1;
    G.gap -= STEP * bonus;
    G.idx++;
    SFX.hit(G.combo);
    world.puff(COP_X, -(G.thiefDist - G.shown), 2);
    if (G.combo > 0 && G.combo % 10 === 0) {
      SFX.combo(); G.sprint = 1.6;
      G.floats.push({ text: `${G.combo} 连击！加速！`, t: 1.4, color: '#ff8a3d' });
      G.copSay = pick(['冲呀！', '站住！别跑！', '我来啦！', '看我的飞毛腿！']); G.copSayT = 1.6;
    }
    if (G.idx >= G.line.length) {
      G.line = G.next; G.next = makeLine(); G.idx = 0;
      SFX.line();
      G.floats.push({ text: '一行完成 ✓', t: 1, color: '#2e9d4a' });
    }
  } else {
    G.wrong++; G.combo = 0;
    G.gap += MISS_PENALTY;
    G.wrongFlash = 0.35; G.stumble = 0.45;
    SFX.miss();
    if (Math.random() < 0.4) { G.thiefSay = pick(['哈哈，按错啦！', '嘿嘿～', '慢点慢点～']); G.thiefSayT = 1.4; }
  }
}

function update(dt) {
  G.keyPressT = Math.max(0, G.keyPressT - dt);
  G.wrongFlash = Math.max(0, G.wrongFlash - dt);
  G.thiefSayT -= dt; G.copSayT -= dt;
  G.stumble = Math.max(0, G.stumble - dt);
  G.sprint = Math.max(0, G.sprint - dt);
  const d = DIFFS[G.diff];

  if (G.state === 'menu' || G.state === 'loading') {
    G.thiefDist += 5.5 * dt;
    G.shown = lerp(G.shown, 9 + Math.sin(performance.now() / 2500) * 3, dt);
  } else if (G.state === 'ready') {
    G.timer -= dt;
    const c = Math.ceil(G.timer);
    if (c !== G.lastCount && c >= 1 && c <= 3) { SFX.beep(); G.lastCount = c; }
    if (G.timer <= 0) { G.state = 'play'; SFX.go(); SFX.whistle(); G.copSay = '站住！别跑！'; G.copSayT = 1.5; }
    G.shown = lerp(G.shown, G.gap, Math.min(1, dt * 4));
  } else if (G.state === 'play') {
    G.playTime += dt;
    G.gap += d.escape * dt;
    G.shown = lerp(G.shown, G.gap, Math.min(1, dt * 5));
    G.thiefDist += THIEF_SPEED * dt;
    G.sayCd -= dt;
    G.stepT -= dt;
    if (G.stepT <= 0) { SFX.step(); G.stepT = G.stumble > 0 ? 0.4 : 0.19; }
    if (G.sayCd <= 0 && G.thiefSayT <= 0) {
      G.sayCd = 7 + Math.random() * 5;
      G.thiefSay = G.gap < 8 ? pick(['糟糕，要被追上了！', '别追了别追了！', '跑不动了…']) : pick(['你追不上我～', '我跑得可快啦！', '来呀来呀～', '宝石是我的！']);
      G.thiefSayT = 2.2;
    }
    if (G.gap <= CATCH_GAP) {
      G.state = 'caught'; G.timer = 0; SFX.win(); Music.setLevel(0.15);
      G.thiefSay = '哎呀，被抓住了！'; G.thiefSayT = 3.5; G.copSay = '抓到你啦！'; G.copSayT = 3.5;
      const colors = ['#ff5252', '#ffd23f', '#2f6fec', '#43a047', '#ea80fc', '#ff8a3d'];
      for (let i = 0; i < 140; i++) G.confetti.push({ x: Math.random() * W, y: -Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160, rot: Math.random() * 6, life: 4.5, c: pick(colors) });
    } else if (G.gap >= MAX_GAP) {
      G.state = 'escaped'; G.timer = 0; SFX.lose(); Music.setLevel(0.15);
      G.thiefSay = '拜拜啦～'; G.thiefSayT = 3;
    }
  } else if (G.state === 'caught') {
    G.timer += dt;
    G.gap = lerp(G.gap, CATCH_GAP * 0.8, Math.min(1, dt * 3)); G.shown = G.gap;
    G.thiefDist += THIEF_SPEED * dt * Math.max(0, 1 - G.timer * 1.5);
    if (G.timer > 2.6 && !G.resultShown) showResult(true);
  } else if (G.state === 'escaped') {
    G.timer += dt;
    G.thiefDist += THIEF_SPEED * 1.8 * dt;
    G.shown += THIEF_SPEED * 1.8 * dt;
    if (G.timer > 2.2 && !G.resultShown) showResult(false);
  }
  for (const p of G.confetti) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 5; }
  G.confetti = G.confetti.filter(p => p.life > 0);
  for (const f of G.floats) f.t -= dt;
  G.floats = G.floats.filter(f => f.t > 0);
}

// 每帧告诉 3D 世界角色该怎么动
function worldState() {
  const st = G.state === 'pause' ? G.prevState : G.state;
  let copAnim = { name: 'sprint', speed: 1 }, thiefAnim = { name: 'sprint', speed: 1 };
  let thiefFace = 0, thiefLook = 0;
  if (st === 'ready') {
    copAnim = { name: 'idle' };
    thiefAnim = { name: G.timer > 1 ? 'emote-yes' : 'idle' };
    thiefFace = Math.PI;
  } else if (st === 'play') {
    copAnim = G.stumble > 0 ? { name: 'walk', speed: 1.2 } : { name: 'sprint', speed: 1 + (G.sprint > 0 ? 0.35 : 0) + Math.min(G.combo, 20) * 0.01 };
    thiefLook = G.thiefSayT > 0 ? Math.min(1, (2.2 - Math.abs(G.thiefSayT - 1.1) * 2) ) : 0;
  } else if (st === 'caught') {
    copAnim = G.timer < 0.5 ? { name: 'sprint' } : G.timer < 1.3 ? { name: 'interact-right', loop: false } : { name: 'emote-yes' };
    thiefAnim = G.timer < 0.5 ? { name: 'sprint' } : { name: 'emote-no' };
    thiefFace = G.timer < 0.5 ? 0 : Math.PI;
  } else if (st === 'escaped') {
    copAnim = G.timer < 0.4 ? { name: 'sprint' } : { name: 'emote-no' };
    thiefAnim = { name: 'sprint', speed: 1.4 };
  }
  const anyPaused = G.state === 'pause';
  return {
    copDist: G.thiefDist - G.shown,
    thiefDist: G.thiefDist,
    thiefX: st === 'caught' ? THIEF_X - 0.6 : THIEF_X + 0.5 * Math.sin(G.thiefDist * 0.05),
    thiefFace, thiefLook: Math.max(0, thiefLook),
    mode: st, timer: G.timer,
    copAnim, thiefAnim, paused: anyPaused,
    shake: G.stumble, snap: G.snap,
  };
}

// ---------- 画 HUD ----------
function drawPrompt() {
  if (G.state === 'menu' || G.state === 'loading' || G.state === 'caught' || G.state === 'escaped') return;
  const pw = Math.min(980, W - 40), ph = Math.max(96, H * 0.13);
  const px = (W - pw) / 2, py = 14;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  rr(px, py, pw, ph, 22); ctx.fill();
  ctx.shadowColor = 'transparent';
  const line = G.line;
  const fs = Math.min(48, (pw - 60) / (line.length * 0.66), ph * 0.48);
  ctx.font = `bold ${fs}px ui-monospace, Menlo, monospace`;
  const cw = fs * 0.66;
  const x = W / 2 - cw * line.length / 2;
  const y = py + ph * 0.48;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const cx = x + cw * i + cw / 2;
    if (i === G.idx) {
      const bounce = Math.sin(performance.now() / 150) * 3;
      const wrong = G.wrongFlash > 0;
      const shake = wrong ? Math.sin(performance.now() / 20) * 4 : 0;
      ctx.fillStyle = wrong ? '#ff5252' : '#2f6fec';
      rr(cx - cw * 0.48 + shake, y - fs * 0.62 + bounce, cw * 0.96, fs * 1.24, 10); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(ch === ' ' ? '␣' : ch, cx + shake, y + bounce);
    } else if (i < G.idx) {
      ctx.fillStyle = '#2e9d4a';
      ctx.fillText(ch === ' ' ? '' : ch, cx, y);
    } else if (ch === ' ') {
      ctx.fillStyle = '#c3cbe0'; ctx.fillText('·', cx, y);
    } else {
      ctx.fillStyle = '#1f2a44'; ctx.fillText(ch, cx, y);
    }
  }
  ctx.font = `600 ${Math.max(14, fs * 0.4)}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = '#a3afcb';
  ctx.fillText('下一行：' + G.next, W / 2, py + ph * 0.86);
  ctx.textBaseline = 'alphabetic';

  // 右侧竖直的追捕进度条：小偷在顶上，警察往上爬
  const bx = W - 44, top = py + ph + 30, bot = Math.min(H * 0.62, top + 340), bh = bot - top;
  const prog = clamp(1 - (G.shown - CATCH_GAP) / (MAX_GAP - CATCH_GAP), 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; rr(bx - 22, top - 26, 44, bh + 52, 22); ctx.fill();
  ctx.fillStyle = '#e3e9f7'; rr(bx - 5, top, 10, bh, 5); ctx.fill();
  ctx.fillStyle = G.shown > MAX_GAP * 0.75 ? '#ff5252' : '#2f6fec';
  rr(bx - 5, bot - bh * prog, 10, bh * prog, 5); ctx.fill();
  ctx.font = '26px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🦹', bx, top - 8);
  ctx.fillText('👮', bx, bot - bh * prog);
  ctx.textBaseline = 'alphabetic';
  const by = py + ph + 14;

  // 左上统计
  const kpm = Math.round(G.correct / (Math.max(G.playTime, 1) / 60));
  const acc = G.correct + G.wrong ? Math.round(G.correct / (G.correct + G.wrong) * 100) : 100;
  ctx.font = 'bold 16px -apple-system, "PingFang SC", sans-serif'; ctx.textAlign = 'left';
  const items = [`⚡ ${kpm} 字/分`, `🎯 ${acc}%`, `🔥 连击 ${G.combo}`, `📏 还差 ${Math.max(0, Math.round(G.shown - CATCH_GAP))} 米`];
  items.forEach((t, i) => {
    const iy = by + 26 + i * 32;
    if (iy > H * 0.6) return;
    ctx.fillStyle = 'rgba(255,255,255,0.88)'; rr(16, iy - 20, 150, 28, 14); ctx.fill();
    ctx.fillStyle = '#1f2a44'; ctx.fillText(t, 28, iy);
  });
}

function drawKeyboard() {
  if (G.state !== 'play' && G.state !== 'ready' && !(G.state === 'pause' && G.prevState === 'play')) return;
  const units = 15.2;
  const u = Math.min((W - 40) / units, H * 0.27 / 5.4);
  const kw = u * units;
  const x0 = (W - kw) / 2, y0 = H - u * 5.4 - 12;
  ctx.fillStyle = 'rgba(31,42,68,0.6)';
  rr(x0 - u * 0.25, y0 - u * 0.25, kw + u * 0.5, u * 5.35, u * 0.4); ctx.fill();
  const target = G.state === 'play' || G.state === 'ready' ? G.line[G.idx] : null;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 160);
  let targetFinger = null;
  KB_ROWS.forEach((row, r) => {
    let x = r === 4 ? x0 + u * 4.2 : x0;
    row.forEach(([k, f, w = 1]) => {
      const kx = x + u * 0.05, ky = y0 + r * u + u * 0.05, kww = u * w - u * 0.1, kh = u * 0.9;
      const isTarget = k === target;
      const pressed = G.keyPressT > 0 && G.keyPress === k;
      ctx.fillStyle = isTarget ? '#ffffff' : FINGERS[f].color;
      ctx.globalAlpha = isTarget ? 1 : 0.9;
      rr(kx, ky + (pressed ? 2 : 0), kww, kh, u * 0.15); ctx.fill();
      ctx.globalAlpha = 1;
      if (isTarget) {
        targetFinger = f;
        ctx.strokeStyle = `rgba(47,111,236,${0.6 + pulse * 0.4})`; ctx.lineWidth = 3 + pulse * 3;
        rr(kx - 2, ky - 2, kww + 4, kh + 4, u * 0.18); ctx.stroke();
      }
      ctx.fillStyle = '#1f2a44';
      ctx.font = `bold ${u * (k.length > 1 ? 0.36 : 0.42)}px -apple-system, ui-monospace, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k === ' ' ? '空格 space' : k.toUpperCase(), kx + kww / 2, ky + kh / 2 + (pressed ? 2 : 0));
      if (k === 'f' || k === 'j') ctx.fillRect(kx + kww / 2 - u * 0.12, ky + kh * 0.8, u * 0.24, 2.5);
      x += u * w;
    });
  });
  ctx.textBaseline = 'alphabetic';
  if (targetFinger && G.state === 'play') {
    const t = `用「${FINGERS[targetFinger].name}」按 ${target === ' ' ? '空格' : target.toUpperCase()}`;
    ctx.font = `bold ${Math.max(16, u * 0.42)}px -apple-system, "PingFang SC", sans-serif`;
    const tw = ctx.measureText(t).width + 30;
    ctx.fillStyle = FINGERS[targetFinger].color;
    rr(W / 2 - tw / 2, y0 - u * 1.05, tw, u * 0.68, u * 0.34); ctx.fill();
    ctx.fillStyle = '#1f2a44'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t, W / 2, y0 - u * 0.71); ctx.textBaseline = 'alphabetic';
  }
}

function drawOverlayFx() {
  if (G.sprint > 0 && G.state === 'play') {
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.7, G.sprint * 0.5)})`; ctx.lineWidth = 3;
    for (let i = 0; i < 28; i++) {
      const a = hash(i + Math.floor(performance.now() / 60)) * Math.PI * 2;
      const r1 = Math.max(W, H) * (0.32 + hash(i * 3) * 0.2), r2 = r1 + 90;
      ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, H * 0.42 + Math.sin(a) * r1 * 0.6); ctx.lineTo(W / 2 + Math.cos(a) * r2, H * 0.42 + Math.sin(a) * r2 * 0.6); ctx.stroke();
    }
  }
  if (G.wrongFlash > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
    g.addColorStop(0, 'rgba(255,60,60,0)'); g.addColorStop(1, `rgba(255,60,60,${G.wrongFlash * 1.2})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  G.floats.forEach((f, i) => {
    ctx.globalAlpha = Math.min(1, f.t * 2);
    ctx.font = 'bold 34px -apple-system, "PingFang SC", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 6; ctx.strokeStyle = 'white';
    const y = H * 0.45 - (1.4 - f.t) * 40 - i * 40;
    ctx.strokeText(f.text, W / 2, y); ctx.fillStyle = f.color; ctx.fillText(f.text, W / 2, y);
    ctx.globalAlpha = 1;
  });
  for (const p of G.confetti) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = p.c; ctx.fillRect(-5, -3, 10, 6); ctx.restore();
  }
  if (G.state === 'ready') {
    const c = Math.ceil(G.timer);
    const txt = c >= 1 ? String(c) : '追！';
    const frac = G.timer - Math.floor(G.timer);
    // 倒计时放在偏下的位置，不挡住正在挑衅的小偷
    const cy = H * 0.5;
    ctx.font = `900 ${90 + frac * 30}px -apple-system, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = 'white'; ctx.strokeText(txt, W / 2, cy);
    ctx.fillStyle = '#ff8a3d'; ctx.fillText(txt, W / 2, cy); ctx.textBaseline = 'alphabetic';
    const tip = '左手放 A S D F，右手放 J K L ;';
    ctx.font = 'bold 22px -apple-system, "PingFang SC", sans-serif';
    ctx.lineWidth = 5; ctx.strokeText(tip, W / 2, cy + 70);
    ctx.fillStyle = '#1f2a44'; ctx.fillText(tip, W / 2, cy + 70);
  }
}

function drawLabels() {
  if (G.state === 'menu' || G.state === 'loading') return;
  const tp = world.project(world.thief, 3.0, W, H);
  if (tp.visible) {
    if (G.thiefSayT > 0) speechBubble(tp.x, tp.y, G.thiefSay, 18);
    else if (G.state === 'play' || G.state === 'ready') {
      ctx.font = 'bold 15px -apple-system, "PingFang SC", sans-serif'; ctx.textAlign = 'center';
      const txt = `小偷 ${Math.round(G.shown)}m`;
      const tw = ctx.measureText(txt).width + 16;
      ctx.fillStyle = 'rgba(198,40,40,0.92)'; rr(tp.x - tw / 2, tp.y - 26, tw, 22, 11); ctx.fill();
      ctx.fillStyle = 'white'; ctx.fillText(txt, tp.x, tp.y - 10);
      ctx.fillStyle = 'rgba(198,40,40,0.92)';
      ctx.beginPath(); ctx.moveTo(tp.x - 5, tp.y - 4); ctx.lineTo(tp.x, tp.y + 3); ctx.lineTo(tp.x + 5, tp.y - 4); ctx.fill();
    }
  }
  if (G.copSayT > 0) {
    const cp = world.project(world.cop, 3.1, W, H);
    if (cp.visible) speechBubble(cp.x - 40, cp.y, G.copSay, 20);
  }
}

function renderHud() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawLabels();
  drawOverlayFx();
  drawPrompt();
  drawKeyboard();
}

// ---------- 菜单与结果 ----------
const $ = id => document.getElementById(id);
function hideAll() { ['menu', 'result', 'pause'].forEach(id => $(id).classList.remove('show')); }
function saveSettings() { store('kc-settings', { lesson: G.lesson, diff: G.diff, music: Music.on, scene: G.scene, officer: G.officer }); }

function renderAppearance() {
  for (const [id, items, field] of [['scenes', SCENES, 'scene'], ['officers', OFFICERS, 'officer']]) {
    const container = $(id); container.replaceChildren();
    for (const item of items) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'appearance-card';
      button.dataset.id = item.id; button.setAttribute('aria-pressed', String(G[field] === item.id));
      const img = document.createElement('img'); img.src = previews[id][item.id]; img.alt = ''; button.appendChild(img);
      const name = document.createElement('b'); name.textContent = item.name; button.appendChild(name);
      const note = document.createElement('small'); note.textContent = item.note; button.appendChild(note);
      button.onclick = () => { audio(); SFX.select(); G[field] = item.id; saveSettings(); world.setAppearance(G.scene,G.officer); G.snap=true; renderAppearance(); };
      container.appendChild(button);
    }
  }
}

function renderMenu() {
  if (previews) renderAppearance();
  const lw = $('lessons'); lw.innerHTML = '';
  LESSONS.forEach((L, i) => {
    const el = document.createElement('div');
    el.className = 'lesson' + (i === G.lesson ? ' sel' : '');
    const b = best[L.id] || 0;
    el.innerHTML = `<div class="icon">${L.icon}</div><div class="name">${L.name}</div><div class="desc">${L.desc}</div><div class="stars">${b ? '★'.repeat(b) + '☆'.repeat(3 - b) : ''}</div>`;
    el.onclick = () => { audio(); SFX.select(); G.lesson = i; renderMenu(); };
    el.ondblclick = () => { G.lesson = i; startGame(); };
    lw.appendChild(el);
  });
  const dw = $('diffs'); dw.innerHTML = '';
  DIFFS.forEach((D, i) => {
    const el = document.createElement('div');
    el.className = 'diff' + (i === G.diff ? ' sel' : '');
    el.innerHTML = `${D.name}<small>${D.tip}</small>`;
    el.onclick = () => { audio(); SFX.select(); G.diff = i; renderMenu(); };
    dw.appendChild(el);
  });
}

function showMenu() {
  hideAll();
  G.state = 'menu'; G.resultShown = false; G.snap = true;
  if (AC) Music.setLevel(0.3);
  renderMenu();
  $('menu').classList.add('show');
}

function showResult(win) {
  G.resultShown = true;
  const total = G.correct + G.wrong;
  const acc = total ? G.correct / total : 0;
  const kpm = Math.round(G.correct / Math.max(G.playTime, 1) * 60);
  let stars = 0;
  if (win) { stars = 1; if (acc >= 0.9) stars++; if (acc >= 0.97 || G.maxCombo >= 40) stars++; }
  const L = LESSONS[G.lesson];
  if (stars > (best[L.id] || 0)) { best[L.id] = stars; store('kc-best', best); }
  $('rEmoji').textContent = win ? '🎉' : '💨';
  $('rTitle').textContent = win ? '抓到小偷啦！' : '小偷跑掉了…';
  $('rStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
  $('rKpm').textContent = kpm;
  $('rAcc').textContent = Math.round(acc * 100) + '%';
  $('rCombo').textContent = G.maxCombo;
  $('rTime').textContent = Math.round(G.playTime) + '秒';
  let tip;
  if (!win) tip = acc < 0.85 ? '别着急，看准了再按，按错会让小偷跑远哦！' : '已经很准啦！再快一点点就能追上～也可以先选「🐢 慢慢跑」';
  else if (stars === 3) tip = '太厉害了！试试下一关或者更快的小偷吧！';
  else if (acc < 0.9) tip = '抓住啦！下次眼睛看屏幕、手指找准位置，争取更多星星！';
  else tip = '很棒！连击越多跑得越快，挑战 3 颗星吧！';
  $('rTip').textContent = tip;
  $('result').classList.add('show');
}

function pauseGame() { if (G.state !== 'play' && G.state !== 'ready') return; G.prevState = G.state; G.state = 'pause'; Music.setLevel(0.12); $('pause').classList.add('show'); }
function resumeGame() { if (G.state !== 'pause') return; hideAll(); G.state = G.prevState; Music.setLevel(0.55); }

function updateMusicBtn() { $('musicBtn').textContent = Music.on ? '🔊' : '🔇'; }
$('musicBtn').onclick = e => {
  e.currentTarget.blur(); audio(); Music.start();
  Music.on = !Music.on; saveSettings(); updateMusicBtn();
  Music.setLevel(G.state === 'play' || G.state === 'ready' ? 0.55 : 0.3);
};
updateMusicBtn();

$('startBtn').onclick = e => { e.currentTarget.blur(); startGame(); };
$('againBtn').onclick = e => { e.currentTarget.blur(); startGame(); };
$('menuBtn').onclick = e => { e.currentTarget.blur(); SFX.click(); showMenu(); };
$('resumeBtn').onclick = e => { e.currentTarget.blur(); resumeGame(); };
$('quitBtn').onclick = e => { e.currentTarget.blur(); showMenu(); };
window.addEventListener('blur', pauseGame);

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey) return; // 保留 ⌘Q 等系统快捷键
  e.preventDefault();
  if (e.repeat) return;
  const key = e.key;
  if (G.state === 'loading') return;
  if (G.state === 'menu') {
    audio(); Music.start(); Music.setLevel(0.3);
    const n = LESSONS.length;
    if (key === 'ArrowRight') { G.lesson = (G.lesson + 1) % n; SFX.select(); renderMenu(); }
    else if (key === 'ArrowLeft') { G.lesson = (G.lesson + n - 1) % n; SFX.select(); renderMenu(); }
    else if (key === 'ArrowDown') { G.lesson = Math.min(n - 1, G.lesson + 4); SFX.select(); renderMenu(); }
    else if (key === 'ArrowUp') { G.lesson = Math.max(0, G.lesson - 4); SFX.select(); renderMenu(); }
    else if (['1', '2', '3'].includes(key)) { G.diff = +key - 1; SFX.select(); renderMenu(); }
    else if (key === 'Enter') startGame();
    return;
  }
  if (G.state === 'pause') {
    if (key === 'Enter' || key === ' ') resumeGame();
    else if (key === 'Escape') showMenu();
    return;
  }
  if ((G.state === 'caught' || G.state === 'escaped') && G.resultShown) {
    if (key === 'Enter') startGame();
    else if (key === 'Escape') showMenu();
    return;
  }
  if (key === 'Escape') { pauseGame(); return; }
  if (G.state === 'play') {
    const ch = codeToChar(e.code);
    if (ch !== null) hit(ch);
  }
});

// 给 Mac 外壳的自检读状态用
window.__kcState = () => ({ scene: G.scene, officer: G.officer, copVisible: !!world.cop?.root.parent && world.cop.root.visible, state: G.state, idx: G.idx, line: G.line, correct: G.correct, wrong: G.wrong, gap: +G.gap.toFixed(1), sfx: Object.keys(sfxBuf).length, audio: AC ? AC.state : 'none' });

// ---------- 主循环 ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const frozen = G.state === 'pause' || G.hold;
  if (!frozen) update(dt);
  if (world.cop) {
    world.update(frozen ? 0 : dt, worldState());
    G.snap = false;
  }
  renderHud();
  requestAnimationFrame(frame);
}

async function boot() {
  requestAnimationFrame(frame);
  try {
    await world.load(p => { $('loadBar').style.width = Math.round(p * 100) + '%'; });
  } catch (err) {
    $('loadText').textContent = '加载失败：' + err.message;
    throw err;
  }
  previews = world.createPreviews();
  world.setAppearance(G.scene, G.officer);
  $('loading').classList.remove('show');
  showMenu();

  // 调试用：?demo=每秒字数&ff=快进秒数 自动开始并自动打字，用于截图检查
  const q = new URLSearchParams(location.search);
  if (q.get('demo')) {
    startGame();
    const rate = +q.get('demo') || 3, ff = +(q.get('ff') || 0), miss = +(q.get('miss') || 0.1);
    const typeOne = () => { if (G.state === 'play') hit(Math.random() < 1 - miss ? G.line[G.idx] : 'q'); };
    for (let t = 0, acc = 0; t < ff; t += 1 / 60) {
      update(1 / 60); world.update(1 / 60, worldState()); G.snap = false;
      acc += rate / 60; while (acc >= 1) { acc--; typeOne(); }
    }
    if (!q.get('freeze')) setInterval(typeOne, 1000 / rate);
    if (q.get('hold')) G.hold = true; // 定格画面，方便截图
  }
}
boot();
