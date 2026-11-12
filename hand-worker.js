// Classic worker: the MediaPipe WASM bootstrap uses importScripts.
let detector;
self.onmessage=async({data})=>{
 if(data.type==='init'){
  try{
   self.postMessage({type:'loading',message:'Descargando biblioteca de manos…'});
   const {HandLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
   self.postMessage({type:'loading',message:'Preparando WebAssembly…'});
   const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
   self.postMessage({type:'loading',message:'Cargando detector de dos manos…'});
   detector=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.6});
   self.postMessage({type:'ready'});
  }catch(error){self.postMessage({type:'error',message:error.message});}
 }
 if(data.type==='frame'){
  try{const result=detector.detectForVideo(data.bitmap,data.timestamp);const categories=result.handedness??result.handednesses??[];self.postMessage({type:'result',timestamp:data.timestamp,hands:result.landmarks.map((landmarks,i)=>({landmarks,label:categories[i]?.[0]?.categoryName??null,confidence:categories[i]?.[0]?.score??0}))});}
  catch(error){self.postMessage({type:'error',message:error.message});}
  finally{data.bitmap.close();}
 }
};
