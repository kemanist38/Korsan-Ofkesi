// Savaş puanı (SP) ve savaş rütbeleri. SP yalnızca rakip oyuncu (şimdilik test kaptanları) batırınca, son atışı yapana verilir;
// NPC, canavar, boss ve kule SP vermez. Aynı oyuncu bir günde en çok 3 kez SP kazandırır; sonraki batırmalar o gün SP vermez.
// SP hiç azalmaz; rütbe toplam SP'ye göre belirlenir.
export const BATTLE_RANKS:{name:string;sp:number}[]=[
  {name:'Tayfa',sp:0},{name:'Lostromo',sp:500},{name:'Topçu Başı',sp:2_000},{name:'Kaptan',sp:6_000},
  {name:'Kıdemli Kaptan',sp:15_000},{name:'Korsan Reisi',sp:40_000},{name:'Deniz Kurdu',sp:100_000},{name:'Kaptan-ı Derya',sp:250_000},
];
// Her haritada aynı: rakip oyuncu başına 25 SP (Cumartesi Savaş Günü'nde 2 kat, src/events.ts)
export const RIVAL_SP=25,RIVAL_DAILY_LIMIT=3;
export function battleRank(sp:number){let i=0;while(i+1<BATTLE_RANKS.length&&sp>=BATTLE_RANKS[i+1].sp)i++;
  const cur=BATTLE_RANKS[i],next=BATTLE_RANKS[i+1]??null;
  return{index:i,name:cur.name,next,pct:next?Math.min(100,(sp-cur.sp)/(next.sp-cur.sp)*100):100};}
// Günlük sayaç: hangi oyuncudan bugün kaç kez SP alındı. Gün değişince sıfırlanır.
export type RivalLog={day:string;kills:Record<string,number>};
const STORAGE='yedi-deniz-sp-daily-v1';
export const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function loadRivalLog():RivalLog{try{const r=JSON.parse(localStorage.getItem(STORAGE)||'null');if(r&&typeof r.day==='string'&&r.kills&&typeof r.kills==='object')return r;}catch{}return{day:dayKey(),kills:{}};}
// Bu batırma SP kazandırıyorsa sayacı artırır ve true döner; o gün bu oyuncudan 3 SP'li batırma dolduysa false
export function claimRivalSp(log:RivalLog,victim:string,today=dayKey()){if(log.day!==today){log.day=today;log.kills={};}
  const n=log.kills[victim]??0;if(n>=RIVAL_DAILY_LIMIT)return false;log.kills[victim]=n+1;try{localStorage.setItem(STORAGE,JSON.stringify(log));}catch{}return true;}
