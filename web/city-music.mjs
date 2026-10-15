// Original offline scores: musical references, never recordings of existing songs.
export const CITY_MUSIC = {
 dalian: {bpm:116,beats:4,voice:'pluck',bass:'warm',scale:[0,2,4,7,9],roots:[48,45,53,55],melody:[0,2,3,4,3,2,1,2,0,1,2,3,4,3,1,0],rhythm:[0,2,4,7,8,10,12,14],title:'海风与琴弦 · 五声流行'},
 tokyo: {bpm:108,beats:4,voice:'koto',bass:'warm',scale:[0,2,3,7,8],roots:[50,46,43,45],melody:[0,3,2,1,4,3,1,0,2,3,4,2,1,0,3,2],rhythm:[0,3,6,8,10,14],title:'樱花小路 · 琴笛融合'},
 paris: {bpm:144,beats:3,voice:'reed',bass:'warm',scale:[0,2,4,5,7,9,11],roots:[48,45,50,55],melody:[2,4,6,5,4,2,1,3,5,4,2,0],rhythm:[0,2,4,6,8,10],title:'左岸漫步 · 手风琴圆舞曲'},
 rio: {bpm:122,beats:4,voice:'guitar',bass:'warm',scale:[0,2,4,5,7,9,11],roots:[48,57,50,55],melody:[4,6,5,2,4,3,1,2,6,5,4,2,1,3,2,0],rhythm:[0,3,6,7,10,12,15],title:'海岸律动 · 桑巴切分'},
 newyork: {bpm:112,beats:4,voice:'brass',bass:'funk',scale:[0,3,5,6,7,10],roots:[48,48,53,55],melody:[0,2,3,4,5,4,2,1,0,1,2,4,3,2,1,0],rhythm:[0,3,4,7,10,11,14],title:'街角节拍 · 爵士放克'},
 manarola: {bpm:126,beats:3,voice:'mandolin',bass:'warm',scale:[0,2,4,5,7,9,11],roots:[48,53,55,48],melody:[0,2,4,6,5,4,2,3,1,2,4,2],rhythm:[0,2,4,6,8,10],title:'彩屋晨光 · 曼陀铃民谣'},
 dresden: {bpm:120,beats:4,voice:'strings',bass:'cello',scale:[0,2,4,5,7,9,11],roots:[48,55,45,53],melody:[0,2,1,3,2,4,3,5,4,2,3,1,2,0,1,4],rhythm:[0,2,4,6,8,10,12,14],title:'易北河奏鸣 · 弦乐与木管'},
};
export function scoreAt(theme,step) {
 const p=CITY_MUSIC[theme]; if(!p)return [];
 const length=p.beats*4, beat=step%length, bar=Math.floor(step/length), root=p.roots[bar%4];
 const notes=[];
 const add=(midi,duration,voice,volume)=>notes.push({midi,duration,voice,volume});
 const pitch=n=>root+12+p.scale[((n%p.scale.length)+p.scale.length)%p.scale.length]+12*Math.floor(n/p.scale.length);
 if(p.rhythm.includes(beat)) {
  const n=p.melody[(bar*p.rhythm.length+p.rhythm.indexOf(beat))%p.melody.length];
  add(pitch(n),p.voice==='reed'?.25:.22,p.voice,.12);
  if(theme==='manarola')add(pitch(n),.14,'mandolin',.035);
 }
 if(beat===0 || (p.beats===4&&beat===8))add(root-12,.34,p.bass,.20);
 if(theme==='newyork'&&[3,7,11,14].includes(beat))add(root-12+(beat===11?7:0),.13,'funk',.15);
 if(p.beats===3&&[4,8].includes(beat))for(const n of [0,2,4])add(pitch(n)-12,.16,p.voice,.035);
 if(theme==='dresden'&&beat%4===0)add(root+7+p.scale[(7-Math.floor(beat/2)+bar)%7],.34,'flute',.08);
 if(theme==='tokyo'&&bar%2===1&&[0,8].includes(beat))add(pitch(4),.65,'flute',.07);
 if(theme==='rio'&&beat%2===1)add(82,.045,'shaker',.055);
 if(theme==='newyork'&&[4,12].includes(beat))add(65,.11,'snare',.10);
 if(theme==='dalian'&&beat%4===2)add(84,.035,'shaker',.025);
 if(theme==='rio'&&[0,3,6,10,12].includes(beat))add(beat===6?62:50,.07,'drum',.13);
 if(['dalian','tokyo','newyork'].includes(theme)&&beat%8===0)add(40,.09,'drum',.13);
 if(theme==='newyork'&&[4,12].includes(beat))add(72,.07,'drum',.08);
 return notes;
}
const TIMBRES={
 pluck:[1,.42,.15,.06],koto:[1,.25,.55,.12,.08],reed:[1,.55,.30,.18,.10],
 guitar:[1,.48,.20,.06],mandolin:[1,.60,.23,.18,.07],brass:[1,.60,.34,.22],
 strings:[1,.4,.24,.14,.09],flute:[1,.08,.04],warm:[1,.14],funk:[1,.5,.2],cello:[1,.35,.2],drum:[1,.25],
};
const waves=new WeakMap(),noiseBuffers=new WeakMap();
export function playCityNote(ac,bus,n,time) {
 if(n.voice==='shaker'||n.voice==='snare'){
  if(!noiseBuffers.has(ac)){
   const b=ac.createBuffer(1,Math.ceil(ac.sampleRate*.2),ac.sampleRate),d=b.getChannelData(0);let seed=371;
   for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}
   noiseBuffers.set(ac,b);
  }
  const src=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();src.buffer=noiseBuffers.get(ac);
  filter.type='highpass';filter.frequency.value=n.voice==='shaker'?6500:1600;
  gain.gain.setValueAtTime(n.volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+n.duration);
  src.connect(filter).connect(gain).connect(bus);src.start(time);src.stop(time+n.duration);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};return;
 }
 let cache=waves.get(ac);if(!cache){cache=new Map();waves.set(ac,cache);}
 if(!cache.has(n.voice)){
  const harmonics=TIMBRES[n.voice]||TIMBRES.pluck,imag=new Float32Array(harmonics.length+1);imag.set(harmonics,1);
  cache.set(n.voice,ac.createPeriodicWave(new Float32Array(imag.length),imag));
 }
 const o=ac.createOscillator(),g=ac.createGain(),slow=['strings','flute','reed','cello'].includes(n.voice);
 o.setPeriodicWave(cache.get(n.voice));const freq=440*2**((n.midi-69)/12);o.frequency.setValueAtTime(freq,time);
 if(n.voice==='drum')o.frequency.exponentialRampToValueAtTime(freq*.25,time+n.duration);
 if(n.voice==='strings'||n.voice==='reed'){o.detune.setValueAtTime(Math.sin(time*4)*4,time);}
 g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(n.volume,time+(slow?.045:.006));
 if(slow)g.gain.setValueAtTime(n.volume*.7,time+n.duration*.65);
 g.gain.exponentialRampToValueAtTime(.0001,time+n.duration);
 o.connect(g).connect(bus);o.start(time);o.stop(time+n.duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
}
