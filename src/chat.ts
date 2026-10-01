// Sohbet penceresi (sol alt): Global ve Filo sekmeleri. Sunucu gelene kadar yereldir; mesajlar yalnızca bu tarayıcıda görünür.
// Pencerenin mesaj alanına ya da başlığına tıklamak pencereyi küçültüp kapatır; yazı kutusu ve sekmeler kapatmaz.
export type ChatTab='global'|'fleet';
type Line={who:string;text:string;at:number;system?:boolean};
const STORAGE='yedi-deniz-chat-v1',KEEP=60;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
function load():Record<ChatTab,Line[]>{try{const r=JSON.parse(localStorage.getItem(STORAGE)||'null');if(r&&Array.isArray(r.global)&&Array.isArray(r.fleet))return r;}catch{}return{global:[],fleet:[]};}

export function setupChat(me:()=>{nick:string;tag:string|null}){
  const root=document.createElement('div');root.className='chat';
  root.innerHTML=`<section class="chat-box" id="chatBox" aria-label="Sohbet"><header class="chat-tabs"><button data-chat-tab="global">Global</button><button data-chat-tab="fleet">Filo</button><span class="chat-close" title="Kapat">×</span></header>
    <div class="chat-log" id="chatLog"></div><form class="chat-form" id="chatForm"><input id="chatInput" maxlength="120" autocomplete="off" placeholder="Mesaj yaz…"/><button type="submit">Gönder</button></form></section>
    <button class="chat-toggle" id="chatToggle" aria-label="Sohbet" title="Sohbet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><i class="chat-dot"></i></button>`;
  document.body.append(root);
  const box=root.querySelector<HTMLElement>('#chatBox')!,log=root.querySelector<HTMLElement>('#chatLog')!,input=root.querySelector<HTMLInputElement>('#chatInput')!,dot=root.querySelector<HTMLElement>('.chat-dot')!;
  const lines=load();let tab:ChatTab='global',open=false;
  const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(lines));}catch{}};
  const time=(t:number)=>new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  function render(){root.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach(b=>b.classList.toggle('active',b.dataset.chatTab===tab));
    const noFleet=tab==='fleet'&&!me().tag;input.disabled=noFleet;input.placeholder=noFleet?'Filo sohbeti için bir filoya katıl':tab==='global'?'Herkese yaz…':'Filona yaz…';
    const intro:Line={who:'',text:tab==='global'?'Global sohbet · sunucu gelene kadar mesajlar yalnızca sende görünür.':noFleet?'Henüz bir filoda değilsin.':'Filo sohbeti · yalnızca filo üyeleri görür.',at:0,system:true};
    log.innerHTML=[intro,...lines[tab]].map(l=>l.system?`<p class="sys">${esc(l.text)}</p>`:`<p><time>${time(l.at)}</time><b>${esc(l.who)}:</b> ${esc(l.text)}</p>`).join('');log.scrollTop=log.scrollHeight;}
  function setOpen(v:boolean){open=v;root.classList.toggle('open',v);if(v){dot.hidden=true;render();}else input.blur();}
  root.querySelector<HTMLElement>('#chatToggle')!.onclick=()=>setOpen(!open);
  root.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach(b=>b.onclick=e=>{e.stopPropagation();tab=b.dataset.chatTab as ChatTab;render();});
  // Pencerenin kendisine (mesajlar ve başlık boşluğu) tıklayınca kapanır
  box.addEventListener('click',e=>{const t=e.target as HTMLElement;if(t.closest('.chat-form')||t.closest('[data-chat-tab]'))return;setOpen(false);});
  root.querySelector<HTMLFormElement>('#chatForm')!.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text||input.disabled)return;
    const m=me();lines[tab].push({who:(m.tag?`[${m.tag}]`:'')+m.nick,text,at:Date.now()});lines[tab]=lines[tab].slice(-KEEP);save();input.value='';render();};
  input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')setOpen(false);});
  dot.hidden=true;
  return{open:()=>setOpen(true),close:()=>setOpen(false),isOpen:()=>open};
}
