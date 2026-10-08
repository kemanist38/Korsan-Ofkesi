// İnci Hazinesi: gerçek parayla inci paketleri. Fiyatlar benzer oyunların yaklaşık yarısıdır; büyük paketlerde bonus inci artar.
// Ödeme altyapısı henüz yok: test modunda paket ödeme alınmadan verilir, değilse "yakında" uyarısı gösterilir.
export type PearlPack={id:string;name:string;pearls:number;bonus:number;price:number;tag?:string};
export const PEARL_PACKS:PearlPack[]=[
  {id:'pouch',name:'İnci Kesesi',pearls:3500,bonus:0,price:49.99},
  {id:'chest',name:'İnci Sandığı',pearls:8500,bonus:700,price:119.99},
  {id:'crate',name:'İnci Kasası',pearls:17000,bonus:3000,price:249.99,tag:'POPÜLER'},
  {id:'hold',name:'Gemi Ambarı',pearls:34000,bonus:8500,price:499.99},
  {id:'vault',name:'Kaptan Hazinesi',pearls:68000,bonus:24000,price:999.99,tag:'EN ÇOK İNCİ'},
  {id:'fleet',name:'Amiral Hazinesi',pearls:136000,bonus:60000,price:1999.99},
];
export const packTotal=(p:PearlPack)=>p.pearls+p.bonus;
export const pearlsPerLira=(p:PearlPack)=>packTotal(p)/p.price;
export const priceText=(n:number)=>`${n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺`;

// VİP üyelik: hareket halindeyken tamir (VİP'siz oyuncu hareket ederken tamir olamaz) ve %10 fazla tecrübe puanı.
// Süre üstüne eklenir: aktif VİP varken yeni paket, kalan sürenin sonuna eklenir.
export type VipPack={id:string;months:number;price:number;tag?:string};
export const VIP_PACKS:VipPack[]=[
  {id:'vip1',months:1,price:99.99},
  {id:'vip3',months:3,price:299.99,tag:'3 AY'},
  {id:'vip6',months:6,price:599.99,tag:'6 AY'},
];
export const VIP_XP_BONUS=.1,VIP_DAY_MS=86_400_000,VIP_MONTH_DAYS=30;
const VIP_STORAGE='yedi-deniz-vip-v1';
export function loadVipUntil():number{try{const v=Number(localStorage.getItem(VIP_STORAGE));return Number.isFinite(v)?v:0;}catch{return 0;}}
export const vipActive=(until:number,now=Date.now())=>until>now;
export const vipDaysLeft=(until:number,now=Date.now())=>Math.max(0,Math.ceil((until-now)/VIP_DAY_MS));
export const extendVip=(until:number,months:number,now=Date.now())=>Math.max(until,now)+months*VIP_MONTH_DAYS*VIP_DAY_MS;
export function saveVipUntil(until:number){try{localStorage.setItem(VIP_STORAGE,String(until));}catch{}}
