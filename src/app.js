import {logOpen,openReaction,rhythmLine,cardInfo,POOL,rollTasks,progressTask,checkStreak,SOURCES,UNLOCKS,MAX_LEVEL,levelOf,progress,earn,deriveMood,load,save,fresh,syncUnlocks,dayKey,KEY} from './phantom.js';
import {createBrowserDevice} from './device.js';
import {initPlay} from './play.js';
import {shareCard} from './share.js';
const $=s=>document.querySelector(s),ph=$('#phantom'),body=document.body,msg=$('#msg');
const reduceOS=matchMedia('(prefers-reduced-motion: reduce)').matches;
const first=!localStorage.getItem(KEY);
let s=load(localStorage,Date.now(),reduceOS);
const away=Date.now()-s.last;
const until={excited:0,curious:0,happy:0};let sleeping=false,mood='',actT,msgT,lpT,tapAt=0,ci=0,busy=false,cry=false,comfort=0;
const dev=createBrowserDevice();
const persist=()=>save(localStorage,s);
// ---- sound (off by default; synthesized, no assets)
let ac;function blip(f=520,d=.09){if(!s.settings.sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;o.type='sine';
 g.gain.setValueAtTime(.05,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}}
const buzz=()=>navigator.vibrate&&navigator.vibrate(12);
// ---- helpers
let lock=0;function say(t,f){if(!f&&Date.now()<lock)return;if(f)lock=Date.now()+2600;clearTimeout(msgT);msg.style.opacity=0;setTimeout(()=>{msg.textContent=t;msg.style.opacity=.9},120);}
function act(n,ms=700){clearTimeout(actT);ph.dataset.act=n;actT=setTimeout(()=>delete ph.dataset.act,ms)}
const pick=a=>a[ci++%a.length];
const hour=()=>new Date().getHours();
function touch(){s.last=Date.now();if(sleeping){sleeping=false;act('wake',1000)}}
function mark(ms,k){until[k]=Math.max(until[k],Date.now()+ms)}
function gain(src){const r=earn(s,src);if(r.levelUp){mark(6000,'excited');act('hop',650);blip(780,.25);say(r.levelUp===3||r.levelUp===7?`level ${r.levelUp}. a new expression.`:`level ${r.levelUp}. something new.`,true)}
 persist();render();return r}
// ---- mood
function refresh(){const d=dev.read();const m=deriveMood({now:Date.now(),last:s.last,hour:d.hour,sleeping,until,lowBattery:d.batteryAvailable&&d.battery!=null&&d.battery<15&&!d.charging});
 if(m!==mood){const was=mood;mood=m;ph.dataset.m=m;body.dataset.m=m;
  if(was==='SLEEPING'&&m!=='SLEEPING'&&was)say('mm. awake.');if(m==='SLEEPING'&&was)say('…')}
 $('#moodw').textContent=cry&&m!=='SLEEPING'?'crying':m.toLowerCase()}
// ---- crying, tasks, helpers for play.js
function setCry(v,why){cry=v;comfort=0;if(v){ph.dataset.cry=1;ph.style.setProperty('--gx',0);ph.style.setProperty('--gy',4);say(why,true)}else delete ph.dataset.cry;refresh()}
function soothe(n){if(!cry)return;comfort+=n;if(comfort>=3){cry=false;comfort=0;delete ph.dataset.cry;gain('comfort');mark(15000,'happy');say('okay. okay. thank you.',true)}else say('sniff.')}
function scold(){touch();act('surprise',600);blip(220,.2);setCry(true,'...why would you say that.')}
function look(x,y){const c=v=>Math.max(-7,Math.min(7,v));ph.style.setProperty('--gx',c(x).toFixed(1));ph.style.setProperty('--gy',c(y).toFixed(1))}
function task(id){const r=progressTask(s,id);if(!r)return;if(r.done&&!r.bonus)say('task done.',true);if(r.bonus){gain('bonus');say(`all three done. streak ${s.streak.n}.`,true)}persist();render()}
function applyRhythm(rx){const m=rx&&{ontime:'right on time. i was waiting.',late:"you're late today. i waited.",early:'so early. i am still waking up.',missed:'you skipped some days. i kept your hour.'}[rx.kind];if(!m)return;
 if(rx.kind==='ontime'){gain('rhythm');mark(8000,'happy');act('hop',650);blip(700,.15)}say(m,true);refresh()}
function stareWin(){gain('stare');task('stare');ph.classList.add('blink');setTimeout(()=>ph.classList.remove('blink'),160);act('hop',650);mark(6000,'happy');say('you win. i blinked first.',true);blip(620,.2)}
// ---- interactions
function tap(eye){const was=mood;touch();const r=gain('tap');const sur=was==='SLEEPING'||eye;act(sur?'surprise':'tap',was==='SLEEPING'?900:sur?450:380);
 if(eye){ph.classList.add('blink');setTimeout(()=>ph.classList.remove('blink'),160)}blip(480);buzz();
 if(cry){soothe(1);refresh();return}
 if(!r.gained&&r.why==='cooldown')say('slower. it tickles.');else if(r.gained)say(eye?'hey! that is my eye.':pick(['hm?','there.','oh!','yes?']));mark(2500,'happy');refresh()}
function dbl(){touch();const r=gain('double');act(s.unlocked.includes('spin')?'spin':'hop',900);blip(660,.18);mark(6000,'excited');say(r.gained?'!!':'again? i am dizzy.');refresh()}
function pet(){touch();const r=gain('pet');task('pet');soothe(3);mark(20000,'happy');act('tap',380);blip(420,.15);say(r.gained?'mmm.':'still warm from before.');refresh()}
function play(){if(busy)return;touch();busy=true;const r=gain('play');mark(5000,'curious');const dot=$('#dot'),t0=performance.now();say('what is that?');
 (function f(t){const p=(t-t0)/2600;if(p>=1){dot.style.opacity=0;ph.style.setProperty('--gx',0);ph.style.setProperty('--gy',0);busy=false;return}
  const x=Math.sin(p*Math.PI*3)*90,y=-Math.abs(Math.cos(p*Math.PI*2))*40;dot.style.opacity=.8;dot.style.transform=`translate(${x}px,${y}px)`;
  ph.style.setProperty('--gx',x/14);ph.style.setProperty('--gy',y/14);requestAnimationFrame(f)})(t0)}
function expr(id){touch();const r=gain('expr');act(id,1000);mark(8000,'happy');blip(700,.15);say(id==='spin'?'wheee.':'squish.');refresh()}
function toggleSleep(){if(sleeping||mood==='SLEEPING'){touch();say('mm. awake.')}else{sleeping=true;delete ph.dataset.act;say('goodnight.')}refresh()}
function gaze(e){const r=$('#creature').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.5;
 const dx=(e.clientX-cx)/r.width,dy=(e.clientY-cy)/r.height;const n=Math.hypot(dx,dy)||1,k=Math.min(1,n*2)*7/n;
 ph.style.setProperty('--gx',(dx*k).toFixed(1));ph.style.setProperty('--gy',(dy*k).toFixed(1))}
const cr=$('#creature');cr.addEventListener('contextmenu',e=>e.preventDefault());
// idle eye wander + blinking (natural variation, not mood)
setInterval(()=>{if(busy||cry||mood==='SLEEPING')return;ph.style.setProperty('--gx',(Math.random()*8-4).toFixed(1));ph.style.setProperty('--gy',(Math.random()*5-2.5).toFixed(1))},4200);
(function blink(){setTimeout(()=>{if(mood!=='SLEEPING'){ph.classList.add('blink');setTimeout(()=>ph.classList.remove('blink'),140)}blink()},2400+Math.random()*3600)})();
// ---- menu
const menu=$('#menu');
function openMenu(){menu.replaceChildren();const add=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{closeMenu();f()};menu.append(b)};
 add('pet',pet);add('play',play);add('scold',scold);add(sleeping||mood==='SLEEPING'?'wake':'sleep',toggleSleep);
 UNLOCKS.filter(u=>u.kind==='expr'&&s.unlocked.includes(u.id)).forEach(u=>add(u.name.toLowerCase(),()=>expr(u.id)));menu.hidden=false;menu.firstChild.focus()}
function closeMenu(){menu.hidden=true}
$('#act').onclick=()=>menu.hidden?openMenu():closeMenu();
addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target.id!=='act'&&!cr.contains(e.target))closeMenu()});
// ---- sheets
function sheet(id){['prog','set'].forEach(k=>$('#'+k).hidden=k!==id);if(id==='prog')renderProg();if(id==='set')renderSet()}
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{closeMenu();sheet(b.dataset.open)});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>sheet(null));
addEventListener('keydown',e=>{if(e.key==='Escape'){sheet(null);closeMenu()}});
function renderProg(){const p=progress(s.xp),d=dev.read(),el=$('#progbody'),done=k=>(s.day.by[k]||0)>=SOURCES[k].cap,night=d.hour>=20||d.hour<5;
 el.replaceChildren();const h=(t,tag='div',c='')=>{const e=document.createElement(tag);e.textContent=t;if(c)e.className=c;el.append(e);return e};
 h(`level ${p.L}`,'h2');h(String(p.L),'div','big');h(p.L>=MAX_LEVEL?'max level':`${p.left} xp to level ${p.L+1}`,'p','note');h(rhythmLine(s),'p','note');
 const row=(t,em,f,dis)=>{const b=document.createElement('button');b.className='row';b.disabled=!!dis;b.append(t);const e=document.createElement('em');e.textContent=em;b.append(e);if(f)b.onclick=f;el.append(b)};
 row('share card','png for your post',()=>shareCard(cardInfo(s,mood,cry),x=>say(x,true)));h(`today · streak ${s.streak.n} ${s.streak.n===1?'day':'days'}`,'h3');rollTasks(s);s.tasks.ids.forEach(id=>{const d=POOL.find(p=>p.id===id),n=s.tasks.prog[id]||0;row(d.t,n>=d.n?'done':`${n}/${d.n}`,null,true)});
 h('rituals','h3');row('daily check-in',done('checkin')?'done today':'+15 xp',()=>{touch();gain('checkin');mark(8000,'happy');say('you came back.');refresh();renderProg()},done('checkin'));
 row('say goodnight',done('goodnight')?'done today':night?'+10 xp':'after 8pm',()=>{touch();gain('goodnight');mark(8000,'happy');say('goodnight.');refresh();renderProg()},done('goodnight')||!night);
 row('keep it company',`${Math.min(5,Math.floor((s.active%300))/60|0)}/5 min · +8 xp`,null,true);
 h('unlocks','h3');UNLOCKS.forEach(u=>{const own=s.unlocked.includes(u.id),on=u.kind==='look'&&s.look===u.id;
  row(`${u.name.toLowerCase()} ${u.kind==='look'?'eye':'expression'}`,!own?`level ${u.lv}`:u.kind==='expr'?'in menu':on?'wearing':'wear',u.kind==='look'&&own?()=>{s.look=u.id;body.dataset.look=u.id;persist();renderProg()}:null,!own||u.kind==='expr'||on)})}
function renderSet(){$('#nm').value=s.name||'';document.querySelectorAll('[data-set]').forEach(b=>{const v=s.settings[b.dataset.set];b.setAttribute('aria-pressed',v);b.lastChild.textContent=v?'on':'off'});
 const d=dev.read(),dl=$('#dev');dl.replaceChildren();const r=(k,v)=>{const a=document.createElement('div'),t=document.createElement('dt'),e=document.createElement('dd');t.textContent=k;e.textContent=v;a.append(t,e);dl.append(a)};
 r('battery',d.batteryAvailable&&d.battery!=null?`${d.battery}%${d.charging?' · charging':''}`:'not available in this browser');
 r('connection',d.online?'online':'offline');r('local time',new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}
document.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{const k=b.dataset.set;s.settings[k]=!s.settings[k];persist();applySettings();renderSet();if(k==='sound'&&s.settings.sound)blip(520)});
function applySettings(){body.dataset.ambient=s.settings.ambient?'on':'off';body.dataset.calm=(s.settings.reduceMotion||reduceOS)?'on':'off'}
$('#nm').oninput=e=>{s.name=e.target.value.slice(0,14);persist()};
$('#reset').onclick=()=>{$('#confirm').hidden=false;$('#yes').focus()};$('#no').onclick=()=>{$('#confirm').hidden=true};
$('#yes').onclick=()=>{s=fresh(Date.now(),reduceOS);persist();body.dataset.look='amber';sleeping=false;$('#confirm').hidden=true;applySettings();render();renderSet();say('a clean start.');refresh()};
// ---- render
function render(){const p=progress(s.xp);$('#lv').textContent=`lv ${p.L}`;$('#fill').style.width=(p.pct*100)+'%';$('#xpn').textContent=p.L>=MAX_LEVEL?'max':`${p.into} / ${p.span}`;body.dataset.look=s.look}
// ---- device reactions (real events only)
dev.on((k,d)=>{touch0();if(k==='charging'){mark(7000,d.charging?'excited':'curious');say(d.charging?'warm. thank you.':'back on my own.');if(d.charging)act('surprise',700);if(d.charging&&cry)soothe(3);blip(d.charging?740:380,.2)}
 else if(k==='battery'&&d.battery<=15&&!d.charging)say(`running low. ${d.battery}%.`);if(d.battery<=10&&!cry)setCry(true,'i am so tired. plug me in?');
 else if(k==='offline'){mark(6000,'curious');say('the signal went quiet.')}else if(k==='online'){mark(6000,'happy');say('voices again.')}
 else if(k==='hour'&&d.hour===23)say('it is late. i will stay up with you.');refresh();if(!$('#set').hidden)renderSet()});
function touch0(){/* device events are not user interactions: do not reset idle */}
// ---- time online -> company xp (foreground and recently touched only)
setInterval(()=>{refresh();if(document.visibilityState==='visible'&&Date.now()-s.last<60000){s.active+=1;if(s.active%300===0){gain('company');say('you stayed a while.')}if(s.active%30===0)persist()}},1000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist()});
// ---- boot
initPlay({cr,ph,stage:$('main'),say,act,touch,mark,gain,task,tap,dbl,openMenu,rough:()=>{if(!cry)setCry(true,'too rough. that hurt.')},mood:()=>mood,look,gaze,stareWin,blip,calm:()=>body.dataset.calm==='on'});
const broke=checkStreak(s);rollTasks(s);const rx0=openReaction(s),newDay=logOpen(s),rx=newDay&&!first?rx0:null;
applySettings();render();
const h0=hour(),hrs=Math.round(away/36e5);
sleeping=false;s.last=Date.now();act('wake',1200);mark(4000,'curious');
say(first?'oh. hello.':away>36e5*2?`you were gone ${hrs} hours.`:h0>=5&&h0<11&&away>36e5*6?'morning.':h0>=23||h0<5?'it is late.':'hello again.');
persist();refresh();
if(!first){if(broke)setCry(true,'you missed a day. it waited.');else if(away>432e5)setCry(true,'you were gone a long time.')}
if(!cry)applyRhythm(rx);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
