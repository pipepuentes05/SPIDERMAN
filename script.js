import {HandDetector,HandManager,Calibration,alpha} from './hand-tracking.js';
import {WebField} from './webs.js';
import {drawGlove,projectSample} from './gloves.js';
import {WebAudio} from './audio.js';
const $=id=>document.getElementById(id),root=$('experience'),video=$('video'),canvas=$('effects'),ctx=canvas.getContext('2d'),preview=$('handOverlay'),previewCtx=preview.getContext('2d');
const manager=new HandManager(),calibration=new Calibration(),field=new WebField(),audio=new WebAudio(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const CONNECTIONS=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[17,0]];
let active=false,starting=false,calibrated=false,calibrating=false,session=0,stream=null,showCamera=true,showPoints=true,rawHands=[];
let w=innerWidth,h=innerHeight,lastRender=0,lastInference=0,lastVideoTime=-1,lastResponse=0,frameId=0,disposed=false,visual={Left:null,Right:null};
let demo=null;
const detector=new HandDetector({onResult:receive,onLoading:text=>message(text),onError:detail=>{stop(false);message(/activeTexture|WebGL|GL context/i.test(detail)?'El detector necesita WebGL. Revisa la aceleración gráfica de Chrome o Edge y reinicia el navegador.':'El detector se interrumpió. Pulsa ACTIVAR CÁMARA para reintentar.');}});
function message(text){if($('message').textContent!==text)$('message').textContent=text;}
function controls(){
 $('start').disabled=active||starting;$('stop').disabled=!active&&!starting;$('calibrate').disabled=!active;$('swap').disabled=!active||!calibrated;$('cameraToggle').disabled=!active;$('cameraToggle').setAttribute('aria-pressed',String(showCamera&&active));$('cameraPanel').hidden=!active||!showCamera;$('handStatus').hidden=!active;$('demo').disabled=active||starting;
 $('swap').setAttribute('aria-pressed',String(manager.swapped));
}
function resize(){const r=root.getBoundingClientRect();w=r.width;h=r.height;const ratio=Math.min(devicePixelRatio,1.6);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);visual={Left:null,Right:null};}
new ResizeObserver(resize).observe(root);
function explain(error){const map={NotAllowedError:'No se autorizó la cámara. Habilítala en el icono junto a la dirección y reintenta.',NotFoundError:'No encontramos una webcam conectada. Conéctala y vuelve a intentar.',NotReadableError:'No se puede usar la cámara. Cierra otras aplicaciones que la estén utilizando.',OverconstrainedError:'La webcam no admite esta configuración. Prueba otra cámara.',SecurityError:'La cámara está bloqueada. Usa localhost o HTTPS.',MODEL_LOAD:'No se pudo cargar el detector. Comprueba internet y el acceso a jsDelivr y Google Storage.',MODEL_TIMEOUT:'La carga del modelo tardó demasiado. Comprueba tu conexión y vuelve a intentar.'};return map[error.name]||map[error.message]||'No pudimos activar la cámara. Reintenta con Live Server en Chrome o Edge.';}
async function start(){
 if(active||starting)return;
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){message('Ejecuta index.html con Live Server en localhost o HTTPS. No lo abras con doble clic.');return;}
 demo=null;starting=true;const token=++session;$('spinner').hidden=false;message('Preparando el detector de manos…');controls();
 try{
  await detector.init();if(token!==session)return;
  message('Acepta el permiso de cámara del navegador. No se solicita micrófono.');
  const acquired=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:960},height:{ideal:720},facingMode:'user'},audio:false});
  if(token!==session){acquired.getTracks().forEach(t=>t.stop());return;}
  stream=acquired;video.srcObject=acquired;await video.play();if(token!==session)return;
  if(!video.videoWidth||!video.videoHeight)throw new Error('EMPTY_VIDEO');
  $('cameraView').style.aspectRatio=`${video.videoWidth}/${video.videoHeight}`;preview.width=640;preview.height=Math.round(640*video.videoHeight/video.videoWidth);
  stream.getVideoTracks()[0].onended=()=>{stop(false);message('La cámara se desconectó. Vuelve a conectarla para jugar.');};
  active=true;starting=false;rawHands=[];lastInference=0;lastVideoTime=-1;lastResponse=performance.now();manager.resetTracking();visual={Left:null,Right:null};$('spinner').hidden=true;document.body.classList.add('live');showCamera=true;beginCalibration();controls();
 }catch(error){if(token!==session||error.message==='CANCELLED')return;stop(false);message(explain(error));}
}
function stop(showMessage=true){
 session++;active=false;starting=false;calibrated=false;calibrating=false;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;detector.stop();manager.resetTracking();visual={Left:null,Right:null};rawHands=[];previewCtx.clearRect(0,0,preview.width,preview.height);
 $('spinner').hidden=true;$('calibration').hidden=true;document.body.classList.remove('live','calibrating');demo=null;controls();if(showMessage)message('Cámara detenida. Los disparos que ya lanzaste terminarán su animación.');
}
function beginCalibration(){
 if(!active)return;calibration.reset();calibrating=true;calibrated=false;manager.resetTracking();visual={Left:null,Right:null};document.body.classList.add('calibrating');$('calibration').hidden=false;$('calibrationTitle').textContent='Levanta solo tu mano derecha.';$('calibrationText').textContent='Mantenla visible un segundo. Baja la otra mano.';$('calibrationProgress').style.width='0%';message('Primero identificamos tus manos físicas. Los disparos están pausados.');controls();
}
function updateCalibration(hands,now){
 const state=calibration.update(hands,now);$('calibrationProgress').style.width=`${state.progress*100}%`;
 if(state.message)$('calibrationText').textContent=state.message;
 if(state.next){$('calibrationTitle').textContent='Ahora, solo tu mano izquierda.';$('calibrationText').textContent='Baja la derecha y mantén la izquierda visible un segundo.';}
 if(state.done){manager.setSwap(state.swap);calibrated=true;calibrating=false;visual={Left:null,Right:null};document.body.classList.remove('calibrating');$('calibration').hidden=true;message('Manos calibradas. Muévelas para lanzar; descansa un instante entre disparos.');controls();}
}
$('start').onclick=start;$('stop').onclick=()=>stop();$('calibrate').onclick=beginCalibration;
$('cancelCalibration').onclick=()=>{calibrating=false;calibrated=false;manager.resetTracking();$('calibration').hidden=true;document.body.classList.remove('calibrating');message('Calibración cancelada. Pulsa CALIBRAR para habilitar los lanzadores.');controls();};
$('swap').onclick=()=>{manager.setSwap(!manager.swapped);visual={Left:null,Right:null};message('Correspondencia izquierda/derecha intercambiada. Si no coincide, vuelve a calibrar.');controls();};
$('sensitivity').onchange=()=>{manager.sensitivity=$('sensitivity').value;manager.clearMotion();const descriptions={soft:'Suave: exige un movimiento más marcado.',normal:'Normal: mueve la mano con decisión.',intense:'Intensa: responde a movimientos más pequeños.'};message(descriptions[manager.sensitivity]);};
$('clear').onclick=()=>{field.clear();message('Telarañas eliminadas. El escenario está despejado.');};
function toggleCamera(){showCamera=!showCamera;controls();}$('cameraToggle').onclick=toggleCamera;$('cameraMinimize').onclick=toggleCamera;
$('points').onclick=()=>{showPoints=!showPoints;$('points').textContent=showPoints?'PUNTOS ON':'PUNTOS OFF';$('points').setAttribute('aria-pressed',String(showPoints));if(!showPoints)previewCtx.clearRect(0,0,preview.width,preview.height);};
$('sound').onclick=async()=>{try{const enabled=await audio.toggle();$('sound').textContent=enabled?'SONIDO ON':'SONIDO OFF';$('sound').setAttribute('aria-pressed',String(enabled));}catch(error){message(error.message);}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{message('No se pudo entrar en pantalla completa en este navegador.');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'SALIR DE PANTALLA COMPLETA':'PANTALLA COMPLETA ↗';resize();});
$('helpOpen').onclick=()=>{manager.clearMotion();if(calibrating){calibration.candidate=null;calibration.since=null;}$('help').showModal();};$('helpClose').onclick=()=>$('help').close();$('help').addEventListener('close',()=>manager.clearMotion());
function receive(data){
 if(!active||document.hidden)return;const now=performance.now();lastResponse=now;
 if(now-data.timestamp>600){rawHands=[];manager.update([],now,false);return;}
 rawHands=data.hands;
 if($('help').open){manager.update([],now,false);return;}
 if(calibrating){updateCalibration(data.hands,now);manager.update([],now,false);return;}
 const shots=manager.update(data.hands,now,calibrated);
 if(!calibrated)return;
 for(const shot of shots){
  const projected=visual[shot.side]||projectSample(shot.sample,w,h);
  const origin={x:projected.x/w,y:projected.y/h};
  field.shoot(shot.side,origin,shot.direction,now);audio.fire(shot.side);
 }
 if(data.hands.length===0)message('Pon tus manos frente a la cámara.');
 else if(Object.values(manager.slots).some(s=>s.ambiguous))message('Identidad ambigua: separa un poco las manos. Los disparos se pausan para no confundirlas.');
 else message('Mueve una mano para lanzar. Déjala descansar brevemente para volver a disparar.');
}
function drawTracking(){
 previewCtx.clearRect(0,0,preview.width,preview.height);if(!active||!showPoints||!showCamera||document.hidden)return;
 for(const hand of rawHands){const color=hand.label==='Left'?'#a9dcff':'#ffaaa0';previewCtx.strokeStyle=color;previewCtx.fillStyle='#fff';previewCtx.lineWidth=1.4;previewCtx.beginPath();for(const [a,b]of CONNECTIONS){const p=hand.landmarks[a],q=hand.landmarks[b];previewCtx.moveTo((1-p.x)*preview.width,p.y*preview.height);previewCtx.lineTo((1-q.x)*preview.width,q.y*preview.height);}previewCtx.stroke();for(const p of hand.landmarks){previewCtx.beginPath();previewCtx.arc((1-p.x)*preview.width,p.y*preview.height,2.1,0,Math.PI*2);previewCtx.fill();}}
}
function updateVisuals(now,dt){
 for(const side of ['Left','Right']){const slot=manager.slots[side],opacity=manager.visibility(side,now);
  const chip=$(side==='Left'?'leftStatus':'rightStatus');const detected=active&&calibrated&&slot.detected&&now-slot.lastSeen<300;chip.classList.toggle('detected',detected);chip.classList.toggle('fired',now-slot.lastFire<180&&detected);
  const label=chip.querySelector('strong'),text=detected?'MANO '+(side==='Left'?'IZQUIERDA':'DERECHA')+' DETECTADA':!calibrated?'CALIBRA PARA ACTIVAR':slot.ambiguous?'IDENTIDAD EN PAUSA':'ESPERANDO MANO';if(label.textContent!==text)label.textContent=text;
  if(!slot.target||opacity===0||!calibrated){visual[side]=null;continue;}
  const target=projectSample(slot.target,w,h);if(!visual[side])visual[side]={...target};else{const a=alpha(dt,.055),v=visual[side];for(const key of ['x','y','size'])v[key]+=(target[key]-v[key])*a;let delta=(target.angle-v.angle+Math.PI*3)%(Math.PI*2)-Math.PI;v.angle+=delta*a;}
 }
}
function drawDemo(now){
 if(!demo)return;const elapsed=now-demo.start;
 const poses={Left:{x:w*.29,y:h*.64,size:Math.min(w,h)*.09,angle:-.24},Right:{x:w*.65,y:h*.67,size:Math.min(w,h)*.09,angle:.24}};
 for(const event of demo.events){if(!event.fired&&elapsed>=event.at){event.fired=true;const p=poses[event.side];field.shoot(event.side,{x:p.x/w,y:p.y/h},event.direction,now);audio.fire(event.side);demo.lastFire[event.side]=now;}}
 if(elapsed<3400){const fade=Math.min(1,(3400-elapsed)/500,elapsed/300);for(const side of ['Left','Right']){ctx.save();ctx.globalAlpha=Math.max(0,fade);drawGlove(ctx,side,poses[side],now,demo.lastFire[side],reduced.matches);ctx.restore();}}
 if(elapsed>6500){demo=null;message('Demostración terminada. Activa la cámara para controlar los lanzadores con tus manos.');}
}
$('demo').onclick=()=>{if(active||starting)return;$('help').close();const now=performance.now();demo={start:now,lastFire:{Left:-Infinity,Right:-Infinity},events:[{at:300,side:'Left',direction:{x:-.4,y:-.8}},{at:420,side:'Right',direction:{x:.5,y:-.8}},{at:1350,side:'Left',direction:{x:.8,y:-.4}},{at:1450,side:'Right',direction:{x:-.7,y:-.7}}]};message('DEMOSTRACIÓN DE EFECTOS · Sin cámara ni detección de manos.');};
function frame(now){
 if(disposed)return;const dt=Math.min(.08,(now-(lastRender||now))/1000);lastRender=now;
 if(!document.hidden){
  if(active){
   if(now-lastResponse>450){rawHands=[];manager.update([],now,false);if(calibrating&&now-lastResponse>1200){calibration.candidate=null;calibration.since=null;}}
   if(video.readyState>=2&&!detector.busy&&now-lastInference>85&&video.currentTime!==lastVideoTime){lastInference=now;lastVideoTime=video.currentTime;detector.send(video,now);}
  }
  ctx.clearRect(0,0,w,h);updateVisuals(now,dt);
  for(const side of ['Left','Right']){if(visual[side]){ctx.save();ctx.globalAlpha=manager.visibility(side,now);drawGlove(ctx,side,visual[side],now,manager.slots[side].lastFire,reduced.matches);ctx.restore();}}
  drawDemo(now);field.draw(ctx,w,h,now,reduced.matches);drawTracking();
 }
 frameId=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{manager.resetTracking();visual={Left:null,Right:null};rawHands=[];demo=null;field.clear();if(calibrating){calibration.candidate=null;calibration.since=null;calibration.progress=0;}$('calibrationProgress').style.width='0%';lastVideoTime=-1;if(active)message('Seguimiento reiniciado al cambiar de pestaña. Mueve las manos de nuevo.');});
window.addEventListener('pagehide',()=>{stop(false);field.clear();audio.close();disposed=true;cancelAnimationFrame(frameId);});window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
$('background').addEventListener('error',()=>message('No se pudo mostrar el fondo incorporado. Vuelve a extraer el ZIP completo.'));
resize();controls();frameId=requestAnimationFrame(frame);
