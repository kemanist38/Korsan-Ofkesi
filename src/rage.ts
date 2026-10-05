// Korsan Öfkesi: her geminin ortak öfke yeteneği (elit yeteneklerin yerine). Öfke barı hasar alınca ve gemi/canavar
// batırınca dolar; dolunca "KORSAN ÖFKESİ" düğmesine basılır: sonraki 2 salvo %25 fazla hasar verir, gemi %15 hızlanır
// ve gemiyi alevler sarar. Öfke 2 salvo atılınca ya da en geç 10 sn sonra söner; bar sıfırdan dolmaya başlar.
export const RAGE_MAX=100,RAGE_DAMAGE=1.25,RAGE_SPEED=1.15,RAGE_SALVOS=2,RAGE_SECONDS=10;
export const RAGE_PER_KILL=12,RAGE_PER_MONSTER=20,RAGE_PER_TOWER=15;
export type Rage={meter:number;salvos:number;time:number};
export const newRage=():Rage=>({meter:0,salvos:0,time:0});
export const rageActive=(r:Rage)=>r.salvos>0&&r.time>0;
export const rageReady=(r:Rage)=>!rageActive(r)&&r.meter>=RAGE_MAX;
// Alınan hasar: canın %1'i kadar hasar barı 1,2 doldurur (canın ~%80'ini kaybeden gemi öfkeye ulaşır)
export function gainRage(r:Rage,amount:number){if(rageActive(r))return r;r.meter=Math.min(RAGE_MAX,r.meter+Math.max(0,amount));return r;}
export const rageFromHit=(taken:number,maxHp:number)=>maxHp>0?taken/maxHp*120:0;
export function startRage(r:Rage){if(!rageReady(r))return false;r.meter=0;r.salvos=RAGE_SALVOS;r.time=RAGE_SECONDS;return true;}
// Salvo atılırken çağrılır: öfke açıksa hasar çarpanını verir ve bir hak düşer
export function rageSalvo(r:Rage){if(!rageActive(r))return 1;r.salvos--;if(r.salvos<=0)r.time=0;return RAGE_DAMAGE;}
export function tickRage(r:Rage,dt:number){if(r.time>0){r.time=Math.max(0,r.time-dt);if(r.time<=0)r.salvos=0;}return r;}
