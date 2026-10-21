// Lanetli Sular: Hayatta Kalma — 10 kaptanlık, herkesin eşit gemiyle girdiği son-kalan-kazanır modu. Açık saatler Deniz Hakimiyeti
// ile aynı. Lanetli sis 60 sn'de bir daralır; sis dışındaki gemi her saniye canının bir payını kaybeder. Yeniden doğma yok.
// Sis, can, hasar, eleme ve ödül sunucuda (server/game-server.mjs); bu dosya istemci ile sunucunun ortak sabitleridir.
import {salvoDamage,reloadTime,rangeOf,type Loadout} from './combat';
export const LS_NAME='Lanetli Sular: Hayatta Kalma';
export const LS_SIZE=10,LS_COUNTDOWN_MS=15_000;
export const LS_ICON='/assets/ls-icon-v1.webp';
// Haritaya giren herkes aynı lanetli gemi görünümüyle (lanetli.sular.glb → 16 yön)
export const LS_SHIP='/assets/ls-ship-dir16-v1.webp';
// Eşit gemi: herkes tam top kapasitesiyle (315 döküm top), geliştirmesiz, bonussuz. Başlangıçta yalnız demir gülle (bedava, stoktan düşmez);
// özel gülle ve malzemeler denize saçılmıştır, pırıltı gibi yenilenir, toplanıp kullanılır (envanter maça özeldir, hesaba geçmez).
export const LS_LOADOUT:Loadout={cannons:315,type:'cast',upDamage:0,upReload:0,upRange:0,crewDamage:1,crewReload:1,crewRange:0,equipDamage:0,equipReload:0,equipRange:0,achDamage:0,eliteDamage:0,eliteReload:0,hero:0};
export const LS_SALVO=Math.round(salvoDamage(LS_LOADOUT,'iron',0,LS_LOADOUT.cannons,false,false));
export const LS_RELOAD=reloadTime(LS_LOADOUT,'iron'),LS_RANGE=rangeOf(LS_LOADOUT);
export const LS_HP=LS_SALVO*14,LS_SPEED=150;
// Sis: merkez ve yarıçap. 60 sn'de bir yeni (daha küçük) güvenli alan seçilir, 20 sn'de oraya daralır. Son aşamadan sonra tamamen kapanır.
export const LS_START_R=3700,LS_RADII=[2300,1400,750,300,0],LS_PHASE_MS=60_000,LS_SHRINK_MS=20_000;
export const LS_FOG_DPS=[.02,.04,.08,.15,.25,.25];// sis dışında saniyede tam canın payı (aşamaya göre)
export const LS_MATCH_MS=LS_PHASE_MS*(LS_RADII.length+1);
export const LS_PEARLS=[500,300,200],LS_PEARLS_REST=50,LS_KILL_PEARLS=25,LS_EP_PER_BALL=2;
export type LsZone={x:number;y:number;r:number};
export type LsFog={from:LsZone;to:LsZone;at:number;phase:number};// at: daralmanın başladığı an
// Sisin bir andaki güvenli alanı (daralma boyunca doğrusal geçiş)
export function lsZoneAt(f:LsFog,now:number):LsZone{const k=Math.max(0,Math.min(1,(now-f.at)/LS_SHRINK_MS));
  return{x:f.from.x+(f.to.x-f.from.x)*k,y:f.from.y+(f.to.y-f.from.y)*k,r:f.from.r+(f.to.r-f.from.r)*k};}
// Sonraki güvenli alan: şimdikinin içinde rastgele bir merkez, dünya içinde kalacak şekilde
export function lsNext(cur:LsZone,r:number,rand=Math.random):LsZone{const room=Math.max(0,cur.r-r),a=rand()*Math.PI*2,d=Math.sqrt(rand())*room;
  const x=Math.max(r,Math.min(6000-r,cur.x+Math.cos(a)*d)),y=Math.max(r,Math.min(4000-r,cur.y+Math.sin(a)*d));return{x:r?x:cur.x+Math.cos(a)*d,y:r?y:cur.y+Math.sin(a)*d,r};}
export const lsReward=(rank:number,kills:number,balls:number)=>({pearls:(LS_PEARLS[rank-1]??LS_PEARLS_REST)+kills*LS_KILL_PEARLS,ep:Math.max(0,Math.round(balls))*LS_EP_PER_BALL});
// Başlangıç noktaları: merkezin çevresinde eşit aralıklı halka
export const lsSpawn=(i:number,n:number)=>({x:Math.round(3000+Math.cos(i/n*Math.PI*2)*1700),y:Math.round(2000+Math.sin(i/n*Math.PI*2)*1300)});
// Denizdeki eşyalar: tür, toplayınca verilen miktar, görsel. Can emici ve şifa yok (Lanetli Sular'da can hiç artmaz).
export type LsItem='chain'|'fire'|'explosive'|'powder'|'shield'|'speed';
export const LS_ITEMS:Record<LsItem,{name:string;qty:number;icon:string;weight:number}>={
  chain:{name:'Zincir Güllesi',qty:315*3,icon:'/assets/ammo-chain-v2.webp',weight:3},
  fire:{name:'Ateş Güllesi',qty:315*2,icon:'/assets/ammo-fire-v2.webp',weight:3},
  explosive:{name:'Patlayıcı Gülle',qty:315*2,icon:'/assets/ammo-explosive-v2.webp',weight:2},
  powder:{name:'Kara Barut',qty:6,icon:'/assets/icon-powder-v4.webp',weight:2},
  shield:{name:'Kalkan',qty:8,icon:'/assets/icon-shield-v3.webp',weight:2},
  speed:{name:'Hız İksiri',qty:1,icon:'/assets/icon-speed-potion-v2.webp',weight:1},
};
export const LS_ITEM_KEYS=Object.keys(LS_ITEMS) as LsItem[];
export const LS_ITEM_MAX=26,LS_ITEM_RESPAWN_MS=2500,LS_PICK_R=46,LS_SPEED_MS=1500,LS_SPEED_BOOST=1.45;
export type LsInv=Record<LsItem,number>;
export const lsEmptyInv=():LsInv=>({chain:0,fire:0,explosive:0,powder:0,shield:0,speed:0});
export function lsPickKind(rand=Math.random):LsItem{const tot=LS_ITEM_KEYS.reduce((a,k)=>a+LS_ITEMS[k].weight,0);let r=rand()*tot;for(const k of LS_ITEM_KEYS){r-=LS_ITEMS[k].weight;if(r<0)return k;}return'chain';}
// Lanetli sandık (drop): ilk 45. sn'de, sonra 75 sn'de bir sonraki güvenli alanda bir yere düşer. Düşeceği yer 10 sn önceden
// herkese gösterilir; indikten sonra ilk dokunan büyük ganimeti alır (oyuncular sandık için yarışır).
export const LS_DROP_FIRST_MS=45_000,LS_DROP_EVERY_MS=75_000,LS_DROP_FALL_MS=10_000,LS_DROP_PICK_R=60;
export const LS_DROP_LOOT:Partial<LsInv>={explosive:315*4,fire:315*3,chain:315*2,powder:12,shield:16,speed:1};
export type LsDrop={id:number;x:number;y:number;land:number};
