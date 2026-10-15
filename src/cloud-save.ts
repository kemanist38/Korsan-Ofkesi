// Bulut kayıt: oyunun localStorage'daki hesap anahtarları tek bir JSON olarak Supabase 'saves' tablosuna yazılır.
// Cihaza özgü ayarlar (pencere yerleri, kısayol çubuğu, sohbet, ağ kimliği) senkronlanmaz.
const PREFIX='yedi-deniz-';
export const OWNER_KEY='yedi-deniz-owner';
const LOCAL_ONLY=['yedi-deniz-dock-pos','yedi-deniz-frame-links','yedi-deniz-net-id','yedi-deniz-chat-v1','yedi-deniz-chat-pos',OWNER_KEY];
export const isSyncedKey=(k:string)=>k.startsWith(PREFIX)&&!LOCAL_ONLY.includes(k)&&!k.startsWith('yedi-deniz-bar-');
export type SaveData=Record<string,string>;
export function collectSave(st:Storage=localStorage):SaveData{const out:SaveData={};for(let i=0;i<st.length;i++){const k=st.key(i);if(k&&isSyncedKey(k)){const v=st.getItem(k);if(v!==null)out[k]=v;}}return out;}
// Buluttaki kaydı yerele uygular: önce yereldeki senkron anahtarlar silinir, sonra buluttakiler yazılır
export function applySave(data:SaveData,st:Storage=localStorage){const keys:string[]=[];for(let i=0;i<st.length;i++){const k=st.key(i);if(k&&isSyncedKey(k))keys.push(k);}
  for(const k of keys)st.removeItem(k);for(const [k,v] of Object.entries(data))if(isSyncedKey(k)&&typeof v==='string')st.setItem(k,v);}
// Bu tarayıcıda başka bir hesap oynadıysa onun yerel verisi yeni hesaba karışmasın
export function claimOwner(uid:string,st:Storage=localStorage){const prev=st.getItem(OWNER_KEY);if(prev&&prev!==uid)applySave({},st);st.setItem(OWNER_KEY,uid);return prev;}
