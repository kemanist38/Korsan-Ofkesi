// Kupon kodları: etkinliklerde dağıtılan kodlar menüdeki KUPON KODU penceresinden girilir. Kodun kendisi kaynakta durmaz,
// yalnızca SHA-256 özeti tutulur (yeni kod: node tools/coupon.mjs). Her kod hesap başına bir kez kullanılır.
// Not: sunucu gelene kadar kontrol tarayıcıdadır; kullanım sayısı sınırı ve iptal sunucu tarafında yapılacak.
export type CouponReward={pearls?:number;gold?:number;xp?:number;ep?:number;vipDays?:number};
export type Coupon={hash:string;reward:CouponReward;until?:string;note:string};
export const COUPONS:Coupon[]=[
  // PIRATERAGE: beta hoş geldin kodu
  {hash:'37c152bd4588dceb0e9255ff8cde4857f66eb75d131742308dbbb9a82bd34311',reward:{pearls:100,gold:50_000},until:'2026-12-31',note:'Beta hoş geldin'},
];
const STORAGE='yedi-deniz-coupons-v1';
// Türkçe klavyede i/ı/İ farkı kodu bozmasın: hepsi I sayılır
export const normalizeCode=(code:string)=>code.trim().replace(/[iıİ]/g,'I').toUpperCase().replace(/\s+/g,'');
export async function hashCode(code:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizeCode(code)));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function loadRedeemed():string[]{try{const r=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(r)?r.filter(x=>typeof x==='string'):[];}catch{return[];}}
export function saveRedeemed(list:string[]){try{localStorage.setItem(STORAGE,JSON.stringify(list));}catch{}}
export type RedeemResult={ok:true;coupon:Coupon}|{ok:false;error:string};
// today: YYYY-MM-DD (yerel gün); son gün dahil geçerlidir
export async function redeem(code:string,redeemed:string[],today:string,list=COUPONS):Promise<RedeemResult>{
  if(normalizeCode(code).length<4)return{ok:false,error:'Kupon kodunu gir'};
  const h=await hashCode(code),c=list.find(x=>x.hash===h);
  if(!c)return{ok:false,error:'Geçersiz kupon kodu'};
  if(c.until&&today>c.until)return{ok:false,error:'Bu kuponun süresi dolmuş'};
  if(redeemed.includes(h))return{ok:false,error:'Bu kuponu zaten kullandın'};
  redeemed.push(h);return{ok:true,coupon:c};
}
export function rewardText(r:CouponReward){const f=(n:number)=>n.toLocaleString('tr-TR');
  return[r.pearls&&`${f(r.pearls)} İnci`,r.gold&&`${f(r.gold)} Altın`,r.xp&&`${f(r.xp)} TP`,r.ep&&`${f(r.ep)} EP`,r.vipDays&&`${r.vipDays} gün VİP`].filter(Boolean).join(' · ');}
