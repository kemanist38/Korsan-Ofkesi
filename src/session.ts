// Giriş yapan hesabın bilgisi: boot.ts doldurur, oyun (main.ts) okur. Giriş yoksa (yerel geliştirme) alanlar boş kalır.
export type Account={uid:string;playerNo:number;email:string};
export const session:{account:Account|null;rename:((nick:string)=>Promise<string|null>)|null;logout:(()=>Promise<void>)|null;flush:(()=>Promise<void>)|null}={account:null,rename:null,logout:null,flush:null};
