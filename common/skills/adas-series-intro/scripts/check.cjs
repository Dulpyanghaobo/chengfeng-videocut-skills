const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {render,validate}=require('../assets/scene.js');
const c=validate(JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/config.json'))));
// Arbitrary seeking must be pure: rendering a future frame cannot dirty a past frame.
const before=render(3.8,c);
for(const t of [16.32,0,9.5,7.2,12.3,2.466])assert.doesNotMatch(render(t,c),/NaN|undefined|Infinity/);
assert.equal(render(3.8,c),before);
assert.equal(render(-1,c),render(0,c));
assert.equal(render(100,c),render(c.duration,c));
for(const q of c.cues) {
  assert.ok(render(q.start,c).includes(q.text),'caption must switch at its cue boundary');
  if(q.start>0)assert.ok(!render(q.start-0.0001,c).includes(`>${q.text}</text>`));
}
const final=render(16.32,c);
for(const label of ['S','A','B','C','D','芯片','感知','算法','执行',c.disclaimer])assert.ok(final.includes(`>${label}</text>`));
assert.ok(!render(12,{...c,captions:false}).includes(`>${c.cues[7].text}</text>`));
const invalid=structuredClone(c);invalid.cues[2].start-=.1;
assert.throws(()=>validate(invalid),/discontinuous cue/);
assert.throws(()=>validate({...c,colors:{...c.colors,cyan:'bad'}}),/Invalid color/);
console.log('PASS: backward seek, cue boundaries, final framework, caption toggle, invalid config');
