import type {TowerType} from './guild';

// Slender square fleet tower: 65 × 158 world units, anchored at the bottom of its foundation.
type Point={x:number;y:number};
export function towerContains(point:Point,tower:Point,built=true){
  const x=point.x-tower.x,y=point.y-tower.y;
  return built?Math.abs(x)<=32&&y>=-154&&y<=3:Math.abs(x)<=30&&y>=-44&&y<=5;
}
export function towerMuzzle(tower:Point,_type:TowerType='cannon'):Point{
  // Muzzle in cropped art: (130, 545) / (590, 1430), pointing down-left.
  return{x:tower.x-18.2,y:tower.y-95.8};
}
