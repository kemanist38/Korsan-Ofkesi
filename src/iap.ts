// Uygulama içi satın alma (App Store / Google Play) — RevenueCat üzerinden. Ödeme mağazada doğrulanır; RevenueCat oyun sunucusuna
// bildirir (server/game-server.mjs /iap/revenuecat) ve inci hesaba yüklenir (supabase/migrations/030_store_app.sql iap_credit).
// Ürün kimlikleri: pearls_<paket> (ör. pearls_crate); App Store Connect ve Google Play Console'da "tüketilebilir" ürün olarak açılır.
// RevenueCat herkese açık SDK anahtarları (gizli değildir): RevenueCat panelinden alınıp buraya yazılır. Boşsa uygulamada satış kapalı kalır.
import {isNativeApp,nativePlatform} from './native';
import {PEARL_PACKS} from './pearlShop';
export const RC_KEYS:{ios:string;android:string}={ios:'',android:''};
export const iapProductId=(pack:string)=>`pearls_${pack}`;
type RC=typeof import('@revenuecat/purchases-capacitor');
let rc:RC|null=null,ready=false;const products=new Map<string,{priceString:string;raw:unknown}>();
const key=()=>{const p=nativePlatform();return p==='ios'?RC_KEYS.ios:p==='android'?RC_KEYS.android:'';};
export const iapAvailable=()=>isNativeApp()&&!!key();
// Oyuncu girişinden sonra: RevenueCat'e oyuncunun hesap kimliğiyle bağlanır (ödeme bu hesaba yazılır) ve mağaza fiyatları çekilir
export async function iapInit(uid:string){if(!iapAvailable()||ready)return ready;try{rc=await import('@revenuecat/purchases-capacitor');
  await rc.Purchases.configure({apiKey:key(),appUserID:uid});ready=true;
  const {products:list}=await rc.Purchases.getProducts({productIdentifiers:PEARL_PACKS.map(p=>iapProductId(p.id)),type:rc.PRODUCT_CATEGORY.NON_SUBSCRIPTION});
  for(const p of list)products.set(p.identifier,{priceString:p.priceString,raw:p});}catch(e){console.warn('IAP',e);}return ready;}
export const iapPrice=(pack:string)=>products.get(iapProductId(pack))?.priceString??null;
export async function iapBuy(pack:string):Promise<'ok'|'cancel'|'error'>{const p=products.get(iapProductId(pack));if(!rc||!p)return'error';
  try{await rc.Purchases.purchaseStoreProduct({product:p.raw as never});return'ok';}catch(e){const err=e as {userCancelled?:boolean;code?:string};return err?.userCancelled||err?.code==='1'?'cancel':'error';}}
