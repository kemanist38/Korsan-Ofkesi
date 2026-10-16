// Ganimet sandıkları: açık denizde sürüklenen sandıklar.
// NPC ve canavar sandık düşürmez; onlar yalnızca tecrübe puanı ve altın verir.
import type {ChestKind} from './sprites';

export type LootSource='drift';
// Sandık ödülü (altın ve TP vermez): şansa bağlı tek ödül
export const CHEST_AMMO=['fire','explosive','breaker','leech'] as const;
export type ChestAmmo=typeof CHEST_AMMO[number];
export type LootChest={x:number;y:number;kind:ChestKind;source:LootSource;life:number;maxLife:number;pearls:number;powder:number;shield:number;ammo:ChestAmmo;ammoQty:number;speed:number;mine:number};

type Range=readonly [number,number];
type LootTable={gildedChance:number;pearls:Range;powder:Range;shield:Range;life:number};
export const LOOT_TABLES:Record<LootSource,LootTable>={
  drift:{gildedChance:.06,pearls:[2,3],powder:[3,6],shield:[3,6],life:Infinity}
};
export const CHEST_PICKUP_RADIUS=46;
export const CHEST_CLICK_RADIUS=32;
export const DRIFT_RESPAWN_SECONDS=22;


// Sandık ödülü şansa bağlı, tek ödül (pırıltı gibi): %50 inci · %15 barut · %15 kalkan · %15 özel gülle · %4 hız iksiri · %1 mayın.
// Yaldızlı sandıkta miktarlar 2 katıdır.
export function createChest(source:LootSource,x:number,y:number,gildedBonus=0,tier=1,rand:()=>number=Math.random):LootChest{
  const table=LOOT_TABLES[source],gilded=rand()<table.gildedChance+gildedBonus,k=gilded?2:1,r=([a,b]:Range)=>a+Math.floor(rand()*(b-a+1)),roll=rand();
  const c:LootChest={x,y,source,kind:gilded?'gilded':'wood',life:table.life,maxLife:table.life,pearls:0,powder:0,shield:0,ammo:CHEST_AMMO[Math.floor(rand()*CHEST_AMMO.length)],ammoQty:0,speed:0,mine:0};
  if(roll<.5)c.pearls=r(table.pearls)*k;
  else if(roll<.65)c.powder=r(table.powder)*k;
  else if(roll<.8)c.shield=r(table.shield)*k;
  else if(roll<.95)c.ammoQty=(50+20*Math.max(1,Math.min(8,tier)))*k;
  else if(roll<.99)c.speed=2*k;
  else c.mine=k;
  return c;
}

const AMMO_NAMES:Record<ChestAmmo,string>={fire:'Ateş Güllesi',explosive:'Patlayıcı Gülle',breaker:'Kule Kırıcı',leech:'Can Emici'};
export function chestRewardText(c:LootChest){
  return[c.pearls?`+${c.pearls} İnci`:'',c.powder?`+${c.powder} Barut`:'',c.shield?`+${c.shield} Kalkan`:'',c.ammoQty?`+${c.ammoQty} ${AMMO_NAMES[c.ammo]}`:'',c.speed?`+${c.speed} Hız İksiri`:'',c.mine?`+${c.mine} Mayın`:''].filter(Boolean).join('   ');
}
