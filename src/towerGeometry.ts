import type {TowerType} from './guild';

// Single fleet tower art (sprites.ts TOWER_ART): 115.6 × 193.9 world units, anchored on the foundation's base centre.
// Keep picking and firing aligned with the rendered tower, not its ground point.
type Point={x:number;y:number};
export function towerContains(point:Point,tower:Point,built=true){
  const x=point.x-tower.x,y=point.y-tower.y;
  return built?Math.abs(x)<=56&&y>=-150&&y<=25:Math.abs(x)<=55&&y>=-75&&y<=20;
}
export function towerMuzzle(tower:Point,_type:TowerType='cannon'):Point{
  // Namlu ağzı: görselde (486,471) px
  return{x:tower.x+36,y:tower.y-76};
}
