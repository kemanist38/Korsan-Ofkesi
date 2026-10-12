// Cosmetic overrides are independent from the equipped hull and its combat statistics.
export const PIRATE_RAGE_DESIGN={id:'pirate-rage',name:'Pirate Rage',
  sprite:'/assets/special-pirate-rage-iso-v2.webp',card:'/assets/special-pirate-rage-card-v2.webp'} as const;
// 3D modelden çıkarılmış 16 yönlü özel tasarım (deneme): yan yana 16 kare, kare k = pruva ekranda sağdan saat yönünde (k-8)·22,5°
export const INFERNO_DESIGN={id:'inferno',name:'Cehennem Kalyonu',
  dir16:'/assets/special-inferno-dir16-v1.webp',card:'/assets/special-inferno-card-v1.webp'} as const;
export type SpecialDesignId=typeof PIRATE_RAGE_DESIGN.id|typeof INFERNO_DESIGN.id;
const STORAGE='pirate-rage-special-design-v1';
export function loadSpecialDesign():SpecialDesignId|null{
  try{const v=localStorage.getItem(STORAGE);return v===PIRATE_RAGE_DESIGN.id||v===INFERNO_DESIGN.id?v:null;}catch{return null;}
}
export function saveSpecialDesign(id:SpecialDesignId|null){
  try{if(id)localStorage.setItem(STORAGE,id);else localStorage.removeItem(STORAGE);}catch{}
}
// Pirate Rage tasarımı Açılış Festivali'nin son ödülüdür; kazanılmadan seçilemez.
const OWNED='pirate-rage-special-owned-v1';
export function loadDesignOwned(){try{return localStorage.getItem(OWNED)==='1';}catch{return false;}}
export function saveDesignOwned(){try{localStorage.setItem(OWNED,'1');}catch{}}
