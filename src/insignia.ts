// Güverte işareti: kaptan adının altında süslü işaret. 5 kademe; batırılan rakip oyuncu sayısı arttıkça zenginleşir.
// Görsel public/assets/deck-insignia-v1.webp: 5 satır × 512 × 176.
export const INSIGNIA_SHEET='/assets/deck-insignia-v1.webp',INSIGNIA_W=512,INSIGNIA_H=176;
export const INSIGNIA_TIERS=[0,100,500,2_000,10_000];
export const insigniaTier=(sinks:number)=>{let t=0;while(t+1<INSIGNIA_TIERS.length&&sinks>=INSIGNIA_TIERS[t+1])t++;return t;};
const STORAGE='yedi-deniz-rival-sinks-v1';
export function loadRivalSinks(){try{const n=Number(localStorage.getItem(STORAGE));return Number.isFinite(n)&&n>0?Math.floor(n):0;}catch{return 0;}}
export function saveRivalSinks(n:number){try{localStorage.setItem(STORAGE,String(n));}catch{}}
