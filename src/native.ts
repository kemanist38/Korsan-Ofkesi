// Mağaza uygulaması (Capacitor, iOS / Android): web sitesinde de aynı kod çalışır; burada yalnızca uygulamaya özel farklar var.
// Uygulamada oyun pakete gömülüdür (https://localhost), bu yüzden e-posta bağlantıları ve dış sayfalar gerçek site adresini kullanır.
import {Capacitor} from '@capacitor/core';
export const SITE_URL='https://www.piraterage.com';
export const isNativeApp=()=>Capacitor.isNativePlatform();
export const nativePlatform=()=>Capacitor.getPlatform() as 'ios'|'android'|'web';
// Uygulamanın kendi bağlantı şeması: e-postadaki şifre sıfırlama bağlantısı uygulamayı açar (Supabase → Auth → URL Configuration'da izinli olmalı)
export const APP_SCHEME='com.piraterage.korsanofkesi';
export const resetRedirect=()=>isNativeApp()?`${APP_SCHEME}://sifre`:`${location.origin}/oyna/?sifre=yeni`;
// Uygulama bağlantıyla açılınca (açıkken ya da kapalıyken): adres oyuna iletilir
export async function onAppLink(cb:(url:string)=>void){if(!isNativeApp())return;const {App}=await import('@capacitor/app');
  App.addListener('appUrlOpen',e=>cb(e.url));const l=await App.getLaunchUrl();if(l?.url)cb(l.url);}
// Dış bağlantı: uygulamada uygulama içi tarayıcıda, sitede yeni sekmede
export async function openExternal(url:string){if(isNativeApp()){const {Browser}=await import('@capacitor/browser');await Browser.open({url});}else window.open(url,'_blank','noopener');}
