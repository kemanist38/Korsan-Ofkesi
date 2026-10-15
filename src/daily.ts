// Günlük giriş ödülü: 7 günlük takvim (7. gün rastgele bir sıradan donanım parçası da verir). Her takvim günü bir kez toplanır; art arda gelindikçe sonraki güne geçilir,
// bir gün kaçırılırsa takvim 1. güne döner, 7. günden sonra yeniden başlar. Altın ödülü kaptan seviyesiyle büyür.
export type DailyReward={gold?:number;pearls?:number;chain?:number;fire?:number;breaker?:number;explosive?:number;leech?:number;heal?:number;powder?:number;shield?:number;speed?:number;mine?:number;equip?:'common'|'epic'};
export type DailyState={last:string|null;streak:number};
const STORAGE='yedi-deniz-daily-v1';
export const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const prevDay=(d:Date)=>{const p=new Date(d);p.setDate(p.getDate()-1);return dayKey(p);};
export function loadDaily():DailyState{try{const r=JSON.parse(localStorage.getItem(STORAGE)||'null');if(r)return{last:r.last??null,streak:Math.max(0,r.streak|0)};}catch{}return{last:null,streak:0};}
export function saveDaily(s:DailyState){try{localStorage.setItem(STORAGE,JSON.stringify(s));}catch{}}
// Bugün hangi takvim günündeyiz (1–7) ve toplanabilir mi?
export function dailyStatus(s:DailyState,now=new Date()){
  const today=dayKey(now);
  if(s.last===today)return{day:((s.streak-1)%7)+1,canClaim:false};
  const next=s.last===prevDay(now)?s.streak%7+1:1;
  return{day:next,canClaim:true};
}
export function claimDaily(s:DailyState,now=new Date()):DailyState{
  const st=dailyStatus(s,now);if(!st.canClaim)return s;
  return{last:dayKey(now),streak:st.day};
}
// Değerler tools/simulate-rewards.cjs ile ayarlandı: tam hafta ≈ 1.360 inci değeri + seviyeye göre altın (hafif oyuncunun haftalık
// gülle harcamasının ~%7'si). 7. gün en büyük ödül ve sıradan donanım.
export function dailyReward(day:number,level:number):DailyReward{
  const G=Math.round(1500*Math.pow(1.6,level-1));
  const week:DailyReward[]=[
    {gold:G,fire:6000},
    {chain:6000,powder:100,shield:100},
    {pearls:50,breaker:6000},
    {gold:G*2,explosive:6000,speed:20},
    {pearls:100,leech:6000},
    {gold:G*3,powder:200,shield:200,mine:10},
    {pearls:300,gold:G*5,explosive:9000,fire:9000,equip:'common'},
  ];
  return week[day-1];
}
