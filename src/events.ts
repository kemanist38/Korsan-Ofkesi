// Günlük etkinlikler: haftanın gününe göre bir bonus (yerel saat, gece yarısı değişir).
// Cumartesi SP, Pazar TP, Pazartesi EP, Salı boss; diğer günler henüz boş.
export type DayEventId='sp'|'tp'|'ep'|'boss';
export type DayEvent={id:DayEventId;day:string;name:string;desc:string};
const BY_WEEKDAY:Partial<Record<number,DayEvent>>={
  6:{id:'sp',day:'Cumartesi',name:'Savaş Günü',desc:'Rakip oyuncu batırınca 2 kat savaş puanı (50 SP)'},
  0:{id:'tp',day:'Pazar',name:'Tecrübe Şöleni',desc:'Tüm tecrübe puanları %50 fazla'},
  1:{id:'ep',day:'Pazartesi',name:'Elit Günü',desc:'Elit puanları %50 fazla'},
  2:{id:'boss',day:'Salı',name:'Boss Avı',desc:'Boss, gereken batırmanın yarısında çıkar'},
};
export const dayEvent=(d=new Date())=>BY_WEEKDAY[d.getDay()]??null;
const is=(id:DayEventId,d?:Date)=>dayEvent(d)?.id===id;
export const spMult=(d?:Date)=>is('sp',d)?2:1;
export const xpMult=(d?:Date)=>is('tp',d)?1.5:1;
export const epMult=(d?:Date)=>is('ep',d)?1.5:1;
export const bossKillsNeeded=(base:number,d?:Date)=>is('boss',d)?Math.ceil(base/2):base;
// Gece yarısına kalan süre: "5 sa 12 dk"
export function untilMidnight(d=new Date()){const m=new Date(d);m.setHours(24,0,0,0);const min=Math.max(1,Math.ceil((m.getTime()-d.getTime())/60000));return min>=60?`${Math.floor(min/60)} sa ${min%60} dk`:`${min} dk`;}
