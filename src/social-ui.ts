// Arkadaşlar ve grup arayüzü. Grup arkadaş listesinden kurulur (GRUP KUR); Grup düğmesi yalnız bir gruptayken görünür. Arkadaş listesinde çevrim içi arkadaşın denizi ve
// koordinatı, özel mesaj ve gruba davet; grup penceresinde üyeler, kaptan adıyla ya da seçili oyuncuya dokunarak davet.
// Kurallar ve konumlar sunucudan gelir (server/game-server.mjs, 033_social.sql).
import './social.css';
import {GROUP_MAX,FRIEND_MAX,groupMult,type FriendRow,type GroupState} from './social';
import {sendFriend,sendGroup} from './net';
import {infoTip} from './info-tip';

const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
let friends:FriendRow[]=[],group:GroupState={id:null},uidFn=()=>'',picked:{nick:string}|null=null;
let onPm:(id:string,nick:string)=>void=()=>{},toast:(t:string)=>void=()=>{};
export const friendList=()=>friends;
export const groupState=()=>group;
export function setupSocial(o:{uid:()=>string;openPm:(id:string,nick:string)=>void;toast:(t:string)=>void}){onPm=o.openPm;toast=o.toast;uidFn=o.uid;
  const cluster=document.querySelector('.map-cluster');if(!cluster)return;
  const mk=(cls:string,label:string,art:string,click:()=>void)=>{const b=document.createElement('button');b.className=`world-map-button social-btn ${cls}`;b.setAttribute('aria-label',label);
    b.innerHTML=`${art}<span>${label.toLocaleUpperCase('tr')}</span><i class="social-n" hidden></i>`;b.onclick=click;cluster.append(b);return b;};
  frBtn=mk('fr-btn','Arkadaşlar','<img src="/assets/icon-friends-v1.webp" alt="" draggable="false"/>',()=>toggle(frWin));
  gBtn=mk('grp-btn','Grup','<img src="/assets/icon-group-v1.webp" alt="" draggable="false"/>',()=>toggle(gWin));gBtn.hidden=true;}
let frBtn:HTMLButtonElement|null=null,gBtn:HTMLButtonElement|null=null;
const win=(cls:string,title:string)=>{const w=document.createElement('section');w.className=`social-win ${cls}`;w.hidden=true;w.innerHTML=`<header><h3>${title}</h3><button class="x" aria-label="Kapat">×</button></header><div class="body"></div>`;
  document.body.append(w);w.querySelector<HTMLButtonElement>('.x')!.onclick=()=>{w.hidden=true;};return w;};
const frWin=win('fr-win','ARKADAŞLAR'),gWin=win('grp-win','GRUP');
function toggle(w:HTMLElement){const open=w.hidden;frWin.hidden=gWin.hidden=true;w.hidden=!open;if(open){if(w===frWin){sendFriend('list');renderFriends();}else renderGroup();}}
export const socialOpen=()=>!frWin.hidden||!gWin.hidden;

// Arkadaşlar
function renderFriends(){const b=frWin.querySelector<HTMLElement>('.body')!,ok=friends.filter(f=>f.ok).sort((a,c)=>Number(c.on)-Number(a.on)),inc=friends.filter(f=>!f.ok&&f.in),out=friends.filter(f=>!f.ok&&!f.in);
  b.innerHTML=`<form class="add"><input maxlength="24" placeholder="Kaptan adı" autocomplete="off"/><button>EKLE</button>${infoTip(`Arkadaşlık karşılıklı onayla kurulur (en çok ${FRIEND_MAX}). Özel mesaj yalnız arkadaşlar arasında olur; mesajda küfür önce 24 saat susturma, tekrarında hesabın kapatılmasıyla sonuçlanır.`)}</form>
    ${inc.length?`<h4>GELEN İSTEKLER</h4>${inc.map(f=>`<div class="row"><div><b>${esc(f.nick)}</b></div><button data-a="yes" data-id="${f.id}">KABUL</button><button data-a="no" data-id="${f.id}" class="ghost">RED</button></div>`).join('')}`:''}
    <h4>ARKADAŞLAR · ${ok.length}</h4>${ok.length?ok.map(f=>`<div class="row ${f.on?'on':''}"><div><b>${esc(f.nick)}</b><small>${f.on?esc(f.at):'Çevrim dışı'}</small></div>
      <button data-a="pm" data-id="${f.id}" title="Özel mesaj">MESAJ</button>${f.on?`<button data-a="inv" data-nick="${esc(f.nick)}" title="Gruba davet" class="ghost">GRUP KUR</button>`:''}<button data-a="del" data-id="${f.id}" class="ghost del" title="Sil">×</button></div>`).join(''):'<p class="empty">Henüz arkadaşın yok</p>'}
    ${out.length?`<h4>GÖNDERİLEN</h4>${out.map(f=>`<div class="row"><div><b>${esc(f.nick)}</b><small>Onay bekleniyor</small></div><button data-a="del" data-id="${f.id}" class="ghost del">×</button></div>`).join('')}`:''}`;
  const f=b.querySelector<HTMLFormElement>('form.add')!,inp=f.querySelector('input')!;inp.addEventListener('keydown',e=>e.stopPropagation());
  f.onsubmit=e=>{e.preventDefault();const n=inp.value.trim();if(n){sendFriend('add',{nick:n});inp.value='';}};
  b.querySelectorAll<HTMLButtonElement>('[data-a]').forEach(x=>x.onclick=()=>{const a=x.dataset.a,id=x.dataset.id??'';
    if(a==='yes'||a==='no')sendFriend('ans',{id,ok:a==='yes'});
    if(a==='del'){const fr=friends.find(y=>y.id===id);if(confirm(`${fr?.nick??'Bu kaptan'} arkadaş listenden çıkarılsın mı?`))sendFriend('del',{id});}
    if(a==='pm'){const fr=friends.find(y=>y.id===id);if(fr){frWin.hidden=true;onPm(fr.id,fr.nick);}}
    if(a==='inv')sendGroup('inv',{nick:x.dataset.nick});});}
export function friendMsg(d:{k:string;list?:FriendRow[];err?:string;note?:string}){if(d.list)friends=d.list;if(d.err)toast(d.err);if(d.note)toast(d.note);
  const pending=friends.filter(f=>!f.ok&&f.in).length;if(frBtn){const n=frBtn.querySelector<HTMLElement>('.social-n')!;n.hidden=!pending;n.textContent=`+${pending}`;}if(!frWin.hidden)renderFriends();}

// Grup
export function groupPick(p:{nick:string}|null){const k=p?.nick??'';if(k===(picked?.nick??''))return;picked=p;if(!gWin.hidden)renderGroup();}
function renderGroup(){const b=gWin.querySelector<HTMLElement>('.body')!,g=group,myUid=uidFn(),lead=g.lead===myUid||!g.id,full=(g.members?.length??0)>=GROUP_MAX;
  const tip=infoTip(`En çok ${GROUP_MAX} kaptan. Aynı denizdeki grup üyelerine ek TP: 2 kişi <b>%${Math.round((groupMult(2)-1)*100)}</b>, 3 kişi <b>%${Math.round((groupMult(3)-1)*100)}</b>, 4 kişi <b>%${Math.round((groupMult(4)-1)*100)}</b>. Görev sayacı yalnız NPC'ye son vuruşu yapana işler.`);
  b.innerHTML=`${g.id?`<p class="bonus">Ek TP: <b>%${g.bonus??0}</b>${tip}</p>${(g.members??[]).map(m=>`<div class="row on"><div><b>${esc(m.nick)}${m.uid===g.lead?' ★':''}</b><small>${esc(m.at)}</small></div>${g.lead===myUid&&m.uid!==myUid?`<button data-kick="${m.uid}" class="ghost del" title="Çıkar">×</button>`:''}</div>`).join('')}`:`<p class="bonus">Grup kur, birlikte avlan${tip}</p>`}
    ${lead&&!full?'<p class="pick">Üye eklemek için Arkadaşlar listesinde <b>GRUP KUR</b>\'a dokun</p>':''}
    ${g.id?'<button class="leave">GRUPTAN AYRIL</button>':''}`;
  b.querySelectorAll<HTMLButtonElement>('[data-kick]').forEach(x=>x.onclick=()=>sendGroup('kick',{uid:x.dataset.kick}));
  b.querySelector<HTMLButtonElement>('.leave')?.addEventListener('click',()=>sendGroup('leave'));}
// Davet penceresi
const inv=document.createElement('div');inv.className='social-ask';inv.hidden=true;document.body.append(inv);let invTimer=0;
export function groupMsg(d:GroupState&{k:string;from?:string;msg?:string}){
  if(d.k==='state'){group={id:d.id,lead:d.lead,members:d.members,bonus:d.bonus};if(d.note)toast(d.note);if(gBtn){gBtn.classList.toggle('active',!!d.id);gBtn.hidden=!d.id;if(!d.id)gWin.hidden=true;}if(!gWin.hidden)renderGroup();return;}
  if(d.k==='err'||d.k==='note'){toast(String(d.msg));return;}
  if(d.k==='inv'){clearTimeout(invTimer);inv.hidden=false;inv.innerHTML=`<h3>GRUP DAVETİ</h3><p><b>${esc(String(d.from))}</b> seni grubuna davet ediyor.</p><div><button class="yes">KATIL</button><button class="no">RED</button></div>`;
    inv.querySelector<HTMLButtonElement>('.yes')!.onclick=()=>{sendGroup('yes');inv.hidden=true;};inv.querySelector<HTMLButtonElement>('.no')!.onclick=()=>{sendGroup('no');inv.hidden=true;};
    invTimer=setTimeout(()=>{inv.hidden=true;},60_000) as unknown as number;}}
