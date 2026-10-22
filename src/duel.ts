// Açık deniz düellosu: savaşa kapalı denizlerde (1/1, 1/2) iki kaptan anlaşırsa yalnız birbirleriyle savaşır. Teklif rakibin
// oyuncu kartından verilir; bahissiz ya da 500 inci. Düello 3 dakika sürer, ışıklı çemberin içinde geçer: batıran kazanır, süre
// biterse daha çok hasar veren kazanır, çemberden çıkan kaybeder. Bahisli düello günde 1, haftada 2 kez ve seviye farkı en çok 2.
// Kazanan bahis toplamının %90'ını alır (%10 ekonomiden çıkar); berabere biterse bahis geri verilir. Her şeyi sunucu yürütür.
export const DUEL_BETS=[0,500],DUEL_CUT=.1,DUEL_MS=180_000,DUEL_R=380,DUEL_ASK_MS=20_000,DUEL_NEAR=1500,DUEL_LEVEL_GAP=2,DUEL_DAY=1,DUEL_WEEK=2;
export const duelPot=(bet:number)=>Math.floor(bet*2*(1-DUEL_CUT));
export type DuelInfo={id:string;a:string;b:string;an:string;bn:string;x:number;y:number;r:number;end:number;bet:number};
// Hak sayımı: gün ve hafta (pazartesi başlar) anahtarı yerel saate göre
export const duelDayKey=(d:Date)=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
export const duelWeekKey=(d:Date)=>{const m=new Date(d);m.setHours(0,0,0,0);m.setDate(m.getDate()-((m.getDay()+6)%7));return duelDayKey(m);};
export type DuelCount={d:string;dn:number;w:string;wn:number};
export function duelLeft(c:DuelCount|undefined,now:Date){const d=duelDayKey(now),w=duelWeekKey(now);
  const dn=c&&c.d===d?c.dn:0,wn=c&&c.w===w?c.wn:0;return Math.max(0,Math.min(DUEL_DAY-dn,DUEL_WEEK-wn));}
export function duelUse(c:DuelCount|undefined,now:Date):DuelCount{const d=duelDayKey(now),w=duelWeekKey(now);
  return{d,dn:(c&&c.d===d?c.dn:0)+1,w,wn:(c&&c.w===w?c.wn:0)+1};}
