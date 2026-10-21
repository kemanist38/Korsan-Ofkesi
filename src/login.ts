// Ortak giriş: kullanıcı adı (ya da e-posta) + şifre. Ana sayfadaki panel ve oyunun giriş ekranı aynı kodu kullanır.
import type {SupabaseClient,User} from '@supabase/supabase-js';
import {resetRedirect} from './native';
const REMEMBER='yedi-deniz-remember',LIVE='yedi-deniz-live';
const trErr=(m:string)=>/Invalid login/i.test(m)?'Kullanıcı adı veya şifre hatalı':/rate limit|too many/i.test(m)?'Çok fazla deneme, biraz bekle':/fetch|network/i.test(m)?'Sunucuya bağlanılamadı, internetini kontrol et':m;
export async function loginWithName(sb:SupabaseClient,name:string,pass:string):Promise<{user?:User;error?:string}>{
  name=name.trim();if(!name||!pass)return{error:'Kullanıcı adı ve şifreni yaz'};let email=name;
  if(!name.includes('@')){const r=await sb.rpc('login_email',{p_nick:name,p_pass:pass});
    if(r.error)return{error:r.error.message.replace(/^.*?: /,'')||'Giriş yapılamadı'};if(!r.data)return{error:'Kullanıcı adı veya şifre hatalı'};email=String(r.data);}
  const {data,error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return{error:trErr(error.message)};return{user:data.user};
}
// "Beni hatırla" kapalıysa oturum yalnızca tarayıcı açıkken sürer
export function setRemember(on:boolean){try{localStorage.setItem(REMEMBER,on?'1':'0');sessionStorage.setItem(LIVE,'1');}catch{}}
export async function enforceRemember(sb:SupabaseClient){try{if(localStorage.getItem(REMEMBER)==='0'&&!sessionStorage.getItem(LIVE)){await sb.auth.signOut();return true;}sessionStorage.setItem(LIVE,'1');}catch{}return false;}
// Şifre sıfırlama: e-postaya yeni şifre belirleme bağlantısı gider (şifrenin kendisi gönderilmez)
export async function sendReset(sb:SupabaseClient,email:string){const {error}=await sb.auth.resetPasswordForEmail(email.trim(),{redirectTo:resetRedirect()});return error?trErr(error.message):null;}

// Kayıtlar: kapalı test döneminde false. Açılış günü true yapılır (Supabase'de yeni kayıtlar da açılmalı).
export const SIGNUPS_OPEN=false;
