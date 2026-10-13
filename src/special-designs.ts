// Cosmetic overrides are independent from the equipped hull and its combat statistics.
export const PIRATE_RAGE_DESIGN={id:'pirate-rage',name:'Pirate Rage',
  sprite:'/assets/special-pirate-rage-iso-v2.webp',card:'/assets/special-pirate-rage-card-v2.webp'} as const;
export type SpecialDesignId=typeof PIRATE_RAGE_DESIGN.id;
const STORAGE='pirate-rage-special-design-v1';
export function loadSpecialDesign():SpecialDesignId|null{
  try{return localStorage.getItem(STORAGE)===PIRATE_RAGE_DESIGN.id?PIRATE_RAGE_DESIGN.id:null;}catch{return null;}
}
export function saveSpecialDesign(id:SpecialDesignId|null){
  try{if(id)localStorage.setItem(STORAGE,id);else localStorage.removeItem(STORAGE);}catch{}
}
// Pirate Rage tasarımı Açılış Festivali'nin son ödülüdür; kazanılmadan seçilemez.
const OWNED='pirate-rage-special-owned-v1';
export function loadDesignOwned(){try{return localStorage.getItem(OWNED)==='1';}catch{return false;}}
export function saveDesignOwned(){try{localStorage.setItem(OWNED,'1');}catch{}}
