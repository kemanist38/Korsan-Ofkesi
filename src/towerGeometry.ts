import type {TowerType} from './guild';

// Single fleet tower art (sprites.ts TOWER_ART): 92 world units, base centre on the wall pad.
// Keep picking and firing aligned with the rendered tower, not its ground point.
type Point={x:number;y:number};
export function towerContains(point:Point,tower:Point,built=true){
  const x=point.x-tower.x,y=point.y-tower.y;
  return built?Math.abs(x)<=30&&y>=-41&&y<=11:Math.abs(x)<=46&&Math.abs(y)<=28;
}
export function towerMuzzle(tower:Point,_type:TowerType='cannon'):Point{
  // Namlu ağzı: görselde (375,295) px
  return{x:tower.x+21,y:tower.y-9};
}
