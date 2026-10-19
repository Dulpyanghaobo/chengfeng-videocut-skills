import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt, actionAt, packetsAt, triggers} from '../.agents/skills/chengfeng-xiaohei-dark/assets/templates/xiaohei-dark-motion/motion.mjs';
import {theme} from '../.agents/skills/chengfeng-xiaohei-dark/assets/templates/xiaohei-dark-motion/theme.mjs';

test('press occurs at physical contact below the face', () => {
  for (const trigger of Object.values(triggers).slice(0,2)) {
    for (let frame=trigger;frame<trigger+36;frame++) {
      const a=actionAt(frame,trigger,false);
      const x=a.workerX+60+18*a.reach;
      const y=92+20-26*a.reach;
      if(a.pressed) assert.ok(Math.hypot(x-322,y-86)<=16,'hand and button must touch before pressed state');
      assert.ok(20-26*a.reach>-14,'hand stays below the visor');
    }
  }
});
test('released paper starts exactly at the held paper position', () => {
  const a=actionAt(triggers.occasional+20,triggers.occasional,false);
  const p=packetsAt(a.loadAt,a.loadAt,false)[0];
  assert.equal(a.carry,false);
  assert.equal(a.workerX+60+18*a.reach+15,440+p.x);
  assert.equal(92+20-26*a.reach-3,p.y);
});
test('input arrives before machine response and processing precedes output', () => {
  const before=actionAt(83,triggers.occasional,false);
  assert.equal(before.active,false);
  assert.equal(actionAt(84,triggers.occasional,false).active,true);
  assert.equal(packetsAt(111,before.loadAt,false).some(p=>p.output),false);
  assert.equal(packetsAt(112,before.loadAt,false).some(p=>p.output),true);
});
test('single order stops; continuous work has moving mechanism and output', () => {
  const a=sceneAt(7),b=sceneAt(8);
  assert.equal(a.top.active,false); assert.equal(a.bottom.active,true);
  assert.equal(a.top.angle,b.top.angle); assert.ok(b.bottom.angle>a.bottom.angle);
  assert.ok(a.bottomPackets.some(p=>p.output)); assert.ok(b.bottomPackets.some(p=>!p.output));
});
test('seeking backwards reconstructs initial state and future labels disappear', () => {
  const initial=sceneAt(0);sceneAt(9.9);
  assert.deepEqual(sceneAt(0),initial);
  assert.equal(initial.topLabel,0); assert.equal(initial.bottomLabel,0); assert.equal(initial.finish,0);
  assert.deepEqual(sceneAt(3.25),sceneAt(3.25));
  assert.equal(sceneAt(NaN).time,0);assert.equal(sceneAt(Infinity).time,0);
  assert.equal(sceneAt(-3).time,0);assert.equal(sceneAt(50).time,10);
});
test('long input seeks keep visible packet creation bounded', () => {
  const packets=packetsAt(30*3600,116,true);
  assert.ok(packets.length<8); assert.ok(packets.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
});
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
test('phone text and action colors contrast with the graphite stage',()=>{
  for(const key of ['ink','muted','blue','orange'])assert.ok((luminance(theme[key])+.05)/(luminance(theme.background)+.05)>=4.5,key);
});
