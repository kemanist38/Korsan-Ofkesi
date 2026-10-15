// Giriş yapan hesabın bilgisi: boot.ts doldurur, oyun (main.ts) okur. Giriş yoksa (yerel geliştirme) alanlar boş kalır.
export type Account={uid:string;playerNo:number;email:string};
export const session:{account:Account|null;rename:((nick:string)=>Promise<string|null>)|null;logout:(()=>Promise<void>)|null;flush:(()=>Promise<void>)|null;
  // İnci cüzdanı sunucuda: sunucuya eklenen inci (kupon vb.) bilinen bakiyeye eklenir; eşitlemede düzeltme oyuna bildirilir
  pearlServerAdd:((n:number)=>void)|null;onPearlFix:((delta:number)=>void)|null;pearlSyncOff:boolean}={account:null,rename:null,logout:null,flush:null,pearlServerAdd:null,onPearlFix:null,pearlSyncOff:false};
