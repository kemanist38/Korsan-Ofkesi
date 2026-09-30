// Özel gemiler: yalnızca görünüm (başlangıç gemisi gücünde), inciyle bir kez satın alınır. Tersanenin 2. sayfasında listelenir.
// Kart görseli tek açılı raster (384 px, pruva sol-aşağı). Yön sayfası olmayan gemi sağa giderken yatay aynalanır.
// dir: 8 yönlü sayfa (4 × 2, 256 px kare; elitlerle aynı sıra G, GB, B, KD, K, GD, D, KB). Yoksa tek görsel aynalanır.
// views: yan yana kare görünüşler (256 px); viewMap 16 yönün (0 = kuzey, saat yönünde 22,5°) hangi kareyi kullanacağını söyler.
export type SpecialShip={id:string;name:string;english:string;price:number;art:string;description:string;dir?:string;views?:string;viewMap?:number[]};
export const SPECIAL_SHIPS:SpecialShip[]=[
  {id:'ak-kadirga',name:'Ak Kadırga',english:'White Galley',price:500,art:'/assets/special-galley-v1.webp',dir:'/assets/special-galley-dir-v1.webp',description:'Pruvasında ikiz top taşıyan, kürekli beyaz savaş kadırgası; kemik haçlı yelkenleriyle tanınır.'},
  {id:'kizil-anka',name:'Kızıl Anka',english:'Crimson Phoenix',price:1000,art:'/assets/special-phoenix-v1.webp',dir:'/assets/special-phoenix-dir-v1.webp',description:'Altın anka kuşu işlemeli kızıl yelkenleri ve yaldızlı kıç köşküyle dört direkli asil kalyon.'},
  // Kullanıcının 16 yönlü sayfasında yalnızca 4 gerçek görünüş var (K arkadan, G önden, sol-aşağı, sağ-aşağı); öbür kareler tekrar.
  // Kareler: 0 K · 1 sol-aşağı · 2 G · 3 sağ-aşağı
  {id:'korsan-sandali',name:'Korsan Sandalı',english:'Pirate Sloop',price:750,art:'/assets/special-sandal-v1.webp',views:'/assets/special-sandal-views-v1.webp',viewMap:[0,0,3,3,3,3,3,2,2,2,1,1,1,1,1,0],description:'Kuru kafa işaretli yamalı yelkenleriyle üç direkli, çevik korsan teknesi.'},
];
export const specialById=(id:string|null|undefined)=>SPECIAL_SHIPS.find(s=>s.id===id);
// Yön: gemi sağa gidiyorsa aynala; neredeyse dikey gidişte son bakış korunur
export function specialFacing(angle:number,previous:1|-1):1|-1{const dx=Math.sin(angle);return Math.abs(dx)>.2?(dx>0?1:-1):previous;}
export function specialView(sp:SpecialShip,angle:number){const k=((Math.round(angle/(Math.PI/8))%16)+16)%16;return sp.viewMap?.[k]??0;}
