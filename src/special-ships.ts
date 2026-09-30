// Özel gemiler: yalnızca görünüm (başlangıç gemisi gücünde), inciyle bir kez satın alınır. Tersanenin 2. sayfasında listelenir.
// Kart görseli tek açılı raster (384 px, pruva sol-aşağı). Yön sayfası olmayan gemi sağa giderken yatay aynalanır.
// dir: 8 yönlü sayfa (4 × 2, 256 px kare; elitlerle aynı sıra G, GB, B, KD, K, GD, D, KB). Yoksa tek görsel aynalanır.
// views: yan yana kare görünüşler (256 px). iso: Seafight usulü hareket; [KD, GD, GB, KB] görünüşlerinin kare sırası.
export type SpecialShip={id:string;name:string;english:string;price:number;art:string;description:string;dir?:string;views?:string;iso?:[number,number,number,number]};
export const SPECIAL_SHIPS:SpecialShip[]=[
  {id:'ak-kadirga',name:'Ak Kadırga',english:'White Galley',price:500,art:'/assets/special-galley-v1.webp',dir:'/assets/special-galley-dir-v1.webp',description:'Pruvasında ikiz top taşıyan, kürekli beyaz savaş kadırgası; kemik haçlı yelkenleriyle tanınır.'},
  {id:'kizil-anka',name:'Kızıl Anka',english:'Crimson Phoenix',price:1000,art:'/assets/special-phoenix-v1.webp',dir:'/assets/special-phoenix-dir-v1.webp',description:'Altın anka kuşu işlemeli kızıl yelkenleri ve yaldızlı kıç köşküyle dört direkli asil kalyon.'},
  // Kareler: 0 K (arkadan) · 1 GB · 2 G (önden) · 3 GD · 4 KD · 5 KB. Seafight usulü hareket yalnızca 4 çaprazı kullanır.
  {id:'korsan-sandali',name:'Korsan Sandalı',english:'Pirate Sloop',price:750,art:'/assets/special-sandal-v1.webp',views:'/assets/special-sandal-views-v2.webp',iso:[4,3,1,5],description:'Kuru kafa işaretli yamalı yelkenleriyle üç direkli, çevik korsan teknesi.'},
];
export const specialById=(id:string|null|undefined)=>SPECIAL_SHIPS.find(s=>s.id===id);
// Yön: gemi sağa gidiyorsa aynala; neredeyse dikey gidişte son bakış korunur
export function specialFacing(angle:number,previous:1|-1):1|-1{const dx=Math.sin(angle);return Math.abs(dx)>.2?(dx>0?1:-1):previous;}
// Seafight usulü hareket (kullanıcının videolarından ölçüldü): gemi yalnızca 4 çaprazda gider (yatay hız V, dikey V/2,
// yataydan ~27°). Düz bir yöne gitmek için iki çaprazı ~0,11 sn'lik adımlarla art arda atar (doğuya: GD-KD-GD-KD…);
// her adımda başlangıç→hedef çizgisine en yakın kalan çapraz seçilir. Kalkış ve duruş anlıktır; görünüş o anki çaprazdır.
export type IsoFace={east:boolean;north:boolean};
export type IsoMove={sx:number;sy:number;left:number;ox:number;oy:number;tx:number;ty:number};
export const ISO_STEP=.11;
export function isoAdvance(m:IsoMove|null,px:number,py:number,tx:number,ty:number,V:number,dt:number,face:IsoFace){
  if(!m||Math.hypot(m.tx-tx,m.ty-ty)>1)m={sx:0,sy:0,left:0,ox:px,oy:py,tx,ty};
  const dx=tx-px,dy=ty-py,H=V*.5;
  if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return{m,mx:0,my:0,done:true};
  // son adımdan kısa kalan yol: her eksen kendi hızıyla hedefe (gözle görülmeyecek kadar küçük)
  if(Math.abs(dx)<=V*ISO_STEP&&Math.abs(dy)<=H*ISO_STEP){const mx=Math.sign(dx)*Math.min(Math.abs(dx),V*dt),my=Math.sign(dy)*Math.min(Math.abs(dy),H*dt);return{m,mx,my,done:false};}
  if(m.left<=0){const lx=tx-m.ox,ly=ty-m.oy,ll=Math.hypot(lx,ly)||1,xdom=Math.abs(dx)/V>=Math.abs(dy)/H;
    const opts:[number,number][]=xdom?[[Math.sign(dx)||1,-1],[Math.sign(dx)||1,1]]:[[-1,Math.sign(dy)||1],[1,Math.sign(dy)||1]];
    let best=opts[0],bd=1e18;for(const [sx,sy] of opts){const qx=px+sx*V*ISO_STEP-m.ox,qy=py+sy*H*ISO_STEP-m.oy,d=Math.abs(lx*qy-ly*qx)/ll+(sx===m.sx&&sy===m.sy?.01:0);if(d<bd){bd=d;best=[sx,sy];}}
    m.sx=best[0];m.sy=best[1];m.left=ISO_STEP;}
  const t=Math.min(dt,m.left);m.left-=dt;face.east=m.sx>0;face.north=m.sy<0;
  return{m,mx:m.sx*V*t,my:m.sy*H*t,done:false};}
export const isoView=(sp:SpecialShip,face:IsoFace)=>sp.iso?sp.iso[face.north?(face.east?0:3):(face.east?1:2)]:0;
