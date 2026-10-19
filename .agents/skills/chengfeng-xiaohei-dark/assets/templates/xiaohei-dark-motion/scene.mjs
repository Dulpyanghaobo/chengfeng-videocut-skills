/** Original fork illustration and rendering. Upstream methods / GSAP notices retained in the Skill. */
import {theme as c} from './theme.mjs';
import {sceneAt, DURATION} from './motion.mjs';
const stage = document.getElementById('stage');
for (const [key,value] of Object.entries(c)) document.documentElement.style.setProperty(`--${key}`,value);
const params = new URLSearchParams(location.search);
const embedded = params.get('embed') === '1';
if (embedded) document.documentElement.classList.add('embed');
const worker = (x,y,a) => {
  const hx = 60 + 18 * a.reach, hy = 20 - 26 * a.reach;
  return `<g class="worker" transform="translate(${x} ${y})">
    <path d="M-21 27 Q${-29-a.stepping*8} 57 ${-37-a.stepping*12} 75 L${-54-a.stepping*12} 78 M18 30 Q${30+a.stepping*8} 54 ${35+a.stepping*12} 76 L${55+a.stepping*12} 78" stroke="${c.ink}" stroke-width="9" fill="none"/>
    <path d="M-31 -5 Q-39 22 -25 39 Q0 50 27 35 L30 0Z" fill="${c.jacket}" stroke="${c.ink}" stroke-width="3.5"/>
    <path d="M-15 4 V26 H12 V4 M-15 16 H12" fill="none" stroke="${c.blue}" stroke-width="3"/>
    <path d="M-34 -2 Q-59 20 -43 41 M30 -2 Q54 ${17-a.reach*4} ${hx} ${hy}" stroke="${c.ink}" stroke-width="8" fill="none"/>
    <circle cx="-43" cy="41" r="6" fill="${c.orange}"/><circle class="hand" cx="${hx}" cy="${hy}" r="6" fill="${c.orange}"/>
    <path d="M-36 -31 V-48 Q-34 -77 -5 -79 Q28 -78 34 -49 V-31Z" fill="${c.helmet}" stroke="${c.ink}" stroke-width="3"/>
    <path d="M-38 -43 H37" stroke="${c.orange}" stroke-width="6"/>
    <rect x="-26" y="-42" width="55" height="28" rx="13" fill="${c.background}"/>
    <circle cx="10" cy="-30" r="3.8" fill="${c.ink}"/><circle cx="23" cy="-30" r="3.8" fill="${c.ink}"/>
    ${a.carry ? `<g class="held-order" transform="translate(${hx+15} ${hy-3})"><path d="M-13 -18 H14 L17 15 H-13Z" fill="${c.paper}" stroke="${c.blue}" stroke-width="3"/><path d="M-7 -9 H8 M-7 -2 H9 M-7 5 H5" stroke="${c.blue}" stroke-width="2.5"/></g>` : ''}
  </g>`;
};
const gear = (x,y,angle,active) => `<g class="gear" transform="translate(${x} ${y})" stroke="${active?c.orange:c.muted}" stroke-width="4" fill="none"><g transform="rotate(${angle})"><circle r="20"/>${Array.from({length:8},(_,i)=>`<path d="M0 -20 V-29" transform="rotate(${i*45})" stroke-width="8"/>`).join('')}<path d="M0 -13 V13 M-13 0 H13"/></g><circle r="5" fill="${c.surface}"/></g>`;
const factory = (x,y,a) => `<g class="machine" data-active="${a.active}" transform="translate(${x} ${y})" stroke="${c.ink}" stroke-width="5" fill="${c.surface}">
  <path d="M0 170 V0 L95 -68 V-8 L190 -77 V-8 L285 -60 V0 H400 V170Z"/>
  <path d="M340 0 V-100 H375 V0 M-132 136 H0 M400 136 H540 M-118 131 V89"/>
  <circle class="switch" cx="-118" cy="86" r="10" fill="${a.pressed?c.orange:c.background}"/>
  ${[-113,-69,-25,425,469,513].map(cx=>`<g class="roller" transform="translate(${cx} 151)" stroke-width="3.5"><circle r="11"/><path d="M-6 0 H6 M0 -6 V6" transform="rotate(${a.beltOffset*2})"/></g>`).join('')}
  <path d="M-108 163 V184 M-28 163 V184 M426 163 V184 M518 163 V184" stroke-width="4"/>
  <rect x="-8" y="108" width="16" height="28" rx="3" stroke-width="4"/><rect x="392" y="108" width="16" height="28" rx="3" stroke-width="4"/>
  ${gear(65,81,a.angle,a.active)}${gear(111,113,-a.angle*.8,a.active)}
  <path d="M304 70 H366 V122 H304Z M325 70 V122 M345 70 V122" stroke-width="4"/>
  ${a.active?`<path d="M316 91 L329 103 L353 80" fill="none" stroke="${c.orange}" stroke-width="5"/>`:''}
  <text x="211" y="105" text-anchor="middle" stroke="none" fill="${c.ink}" font-size="56" font-weight="600">7B</text></g>`;
const orders = (y,packets,continuous) => `<g class="inputs-outputs" transform="translate(440 ${y})" stroke="${continuous?c.orange:c.blue}" stroke-width="3">${packets.map(p=>`<g class="${p.output?'output':'input'}" transform="translate(${p.x} ${p.y})">${p.output?`<path d="M-16 -15 L0 -23 L17 -14 V14 L0 22 L-16 14Z" fill="${c.paper}"/><path d="M-16 -15 L0 -6 L17 -14 M0 -6 V22" fill="none"/>`:`<path d="M-14 -19 H12 L16 14 H-14Z" fill="${c.paper}"/><path d="M-8 -9 H7 M-8 -1 H8 M-8 6 H4" fill="none"/>`}</g>`).join('')}</g>`;
function draw(seconds) {
  const s = sceneAt(seconds);
  stage.innerHTML = `<rect id="background" width="1080" height="1920" fill="${c.background}"/>
    <g id="top">${factory(440,575,s.top)}${worker(s.top.workerX,667,s.top)}${orders(575,s.topPackets,false)}</g>
    <g id="bottom">${factory(440,1120,s.bottom)}${worker(s.bottom.workerX,1212,s.bottom)}${s.frame>=96?`<g class="order-queue" transform="translate(281 1241)" stroke="${c.blue}" stroke-width="3" fill="${c.paper}">${[0,1,2].map(i=>`<path d="M${-i*3} ${-i*5} h29 v-27 h-29Z"/>`).join('')}</g>`:''}${orders(1120,s.bottomPackets,true)}</g>
    <g id="annotations"><text x="118" y="350" fill="${c.blue}" font-size="44" opacity="${1-s.finish}" transform="rotate(-2 118 350)">同样的规模</text>
    <text x="435" y="825" fill="${c.blue}" font-size="37" opacity="${s.topLabel}">偶尔开工</text>
    <text x="435" y="1370" fill="${c.orange}" font-size="37" opacity="${s.bottomLabel}">持续处理</text>
    <text x="118" y="350" fill="${c.ink}" font-size="46" opacity="${s.finish}" transform="rotate(-2 118 350)">规模一样，忙法不同</text></g>
    <text x="100" y="1500" fill="${c.muted}" font-size="27">工厂类比 · 不作数量换算</text>`;
  document.getElementById('scrub').value = String(s.time);
  document.getElementById('time').textContent = `${s.time.toFixed(2)} / ${DURATION.toFixed(2)}`;
  stage.dataset.frame = String(s.frame);
  return s;
}
const clock = {seconds:0};
const tl = window.gsap.timeline({paused:true,onUpdate:()=>draw(clock.seconds),onComplete:()=>{document.getElementById('play').textContent='播放';}});
tl.fromTo(clock,{seconds:0},{seconds:DURATION,duration:DURATION,ease:'none',lazy:false,immediateRender:false});
window.renderAt = seconds => { const s=sceneAt(Number(seconds));tl.pause().seek(s.time,false);draw(s.time);document.getElementById('play').textContent='播放';return s; };
// Integration hook only: author must replace example cue times and verify provider/project before timeline insertion.
window.addEventListener('message',event=>{
  if(event.source!==window.parent || !event.data || event.data.type!=='videocut:seek')return;
  if(typeof event.data.time==='number' && Number.isFinite(event.data.time))window.renderAt(event.data.time);
});
document.getElementById('play').addEventListener('click',()=>{
  if(embedded)return;
  if(!tl.paused()){tl.pause();document.getElementById('play').textContent='播放';return;}
  if(tl.time()>=DURATION)window.renderAt(0);
  document.getElementById('play').textContent='暂停';tl.play();
});
document.getElementById('reset').addEventListener('click',()=>window.renderAt(0));
document.getElementById('scrub').addEventListener('input',event=>window.renderAt(Number(event.target.value)));
const requested=params.has('t')?Number(params.get('t')):params.get('static')==='1'?9.8:0;
window.renderAt(Number.isFinite(requested)?requested:0);
window.darkMotionReady = true;
