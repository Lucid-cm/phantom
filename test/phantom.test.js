import test from 'node:test';import assert from 'node:assert/strict';
import {syncUnlocks,logOpen,usualHour,openReaction,fmtHour,rhythmLine,cardInfo,cleanName,dailyTasks,progressTask,checkStreak,POOL,fresh,earn,levelOf,progress,deriveMood,load,save,KEY,SOURCES} from '../src/phantom.js';
const T=Date.UTC(2026,9,18,12,0,0);
test('levels',()=>{assert.equal(levelOf(0),1);assert.equal(levelOf(39),1);assert.equal(levelOf(40),2);assert.equal(levelOf(160),3);assert.equal(levelOf(1e9),10);assert.equal(progress(40).pct,0)});
test('rapid taps are throttled',()=>{const s=fresh(T);let g=0;for(let i=0;i<30;i++)g+=earn(s,"tap",T+i*100).gained;assert.equal(g,SOURCES.tap.xp)});
test('daily cap holds, then resets next day',()=>{const s=fresh(T);let g=0;for(let i=0;i<100;i++)g+=earn(s,'tap',T+i*5000).gained;assert.equal(g,SOURCES.tap.cap);
 assert.equal(earn(s,'tap',T+86400000*2).gained,SOURCES.tap.xp)});
test('level up unlocks',()=>{const s=fresh(T);s.xp=39;const r=earn(s,'tap',T);assert.equal(r.levelUp,2);assert.ok(s.unlocked.includes('honey'))});
test('checkin once per day',()=>{const s=fresh(T);assert.equal(earn(s,'checkin',T).gained,15);assert.equal(earn(s,'checkin',T+1000).gained,0)});
const ctx=o=>({now:T,last:T,hour:12,sleeping:false,lowBattery:false,until:{excited:0,curious:0,happy:0},...o});
test('mood priorities',()=>{assert.equal(deriveMood(ctx({})),'CALM');assert.equal(deriveMood(ctx({last:T-50000})),'SLEEPY');assert.equal(deriveMood(ctx({last:T-130000})),'SLEEPING');
 assert.equal(deriveMood(ctx({hour:2,last:T-61000})),'SLEEPING');assert.equal(deriveMood(ctx({until:{excited:0,curious:0,happy:T+1}})),'HAPPY');
 assert.equal(deriveMood(ctx({lowBattery:true})),'SLEEPY');assert.equal(deriveMood(ctx({until:{excited:T+1,curious:T+1,happy:T+1}})),'EXCITED')});
test('mood is stable across repeated derivation',()=>{const c=ctx({});assert.equal(deriveMood(c),deriveMood(c))});
test('persistence round trip + corrupt data',()=>{const m=new Map(),st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 const s=fresh(T);s.xp=200;s.look='honey';s.settings.sound=true;save(st,s);const r=load(st,T+1);assert.equal(r.xp,200);assert.equal(r.look,'honey');assert.equal(r.settings.sound,true);
 m.set(KEY,'{bad');assert.equal(load(st,T).xp,0);assert.equal(fresh(T).settings.sound,false)});

const day=n=>T+n*864e5;const finish=(s,now)=>{let b=false;for(const id of dailyTasks(new Date(now).getFullYear()+'-'+(new Date(now).getMonth()+1)+'-'+new Date(now).getDate())){const n=POOL.find(p=>p.id===id).n;for(let i=0;i<n;i++){const r=progressTask(s,id,now);if(r&&r.bonus)b=true}}return b};
test('daily tasks: 3 unique, stable, vary by day',()=>{const a=dailyTasks('2026-10-18');assert.equal(a.length,3);assert.equal(new Set(a).size,3);assert.deepEqual(a,dailyTasks('2026-10-18'));
 assert.ok(new Set(Array.from({length:30},(_,i)=>dailyTasks('2026-11-'+(i+1)).join())).size>1)});
test('bonus once per day; streak grows on consecutive days, resets after a gap',()=>{const s=fresh(T);assert.equal(finish(s,day(0)),true);assert.equal(s.streak.n,1);
 assert.equal(progressTask(s,s.tasks.ids[0],day(0)),null);assert.equal(finish(s,day(1)),true);assert.equal(s.streak.n,2);
 assert.equal(checkStreak(s,day(2)),false);assert.equal(checkStreak(s,day(4)),true);assert.equal(s.streak.n,0)});
test('tasks outside today\'s set are ignored',()=>{const s=fresh(T);const other=POOL.find(p=>!dailyTasks('2026-10-18').includes(p.id)).id;assert.equal(progressTask(s,other,T),null)});

test('card name is sanitised, trimmed, capped, defaulted',()=>{assert.equal(cleanName('  <b>Ghosty</b>\n '),'bGhosty/b');assert.equal(cleanName(''),'PHANTOM');assert.equal(cleanName('x'.repeat(40)).length,14);assert.equal(cleanName(null),'PHANTOM')});
test('card info reflects level, streak, crying',()=>{const s=fresh(T);s.xp=200;s.streak={n:3,last:''};s.name='Mo';const i=cardInfo(s,'HAPPY',false);assert.deepEqual([i.name,i.level,i.streak,i.mood],['Mo',3,3,'HAPPY']);
 assert.equal(cardInfo(s,'CALM',true).mood,'CRYING');assert.equal(cardInfo(s,'SLEEPING',true).mood,'SLEEPING')});

const at=(d,h,m=0)=>new Date(2026,9,d,h,m).getTime();
const withLog=(days,hs)=>{const s=fresh(at(14,12));s.rhythm.log=days.map((d,i)=>({k:`2026-10-${d}`,h:hs[i]}));return s};
test('rhythm: learning until 3 days, one log per day, rolling 14',()=>{const s=fresh(at(1,9));assert.equal(usualHour(s).state,'learning');assert.equal(logOpen(s,at(1,9)),true);assert.equal(logOpen(s,at(1,18)),false);
 for(let d=2;d<=20;d++)logOpen(s,at(d,9));assert.equal(s.rhythm.log.length,14);assert.match(rhythmLine(withLog([14,15],[21,21])),/learning/)});
test('rhythm: finds usual hour, handles midnight wrap, rejects scatter',()=>{const a=usualHour(withLog([14,15,16,17],[21,21.5,20.5,21]));assert.equal(a.state,'known');assert.equal(fmtHour(a.hour),'9pm');
 const w=usualHour(withLog([14,15,16,17],[23.5,0.5,23.8,0.2]));assert.equal(w.state,'known');assert.equal(fmtHour(w.hour),'12am');assert.equal(usualHour(withLog([14,15,16,17],[2,8,14,20])).state,'none')});
test('rhythm reactions: ontime, late, early, missed, same-day',()=>{const s=withLog([14,15,16,17,18],[21,21,21,21,21]);
 assert.equal(openReaction(s,at(19,21,30)).kind,'ontime');assert.equal(openReaction(s,at(19,23,30)).kind,'late');assert.equal(openReaction(s,at(19,18,0)).kind,'early');
 assert.equal(openReaction(s,at(25,21,0)).kind,'missed');const t2=withLog([15,16,17,18,19],[21,21,21,21,21]);assert.equal(openReaction(t2,at(19,22,0)).kind,'same')});
test('rhythm bonus xp is capped to once a day',()=>{const s=fresh(T);assert.equal(earn(s,'rhythm',T).gained,6);assert.equal(earn(s,'rhythm',T+1000).gained,0)});

test('tricks unlock by level',()=>{const s=fresh(T);s.xp=360;syncUnlocks(s);for(const i of['squish','dance','flip'])assert.ok(s.unlocked.includes(i));assert.ok(!s.unlocked.includes('derp'));s.xp=640;syncUnlocks(s);assert.ok(s.unlocked.includes('derp'))});
