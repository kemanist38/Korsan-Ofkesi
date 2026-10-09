export type EliteShipId=
  'phantom'|'magma'|'glacial'|'kraken'|'ironclad'|'crimson'|'atlantean'|'bone'|'tempest'|'sovereign'|'jade'|'ragnarok'|'void'|'coral'|'sand';

export type EliteShip={
  id:EliteShipId;level:number;name:string;english:string;asset:string;
  role:string;
};

// Elit gemiler: her gemi bir rol ve sürekli bir pasif taşır. Etkin yetenek bütün gemilerde ortaktır: Korsan Öfkesi (src/rage.ts).
export const ELITE_SHIPS:EliteShip[]=[
{id:'phantom',level:1,name:'Hayalet Kadırga',english:'The Phantom Galleon',asset:'/assets/elite-phantom-art-v20.webp',role:'Kaçış'},
{id:'magma',level:2,name:'Volkanik Dreadnought',english:'Volcanic Dreadnought',asset:'/assets/elite-magma-art-v20.webp',role:'Alan hasarı'},
{id:'glacial',level:3,name:'Buzul Tiranı',english:'Glacial Tyrant',asset:'/assets/elite-glacial-art-v20.webp',role:'Kontrol'},
{id:'kraken',level:4,name:"Kraken'in Gazabı",english:"Kraken's Embrace",asset:'/assets/elite-kraken-art-v20.webp',role:'Yakalama'},
{id:'ironclad',level:5,name:'Veba Kadırgası',english:'Plague Galley',asset:'/assets/elite-ironclad-art-v20.webp',role:'Tank'},
{id:'crimson',level:6,name:'Kanlı Ay Korveti',english:'Crimson Moon Corsair',asset:'/assets/elite-crimson-art-v3.webp',role:'Can emme'},
{id:'atlantean',level:7,name:'Kadim Atlantis Muhafızı',english:'Atlantean Sentry',asset:'/assets/elite-atlantean-art-v3.webp',role:'Koruma'},
{id:'bone',level:8,name:'Kemik Biçici',english:'Bone Harvester',asset:'/assets/elite-bone-art-v3.webp',role:'İnfaz'},
{id:'tempest',level:9,name:'Fırtına Habercisi',english:'Tempest Harbinger',asset:'/assets/elite-tempest-art-v3.webp',role:'Zincir hasar'},
{id:'sovereign',level:10,name:'Kraliyet Sancaktarı',english:'Royal Standard-Bearer',asset:'/assets/elite-sovereign-art-v3.webp',role:'Destek / ganimet'},
{id:'jade',level:11,name:'Yeşim Ejderha',english:'Jade Dragon',asset:'/assets/elite-jade-art-v3.webp',role:'Menzil'},
{id:'ragnarok',level:12,name:'Ragnarok Yıkıcısı',english:'Ragnarok Destroyer',asset:'/assets/elite-ragnarok-art-v3.webp',role:'Öfke'},
{id:'void',level:13,name:'Hiçlik Hükümdarı',english:'Void Monarch',asset:'/assets/elite-void-art-v3.webp',role:'Kaos'},
{id:'coral',level:14,name:'Mercan Koruyucusu',english:'Coral Guardian',asset:'/assets/elite-coral-art-v3.webp',role:'İyileştirme'},
{id:'sand',level:15,name:'Kum Gezgini',english:'Sand Wanderer',asset:'/assets/elite-sand-art-v3.webp',role:'Hız / gizlilik'}
];
export const eliteById=(id:string)=>ELITE_SHIPS.find(ship=>ship.id===id)??ELITE_SHIPS[0];
// Seafight usulü 4 çapraz görünüş: her elit için yan yana 512 px kareler, sıra KD, GD, GB, KB.
// Elitler merdiven hareketiyle (iso-move isoAdvance) gider.
export const ELITE_ISO:Record<EliteShipId,string>={phantom:'/assets/elite-phantom-iso-v20.webp',magma:'/assets/elite-magma-iso-v20.webp',glacial:'/assets/elite-glacial-iso-v20.webp',kraken:'/assets/elite-kraken-iso-v20.webp',ironclad:'/assets/elite-ironclad-iso-v20.webp',crimson:'/assets/elite-crimson-iso-v1.webp',atlantean:'/assets/elite-atlantean-iso-v1.webp',bone:'/assets/elite-bone-iso-v1.webp',tempest:'/assets/elite-tempest-iso-v1.webp',sovereign:'/assets/elite-sovereign-iso-v1.webp',jade:'/assets/elite-jade-iso-v1.webp',ragnarok:'/assets/elite-ragnarok-iso-v1.webp',void:'/assets/elite-void-iso-v1.webp',coral:'/assets/elite-coral-iso-v1.webp',sand:'/assets/elite-sand-iso-v1.webp'};
