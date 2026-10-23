// Filo Savaşı (Cumartesi etkinliği): gün boyunca filoların batırdığı rakip kaptanlar toplanır (aynı rakip günde en çok 3 kez sayılır).
// Gün bitince en çok batıran filo kazanır; ödül yalnız o filonun bu gün en az FW_MIN_SINKS rakip batırmış üyelerine verilir. Her şeyi sunucu yürütür.
export const FW_MIN_SINKS=5,FW_PRIZE={pearls:150,gold:100_000};
export type FleetWarInfo={on:boolean;top:[string,number][];fleet:number;mine:number;fleetName:string|null;last:{name:string;n:number}|null};
// Kazanan: toplam batırma en çok olan filo; eşitlikte önce o sayıya ulaşan
export function fwWinner(guilds:Record<string,{name:string;n:number;at:number}>){let best:string|null=null;
  for(const [g,v] of Object.entries(guilds))if(v.n>0&&(!best||v.n>guilds[best].n||(v.n===guilds[best].n&&v.at<guilds[best].at)))best=g;return best;}
// Ödül alacaklar: kazanan filonun en az FW_MIN_SINKS batırma yapmış üyeleri
export const fwEligible=(members:Record<string,{g:string;n:number}>,winner:string|null)=>winner?Object.entries(members).filter(([,m])=>m.g===winner&&m.n>=FW_MIN_SINKS).map(([u])=>u):[];
