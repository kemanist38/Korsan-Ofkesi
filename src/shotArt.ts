// Gülle görselleri: küçük, metalik demir gülleler ve hız izi (görsel dosyası yok; açılışta bir kez çizilip önbelleğe alınır).
// Boyutlar dünya birimidir (size = gülle çapı): gemi ~150 birim, gülle ~12 birim. İz, güllenin gidiş yönünün tersine incelen bir hüzme.
export type ShotLook='iron'|'fire'|'explosive'|'breaker'|'leech'|'enemy';
const R=32;   // önbellek karesi yarıçapı (px); gülle bu karenin ortasında 14 px yarıçaplıdır
const cache=new Map<ShotLook,HTMLCanvasElement>();
type Look={core:[string,string,string];glow?:string;band?:boolean;rim?:string};
const LOOKS:Record<ShotLook,Look>={
  iron:{core:['#8a9097','#33373d','#0c0d10']},
  enemy:{core:['#9a8f8a','#3a3330','#100c0b']},
  fire:{core:['#fff1b0','#ff8a1e','#9a2a08'],glow:'rgba(255,140,40,.55)'},
  explosive:{core:['#7d7f84','#2a2b2f','#09090b'],rim:'rgba(255,90,40,.55)'},
  breaker:{core:['#a3a8ae','#4a4f56','#14161a'],band:true},
  leech:{core:['#7fa08a','#24382c','#07100a'],glow:'rgba(90,255,150,.45)'},
};
function sprite(look:ShotLook){let c=cache.get(look);if(c)return c;
  const L=LOOKS[look];c=document.createElement('canvas');c.width=c.height=R*2;const x=c.getContext('2d')!,r=14;
  if(L.glow){const g=x.createRadialGradient(R,R,r*.6,R,R,R);g.addColorStop(0,L.glow);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,R*2,R*2);}
  const g=x.createRadialGradient(R-r*.38,R-r*.42,r*.08,R,R,r);g.addColorStop(0,L.core[0]);g.addColorStop(.45,L.core[1]);g.addColorStop(1,L.core[2]);
  x.fillStyle=g;x.beginPath();x.arc(R,R,r,0,Math.PI*2);x.fill();
  if(L.band){x.strokeStyle='rgba(30,32,36,.75)';x.lineWidth=1.6;for(const k of [-.35,.35]){x.beginPath();x.ellipse(R,R+k*r,r*Math.sqrt(1-k*k),r*.28,0,0,Math.PI*2);x.stroke();}}
  if(L.rim){x.strokeStyle=L.rim;x.lineWidth=2;x.beginPath();x.arc(R,R,r-1,0,Math.PI*2);x.stroke();}
  // küçük parlama noktası ve alt kenarda koyu çizgi: metal hissi
  const s=x.createRadialGradient(R-r*.42,R-r*.45,0,R-r*.42,R-r*.45,r*.38);s.addColorStop(0,'rgba(255,255,255,.75)');s.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=s;x.beginPath();x.arc(R,R,r,0,Math.PI*2);x.fill();
  x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=1.2;x.beginPath();x.arc(R,R,r-.6,Math.PI*.15,Math.PI*.85);x.stroke();
  cache.set(look,c);return c;}
// Hız izi: gülleden geriye incelen yarı saydam hüzme (ateşli güllede turuncu alev kuyruğu)
function streak(ctx:CanvasRenderingContext2D,x:number,y:number,a:number,len:number,w:number,color:string){
  const bx=x-Math.cos(a)*len,by=y-Math.sin(a)*len,g=ctx.createLinearGradient(x,y,bx,by);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
  const nx=-Math.sin(a)*w/2,ny=Math.cos(a)*w/2;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x+nx,y+ny);ctx.lineTo(bx,by);ctx.lineTo(x-nx,y-ny);ctx.closePath();ctx.fill();}
export function drawBall(ctx:CanvasRenderingContext2D,look:ShotLook,x:number,y:number,angle:number,size=13,t=0){
  const tails:Record<ShotLook,[number,string]>={iron:[3.6,'rgba(220,228,232,.42)'],enemy:[3.6,'rgba(225,212,205,.4)'],fire:[4.6,'rgba(255,150,50,.8)'],explosive:[3.6,'rgba(220,228,232,.4)'],breaker:[3.8,'rgba(220,228,232,.42)'],leech:[4,'rgba(110,255,160,.55)']};
  const [k,col]=tails[look];streak(ctx,x,y,angle,size*k,size*.8,col);
  const c=sprite(look),S=size/2*R/14;ctx.drawImage(c,x-S,y-S,S*2,S*2);
  if(look==='explosive'){const fx=x-Math.cos(angle)*size*.22,fy=y-Math.sin(angle)*size*.22-size*.45,f=.6+.4*Math.sin(t*40);
    ctx.fillStyle=`rgba(255,${180+Math.round(60*f)},80,${.9*f})`;ctx.beginPath();ctx.arc(fx,fy,size*.12*(1+f*.5),0,Math.PI*2);ctx.fill();}
}
// Zincir gülle: iki küçük gülle ve aralarında dönen zincir
export function drawChainShot(ctx:CanvasRenderingContext2D,x:number,y:number,rot:number,size=12){
  const d=size*1.15,ax=Math.cos(rot)*d,ay=Math.sin(rot)*d*.55;
  ctx.strokeStyle='rgba(150,155,160,.9)';ctx.lineWidth=size*.12;ctx.setLineDash([size*.22,size*.12]);ctx.beginPath();ctx.moveTo(x-ax,y-ay);ctx.lineTo(x+ax,y+ay);ctx.stroke();ctx.setLineDash([]);
  const c=sprite('iron'),S=size*.32*R/14;for(const s of [-1,1])ctx.drawImage(c,x+s*ax-S,y+s*ay-S,S*2,S*2);
}
// Saçma: küçük bilye kümesi
export function drawGrape(ctx:CanvasRenderingContext2D,x:number,y:number,angle:number,size=13){
  const c=sprite('iron'),S=size*.2*R/14,ca=Math.cos(angle),sa=Math.sin(angle);
  for(let k=0;k<6;k++){const off=(k%3-1)*size*.55,back=(k<3?0:1)*size*.6+(k%2)*size*.15;ctx.drawImage(c,x-ca*back-sa*off-S,y-sa*back+ca*off-S,S*2,S*2);}
  streak(ctx,x,y,angle,size*2.4,size*1.1,'rgba(220,228,232,.22)');
}
// Barut dumanı: yumuşak kenarlı açık gri puf (yavaşça büyür ve söner)
let puff:HTMLCanvasElement|null=null;
export function drawPuff(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,alpha:number){
  if(!puff){puff=document.createElement('canvas');puff.width=puff.height=64;const p=puff.getContext('2d')!,g=p.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(232,236,238,.9)');g.addColorStop(.5,'rgba(220,226,228,.45)');g.addColorStop(1,'rgba(220,226,228,0)');p.fillStyle=g;p.fillRect(0,0,64,64);}
  const prev=ctx.globalAlpha;ctx.globalAlpha=prev*alpha;ctx.drawImage(puff,x-r,y-r,r*2,r*2);ctx.globalAlpha=prev;}
