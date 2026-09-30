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
// Seafight usulü hareket (kullanıcının videosundan ölçüldü): gemi 8 yönde gider; yatay hız V, dikey hız V/2
// (çapraz = ikisi birden, yataydan ~27°). Hedefe önce çaprazdan, bir eksen hizalanınca kalan eksende düz gider.
// Kalkış ve duruş anlıktır. Görünüş hep 4 çaprazdan biridir: düz gidişte önceki yüz (kuzey/güney ya da doğu/batı) korunur.
export type IsoFace={east:boolean;north:boolean};
export function isoStep(dx:number,dy:number,V:number,dt:number,face:IsoFace){
  const mx=Math.sign(dx)*Math.min(Math.abs(dx),V*dt),my=Math.sign(dy)*Math.min(Math.abs(dy),V*.5*dt);
  if(Math.abs(mx)>1e-3)face.east=mx>0;if(Math.abs(my)>1e-3)face.north=my<0;
  return{mx,my,done:Math.abs(dx)<.5&&Math.abs(dy)<.5};}
export const isoView=(sp:SpecialShip,face:IsoFace)=>sp.iso?sp.iso[face.north?(face.east?0:3):(face.east?1:2)]:0;
