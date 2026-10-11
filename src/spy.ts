// Casus: rakip kaptanın adını yazıp inci karşılığında casus gönderilir. Oyundaysa bulunduğu harita ve koordinat,
// değilse son çıkış yaptığı harita ve koordinat öğrenilir. Hedefin Casus Kalkanı varsa casus yakalanır ve kalkandan
// 1 hak düşer; kalkan bitince (ör. 10 hakta 11. casus) konum ele verilir.
// Sunucu gelene kadar rakipler test kaptanlarıdır ve kalkanları bu cihazda saklanır.
export const SPY_COST=10,SPY_SHIELD_PRICE=20;
export type SpyRival={nick:string;online:boolean;map:string;coord:string};
export type SpyResult={kind:'found'|'blocked'|'unknown';rival?:SpyRival;shieldLeft?:number};
const KEY='yedi-deniz-spy-v1';
type Store={shields:Record<string,number>};
const DEFAULT_SHIELDS:Record<string,number>={ADM_AHMET:2,'ADM_YASİN':0,ADM_DOGAN:1};
export function loadSpy():Store{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.shields)return{shields:{...DEFAULT_SHIELDS,...v.shields}};}catch{}return{shields:{...DEFAULT_SHIELDS}};}
export function saveSpy(s:Store){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
export const sameNick=(a:string,b:string)=>a.trim().toLocaleUpperCase('tr-TR')===b.trim().toLocaleUpperCase('tr-TR');
// Casus gönder: rakip bulunamazsa 'unknown' (inci harcanmaz); kalkanı varsa 'blocked' ve 1 hak düşer; yoksa konum verilir.
export function sendSpy(store:Store,nick:string,rivals:SpyRival[]):SpyResult{
  const rival=rivals.find(r=>sameNick(r.nick,nick));if(!rival)return{kind:'unknown'};
  const left=store.shields[rival.nick]??0;
  if(left>0){store.shields[rival.nick]=left-1;saveSpy(store);return{kind:'blocked',rival,shieldLeft:left-1};}
  return{kind:'found',rival};
}
