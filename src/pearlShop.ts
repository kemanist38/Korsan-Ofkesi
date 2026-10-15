// İnci Hazinesi: gerçek parayla inci paketleri. Fiyatlar benzer oyunların yaklaşık yarısıdır; büyük paketlerde bonus inci artar.
// Ödeme Shopier'dan: her paket Shopier'da aynı fiyatlı bir ürün. url doluysa satın al butonu o ürün sayfasını açar; ödeme gelince
// oyun sunucusu inciyi cüzdana yükler (server/game-server.mjs, supabase/migrations/006_shopier.sql). url boşsa test modunda hemen verilir.
export type PearlPack={id:string;name:string;pearls:number;bonus:number;price:number;tag?:string;url?:string};
// Shopier ürün bağlantıları (Shopier panelinde ürün oluşturulunca buraya yazılır)
export const SHOPIER_LINKS:Record<string,string>={pouch:'https://www.shopier.com/piraterage/51864655',chest:'https://www.shopier.com/piraterage/51865696',crate:'https://www.shopier.com/piraterage/51865732',hold:'https://www.shopier.com/piraterage/51865773',vault:'https://www.shopier.com/piraterage/51865794',fleet:'https://www.shopier.com/piraterage/51865817'};
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
