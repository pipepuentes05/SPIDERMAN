// Original vector glove artwork. Wrist launcher is exactly at local (0, 0).
const silhouette=new Path2D('M -.40 .12 L -.43 -.53 C -.48 -.67 -.66 -.98 -.63 -1.20 C -.62 -1.34 -.49 -1.36 -.43 -1.23 L -.23 -.91 L -.22 -1.06 C -.22 -1.16 -.09 -1.19 -.02 -1.10 L .01 -1.00 L -.01 -1.75 C -.01 -1.95 .15 -1.99 .22 -1.84 L .33 -.83 L .55 -.98 C .74 -1.10 .86 -.94 .74 -.78 L .44 -.37 L .40 .12 L .48 .90 Q .01 1.02 -.49 .90 Z');
const palm=new Path2D('M -.36 -.72 Q -.24 -.88 -.10 -.80 L .19 -.72 Q .31 -.63 .28 -.38 L .29 -.06 Q .02 .10 -.30 -.05 Z');
const cuff=new Path2D('M -.40 .10 Q .00 .24 .40 .10 L .48 .90 Q 0 1.02 -.49 .90 Z');
function gradient(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [p,color] of stops)g.addColorStop(p,color);return g;}
export function drawGlove(ctx,side,pose,now,lastFire=-Infinity,reduced=false){
 if(!pose)return;const recoil=reduced?0:Math.max(0,1-(now-lastFire)/180);const s=pose.size*(1+recoil*.025),mirror=side==='Left'?-1:1;
 ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);ctx.scale(s*mirror,s);ctx.shadowColor='#0b183a88';ctx.shadowBlur=14;ctx.shadowOffsetY=5;
 ctx.fillStyle=gradient(ctx,-.5,-1.9,.5,.9,[[0,'#ff5b50'],[.38,'#c72730'],[.72,'#a31f31'],[1,'#e8403b']]);ctx.fill(silhouette);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.save();ctx.clip(silhouette);ctx.fillStyle=gradient(ctx,-.5,0,.5,.7,[[0,'#07376d'],[.5,'#235ca3'],[1,'#102c62']]);ctx.fill(cuff);
 // Fine dark web topology follows the material, clipped inside the glove.
 ctx.strokeStyle='#401b32b3';ctx.lineWidth=.017;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(0,-.46);ctx.lineTo(Math.cos(a)*2,-.46+Math.sin(a)*2);ctx.stroke();}
 for(let ring=1;ring<=9;ring++){const r=ring*.21;ctx.beginPath();for(let i=0;i<=12;i++){const a=i*Math.PI/6,b=a+Math.PI/6,x=Math.cos(a)*r,y=-.46+Math.sin(a)*r,bx=Math.cos(b)*r,by=-.46+Math.sin(b)*r;if(i===0)ctx.moveTo(x,y);ctx.quadraticCurveTo((x+bx)*.45,-.46+((y+by)/2+.46)*.90,bx,by);}ctx.stroke();}
 ctx.fillStyle=gradient(ctx,-.3,-.8,.3,0,[[0,'#ff73631f'],[.4,'#ff9c692b'],[1,'#6e113533']]);ctx.fill(palm);
 ctx.strokeStyle='#ffb9945e';ctx.lineWidth=.025;ctx.beginPath();ctx.moveTo(.10,-1.79);ctx.quadraticCurveTo(.20,-1.39,.21,-1.01);ctx.stroke();ctx.beginPath();ctx.moveTo(-.52,-1.18);ctx.quadraticCurveTo(-.37,-.91,-.29,-.72);ctx.stroke();
 ctx.strokeStyle='#6e182ca8';ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(-.22,-.84);ctx.quadraticCurveTo(-.14,-.94,-.02,-.83);ctx.moveTo(-.08,-.75);ctx.quadraticCurveTo(.04,-.85,.15,-.75);ctx.moveTo(.31,-.48);ctx.quadraticCurveTo(.40,-.65,.55,-.75);ctx.stroke();
 ctx.strokeStyle='#61a4d27d';ctx.lineWidth=.025;ctx.beginPath();ctx.moveTo(-.35,.32);ctx.lineTo(-.34,.87);ctx.moveTo(.29,.32);ctx.lineTo(.36,.86);ctx.stroke();
 ctx.restore();ctx.strokeStyle='#5a193248';ctx.lineWidth=.025;ctx.stroke(silhouette);
 // Metallic wrist band and concentric emitter.
 ctx.beginPath();ctx.roundRect(-.41,-.09,.82,.17,.035);ctx.fillStyle=gradient(ctx,-.4,-.05,.4,.07,[[0,'#27303e'],[.45,'#9aadc0'],[.65,'#596e83'],[1,'#1b293b']]);ctx.fill();
 ctx.beginPath();ctx.ellipse(0,0,.15,.11,0,0,Math.PI*2);ctx.fillStyle='#101d32';ctx.fill();ctx.strokeStyle='#bacbda';ctx.lineWidth=.02;ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,.071,.05,0,0,Math.PI*2);ctx.fillStyle=recoil>0?'#f6fcff':'#80c6e7';ctx.fill();
 if(recoil>0){ctx.globalAlpha*=recoil*.65;ctx.beginPath();ctx.ellipse(0,0,.21,.17,0,0,Math.PI*2);ctx.fillStyle='#c3eaff';ctx.shadowColor='#e6f6ff';ctx.shadowBlur=12;ctx.fill();}
 ctx.restore();
}
export function projectSample(sample,width,height){
 const map=p=>({x:(.06+.88*p.x)*width,y:(.20+.60*p.y)*height});
 const wrist=map(sample.wrist),middle=map(sample.middle),index=map(sample.index),pinky=map(sample.pinky);
 return {x:wrist.x,y:wrist.y,size:Math.max(32,Math.min(95,Math.hypot(index.x-pinky.x,index.y-pinky.y)*.71)),angle:Math.atan2(middle.y-wrist.y,middle.x-wrist.x)+Math.PI/2};
}
