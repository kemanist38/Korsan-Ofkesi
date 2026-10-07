// Seyir defteri: oyunda olanların kaydı (batırmalar, kazançlar, alışverişler). Üstteki küçük bildirimlerin hepsi buraya da
// yazılır. Son 300 kayıt tutulur; sunucu gelince hesapla birlikte saklanacak.
export type LogKind='battle'|'gain'|'shop'|'other';
export type LogEntry={t:number;kind:LogKind;text:string;xp?:number;gold?:number;sp?:number;sink?:boolean};
export const LOG_KINDS:{id:LogKind|'all';name:string}[]=[{id:'all',name:'Tümü'},{id:'battle',name:'Savaş'},{id:'gain',name:'Kazanç'},{id:'shop',name:'Alışveriş'},{id:'other',name:'Diğer'}];
export const LOG_MAX=300;
const STORAGE='yedi-deniz-logbook-v1';
export function loadLog():LogEntry[]{try{const r=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(r)?r.filter(e=>e&&typeof e.text==='string'&&typeof e.t==='number').slice(-LOG_MAX):[];}catch{return[];}}
export function saveLog(log:LogEntry[]){try{localStorage.setItem(STORAGE,JSON.stringify(log.slice(-LOG_MAX)));}catch{}}
export function addLog(log:LogEntry[],e:LogEntry){log.push(e);if(log.length>LOG_MAX)log.splice(0,log.length-LOG_MAX);return log;}
// Bugünün özeti: batırma sayısı ve kazanılan TP / altın / SP
export function daySummary(log:LogEntry[],now=new Date()){const d0=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  const s={sinks:0,xp:0,gold:0,sp:0};for(const e of log)if(e.t>=d0){if(e.sink)s.sinks++;s.xp+=e.xp??0;s.gold+=e.gold??0;s.sp+=e.sp??0;}return s;}
