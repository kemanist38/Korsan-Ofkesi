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
