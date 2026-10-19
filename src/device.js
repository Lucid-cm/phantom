// Browser device provider. Native Android integration would implement the same shape
// ({read(), on(fn)}) in a separate file and be swapped in app.js. Not included in v1.
export function createBrowserDevice(){
 const st={battery:null,charging:null,online:navigator.onLine,hour:new Date().getHours(),batteryAvailable:false};const subs=[];
 const emit=k=>subs.forEach(f=>f(k,{...st}));
 if(typeof navigator.getBattery==='function')navigator.getBattery().then(b=>{
  const rd=()=>{st.battery=Math.round(b.level*100);st.charging=b.charging};st.batteryAvailable=true;rd();emit('battery');
  b.addEventListener('levelchange',()=>{rd();emit('battery')});b.addEventListener('chargingchange',()=>{rd();emit('charging')});
 }).catch(()=>{});
 addEventListener('online',()=>{st.online=true;emit('online')});addEventListener('offline',()=>{st.online=false;emit('offline')});
 setInterval(()=>{const h=new Date().getHours();if(h!==st.hour){st.hour=h;emit('hour')}},30000);
 return{read:()=>({...st,hour:new Date().getHours()}),on:f=>subs.push(f)}}
