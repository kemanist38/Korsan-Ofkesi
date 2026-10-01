import type {TowerType} from './guild';

// Single fleet tower art (sprites.ts TOWER_ART): 90 world units, base centre on the wall pad.
// Keep picking and firing aligned with the rendered tower, not its ground point.
type Point={x:number;y:number};
export function towerContains(point:Point,tower:Point,built=true){
  const x=point.x-tower.x,y=point.y-tower.y;
  return built?Math.abs(x)<=36&&y>=-42&&y<=14:Math.abs(x)<=46&&Math.abs(y)<=28;
}
export function towerMuzzle(tower:Point,_type:TowerType='cannon'):Point{
  // Namlu ağzı: görselde (395,190) px
  return{x:tower.x+24,y:tower.y-26};
}
