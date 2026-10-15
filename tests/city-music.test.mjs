import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CITY_MUSIC,scoreAt} from '../web/city-music.mjs';
test('seven scores produce finite playable notes and different arrangements',()=>{
 const scores=new Set();
 for(const id of ['dalian','tokyo','paris','rio','newyork','manarola','dresden']){
  const notes=Array.from({length:192},(_,i)=>scoreAt(id,i));
  assert.ok(notes.flat().length>40);
  for(const n of notes.flat()){assert.ok(n.midi>=24&&n.midi<=100);assert.ok(n.duration>0&&n.duration<2);assert.ok(n.volume>0&&n.volume<=.25);}
  scores.add(JSON.stringify(notes));
 }
 assert.equal(scores.size,7);
 assert.deepEqual(scoreAt('city',0),[]);
});
test('waltz repeats its bass on three beats, samba has offbeat percussion',()=>{
 assert.ok(scoreAt('paris',12).some(n=>n.voice==='warm'));
 assert.ok(!scoreAt('paris',8).some(n=>n.voice==='warm'));
 assert.ok(scoreAt('rio',3).some(n=>n.voice==='drum'));
 assert.ok(scoreAt('newyork',7).some(n=>n.voice==='funk'));
 assert.ok(scoreAt('dresden',4).some(n=>n.voice==='flute'));
 assert.equal(CITY_MUSIC.dalian.voice,'pluck');
});
