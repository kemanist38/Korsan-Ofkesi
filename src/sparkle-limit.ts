// Günlük pırıltı toplama sınırı: ilk toplanan pırıltıdan itibaren 24 saat içinde en fazla 500 pırıltı.
// 24 saat dolunca sayaç sıfırlanır. Sınırdayken pırıltı denizde kalır, toplanmaz.
export const SPARKLE_DAILY_LIMIT=500,SPARKLE_WINDOW_MS=24*3_600_000;
export type SparkleLimit={start:number;count:number};
const KEY='yedi-deniz-sparkle-limit-v1';
export function loadSparkleLimit():SparkleLimit{try{const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r&&typeof r.start==='number'&&typeof r.count==='number')return r;}catch{}return{start:0,count:0};}
export function saveSparkleLimit(s:SparkleLimit){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
// Pencere süresi dolduysa sıfırlar
export function refreshLimit(s:SparkleLimit,now:number):SparkleLimit{return now-s.start>=SPARKLE_WINDOW_MS?{start:now,count:0}:s;}
export const canCollect=(s:SparkleLimit,now:number)=>refreshLimit(s,now).count<SPARKLE_DAILY_LIMIT;
export function collect(s:SparkleLimit,now:number):SparkleLimit{const r=refreshLimit(s,now);return{start:r.count===0?now:r.start,count:r.count+1};}
export const resetsIn=(s:SparkleLimit,now:number)=>Math.max(0,s.start+SPARKLE_WINDOW_MS-now);
