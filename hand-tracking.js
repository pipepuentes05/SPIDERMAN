// Pure identity and movement logic, independent of the UI and canvas.
export const CONFIG={cooldown:520,rearmMs:95,warmupMs:170,lossResetMs:300,identityMemoryMs:550,confidence:.72,poseTau:.055,maxJump:.30};
export const SENSITIVITY={soft:{high:1.05,low:.29},normal:{high:.68,low:.23},intense:{high:.43,low:.17}};
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const alpha=(dt,tau)=>1-Math.exp(-Math.max(0,dt)/tau);
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function mapLabel(raw,swap=false){if(raw!=='Left'&&raw!=='Right')return null;return swap?(raw==='Left'?'Right':'Left'):raw;}
export function handSample(hand){
 const lm=hand.landmarks;if(!lm||lm.length<21||!lm.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
 const mirrored=i=>({x:1-lm[i].x,y:lm[i].y});const wrist=mirrored(0),middle=mirrored(9),index=mirrored(5),pinky=mirrored(17);
 const center={x:(wrist.x+middle.x+index.x+pinky.x)/4,y:(wrist.y+middle.y+index.y+pinky.y)/4};
 return {wrist,middle,center,index,pinky,size:Math.max(.025,distance(index,pinky)),landmarks:lm};
}
export class MotionGate{
 constructor(){this.lastShot=-Infinity;this.reset();}
 reset(){this.previous=null;this.velocity={x:0,y:0};this.speed=0;this.armed=true;this.lowSince=null;this.acquiredAt=null;}
 miss(){this.reset();}
 update(position,now,sensitivity='normal'){
  const settings=SENSITIVITY[sensitivity]||SENSITIVITY.normal;
  if(!this.previous){this.previous={...position,time:now};this.acquiredAt=now;return null;}
  const dt=(now-this.previous.time)/1000,dx=position.x-this.previous.x,dy=position.y-this.previous.y;
  if(dt<=0)return null;
  if(dt*1000>CONFIG.lossResetMs||Math.hypot(dx,dy)>CONFIG.maxJump){this.reset();this.previous={...position,time:now};this.acquiredAt=now;return null;}
  const a=alpha(dt,.06);this.velocity.x+=(dx/dt-this.velocity.x)*a;this.velocity.y+=(dy/dt-this.velocity.y)*a;this.speed=Math.hypot(this.velocity.x,this.velocity.y);this.previous={...position,time:now};
  if(this.speed<settings.low){if(this.lowSince===null)this.lowSince=now;if(now-this.lowSince>=CONFIG.rearmMs)this.armed=true;}else this.lowSince=null;
  if(now-this.acquiredAt<CONFIG.warmupMs)return null;
  if(this.armed&&this.speed>=settings.high&&now-this.lastShot>=CONFIG.cooldown){this.lastShot=now;this.armed=false;this.lowSince=null;const length=this.speed||1;return {x:this.velocity.x/length,y:this.velocity.y/length,speed:this.speed};}
  return null;
 }
}
export class Calibration{
 constructor(){this.reset();}
 reset(){this.step='right';this.candidate=null;this.since=null;this.rawRight=null;this.progress=0;this.swap=false;this.lastUpdate=null;}
 update(hands,now){
  if(this.step==='done')return {done:true,swap:this.swap,progress:1};
  if(this.lastUpdate!==null&&now-this.lastUpdate>1200){this.candidate=null;this.since=null;}this.lastUpdate=now;
  const eligible=hands.filter(h=>h.confidence>=.82&&(h.label==='Left'||h.label==='Right'));
  if(hands.length!==1||eligible.length!==1){this.candidate=null;this.since=null;this.progress=0;return {done:false,progress:0,message:'Muestra una sola mano con la palma visible.'};}
  const label=eligible[0].label;
  if(this.step==='left'&&label===this.rawRight){this.candidate=null;this.since=null;this.progress=0;return {done:false,progress:0,message:'Ahora baja la derecha y muestra solo la izquierda.'};}
  if(label!==this.candidate){this.candidate=label;this.since=now;}
  this.progress=clamp((now-this.since)/1000);
  if(this.progress>=1){
   if(this.step==='right'){this.rawRight=label;this.step='left';this.candidate=null;this.since=null;this.progress=0;return {done:false,next:true,progress:0};}
   this.swap=this.rawRight==='Left';this.step='done';return {done:true,swap:this.swap,progress:1};
  }
  return {done:false,progress:this.progress};
 }
}
function makeSlot(side){return {side,gate:new MotionGate(),target:null,lastSeen:-Infinity,detected:false,lastFire:-Infinity,ambiguous:false};}
export class HandManager{
 constructor(){this.slots={Left:makeSlot('Left'),Right:makeSlot('Right')};this.swapped=false;this.sensitivity='normal';}
 clearMotion(){for(const s of Object.values(this.slots))s.gate.reset();}
 resetTracking(){for(const s of Object.values(this.slots)){s.gate.reset();s.target=null;s.detected=false;s.lastSeen=-Infinity;s.ambiguous=false;}}
 setSwap(value){this.swapped=!!value;this.resetTracking();}
 update(hands,now,allowFire=true){
  const list=hands.map(h=>({...h,side:mapLabel(h.label,this.swapped),sample:handSample(h)})).filter(h=>h.sample);
  const previous={Left:this.slots.Left.target,Right:this.slots.Right.target};
  const tooClose=list.length===2&&distance(list[0].sample.center,list[1].sample.center)<.065;
  const shots=[];
  for(const side of ['Left','Right']){
   const slot=this.slots[side],other=this.slots[side==='Left'?'Right':'Left'];slot.detected=false;slot.ambiguous=false;
   const candidates=list.filter(h=>h.side===side);
   let candidate=candidates.length===1?candidates[0]:null;
   if(candidate&&(candidate.confidence<CONFIG.confidence||tooClose))candidate=null;
   if(candidate&&previous[side]&&previous[other.side]&&now-slot.lastSeen<CONFIG.identityMemoryMs&&now-other.lastSeen<CONFIG.identityMemoryMs){
    const own=distance(candidate.sample.center,previous[side].center),opposite=distance(candidate.sample.center,previous[other.side].center);
    // A confident category alone cannot transfer an existing spatial track to the other hand.
    if(own>.14&&opposite+.09<own){candidate=null;slot.ambiguous=true;}
   }
   if(!candidate){slot.gate.miss();if(candidates.length>1||tooClose)slot.ambiguous=true;continue;}
   slot.target=candidate.sample;slot.lastSeen=now;slot.detected=true;
   const direction=slot.gate.update(candidate.sample.center,now,this.sensitivity);
   if(direction&&allowFire){slot.lastFire=now;shots.push({side,direction,sample:slot.target});}
   if(!allowFire)slot.gate.reset();
  }
  return shots;
 }
 visibility(side,now){const slot=this.slots[side];return clamp(1-(now-slot.lastSeen-130)/220);}
}
export class HandDetector{
 constructor({onResult,onLoading,onError}){this.callbacks={onResult,onLoading,onError};this.worker=null;this.pending=null;this.busy=false;this.serial=0;}
 init(){this.stop();const serial=this.serial;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{if(serial!==this.serial)return;this.pending=null;reject(new Error('MODEL_TIMEOUT'));this.stop();},90000);this.pending={reject,timer};
  try{this.worker=new Worker(new URL('./hand-worker.js',import.meta.url));}catch(error){clearTimeout(timer);this.pending=null;reject(error);return;}
  this.worker.onmessage=({data})=>{if(serial!==this.serial)return;if(data.type==='loading')this.callbacks.onLoading(data.message);if(data.type==='ready'){clearTimeout(timer);this.pending=null;resolve();}if(data.type==='result'){this.busy=false;this.callbacks.onResult(data);}if(data.type==='error'){if(this.pending){clearTimeout(timer);this.pending=null;reject(new Error('MODEL_LOAD'));}else this.callbacks.onError(data.message);}};
  this.worker.onerror=event=>{event.preventDefault();if(serial!==this.serial)return;if(this.pending){clearTimeout(timer);this.pending=null;reject(new Error('MODEL_LOAD'));}else this.callbacks.onError('WORKER_ERROR');};this.worker.postMessage({type:'init'});
 });}
 async send(video,timestamp){if(this.busy||!this.worker)return;this.busy=true;const worker=this.worker,serial=this.serial;try{
  const bitmap=await createImageBitmap(video,{resizeWidth:640,resizeHeight:Math.round(640*video.videoHeight/video.videoWidth)});
  if(serial!==this.serial||worker!==this.worker){bitmap.close();return;}worker.postMessage({type:'frame',bitmap,timestamp},[bitmap]);
 }catch(error){if(serial===this.serial){this.busy=false;this.callbacks.onError(error.message);}}}
 stop(){this.serial++;if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(new Error('CANCELLED'));this.pending=null;}this.worker?.terminate();this.worker=null;this.busy=false;}
}
