import {ELITE_THRESHOLD_SCALE} from './economy';
// Özel yetenekler ve yeni mühimmatlar. Hesap kaydına dokunmamak için ayrı anahtarda saklanır.
export type AbilityId='speed'|'mine';
export type ArsenalStock={fire:number;grape:number;mine:number;powder:number;shield:number;speed:number;explosive:number;breaker:number;leech:number;seeded:boolean;seededV2:boolean;ballsV1:boolean};

export const ABILITIES:Record<AbilityId,{name:string;key:string;duration:number;cooldown:number;description:string;icon:string}>={
  // Hız İksiri: sayaçlı sarf malzemesi; her içişte 1 adet harcanır, etkisi sürerken yeniden içilemez
  speed:{name:'Hız İksiri',key:'Z',duration:4,cooldown:30,description:'İçince 4 saniye boyunca azami hız %55 artar; tekrar içmek için 30 saniye beklenir. Her kullanımda 1 adet harcar.',icon:'/assets/icon-speed-potion-v2.webp'},
  mine:{name:'Deniz Mayını',key:'C',duration:40,cooldown:30,description:'Kıç tarafına mayın bırakır; yaklaşan düşmanlara alan hasarı verir. Yeni mayın için 30 saniye beklenir.',icon:'/assets/icon-mine-v2.webp'}
};
export const SPEED_BOOST=1.55;
// Sarf malzemeleri (açık/kapalı): Kara Barut her salvoda 1 adet harcar ve hasarı %10 artırır;
// Kalkan her alınan isabette 1 adet harcar ve gelen hasarı %10 düşürür.
export const CONSUMABLES={
  powder:{name:'Kara Barut',factor:1.1,icon:'/assets/icon-powder-v4.webp',description:'Açıkken her salvoda 1 adet harcar; top hasarı %10 artar.'},
  shield:{name:'Kalkan',factor:.9,icon:'/assets/icon-shield-v3.webp',description:'Açıkken her isabette 1 adet harcar; gelen hasar %10 azalır.'}
} as const;
export type ConsumableId=keyof typeof CONSUMABLES;

// Tek gülle hasarı (Seafight: ateş topu 50, patlayıcı 75). Salvo hasarı = gemideki top sayısı × gülle hasarı × top çarpanı.
export const BALL_DAMAGE=20;
export const CHAIN_FACTOR=1.25;
// Özel gülleler: damage, demir gülleye (20) göre çarpandır.
export const SPECIAL_AMMO={
  fire:{name:'Ateş Güllesi',damage:2.5,reload:1.1,rangeFactor:1,burnSeconds:0,burnDps:250,blastRadius:0,blastFactor:0,towerFactor:1,leech:0,icon:'/assets/ammo-fire-v2.webp',description:'NPC ve canavarlara %40 fazla hasar.'},
  explosive:{name:'Patlayıcı Gülle',damage:2.5,reload:1.1,rangeFactor:1,burnSeconds:0,burnDps:0,blastRadius:0,blastFactor:0,towerFactor:1,leech:0,icon:'/assets/ammo-explosive-v2.webp',description:'Oyunculara %40 fazla hasar.'},
  breaker:{name:'Kule Kırıcı',damage:2.25,reload:1.15,rangeFactor:1,burnSeconds:0,burnDps:0,blastRadius:0,blastFactor:0,towerFactor:2.6,leech:0,icon:'/assets/ammo-breaker-v2.webp',description:'Kulelere ve ada tahkimatına 2,6 kat hasar.'},
  leech:{name:'Can Emici',damage:3,reload:1.1,rangeFactor:1,burnSeconds:0,burnDps:0,blastRadius:0,blastFactor:0,towerFactor:1,leech:.3,icon:'/assets/ammo-leech-v2.webp',description:'Yalnız oyunculara karşı: isabetlerin %20\'si hasarın %15\'i kadar can çalar (en çok canının %2\'si).'}
} as const;
export type SpecialAmmo=keyof typeof SPECIAL_AMMO;

// Ateş güllesi yanması (Seafight Pyreball: 50 hasar + 12 sn boyunca 3 sn'de bir 10 = gülle başına %80 ek hasar)
export const FIRE_DOT_SHARE=.8;
// Gülle kuralları. Zincir yalnız oyuncuları (kaptanları) yavaşlatır, NPC ve canavarlara etki etmez.
export const CHAIN_SLOW={seconds:3,factor:.6};
// Ateş güllesi NPC ve canavarlara, patlayıcı gülle oyunculara (kaptanlara) daha fazla işler; yakma etkisi yoktur.
export const FIRE_NPC_FACTOR=1.4,EXPLOSIVE_PLAYER_FACTOR=1.4;
// Can emici yalnız oyuncudan oyuncuya çalar (NPC, canavar ve kuleden çalmaz); şansa bağlıdır ve tek seferde en çok
// kendi canının %2'si kadar onarır. Ortalama: verilen hasarın ~%3'ü geri gelir, karşılıklı savaşta batırmayı engellemez.
export const LEECH={chance:.2,share:.15,capPct:.02};
export function leechHeal(hit:number,vsPlayer:boolean,ownMaxHp:number,roll=Math.random()){
  if(!vsPlayer||roll>=LEECH.chance)return 0;return Math.round(Math.min(hit*LEECH.share,ownMaxHp*LEECH.capPct));}
// Tamir: saniyede bir kez, sabit miktar (hasar sayıları gibi görünür). Geliştirme/tayfa/elit bonusları en çok %70 artırır.
export const REPAIR_PER_SEC=1500,REPAIR_BONUS_CAP=1.7;
export const repairAmount=(mult:number)=>Math.round(REPAIR_PER_SEC*Math.min(REPAIR_BONUS_CAP,Math.max(1,mult)));
// Elit sınıf (1–15) yalnızca elit puanla (EP) yükselir. Eşikler toplam EP'dir ve her basamak bir öncekinden pahalıdır.
// Toplam EP eşikleri. Elit 15: 3,6 milyon EP; hedef bazlı tüketim modeli tools/simulate-economy.cjs içinde.
export const ELITE_EP=[0,0,7000,30000,80000,200000,360000,530000,750000,1020000,1360000,1780000,2300000,2950000,3850000,5000000].map(n=>Math.round(n*ELITE_THRESHOLD_SCALE));
export const ELITE_MAX_LEVEL=15;
// Gülle dışında EP yalnızca görev ve bossdan gelir (NPC/canavar EP vermez): emek isteyen küçük bir ücretsiz kaynak
export const questEp=(tier:number)=>20*tier,bossEp=(tier:number)=>500*tier;
export const eliteLevelEp=(level:number)=>ELITE_EP[Math.max(1,Math.min(ELITE_MAX_LEVEL,level))];
export const eliteLevelFromEp=(ep:number)=>{let l=1;while(l<ELITE_MAX_LEVEL&&ep>=eliteLevelEp(l+1))l++;return l;};
export const MINE={armSeconds:1,triggerRadius:46,blastRadius:95,baseDamage:4000,damagePerLevel:400,maxActive:5,icon:'/assets/icon-mine-v2.webp'};

// Dükkân birim fiyatları (altın). Oyuncu istediği adedi yazar; toplam = adet × birim fiyat.
// Demir gülle sınırsız ve bedava; diğer bütün gülleler (zincir dahil) inciyle alınır ve EP verir; inci fiyatı sırasıyla artar.
// Her top her salvoda 1 gülle harcar. Fiyatlar 300 gülle içindir.
export type Price={amount:number;currency:'gold'|'pearls';per?:number};
export const priceOf=(p:Price,qty:number)=>Math.ceil(qty*p.amount/(p.per??1));
export const AMMO_PRICES={chain:{amount:6,currency:'pearls',per:300},fire:{amount:8,currency:'pearls',per:300},breaker:{amount:10,currency:'pearls',per:300},explosive:{amount:12,currency:'pearls',per:300},leech:{amount:15,currency:'pearls',per:300}} as const satisfies Record<string,Price>;
// Elit puan gülleye harcanan inciyle orantılı: her inci EP_PER_PEARL EP eder. Pahalı gülle atan, gülle başına daha çok EP alır
// (zincir 0,075 · alev 0,1 · kule kırıcı 0,125 · patlayıcı 0,15 · can emici 0,1875). En büyük paketle Elit 15 ≈ 9.800 ₺.
export const EP_PER_PEARL=3.75;
const epPerBall=(p:Price)=>Math.round(p.amount/(p.per??1)*EP_PER_PEARL*10_000)/10_000;
export const ELITE_POINTS_PER_BALL={chain:epPerBall(AMMO_PRICES.chain),fire:epPerBall(AMMO_PRICES.fire),breaker:epPerBall(AMMO_PRICES.breaker),explosive:epPerBall(AMMO_PRICES.explosive),leech:epPerBall(AMMO_PRICES.leech)} as const;
export const SUPPLY_PRICES={powder:{amount:3,currency:'gold'},shield:{amount:3,currency:'gold'},speed:{amount:2,currency:'pearls'},mine:{amount:5,currency:'pearls'}} as const satisfies Record<string,Price>;
export type SupplyId=keyof typeof SUPPLY_PRICES;

const STORAGE='yedi-deniz-arsenal-v1';
export function loadArsenal():ArsenalStock{
  try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'null');const n=(v:unknown,d:number)=>v===undefined?d:Math.max(0,+(v as number)||0);if(raw)return{fire:n(raw.fire,0),grape:n(raw.grape,0),mine:n(raw.mine,0),powder:n(raw.powder,30),shield:n(raw.shield,30),speed:n(raw.speed,10),explosive:n(raw.explosive,10),breaker:n(raw.breaker,10),leech:n(raw.leech,10),seeded:!!raw.seeded,seededV2:!!raw.seededV2,ballsV1:!!raw.ballsV1};}catch{}
  // İlk açılışta tanıtım stoğu
  return{fire:750,grape:750,mine:3,powder:30,shield:30,speed:10,explosive:500,breaker:500,leech:500,seeded:false,seededV2:false,ballsV1:true};
}
export function saveArsenal(stock:ArsenalStock){try{localStorage.setItem(STORAGE,JSON.stringify(stock));}catch{}}
