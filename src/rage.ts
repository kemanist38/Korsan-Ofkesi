// Korsan Öfkesi: her geminin ortak öfke yeteneği (elit yeteneklerin yerine). Sık basılan bir şey değildir: bar yalnızca
// rakip oyuncu batırınca (3 oyuncu = dolu bar) ve boss batırınca (2 boss = dolu bar) dolar. Dolunca "KORSAN ÖFKESİ"
// düğmesine basılır: sonraki 2 salvo %25 fazla hasar verir, gemi %15 hızlanır ve gemiyi alevler sarar.
// Öfke 2 salvo atılınca ya da en geç 5 sn sonra söner; bar sıfırdan dolmaya başlar.
export const RAGE_MAX=100,RAGE_DAMAGE=1.25,RAGE_SPEED=1.15,RAGE_SALVOS=2,RAGE_SECONDS=5;
export const RAGE_PER_RIVAL=34,RAGE_PER_BOSS=50;
export type Rage={meter:number;salvos:number;time:number};
export const newRage=():Rage=>({meter:0,salvos:0,time:0});
export const rageActive=(r:Rage)=>r.salvos>0&&r.time>0;
export const rageReady=(r:Rage)=>!rageActive(r)&&r.meter>=RAGE_MAX;
export function gainRage(r:Rage,amount:number){if(rageActive(r))return r;r.meter=Math.min(RAGE_MAX,r.meter+Math.max(0,amount));return r;}
export function startRage(r:Rage){if(!rageReady(r))return false;r.meter=0;r.salvos=RAGE_SALVOS;r.time=RAGE_SECONDS;return true;}
// Salvo atılırken çağrılır: öfke açıksa hasar çarpanını verir ve bir hak düşer
export function rageSalvo(r:Rage){if(!rageActive(r))return 1;r.salvos--;if(r.salvos<=0)r.time=0;return RAGE_DAMAGE;}
export function tickRage(r:Rage,dt:number){if(r.time>0){r.time=Math.max(0,r.time-dt);if(r.time<=0)r.salvos=0;}return r;}
