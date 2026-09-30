// Özel gemiler: yalnızca görünüm (başlangıç gemisi gücünde), inciyle bir kez satın alınır. Tersanenin 2. sayfasında listelenir.
// Kart görseli tek açılı raster (384 px, pruva sol-aşağı). Yön sayfası olmayan gemi sağa giderken yatay aynalanır.
// dir: 8 yönlü sayfa (4 × 2, 256 px kare; elitlerle aynı sıra G, GB, B, KD, K, GD, D, KB). Yoksa tek görsel aynalanır.
// views: yan yana kare görünüşler (256 px). bows: her karede burnun ekranda baktığı açı (derece, 0 = kuzey, saat yönünde).
// Seafight usulü: gidiş yönüne burnu en yakın kare seçilir (sınırda 8° gecikme); kalan fark için gemi en fazla 15° döndürülür,
// böylece gemi yan yan kaymış gibi görünmez.
export type SpecialShip={id:string;name:string;english:string;price:number;art:string;description:string;dir?:string;views?:string;bows?:number[];lanes?:number[]};
export const SPECIAL_SHIPS:SpecialShip[]=[
  {id:'ak-kadirga',name:'Ak Kadırga',english:'White Galley',price:500,art:'/assets/special-galley-v1.webp',dir:'/assets/special-galley-dir-v1.webp',description:'Pruvasında ikiz top taşıyan, kürekli beyaz savaş kadırgası; kemik haçlı yelkenleriyle tanınır.'},
  {id:'kizil-anka',name:'Kızıl Anka',english:'Crimson Phoenix',price:1000,art:'/assets/special-phoenix-v1.webp',dir:'/assets/special-phoenix-dir-v1.webp',description:'Altın anka kuşu işlemeli kızıl yelkenleri ve yaldızlı kıç köşküyle dört direkli asil kalyon.'},
  // Kareler: 0 K (arkadan) · 1 GB · 2 G (önden) · 3 GD · 4 KD · 5 KB; burun açıları görsellerden ölçüldü
  {id:'korsan-sandali',name:'Korsan Sandalı',english:'Pirate Sloop',price:750,art:'/assets/special-sandal-v1.webp',views:'/assets/special-sandal-views-v2.webp',bows:[0,247,180,113,58,302],lanes:[45,90,135,225,270,315],description:'Kuru kafa işaretli yamalı yelkenleriyle üç direkli, çevik korsan teknesi.'},
];
export const specialById=(id:string|null|undefined)=>SPECIAL_SHIPS.find(s=>s.id===id);
// Yön: gemi sağa gidiyorsa aynala; neredeyse dikey gidişte son bakış korunur
export function specialFacing(angle:number,previous:1|-1):1|-1{const dx=Math.sin(angle);return Math.abs(dx)>.2?(dx>0?1:-1):previous;}
const wrapDeg=(d:number)=>((d%360)+540)%360-180;
// Gidiş açısına (radyan) göre kare ve küçük döndürme (radyan)
export function specialPose(sp:SpecialShip,angle:number,previous:number){const bows=sp.bows??[0],h=angle*180/Math.PI;
  let best=0;for(let i=1;i<bows.length;i++)if(Math.abs(wrapDeg(h-bows[i]))<Math.abs(wrapDeg(h-bows[best])))best=i;
  const view=previous>=0&&previous<bows.length&&Math.abs(wrapDeg(h-bows[previous]))-Math.abs(wrapDeg(h-bows[best]))<8?previous:best;
  const tilt=Math.max(-15,Math.min(15,wrapDeg(h-bows[view])));return{view,tilt:tilt*Math.PI/180};}
// Seafight usulü yollar: gemi düz kuzey/güneye gitmez; çaprazlardan ve düz doğu/batıdan (lanes, artan sırada derece) iki ayakta gider.
// Hedef vektörü onu çevreleyen iki yola ayrılır; gemi önce birinde, o bileşen bitince öbüründe ilerler. current: şu anki yol sırası.
export function laneStep(lanes:number[],dx:number,dy:number,current:number):{lane:number;heading:number}|null{
  const n=lanes.length,th=((Math.atan2(dx,-dy)*180/Math.PI)+360)%360;let i=n-1;for(let k=0;k<n;k++)if(lanes[k]<=th)i=k;const j=(i+1)%n;
  const u=(d:number)=>[Math.sin(d*Math.PI/180),-Math.cos(d*Math.PI/180)],[x1,y1]=u(lanes[i]),[x2,y2]=u(lanes[j]),det=x1*y2-y1*x2;
  if(Math.abs(det)<1e-6)return null;const a=(dx*y2-dy*x2)/det,b=(x1*dy-y1*dx)/det,MIN=4;
  if(a<MIN&&b<MIN)return null;let lane=current===i&&a>=MIN?i:current===j&&b>=MIN?j:a>=b?i:j;if((lane===i?a:b)<MIN)lane=lane===i?j:i;
  return{lane,heading:lanes[lane]*Math.PI/180};}
