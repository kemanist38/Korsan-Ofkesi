// Grup: en çok 4 kaptan. Aynı denizdeki grup üyesi sayısına göre ek TP (2 kişi %15, 3 kişi %10, 4 kişi %5);
// kalabalık grup daha az bonus alır. Grup içinde görev sayacı yalnız son vuruşu yapana işler (server/game-server.mjs).
export const GROUP_MAX=4,FRIEND_MAX=50;
export const groupMult=(n:number)=>n>=4?1.05:n===3?1.10:n===2?1.15:1;
export type FriendRow={id:string;nick:string;ok:boolean;in:boolean;on:boolean;at:string};
export type GroupState={id:string|null;lead?:string;members?:{uid:string;nick:string;at:string}[];bonus?:number;note?:string};
