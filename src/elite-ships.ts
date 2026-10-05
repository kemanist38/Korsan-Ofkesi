export type EliteShipId=
  'phantom'|'magma'|'glacial'|'kraken'|'ironclad'|'crimson'|'atlantean'|'bone'|'tempest'|'sovereign'|'jade'|'ragnarok'|'void'|'coral'|'sand';

export type EliteShip={
  id:EliteShipId;level:number;name:string;english:string;asset:string;
  role:string;passive:string;
};

// Elit gemiler: her gemi bir rol ve sürekli bir pasif taşır. Etkin yetenek bütün gemilerde ortaktır: Korsan Öfkesi (src/rage.ts).
export const ELITE_SHIPS:EliteShip[]=[
{id:'phantom',level:1,name:'Hayalet Kadırga',english:'The Phantom Galleon',asset:'/assets/elite-phantom-art-v11.webp',role:'Kaçış',passive:'%10 ihtimalle gülleden kaçar'},
{id:'magma',level:2,name:'Volkanik Dreadnought',english:'Volcanic Dreadnought',asset:'/assets/elite-magma-art-v5.webp',role:'Alan hasarı',passive:'Vuruşların %15\'i hedefi 3 sn yakar'},
{id:'glacial',level:3,name:'Buzul Tiranı',english:'Glacial Tyrant',asset:'/assets/elite-glacial-art-v5.webp',role:'Kontrol',passive:'Vurduğu hedef 2 sn yavaşlar'},
{id:'kraken',level:4,name:"Kraken'in Gazabı",english:"Kraken's Embrace",asset:'/assets/elite-kraken-art-v3.webp',role:'Yakalama',passive:'Yakın mesafede (200 birim) +%10 hasar'},
{id:'ironclad',level:5,name:'Buharlı Zırhlı',english:'Steampunk Ironclad',asset:'/assets/elite-ironclad-art-v3.webp',role:'Tank',passive:'Alınan hasar −%10'},
{id:'crimson',level:6,name:'Kanlı Ay Korveti',english:'Crimson Moon Corsair',asset:'/assets/elite-crimson-art-v3.webp',role:'Can emme',passive:'Verdiği hasarın %3\'ü kadar can kazanır'},
{id:'atlantean',level:7,name:'Kadim Atlantis Muhafızı',english:'Atlantean Sentry',asset:'/assets/elite-atlantean-art-v3.webp',role:'Koruma',passive:'Kalkan etkisi +%10'},
{id:'bone',level:8,name:'Kemik Biçici',english:'Bone Harvester',asset:'/assets/elite-bone-art-v3.webp',role:'İnfaz',passive:'Canı %25\'in altındaki hedeflere +%20 hasar'},
{id:'tempest',level:9,name:'Fırtına Habercisi',english:'Tempest Harbinger',asset:'/assets/elite-tempest-art-v3.webp',role:'Zincir hasar',passive:'+%5 hız'},
{id:'sovereign',level:10,name:'Kraliyet Sancaktarı',english:'Royal Standard-Bearer',asset:'/assets/elite-sovereign-art-v3.webp',role:'Destek / ganimet',passive:'+%10 altın'},
{id:'jade',level:11,name:'Yeşim Ejderha',english:'Jade Dragon',asset:'/assets/elite-jade-art-v3.webp',role:'Menzil',passive:'+20 menzil'},
{id:'ragnarok',level:12,name:'Ragnarok Yıkıcısı',english:'Ragnarok Destroyer',asset:'/assets/elite-ragnarok-art-v3.webp',role:'Öfke',passive:'Canı her %10 düştükçe +%3 hasar'},
{id:'void',level:13,name:'Hiçlik Hükümdarı',english:'Void Monarch',asset:'/assets/elite-void-art-v3.webp',role:'Kaos',passive:'%5 kritik vuruş (2 kat hasar)'},
{id:'coral',level:14,name:'Mercan Koruyucusu',english:'Coral Guardian',asset:'/assets/elite-coral-art-v3.webp',role:'İyileştirme',passive:'Savaş dışında 2 kat hızlı tamir'},
{id:'sand',level:15,name:'Kum Gezgini',english:'Sand Wanderer',asset:'/assets/elite-sand-art-v3.webp',role:'Hız / gizlilik',passive:'+%10 hız'}
];
export const eliteById=(id:string)=>ELITE_SHIPS.find(ship=>ship.id===id)??ELITE_SHIPS[0];
// Seafight usulü 4 çapraz görünüş: her elit için yan yana 512 px kareler, sıra KD, GD, GB, KB.
// Elitler merdiven hareketiyle (iso-move isoAdvance) gider.
export const ELITE_ISO:Record<EliteShipId,string>={phantom:'/assets/elite-phantom-iso-v10.webp',magma:'/assets/elite-magma-iso-v3.webp',glacial:'/assets/elite-glacial-iso-v3.webp',kraken:'/assets/elite-kraken-iso-v1.webp',ironclad:'/assets/elite-ironclad-iso-v1.webp',crimson:'/assets/elite-crimson-iso-v1.webp',atlantean:'/assets/elite-atlantean-iso-v1.webp',bone:'/assets/elite-bone-iso-v1.webp',tempest:'/assets/elite-tempest-iso-v1.webp',sovereign:'/assets/elite-sovereign-iso-v1.webp',jade:'/assets/elite-jade-iso-v1.webp',ragnarok:'/assets/elite-ragnarok-iso-v1.webp',void:'/assets/elite-void-iso-v1.webp',coral:'/assets/elite-coral-iso-v1.webp',sand:'/assets/elite-sand-iso-v1.webp'};
