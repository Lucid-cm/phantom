// Share card: draws the creature to a canvas and hands it to the Android share sheet (or downloads it).
const LINK='lucid-cm.github.io/phantom';
const LIDS={SLEEPING:[1,0],SLEEPY:[.55,0],HAPPY:[0,.4],EXCITED:[0,.3],CRYING:[.3,.22],CALM:[0,0],CURIOUS:[0,0]};
export function drawCard(info){
 const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
 const eye=getComputedStyle(document.body).getPropertyValue('--eye').trim()||'#ffb02e',[lt,lb]=LIDS[info.mood]||[0,0];
 g.fillStyle='#09090a';g.fillRect(0,0,W,H);g.strokeStyle='#26241f';g.lineWidth=2;g.strokeRect(40,40,W-80,H-80);
 const k=3.2;g.save();g.translate((W-200*k)/2,150);g.scale(k,k);
 g.beginPath();g.ellipse(100,40,34,9,0,0,7);g.fillStyle='rgba(242,228,191,.07)';g.fill();g.strokeStyle='#f2e4bf';g.lineWidth=3;g.stroke();
 const body=new Path2D('M40 140C40 84 68 58 100 58s60 26 60 82v56q0 18-12 12t-22 4q-14 12-26 0-14 12-26 0t-22-4-12-12z');
 g.fillStyle='#26262b';g.fill(body);g.strokeStyle='#3b3a40';g.lineWidth=1.5;g.stroke(body);
 g.strokeStyle='#4a4950';g.lineWidth=3;g.lineCap='round';g.globalAlpha=.7;g.stroke(new Path2D('M54 118C56 90 72 74 92 70'));g.globalAlpha=1;
 g.save();g.beginPath();g.arc(100,128,30,0,7);g.clip();
 g.fillStyle=eye;g.fillRect(70,98,60,60);g.fillStyle='#1a1208';g.beginPath();g.arc(100,128,12,0,7);g.fill();
 g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(110,118,5,0,7);g.fill();
 g.fillStyle='#26262b';g.fillRect(70,98,60,60*lt);g.fillRect(70,158-60*lb,60,60*lb);g.restore();
 if(info.mood==='SLEEPING'){g.strokeStyle='#c97a12';g.lineWidth=3.5;g.beginPath();g.moveTo(80,132);g.quadraticCurveTo(100,144,120,132);g.stroke()}
 if(info.mood==='CRYING'){g.fillStyle='#a9c4d6';g.fill(new Path2D('M84 154q-4 8 0 11 4-3 0-11z'));g.fill(new Path2D('M116 154q-4 8 0 11 4-3 0-11z'))}
 g.restore();
 g.textAlign='center';g.fillStyle='#ece4d4';g.font='300 96px ui-rounded,system-ui,sans-serif';g.fillText(info.name,W/2,1040,W-160);
 g.fillStyle='#8d8678';g.font='400 40px ui-rounded,system-ui,sans-serif';
 g.fillText(`level ${info.level}${info.streak>0?` · ${info.streak}-day streak`:''}`,W/2,1105);
 g.fillStyle=eye;g.fillText(`feeling ${info.mood.toLowerCase()}`,W/2,1165);
 g.fillStyle='#8d8678';g.font='400 34px ui-rounded,system-ui,sans-serif';g.fillText(LINK,W/2,H-90);
 return cv}
export async function shareCard(info,say){
 const blob=await new Promise(r=>drawCard(info).toBlob(r,'image/png'));if(!blob){say('could not make the card.');return}
 const f=new File([blob],'phantom.png',{type:'image/png'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:`${info.name} · level ${info.level}`});return}}
 catch(e){if(e&&e.name==='AbortError')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='phantom.png';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),2000);say('saved the card.')}
