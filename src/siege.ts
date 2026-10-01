// Büyük Kuşatma (Cuma 20:00–22:00): bütün kaptanlar Kara Kale'ye birlikte saldırır, oyuncular birbirine saldıramaz.
// Kale, filo adası altyapısını kullanır (görseli sonra değişecek):
//   1. aşama · dış surlar: batı ve doğu kapılarını koruyan 12 sur kulesi (6 + 6). İkisi de düşünce lagün açılır.
//   2. aşama · iç kuleler: iç adadaki 4 kule (tek tip, daha dayanıklı).
//   3. aşama · kale komutanı: lagünde sancak gemisi; batınca kale düşer ve zafer sandığı açılır.
// Yıkılan hiçbir şey onarılmaz. Ödül verilen hasara göredir; ilk 3'e bir haftalık "Kuşatma Kahramanı" unvanı verilir.
import {FLEET,fleetTower} from './campaign';

export const SIEGE_DAY=5,SIEGE_START_H=20,SIEGE_END_H=22,SIEGE_TIER=8;
export const SIEGE_MS=(SIEGE_END_H-SIEGE_START_H)*3_600_000;
// Kule numaraları FLEET.towers sırasıdır: 0–5 üst sur, 6–11 alt sur, 12–15 iç ada
export const WALL_TOWERS=[0,1,2,3,4,5,6,7,8,9,10,11],INNER_TOWERS=[12,13,14,15];
export const gateOf=(i:number):'west'|'east'=>FLEET.towers[i][0]<0?'west':'east';
export type SiegePhase=1|2|3|4;
export type SiegeSave={id:string;end:number;destroyed:number[];commanderHp:number|null;contrib:Record<string,number>;paid:number;result:'won'|'lost'|null};
const STORAGE='yedi-deniz-siege-v1';

const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
// Kuşatma penceresi: Cuma 20:00–22:00. Test modunda her an açılır ve girişten itibaren 2 saat sürer.
export function siegeWindow(d=new Date()){const start=new Date(d);start.setHours(SIEGE_START_H,0,0,0);const end=new Date(d);end.setHours(SIEGE_END_H,0,0,0);
  const friday=d.getDay()===SIEGE_DAY;return{open:friday&&d>=start&&d<end,upcoming:friday&&d<start,start:start.getTime(),end:end.getTime(),id:dayKey(d)};}
export function newSiege(id:string,end:number):SiegeSave{return{id,end,destroyed:[],commanderHp:null,contrib:{},paid:0,result:null};}
export function loadSiege():SiegeSave|null{try{const r=JSON.parse(localStorage.getItem(STORAGE)||'null');if(r&&typeof r.id==='string'&&Array.isArray(r.destroyed))return r;}catch{}return null;}
export function saveSiege(s:SiegeSave){try{localStorage.setItem(STORAGE,JSON.stringify(s));}catch{}}

export function siegePhase(s:SiegeSave):SiegePhase{
  if(s.result==='won')return 4;
  if(!WALL_TOWERS.every(i=>s.destroyed.includes(i)))return 1;
  if(!INNER_TOWERS.every(i=>s.destroyed.includes(i)))return 2;
  return 3;}
export const gateLeft=(s:SiegeSave,gate:'west'|'east')=>WALL_TOWERS.filter(i=>gateOf(i)===gate&&!s.destroyed.includes(i)).length;

// Can ve hasar: katılımcı sayısına göre ölçeklenir (4 kaptan = 1×). Sunucu gelene kadar katılımcılar oyuncu + 3 test kaptanı.
export function siegeStats(participants=4){const k=Math.max(1,participants)/4,t=fleetTower(SIEGE_TIER);
  return{wallHp:Math.round(t.hp*k),innerHp:Math.round(t.hp*2.5*k),commanderHp:Math.round(t.hp*10*k),towerDamage:t.damage,commanderDamage:Math.round(t.damage*1.6),range:t.range};}
// Kalenin toplam canı: payların ve ödüllerin ölçüsü
export function siegeTotalHp(participants=4){const s=siegeStats(participants);return s.wallHp*WALL_TOWERS.length+s.innerHp*INNER_TOWERS.length+s.commanderHp;}
// Kale ne kadar yıkıldı (0..1)
export function siegeProgress(s:SiegeSave,participants=4){const st=siegeStats(participants);
  const done=s.destroyed.reduce((a,i)=>a+(INNER_TOWERS.includes(i)?st.innerHp:st.wallHp),0)+(s.result==='won'?st.commanderHp:s.commanderHp!=null?st.commanderHp-s.commanderHp:0);
  return Math.min(1,done/siegeTotalHp(participants));}

// Katkı ödülü: kalenin tamamını tek başına yıkmak 60.000 TP, 40.000 altın ve 500 inci eder; pay oranında verilir.
export const CONTRIB_POOL={xp:60_000,gold:40_000,pearls:500};
export function contribReward(damage:number,participants=4){const share=Math.max(0,damage)/siegeTotalHp(participants);
  return{xp:Math.round(CONTRIB_POOL.xp*share),gold:Math.round(CONTRIB_POOL.gold*share),pearls:Math.round(CONTRIB_POOL.pearls*share)};}
// Zafer sandığı: kale düşerse, kalenin en az %2'si kadar hasar veren herkes alır
export const CHEST_SHARE=.02;
export const earnsChest=(damage:number,participants=4)=>damage>=siegeTotalHp(participants)*CHEST_SHARE;
export const CHEST_AMMO=['explosive','breaker','leech','fire','grape'] as const;
export function victoryChest(rand=Math.random,equipIds:string[]=[]){
  const a=Math.floor(rand()*CHEST_AMMO.length),b=(a+1+Math.floor(rand()*(CHEST_AMMO.length-1)))%CHEST_AMMO.length;
  const equip=equipIds.length&&rand()<.15?equipIds[Math.floor(rand()*equipIds.length)]:null;
  return{pearls:150,ammo:{[CHEST_AMMO[a]]:300,[CHEST_AMMO[b]]:300} as Partial<Record<typeof CHEST_AMMO[number],number>>,speed:10,equip};}
// Katkı sıralaması (en çok hasar veren önce)
export const ranking=(contrib:Record<string,number>)=>Object.entries(contrib).sort((a,b)=>b[1]-a[1]);

// Unvan: ilk 3'e bir hafta "Kuşatma Kahramanı"
export const HERO_TITLE='Kuşatma Kahramanı',HERO_DAYS=7;
const TITLE='yedi-deniz-title-v1';
export function loadTitle(now=Date.now()):{name:string;until:number}|null{try{const t=JSON.parse(localStorage.getItem(TITLE)||'null');if(t&&t.until>now)return t;}catch{}return null;}
export function grantTitle(now=Date.now()){const t={name:HERO_TITLE,until:now+HERO_DAYS*86_400_000};try{localStorage.setItem(TITLE,JSON.stringify(t));}catch{}return t;}
