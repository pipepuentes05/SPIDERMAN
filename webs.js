export const WEB_CONFIG={maxActive:18,flightMs:240,lifetimeMs:4500,fadeMs:1100};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function randomGenerator(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function makeWeb(side,origin,direction,now,seed=1){
 const rng=randomGenerator(seed),p0={x:origin.x,y:origin.y};let dx=direction.x,dy=direction.y;
 if((p0.x>.84&&dx>0)||(p0.x<.16&&dx<0))dx=-dx;
 if((p0.y>.81&&dy>0)||(p0.y<.18&&dy<0))dy=-dy;
 const len=Math.hypot(dx,dy);if(len<.01){dx=side==='Left'?-.5:.5;dy=-.7;}else {dx/=len;dy/=len;}
 const reach=.34+rng()*.20,p3={x:clamp(p0.x+dx*reach,.06,.94),y:clamp(p0.y+dy*reach,.12,.83)};
 if(Math.hypot(p3.x-p0.x,p3.y-p0.y)<.12){p3.x=clamp(p0.x+(side==='Left'?.22:-.22),.08,.92);p3.y=clamp(p0.y-.28,.12,.80);}
 const ox=p3.x-p0.x,oy=p3.y-p0.y,bend=(rng()-.5)*.11;
 const p1={x:p0.x+ox*.30-oy*bend,y:p0.y+oy*.30+ox*bend+.025},p2={x:p0.x+ox*.72+oy*bend,y:p0.y+oy*.72-ox*bend};
 const points=[];for(let i=0;i<=48;i++){const t=i/48,s=1-t;points.push({x:s*s*s*p0.x+3*s*s*t*p1.x+3*s*t*t*p2.x+t*t*t*p3.x,y:s*s*s*p0.y+3*s*s*t*p1.y+3*s*t*t*p2.y+t*t*t*p3.y});}
 const rays=Array.from({length:12},(_,i)=>({angle:i*Math.PI/6+(rng()-.5)*.1,length:.76+rng()*.34}));
 return {side,origin:p0,end:p3,points,rays,radius:.047+rng()*.026,phase:rng()*6.28,born:now,lifetime:WEB_CONFIG.lifetimeMs,seed};
}
export class WebField{
 constructor(){this.webs=[];this.serial=0;}
 shoot(side,origin,direction,now){const web=makeWeb(side,origin,direction,now,++this.serial*151+(side==='Left'?7:71));this.webs.push(web);if(this.webs.length>WEB_CONFIG.maxActive)this.webs.shift();return web;}
 clear(){this.webs.length=0;}
 prune(now){this.webs=this.webs.filter(web=>now-web.born<web.lifetime);}
 draw(ctx,width,height,now,reduced=false){
  this.prune(now);const min=Math.min(width,height);
  for(const web of this.webs){const age=now-web.born;if(age<0)continue;const flight=clamp(age/WEB_CONFIG.flightMs),p=1-Math.pow(1-flight,2),fade=clamp((web.lifetime-age)/WEB_CONFIG.fadeMs);
   ctx.save();ctx.globalAlpha=fade;
   // Frozen spline samples: the origin never follows subsequent hand motion.
   const endIndex=p*(web.points.length-1),count=Math.floor(endIndex);const pointAt=(i,thread=0)=>{const pt=web.points[i],t=i/(web.points.length-1),envelope=Math.sin(t*Math.PI);const wave=(Math.sin(t*32+web.phase)*thread*1.4+(reduced?0:Math.sin(now*.013+t*18+web.phase)*.65))*envelope;return {x:pt.x*width+wave,y:pt.y*height+wave*.55};};
   const strand=(thread,stroke,lineWidth)=>{ctx.beginPath();for(let i=0;i<=count;i++){const pt=pointAt(i,thread);if(i===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);}if(count<web.points.length-1){const a=pointAt(count,thread),b=pointAt(count+1,thread),f=endIndex-count;ctx.lineTo(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);}ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
   strand(0,'#173151aa',4.2);strand(0,'#f5fbff',2.1);strand(-1,'#c9e5fa9c',.8);strand(1,'#ffffffa6',.7);
   if(flight<1){const a=web.points[Math.min(count,48)];ctx.fillStyle='#fff';ctx.shadowColor='#d5edff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(a.x*width,a.y*height,2.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
   if(flight>=1){
    const expansion=reduced?1:1-Math.pow(1-clamp((age-WEB_CONFIG.flightMs)/210),3);const cx=web.end.x*width,cy=web.end.y*height,r=web.radius*min*expansion;
    const trace=()=>{ctx.beginPath();const outer=web.rays.map(ray=>({x:cx+Math.cos(ray.angle)*r*ray.length,y:cy+Math.sin(ray.angle)*r*ray.length}));
     for(const e of outer){ctx.moveTo(cx,cy);ctx.lineTo(e.x,e.y);}
     for(let ring=1;ring<=5;ring++){const f=ring/5;for(let i=0;i<outer.length;i++){const a=outer[i],b=outer[(i+1)%outer.length],ax=cx+(a.x-cx)*f,ay=cy+(a.y-cy)*f,bx=cx+(b.x-cx)*f,by=cy+(b.y-cy)*f;ctx.moveTo(ax,ay);ctx.quadraticCurveTo(cx+((ax+bx)/2-cx)*.88,cy+((ay+by)/2-cy)*.88,bx,by);}}
    };
    trace();ctx.strokeStyle='#163553a8';ctx.lineWidth=2.9;ctx.stroke();trace();ctx.strokeStyle='#f1faffdf';ctx.lineWidth=.95;ctx.stroke();
    if(!reduced&&age<WEB_CONFIG.flightMs+380){const t=(age-WEB_CONFIG.flightMs)/380;ctx.globalAlpha=fade*(1-t)*.40;ctx.beginPath();ctx.arc(cx,cy,r*(1+t*.7),0,Math.PI*2);ctx.strokeStyle='#d7eaff';ctx.lineWidth=.8;ctx.stroke();}
   }
   ctx.restore();
  }
 }
}
