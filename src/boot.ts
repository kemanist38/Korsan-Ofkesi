// Oyunun giriş kapısı: önce hesap girişi, sonra buluttaki kayıt yerele indirilir ve oyun (main.ts) yüklenir.
// Yerel geliştirmede (npm run dev) giriş atlanır; ?auth ile açılırsa giriş ekranı yine gösterilir.
import './storageMigration';
import './auth.css';
import {supa} from './supabase';
import {session} from './session';
import {applySave,claimOwner,collectSave} from './cloud-save';
import {nickError,saveProfile,NICK_MAX} from './profile';
import type {SupabaseClient,User} from '@supabase/supabase-js';

const startGame=()=>import('./main');
const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));

function overlay(){let el=document.getElementById('authGate');if(!el){el=document.createElement('div');el.id='authGate';document.body.append(el);}return el;}
function card(title:string,body:string,note=''){const el=overlay();el.innerHTML=`<section class="auth-card"><img src="/assets/logo-pirate-rage-v1.webp" alt="Pirate Rage" draggable="false"/><h2>${title}</h2>${body}<p class="auth-msg" id="authMsg">${note}</p></section>`;return el;}
const msg=(t:string,ok=false)=>{const m=document.getElementById('authMsg');if(m){m.textContent=t;m.classList.toggle('ok',ok);}};
const val=(id:string)=>(document.getElementById(id) as HTMLInputElement).value.trim();
function busy(form:HTMLFormElement,on:boolean){form.querySelectorAll('button,input').forEach(b=>(b as HTMLButtonElement).disabled=on);}
const trErr=(m:string)=>/Invalid login/i.test(m)?'E-posta veya şifre hatalı':/already registered|already been registered/i.test(m)?'Bu e-posta ile zaten bir hesap var':/at least 6|Password should/i.test(m)?'Şifre en az 6 karakter olmalı':/rate limit|too many/i.test(m)?'Çok fazla deneme, biraz bekle':/valid email|invalid.*email/i.test(m)?'Geçerli bir e-posta yaz':/fetch|network/i.test(m)?'Sunucuya bağlanılamadı, internetini kontrol et':m;

function showLogin(sb:SupabaseClient,mode:'login'|'register'='login'){
  const reg=mode==='register';
  card(reg?'YENİ KAPTAN':'GİRİŞ',`<div class="auth-tabs"><button data-mode="login" class="${reg?'':'on'}">GİRİŞ</button><button data-mode="register" class="${reg?'on':''}">KAYIT OL</button></div>
  <form id="authForm"><input id="authEmail" type="email" placeholder="E-posta" autocomplete="email" required/>
  <input id="authPass" type="password" placeholder="Şifre (en az 6 karakter)" autocomplete="${reg?'new-password':'current-password'}" minlength="6" required/>
  ${reg?`<input id="authNick" placeholder="Kaptan adı" maxlength="${NICK_MAX}" autocomplete="off" spellcheck="false" required/>`:''}
  <button type="submit" class="auth-main">${reg?'HESAP OLUŞTUR':'DENİZE AÇIL'}</button></form>
  ${reg?'':'<button class="auth-link" id="authForgot">Şifremi unuttum</button>'}`);
  document.querySelectorAll<HTMLButtonElement>('.auth-tabs button').forEach(b=>b.onclick=()=>showLogin(sb,b.dataset.mode as 'login'|'register'));
  const forgot=document.getElementById('authForgot');if(forgot)forgot.onclick=async()=>{const email=val('authEmail');if(!email){msg('Önce e-posta adresini yaz');return;}
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});msg(error?trErr(error.message):'Şifre sıfırlama bağlantısı e-postana gönderildi',!error);};
  const form=document.getElementById('authForm') as HTMLFormElement;
  form.onsubmit=async e=>{e.preventDefault();const email=val('authEmail'),pass=(document.getElementById('authPass') as HTMLInputElement).value;
    if(reg){const nick=val('authNick'),err=nickError(nick);if(err){msg(err);return;}
      busy(form,true);msg('Ad kontrol ediliyor…',true);
      const {data:taken}=await sb.from('profiles').select('id').ilike('nick',nick.replace(/[_%\\]/g,'\\$&')).maybeSingle();
      if(taken){busy(form,false);msg('Bu kaptan adı alınmış');return;}
      const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{nick}}});busy(form,false);
      if(error){msg(trErr(error.message));return;}
      if(!data.session){card('E-POSTANI ONAYLA',`<p class="auth-info">${esc(email)} adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra buradan giriş yapabilirsin.</p><button class="auth-main" id="authBack">GİRİŞE DÖN</button>`);document.getElementById('authBack')!.onclick=()=>showLogin(sb);return;}
      enter(sb,data.session.user,nick);return;}
    busy(form,true);const {data,error}=await sb.auth.signInWithPassword({email,password:pass});busy(form,false);
    if(error){msg(trErr(error.message));return;}enter(sb,data.user);};
}
function showNewPassword(sb:SupabaseClient){
  card('YENİ ŞİFRE',`<form id="authForm"><input id="authPass" type="password" placeholder="Yeni şifre (en az 6 karakter)" autocomplete="new-password" minlength="6" required/><button type="submit" class="auth-main">ŞİFREYİ KAYDET</button></form>`);
  const form=document.getElementById('authForm') as HTMLFormElement;
  form.onsubmit=async e=>{e.preventDefault();busy(form,true);const {data,error}=await sb.auth.updateUser({password:(document.getElementById('authPass') as HTMLInputElement).value});busy(form,false);
    if(error){msg(trErr(error.message));return;}enter(sb,data.user);};
}
// Profil yoksa (ör. kayıtta ad alınamadıysa) oyuncudan kaptan adı istenir
function askNick(sb:SupabaseClient,user:User):Promise<{player_no:number;nick:string}>{
  return new Promise(resolve=>{card('KAPTAN ADI',`<p class="auth-info">Denizlerde seni tanıyacakları adı seç. Ad benzersiz olmalı.</p><form id="authForm"><input id="authNick" placeholder="Kaptan adı" maxlength="${NICK_MAX}" autocomplete="off" spellcheck="false" required/><button type="submit" class="auth-main">ADI KAYDET</button></form>`);
    const form=document.getElementById('authForm') as HTMLFormElement;
    form.onsubmit=async e=>{e.preventDefault();const nick=val('authNick'),err=nickError(nick);if(err){msg(err);return;}
      busy(form,true);const {data,error}=await sb.from('profiles').insert({id:user.id,nick}).select('player_no,nick').single();busy(form,false);
      if(error){msg(error.code==='23505'?'Bu kaptan adı alınmış':trErr(error.message));return;}resolve(data);};});
}
async function loadProfileRow(sb:SupabaseClient,user:User,nick?:string){
  const {data,error}=await sb.from('profiles').select('player_no,nick').eq('id',user.id).maybeSingle();if(error)throw error;if(data)return data;
  const wanted=nick??(typeof user.user_metadata?.nick==='string'?user.user_metadata.nick:'');
  if(wanted&&!nickError(wanted)){const r=await sb.from('profiles').insert({id:user.id,nick:wanted}).select('player_no,nick').single();if(!r.error)return r.data;}
  return askNick(sb,user);
}
let entered=false;
async function enter(sb:SupabaseClient,user:User,nick?:string){
  if(entered)return;entered=true;
  card('YÜKLENİYOR','<p class="auth-info">Kaptan defterin buluttan getiriliyor…</p>');
  try{
    const prof=await loadProfileRow(sb,user,nick);
    const {data:save,error}=await sb.from('saves').select('data').eq('user_id',user.id).maybeSingle();if(error)throw error;
    claimOwner(user.id);
    if(save?.data&&typeof save.data==='object')applySave(save.data as Record<string,string>);
    saveProfile({nick:prof.nick,changedAt:0,named:true});
    session.account={uid:user.id,playerNo:prof.player_no,email:user.email??''};
    session.rename=async n=>{const {error:e}=await sb.from('profiles').update({nick:n}).eq('id',user.id);return e?(e.code==='23505'?'Bu kaptan adı alınmış':trErr(e.message)):null;};
    let last=JSON.stringify(collectSave());
    const push=async(force=false)=>{const data=collectSave(),s=JSON.stringify(data);if(!force&&s===last)return;
      const {error:e}=await sb.from('saves').upsert({user_id:user.id,data,updated_at:new Date().toISOString()});if(!e)last=s;};
    session.flush=()=>push(true);
    session.logout=async()=>{await push(true).catch(()=>{});await sb.auth.signOut();location.reload();};
    if(!save)await push(true);
    setInterval(()=>{push().catch(()=>{});},30000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')push().catch(()=>{});});
    addEventListener('pagehide',()=>{push().catch(()=>{});});
    overlay().remove();await startGame();
  }catch(e){entered=false;card('BAĞLANTI HATASI',`<p class="auth-info">Hesabın yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.</p><button class="auth-main" id="authRetry">TEKRAR DENE</button>`,esc(String((e as Error)?.message??e)));
    document.getElementById('authRetry')!.onclick=()=>enter(sb,user,nick);}
}
async function boot(){
  if(import.meta.env.DEV&&!new URLSearchParams(location.search).has('auth')){await startGame();return;}
  const sb=supa();if(!sb){card('BAĞLANTI HATASI','<p class="auth-info">Oyun sunucusuna ulaşılamadı. Sayfayı yenile.</p>');return;}
  let recovering=false;
  sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){recovering=true;showNewPassword(sb);}});
  const {data}=await sb.auth.getSession();
  if(recovering)return;
  if(data.session)enter(sb,data.session.user);else showLogin(sb);
}
boot();
