// Salvo hasarı, dolum süresi ve menzil: oyun ve oyun sunucusu aynı formülü kullanır (sunucu atışı kendisi hesaplar).
import {BALL_DAMAGE,CHAIN_FACTOR,SPECIAL_AMMO,CONSUMABLES,FIRE_NPC_FACTOR,EXPLOSIVE_PLAYER_FACTOR} from './arsenal';
import {RAGE_DAMAGE} from './rage';
export type CannonKind='cast'|'long'|'rapid'|'heavy';
export const CANNONS:Record<CannonKind,{name:string;damage:number;range:number;reload:number}>={
  cast:{name:'Döküm',damage:1,range:390,reload:1.65},
  long:{name:'Uzun',damage:.82,range:470,reload:2.05},
  rapid:{name:'Seri',damage:.68,range:340,reload:1.05},
  heavy:{name:'Ağır',damage:1.38,range:365,reload:2.65}
};
// Atışı etkileyen her şey: top sayısı ve türü, geliştirmeler, subaylar (hasar çarpanı, menzil), donanım, madalya, elit, kahraman
export type Loadout={cannons:number;type:CannonKind;upDamage:number;upReload:number;upRange:number;crewDamage:number;crewReload:number;crewRange:number;
  equipDamage:number;equipReload:number;equipRange:number;achDamage:number;eliteDamage:number;eliteReload:number;hero:number};
export type SalvoAmmo='iron'|'chain'|keyof typeof SPECIAL_AMMO;
const ammoMult=(a:SalvoAmmo)=>a==='chain'?CHAIN_FACTOR:a==='iron'?1:SPECIAL_AMMO[a].damage;
// n: özel gülle (ya da zincir) sayısı, i: demir gülle sayısı (stok yetmeyen toplar demir atar)
export function salvoDamage(L:Loadout,a:SalvoAmmo,n:number,i:number,powder:boolean,rage:boolean){
  if(L.cannons<=0)return 0;const mix=(a==='iron'?n+i:n*ammoMult(a)+i)/L.cannons;
  return L.cannons*BALL_DAMAGE*(1+L.upDamage*.11)*CANNONS[L.type].damage*L.crewDamage*mix*(1+L.equipDamage+L.achDamage+L.eliteDamage+L.hero)*(powder?CONSUMABLES.powder.factor:1)*(rage?RAGE_DAMAGE:1);}
export function reloadTime(L:Loadout,a:SalvoAmmo){
  return(1-L.equipReload)*CANNONS[L.type].reload*Math.max(.6,1-L.upReload*.04)*L.crewReload/(1+L.eliteReload)*(a==='chain'?1.18:1)*(a!=='iron'&&a!=='chain'?SPECIAL_AMMO[a].reload:1);}
export const rangeOf=(L:Loadout)=>CANNONS[L.type].range+L.upRange*18+L.crewRange+L.equipRange;
// İsabette hedef türü çarpanı: ateş NPC'ye, patlayıcı oyuncuya, kule kırıcı kuleye daha çok işler
export function targetFactor(a:SalvoAmmo,kind:'npc'|'player'|'tower'|'boss'){
  return(a==='fire'&&(kind==='npc'||kind==='boss')?FIRE_NPC_FACTOR:1)*(a==='explosive'&&kind==='player'?EXPLOSIVE_PLAYER_FACTOR:1)*(a==='breaker'&&kind==='tower'?SPECIAL_AMMO.breaker.towerFactor:1);}
