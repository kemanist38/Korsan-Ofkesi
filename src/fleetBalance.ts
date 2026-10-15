// Filo adaları tam gelişmiş test gemileri için grup hedefidir (en az 5 gemi). Kule canı: 5 güçlü gemi kule kırıcıyla ~1 dakikada yıkar.
// NPC ve etkinlik kuşatması ölçeklerinden bağımsızdır; düşük denizlerde de solo hedef değildir.
export const FLEET_ASSAULT_SIZE=5;
export function fleetTowerStats(tier:number){
  const step=Math.max(0,Math.min(8,tier)-2);
  return {hp:Math.round(37_800_000*(1+.025*step)),damage:Math.round(17_600*(1+.015*step)),
    reload:3,range:460,ownDamage:Math.round(117_300*(1+.015*step))};
}
// Yüksek canla eski yüzde onarım kullanılmaz: %0,4/sn grup hasarını gereksiz yere yutardı.
// Filo kuleleri kendiliğinden onarılmaz: yalnızca ada sahibi filonun şifa güllesiyle dolar.
export const fleetTowerRegen=(_maxHp:number,_inCombat:boolean)=>0;
