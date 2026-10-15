// Sohbet penceresi (sol alt): Global ve Filo sekmeleri. Mesajlar hiçbir yerde saklanmaz: yalnızca açık oturumda, son 20 mesaj
// tutulur; sayfa yenilenince ya da oyuna yeniden girince sohbet boş başlar.
// Pencerenin mesaj alanına ya da başlığına tıklamak pencereyi küçültüp kapatır; yazı kutusu ve sekmeler kapatmaz.
// Sohbet (açıkken başlıktan, küçükken yuvarlak düğmeden) tutulup ekranda istenen yere taşınabilir; yeri bu cihazda saklanır.
export type ChatTab='global'|'fleet';
type Line={who:string;text:string;at:number;system?:boolean};
const OLD_STORAGE='yedi-deniz-chat-v1',POS='yedi-deniz-chat-pos',KEEP=20;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
// Eski sürümün tarayıcıda biriktirdiği sohbet kaydı silinir
try{localStorage.removeItem(OLD_STORAGE);}catch{}

export function setupChat(me:()=>{nick:string;tag:string|null},onSend?:(tab:ChatTab,who:string,text:string)=>void){
  const root=document.createElement('div');root.className='chat';
  root.innerHTML=`<section class="chat-box" id="chatBox" aria-label="Sohbet"><header class="chat-tabs"><button data-chat-tab="global">Global</button><button data-chat-tab="fleet">Filo</button><span class="chat-close" title="Kapat">×</span></header>
    <div class="chat-log" id="chatLog"></div><form class="chat-form" id="chatForm"><input id="chatInput" maxlength="120" autocomplete="off" placeholder="Mesaj yaz…"/><button type="submit">Gönder</button></form></section>
    <button class="chat-toggle" id="chatToggle" aria-label="Sohbet" title="Sohbet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><i class="chat-dot"></i></button>`;
  document.body.append(root);
  const box=root.querySelector<HTMLElement>('#chatBox')!,log=root.querySelector<HTMLElement>('#chatLog')!,input=root.querySelector<HTMLInputElement>('#chatInput')!,dot=root.querySelector<HTMLElement>('.chat-dot')!;
  const lines:Record<ChatTab,Line[]>={global:[],fleet:[]};let tab:ChatTab='global',open=false;
    const time=(t:number)=>new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  function render(){root.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach(b=>b.classList.toggle('active',b.dataset.chatTab===tab));
    const noFleet=tab==='fleet'&&!me().tag;input.disabled=noFleet;input.placeholder=noFleet?'Filo sohbeti için bir filoya katıl':tab==='global'?'Herkese yaz…':'Filona yaz…';
    const intro:Line={who:'',text:tab==='global'?'Global sohbet · çevrim içi bütün kaptanlar görür.':noFleet?'Henüz bir filoda değilsin.':'Filo sohbeti · yalnızca filo üyeleri görür.',at:0,system:true};
    log.innerHTML=[intro,...lines[tab]].map(l=>l.system?`<p class="sys">${esc(l.text)}</p>`:`<p><time>${time(l.at)}</time><b>${esc(l.who)}:</b> ${esc(l.text)}</p>`).join('');log.scrollTop=log.scrollHeight;}
  function setOpen(v:boolean){open=v;root.classList.toggle('open',v);if(v){dot.hidden=true;render();}else input.blur();}
  root.querySelector<HTMLElement>('#chatToggle')!.onclick=()=>{if(dragged){dragged=false;return;}setOpen(!open);};
  root.querySelectorAll<HTMLButtonElement>('[data-chat-tab]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(dragged){dragged=false;return;}tab=b.dataset.chatTab as ChatTab;render();});
  // Pencerenin kendisine (mesajlar ve başlık boşluğu) tıklayınca kapanır
  box.addEventListener('click',e=>{if(dragged){dragged=false;return;}const t=e.target as HTMLElement;if(t.closest('.chat-form')||t.closest('[data-chat-tab]'))return;setOpen(false);});
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
    const m=me(),who=(m.tag?`[${m.tag}]`:'')+m.nick;lines[tab].push({who,text,at:Date.now()});onSend?.(tab,who,text);lines[tab]=lines[tab].slice(-KEEP);input.value='';render();};
  input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')setOpen(false);});
  dot.hidden=true;
  // Sunucudan gelen mesaj
  const receive=(who:string,text:string,at:number)=>{lines.global.push({who,text,at});lines.global=lines.global.slice(-KEEP);if(open&&tab==='global')render();else dot.hidden=false;};
  return{receive,open:()=>setOpen(true),close:()=>setOpen(false),isOpen:()=>open};
}
