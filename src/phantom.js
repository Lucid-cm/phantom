// Pure logic: no DOM. Tested in test/.
export const KEY='phantom.v1';
export const SOURCES={tap:{xp:2,cd:4000,cap:24},double:{xp:5,cd:15000,cap:25},pet:{xp:4,cd:20000,cap:32},play:{xp:5,cd:30000,cap:30},
 expr:{xp:3,cd:20000,cap:12},mote:{xp:3,cd:0,cap:15},stare:{xp:6,cd:0,cap:12},sling:{xp:4,cd:2000,cap:20},comfort:{xp:4,cd:60000,cap:12},bonus:{xp:10,cd:0,cap:10},rhythm:{xp:6,cd:0,cap:6},checkin:{xp:15,cd:0,cap:15},goodnight:{xp:10,cd:0,cap:10},company:{xp:8,cd:0,cap:24}};
export const UNLOCKS=[{id:'amber',kind:'look',name:'Amber',lv:1},{id:'honey',kind:'look',name:'Honey',lv:2},{id:'squish',kind:'expr',name:'Squish',lv:3},
 {id:'ember',kind:'look',name:'Ember',lv:5},{id:'spin',kind:'expr',name:'Spin',lv:7},{id:'moon',kind:'look',name:'Moonlit',lv:9}];
export const MAX_LEVEL=10;
export const need=L=>40*(L-1)**2; // total xp to reach level L
export const levelOf=xp=>Math.min(MAX_LEVEL,Math.floor(Math.sqrt(Math.max(0,xp)/40))+1);
export function progress(xp){const L=levelOf(xp);if(L>=MAX_LEVEL)return{L,pct:1,into:0,span:0,left:0};
 const lo=need(L),hi=need(L+1);return{L,pct:(xp-lo)/(hi-lo),into:xp-lo,span:hi-lo,left:hi-xp}}
export const dayKey=t=>{const d=new Date(t);return`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
export function fresh(now=Date.now(),reduce=false){return{v:1,xp:0,unlocked:['amber'],look:'amber',settings:{sound:false,reduceMotion:reduce,ambient:true},
 last:now,cool:{},day:{k:dayKey(now),by:{}},active:0,tasks:null,streak:{n:0,last:''},name:'',rhythm:{log:[]}}}
export function syncUnlocks(s){const L=levelOf(s.xp);for(const u of UNLOCKS)if(u.lv<=L&&!s.unlocked.includes(u.id))s.unlocked.push(u.id)}
function rollDay(s,now){const k=dayKey(now);if(s.day.k!==k)s.day={k,by:{}}}
export function earn(s,src,now=Date.now()){const d=SOURCES[src];if(!d)return{gained:0,why:'unknown'};rollDay(s,now);
 const by=s.day.by[src]||0;
 if(now-(s.cool[src]||0)<d.cd)return{gained:0,why:'cooldown'};
 if(by>=d.cap)return{gained:0,why:'cap'};
 const g=Math.min(d.xp,d.cap-by),before=levelOf(s.xp);s.xp+=g;s.cool[src]=now;s.day.by[src]=by+g;syncUnlocks(s);
 const after=levelOf(s.xp);return{gained:g,levelUp:after>before?after:0}}
// Mood is derived from timers set by real events, never random.
export function deriveMood(c){const idle=c.now-c.last,k=(c.hour>=23||c.hour<6)?.5:1;
 if(c.sleeping||idle>120000*k)return'SLEEPING';
 if(c.until.excited>c.now)return'EXCITED';if(c.until.curious>c.now)return'CURIOUS';if(c.until.happy>c.now)return'HAPPY';
 if(idle>45000*k||c.lowBattery)return'SLEEPY';return'CALM'}
export function load(store,now=Date.now(),reduce=false){const base=fresh(now,reduce);
 try{const r=JSON.parse(store.getItem(KEY)||'null');if(!r||r.v!==1)return base;
  const s={...base,...r,settings:{...base.settings,...r.settings},day:r.day&&r.day.by?r.day:base.day,cool:r.cool||{},unlocked:Array.isArray(r.unlocked)?r.unlocked:base.unlocked,tasks:r.tasks&&r.tasks.ids?r.tasks:null,streak:r.streak&&typeof r.streak.n==='number'?r.streak:base.streak,rhythm:{log:(r.rhythm&&Array.isArray(r.rhythm.log)?r.rhythm.log:[]).filter(e=>e&&typeof e.k==='string'&&Number.isFinite(e.h)).slice(-14)}};
  s.xp=Math.max(0,+s.xp||0);syncUnlocks(s);if(!s.unlocked.includes(s.look))s.look="amber";return s}catch{return base}}
export function save(store,s){try{store.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
// ---- daily micro tasks + streak (seeded by date: stable across reloads)
export const POOL=[{id:'mote',n:3,t:'catch 3 motes'},{id:'stare',n:1,t:'win a stare contest'},{id:'sling',n:2,t:'slingshot twice'},{id:'pet',n:2,t:'pet it twice'}];
const hash=x=>{let h=7;for(const c of x)h=(h*31+c.charCodeAt(0))>>>0;return h};
export const dailyTasks=k=>POOL.map(p=>[hash(k+p.id),p.id]).sort((a,b)=>a[0]-b[0]).slice(0,3).map(x=>x[1]);
const yest=now=>dayKey(now-864e5);
export function rollTasks(s,now=Date.now()){const k=dayKey(now);if(!s.tasks||s.tasks.k!==k)s.tasks={k,ids:dailyTasks(k),prog:{},bonus:false}}
export function progressTask(s,id,now=Date.now()){rollTasks(s,now);const t=s.tasks;if(!t.ids.includes(id))return null;const d=POOL.find(p=>p.id===id);
 if((t.prog[id]||0)>=d.n)return null;t.prog[id]=(t.prog[id]||0)+1;const done=t.prog[id]>=d.n;
 const all=t.ids.every(i=>(t.prog[i]||0)>=POOL.find(p=>p.id===i).n);let bonus=false;
 if(all&&!t.bonus){t.bonus=true;bonus=true;const st=s.streak,today=dayKey(now);if(st.last!==today){st.n=st.last===yest(now)?st.n+1:1;st.last=today}}
 return{done,all,bonus}}
export function checkStreak(s,now=Date.now()){const st=s.streak;if(st.n>0&&st.last!==dayKey(now)&&st.last!==yest(now)){st.n=0;return true}return false}
// ---- share card data (pure, testable)
export const cleanName=n=>String(n||'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,14)||'PHANTOM';
export const cardInfo=(s,mood,cry)=>({name:cleanName(s.name),level:levelOf(s.xp),streak:s.streak?s.streak.n:0,mood:cry&&mood!=='SLEEPING'?'CRYING':mood||'CALM',xp:s.xp});
// ---- rhythm memory: learns your usual hour from the first open of each day (local only, rolling 14 days)
export function logOpen(s,now=Date.now()){const d=new Date(now),k=dayKey(now),h=d.getHours()+d.getMinutes()/60;
 if(!s.rhythm||!Array.isArray(s.rhythm.log))s.rhythm={log:[]};const L=s.rhythm.log;if(L.length&&L[L.length-1].k===k)return false;
 L.push({k,h:+h.toFixed(2)});if(L.length>14)L.splice(0,L.length-14);return true}
export function usualHour(s){const L=(s.rhythm&&s.rhythm.log)||[];if(L.length<3)return{state:'learning',n:L.length};let x=0,y=0;
 for(const e of L){const a=e.h/24*2*Math.PI;x+=Math.cos(a);y+=Math.sin(a)}
 if(Math.hypot(x,y)/L.length<.75)return{state:'none',n:L.length};let m=Math.atan2(y,x)/(2*Math.PI)*24;if(m<0)m+=24;return{state:'known',hour:m,n:L.length}}
export function fmtHour(h){const n=Math.round(h)%24;return`${n%12||12}${n<12?'am':'pm'}`}
export function rhythmLine(s){const u=usualHour(s);return u.state==='learning'?`learning your rhythm · ${u.n}/3 days`:u.state==='none'?'no clear routine yet':`your usual hour · ${fmtHour(u.hour)}`}
// Call BEFORE logOpen for today's first open. Returns what PHANTOM should feel about the arrival time.
export function openReaction(s,now=Date.now()){const u=usualHour(s),L=s.rhythm.log,last=L[L.length-1];if(u.state!=='known')return{kind:u.state};
 if(last&&last.k===dayKey(now))return{kind:'same'};if(last&&last.k!==yest(now))return{kind:'missed'};
 const d=new Date(now),h=d.getHours()+d.getMinutes()/60,diff=(((h-u.hour+12)%24)+24)%24-12;
 if(Math.abs(diff)<=1)return{kind:'ontime',diff};if(diff>1&&diff<=8)return{kind:'late',diff};if(diff<-1&&diff>=-8)return{kind:'early',diff};return{kind:'off',diff}}
