import {PVE_HP,PVE_XP,BOSS_HP} from './pve-balance';
import {damageScale} from './fleetBalance';
// Pirate Rage: Korsan Öfkesi kampanyası: 8 seviye, 16 deniz. Her denizin kendi NPC gemileri, canavarı ve filo adası vardır.
// Güç ve ödüller denizin seviyesiyle birlikte artar.
export type MapKey='1/1'|'1/2'|'2/1'|'2/2'|'3/1'|'3/2'|'4/1'|'4/2'|'5/1'|'5/2'|'6/1'|'6/2'|'7/1'|'7/2'|'8/1'|'8/2';
export type IslandLook='verdant'|'misty'|'coral'|'haven'|'crimson'|'storm'|'ice'|'toxic'|'lava'|'abyss';
export type FleetTheme='verdant'|'coral'|'misty'|'crimson'|'ice'|'toxic'|'lava'|'storm'|'abyss';
export type WorldIsland={x:number;y:number;r:number;name:string;look:IslandLook;variant:0|1|2|3|4|5;flip?:boolean};

export const WORLD_WIDTH=6000,WORLD_HEIGHT=4000;
export const MAX_LEVEL=8;
// Dünya haritası düzeni (üst sıradan alta): 4 × 4, her seviyenin iki denizi yan yana
export const GRID:MapKey[][]=[
  ['7/1','7/2','8/1','8/2'],
  ['5/1','5/2','6/1','6/2'],
  ['3/1','3/2','4/1','4/2'],
  ['1/1','1/2','2/1','2/2'],
];
// Kenar geçişleri sarmaldır: paftanın bir kenarından çıkan karşı kenardan girer (ör. 3/1 batısı ↔ 4/2, 2/1 güneyi ↔ 8/1).
// Bu kural kalıcıdır; değiştirilmemelidir.
export type Dir='north'|'south'|'east'|'west';
export function neighbor(key:MapKey,dir:Dir):MapKey|null{
  const R=GRID.length;
  for(let row=0;row<R;row++){const col=GRID[row].indexOf(key);if(col<0)continue;const C=GRID[row].length;
    const r=(row+(dir==='north'?-1:dir==='south'?1:0)+R)%R,c=(col+(dir==='west'?-1:dir==='east'?1:0)+C)%C;
    return GRID[r][c]??null;}
  return null;
}
export const tierOf=(key:MapKey)=>Number(key.split('/')[0]);

// Seviye atlamak için gereken tecrübe (TP); seviye yalnızca TP ile atlanır, her seviyede sayaç sıfırlanır.
// LEVEL_XP[n] = n → n+1. Offline model: ~140 active hours, 10h/day, 8h quests.
// See tools/simulate-leveling.cjs for loadout/travel assumptions and sensitivity checks.
// Eğri yumuşatıldı: eski tabloda 3. seviyede 18 kat sıçrama vardı (oyuncu ilk 2 saatte 3. seviyeye çıkıp 18 saat takılıyordu).
// Hedef süre (normal oyuncu, 10 sa/gün): ~2, 6, 12, 18, 25, 33, 44 saat.
export const LEVEL_XP=[0,20000,200000,500000,1500000,3200000,5800000,11400000];
export const xpNeed=(level:number)=>level>=MAX_LEVEL?Infinity:LEVEL_XP[level];

type Theme={name:string;sea:[string,string];tint:string;look:IslandLook;fleet:FleetTheme;label:string};
export const THEMES:Record<number,Theme>={
  1:{name:'Güvenli Harita',sea:['#09304a','#082b43'],tint:'#6fd6c4',look:'haven',fleet:'verdant',label:'#b7d9d1'},
  2:{name:'İnciyolu Denizi',sea:['#09304a','#082b43'],tint:'#8ff0dc',look:'coral',fleet:'coral',label:'#c8f4ea'},
  3:{name:'Azurya Denizi',sea:['#09304a','#082b43'],tint:'#82cbdc',look:'verdant',fleet:'verdant',label:'#c8eaf0'},
  4:{name:'Hayalet Denizi',sea:['#09304a','#082b43'],tint:'#9fb8b4',look:'misty',fleet:'misty',label:'#c8d4ce'},
  5:{name:'Buzmahzen Denizi',sea:['#09304a','#082b43'],tint:'#bfe6ff',look:'ice',fleet:'ice',label:'#e8f6ff'},
  6:{name:'Fırtına Denizi',sea:['#09304a','#082b43'],tint:'#9fb4e0',look:'storm',fleet:'storm',label:'#c8d4f0'},
  7:{name:'Karanlık Uçurum Denizi',sea:['#09304a','#082b43'],tint:'#a79bdb',look:'abyss',fleet:'abyss',label:'#d8c0ff'},
  8:{name:'Alev Denizi',sea:['#09304a','#082b43'],tint:'#ff8a3a',look:'lava',fleet:'lava',label:'#ffc090'},
};

// ---------------------------------------------------------------- NPC gemileri
export type NpcDef={id:string;name:string;sprite:string;span:number;role:'light'|'heavy';tier:number;hp:number;damage:number;reload:number;speed:number;gold:number;xp:number;portrait:number};
// Can ve TP ayrı denge tablolarından gelir; altın önceki ekonomi ölçeğini korur.
// NPC ve canavar yalnızca tecrübe puanı (TP) ve altın verir; savaş puanı sadece rakip oyuncu batırınca kazanılır.
// Seafight ölçeği: başlangıç gemisi 75.000 can, 50–100 top; tek gülle (demir) 20 hasar. Bu yüzden NPC canları binlerle başlar
// (Seafight 1. harita NPC'leri 1.500–4.000 can; burada 1,5 katı: 3.750 / 9.000) ve her denizde ×1,6 büyür. Ödül yine canla orantılıdır.
export const XP_PER_HP=(_tier:number)=>1/120;
export const GOLD_PER_HP=.65/90;
export const killReward=(hp:number,tier:number)=>({xp:Math.round(hp*XP_PER_HP(tier)),gold:Math.round(hp*GOLD_PER_HP)});
export const hpScale=(tier:number)=>Math.pow(1.6,tier-1);
// 8. denizde artış 4,0'da durur: eski 4,5 kat hasarla büyük gemi oyuncuyu tek başına batırıyordu
export const dmgScale=(tier:number)=>Math.min(4,1+.5*(tier-1));
// Her denizde üç boy gemi: küçük (x-1-light), orta (x-1-heavy ve x-2-light aynı gemi), büyük (x-2-heavy).
// span: geminin dünyadaki boyu (birim); başlangıç gemisi ~130 birim.
export const NPC_SPAN={small:84,medium:112,large:144} as const;
export const npcSize=(id:string)=>id.endsWith('-1-light')?'small':id.endsWith('-2-heavy')?'large':'medium';
const npc=(id:string,name:string,role:'light'|'heavy',tier:number,sprite=''):Omit<NpcDef,'portrait'>=>{const span=NPC_SPAN[npcSize(id)];
  const dmg=role==='light'?750:1650,t=tier-1,size=npcSize(id)==='small'?0:npcSize(id)==='medium'?1:2,hp=PVE_HP[tier][size],r={xp:PVE_XP[tier][size],gold:killReward(Math.round((size===0?3750:9000)*hpScale(tier)),tier).gold};
  // İlk üç denizde ağır gemilerin hasarı %20 düşük: yeni oyuncu 50 dökme topla büyük gemiye girince sık batıyordu
  const soft=role==='heavy'&&tier<=3?.8:1;
  return{id,name,sprite,span,role,tier,hp,damage:Math.round(dmg*dmgScale(tier)*soft*damageScale(tier)),reload:role==='light'?2.6:2.7,speed:(role==='light'?50:34)+t*1.5,gold:r.gold,xp:r.xp};
};
const NPC_LIST:Omit<NpcDef,'portrait'>[]=[
  npc('n1-1-light','Kıyı Sandalı','light',1,'/assets/trial-coast-boat-dir16-v1.webp'),npc('n1-1-heavy','Tüccar Yelkenlisi','heavy',1,'/assets/trial-coast-merchant-dir16-v1.webp'),
  npc('n1-2-light','Tüccar Yelkenlisi','light',1,'/assets/trial-coast-merchant-dir16-v1.webp'),npc('n1-2-heavy','Kraliyet Firkateyni','heavy',1,'/assets/trial-coast-frigate-dir16-v1.webp'),
  npc('n2-1-light','Sedef Kayığı','light',2,'/assets/pearl-boat-dir16-v1.webp'),npc('n2-1-heavy','Mercan Kesici','heavy',2,'/assets/pearl-cutter-dir16-v1.webp'),
  npc('n2-2-light','Mercan Kesici','light',2,'/assets/pearl-cutter-dir16-v1.webp'),npc('n2-2-heavy','İnci Kraliçe Kalyonu','heavy',2,'/assets/pearl-galleon-dir16-v1.webp'),
  npc('n3-1-light','Yeşim Sürüklenen','light',3,'/assets/azur-boat-dir16-v1.webp'),npc('n3-1-heavy','Kristal Yelkenli','heavy',3,'/assets/azur-sail-dir16-v1.webp'),
  npc('n3-2-light','Kristal Yelkenli','light',3,'/assets/azur-sail-dir16-v1.webp'),npc('n3-2-heavy','Kadim Azur Gardiyanı','heavy',3,'/assets/azur-guardian-dir16-v1.webp'),
  npc('n4-1-light','Solgun Ruh','light',4,'/assets/haunt-boat-dir16-v1.webp'),npc('n4-1-heavy','Lanetli Yelken','heavy',4,'/assets/haunt-sail-dir16-v1.webp'),
  npc('n4-2-light','Lanetli Yelken','light',4,'/assets/haunt-sail-dir16-v1.webp'),npc('n4-2-heavy','Gece Dehşeti Fırkateyni','heavy',4,'/assets/haunt-frigate-dir16-v1.webp'),
  npc('n5-1-light','Donuk Yelkenli','light',5,'/assets/frost-sail-dir16-v1.webp'),npc('n5-1-heavy','Buz Kesici','heavy',5,'/assets/frost-sail-dir16-v1.webp'),
  npc('n5-2-light','Buz Kesici','light',5,'/assets/frost-sail-dir16-v1.webp'),npc('n5-2-heavy','Kış Zıpkını Kalyonu','heavy',5,'/assets/frost-galleon-dir16-v1.webp'),
  npc('n6-1-light','Yağmur Yaran','light',6,'/assets/storm-sail-dir16-v1.webp'),npc('n6-1-heavy','Fırtına Kesici','heavy',6,'/assets/storm-sail-dir16-v1.webp'),
  npc('n6-2-light','Fırtına Kesici','light',6,'/assets/storm-sail-dir16-v1.webp'),npc('n6-2-heavy','Şimşek Lordu','heavy',6,'/assets/storm-galleon-dir16-v1.webp'),
  npc('n7-1-light','Obsidyen Bıçağı','light',7,'/assets/void-sail-dir16-v1.webp'),npc('n7-1-heavy','Obsidyen Akıncısı','heavy',7,'/assets/void-sail-dir16-v1.webp'),
  npc('n7-2-light','Obsidyen Akıncısı','light',7,'/assets/void-sail-dir16-v1.webp'),npc('n7-2-heavy','Hiçlik Savaşçısı','heavy',7,'/assets/void-galleon-dir16-v1.webp'),
  npc('n8-1-light','Lav Yaran','light',8,'/assets/lava-sail-dir16-v1.webp'),npc('n8-1-heavy','Lav Akıncısı','heavy',8,'/assets/lava-sail-dir16-v1.webp'),
  npc('n8-2-light','Lav Akıncısı','light',8,'/assets/lava-sail-dir16-v1.webp'),npc('n8-2-heavy','Cehennem Kalyonu','heavy',8,'/assets/lava-galleon-dir16-v1.webp'),
];
export const NPCS:Record<string,NpcDef>=Object.fromEntries(NPC_LIST.map((n,i)=>[n.id,{...n,portrait:i}]));

// ---------------------------------------------------------------- Canavarlar
// Portre atlasının son karesi (eski Hayalet Amiral) şimdilik kullanılmıyor; yeni boss eklenince kullanılabilir.
// Atlas 16 canavar karesiyle üretildi; kaldırılan canavarların kareleri boş kalır.
export const PORTRAIT_COUNT=NPC_LIST.length+16;
export const PORTRAIT_COLS=5;
export const PORTRAIT_ATLAS='/assets/trial-coast-portraits-v1.webp';

// ---------------------------------------------------------------- Harita bossları
// Her haritada o haritanın en güçlü NPC'sinden (ağır gemi) 200 tane batırılınca haritanın bossu çıkar.
// Boss yalnızca tecrübe puanı ve inci verir. Can: büyük NPC ×10, hasar ×2 (3 güllelik yelpaze), canı yarıya inince 2 muhafız çağırır.
export const BOSS_KILLS=200;
// Boss görselleri denize göre: aynı denizin iki haritası aynı boss gemisini kullanır. Portre atlası 8×2, hücre i = harita sırası.
export const BOSS_ATLAS='/assets/boss-portraits-v2.webp',BOSS_ATLAS_COLS=8;
export type BossDef={key:MapKey;id:string;name:string;sprite:string;span:number;role:'heavy';tier:number;hp:number;damage:number;reload:number;speed:number;gold:number;xp:number;pearls:number;portrait:number;trigger:string};
const BOSS_NAMES:Record<MapKey,string>={
  '1/1':'İmparatorluk Fırkateyni','1/2':'İmparatorluk Fırkateyni','2/1':'İnci Kraliçesi','2/2':'İnci Kraliçesi',
  '3/1':'Kadim Azur İmparatoru','3/2':'Kadim Azur İmparatoru','4/1':'Gece Dehşet İmparatoru','4/2':'Gece Dehşet İmparatoru',
  '5/1':'Kış Zıpkın İmparatoru','5/2':'Kış Zıpkın İmparatoru','6/1':'Şimşek İmparatoru','6/2':'Şimşek İmparatoru',
  '7/1':'Hiçlik İmparatoru','7/2':'Hiçlik İmparatoru','8/1':'Cehennem Lordu','8/2':'Cehennem Lordu'};
// Boss canı: kendi seviyesindeki tek oyuncu ateş güllesiyle ~2 dakikada batırır (boss'lar oyuncular arasında paylaşılmaz).
// Hasarı büyük NPC'nin %25'i: ateş güllesiyle 2 dakikalık savaşta oyuncu canının yaklaşık %35-80'i gider.
export {BOSS_HP};export const BOSS_DAMAGE=.17;
export const bossFor=(key:MapKey):BossDef=>{const m=MAPS[key],h=NPCS[`n${m.tier}-2-heavy`],hp=BOSS_HP[m.tier],i=MAP_KEYS.indexOf(key);
  return{key,id:`boss-${key.replace('/','-')}`,name:BOSS_NAMES[key],sprite:`/assets/boss-t${m.tier}-dir16-v2.webp`,span:260,role:'heavy',tier:m.tier,hp,damage:Math.round(h.damage*BOSS_DAMAGE),reload:2.2,speed:Math.round(h.speed*.8),gold:0,
    xp:h.xp*20,pearls:50*m.tier,portrait:i,trigger:h.id};};

// ---------------------------------------------------------------- Koordinat ızgarası
// Seafight tarzı: üstte soldan sağa 00–60 sütun, solda yukarıdan aşağı AA–CZ satır. Konum "35AJ" gibi yazılır.
export const GRID_COLS=61,GRID_ROWS=78,CELL_W=WORLD_WIDTH/GRID_COLS,CELL_H=WORLD_HEIGHT/GRID_ROWS;
export const colName=(c:number)=>String(c).padStart(2,'0');
export const rowName=(r:number)=>String.fromCharCode(65+Math.floor(r/26))+String.fromCharCode(65+r%26);
export const gridCell=(p:{x:number;y:number})=>({c:Math.max(0,Math.min(GRID_COLS-1,Math.floor(p.x/CELL_W))),r:Math.max(0,Math.min(GRID_ROWS-1,Math.floor(p.y/CELL_H)))});
export function coordLabel(p:{x:number;y:number}){const g=gridCell(p);return`${colName(g.c)}${rowName(g.r)}`;}

// ---------------------------------------------------------------- Filo adası
// Ortak filo adası (public/assets/fleet-island-v4.webp, 1500 × 838 birim): iki hilal sur, doğu ve batıda geniş kapılar,
// ortada kaleli iç ada. Seyir alanı src/fleetMask.ts maskesinden gelir (tools/asset-studio/fleet-raster-mask.mjs).
// towers: 16 kaidenin taban merkezi; üst sur soldan sağa 6, alt sur 6, iç ada 4 (ikisi batı, ikisi doğu kapısına bakar).
// Kayıtlı filo kulelerinin sırası korunur (ilk 8 yuva eski kayıtlarla aynı indekstir).
// FLEET_SCALE: ada dünyada bu oranda çizilir (kaideler ince kuleye otursun diye %80). Kule yerleri, maske ve yarıçaplar
// aynı oranla küçülür; aşağıdaki ham sayılar görselin 1500 × 838 birimlik ölçüsündedir.
export const FLEET_SCALE=.8;
const FLEET_TOWERS_RAW:[number,number][]=[
  [-577,-76],[-385,-194],[-140,-252],[148,-255],[417,-178],[601,-49],
  [-589,197],[-384,315],[-133,386],[142,385],[409,330],[600,217],
  [-131,-26],[132,-22],[-157,98],[179,108]];
export const FLEET={islandR:760*FLEET_SCALE,wallR:600*FLEET_SCALE,gap:.6,
  towers:FLEET_TOWERS_RAW.map(([x,y])=>[Math.round(x*FLEET_SCALE),Math.round(y*FLEET_SCALE)]) as [number,number][]};
// Kuleler filo savaşı ölçeğinde: tek gemi yıkamaz, saldırı kesilince hızla onarılır.
// 16 kule: her kule 5 tam gelişmiş gemilik saldırı referansına göre dengelenir.
export {fleetTowerStats as fleetTower} from './fleetBalance';
export const fleetReward=(tier:number)=>({gold:300*tier,xp:Math.round(500*Math.pow(tier,1.2))});

// ---------------------------------------------------------------- Denizler
export type MapDef={key:MapKey;tier:number;name:string;description:string;safe:boolean;npcs:string[];npcCount:number;heavyShare:number;islands:WorldIsland[];fleet:{x:number;y:number;name:string};labels:{text:string;x:number;y:number}[];spawn:{x:number;y:number}};
const I=(x:number,y:number,r:number,name:string,look:IslandLook,variant:0|1|2|3|4|5,flip=false):WorldIsland=>({x,y,r,name,look,variant,flip});
function sea(key:MapKey,name:string,description:string,opts:{islands:[number,number,number,string,0|1,boolean?][];fleet:[number,number,string];labels?:[string,number,number][];safe?:boolean;look?:IslandLook;count?:number;heavy?:number}):MapDef{
  const tier=tierOf(key),look=opts.look??THEMES[tier].look,sub=key.split('/')[1];
  return{key,tier,name,description,safe:!!opts.safe,npcs:[`n${tier}-${sub}-light`,`n${tier}-${sub}-heavy`,...(tier<=8?[sub==='1'?`n${tier}-2-heavy`:`n${tier}-1-light`]:[])],npcCount:opts.safe?12:16,heavyShare:opts.heavy??(.3+tier*.03),
    islands:opts.islands.map(([x,y,r,n,v,f])=>I(x,y,r,n,look,v,!!f)),fleet:{x:opts.fleet[0],y:opts.fleet[1],name:opts.fleet[2]},labels:(opts.labels??[]).map(([text,x,y])=>({text,x,y})),spawn:{x:opts.fleet[0],y:opts.fleet[1]+530}};
}
export const MAPS:Record<MapKey,MapDef>={
  '1/1':{...sea('1/1','Sığınak Koyu','Savaşa kapalı başlangıç denizi. Filo adanın lagününde gövde kendiliğinden onarılır; buradaki gemiler sen saldırmadıkça ateş açmaz.',
    {islands:[[640,700,170,'Martı Kayası',1],[2520,820,190,'Yosunlu Burun',0,true],[2560,2560,160,'Sakin Resif',1]],fleet:[1500,1900,'Sığınak Filo Adası'],labels:[['SAKİN SULAR',1600,700]],safe:true,count:6,heavy:.25}),islands:[I(640,700,170,'Martı Kayası','haven',1),I(2520,820,190,'Yosunlu Burun','verdant',0,true),I(2560,2560,160,'Sakin Resif','coral',1)]},
  '1/2':sea('1/2','Martı Kıyıları','Kıyı Sandalı, Tüccar Yelkenlisi ve Kraliyet Firkateyni bu sularda gezer.',{safe:true,islands:[[700,650,180,'Fırtına Burnu',0],[2500,700,210,'Ölü Adam Adası',1],[650,2500,200,'Sis Kayalıkları',0,true]],fleet:[2150,2150,'Martı Filo Adası'],labels:[['KIYI SULARI',1400,1000]]}),
  '2/1':sea('2/1','Mercan Geçidi','Sedef Kayığı, Mercan Kesici ve İnci Kraliçe Kalyonu mercan resiflerinde gezer.',{islands:[[650,700,190,'Mercan Kalesi',0],[2550,600,160,'Pembe Resif',1],[600,2550,170,'Deniz Kabuğu',1,true]],fleet:[2050,2100,'Mercan Filo Adası'],labels:[['MERCAN GEÇİDİ',1300,900]]}),
  '2/2':sea('2/2','İnci Resifleri','Sedef Kayığı, Mercan Kesici ve İnci Kraliçe Kalyonu ile parlak resif suları.',{islands:[[2550,700,180,'İnci Adası',1],[700,650,200,'Lagün Adası',0,true],[2600,2550,150,'Midye Kayası',0]],fleet:[1150,2100,'İnci Filo Adası'],labels:[['İNCİ SIĞLIĞI',1900,1000]]}),
  '3/1':sea('3/1','Sis Kayalıkları','Yeşim Sürüklenen, Kristal Yelkenli ve Kadim Azur Gardiyanı bu sularda gezer.',{islands:[[650,650,200,'Sis Burnu',0],[2550,650,180,'Kayıp Fener',1],[2550,2550,190,'Yankı Kayası',0,true]],fleet:[1200,2150,'Azurya Filo Adası'],labels:[['SİS DENİZİ',2000,1300]]}),
  '3/2':sea('3/2','Hayalet Boğazı','Yeşim Sürüklenen, Kristal Yelkenli ve Kadim Azur Gardiyanı ile Azurya’nın geçiş suları.',{islands:[[700,2550,210,'Mezar Adası',1],[2500,2550,170,'Kemik Kıyısı',0],[2550,650,190,'Batıklar Burnu',1,true]],fleet:[1200,1100,'Yeşim Filo Adası'],labels:[['HAYALET BOĞAZI',2000,1800]]}),
  '4/1':sea('4/1','Kan Körfezi','Solgun Ruh, Lanetli Yelken ve Gece Dehşeti Fırkateyni bu lanetli sularda gezer.',{islands:[[650,650,190,'Kan Kayası',0],[2550,700,160,'Kızıl Diş',1],[650,2550,200,'Kırık Sütunlar',0,true]],fleet:[2050,2100,'Hayalet Filo Adası'],labels:[['KAN KÖRFEZİ',1300,1000]]}),
  '4/2':sea('4/2','Paslı Sığlık','Solgun Ruh, Lanetli Yelken ve Gece Dehşeti Fırkateyni ile hayaletlerin sisli sığlığı.',{islands:[[2550,650,190,'Paslı Çapa Adası',1],[650,700,170,'Hurda Kıyısı',0,true],[2500,2550,200,'Demir Kayalık',0]],fleet:[1150,2100,'Batık Filo Adası'],labels:[['PASLI SIĞLIK',1900,1000]]}),
  '5/1':sea('5/1','Ayaz Boğazı','Donuk Yelkenli ve Kış Zıpkını Kalyonu buz kütleleri arasında dolaşır.',{islands:[[650,650,200,'Ayaz Tepesi',0],[2550,650,180,'Donmuş Fener',1],[650,2550,180,'Kar Kayası',1,true]],fleet:[2050,2100,'Ayaz Filo Adası'],labels:[['AYAZ BOĞAZI',1300,1000]]}),
  '5/2':sea('5/2','Kristal Buzullar','Donuk Yelkenli ve Kış Zıpkını Kalyonu ile buzulların parıldayan soğuk derinlikleri.',{islands:[[2550,650,210,'Kristal Buzul',0],[650,700,170,'Işıltı Kayası',1,true],[2550,2550,180,'Kutup Kapısı',1]],fleet:[1150,2100,'Kristal Filo Adası'],labels:[['KRİSTAL BUZULLAR',1900,1000]]}),
  '6/1':sea('6/1','Zehirli Mangrov','Yağmur Yaran ve Şimşek Lordu fırtınalı sularda gezer.',{islands:[[650,650,200,'Mangrov Kökü',0],[2550,650,170,'Çamur Kıyısı',1],[650,2550,190,'Sarmaşık Adası',1,true]],fleet:[2050,2100,'Fırtına Filo Adası'],labels:[['ZEHİRLİ MANGROV',1300,1000]]}),
  '6/2':sea('6/2','Çürük Lagün','Yağmur Yaran ve Şimşek Lordu ile fırtınanın şimşekli lagünü.',{islands:[[2550,650,190,'Çürük Ada',0],[650,700,180,'Balçık Kayası',1,true],[2500,2550,200,'Veba Kıyısı',1]],fleet:[1150,2100,'Şimşek Filo Adası'],labels:[['ÇÜRÜK LAGÜN',1900,1000]]}),
  '7/1':sea('7/1','Kül Adaları','Obsidyen Bıçağı ve Hiçlik Savaşçısı bu karanlık sularda gezer.',{islands:[[650,650,210,'Kül Dağı',0],[2550,650,180,'Duman Kayası',1],[650,2550,170,'Kor Adası',1,true]],fleet:[2050,2100,'Uçurum Filo Adası'],labels:[['KÜL ADALARI',1300,1000]]}),
  '7/2':sea('7/2','Magma Boğazı','Obsidyen Bıçağı ve Hiçlik Savaşçısı ile uçurumun karanlık boğazı.',{islands:[[2550,650,200,'Magma Kapısı',1],[650,700,180,'Yanık Kıyı',0,true],[2550,2550,190,'Ateş Çukuru',0]],fleet:[1150,2100,'Gölge Filo Adası'],labels:[['MAGMA BOĞAZI',1900,1000]]}),
  '8/1':sea('8/1','Şimşek Denizi','Lav Yaran ve Cehennem Kalyonu kaynayan sularda gezer.',{islands:[[650,650,200,'Şimşek Kayalıkları',0],[2550,650,170,'Gök Kulesi',1],[650,2550,190,'Sessiz Mezar',1,true]],fleet:[2050,2100,'Alev Filo Adası'],labels:[['ŞİMŞEK DENİZİ',1300,1000]]}),
  '8/2':sea('8/2','Kasırga Gözü','Lav Yaran ve Cehennem Kalyonu ile lavın ölümcül suları.',{islands:[[2550,650,190,'Kasırga Burnu',1],[650,700,180,'Rüzgâr Kayası',0,true],[2550,2550,200,'Gürültü Adası',0]],fleet:[1150,2100,'Magma Filo Adası'],labels:[['KASIRGA GÖZÜ',1900,1000]]}),
};
export const MAP_KEYS=Object.keys(MAPS) as MapKey[];

// User's world chart is authoritative for names; keys and wrap connections stay stable.
const SEA_LORE:Record<number,string>={
  1:'Kaptanların dinlendiği korunaklı kıyılar.',
  2:'İnci gibi parlayan adalar, sakin meltemler ve denizkızlarının ezgileri.',
  3:'Gökyüzünü yansıtan mavi sularda kadim uygarlıkların izleri saklıdır.',
  4:'Gölgegeçit efsanesinin suları: sis içindeki görünmez kapılar ve kayıp gemiler.',
  5:'Sonsuz kışın hüküm sürdüğü, buz altında kadim hazinelerin saklandığı deniz.',
  6:'Fırtına Tahtı efsanesinin denizi; rüzgârların ve cesur kaptanların sınavı.',
  7:'Karanlık derinliklerde unutulmuş güçlerin ve kayıp sırların denizi.',
  8:'Alev Suları efsanesi: volkanların kızgın lavlarıyla çevrili kayalıklar.',
};
export function islandLayout(key:MapKey,fleet:{x:number;y:number}):WorldIsland[]{
  let seed=2166136261;for(const c of `island-art-v2:${key}`)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  const result:WorldIsland[]=[],tier=tierOf(key),count=8+Math.floor(random()*4);
  // Shuffle all six supplied variants first; repeats follow only after each has appeared.
  const variants:WorldIsland['variant'][]=[0,1,2,3,4,5];
  for(let i=variants.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[variants[i],variants[j]]=[variants[j],variants[i]];}
  const spawn={x:fleet.x,y:Math.min(WORLD_HEIGHT-200,fleet.y+900)};
  for(let attempt=0;attempt<1000&&result.length<count;attempt++){
    const r=90+Math.floor(random()*65),x=Math.round(300+random()*(WORLD_WIDTH-600)),y=Math.round(300+random()*(WORLD_HEIGHT-600));
    if(tier>=2&&Math.hypot(x-fleet.x,y-fleet.y)<FLEET.islandR+r+400)continue;
    if(Math.hypot(x-spawn.x,y-spawn.y)<r+300)continue;
    if(result.some(i=>Math.hypot(x-i.x,y-i.y)<i.r+r+230))continue;
    result.push(I(x,y,r,`${THEMES[tier].name} · Adacık ${result.length+1}`,THEMES[tier].look,variants[result.length%variants.length],false));
  }
  return result;
}
for(const key of MAP_KEYS){
  const map=MAPS[key];map.name=THEMES[map.tier].name;map.description=SEA_LORE[map.tier];
  map.fleet.x=Math.round(map.fleet.x*WORLD_WIDTH/3200);map.fleet.y=Math.round(map.fleet.y*WORLD_HEIGHT/3200);
  map.islands=islandLayout(key,map.fleet);
  map.labels=[{text:map.name.toLocaleUpperCase('tr'),x:WORLD_WIDTH/2,y:WORLD_HEIGHT/2}];
  map.spawn={x:map.fleet.x,y:Math.min(WORLD_HEIGHT-200,map.fleet.y+900)};
}

// ---------------------------------------------------------------- Görevler (seviyeye göre)
// Görevler haritaya özeldir: her haritanın 4 görevi o haritanın NPC ve canavarlarıyla yapılır.
// Oyuncu hangi haritadaysa (kendi seviyesine kadar her harita açık) o haritanın görevlerini alır.
// Görev altın ve TP ödülü, istenen batırmaların normal ödülünün 1,5 katıdır; böylece harita seviyesi arttıkça ödül de artar. İnci ödülü seviyeyle büyür.
export type QuestDef={id:string;map:MapKey;tier:number;title:string;description:string;kind:'npc'|'chest'|'sparkle';ids:string[];required:number;gold:number;xp:number;pearls:number};
export const QUEST_BONUS=1.5;
export const QUESTS:QuestDef[]=MAP_KEYS.flatMap(key=>{
  const m=MAPS[key],t=m.tier,L=NPCS[m.npcs[0]],H=NPCS[m.npcs[1]],pay=(n:number,u:{gold:number;xp:number},k=QUEST_BONUS)=>({gold:Math.round(n*u.gold*k),xp:Math.round(n*u.xp*k)});
  const nL=20,nH=20,nC=20,head=`${key} ${m.name}`;
  return[
    {id:`q${key}-light`,map:key,tier:t,title:`${head}: Devriye Avı`,description:`${L.name} gemilerinden ${nL} tanesini batır.`,kind:'npc',ids:[L.id],required:nL,...pay(nL,L),pearls:2*(2+t)},
    {id:`q${key}-heavy`,map:key,tier:t,title:`${head}: Ağır Filo`,description:`${H.name} gemilerinden ${nH} tanesini denizin dibine gönder.`,kind:'npc',ids:[H.id],required:nH,...pay(nH,H),pearls:2*(3+2*t)},
    {id:`q${key}-sparkle`,map:key,tier:t,title:`${head}: Pırıltı Avı`,description:`Bu denizde ${nC} inci pırıltısı topla.`,kind:'sparkle',ids:[key],required:nC,...pay(nC,{gold:L.gold,xp:Math.round(L.xp*.5)},3),pearls:2*(4+2*t)},
  ];
});
export const QUEST_COOLDOWN_MS=8*60*60*1000;
