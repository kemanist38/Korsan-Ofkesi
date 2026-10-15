// Hazine avı: denizde sürüklenen sandıklardan hazine haritası parçası düşer. 4 parça birleşince harita, oyuncunun
// açabildiği denizlerden birinde bir koordinat gösterir (ör. "4/1 · 22BK"). Oraya gidip KAZ'a basınca 3 saniyelik kazıdan
// sonra hazine çıkar: altın, inci, özel gülle, kara barut ve kalkan.
import type {MapKey} from './campaign';
export const TREASURE_PARTS=4,PART_CHANCE=.15,DIG_RADIUS=70,DIG_SECONDS=3;
export const TREASURE_ICON='/assets/icon-treasure-map-v3.webp';
export type TreasureSpot={map:MapKey;x:number;y:number;label:string};
export type TreasureState={parts:number;active:TreasureSpot|null;found:number};
const STORAGE='yedi-deniz-treasure-v1';
export function loadTreasure():TreasureState{
  try{const r=JSON.parse(localStorage.getItem(STORAGE)||'null');if(r)return{parts:Math.max(0,r.parts|0),active:r.active??null,found:Math.max(0,r.found|0)};}catch{}
  return{parts:0,active:null,found:0};
}
export function saveTreasure(t:TreasureState){try{localStorage.setItem(STORAGE,JSON.stringify(t));}catch{}}
// Ödül: haritanın hafif NPC altınının 30 katı, 8 + 4×seviye inci; %25 sıradan, %6 nadir, %1,5 destansı donanım
// Hazine: altın, inci, rastgele bir özel gülle, kara barut ve kalkan (deniz seviyesiyle artar)
export const TREASURE_AMMO=['chain','fire','explosive','breaker','leech'] as const;
export function treasureReward(tier:number,lightGold:number,rand:()=>number=Math.random){
  return{gold:Math.round(lightGold*30),pearls:8+4*tier,ammo:TREASURE_AMMO[Math.floor(rand()*TREASURE_AMMO.length)],ammoQty:150+50*tier,powder:20+5*tier,shield:20+5*tier};
}
