// Mağaza uygulaması (Capacitor, iOS / Android): web sitesinde de aynı kod çalışır; burada yalnızca uygulamaya özel farklar var.
// Uygulamada oyun pakete gömülüdür (https://localhost), bu yüzden e-posta bağlantıları ve dış sayfalar gerçek site adresini kullanır.
import {Capacitor} from '@capacitor/core';
export const SITE_URL='https://www.piraterage.com';
export const isNativeApp=()=>Capacitor.isNativePlatform();
export const nativePlatform=()=>Capacitor.getPlatform() as 'ios'|'android'|'web';
// Şifre sıfırlama ve benzeri e-posta bağlantılarının döneceği adres
export const siteOrigin=()=>isNativeApp()?SITE_URL:location.origin;
// Dış bağlantı: uygulamada uygulama içi tarayıcıda, sitede yeni sekmede
export async function openExternal(url:string){if(isNativeApp()){const {Browser}=await import('@capacitor/browser');await Browser.open({url});}else window.open(url,'_blank','noopener');}
