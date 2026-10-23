// Mesaj kutusu: Gelen / Gönderilen kutuları, Mesaj Gönder, Tümünü Sil. Mektuplar sunucuda saklanır (034_mail.sql);
// yalnız arkadaşlara gönderilir, alıcı çevrim dışıyken de kutusunda kalır. Bu dosya yalnızca sunucudan gelen kutuyu gösterir.
import './mail.css';
import {sendMail,netOnline,type MailRow} from './net';
const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
type Peer={id:string;nick:string};
type View={v:'list'}|{v:'read';m:MailRow}|{v:'write';to?:string;subject?:string};
export function setupMail(o:{friends:()=>Peer[];toast:(t:string)=>void;onUnread:(n:number)=>void;loadFriends:()=>void}){
  const ov=document.createElement('div');ov.className='quest-overlay mail-overlay';
  ov.innerHTML=`<section class="quest-log mail-win"><header><img src="/assets/icon-mail-v1.webp" alt="" draggable="false"/><div><span class="eyebrow">Arkadaşlarınla yazış</span><h2>MESAJ KUTUSU</h2></div><button class="mail-x" aria-label="Kapat">×</button></header>
    <nav class="mail-tabs"><button data-box="in">Gelen Kutusu<i hidden></i></button><button data-box="out">Gönderilen</button></nav>
    <div class="mail-bar"><button data-a="delall">Tümünü Sil</button><button data-a="write" class="primary">Mesaj Gönder</button></div><div class="mail-body"></div></section>`;
  document.body.append(ov);
  const body=ov.querySelector<HTMLElement>('.mail-body')!,inN=ov.querySelector<HTMLElement>('[data-box="in"] i')!;
  let box:'in'|'out'='in',view:View={v:'list'},unread=0;const lists:Record<'in'|'out',MailRow[]|null>={in:null,out:null};
  const close=()=>ov.classList.remove('open');
  ov.querySelector<HTMLButtonElement>('.mail-x')!.onclick=close;ov.onclick=e=>{if(e.target===ov)close();};
  ov.querySelectorAll<HTMLButtonElement>('[data-box]').forEach(b=>b.onclick=()=>{box=b.dataset.box as 'in'|'out';view={v:'list'};load();render();});
  ov.querySelector<HTMLButtonElement>('[data-a="write"]')!.onclick=()=>{view={v:'write'};render();};
  ov.querySelector<HTMLButtonElement>('[data-a="delall"]')!.onclick=()=>{if(!lists[box]?.length)return;if(!confirm(box==='in'?'Gelen kutusundaki bütün mektuplar silinsin mi?':'Gönderilen bütün mektuplar silinsin mi?'))return;sendMail('del',{box,id:null});view={v:'list'};};
  const load=()=>{if(netOnline())sendMail('box',{box});};
  const when=(t:number)=>new Date(t).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const setUnread=(n:number)=>{unread=n;inN.hidden=!n;inN.textContent=n>9?'9+':String(n);o.onUnread(n);};
  function render(){ov.querySelectorAll<HTMLButtonElement>('[data-box]').forEach(b=>b.classList.toggle('on',b.dataset.box===box));
    ov.querySelector<HTMLElement>('.mail-bar')!.hidden=view.v!=='list';
    if(!netOnline()){body.innerHTML='<p class="mail-empty">Mesaj kutusu için sunucuya bağlı olmalısın.</p>';return;}
    if(view.v==='write'){const fr=o.friends(),to=view.to;
      body.innerHTML=fr.length?`<form class="mail-form"><label>Kime<select name="to">${fr.map(f=>`<option value="${esc(f.id)}" ${f.id===to?'selected':''}>${esc(f.nick)}</option>`).join('')}</select></label>
        <label>Konu<input name="subject" maxlength="60" value="${esc(view.subject??'')}" autocomplete="off"/></label><label>Mesaj<textarea name="body" maxlength="500" rows="6" required></textarea></label>
        <p class="mail-note">Yalnız arkadaşlarına yazabilirsin. Küfür hesabın kapatılmasına yol açar.</p><footer><button type="button" data-a="back">Vazgeç</button><button type="submit" class="primary">Gönder</button></footer></form>`
        :'<p class="mail-empty">Arkadaş listen boş. Mektup göndermek için önce Arkadaşlar menüsünden arkadaş ekle.</p><footer class="mail-foot"><button data-a="back">Geri</button></footer>';
      body.querySelector<HTMLButtonElement>('[data-a="back"]')!.onclick=()=>{view={v:'list'};render();};
      const f=body.querySelector<HTMLFormElement>('form');if(f){f.onsubmit=e=>{e.preventDefault();const d=new FormData(f),text=String(d.get('body')||'').trim();if(!text)return;
        sendMail('send',{to:String(d.get('to')),subject:String(d.get('subject')||'').trim(),body:text});f.querySelector<HTMLButtonElement>('[type=submit]')!.disabled=true;};f.querySelector<HTMLTextAreaElement>('textarea')!.focus();}
      return;}
    if(view.v==='read'){const m=view.m;
      body.innerHTML=`<article class="mail-read"><header><b>${box==='in'?'Kimden':'Kime'}: ${esc(m.nick)}</b><time>${when(m.at)}</time></header><h3>${esc(m.subject||'(konu yok)')}</h3><p>${esc(m.body)}</p></article>
        <footer class="mail-foot"><button data-a="back">Geri</button><button data-a="del">Sil</button>${box==='in'?'<button data-a="reply" class="primary">Yanıtla</button>':''}</footer>`;
      body.querySelector<HTMLButtonElement>('[data-a="back"]')!.onclick=()=>{view={v:'list'};render();};
      body.querySelector<HTMLButtonElement>('[data-a="del"]')!.onclick=()=>{sendMail('del',{box,id:m.id});view={v:'list'};};
      const r=body.querySelector<HTMLButtonElement>('[data-a="reply"]');if(r)r.onclick=()=>{view={v:'write',to:m.other,subject:/^Ynt:/.test(m.subject)?m.subject:`Ynt: ${m.subject}`.slice(0,60)};render();};
      return;}
    const list=lists[box];
    body.innerHTML=!list?'<p class="mail-empty">Yükleniyor…</p>':!list.length?`<p class="mail-empty">${box==='in'?'Gelen kutun boş.':'Henüz mektup göndermedin.'}</p>`
      :`<ul class="mail-list">${list.map((m,i)=>`<li data-i="${i}" class="${box==='in'&&!m.read?'new':''}"><b>${esc(m.nick)}</b><span>${esc(m.subject||'(konu yok)')}</span><time>${when(m.at)}</time></li>`).join('')}</ul>`;
    body.querySelectorAll<HTMLElement>('[data-i]').forEach(li=>li.onclick=()=>{const m=list![Number(li.dataset.i)];view={v:'read',m};if(box==='in'&&!m.read){m.read=true;sendMail('read',{id:m.id});}render();});}
  return{
    open:()=>{ov.classList.add('open');view={v:'list'};load();o.loadFriends();render();},
    compose:(to:string)=>{ov.classList.add('open');view={v:'write',to};o.loadFriends();render();},
    rerender:()=>{if(ov.classList.contains('open')&&view.v==='write'&&!body.querySelector('textarea')?.value)render();},
    refresh:()=>{if(netOnline())sendMail('box',{box:'in'});},
    onMsg:(d:{k:string;box?:'in'|'out';list?:MailRow[];unread?:number;err?:string;note?:string;msg?:string;from?:string})=>{
      if(d.k==='err'){o.toast(String(d.msg));if(view.v==='write')render();return;}
      if(d.k==='new'){setUnread(d.unread??unread+1);o.toast(`${d.from} sana mektup gönderdi`);if(ov.classList.contains('open')&&box==='in'&&view.v==='list')load();return;}
      if(d.k==='box'&&d.box){lists[d.box]=d.list??[];setUnread(d.unread??0);if(d.err)o.toast(d.err);if(d.note){o.toast(d.note);box=d.box;view={v:'list'};}
        if(ov.classList.contains('open')&&(view.v==='list'||d.note))render();}}};
}
