// Savaş puanı (SP) ve savaş rütbeleri. SP yalnızca rakip oyuncu (şimdilik test kaptanları) batırınca, son atışı yapana verilir;
// NPC, canavar, boss ve kule SP vermez. Aynı oyuncu bir günde en çok 3 kez SP kazandırır; sonraki batırmalar o gün SP vermez.
// SP hiç azalmaz; rütbe toplam SP'ye göre belirlenir.
// 30 rütbe: 6 kademe (Tahta, Bronz, Gümüş, Altın, Yakut, Efsane) × 5 basamak. Rozetler public/assets/sp-ranks-v1.webp
// (5 sütun × 6 kademe satırı, 128 px); her rütbenin kendi rozeti (madalyası) vardır.
export const BATTLE_RANKS:{name:string;sp:number}[]=[
  {name:'Liman Faresi',sp:0},{name:'Miço',sp:25},{name:'Güverte Çocuğu',sp:250},{name:'Halat Çeken',sp:750},{name:'Tayfa',sp:1_500},
  {name:'Kürekçi',sp:2_500},{name:'Gözcü',sp:4_000},{name:'Barutçu',sp:6_000},{name:'Topçu Yamağı',sp:8_500},{name:'Topçu',sp:11_500},
  {name:'Usta Topçu',sp:15_000},{name:'Nişancı',sp:19_000},{name:'Bordacı',sp:24_000},{name:'Kılıç Ustası',sp:30_000},{name:'Lostromo',sp:37_000},
  {name:'Yağmacı',sp:45_000},{name:'Korsan',sp:54_000},{name:'Deniz Kurdu',sp:64_000},{name:'Kaptan Yardımcısı',sp:75_000},{name:'Kaptan',sp:88_000},
  {name:'Kıdemli Kaptan',sp:102_000},{name:'Reis',sp:118_000},{name:'Korsan Reisi',sp:136_000},{name:'Deniz Aslanı',sp:156_000},{name:'Kara Sancak',sp:180_000},
  {name:'Fırtına Lordu',sp:210_000},{name:'Deniz Ağası',sp:245_000},{name:'Yedi Denizin Korkusu',sp:285_000},{name:'Kaptan-ı Derya',sp:335_000},{name:'Öfke Efendisi',sp:400_000},
];
export const RANK_SHEET='/assets/sp-ranks-v1.webp',RANK_COLS=5,RANK_ICONS=30;
export const rankIcon=(index:number)=>Math.max(0,Math.min(RANK_ICONS-1,index));
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
