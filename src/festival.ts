// Açılış Festivali: oyunun ilk 7 günü. Festival günlerinin her birinde giriş yapıp o günün ödülünü alan oyuncu, 7. gün
// Pirate Rage özel gemi tasarımını kazanır. Bir gün kaçırılırsa o günün ödülü ve son ödül kaybolur; festival bir daha gelmez.
// FESTIVAL_START oyunun açılış günüdür (yerel saat). Boşken festival kapalıdır; test modunda oyunu ilk açtığın gün başlar.
import {dayKey} from './daily';
export const FESTIVAL_START='';
export const FESTIVAL_DAYS=7;
export type FestivalReward={gold?:number;pearls?:number;chain?:number;fire?:number;breaker?:number;explosive?:number;leech?:number;heal?:number;powder?:number;shield?:number;speed?:number;mine?:number;design?:boolean;equip?:'epic'};
// Festival günlük ödülleri (tools/simulate-rewards.cjs: 7 gün ≈ 3.500 inci değeri + 900 bin altın).
// Kaçırılan günün ödülü yanar; oyuncu sonraki günden devam eder.
export const FESTIVAL_REWARDS:FestivalReward[]=[
  {pearls:200,fire:15_000},
  {chain:30_000,powder:300,shield:300},
  {pearls:300,speed:50},
  {gold:300_000,explosive:15_000},
  {pearls:400,breaker:15_000},
  {gold:600_000,leech:15_000,mine:30},
  {pearls:500,heal:20_000},
];
// Büyük ödül: yalnızca 7 günün hepsine giren oyuncuya, 7. gün ödülüyle birlikte (≈ 3.100 inci değeri + tasarım + destansı donanım)
export const FESTIVAL_GRAND:FestivalReward={pearls:2_500,explosive:30_000,design:true,equip:'epic'};
export type FestivalState={start:string;claimed:number[]};
const KEY='yedi-deniz-festival-v1';
export function loadFestival(testMode:boolean,now=new Date()):FestivalState|null{
  let saved:Partial<FestivalState>|null=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
  const start=FESTIVAL_START||(testMode?saved?.start||dayKey(now):'');
  if(!start)return null;
  return{start,claimed:Array.isArray(saved?.claimed)?saved!.claimed.filter(n=>Number.isInteger(n)):[]};
}
export function saveFestival(s:FestivalState){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
// Festivalin kaçıncı günündeyiz? (1..7, öncesi 0, sonrası 8+)
export function festivalDay(s:FestivalState,now=new Date()){
  const [y,m,d]=s.start.split('-').map(Number),a=new Date(y,m-1,d),b=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.round((b.getTime()-a.getTime())/86_400_000)+1;
}
export const festivalActive=(s:FestivalState,now=new Date())=>{const d=festivalDay(s,now);return d>=1&&d<=FESTIVAL_DAYS;};
export function festivalStatus(s:FestivalState,now=new Date()){
  const day=festivalDay(s,now),missed=[];
  for(let i=1;i<Math.min(day,FESTIVAL_DAYS+1);i++)if(!s.claimed.includes(i))missed.push(i);
  return{day,canClaim:day>=1&&day<=FESTIVAL_DAYS&&!s.claimed.includes(day),missed,complete:s.claimed.length>=FESTIVAL_DAYS,grandLost:missed.length>0};
}
// Bugünün ödülünü işaretler; verilecek ödülü döner (alınamıyorsa null)
export function claimFestival(s:FestivalState,now=new Date()):FestivalReward|null{
  const st=festivalStatus(s,now);if(!st.canClaim)return null;
  s.claimed.push(st.day);const r:FestivalReward={...FESTIVAL_REWARDS[st.day-1]};
  // Büyük ödül yalnızca 7 günün hepsine gelenlere
  if(st.day===FESTIVAL_DAYS&&s.claimed.length>=FESTIVAL_DAYS)for(const [k,v] of Object.entries(FESTIVAL_GRAND))(r as Record<string,unknown>)[k]=typeof v==='number'?((r as Record<string,number>)[k]??0)+v:v;
  return r;
}
