// Ana sayfa giriş paneli: kullanıcı adı + şifre ile girer, oyuna (/oyna/) yönlendirir. Oturum açıksa doğrudan "Oyna" gösterilir.
import {supa} from './supabase';
import {loginWithName,setRemember,enforceRemember,sendReset} from './login';
const $=(id:string)=>document.getElementById(id) as HTMLInputElement;
const form=document.getElementById('siteLogin') as HTMLFormElement|null,msg=(t:string,ok=false)=>{const m=$('lgMsg');m.textContent=t;m.classList.toggle('ok',ok);};
const sb=supa();
if(form&&sb){
  void (async()=>{await enforceRemember(sb);const {data}=await sb.auth.getSession();if(data.session){const go=form.querySelector<HTMLButtonElement>('.lg-go')!;go.textContent='OYUNA DEVAM ET';msg('Zaten giriş yaptın.',true);go.type='button';go.onclick=()=>{location.href='/oyna/';};}})();
  form.onsubmit=async e=>{e.preventDefault();const go=form.querySelector<HTMLButtonElement>('.lg-go')!;go.disabled=true;msg('Giriş yapılıyor…',true);
    setRemember($('lgRemember').checked);const r=await loginWithName(sb,$('lgName').value,$('lgPass').value);go.disabled=false;
    if(r.error){msg(r.error);return;}location.href='/oyna/';};
  document.getElementById('lgForgot')!.onclick=async()=>{const email=prompt('Hesabının e-posta adresini yaz, yeni şifre belirleme bağlantısı gönderelim:')?.trim();if(!email)return;
    const err=await sendReset(sb,email);msg(err??'Bağlantı e-postana gönderildi. Gelen kutunu ve spam klasörünü kontrol et.',!err);};
}
