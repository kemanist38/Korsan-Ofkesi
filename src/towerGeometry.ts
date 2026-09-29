import type {TowerType} from './guild';

// Single fleet tower art (sprites.ts TOWER_ART): 160 world units, ground ellipse on the foundation.
// Keep picking and firing aligned with the rendered tower, not its ground point.
type Point={x:number;y:number};
export function towerContains(point:Point,tower:Point,built=true){
  const x=point.x-tower.x,y=point.y-tower.y;
  return built?Math.abs(x)<=62&&y>=-107&&y<=47:Math.abs(x)<=46&&Math.abs(y)<=28;
}
export function towerMuzzle(tower:Point,_type:TowerType='cannon'):Point{
  // Namlu ağzı: görselde (360,90) px
  return{x:tower.x+32,y:tower.y-80};
}
