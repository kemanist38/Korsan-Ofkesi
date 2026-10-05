import {drawEffect} from './vfx';
// Ekran efektleri (Korsan Öfkesi raster animasyon kullanır): Korsan Öfkesi alevleri, uçan yazılar ve can emici ruhu.
// Gemi/hedef referansı verilen efektler (a) o nesneyi her karede izler; çizim her karede worldToScreen ile yapılır.
type Vec={x:number;y:number};
type Kind='soul'|'rage'|'text';
type Fx={kind:Kind;t:number;dur:number;seed:number;a?:Vec;b?:Vec;n?:number;s?:string};
const fx:Fx[]=[];
let tint=0,tintColor='150,20,30';
const TAU=Math.PI*2;
const pt=(v:Vec)=>({x:v.x,y:v.y});
const add=(f:Omit<Fx,'t'|'seed'>)=>{fx.push({...f,t:0,seed:Math.random()*1e4});};

export function spawnSoul(from:Vec,to:Vec){add({kind:'soul',b:pt(from),a:to,dur:1.1});}
export function spawnRage(ship:Vec,dur:number){add({kind:'rage',a:ship,dur});}
export function clearRageFx(){for(const f of fx)if(f.kind==='rage')f.dur=Math.min(f.dur,f.t+.4);}
export function spawnText(at:Vec,text:string,color='#ffcf5a'){add({kind:'text',a:at,s:text+'|'+color,dur:1.4});}
export function screenTint(v:number,color:string){tint=Math.max(tint,v);tintColor=color;}

export function updateAbilityFx(dt:number){
  tint=Math.max(0,tint-dt*.6);
  for(let i=fx.length-1;i>=0;i--){fx[i].t+=dt;if(fx[i].t>=fx[i].dur)fx.splice(i,1);}
}

function glow(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,inner:string,outer:string){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
}
const life=(f:Fx,fadeIn=.2,fadeOut=.4)=>Math.max(0,Math.min(1,f.t/fadeIn,(f.dur-f.t)/fadeOut));

function drawSoul(ctx:CanvasRenderingContext2D,f:Fx,w2s:(v:Vec)=>Vec){
  const k=Math.min(1,f.t/f.dur),from=w2s(f.b!),to=w2s(f.a!),x=from.x+(to.x-from.x)*k,y=from.y+(to.y-from.y)*k-Math.sin(k*Math.PI)*80;
  ctx.save();ctx.globalAlpha=1-k*.6;glow(ctx,x,y,22,'rgba(200,255,230,1)','rgba(80,255,170,0)');
  ctx.fillStyle='rgba(220,255,240,.9)';ctx.beginPath();ctx.arc(x,y-4,7,0,TAU);ctx.fill();ctx.restore();
}
// Korsan Öfkesi: gemiyi saran kızıl hale ve gövdeden yükselen alev dilleri
function drawRage(ctx:CanvasRenderingContext2D,f:Fx,w2s:(v:Vec)=>Vec){
  const s=w2s(f.a!);drawEffect(ctx,'rage',f.t/1.1,s.x,s.y-20,185,life(f,.2,.4)*.85,true);
}
function drawText(ctx:CanvasRenderingContext2D,f:Fx,w2s:(v:Vec)=>Vec){
  const s=w2s(f.a!),[text,color]=(f.s||'').split('|'),k=f.t/f.dur,a=life(f,.1,.5);
  ctx.save();ctx.globalAlpha=a;ctx.font=`900 ${26+Math.min(1,f.t/.15)*8}px Cinzel, serif`;ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#000';ctx.fillStyle=color;
  ctx.strokeText(text,s.x,s.y-110-k*20);ctx.fillText(text,s.x,s.y-110-k*20);ctx.restore();
}

const DRAW:Record<Kind,(ctx:CanvasRenderingContext2D,f:Fx,w2s:(v:Vec)=>Vec)=>void>={soul:drawSoul,rage:drawRage,text:drawText};
export function drawAbilityFx(ctx:CanvasRenderingContext2D,w2s:(v:Vec)=>Vec,W:number,H:number){
  if(tint>0){ctx.save();ctx.fillStyle=`rgba(${tintColor},${tint*.22})`;ctx.fillRect(0,0,W,H);ctx.restore();}
  for(const k of ['rage','soul','text'] as Kind[])for(const f of fx)if(f.kind===k)DRAW[k](ctx,f,w2s);
}
