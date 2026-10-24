// Batırılan rakip oyuncu sayısının yerel kopyası (asıl sayı sunucudadır, s.sk ile gelir)
const STORAGE='yedi-deniz-rival-sinks-v1';
export function loadRivalSinks(){try{const n=Number(localStorage.getItem(STORAGE));return Number.isFinite(n)&&n>0?Math.floor(n):0;}catch{return 0;}}
export function saveRivalSinks(n:number){try{localStorage.setItem(STORAGE,String(n));}catch{}}
