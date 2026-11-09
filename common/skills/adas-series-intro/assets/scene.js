/* One deterministic 2D scene shared by browser, seek module and native renderer. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AdasIntro = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = v => 1 - Math.pow(1 - clamp(v), 3);
  const mix = (a, b, p) => a + (b - a) * p;
  const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const text = (x,y,label,size=32,color='#f1f5f8',extra='') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(label)}</text>`;
  const center = (y,label,size=32,color,extra='') => text(540,y,label,size,color,`text-anchor="middle" ${extra}`);
  const line = (x1,y1,x2,y2,color,width=2,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const rect = (x,y,w,h,color,rx=0,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${color}" ${extra}/>`;
  const group = (s,x=0,y=0,opacity=1,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})" opacity="${clamp(opacity)}">${s}</g>`;
  const path = (d,c,w=3,extra='') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const reveal = (d,c,p,w=3) => path(d,c,w,`pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-clamp(p)}"`);
  const circle = (x,y,r,c,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
  function validate(c) {
    if (c.schemaVersion !== 1 || c.width !== 1080 || c.height !== 1920) throw Error('Expected schema v1 and 1080×1920 design canvas');
    if (!Number.isFinite(c.duration) || c.duration <= 0 || !Number.isFinite(c.fps) || c.fps <= 0 || c.fps > 120) throw Error('Invalid duration/fps');
    if (!Array.isArray(c.cues) || c.cues.length !== 10) throw Error('Opening 01 needs the ten semantic cues');
    c.cues.forEach((q,i) => {
      if (typeof q.text !== 'string' || !q.text || !Number.isFinite(q.start) || !Number.isFinite(q.end) || q.start < 0 || q.end <= q.start || q.end > c.duration + 0.001 || (i && Math.abs(q.start-c.cues[i-1].end)>0.001)) throw Error(`Invalid or discontinuous cue ${i+1}`);
    });
    if (c.cues[0].start !== 0 || Math.abs(c.cues[9].end-c.duration)>0.001) throw Error('Cues must cover the full opening');
    for (const key of ['background','cyan','amber','mint','purple']) if (!/^#[0-9a-f]{6}$/i.test(c.colors?.[key])) throw Error(`Invalid color ${key}`);
    if (typeof c.disclaimer !== 'string') throw Error('Missing framework disclaimer');
    return c;
  }
  function car(color, rotation=0) {
    let s = `<path d="M-165 25 L-156-12 Q-151-26-111-31 L-62-73 Q-49-82-17-82 L67-78 Q88-74 112-36 L158-19 Q177-12 181 13 L179 30 H145 Q140-7 111-7 Q80-7 74 30 H-76 Q-82-7-113-7 Q-145-7-150 30Z" fill="#101f2d" stroke="${color}" stroke-width="3"/>`;
    s += `<path d="M-91-34 L-48-67 H-16 V-34Z M-3-67 H61 Q76-64 93-34 H-3Z" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-opacity=".65" stroke-width="2"/>`;
    s += line(-3,-29,-3,19,color,1.5)+line(-63,21,67,21,color,1.5)+line(156,-9,176,-3,color,5);
    for (const x of [-113,111]) {
      s += circle(x,28,28,'#050b12',`stroke="${color}" stroke-width="2"`)+circle(x,28,17,'#152736',`stroke="${color}" stroke-width="1.5"`);
      s += `<g transform="rotate(${rotation} ${x} 28)">${[0,60,120].map(a=>`<g transform="rotate(${a} ${x} 28)">${line(x-15,28,x+15,28,color,2)}</g>`).join('')}</g>`;
    }
    return s;
  }
  function chip(color, t=0, size=1) {
    let s=rect(-48,-48,96,96,'#0c1d2a',10,`stroke="${color}" stroke-width="3"`)+rect(-28,-28,56,56,color,4,'fill-opacity=".13"');
    for(let i=-30;i<=30;i+=20) s+=line(i,-68,i,-48,color,4)+line(i,48,i,68,color,4)+line(-68,i,-48,i,color,4)+line(48,i,68,i,color,4);
    s+=path('M-18 13 L-18-13 L1 13 L1-13 M12 13 V-13',color,3);
    s+=rect(-24,-25+50*((t*.65)%1),48,3,color,1,'opacity=".6"');
    return group(s,0,0,1,size);
  }
  function sensor(color,t=0) {
    let s=circle(0,0,22,'#0f2632',`stroke="${color}" stroke-width="3"`)+circle(0,0,8,color);
    for(let i=0;i<3;i++) {
      const r=37+((t*.5+i/3)%1)*58;
      s+=path(`M${-r*.65} ${-r*.76} A${r} ${r} 0 0 1 ${r*.65} ${-r*.76}`,color,2,`opacity="${.85-(r-37)/75}"`);
    }
    return s+line(-30,35,30,35,color,3)+line(0,22,0,35,color,3);
  }
  function model(color,t=0) {
    const nodes=[[-62,-45],[-62,45],[0,-65],[0,0],[0,65],[62,-30],[62,30]];
    let s='';
    for(const [a,b] of [[0,2],[0,3],[1,3],[1,4],[2,5],[3,5],[3,6],[4,6]]) {
      const p=nodes[a],q=nodes[b],k=(t*.7+a*.13)%1;
      s+=line(...p,...q,color,2,'opacity=".35"')+circle(mix(p[0],q[0],k),mix(p[1],q[1],k),3.5,color);
    }
    return s+nodes.map(([x,y],i)=>circle(x,y,8+i%2*2,'#0c1d2a',`stroke="${color}" stroke-width="3"`)).join('');
  }
  function control(color,t=0) {
    const angle=18*Math.sin(t*2.5);
    return `<g transform="rotate(${angle})">${circle(0,0,58,'none',`stroke="${color}" stroke-width="5"`)}${circle(0,0,17,'#10232e',`stroke="${color}" stroke-width="3"`)}${line(-57,-7,-16,-4,color,5)}${line(57,-7,16,-4,color,5)}${line(0,18,0,57,color,5)}</g>`+path('M-84 60 V-60 M-92-47 L-84-60 L-76-47',color,2,'opacity=".5"');
  }
  const names=['芯片','感知','算法','执行'];
  const en=['CHIP','SENSE','MODEL','CONTROL'];
  const desc=['硬件底座','环境信息','模型路线','控制闭环'];
  function header(kicker,title,subtitle,accent) {
    return text(76,94,'EV EVOLUTION INDEX',21,'#8fa4b5','letter-spacing="4"')+text(1004,94,kicker,19,accent,'text-anchor="end" letter-spacing="2"')+line(76,124,1004,124,'#29404f',1)+center(245,title,66,undefined,'font-weight="700"')+center(315,subtitle,29,'#9baebd');
  }
  function hook(t,c) {
    const p=ease(t/.6),a=c.colors.cyan,b=c.colors.amber;
    let s=header('SERIES INTRO / 01','同样几十万','高阶辅助驾驶',a);
    s+=center(438,'买到的升级空间，一样吗？',36,b,'font-weight="600"');
    s+=rect(510,523,60,60,'#112633',30)+center(566,'=',44,a);
    const ys=[735,1135];
    ys.forEach((y,i)=>{
      const color=i?b:a,x=mix(-260,540,p);
      s+=text(104,y-117,i?'方案 B':'方案 A',24,color,'letter-spacing="3"');
      s+=line(104,y+76,976,y+76,'#29404f',2);
      for(let j=0;j<12;j++)s+=line(110+j*76-((t*80)%76),y+110,144+j*76-((t*80)%76),y+110,'#263b49',2);
      s+=group(car(color,t*180),x,y,1,1.6);
      s+=text(970,y-20,'¥',68,color,'text-anchor="end" font-weight="300"');
    });
    s+=center(1450,'相近的购车投入',28,'#9baebd');
    return s;
  }
  function divergence(t,c) {
    const a=c.colors.cyan,b=c.colors.amber,q=c.cues;
    const begin=q[1].start,up=q[2].start,block=q[3].start,sense=q[4].start;
    const year=Math.round(2*ease((t-begin)/(up-begin)));
    let s=header('TWO YEARS LATER','两年后的分化','同一段时间，不同的升级路径',a);
    s+=center(484,`${String(year).padStart(2,'0')} 年`,105,'#f4f7fa','font-weight="300" letter-spacing="10"');
    const go=ease((t-up)/3.1),stop=ease((t-up)/1.7);
    s+=text(100,660,'持续进化',43,c.colors.mint,'font-weight="650"');
    s+=text(100,710,'OTA 继续向前',26,'#9baebd');
    s+=line(110,885,970,885,'#1b3544',5);
    s+=reveal('M110 885 H970',a,go,5);
    for(let i=0;i<4;i++) {
      const x=185+i*220,on=clamp((go*860-(x-110))/50);
      s+=rect(x,873,20,24,'#294452',5)+rect(x,873,20,24,a,5,`opacity="${on}"`);
      if(on>0)s+=text(x+10,947,`v${i+1}.0`,22,a,'text-anchor="middle"');
    }
    s+=group(car(a,t*180),mix(180,850,go),815,1,.73);
    s+=text(100,1130,'可能先受限',43,b,'font-weight="650"');
    s+=line(110,1355,970,1355,'#2d2928',5)+reveal('M110 1355 H663',b,stop,5);
    s+=group(car(b,Math.min(t,block+.5)*180),mix(180,568,stop),1285,1,.73);
    const gate=ease((t-block)/.45);
    s+=group(line(0,-115,0,50,b,8),706,1310,gate);
    s+=group(chip(b,t,.6),820,1210,gate);
    s+=text(820,1308,'芯片',25,b,`text-anchor="middle" opacity="${gate}"`);
    const scan=ease((t-sense)/.38);
    s+=group(sensor(b,t),820,1446,scan,.65)+text(820,1530,'传感器',25,b,`text-anchor="middle" opacity="${scan}"`);
    s+=text(100,1440,t>=sense?'硬件条件，可能成为边界':'硬件条件',27,'#9baebd');
    return s;
  }
  function page(x,y,scale,opacity,title,kind,t,color) {
    let s=rect(-184,-252,368,504,'#e8eef0',5)+rect(-160,-226,49,7,color,2);
    s+=text(-160,-178,title,23,'#0e2330','font-weight="700"')+text(-160,-140,'PUBLIC RESEARCH',10,'#5d707d','letter-spacing="1"');
    for(let i=0;i<6;i++)s+=rect(-160,-110+i*13,290-(i%3)*25,3,'#9caeb8',1);
    if(kind===0) {
      s+=path('M-134 111 V-5 M-134 111 H134','#768b99',1.5);
      s+=reveal('M-130 95 C-50 94-25 29 25 34 S89-26 132-34','#257d9e',clamp((t-.3)/.8),4);
      s+=reveal('M-130 94 C-76 89-2 71 44 54 S100 56 132 42','#d58b3e',clamp((t-.5)/.8),3);
    } else s+=group(kind===1?model('#2a718b',t):sensor('#2a718b',t),0,50,1,.8);
    for(let i=0;i<6;i++)s+=rect(-160,151+i*12,290-(i%2)*37,3,'#9caeb8',1);
    return group(s,x,y,opacity,scale);
  }
  function research(t,c) {
    const local=t-c.cues[5].start,a=c.colors.cyan;
    let s=header('PUBLIC RESEARCH','辅助驾驶论文','以公开研究，拆解技术路线',a);
    const slide=ease((local-.25)/1.1),scan=clamp((local-.65)/1.1);
    s+=page(140-100*slide,885,.88,.36,'感知与计算',1,local,a);
    s+=page(680-140*slide,885,1.65,1,'辅助驾驶 · 技术研究',0,local,a);
    s+=page(1210-170*slide,885,.88,.36,'模型与控制',2,local,a);
    s+=rect(233,470+scan*830,614,3,a,1,'opacity=".7"');
    const labels=['芯片','感知','算法','执行'];
    labels.forEach((v,i)=>{const p=ease((local-.8-i*.14)/.4);s+=group(circle(0,0,5,a)+text(0,44,v,26,a,'text-anchor="middle"'),280+i*173,1430+25*(1-p),p);});
    s+=center(1560,'文献检索示意 · 非论文原文或研究结论',22,'#71899a');
    return s;
  }
  function dimensions(t,c) {
    const local=t-c.cues[7].start,cols=[c.colors.cyan,c.colors.mint,c.colors.purple,c.colors.amber];
    let s=header('FOUR DIMENSIONS','四个维度，看升级空间','芯片 · 感知 · 算法 · 执行',cols[0]);
    const xy=[[302,690],[778,690],[302,1200],[778,1200]];
    s+=line(540,478,540,1445,'#263747',1)+line(125,966,955,966,'#263747',1);
    xy.forEach(([x,y],i)=>{
      const p=ease((local-i*.36)/.45),color=cols[i];
      let cell=text(-110,-120,en[i],23,color,'letter-spacing="3"');
      cell+=group([chip,sensor,model,control][i](color,local),0,0,1,.95);
      cell+=text(0,151,names[i],54,undefined,'text-anchor="middle" font-weight="650"')+text(0,204,desc[i],27,'#90a5b6','text-anchor="middle"');
      s+=group(cell,x,y+34*(1-p),p);
    });
    s+=center(1565,'把技术差异，放进同一套评价框架',27,'#9baebd');
    return s;
  }
  function tiers(t,c) {
    const local=t-c.cues[8].start,start=c.cues[9].start-c.cues[8].start;
    const colors=[c.colors.cyan,'#92c6f8',c.colors.purple,'#bba9d9','#9aaabd'];
    const heads=[272,480,688,896];
    let s=header('FIVE TIERS',t<c.cues[9].start?'国内车企，统一坐标':'S · A · B · C · D','辅助驾驶方案 · 五档框架',colors[0]);
    heads.forEach((x,i)=>{
      const p=ease((local-i*.08)/.35);
      s+=group(text(0,0,names[i],30,'#b2c2cd','text-anchor="middle"'),x,457+20*(1-p),p);
    });
    for(let row=0;row<5;row++) {
      const y=545+row*192,p=ease((local-start-row*.12)/.42),color=colors[row];
      s+=rect(77,y,926,160,'#0b1722',19,`stroke="#2b414f" stroke-width="1.5"`);
      s+=line(190,y+22,190,y+138,'#2b414f',1);
      s+=text(131,y+108,'SABCD'[row],72,color,`text-anchor="middle" font-weight="600" opacity="${p}"`);
      heads.forEach((x,col)=>{
        s+=rect(x-75,y+57,150,49,'#07121c',10,`stroke="#3b5264" stroke-width="1.5"`);
        for(let j=0;j<5;j++) {
          s+=rect(x-62+j*25,y+68,18,27,'#203242',4);
          const v=clamp((p*(5-row)-j)*2);
          if(j<5-row)s+=rect(x-62+j*25,y+68,18,27,color,4,`opacity="${v}"`);
        }
      });
    }
    s+=center(1578,c.disclaimer,25,'#8fa6b7');
    return s;
  }
  function render(time,c) {
    const t=clamp(Number(time)||0,0,c.duration-0.00001),q=c.cues;
    let s=t<q[1].start?hook(t,c):t<q[5].start?divergence(t,c):t<q[7].start?research(t,c):t<q[8].start?dimensions(t,c):tiers(t,c);
    const caption=c.captions?q.find(v=>t>=v.start&&t<v.end):null;
    if(caption)s+=center(1730,caption.text,caption.text.length>16?43:48,'#ffffff','font-weight="700"');
    s+=line(76,1810,1004,1810,'#233746',1)+text(76,1855,'辅助驾驶技术路线系列',22,'#728a9d')+text(1004,1855,'工程示意 / 2D',19,'#728a9d','text-anchor="end" letter-spacing="2"');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><radialGradient id="bg"><stop stop-color="#0d1e2b"/><stop offset="1" stop-color="${c.colors.background}"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#bg)"/><g font-family="Noto Sans CJK SC, PingFang SC, sans-serif" style="font-variant-numeric:tabular-nums">${s}</g></svg>`;
  }
  return {render,validate};
});
