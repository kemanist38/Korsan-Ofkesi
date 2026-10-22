// Sohbet penceresi (sol alt): Global, Filo ve Özel (arkadaşlarla birebir) sekmeleri. Mesajlar hiçbir yerde saklanmaz: yalnızca açık oturumda, son 20 mesaj
// tutulur; sayfa yenilenince ya da oyuna yeniden girince sohbet boş başlar.
// Pencerenin mesaj alanına ya da başlığına tıklamak pencereyi küçültüp kapatır; yazı kutusu ve sekmeler kapatmaz.
// Sohbet (açıkken başlıktan, küçükken yuvarlak düğmeden) tutulup ekranda istenen yere taşınabilir; yeri bu cihazda saklanır.
export type ChatTab='global'|'fleet'|'pm';
export type PmPeer={id:string;nick:string;on:boolean};
type Line={who:string;text:string;at:number;system?:boolean;adm?:boolean};
const OLD_STORAGE='yedi-deniz-chat-v1',POS='yedi-deniz-chat-pos',KEEP=20;
import {filterChat} from './chat-filter';
// Engellenen oyuncular (bu cihazda): mesajları gösterilmez
const BLOCK='pr-chat-blocked';
export function blockedList():string[]{try{const v=JSON.parse(localStorage.getItem(BLOCK)||'[]');return Array.isArray(v)?v:[];}catch{return[];}}
export function setBlocked(list:string[]){try{localStorage.setItem(BLOCK,JSON.stringify(list));}catch{}}
const plainNick=(who:string)=>who.replace(/^\[[^\]]*\]/,'');
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
// Eski sürümün tarayıcıda biriktirdiği sohbet kaydı silinir
try{localStorage.removeItem(OLD_STORAGE);}catch{}

export function setupChat(me:()=>{nick:string;tag:string|null;adm?:boolean},onSend?:(tab:ChatTab,who:string,text:string)=>void,onReport?:(nick:string,why:string)=>void,pm?:{friends:()=>PmPeer[];send:(id:string,text:string)=>void}){
  const root=document.createElement('div');root.className='chat';
  root.innerHTML=`<section class="chat-box" id="chatBox" aria-label="Sohbet"><header class="chat-tabs"><button data-chat-tab="global">Global</button><button data-chat-tab="fleet">Filo</button><button data-chat-tab="pm"><img class="chat-pm-ic" src="/assets/icon-mail-v1.webp" alt="" draggable="false"/>Özel<i class="chat-n" hidden></i></button><span class="chat-close" title="Kapat">×</span></header>
    <div class="chat-peer" hidden></div><div class="chat-log" id="chatLog"></div><form class="chat-form" id="chatForm"><input id="chatInput" maxlength="120" autocomplete="off" placeholder="Mesaj yaz…"/><button type="submit">Gönder</button></form></section>
    <button class="chat-toggle" id="chatToggle" aria-label="Sohbet" title="Sohbet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><i class="chat-dot"></i><i class="chat-n" hidden></i></button>`;
  document.body.append(root);
  const box=root.querySelector<HTMLElement>('#chatBox')!,log=root.querySelector<HTMLElement>('#chatLog')!,input=root.querySelector<HTMLInputElement>('#chatInput')!,dot=root.querySelector<HTMLElement>('.chat-dot')!;
  const lines:Record<ChatTab,Line[]>={global:[],fleet:[],pm:[]};let tab:ChatTab='global',open=false;
  // Özel mesajlar: arkadaş başına konuşma ve okunmamış sayısı (yalnız bu oturumda)
  const convo=new Map<string,Line[]>(),unread=new Map<string,number>(),peerEl=root.querySelector<HTMLElement>('.chat-peer')!;let peer:{id:string;nick:string}|null=null;
  const badge=()=>{const n=[...unread.values()].reduce((a,b)=>a+b,0);root.querySelectorAll<HTMLElement>('.chat-n').forEach(b=>{b.hidden=!n;b.textContent=n>9?'9+':`+${n}`;});};
    const time=(t:number)=>new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  function render(){root.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach(b=>b.classList.toggle('active',b.dataset.chatTab===tab));
    const noFleet=tab==='fleet'&&!me().tag,noPeer=tab==='pm'&&!peer;input.disabled=noFleet||noPeer;input.placeholder=noFleet?'Filo sohbeti için bir filoya katıl':tab==='global'?'Herkese yaz…':tab==='pm'?(peer?`${peer.nick} kaptanına yaz…`:'Önce bir arkadaş seç'):'Filona yaz…';
    peerEl.hidden=tab!=='pm';if(tab==='pm'){const fr=pm?.friends()??[];if(peer)unread.delete(peer.id);badge();
      peerEl.innerHTML=fr.length?fr.map(f=>`<button data-peer="${esc(f.id)}" class="${peer?.id===f.id?'on':''} ${f.on?'':'off'}">${esc(f.nick)}${unread.get(f.id)?`<i>+${unread.get(f.id)}</i>`:''}</button>`).join(''):'<small>Arkadaş listen boş · Arkadaşlar menüsünden ekle</small>';
      peerEl.querySelectorAll<HTMLButtonElement>('[data-peer]').forEach(b=>b.onclick=e=>{e.stopPropagation();const f=fr.find(x=>x.id===b.dataset.peer);if(f){peer={id:f.id,nick:f.nick};render();input.focus();}});}
    const list=tab==='pm'?(peer?convo.get(peer.id)??[]:[]):lines[tab];
    const intro:Line={who:'',text:tab==='global'?'Global sohbet · çevrim içi bütün kaptanlar görür.':tab==='pm'?(peer?`${peer.nick} ile özel sohbet · yalnız ikiniz görür. Küfür hesabın kapatılmasına yol açar.`:'Özel mesaj · yalnız arkadaşların arasında.'):noFleet?'Henüz bir filoda değilsin.':'Filo sohbeti · yalnızca filo üyeleri görür.',at:0,system:true};
    log.innerHTML=[intro,...list].map(l=>l.system?`<p class="sys">${esc(l.text)}</p>`:`<p${l.adm?' class="adm"':''}><time>${time(l.at)}</time><b${!l.adm&&plainNick(l.who)!==me().nick?` data-who="${esc(plainNick(l.who))}"`:''}>${esc(l.who)}:</b> ${esc(l.adm?l.text:filterChat(l.text))}</p>`).join('');log.scrollTop=log.scrollHeight;}
  function setOpen(v:boolean){open=v;root.classList.toggle('open',v);if(v){dot.hidden=true;render();}else input.blur();}
  root.querySelector<HTMLElement>('#chatToggle')!.onclick=()=>{if(dragged){dragged=false;return;}setOpen(!open);};
  root.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(dragged){dragged=false;return;}tab=b.dataset.chatTab as ChatTab;render();});
  // Pencerenin kendisine (mesajlar ve başlık boşluğu) tıklayınca kapanır
  box.addEventListener('click',e=>{if(dragged){dragged=false;return;}const t=e.target as HTMLElement;if(t.closest('.chat-form')||t.closest('[data-chat-tab]')||t.closest('.chat-menu')||t.closest('.chat-peer'))return;
    const who=t.closest<HTMLElement>('[data-who]');if(who){e.stopPropagation();showMenu(who);return;}setOpen(false);});
  // Ada dokununca: Bildir / Engelle (Apple ve Google, sohbetli oyunlarda bildirme ve engellemeyi şart koşar)
  function showMenu(el:HTMLElement){box.querySelector('.chat-menu')?.remove();const nick=el.dataset.who!,blocked=blockedList().includes(nick);
    const m=document.createElement('div');m.className='chat-menu';m.innerHTML=`<b>${esc(nick)}</b><button data-a="report">BİLDİR</button><button data-a="block">${blocked?'ENGELİ KALDIR':'ENGELLE'}</button><button data-a="x">KAPAT</button>`;
    box.append(m);m.onclick=ev=>{const a=(ev.target as HTMLElement).dataset.a;if(!a)return;m.remove();
      if(a==='report'){const why=(prompt(`${nick} kaptanını neden bildiriyorsun? (küfür, hakaret, hile, reklam…)`)||'').trim();if(why)onReport?.(nick,why);}
      if(a==='block'){const l=blockedList();setBlocked(blocked?l.filter(x=>x!==nick):[...l,nick]);if(!blocked){lines.global=lines.global.filter(x=>plainNick(x.who)!==nick);}render();}};}
  // Sürükleme: 6 px'ten fazla kayınca taşıma başlar (kısa dokunuş tıklama sayılır)
  let dragged=false;
  const place=(left:number,bottom:number)=>{const w=root.offsetWidth||50;left=Math.max(0,Math.min(innerWidth-w,left));bottom=Math.max(0,Math.min(innerHeight-60,bottom));root.style.left=`${left}px`;root.style.bottom=`${bottom}px`;return{left,bottom};};
  try{const p=JSON.parse(localStorage.getItem(POS)||'null');if(p&&typeof p.left==='number')requestAnimationFrame(()=>place(p.left,p.bottom));}catch{}
  const startDrag=(e:PointerEvent)=>{if(e.button>0)return;const t=e.target as HTMLElement;if(t.closest('.chat-close'))return;
    const r=root.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,l0=r.left,b0=innerHeight-r.bottom;let moving=false,last={left:l0,bottom:b0};
    const move=(ev:PointerEvent)=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(!moving&&Math.hypot(dx,dy)<6)return;moving=true;dragged=true;root.classList.add('dragging');last=place(l0+dx,b0-dy);};
    const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);root.classList.remove('dragging');if(moving){try{localStorage.setItem(POS,JSON.stringify(last));}catch{}setTimeout(()=>{dragged=false;},0);}};
    addEventListener('pointermove',move);addEventListener('pointerup',up);};
  root.querySelector<HTMLElement>('.chat-tabs')!.addEventListener('pointerdown',startDrag);
  root.querySelector<HTMLElement>('#chatToggle')!.addEventListener('pointerdown',startDrag);
  root.querySelector<HTMLFormElement>('#chatForm')!.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text||input.disabled)return;
    if(tab==='pm'){if(peer)pm?.send(peer.id,text);input.value='';return;}
    const m=me(),who=(m.tag?`[${m.tag}]`:'')+m.nick;lines[tab].push({who,text,at:Date.now(),adm:!!m.adm});onSend?.(tab,who,text);lines[tab]=lines[tab].slice(-KEEP);input.value='';render();};
  input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')setOpen(false);});
  dot.hidden=true;
  // Sunucudan gelen mesaj
  const receive=(who:string,text:string,at:number,adm=false)=>{if(!adm&&blockedList().includes(plainNick(who)))return;lines.global.push({who,text,at,adm});lines.global=lines.global.slice(-KEEP);if(open&&tab==='global')render();else dot.hidden=false;};
  const system=(text:string)=>{lines.global.push({who:'',text,at:Date.now(),system:true});lines.global=lines.global.slice(-KEEP);if(open)render();};
  // Özel mesaj: gelen ve gönderilen (sunucunun onayladığı) mesajlar konuşmaya eklenir; açık değilse okunmamış sayılır
  const pmReceive=(d:{peer:string;peerNick:string;who:string;text:string;at:number;mine:boolean})=>{const l=convo.get(d.peer)??[];l.push({who:d.who,text:d.text,at:d.at});convo.set(d.peer,l.slice(-KEEP));
    if(!d.mine&&!(open&&tab==='pm'&&peer?.id===d.peer)){unread.set(d.peer,(unread.get(d.peer)??0)+1);if(!peer)peer={id:d.peer,nick:d.peerNick};}badge();if(open&&tab==='pm')render();};
  const openPm=(id:string,nick:string)=>{peer={id,nick};tab='pm';setOpen(true);render();input.focus();};
  const pmSystem=(text:string)=>{if(peer){const l=convo.get(peer.id)??[];l.push({who:'',text,at:Date.now(),system:true});convo.set(peer.id,l.slice(-KEEP));}if(open)render();};
  return{system,receive,pmReceive,openPm,pmSystem,refresh:()=>{if(open&&tab==='pm')render();},open:()=>setOpen(true),close:()=>setOpen(false),isOpen:()=>open};
}
