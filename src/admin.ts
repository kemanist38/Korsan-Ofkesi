// Yönetici paneli: genel bakış, çevrim içi kaptanlar, duyuru, oyuncu ara (inci ver, banla), şüpheliler, siparişler, kupon.
// Yetki veritabanında (admins tablosu) ve oyun sunucusunda (yönetici oturumu) kontrol edilir; yetkisiz hesaba hiçbir şey gösterilmez.
import {supa} from './supabase';
import {COUPON_ITEMS,COUPON_DESIGNS} from './coupons';
type Row={player_no:number;nick:string;email:string;banned:boolean;ban_reason:string|null;pearls:number;created_at:string};
type Op={at:number;kind:string;text:string};
type Stats={online:number;seas:Record<string,number>;uptime:number;mem?:number;heap?:number;lastBackup?:number;ops?:Op[];players?:{no:number;nick:string;sea:string;level:number;admin:boolean}[]};
type Flag={playerNo:number;nick:string;reason:string;detail:string;count:number;at:number;last:number};
type Order={order_id:string;email:string|null;note:string|null;price:number;pack:string|null;pearls:number|null;status:string;at:string};
const GAME='https://game.piraterage.com';
const root=document.getElementById('admin')!;
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const fmt=(n:number)=>Number(n).toLocaleString('tr-TR');
const when=(t:number|string)=>new Date(t).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const errText=(m:string)=>m.replace(/^.*?: /,'')||'İşlem yapılamadı';
const seaName=(s:string)=>s?s.replace(/^sea-/,''):'liman';
const REASONS:Record<string,string>={'hız':'Aşırı hız','hasar':'İmkânsız hasar','atış hızı':'Çok hızlı atış','mesaj seli':'Mesaj seli'};
const OP_CLASS:Record<string,string>={'istemci hatası':'bad','yedek hatası':'bad','test ödemesi':'warn','oyundan atıldı':'warn','duyuru':'info'};
const TABS=[['ozet','Genel Bakış'],['online','Çevrim İçi'],['oyuncu','Oyuncular'],['supheli','Şüpheliler'],['siparis','Siparişler'],['kupon','Kupon']] as const;
type Tab=typeof TABS[number][0];
const itemOptions=()=>Object.entries(COUPON_ITEMS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');

async function main(){
  const sb=supa();if(!sb){root.innerHTML='<p>Sunucuya bağlanılamadı.</p>';return;}
  const {data:s}=await sb.auth.getSession();
  if(!s.session){root.innerHTML='<h1>Yönetim</h1><p>Önce oyuna giriş yap, sonra bu sayfayı yenile.</p><p><a href="/oyna/?auth">Oyuna giriş yap</a></p>';return;}
  const {data:ok}=await sb.rpc('is_admin');
  if(ok!==true){root.innerHTML='<h1>Yönetim</h1><p>Bu sayfaya erişim yetkin yok.</p>';return;}
  const token=async()=>(await sb.auth.getSession()).data.session?.access_token??'';
  const game=async<T>(path:string,body?:unknown):Promise<T>=>{const r=await fetch(GAME+path,{method:body?'POST':'GET',headers:{authorization:`Bearer ${await token()}`,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error((d as {error?:string}).error??(r.status===403?'Yetki yok':`Sunucu ${r.status}`));return d as T;};

  root.innerHTML=`<header class="ad-head"><div><h1>YÖNETİM</h1><p class="muted">${esc(s.session.user.email)}</p></div><span class="ad-live" id="live">● bağlanıyor</span></header>
  <nav class="ad-tabs">${TABS.map(([id,n])=>`<button data-tab="${id}">${n}<i id="badge-${id}" hidden></i></button>`).join('')}</nav>
  <section data-pane="ozet">
    <div class="ad-cards" id="cards"></div>
    <div class="card"><h3>Duyuru gönder</h3><p class="muted">Çevrim içi tüm kaptanların sohbetinde 📢 ile görünür (ör. bakım uyarısı, etkinlik).</p>
      <div class="row"><input id="annText" maxlength="300" placeholder="Ör. 10 dakika sonra kısa bir bakım yapılacak" style="flex:1;min-width:220px"/><button id="annSend" class="ok">GÖNDER</button></div><p class="msg" id="annMsg"></p></div>
    <div class="card"><h3>Son olaylar</h3><p class="muted">İstemci hataları, reddedilen test ödemeleri, yedek, bakım, duyuru. Sunucu yeniden başlayınca sıfırlanır.</p><div id="ops"></div></div>
  </section>
  <section data-pane="online"><div class="card"><div class="row"><input id="onQ" placeholder="Kaptan adı veya deniz ile süz" style="flex:1;min-width:200px"/></div><div id="seas" class="ad-chips"></div>
    <div class="table-wrap"><table><thead><tr><th>No</th><th>Kaptan</th><th>Seviye</th><th>Deniz</th><th></th></tr></thead><tbody id="onRows"></tbody></table></div><p class="msg" id="onMsg"></p></div></section>
  <section data-pane="oyuncu"><div class="card"><div class="row"><input id="q" placeholder="Kaptan adı, e-posta veya oyuncu no" style="flex:1;min-width:220px"/><button id="find">ARA</button></div><p class="msg" id="msg"></p>
    <div class="table-wrap"><table><thead><tr><th>No</th><th>Kaptan</th><th>E-posta</th><th>İnci</th><th>Kayıt</th><th>Durum</th><th>İşlem</th></tr></thead><tbody id="rows"></tbody></table></div></div></section>
  <section data-pane="supheli"><div class="card"><div class="row"><p class="muted" style="flex:1">Oyun sunucusunun yakaladığı hız, hasar, atış ve mesaj seli denemeleri (son 300). Aynı oyuncu çok kez görünüyorsa incele.</p><button id="fRefresh">YENİLE</button></div><p class="msg" id="fMsg"></p>
    <div class="table-wrap"><table><thead><tr><th>Son</th><th>Oyuncu</th><th>Sebep</th><th>Ayrıntı</th><th>Tekrar</th><th></th></tr></thead><tbody id="fRows"></tbody></table></div></div></section>
  <section data-pane="siparis"><div class="card"><div class="row"><p class="muted" style="flex:1">"Eşleşmedi": oyuncu bulunamadı (not/e-posta yok). Oyuncu numarasını sorup YÜKLE ile inciyi elle ver.</p><button id="oRefresh">YENİLE</button></div><p class="msg" id="oMsg"></p>
    <div class="table-wrap"><table><thead><tr><th>Zaman</th><th>Sipariş</th><th>Tutar</th><th>Paket</th><th>E-posta / Not</th><th>Durum</th><th></th></tr></thead><tbody id="oRows"></tbody></table></div></div></section>
  <section data-pane="kupon"><div class="card coupon-form"><h3>Kupon oluştur</h3>
    <div class="row"><input id="cCode" placeholder="KOD" style="text-transform:uppercase"/><input id="cNote" placeholder="Not (ör. açılış)"/></div>
    <div class="row"><input id="cPearls" type="number" min="0" placeholder="İnci"/><input id="cGold" type="number" min="0" placeholder="Altın"/></div>
    ${[1,2,3].map(n=>`<div class="row"><select id="cItem${n}"><option value="">— Gülle / malzeme yok —</option>${itemOptions()}</select><input id="cQty${n}" type="number" min="1" placeholder="Adet"/></div>`).join('')}
    <div class="row"><select id="cDesign"><option value="">— Tasarım yok —</option>${Object.entries(COUPON_DESIGNS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
    <div class="row"><label>Son gün <input id="cUntil" type="date"/></label><input id="cMax" type="number" min="1" placeholder="Toplam kullanım (boş: sınırsız)"/><button id="cAdd" class="ok">KUPON EKLE</button></div><p class="msg" id="cMsg"></p></div></section>`;

  const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  const msg=(id:string,t:string,bad=false)=>{const m=$(id);m.textContent=t;m.classList.toggle('bad',bad);};
  const val=(id:string)=>$<HTMLInputElement>(id).value.trim();
  const badge=(tab:Tab,n:number)=>{const b=$(`badge-${tab}`);b.hidden=!n;b.textContent=n>99?'99+':String(n);};
  let tab:Tab='ozet';
  const show=(t:Tab)=>{tab=t;document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
    document.querySelectorAll<HTMLElement>('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==t);try{localStorage.setItem('admin-tab',t);}catch{}
    if(t==='supheli')void flagsLoad();if(t==='siparis')void ordersLoad();};
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>show(b.dataset.tab as Tab));

  // ---- Genel bakış + çevrim içi (oyun sunucusundan, 15 sn'de bir)
  let stats:Stats|null=null;
  const card=(label:string,value:string,sub='',cls='')=>`<div class="ad-card ${cls}"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;
  const renderOnline=()=>{const list=stats?.players??[],f=val('onQ').toLocaleLowerCase('tr');
    $('seas').innerHTML=Object.entries(stats?.seas??{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<button data-sea="${esc(seaName(k))}">${esc(seaName(k))} · ${v}</button>`).join('');
    $('seas').querySelectorAll<HTMLButtonElement>('[data-sea]').forEach(b=>b.onclick=()=>{$<HTMLInputElement>('onQ').value=b.dataset.sea!;renderOnline();});
    const rows=list.filter(p=>!f||p.nick.toLocaleLowerCase('tr').includes(f)||seaName(p.sea).toLocaleLowerCase('tr').includes(f)).sort((a,b)=>a.nick.localeCompare(b.nick,'tr'));
    $('onRows').innerHTML=rows.map(p=>`<tr><td>#${p.no}</td><td>${esc(p.nick)}${p.admin?' <em class="tag">YÖNETİCİ</em>':''}</td><td>${p.level}</td><td>${esc(seaName(p.sea))}</td>
      <td class="actions"><button data-look="${p.no}">BUL</button>${p.admin?'':`<button class="danger" data-kick="${p.no}">AT</button>`}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">Kimse yok</td></tr>';
    $('onRows').querySelectorAll<HTMLButtonElement>('[data-look]').forEach(b=>b.onclick=()=>{$<HTMLInputElement>('q').value=b.dataset.look!;show('oyuncu');void find();});
    $('onRows').querySelectorAll<HTMLButtonElement>('[data-kick]').forEach(b=>b.onclick=()=>void kick(Number(b.dataset.kick),false,'onMsg'));};
  const statsLoad=async()=>{try{stats=await game<Stats>('/stats');$('live').textContent='● sunucu açık';$('live').className='ad-live ok';}
    catch(e){$('live').textContent=`● sunucuya ulaşılamadı (${(e as Error).message})`;$('live').className='ad-live bad';return;}
    const d=stats,up=`${Math.floor(d.uptime/86400)?`${Math.floor(d.uptime/86400)} g `:''}${Math.floor(d.uptime%86400/3600)} sa ${Math.floor(d.uptime%3600/60)} dk`;
    const errs=(d.ops??[]).filter(o=>o.kind==='istemci hatası').length;
    $('cards').innerHTML=card('Çevrim içi',fmt(d.online),`${Object.keys(d.seas).length} denizde`)
      +card('Sunucu',up,'kesintisiz açık')
      +card('Bellek',d.mem!==undefined?`${d.mem} MB`:'—',d.heap!==undefined?`oyun verisi ${d.heap} MB`:'',(d.mem??0)>800?'warn':'')
      +card('Son yedek',d.lastBackup?when(d.lastBackup):'—',d.lastBackup?'/opt/game/backup':'bu açılışta henüz yok')
      +card('İstemci hatası',String(errs),'son olaylarda',errs?'warn':'');
    $('ops').innerHTML=(d.ops??[]).length?`<table class="ops"><tbody>${d.ops!.map(o=>`<tr class="${OP_CLASS[o.kind]??''}"><td>${when(o.at)}</td><td><em class="tag">${esc(o.kind)}</em></td><td>${esc(o.text)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Son olay yok.</p>';
    badge('online',d.online);renderOnline();};
  $('onQ').oninput=renderOnline;
  const kick=async(no:number,ban:boolean,where:string)=>{if(!ban&&!confirm(`#${no} oyundan atılsın mı? (Ban değildir, tekrar girebilir)`))return;
    try{await game('/kick',{no,ban});msg(where,`#${no} oyundan çıkarıldı`);void statsLoad();}catch(e){if(!ban)msg(where,(e as Error).message,true);}};
  $('annSend').onclick=async()=>{const text=val('annText');if(!text){msg('annMsg','Duyuru yaz',true);return;}if(!confirm(`Herkese gönderilsin mi?\n\n${text}`))return;
    try{const r=await game<{sent:number}>('/announce',{text});msg('annMsg',`Duyuru ${r.sent} kaptana gönderildi`);$<HTMLInputElement>('annText').value='';void statsLoad();}catch(e){msg('annMsg',(e as Error).message,true);}};

  // ---- Oyuncular
  const find=async()=>{msg('msg','Aranıyor…');const {data,error}=await sb.rpc('admin_find',{p_q:val('q')});if(error){msg('msg',errText(error.message),true);return;}
    const rows=(data??[]) as Row[];msg('msg',`${rows.length} oyuncu`);const online=new Set((stats?.players??[]).map(p=>p.no));
    $('rows').innerHTML=rows.map(r=>`<tr><td>#${r.player_no}</td><td>${esc(r.nick)}${online.has(r.player_no)?' <em class="tag on">ÇEVRİM İÇİ</em>':''}</td><td>${esc(r.email)}</td><td>${fmt(r.pearls)}</td><td>${r.created_at?when(r.created_at):''}</td>
      <td>${r.banned?`<span class="banned">BANLI</span>${r.ban_reason?`<br><small>${esc(r.ban_reason)}</small>`:''}`:'Aktif'}</td>
      <td class="actions"><button class="ok" data-gift="${r.player_no}">İNCİ VER</button>${r.banned?`<button data-unban="${r.player_no}">BANI KALDIR</button>`:`<button class="danger" data-ban="${r.player_no}">BANLA</button>`}</td></tr>`).join('');
    document.querySelectorAll<HTMLButtonElement>('[data-gift]').forEach(b=>b.onclick=async()=>{const no=Number(b.dataset.gift),a=Number(prompt(`#${no} oyuncusuna kaç inci verilsin? (Eksi yazarsan inci düşülür)`)||0);if(!a)return;
      const reason=prompt('Sebep (ör. hediye, havale, telafi)','hediye')??'hediye';const {data:bal,error:e}=await sb.rpc('admin_gift',{p_player_no:no,p_amount:a,p_reason:reason});
      if(e){msg('msg',errText(e.message),true);return;}msg('msg',`#${no}: ${a>0?'+':''}${fmt(a)} inci · yeni bakiye ${fmt(Number(bal))}`);void find();});
    document.querySelectorAll<HTMLButtonElement>('[data-ban]').forEach(b=>b.onclick=async()=>{const no=Number(b.dataset.ban),reason=prompt(`#${no} banlansın mı? Sebebi yaz:`);if(reason===null)return;
      const {error:e}=await sb.rpc('admin_ban',{p_player_no:no,p_banned:true,p_reason:reason});if(e){msg('msg',errText(e.message),true);return;}
      await kick(no,true,'msg');msg('msg',`#${no} banlandı${online.has(no)?' ve oyundan çıkarıldı':''}`);void find();});
    document.querySelectorAll<HTMLButtonElement>('[data-unban]').forEach(b=>b.onclick=async()=>{const no=Number(b.dataset.unban);if(!confirm(`#${no} oyuncusunun banı kaldırılsın mı?`))return;
      const {error:e}=await sb.rpc('admin_ban',{p_player_no:no,p_banned:false,p_reason:''});if(e){msg('msg',errText(e.message),true);return;}msg('msg',`#${no} banı kaldırıldı`);void find();});};
  $('find').onclick=()=>void find();$<HTMLInputElement>('q').onkeydown=e=>{if(e.key==='Enter')void find();};

  // ---- Şüpheliler
  const flagsLoad=async()=>{msg('fMsg','Yükleniyor…');
    try{const rows=await game<Flag[]>('/flags');msg('fMsg',rows.length?`${rows.length} kayıt`:'Şüpheli kayıt yok');badge('supheli',new Set(rows.filter(f=>Date.now()-f.last<86_400_000).map(f=>f.playerNo)).size);
      $('fRows').innerHTML=rows.map(f=>`<tr class="${f.count>=5?'warn':''}"><td>${when(f.last)}</td><td>#${f.playerNo} ${esc(f.nick)}</td><td>${esc(REASONS[f.reason]??f.reason)}</td><td>${esc(f.detail)}</td><td>${f.count}</td><td><button data-look="${f.playerNo}">BUL</button></td></tr>`).join('');
      $('fRows').querySelectorAll<HTMLButtonElement>('[data-look]').forEach(b=>b.onclick=()=>{$<HTMLInputElement>('q').value=b.dataset.look!;show('oyuncu');void find();});}
    catch(e){msg('fMsg',`Oyun sunucusuna ulaşılamadı: ${(e as Error).message}`,true);}};
  $('fRefresh').onclick=()=>void flagsLoad();

  // ---- Siparişler
  const ordersLoad=async()=>{const {data,error}=await sb.from('shopier_orders').select('order_id,email,note,price,pack,pearls,status,at').order('at',{ascending:false}).limit(100);
    if(error){msg('oMsg',errText(error.message),true);return;}const rows=(data??[]) as Order[];msg('oMsg',rows.length?`${rows.length} sipariş`:'Henüz sipariş yok');badge('siparis',rows.filter(o=>o.status==='eşleşmedi').length);
    $('oRows').innerHTML=rows.map(o=>`<tr><td>${when(o.at)}</td><td>${esc(o.order_id)}</td><td>${fmt(o.price)} ₺</td><td>${esc(o.pack??'-')}${o.pearls?` · ${fmt(o.pearls)} inci`:''}</td><td>${esc(o.email??'')}<br><small>${esc(o.note??'')}</small></td><td>${o.status==='yüklendi'?'✔ yüklendi':`<span class="banned">${esc(o.status)}</span>`}</td><td>${o.status==='eşleşmedi'?`<button class="ok" data-assign="${esc(o.order_id)}">YÜKLE</button>`:''}</td></tr>`).join('');
    document.querySelectorAll<HTMLButtonElement>('[data-assign]').forEach(b=>b.onclick=async()=>{const no=Number(prompt('İnci hangi oyuncu numarasına yüklensin?')||0);if(!no)return;
      const {error:e}=await sb.rpc('admin_order_assign',{p_order:b.dataset.assign,p_player_no:no});if(e){msg('oMsg',errText(e.message),true);return;}msg('oMsg',`Sipariş #${no} oyuncusuna yüklendi`);void ordersLoad();});};
  $('oRefresh').onclick=()=>void ordersLoad();

  // ---- Kupon
  $('cAdd').onclick=async()=>{const code=val('cCode');if(code.length<4){msg('cMsg','Kod en az 4 karakter olmalı',true);return;}
    const reward:{pearls?:number;gold?:number;items?:Record<string,number>;design?:string}={};const p=Number(val('cPearls')),g=Number(val('cGold'));if(p>0)reward.pearls=p;if(g>0)reward.gold=g;
    for(const n of [1,2,3]){const k=$<HTMLSelectElement>(`cItem${n}`).value,q=Number(val(`cQty${n}`));if(k&&q>0)(reward.items??={})[k]=(reward.items?.[k]??0)+q;}
    const d=$<HTMLSelectElement>('cDesign').value;if(d)reward.design=d;
    if(!Object.keys(reward).length){msg('cMsg','En az bir ödül seç (inci, altın, gülle ya da tasarım)',true);return;}
    const {error}=await sb.rpc('admin_coupon',{p_code:code,p_reward:reward,p_until:val('cUntil')||null,p_max_uses:val('cMax')?Number(val('cMax')):null,p_note:val('cNote')||null});
    if(error){msg('cMsg',errText(error.message),true);return;}msg('cMsg',`Kupon eklendi: ${code.toUpperCase()}`);};

  let saved:Tab='ozet';try{const t=localStorage.getItem('admin-tab');if(TABS.some(([id])=>id===t))saved=t as Tab;}catch{}
  show(saved);void statsLoad();void flagsLoad();void ordersLoad();setInterval(()=>{void statsLoad();if(tab==='supheli')void flagsLoad();},15000);
}
void main();
