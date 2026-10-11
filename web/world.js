// 3D 街道世界：Kenney CC0 模型 + three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// 世界里 1 单位 = 1 米；角色往 -Z 方向跑，“跑过的距离 d”对应 z = -d
const TILE = 8;            // 一块路 8 米
const CITY_SCALE = 8;      // Kenney 城市套件 1 格 → 8 米
const CAR_SCALE = 1.2;
const CHAR_SCALE = 2.0;    // 小人约 1.6 米高
export const COP_X = -1.3;
export const THIEF_X = 1.3;

const BUILDINGS = 'abcdefghijklmn'.split('').map(c => `building-${c}`);
const SKYSCRAPERS = 'abcde'.split('').map(c => `building-skyscraper-${c}`);
const CARS = ['sedan', 'taxi', 'van', 'suv', 'hatchback-sports', 'delivery', 'police', 'ambulance'];
const TINTS = ['#ffb3ba', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#ffadad', '#b9fbc0'];

function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = this.makeSky();
    this.scene.fog = new THREE.Fog(0xd4ecff, 70, 240);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.3, 400);

    const hemi = new THREE.HemisphereLight(0xdff1ff, 0x8a9a6a, 1.6);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);

    // 跟着镜头走的地面、人行道、云
    this.follow = new THREE.Group();
    this.scene.add(this.follow);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ color: 0x8fd16a }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
    this.follow.add(ground);
    const walkMat = new THREE.MeshLambertMaterial({ color: 0xeee3cf });
    for (const s of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.16, 600), walkMat);
      walk.position.set(s * 5.6, 0.05, 0); walk.receiveShadow = true;
      this.follow.add(walk);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 600), new THREE.MeshLambertMaterial({ color: 0xd65f4c }));
      curb.position.set(s * 4.05, 0.06, 0); curb.receiveShadow = true;
      this.follow.add(curb);
    }
    this.clouds = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x666666, fog: false });
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(6 + hash(i * 7 + j) * 5, 1), cloudMat);
        m.position.set(j * 7 - 10, hash(i + j * 3) * 3, hash(i * 3 + j) * 4);
        m.scale.y = 0.6;
        c.add(m);
      }
      c.position.set((hash(i) - 0.5) * 360, 55 + hash(i + 5) * 25, -150 - hash(i + 9) * 120);
      this.clouds.add(c);
    }
    this.follow.add(this.clouds);

    this.chunks = new Map();
    this.models = {};
    this.tintCache = new Map();
    this.dust = [];
    this.t = 0;
  }

  makeSky() {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d').createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#4aa8ff'); g.addColorStop(0.55, '#a8d8ff'); g.addColorStop(1, '#e4f4ff');
    const x = c.getContext('2d'); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  async load(onProgress) {
    const loader = new GLTFLoader();
    const list = [
      ...['character-male-c', 'character-male-d'].map(n => ['characters', n]),
      ...[...BUILDINGS, ...SKYSCRAPERS, 'detail-awning', 'detail-parasol-a', 'detail-parasol-b'].map(n => ['city', n]),
      ...['road-straight', 'road-crossing', 'light-curved', 'traffic-light', 'construction-cone', 'construction-barrier', 'road-sign-warning'].map(n => ['roads', n]),
      ...CARS.map(n => ['cars', n]),
    ];
    let done = 0, next = 0;
    const worker = async () => {
      while (next < list.length) {
        const [dir, name] = list[next++];
        let gltf;
        for (let attempt = 0; ; attempt++) {
          try { gltf = await loader.loadAsync(`assets/${dir}/${name}.glb`); break; }
          catch (e) { if (attempt >= 2) throw e; }
        }
        gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        this.models[name] = gltf;
        onProgress && onProgress(++done / list.length);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    this.cop = this.makeCharacter('character-male-c', false);
    this.thief = this.makeCharacter('character-male-d', true);
    this.scene.add(this.cop.root, this.thief.root);
    this.makeTrees();
    this.makeDust();
  }

  makeCharacter(name, isThief) {
    const gltf = this.models[name];
    const model = cloneSkinned(gltf.scene);
    model.scale.setScalar(CHAR_SCALE);
    model.rotation.y = Math.PI; // 背对镜头，往 -Z 跑
    const root = new THREE.Group();
    root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
    let head = null, torso = null;
    model.traverse(o => { if (o.name === 'head') head = o; if (o.name === 'torso') torso = o; });
    const ch = { root, model, mixer, actions, head, torso, current: null };
    if (isThief) this.dressThief(ch);
    this.play(ch, 'idle', 0);
    return ch;
  }

  dressThief(ch) {
    const black = new THREE.MeshLambertMaterial({ color: 0x1d1d24 });
    // 黑色毛线帽（头骨骼坐标：头高约 0~0.38，前脸在 z≈0.17）
    const hat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.17, 0.38), black);
    hat.position.set(0, 0.345, -0.005);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.4), new THREE.MeshLambertMaterial({ color: 0x33333d }));
    brim.position.set(0, 0.27, -0.005);
    hat.add(brim); brim.position.sub(hat.position);
    const pom = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xe53935 }));
    pom.position.set(0, 0.47, 0);
    // 大盗眼罩：黑色布条 + 两个眼洞
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.085, 0.02), black);
    mask.position.set(0, 0.175, 0.172);
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.01), white);
      eye.position.set(sx * 0.085, 0, 0.012);
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.01), black);
      pupil.position.set(sx * 0.085 + sx * 0.008, -0.002, 0.018);
      mask.add(eye, pupil);
    }
    ch.head.add(hat, pom, mask);
    // 背上的大袋子
    const bag = new THREE.Group();
    const sack = new THREE.Mesh(new THREE.IcosahedronGeometry(0.21, 2), new THREE.MeshLambertMaterial({ color: 0xc08a4a }));
    sack.scale.set(1, 1.1, 0.8);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0x9a6a33 }));
    knot.position.y = 0.24;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); x.font = '96px "Apple Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('💎', 64, 70);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const gem = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    gem.position.set(0, 0, -0.18); gem.rotation.y = Math.PI;
    bag.add(sack, knot, gem);
    bag.traverse(o => { if (o.isMesh) o.castShadow = true; });
    bag.position.set(0, 0.12, -0.2);
    ch.torso.add(bag);
    ch.bag = bag;
    [hat, pom, mask].forEach(m => (m.castShadow = true));
  }

  play(ch, name, fade = 0.25, { loop = true, speed = 1 } = {}) {
    const a = ch.actions[name];
    if (!a) return;
    if (ch.current === a) { a.timeScale = speed; return; }
    a.reset();
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    a.clampWhenFinished = !loop;
    a.timeScale = speed;
    a.play();
    if (ch.current && fade > 0) ch.current.crossFadeTo(a, fade, false);
    else if (ch.current) ch.current.stop();
    ch.current = a;
    ch.currentName = name;
  }

  makeTrees() {
    const trunkG = new THREE.CylinderGeometry(0.16, 0.22, 1.8, 7);
    const leafG = new THREE.IcosahedronGeometry(1.25, 0);
    this.treeParts = {
      trunkG, leafG,
      trunkM: new THREE.MeshLambertMaterial({ color: 0x8b5e3c }),
      leafMs: [0x4caf50, 0x66bb6a, 0x2e9d4a, 0x7cb342].map(c => new THREE.MeshLambertMaterial({ color: c, flatShading: true })),
    };
  }
  tree(seed) {
    const p = this.treeParts;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(p.trunkG, p.trunkM); trunk.position.y = 0.9;
    const leaf = new THREE.Mesh(p.leafG, p.leafMs[Math.floor(hash(seed) * 4)]);
    leaf.position.y = 2.6; leaf.rotation.set(hash(seed + 1) * 3, hash(seed + 2) * 3, 0);
    const leaf2 = new THREE.Mesh(p.leafG, leaf.material); leaf2.scale.setScalar(0.65); leaf2.position.set(0.5, 3.4, 0.2);
    g.add(trunk, leaf, leaf2);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.scale.setScalar(0.85 + hash(seed + 3) * 0.4);
    return g;
  }

  makeDust() {
    const g = new THREE.SphereGeometry(0.09, 6, 5);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xf3ecdf, transparent: true, opacity: 0 }));
      m.visible = false; this.scene.add(m);
      this.dust.push({ m, life: 0, v: new THREE.Vector3() });
    }
    this.dustI = 0;
  }
  puff(x, z, n = 3) {
    for (let i = 0; i < n; i++) {
      const d = this.dust[this.dustI++ % this.dust.length];
      d.m.position.set(x + (Math.random() - 0.5) * 0.5, 0.15, z + 0.3);
      d.v.set((Math.random() - 0.5) * 1.2, 0.5 + Math.random() * 0.6, 0.4 + Math.random() * 0.5);
      d.life = 0.45; d.m.visible = true; d.m.scale.setScalar(1);
    }
  }

  inst(name, scale) {
    const o = this.models[name].scene.clone();
    o.scale.setScalar(scale);
    return o;
  }
  tinted(name, scale, tint) {
    const o = this.inst(name, scale);
    const key = name + tint;
    o.traverse(m => {
      if (!m.isMesh) return;
      const k = key + m.material.uuid;
      if (!this.tintCache.has(k)) {
        const mat = m.material.clone();
        mat.color = new THREE.Color(0xffffff).lerp(new THREE.Color(tint), 0.75);
        this.tintCache.set(k, mat);
      }
      m.material = this.tintCache.get(k);
    });
    return o;
  }

  buildChunk(i) {
    const g = new THREE.Group();
    const z = -i * TILE;
    g.position.z = z;
    const crossing = i % 16 === 0 && i > 2;
    const road = this.inst(crossing ? 'road-crossing' : 'road-straight', CITY_SCALE);
    road.rotation.y = Math.PI / 2;
    g.add(road);
    for (const s of [-1, 1]) {
      const r = hash(i * 2 + (s > 0 ? 1 : 0));
      // 临街楼房
      if (!crossing && r > 0.12) {
        const name = BUILDINGS[Math.floor(hash(i * 13 + s) * BUILDINGS.length)];
        const b = this.tinted(name, CITY_SCALE, TINTS[Math.floor(hash(i * 17 + s * 3) * TINTS.length)]);
        b.position.set(s * 11, 0, 0);
        b.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
        g.add(b);
        if (hash(i * 5 + s) > 0.6) {
          const aw = this.inst('detail-awning', CITY_SCALE);
          aw.position.set(s * 7.4, 0, 0); aw.rotation.y = b.rotation.y;
          g.add(aw);
        }
      } else if (!crossing) {
        // 小公园
        for (let k = 0; k < 3; k++) { const t = this.tree(i * 9 + k + s); t.position.set(s * (8 + k * 2.5), 0, (k - 1) * 2.4); g.add(t); }
        const p = this.inst(hash(i) > 0.5 ? 'detail-parasol-a' : 'detail-parasol-b', CITY_SCALE);
        p.position.set(s * 12, 0, 0); g.add(p);
      }
      // 远处高楼
      if (hash(i * 7 + s * 11) > 0.45) {
        const sk = this.tinted(SKYSCRAPERS[Math.floor(hash(i * 3 + s * 7) * SKYSCRAPERS.length)], CITY_SCALE, TINTS[Math.floor(hash(i * 23 + s) * TINTS.length)]);
        sk.position.set(s * (24 + hash(i + s) * 10), 0, 0);
        g.add(sk);
      }
      // 路灯 / 行道树
      if (crossing) {
        const tl = this.inst('traffic-light', CITY_SCALE);
        tl.position.set(s * 4.6, 0, s * 3); tl.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(tl);
      } else if (i % 3 === 0) {
        const l = this.inst('light-curved', CITY_SCALE);
        l.position.set(s * 4.5, 0.1, 0); l.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(l);
      } else if (hash(i * 31 + s) > 0.35) {
        const t = this.tree(i * 4 + s); t.position.set(s * 5.4, 0.1, 0); g.add(t);
      }
      // 路边停着的车
      if (!crossing && i > 3 && hash(i * 41 + s * 5) > 0.72) {
        const car = this.inst(CARS[Math.floor(hash(i * 43 + s) * CARS.length)], CAR_SCALE);
        car.position.set(s * 3.1, 0, (hash(i * 3) - 0.5) * 3);
        car.rotation.y = s > 0 ? 0 : Math.PI;
        g.add(car);
      } else if (!crossing && i > 3 && hash(i * 53 + s) > 0.93) {
        for (let k = 0; k < 3; k++) { const c = this.inst('construction-cone', CITY_SCALE); c.position.set(s * 3.4, 0, k * 1.2 - 1.2); g.add(c); }
      }
    }
    this.scene.add(g);
    return g;
  }

  updateChunks(camDist) {
    const first = Math.floor(camDist / TILE) - 3, last = first + 34;
    for (const [i, g] of this.chunks) {
      if (i < first || i > last) { this.scene.remove(g); this.chunks.delete(i); }
    }
    for (let i = first; i <= last; i++) if (!this.chunks.has(i)) this.chunks.set(i, this.buildChunk(i));
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    // 上方有题目栏、下方有键盘，把镜头“光心”往上移，让人物落在中间可见的区域
    const full = h * 1.5;
    this.camera.fov = 62;
    this.camera.aspect = w / full;
    this.camera.setViewOffset(w, full, 0, full / 2 - h * 0.4, w, h);
    this.camera.updateProjectionMatrix();
  }

  // s: { copDist, thiefDist, thiefX, mode, timer, copAnim, thiefAnim, copSpeed, thiefLook, shake }
  update(dt, s) {
    this.t += dt;
    const cz = -s.copDist, tz = -s.thiefDist;
    this.cop.root.position.set(COP_X, 0, cz);
    this.thief.root.position.set(s.thiefX, 0, tz);
    this.thief.root.rotation.y = s.thiefFace || 0;
    this.cop.root.rotation.y = s.copFace || 0;

    this.play(this.cop, s.copAnim.name, 0.2, s.copAnim);
    this.play(this.thief, s.thiefAnim.name, 0.2, s.thiefAnim);
    this.cop.mixer.update(dt);
    this.thief.mixer.update(dt);
    if (s.thiefLook > 0 && this.thief.head) this.thief.head.rotation.y += Math.sin(Math.min(1, s.thiefLook) * Math.PI / 2) * 2.4;

    // 镜头
    const cam = this.camera;
    let pos, look;
    if (s.mode === 'caught') {
      const k = Math.min(1, s.timer / 1.2);
      const e = k * k * (3 - 2 * k);
      // 镜头只能在马路+人行道范围内（|x|<6），斜 45° 看两个人
      pos = new THREE.Vector3(COP_X + 1.1 + e * 6.2, 2.4 + e * 0.2, cz + 7.5 - e * 2.5);
      look = new THREE.Vector3((COP_X + s.thiefX) / 2, 0.5 + e * 0.9, (cz + tz) / 2 - 0.5);
    } else {
      pos = new THREE.Vector3(COP_X + 1.1, 2.4, cz + 7.5);
      look = new THREE.Vector3(0.3, 0.8, cz - 25);
    }
    if (s.shake > 0) pos.x += Math.sin(this.t * 60) * s.shake * 0.25;
    if (s.mode === 'play') pos.y += Math.sin(this.t * 16) * 0.03;
    cam.position.lerp(pos, Math.min(1, dt * (s.mode === 'caught' ? 3 : 8)));
    if (!this.look) this.look = look.clone(); else this.look.lerp(look, Math.min(1, dt * 6));
    if (s.snap) { cam.position.copy(pos); this.look.copy(look); }
    cam.lookAt(this.look);

    this.follow.position.set(0, 0, cz);
    this.clouds.position.x = (this.t * 1.5) % 60;
    this.sun.position.set(cam.position.x - 18, 35, cz + 12);
    this.sun.target.position.set(0, 0, cz - 10);
    this.updateChunks(s.copDist - 10);

    for (const d of this.dust) {
      if (d.life <= 0) continue;
      d.life -= dt;
      d.m.position.addScaledVector(d.v, dt);
      d.m.scale.setScalar(0.8 + (0.45 - d.life) * 2);
      d.m.material.opacity = Math.max(0, d.life) * 1.4;
      if (d.life <= 0) d.m.visible = false;
    }
    this.renderer.render(this.scene, cam);
  }

  // 世界坐标 → 屏幕像素
  project(ch, height, w, h) {
    const v = new THREE.Vector3(ch.root.position.x, height, ch.root.position.z).project(this.camera);
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, visible: v.z < 1 };
  }
}
