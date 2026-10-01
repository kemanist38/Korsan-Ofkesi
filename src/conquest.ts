// Filo adası sahipliği. Filo adası durumu ayrı anahtarda saklanır.
import type {MapKey} from './campaign';


export type FleetOwner='npc'|'player';
const STORAGE='yedi-deniz-fleet-v1';
// Sığınak Koyu'nun filo adası başlangıçta oyuncunundur.
export function loadFleetOwners():Partial<Record<MapKey,FleetOwner>>{
  try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'null');if(raw&&typeof raw==='object')return{'1/1':'player',...raw};}catch{}
  return{'1/1':'player'};
}
export function saveFleetOwners(o:Partial<Record<MapKey,FleetOwner>>){try{localStorage.setItem(STORAGE,JSON.stringify(o));}catch{}}
// Yıkılan kule kaidesi 1 saat boyunca yeniden kurulamaz; rakip filonun kuleleri de o süre dolmadan geri gelmez.
// Ada el değiştirince bu bekleme kalkar (clearRuins): ele geçiren filo kulelerini hemen diker.
// (Çok oyunculu modda adayı, son kuleye son atışı yapan filo alacak.)
export const TOWER_REBUILD_MS=60*60*1000;
const RUINS='yedi-deniz-tower-ruins-v1';
export type TowerRuins=Partial<Record<MapKey,Record<number,number>>>;
export function loadRuins():TowerRuins{try{const r=JSON.parse(localStorage.getItem(RUINS)||'{}');return r&&typeof r==='object'?r:{};}catch{return{};}}
export function saveRuins(r:TowerRuins){try{localStorage.setItem(RUINS,JSON.stringify(r));}catch{}}
// Kalan bekleme süresi (ms); 0 ise kaideye kule dikilebilir
export const ruinLeft=(r:TowerRuins,key:MapKey,slot:number,now=Date.now())=>Math.max(0,(r[key]?.[slot]??-Infinity)+TOWER_REBUILD_MS-now);
export function markRuin(r:TowerRuins,key:MapKey,slot:number,now=Date.now()){(r[key]??={})[slot]=now;saveRuins(r);}
export const ruinLabel=(ms:number)=>ms>=3_600_000?`${Math.floor(ms/3_600_000)} sa ${Math.ceil(ms%3_600_000/60_000)} dk`:`${Math.max(1,Math.ceil(ms/60_000))} dk`;
// Ada ele geçirilince yıkık kaideler temizlenir: yeni sahibi kulelerin hepsini hemen dikebilir
export function clearRuins(r:TowerRuins,key:MapKey){delete r[key];saveRuins(r);}
