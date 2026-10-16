// Giriş yapan hesabın bilgisi: boot.ts doldurur, oyun (main.ts) okur. Giriş yoksa (yerel geliştirme) alanlar boş kalır.
export type EconSnapshot={state:Record<string,number>;pearls:number};
export type EconBatch={items:Record<string,{v:number;g:number;s:number}>;pearlG:number;pearlS:number;sent:Record<string,number>;pearlSent:number};
export type Account={uid:string;playerNo:number;email:string};
export const session:{account:Account|null;rename:((nick:string)=>Promise<string|null>)|null;logout:(()=>Promise<void>)|null;flush:(()=>Promise<void>)|null;
  // İnci cüzdanı sunucuda: sunucuya eklenen inci (kupon vb.) bilinen bakiyeye eklenir; eşitlemede düzeltme oyuna bildirilir
  pearlServerAdd:((n:number)=>void)|null;onPearlFix:((delta:number)=>void)|null;pearlSyncOff:boolean;isAdmin:boolean;
  // Sunucu ekonomisi: girişteki değerler, eşitleme için toplanan kazanç/harcama ve sunucunun kabul ettiği değerlerin uygulanması
  econStart?:EconSnapshot|null;econCollect?:(()=>EconBatch)|null;econApply?:((b:EconBatch,state:Record<string,number>,pearls:number)=>void)|null;econRestore?:((b:EconBatch)=>void)|null}={account:null,rename:null,logout:null,flush:null,pearlServerAdd:null,onPearlFix:null,pearlSyncOff:false,isAdmin:false};
