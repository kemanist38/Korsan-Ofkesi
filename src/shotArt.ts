// Gülle görselleri: shot-atlas-v1.webp (2 sütun × 4 satır, hücre 256 × 128 px). Her mermi sağa uçar, izi soldadır;
// oyunda gidiş yönüne döndürülür. anchor: güllenin merkezi (hücre px), span: ölçek için ölçülen genişlik (px),
// size: o genişliğin dünyadaki karşılığı (birim). Gemi ~150 birim, demir gülle ~18 birim.
export type ShotLook='iron'|'chain'|'grape'|'fire'|'explosive'|'breaker'|'leech'|'muzzle';
const atlas=new Image();atlas.decoding='async';atlas.src='/assets/shot-atlas-v1.webp';
const CW=256,CH=128;
const SHOTS:Record<ShotLook,{col:number;row:number;ax:number;ay:number;span:number;size:number}>={
  iron:{col:0,row:0,ax:204,ay:64,span:84,size:18},
  chain:{col:1,row:0,ax:133,ay:64,span:231,size:44},
  grape:{col:0,row:1,ax:207,ay:62,span:80,size:27},
  fire:{col:1,row:1,ax:209,ay:63,span:68,size:21},
  explosive:{col:0,row:2,ax:202,ay:64,span:72,size:21},
  breaker:{col:1,row:2,ax:186,ay:64,span:100,size:27},
  leech:{col:0,row:3,ax:204,ay:58,span:75,size:21},
  muzzle:{col:1,row:3,ax:126,ay:57,span:117,size:56},
};
const ready=()=>atlas.complete&&atlas.naturalWidth>0;
// angle: gidiş yönü (radyan); scale: ek büyütme; alpha: saydamlık
export function drawShotSprite(ctx:CanvasRenderingContext2D,look:ShotLook,x:number,y:number,angle:number,scale=1,alpha=1){
  if(!ready())return false;const s=SHOTS[look],k=s.size/s.span*scale;
  const prev=ctx.globalAlpha;ctx.save();ctx.globalAlpha=prev*alpha;ctx.translate(x,y);ctx.rotate(angle);
  ctx.drawImage(atlas,s.col*CW,s.row*CH,CW,CH,-s.ax*k,-s.ay*k,CW*k,CH*k);ctx.restore();ctx.globalAlpha=prev;return true;}
// Barut dumanı: yumuşak kenarlı açık gri puf (yavaşça büyür ve söner)
let puff:HTMLCanvasElement|null=null;
export function drawPuff(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,alpha:number){
  if(!puff){puff=document.createElement('canvas');puff.width=puff.height=64;const p=puff.getContext('2d')!,g=p.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(232,236,238,.9)');g.addColorStop(.5,'rgba(220,226,228,.45)');g.addColorStop(1,'rgba(220,226,228,0)');p.fillStyle=g;p.fillRect(0,0,64,64);}
  const prev=ctx.globalAlpha;ctx.globalAlpha=prev*alpha;ctx.drawImage(puff,x-r,y-r,r*2,r*2);ctx.globalAlpha=prev;}
// Parıltı: dört köşeli ışık yıldızı + yumuşak hale; renk başına bir kez çizilip önbelleğe alınır, toplamalı karışımla basılır
const glints=new Map<string,HTMLCanvasElement>();
export function drawGlint(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,alpha:number,rot:number){
  let c=glints.get(color);if(!c){c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!,h=g.createRadialGradient(32,32,0,32,32,32);
    h.addColorStop(0,color+'cc');h.addColorStop(.25,color+'55');h.addColorStop(1,color+'00');g.fillStyle=h;g.fillRect(0,0,64,64);
    g.fillStyle='#ffffff';g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,l=i%2?5:30;g.lineTo(32+Math.cos(a)*l,32+Math.sin(a)*l);}g.closePath();g.globalAlpha=.95;g.fill();
    g.globalCompositeOperation='source-atop';g.fillStyle=color;g.globalAlpha=.45;g.fillRect(0,0,64,64);glints.set(color,c);}
  const prev=ctx.globalAlpha,op=ctx.globalCompositeOperation;ctx.globalAlpha=prev*Math.min(1,alpha*1.4);ctx.globalCompositeOperation='lighter';
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(c,-r,-r,r*2,r*2);ctx.restore();ctx.globalAlpha=prev;ctx.globalCompositeOperation=op;}
