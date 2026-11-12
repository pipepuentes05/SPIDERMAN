export class WebAudio{
 constructor(){this.context=null;this.enabled=false;this.playing=0;}
 async toggle(){if(!this.enabled){try{this.context??=new(window.AudioContext||window.webkitAudioContext)();await this.context.resume();}catch{throw new Error('El audio no está disponible. Puedes seguir jugando sin sonido.');}}this.enabled=!this.enabled;return this.enabled;}
 fire(side){if(!this.enabled||this.context?.state!=='running'||this.playing>=4)return;const c=this.context,t=c.currentTime,duration=.20,buffer=c.createBuffer(1,Math.floor(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*5);
  const source=c.createBufferSource();source.buffer=buffer;const filter=c.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(2400,t);filter.frequency.exponentialRampToValueAtTime(400,t+.16);filter.Q.value=1.9;const gain=c.createGain();gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.14,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.19);const pan=c.createStereoPanner();pan.pan.value=side==='Left'?-.35:.35;source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(c.destination);this.playing++;source.onended=()=>{this.playing--;source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};source.start(t);source.stop(t+duration);
 }
 close(){this.context?.close();this.enabled=false;}
}
