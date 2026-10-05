// Atış ve savaş efektleri: kullanıcının efekt sayfasından (gri zemin renkten-saydamlığa ile silinerek) üretilen atlas (8 × 6 kare, kare 128 px).
// Satır 1: patlama → gri duman (8 kare), satır 2: su sıçraması (7 kare), satır 3: namlu alevi ×2, ateş bulutu ×2, kıymık ×3, kor.
const atlas=new Image();atlas.src='/assets/vfx-atlas-v2.webp';
const CELL=128;
export const VFX={
  iron:[0,0],fire:[1,0],pellet:[2,0],chain:[3,0],enemy:[4,0],shadow:[5,0],target:[6,0],flash:[7,0],
  smoke:[4,1],muzzle:[0,3],blast:[2,3],splinter:[4,3],ember:[7,3],foam:[0,4],bubble:[2,4],firePuff:[3,4],spit:[4,4],plank:[5,4],star:[6,4],poison:[7,4],
  bomb:[0,5],breaker:[1,5],leech:[2,5],soul:[3,5],shock:[4,5],
} as const;
export type VfxName=keyof typeof VFX;
// Sayısı birden fazla olan kareler (aynı satırda yan yana)
export const EXPLOSION_ROW=1,SPLASH_ROW=2,ANIM_FRAMES=8;
export const vfxReady=()=>atlas.complete&&atlas.naturalWidth>0;
// size: ekranda karenin kenar uzunluğu (px); kare merkezi (x,y) noktasına oturur
export function drawVfx(ctx:CanvasRenderingContext2D,name:VfxName,x:number,y:number,size:number,{rot=0,alpha=1,variant=0}:{rot?:number;alpha?:number;variant?:number}={}){
  if(!vfxReady())return false;const [c,r]=VFX[name];drawCell(ctx,c+variant,r,x,y,size,rot,alpha);return true;
}
// Yeni boyalı animasyon sayfası (kullanıcı görselleri): her satır bir efekt, 8 kare × 192 px, saydam zemin.
const anim=new Image();anim.src='/assets/vfx-anim-v1.webp';
const ANIM_CELL=192;
export const ANIM={explosion:0,splash:1,smoke:2,debris:3} as const;
export type AnimName=keyof typeof ANIM;
// t: 0..1 ilerleme; size: karenin ekrandaki kenarı. Sayfa yüklenmediyse eski atlasa düşmek için false döner.
export function drawAnim(ctx:CanvasRenderingContext2D,name:AnimName,t:number,x:number,y:number,size:number,alpha=1){
  if(!anim.complete||!anim.naturalWidth)return false;const f=Math.max(0,Math.min(7,Math.floor(t*8))),prev=ctx.globalAlpha;ctx.globalAlpha=prev*alpha;
  ctx.drawImage(anim,f*ANIM_CELL,ANIM[name]*ANIM_CELL,ANIM_CELL,ANIM_CELL,x-size/2,y-size/2,size,size);ctx.globalAlpha=prev;return true;
}
// t: 0..1 animasyon ilerlemesi
export function drawVfxAnim(ctx:CanvasRenderingContext2D,row:number,t:number,x:number,y:number,size:number,alpha=1){
  if(!vfxReady())return false;drawCell(ctx,Math.min(ANIM_FRAMES-1,Math.floor(t*ANIM_FRAMES)),row,x,y,size,0,alpha);return true;
}
function drawCell(ctx:CanvasRenderingContext2D,c:number,r:number,x:number,y:number,size:number,rot:number,alpha:number){
  const prev=ctx.globalAlpha;ctx.globalAlpha=prev*alpha;
  if(rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(atlas,c*CELL,r*CELL,CELL,CELL,-size/2,-size/2,size,size);ctx.restore();}
  else ctx.drawImage(atlas,c*CELL,r*CELL,CELL,CELL,x-size/2,y-size/2,size,size);
  ctx.globalAlpha=prev;
}

// Eight registered frames per supplied effect. Shield deliberately has no VFX.
const effectNames=['fire','hit-spark','heal','levelup','sink','rage'] as const;
export type EffectName=typeof effectNames[number];
const effects=Object.fromEntries(effectNames.map(name=>{const image=new Image();image.decoding='async';image.src=`/assets/vfx-${name}-v1.webp`;return[name,image];})) as Record<EffectName,HTMLImageElement>;
export function drawEffect(ctx:CanvasRenderingContext2D,name:EffectName,progress:number,x:number,y:number,size:number,alpha=1,loop=false){
  const image=effects[name];if(!image.complete||!image.naturalWidth)return false;
  const phase=loop?((progress%1)+1)%1:Math.max(0,Math.min(.999999,progress));
  const pos=phase*8,frame=Math.floor(pos),mix=pos-frame,cell=image.naturalHeight;
  ctx.save();ctx.globalAlpha*=alpha;if(name!=='sink')ctx.globalCompositeOperation='screen';
  const paint=(f:number,a:number)=>{const prev=ctx.globalAlpha;ctx.globalAlpha*=a;ctx.drawImage(image,f*cell,0,cell,cell,x-size/2,y-size/2,size,size);ctx.globalAlpha=prev;};
  // Interpolate looping fire/rage to avoid a hard jump between supplied poses.
  if(loop){paint(frame,1-mix);paint((frame+1)%8,mix);}else paint(frame,1);
  ctx.restore();return true;
}
