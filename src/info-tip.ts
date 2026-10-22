// Bilgi işareti (i): uzun açıklamalar pencereyi doldurmasın diye küçük bir düğmenin arkasında durur.
// Fareyle üstüne gelince ya da dokununca baloncuk açılır; başka yere dokununca kapanır. İçerik HTML olabilir.
import './info-tip.css';
// Aynı metin tek kez saklanır (pencereler saniyede bir yeniden çizilse de liste büyümez)
const tips:string[]=[],ids=new Map<string,number>();
export function infoTip(html:string,label=''){let id=ids.get(html);if(id===undefined){id=tips.push(html)-1;ids.set(html,id);}
  return`<span role="button" tabindex="0" class="info-i${label?' lbl':''}" data-tip="${id}" aria-label="Bilgi">${label?`<span>${label}</span>`:''}<i>i</i></span>`;}
const pop=document.createElement('div');pop.className='info-pop';pop.hidden=true;document.body.append(pop);
let owner:HTMLElement|null=null,pinned=false;
function show(b:HTMLElement){const html=tips[Number(b.dataset.tip)];if(html===undefined)return;owner=b;pop.innerHTML=html;pop.hidden=false;
  const r=b.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;let x=Math.min(innerWidth-w-8,Math.max(8,r.left+r.width/2-w/2)),y=r.bottom+8;
  if(y+h>innerHeight-8)y=Math.max(8,r.top-h-8);pop.style.left=`${x}px`;pop.style.top=`${y}px`;}
function hide(){pop.hidden=true;owner=null;pinned=false;}
const tipOf=(t:EventTarget|null)=>(t as HTMLElement|null)?.closest?.('.info-i') as HTMLElement|null;
addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||pinned)return;const b=tipOf(e.target);if(b)show(b);});
addEventListener('pointerout',e=>{if(e.pointerType!=='mouse'||pinned)return;const b=tipOf(e.target);if(b&&!b.contains(e.relatedTarget as Node))hide();});
addEventListener('click',e=>{const b=tipOf(e.target);if(b){e.preventDefault();e.stopPropagation();if(owner===b&&pinned){hide();return;}show(b);pinned=true;return;}if(!pop.contains(e.target as Node))hide();},true);
addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
