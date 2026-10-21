// Lanetli Sular: Hayatta Kalma — 10 kaptanlık, herkesin eşit gemiyle girdiği son-kalan-kazanır modu. Açık saatler Deniz Hakimiyeti
// ile aynı. Lanetli sis 60 sn'de bir daralır; sis dışındaki gemi her saniye canının bir payını kaybeder. Yeniden doğma yok.
// Sis, can, hasar, eleme ve ödül sunucuda (server/game-server.mjs); bu dosya istemci ile sunucunun ortak sabitleridir.
import {salvoDamage,reloadTime,rangeOf,type Loadout} from './combat';
export const LS_NAME='Lanetli Sular: Hayatta Kalma';
export const LS_SIZE=10,LS_COUNTDOWN_MS=15_000;
export const LS_ICON='/assets/ls-icon-v1.webp';
// Eşit gemi: herkes aynı topla, geliştirmesiz, bonussuz; yalnızca demir gülle (bedava, stoktan düşmez)
export const LS_LOADOUT:Loadout={cannons:40,type:'cast',upDamage:0,upReload:0,upRange:0,crewDamage:1,crewReload:1,crewRange:0,equipDamage:0,equipReload:0,equipRange:0,achDamage:0,eliteDamage:0,eliteReload:0,hero:0};
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
