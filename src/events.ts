// Günlük etkinlikler: haftanın gününe göre bir bonus (yerel saat, gece yarısı değişir).
// Cumartesi SP, Pazar TP, Pazartesi EP, Salı boss, Çarşamba altın, Perşembe Deniz Antlaşması (src/treaty.ts), Cuma Büyük Kuşatma (src/siege.ts).
export type DayEventId='sp'|'tp'|'ep'|'boss'|'gold'|'treaty'|'siege';
export type DayEvent={id:DayEventId;day:string;name:string;desc:string};
const BY_WEEKDAY:Partial<Record<number,DayEvent>>={
  6:{id:'sp',day:'Cumartesi',name:'Savaş Günü',desc:'Rakip oyuncu batırınca 2 kat savaş puanı (50 SP)'},
  0:{id:'tp',day:'Pazar',name:'Tecrübe Şöleni',desc:'Tüm tecrübe puanları %50 fazla'},
  1:{id:'ep',day:'Pazartesi',name:'Elit Günü',desc:'Elit puanları %50 fazla'},
  2:{id:'boss',day:'Salı',name:'Boss Avı',desc:'Boss, gereken batırmanın yarısında çıkar'},
  3:{id:'gold',day:'Çarşamba',name:'Altın Günü',desc:'Tüm altın kazançları %50 fazla'},
  5:{id:'siege',day:'Cuma',name:'Büyük Kuşatma',desc:'20:00–22:00 · bütün kaptanlar birlikte Kara Kale\'ye saldırır'},
  4:{id:'treaty',day:'Perşembe',name:'Deniz Antlaşması',desc:'Bütün denizlerde pırıltı topla; hedef dolunca 1/1\'de Deniz Elçisi çıkar, 30 dk oylama, seçilen etki 24 saat'},
};
export const dayEvent=(d=new Date())=>BY_WEEKDAY[d.getDay()]??null;
const is=(id:DayEventId,d?:Date)=>dayEvent(d)?.id===id;
// Deniz Antlaşması etkisi: seçilen etki 24 saat, o turda en az 40 pırıltı toplamış kaptanlara işler. Sunucu belirler;
// oyun yalnız kendisine işleyen etkiyi kurar (setTreatyFx), sunucu ise kaptan başına `tr` ile verir.
export type TreatyFxId='dmg'|'treasure'|'ammo'|'gold'|'xp';
let treatyFx:{id:TreatyFxId;until:number}|null=null;
export const setTreatyFx=(fx:{id:TreatyFxId;until:number}|null)=>{treatyFx=fx;};
export const treatyFxOn=(id:TreatyFxId,now=Date.now())=>!!treatyFx&&treatyFx.id===id&&now<treatyFx.until;
// Aynı türden günlük etkinlikle çarpılmaz, eklenir (Altın Günü %50 + antlaşma %10 = %60)
export const spMult=(d?:Date)=>is('sp',d)?2:1;
export const xpMult=(d?:Date,tr=treatyFxOn('xp',d?.getTime()))=>(is('tp',d)?1.5:1)+(tr?.1:0);
export const epMult=(d?:Date)=>is('ep',d)?1.5:1;
export const goldMult=(d?:Date,tr=treatyFxOn('gold',d?.getTime()))=>(is('gold',d)?1.5:1)+(tr?.1:0);
export const treatyDmgMult=()=>treatyFxOn('dmg')?1.05:1;
export const TREATY_KILL_AMMO=10;
export const bossKillsNeeded=(base:number,d?:Date)=>is('boss',d)?Math.ceil(base/2):base;
// Gece yarısına kalan süre: "5 sa 12 dk"
export function untilMidnight(d=new Date()){const m=new Date(d);m.setHours(24,0,0,0);const min=Math.max(1,Math.ceil((m.getTime()-d.getTime())/60000));return min>=60?`${Math.floor(min/60)} sa ${min%60} dk`:`${min} dk`;}
