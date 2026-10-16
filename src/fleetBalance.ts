// Filo adaları her denizde tam gelişmiş (8. seviye) gemi grubu hedefidir; kule vuruşu 8. seviye can ölçeğindedir. Kule canı: 5 güçlü gemi kule kırıcıyla ~1 dakikada yıkar.
// NPC ve etkinlik kuşatması ölçeklerinden bağımsızdır; düşük denizlerde de solo hedef değildir.
export const FLEET_ASSAULT_SIZE=5;
// Oyuncu canı: seviye tabanı + gövde geliştirmesi başına 25.000. Aynı seviyedeki rakip patlayıcı gülleyle ~15 salvoda (~20 sn) batırır.
// Eski model (75.000 + 2.500/seviye + 2.500/gövde) vuruş gücüne göre çok düşüktü (4. seviyeden sonra 2 salvo).
export const PLAYER_LEVEL_HP=[0,54_000,108_000,228_000,540_000,690_000,780_000,930_000,1_050_000],HULL_HP=15_000;
export const playerBaseHp=(level:number,hull:number)=>PLAYER_LEVEL_HP[Math.max(1,Math.min(8,Math.round(level)))]+hull*HULL_HP;
// Düşman vuruşları canla aynı oranda büyür (her seviyenin tipik gövde geliştirmesine göre): yaratık savaşları eskisi gibi kalır
const REF_HULL=[0,0,1,2,4,6,8,10,10];
export const damageScale=(tier:number)=>{const t=Math.max(1,Math.min(8,Math.round(tier)));return playerBaseHp(t,REF_HULL[t])/(75_000+(t-1)*2_500+REF_HULL[t]*2_500);};
export function fleetTowerStats(tier:number){
  const step=Math.max(0,Math.min(8,tier)-2);
  return {hp:Math.round(37_800_000*(1+.025*step)),damage:Math.round(17_600*(1+.015*step)*damageScale(8)),
    reload:3,range:460,ownDamage:Math.round(117_300*(1+.015*step))};
}
// Yüksek canla eski yüzde onarım kullanılmaz: %0,4/sn grup hasarını gereksiz yere yutardı.
// Filo kuleleri kendiliğinden onarılmaz: yalnızca ada sahibi filonun şifa güllesiyle dolar.
export const fleetTowerRegen=(_maxHp:number,_inCombat:boolean)=>0;
