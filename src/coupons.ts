// Kupon kodları: menüdeki KUPON KODU penceresinden girilir. Kodlar, süreleri ve kullanım sınırı veritabanında (coupon_add / coupon_redeem);
// kodu yalnızca sunucu doğrular, her kod hesap başına bir kez kullanılır.
// Ödül: inci, altın, gülle/malzeme (tür → adet) ve özel gemi tasarımı (tasarım kimliği)
export type CouponReward={pearls?:number;gold?:number;xp?:number;ep?:number;items?:Record<string,number>;design?:string};
export const COUPON_ITEMS:Record<string,string>={iron:'Demir Gülle',chain:'Zincir Gülle',fire:'Ateş Güllesi',explosive:'Patlayıcı Gülle',breaker:'Kule Kırıcı',leech:'Can Emici',heal:'Şifa Güllesi',powder:'Kara Barut',shield:'Kalkan',speed:'Hız İksiri',mine:'Mayın'};
export const COUPON_DESIGNS:Record<string,string>={'pirate-rage':'Pirate Rage tasarımı'};
// Türkçe klavyede i/ı/İ farkı kodu bozmasın: hepsi I sayılır
export const normalizeCode=(code:string)=>code.trim().replace(/[iıİ]/g,'I').toUpperCase().replace(/\s+/g,'');
export function rewardText(r:CouponReward){const f=(n:number)=>n.toLocaleString('tr-TR');
  return[r.pearls&&`${f(r.pearls)} İnci`,r.gold&&`${f(r.gold)} Altın`,r.xp&&`${f(r.xp)} TP`,r.ep&&`${f(r.ep)} EP`,...Object.entries(r.items??{}).map(([k,n])=>n>0&&`${f(n)} ${COUPON_ITEMS[k]??k}`),r.design&&(COUPON_DESIGNS[r.design]??r.design)].filter(Boolean).join(' · ');}
