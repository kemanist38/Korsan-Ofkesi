// Yönetici paneli: oyuncu ara, inci hediye et, banla / ban kaldır, kupon oluştur.
// Yetki veritabanında (admins tablosu) kontrol edilir; bu sayfa yetkisiz hesaba hiçbir şey göstermez.
import {supa} from './supabase';
type Row={player_no:number;nick:string;email:string;banned:boolean;ban_reason:string|null;pearls:number;created_at:string};
const root=document.getElementById('admin')!;
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const fmt=(n:number)=>Number(n).toLocaleString('tr-TR');
const errText=(m:string)=>m.replace(/^.*?: /,'')||'İşlem yapılamadı';
async function main(){
  const sb=supa();if(!sb){root.innerHTML='<p>Sunucuya bağlanılamadı.</p>';return;}
  const {data:s}=await sb.auth.getSession();
  if(!s.session){root.innerHTML='<h1>Yönetim</h1><p>Önce oyuna giriş yap, sonra bu sayfayı yenile.</p><p><a href="/oyna/?auth">Oyuna giriş yap</a></p>';return;}
  const {data:ok}=await sb.rpc('is_admin');
  if(ok!==true){root.innerHTML='<h1>Yönetim</h1><p>Bu sayfaya erişim yetkin yok.</p>';return;}
  root.innerHTML=`<h1>YÖNETİM</h1><p class="muted">${esc(s.session.user.email)}</p>
  <h2>Oyuncular</h2><div class="card"><div class="row"><input id="q" placeholder="Kaptan adı, e-posta veya oyuncu no" style="flex:1;min-width:220px"/><button id="find">ARA</button></div><p class="msg" id="msg"></p><div class="table-wrap"><table><thead><tr><th>No</th><th>Kaptan</th><th>E-posta</th><th>İnci</th><th>Durum</th><th>İşlem</th></tr></thead><tbody id="rows"></tbody></table></div></div>
  <h2>Sunucu durumu</h2><div class="card"><p id="stats" class="muted">Yükleniyor…</p></div>
  <h2>Şüpheli oyuncular <button id="fRefresh">YENİLE</button></h2><div class="card"><p class="muted">Oyun sunucusunun yakaladığı hız, hasar, atış ve mesaj seli denemeleri (son 300). Aynı oyuncu çok kez görünüyorsa incele.</p><p class="msg" id="fMsg"></p><div class="table-wrap"><table><thead><tr><th>Zaman</th><th>Oyuncu</th><th>Sebep</th><th>Ayrıntı</th><th>Tekrar</th></tr></thead><tbody id="fRows"></tbody></table></div></div>
  <h2>Kupon oluştur</h2><div class="card"><div class="row"><input id="cCode" placeholder="KOD" style="text-transform:uppercase"/><input id="cPearls" type="number" min="0" placeholder="İnci"/><input id="cGold" type="number" min="0" placeholder="Altın"/><input id="cUntil" type="date" title="Son gün"/><input id="cMax" type="number" min="1" placeholder="Toplam kullanım (boş: sınırsız)"/><input id="cNote" placeholder="Not"/><button id="cAdd">KUPON EKLE</button></div><p class="msg" id="cMsg"></p></div>`;
  const msg=(id:string,t:string,bad=false)=>{const m=document.getElementById(id)!;m.textContent=t;m.classList.toggle('bad',bad);};
  const val=(id:string)=>(document.getElementById(id) as HTMLInputElement).value.trim();
  const find=async()=>{msg('msg','Aranıyor…');const {data,error}=await sb.rpc('admin_find',{p_q:val('q')});if(error){msg('msg',errText(error.message),true);return;}
    const rows=(data??[]) as Row[];msg('msg',`${rows.length} oyuncu`);
    document.getElementById('rows')!.innerHTML=rows.map(r=>`<tr><td>#${r.player_no}</td><td>${esc(r.nick)}</td><td>${esc(r.email)}</td><td>${fmt(r.pearls)}</td><td>${r.banned?`<span class="banned">BANLI</span>${r.ban_reason?`<br><small>${esc(r.ban_reason)}</small>`:''}`:'Aktif'}</td>
      <td class="actions"><button class="ok" data-gift="${r.player_no}">İNCİ VER</button>${r.banned?`<button data-unban="${r.player_no}">BANI KALDIR</button>`:`<button class="danger" data-ban="${r.player_no}">BANLA</button>`}</td></tr>`).join('');
    document.querySelectorAll<HTMLButtonElement>('[data-gift]').forEach(b=>b.onclick=async()=>{const no=Number(b.dataset.gift),a=Number(prompt(`#${no} oyuncusuna kaç inci verilsin? (Eksi yazarsan inci düşülür)`)||0);if(!a)return;
      const reason=prompt('Sebep (ör. hediye, havale, telafi)','hediye')??'hediye';const {data:bal,error:e}=await sb.rpc('admin_gift',{p_player_no:no,p_amount:a,p_reason:reason});
      if(e){msg('msg',errText(e.message),true);return;}msg('msg',`#${no}: ${a>0?'+':''}${fmt(a)} inci · yeni bakiye ${fmt(Number(bal))}`);void find();});
    document.querySelectorAll<HTMLButtonElement>('[data-ban]').forEach(b=>b.onclick=async()=>{const no=Number(b.dataset.ban),reason=prompt(`#${no} banlansın mı? Sebebi yaz:`);if(reason===null)return;
      const {error:e}=await sb.rpc('admin_ban',{p_player_no:no,p_banned:true,p_reason:reason});if(e){msg('msg',errText(e.message),true);return;}msg('msg',`#${no} banlandı`);void find();});
    document.querySelectorAll<HTMLButtonElement>('[data-unban]').forEach(b=>b.onclick=async()=>{const no=Number(b.dataset.unban);if(!confirm(`#${no} oyuncusunun banı kaldırılsın mı?`))return;
      const {error:e}=await sb.rpc('admin_ban',{p_player_no:no,p_banned:false,p_reason:''});if(e){msg('msg',errText(e.message),true);return;}msg('msg',`#${no} banı kaldırıldı`);void find();});};
  document.getElementById('find')!.onclick=()=>void find();(document.getElementById('q') as HTMLInputElement).onkeydown=e=>{if(e.key==='Enter')void find();};
  document.getElementById('cAdd')!.onclick=async()=>{const code=val('cCode');if(code.length<4){msg('cMsg','Kod en az 4 karakter olmalı',true);return;}
    const reward:Record<string,number>={};const p=Number(val('cPearls')),g=Number(val('cGold'));if(p>0)reward.pearls=p;if(g>0)reward.gold=g;if(!Object.keys(reward).length){msg('cMsg','İnci ya da altın ödülü gir',true);return;}
    const {error}=await sb.rpc('admin_coupon',{p_code:code,p_reward:reward,p_until:val('cUntil')||null,p_max_uses:val('cMax')?Number(val('cMax')):null,p_note:val('cNote')||null});
    if(error){msg('cMsg',errText(error.message),true);return;}msg('cMsg',`Kupon eklendi: ${code.toUpperCase()}`);};
  const REASONS:Record<string,string>={'hız':'Aşırı hız','hasar':'İmkânsız hasar','atış hızı':'Çok hızlı atış','mesaj seli':'Mesaj seli'};
  const flagsLoad=async()=>{msg('fMsg','Yükleniyor…');const {data:ss}=await sb.auth.getSession();
    try{const r=await fetch('https://game.piraterage.com/flags',{headers:{authorization:`Bearer ${ss.session?.access_token??''}`}});if(!r.ok)throw new Error(r.status===403?'Yetki yok':`Sunucu ${r.status}`);
      const rows=await r.json() as {playerNo:number;nick:string;reason:string;detail:string;count:number;at:number;last:number}[];msg('fMsg',rows.length?`${rows.length} kayıt`:'Şüpheli kayıt yok');
      document.getElementById('fRows')!.innerHTML=rows.map(f=>`<tr><td>${new Date(f.last).toLocaleString('tr-TR')}</td><td>#${f.playerNo} ${esc(f.nick)}</td><td>${esc(REASONS[f.reason]??f.reason)}</td><td>${esc(f.detail)}</td><td>${f.count}</td></tr>`).join('');}
    catch(e){msg('fMsg',`Oyun sunucusuna ulaşılamadı: ${(e as Error).message}`,true);}};
  document.getElementById('fRefresh')!.onclick=()=>void flagsLoad();
  const statsLoad=async()=>{const {data:ss}=await sb.auth.getSession();const el=document.getElementById('stats')!;
    try{const r=await fetch('https://game.piraterage.com/stats',{headers:{authorization:`Bearer ${ss.session?.access_token??''}`}});if(!r.ok)throw new Error(String(r.status));
      const d=await r.json() as {online:number;seas:Record<string,number>;uptime:number};
      el.innerHTML=`<b>${d.online}</b> kaptan çevrim içi · sunucu ${Math.floor(d.uptime/3600)} sa ${Math.floor(d.uptime%3600/60)} dk açık<br>${Object.entries(d.seas).map(([k,v])=>`${esc(k.replace(/^sea-/,''))}: ${v}`).join(' · ')||'Denizlerde kimse yok'}`;}
    catch(e){el.textContent=`Oyun sunucusuna ulaşılamadı (${(e as Error).message})`;}};
  void find();void flagsLoad();void statsLoad();setInterval(()=>void statsLoad(),15000);
}
void main();
