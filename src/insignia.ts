// Güverte işareti: kaptan adının altında, batırılan rakip oyuncu sayısını gösteren süslü plaka. 5 kademe; kademe
// sayıyla zenginleşir. Görsel public/assets/deck-insignia-v1.webp: 5 satır × 512 × 176, plakanın merkezi PLAQUE_Y'de.
export const INSIGNIA_SHEET='/assets/deck-insignia-v1.webp',INSIGNIA_W=512,INSIGNIA_H=176;
export const INSIGNIA_TIERS=[0,100,500,2_000,10_000];
// Her kademe görselinde plakanın dikey merkezi ve yüksekliği (hücre yüksekliğine oranla)
export const PLAQUE_Y=[.577,.526,.577,.547,.472],PLAQUE_H=[.292,.297,.292,.284,.185];
export const insigniaTier=(sinks:number)=>{let t=0;while(t+1<INSIGNIA_TIERS.length&&sinks>=INSIGNIA_TIERS[t+1])t++;return t;};
const STORAGE='yedi-deniz-rival-sinks-v1';
export function loadRivalSinks(){try{const n=Number(localStorage.getItem(STORAGE));return Number.isFinite(n)&&n>0?Math.floor(n):0;}catch{return 0;}}
export function saveRivalSinks(n:number){try{localStorage.setItem(STORAGE,String(n));}catch{}}
