import type {TowerType} from './guild';

// Single fleet tower art (sprites.ts TOWER_ART): 92.5 × 174.5 world units (80% width, 90% height), anchored on the foundation's base centre.
// Keep picking and firing aligned with the rendered tower, not its ground point.
type Point={x:number;y:number};
export function towerContains(point:Point,tower:Point,built=true){
  const x=point.x-tower.x,y=point.y-tower.y;
  return built?Math.abs(x)<=45&&y>=-135&&y<=22:Math.abs(x)<=44&&y>=-60&&y<=16;
}
export function towerMuzzle(tower:Point,_type:TowerType='cannon'):Point{
  // Namlu ağzı: görselde (486,471) px; kule %80 genişlik, %90 boyda çizilir
  return{x:tower.x+29,y:tower.y-68};
}
