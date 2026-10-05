// Filo adaları tam gelişmiş test gemileri için grup hedefidir (en az 5 gemi).
// NPC ve etkinlik kuşatması ölçeklerinden bağımsızdır; düşük denizlerde de solo hedef değildir.
export const FLEET_ASSAULT_SIZE=5;
export function fleetTowerStats(tier:number){
  const step=Math.max(0,Math.min(8,tier)-2);
  return {hp:Math.round(18_000_000*(1+.025*step)),damage:Math.round(85_000*(1+.015*step)),
    reload:3,range:460,ownDamage:Math.round(170_000*(1+.015*step))};
}
// Yüksek canla eski yüzde onarım kullanılmaz: %0,4/sn grup hasarını gereksiz yere yutardı.
export const fleetTowerRegen=(maxHp:number,inCombat:boolean)=>maxHp*(inCombat?.0005:.05);
