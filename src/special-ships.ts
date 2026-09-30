// Özel gemiler: yalnızca görünüm (başlangıç gemisi gücünde), inciyle bir kez satın alınır. Tersanenin 2. sayfasında listelenir.
// Kart görseli tek açılı raster (384 px, pruva sol-aşağı). Yön sayfası olmayan gemi sağa giderken yatay aynalanır.
// dir: 8 yönlü sayfa (4 × 2, 256 px kare; elitlerle aynı sıra G, GB, B, KD, K, GD, D, KB). Yoksa tek görsel aynalanır.
// views: yan yana kare görünüşler (256 px). Seafight usulü 4 çapraz görünüş: quad = [KD, GD, GB, KB] için kare sırası.
// Gemi hangi çeyreğe gidiyorsa o çapraz görünüş çizilir; ara kare yok, anında geçer. Sınırda (tam K/G/D/B) titrememek için 12° gecikme.
export type SpecialShip={id:string;name:string;english:string;price:number;art:string;description:string;dir?:string;views?:string;quad?:[number,number,number,number]};
export const SPECIAL_SHIPS:SpecialShip[]=[
  {id:'ak-kadirga',name:'Ak Kadırga',english:'White Galley',price:500,art:'/assets/special-galley-v1.webp',dir:'/assets/special-galley-dir-v1.webp',description:'Pruvasında ikiz top taşıyan, kürekli beyaz savaş kadırgası; kemik haçlı yelkenleriyle tanınır.'},
  {id:'kizil-anka',name:'Kızıl Anka',english:'Crimson Phoenix',price:1000,art:'/assets/special-phoenix-v1.webp',dir:'/assets/special-phoenix-dir-v1.webp',description:'Altın anka kuşu işlemeli kızıl yelkenleri ve yaldızlı kıç köşküyle dört direkli asil kalyon.'},
  // Sayfada gerçek 4 görünüş var: 0 K (arkadan) · 1 GB (sol-aşağı) · 2 G (önden) · 3 GD (sağ-aşağı). KD/KB görseli gelene kadar arkadan görünüş kullanılır.
  {id:'korsan-sandali',name:'Korsan Sandalı',english:'Pirate Sloop',price:750,art:'/assets/special-sandal-v1.webp',views:'/assets/special-sandal-views-v1.webp',quad:[0,3,1,0],description:'Kuru kafa işaretli yamalı yelkenleriyle üç direkli, çevik korsan teknesi.'},
];
export const specialById=(id:string|null|undefined)=>SPECIAL_SHIPS.find(s=>s.id===id);
// Yön: gemi sağa gidiyorsa aynala; neredeyse dikey gidişte son bakış korunur
export function specialFacing(angle:number,previous:1|-1):1|-1{const dx=Math.sin(angle);return Math.abs(dx)>.2?(dx>0?1:-1):previous;}
// Çeyrek: 0 KD (0–90°), 1 GD, 2 GB, 3 KB; açı 0 = kuzey, saat yönünde
export function shipQuadrant(angle:number,previous:number){const T=Math.PI*2,a=((angle%T)+T)%T,q=Math.floor(a/(Math.PI/2))%4;
  if(previous<0||q===previous)return q;const lo=previous*Math.PI/2,hi=lo+Math.PI/2,H=12*Math.PI/180;
  const d=Math.min(Math.abs(a-lo),Math.abs(a-hi),T-Math.abs(a-lo),T-Math.abs(a-hi));return d<H?previous:q;}
