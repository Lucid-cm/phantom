// Spring physics, drag/flick, eye-vs-body pokes, stare contest, motes. DOM only; rules live in phantom.js.
export function initPlay(c){
 const {cr,ph,stage}=c,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 let hits=[],x=0,y=0,vx=0,vy=0,hx=0,hy=0,drag=null,raf=0,last=0,tapAt=0,lp=0,st=0,b={x:0,t:0,b:0};
 function bounds(){const r=cr.getBoundingClientRect(),top=r.top-y;b={x:Math.max(0,(innerWidth-r.width)/2-6),t:-(top-70),b:Math.max(0,innerHeight-r.height-top-140)}}
 function hit(){if(Math.hypot(vx,vy)<350)return;c.act('shock',450);const n=performance.now();hits=hits.filter(h=>n-h<4000);hits.push(n);if(hits.length>=3){hits=[];c.rough()}}
 function loop(t){const dt=Math.min(.032,(t-last)/1000||.016);last=t;
  if(!drag){vx+=(-60*x-9*vx)*dt;vy+=(-60*y-9*vy)*dt;x+=vx*dt;y+=vy*dt;
   if(Math.abs(x)>b.x){x=Math.sign(x)*b.x;hit();vx*=-.7}if(y<b.t){y=b.t;hit();vy*=-.7}if(y>b.b){y=b.b;hit();vy*=-.7}}
  const sy=1+cl(vy/3000,-.2,.2);cr.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(1/sy).toFixed(3)},${sy.toFixed(3)})`;
  hx+=(-vx*.025-hx)*.2;hy+=(-vy*.025-hy)*.2;ph.style.setProperty('--hx',cl(hx,-12,12).toFixed(1));ph.style.setProperty('--hy',cl(hy,-12,12).toFixed(1));
  if(drag||Math.abs(x)+Math.abs(y)+Math.abs(vx)+Math.abs(vy)>.6)raf=requestAnimationFrame(loop);else{cr.style.transform='';ph.style.setProperty('--hx',0);ph.style.setProperty('--hy',0);raf=0}}
 const kick=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}};
 cr.addEventListener('pointerdown',e=>{if(drag)return;try{cr.setPointerCapture(e.pointerId)}catch{}bounds();c.gaze(e);
  drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:x,oy:y,moved:false,eye:!!e.target.closest('.eye'),t0:performance.now(),pt:performance.now()};
  if(drag.eye){c.say("don't blink.");st=setTimeout(()=>{if(drag&&!drag.moved){drag.stared=true;c.stareWin()}},5000)}
  else lp=setTimeout(()=>{if(drag&&!drag.moved){drag.long=true;c.openMenu()}},520)});
 cr.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
  if(!drag.moved&&Math.hypot(dx,dy)>12&&!c.calm()){drag.moved=true;clearTimeout(lp);clearTimeout(st);c.touch();c.mark(4000,'curious');kick()}
  if(drag.moved){const nx=cl(drag.ox+dx,-b.x,b.x),ny=cl(drag.oy+dy,b.t,b.b),n=performance.now(),dt=Math.max(.008,(n-drag.pt)/1000);
   vx=vx*.6+(nx-x)/dt*.4;vy=vy*.6+(ny-y)/dt*.4;x=nx;y=ny;drag.pt=n;c.look(-vx/200,-vy/200)}});
 const end=e=>{if(!drag||e.pointerId!==drag.id)return;clearTimeout(lp);clearTimeout(st);const d=drag;drag=null;
  if(d.moved){if(Math.hypot(x,y)>80){c.gain('sling');c.task('sling');c.say(Math.hypot(vx,vy)>500?'wheeee!':'boing.',true);c.mark(6000,'excited');c.blip(560,.15)}kick();return}
  if(d.long||d.stared)return;
  if(d.eye&&performance.now()-d.t0>600){c.say('you looked away.');return}
  const n=Date.now();if(n-tapAt<300){tapAt=0;c.dbl(d.eye)}else{tapAt=n;c.tap(d.eye)}};
 cr.addEventListener('pointerup',end);cr.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id){clearTimeout(lp);clearTimeout(st);drag=null;kick()}});
 cr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();c.tap(false)}});
 addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!drag)c.gaze(e)});
 // motes: drift in, tap one before it fades
 function spawn(){const m=document.createElement('button');m.className='mote';m.setAttribute('aria-label','catch the mote');
  m.style.left=(15+Math.random()*65)+'%';m.style.top=(10+Math.random()*45)+'%';const gone=setTimeout(()=>m.remove(),4600);
  m.onclick=()=>{clearTimeout(gone);m.remove();c.touch();c.mark(3000,'curious');c.gain('mote');c.task('mote');c.act('hop',650);c.blip(840,.1);c.say('got it.',true)};
  stage.append(m);const a=m.getBoundingClientRect(),r=cr.getBoundingClientRect();c.look((a.left+22-r.left-r.width/2)/18,(a.top+22-r.top-r.height/2)/18)}
 setTimeout(spawn,7000);
 setInterval(()=>{if(document.visibilityState==='visible'&&!stage.querySelector('.mote')&&c.mood()!=='SLEEPING'&&!drag)spawn()},22000);
}
