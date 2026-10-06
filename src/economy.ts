// Permanent setup and ammunition are priced separately. No calendar lock on elite levels.
export const ELITE_ENTRY_PRICE=2500;
export const CANNON_COSTS={cast:{amount:40,currency:'gold'},long:{amount:15,currency:'pearls'},rapid:{amount:30,currency:'pearls'},heavy:{amount:50,currency:'pearls'}} as const;
export const UPGRADE_PRICE_MULTIPLIER=26;
export const ELITE_ECONOMY_VERSION=2;
// All old thresholds scale by the same factor: preserve earned levels and within-level progress.
export const ELITE_THRESHOLD_SCALE=.72;
export function migrateElitePoints(points:number,version?:number){
  const value=Number.isFinite(points)?Math.max(0,points):0;
  return version===ELITE_ECONOMY_VERSION?value:Math.round(value*ELITE_THRESHOLD_SCALE*1000)/1000;
}
