// Savaş puanı (SP) ve savaş rütbeleri. SP, batırılan her gemi ve yenilen her rakip için kazanılır ve hiç azalmaz;
// rütbe toplam SP'ye göre belirlenir. Rakip oyuncular (şimdilik test kaptanları) en çok SP'yi verir; son atışı yapan alır.
export const BATTLE_RANKS:{name:string;sp:number}[]=[
  {name:'Tayfa',sp:0},{name:'Lostromo',sp:500},{name:'Topçu Başı',sp:2_000},{name:'Kaptan',sp:6_000},
  {name:'Kıdemli Kaptan',sp:15_000},{name:'Korsan Reisi',sp:40_000},{name:'Deniz Kurdu',sp:100_000},{name:'Kaptan-ı Derya',sp:250_000},
];
export type SpSource='light'|'heavy'|'boss'|'monster'|'tower'|'rival';
const BASE:Record<SpSource,number>={light:1,heavy:3,monster:2,tower:10,boss:40,rival:25};
// Harita seviyesiyle (1–8) doğrusal artar: 1. seviyede hafif NPC 1 SP, 8. seviyede rakip oyuncu 200 SP
export const spReward=(src:SpSource,tier:number)=>BASE[src]*Math.max(1,Math.round(tier));
export function battleRank(sp:number){let i=0;while(i+1<BATTLE_RANKS.length&&sp>=BATTLE_RANKS[i+1].sp)i++;
  const cur=BATTLE_RANKS[i],next=BATTLE_RANKS[i+1]??null;
  return{index:i,name:cur.name,next,pct:next?Math.min(100,(sp-cur.sp)/(next.sp-cur.sp)*100):100};}
