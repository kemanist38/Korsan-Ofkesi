// Deniz Hakimiyeti: 3'e 3 takım savaşı (Alev Muhafızları · Derinlik Lejyonları). Açık: hafta içi 20:00–24:00, hafta sonu tüm gün
// (İstanbul saati). Altı kaptan sıraya girince sunucu takımları elit puana göre dengeler, 15 sn sayılır, 8 dk savaşılır.
// Ortadaki Hakimiyet Bölgesi'ni tutan takımın sayacı ilerler; DOM_WIN puana ulaşan ya da süre bitince önde olan kazanır.
// Ödül maç sonunda: inci + maçta harcanan güllelerin 2 katı elit puan (maç sırasında elit puan ilerlemez).
// Kurallar ve hesaplar sunucuda (server/game-server.mjs); bu dosya istemci ile sunucunun ortak sabitleridir.
export type DomTeam='r'|'b';
export const DOM_TEAMS:Record<DomTeam,{name:string;short:string;color:string;icon:string;ship:string}>={
  r:{name:'Alev Muhafızları',short:'ALEV',color:'#ff4a2a',icon:'/assets/dom-kirmizi-icon-v1.webp',ship:'/assets/dom-kirmizi-dir16-v1.webp'},
  b:{name:'Derinlik Lejyonları',short:'DERİNLİK',color:'#2fa8ff',icon:'/assets/dom-mavi-icon-v1.webp',ship:'/assets/dom-mavi-dir16-v1.webp'},
};
export const DOM_NAME='Deniz Hakimiyeti';
export const DOM_SIZE=3,DOM_COUNTDOWN_MS=15_000,DOM_MATCH_MS=8*60_000,DOM_WIN=240;
// Harita: 6000×4000 boş deniz; bölge ortada, üsler iki uçta
export const DOM_ZONE={x:3000,y:2000,r:420},DOM_CAPTURE_PER_SHIP=25;
export const DOM_BASE:Record<DomTeam,{x:number;y:number}>={r:{x:700,y:2000},b:{x:5300,y:2000}};
export const DOM_PEARLS={win:300,draw:200,lose:100},DOM_EP_PER_BALL=2;

// Açık mı: İstanbul (UTC+3) saatine göre cumartesi-pazar tüm gün, diğer günler 20:00–24:00
export function domWindowAt(now:number){const t=new Date(now+3*3_600_000),day=t.getUTCDay(),h=t.getUTCHours();
  const open=day===0||day===6||h>=20;return{open};}

// Takım dengesi: elit puanı en yakın iki üçlü (6 kaptanda 10 olası bölünme denenir)
export function domBalance<T>(list:T[],ep:(x:T)=>number):{r:T[];b:T[]}{
  const n=list.length,half=n/2;let best={r:list.slice(0,half),b:list.slice(half)},gap=Infinity;
  const total=list.reduce((a,x)=>a+ep(x),0);
  for(let mask=0;mask<1<<n;mask++){if(!(mask&1))continue;let c=0,s=0;for(let i=0;i<n;i++)if(mask>>i&1){c++;s+=ep(list[i]);}
    if(c!==half)continue;const g=Math.abs(total-2*s);if(g<gap){gap=g;best={r:list.filter((_,i)=>mask>>i&1),b:list.filter((_,i)=>!(mask>>i&1))};}}
  return best;}

// Bölge: cap -100 (mavi) … +100 (kırmızı). Bölgede tek takım varsa gemi başına saniyede DOM_CAPTURE_PER_SHIP ilerler;
// ±100'e ulaşan takım bölgeyi alır, sıfırı geçince sahiplik düşer. Sahip takım, bölge çekişmeli değilse saniyede 1 puan kazanır.
export type DomZone={cap:number;own:DomTeam|null};
export function domZoneStep(z:DomZone,nr:number,nb:number):{contested:boolean}{
  const contested=nr>0&&nb>0;
  if(!contested&&(nr>0||nb>0)){const d=(nr-nb)*DOM_CAPTURE_PER_SHIP;z.cap=Math.max(-100,Math.min(100,z.cap+d));
    if(z.cap>=100)z.own='r';else if(z.cap<=-100)z.own='b';else if((z.own==='r'&&z.cap<=0)||(z.own==='b'&&z.cap>=0))z.own=null;}
  return{contested};}
export function domWinner(s:Record<DomTeam,number>):DomTeam|null{return s.r===s.b?null:s.r>s.b?'r':'b';}
export const domReward=(team:DomTeam,win:DomTeam|null,balls:number)=>({pearls:win===null?DOM_PEARLS.draw:win===team?DOM_PEARLS.win:DOM_PEARLS.lose,ep:Math.max(0,Math.round(balls))*DOM_EP_PER_BALL});
