// Kaptan plakası: üst çerçevenin ortasından sarkan plaka; solda seviye amblemi (yuvarlak, altın halkalı), sağda kaptan adı,
// SP, can (HP) ve TP çubukları. Çubuklar ve amblem oyunun kendi öğeleridir (kimlikleri aynı), yalnız yeni kutuya taşınır.
// Sohbet düğmesi parşömen; özel mesajlar sohbetin Özel sekmesinde (mühürlü mektup ikonu).
import './cap-plate.css';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s);
export function setupCapPlate(o:{nick:()=>string;logout:()=>void;canLogout:()=>boolean}){
  setupSideButtons();setupMenuSpy();setupMenuLogout(o);setupMapExpand();
  const stats=$('.strip-stats');if(!stats)return;
  const plate=document.createElement('div');plate.className='cap-plate';
  plate.innerHTML='<div class="cp-socket"></div><div class="cp-info"><div class="cp-row"><b class="cp-nick"></b><span class="cp-sp"></span></div><div class="cp-hp"></div><div class="cp-tp"></div></div>';
  stats.after(plate);stats.classList.add('cp-empty');
  const lv=$('#level'),hp=stats.querySelector('.hp-line'),xp=stats.querySelector('.xp-line'),sp=stats.querySelector('.battle-line');
  if(lv)plate.querySelector('.cp-socket')!.append(lv);if(hp)plate.querySelector('.cp-hp')!.append(hp);if(xp)plate.querySelector('.cp-tp')!.append(xp);if(sp)plate.querySelector('.cp-sp')!.append(sp);
  const nick=plate.querySelector<HTMLElement>('.cp-nick')!;const setNick=()=>{const n=o.nick();if(nick.textContent!==n)nick.textContent=n;};setNick();setInterval(setNick,2000);
  // Sohbet: parşömen ikonu
  const ct=$('#chatToggle');if(ct){ct.querySelector('svg')?.remove();const im=document.createElement('img');im.src='/assets/icon-chat-v1.webp';im.alt='';im.draggable=false;ct.prepend(im);ct.classList.add('cp-chat');}
}
// Dünya mini harita büyüyünce ortasında; Görevler, Grup, Arkadaşlar, Arena sağ üstte; Etkinlikler menüde, o günün etkinliği mini haritanın sağında kısa yazıyla
function setupSideButtons(){const cl=$('.map-cluster');if(!cl)return;cl.classList.add('cp-side');
  const badge=$<HTMLButtonElement>('.map-cluster .day-badge'),pop=$('.map-cluster .day-pop');
  // Kısayollar sağ üstte tek sıra
  const row=document.createElement('div');row.className='cp-top';document.body.append(row);
  for(const q of ['#openQuestTop','.grp-btn','.fr-btn','.arena-button']){const b=$(q);if(b)row.append(b);}
  // Etkinlik penceresi: mini haritanın sağındaki kısa etkinlik yazısının altında açılır
  if(pop&&badge){document.body.append(pop);pop.classList.add('cp-pop');
    new MutationObserver(()=>{if(!pop.classList.contains('open'))return;const r=badge.getBoundingClientRect();pop.style.left=`${Math.round(r.left)}px`;pop.style.top=`${Math.round(r.bottom+6)}px`;}).observe(pop,{attributes:true,attributeFilter:['class']});}
  // Kısa yazıya dokununca yalnız o günün etkinliğinin bilgisi; bütün liste menüdeki Etkinlikler'de
  let full=false;const tip=document.createElement('div');tip.className='cp-daytip';tip.hidden=true;document.body.append(tip);
  badge?.addEventListener('click',e=>{if(full){full=false;return;}e.stopImmediatePropagation();e.stopPropagation();
    if(!tip.hidden){tip.hidden=true;return;}const t=badge.title,i=t.indexOf(': ');if(i<0)return;
    tip.innerHTML=`<b>${t.slice(0,i)}</b><p>${t.slice(i+2)}</p>${badge.classList.contains('live')?'<small>Katılmak için Menü → Etkinlikler</small>':''}`;
    const r=badge.getBoundingClientRect();tip.style.left=`${Math.round(r.left)}px`;tip.style.top=`${Math.round(r.bottom+6)}px`;tip.hidden=false;},{capture:true});
  document.addEventListener('pointerdown',e=>{if(!tip.hidden&&e.target!==badge&&!tip.contains(e.target as Node))tip.hidden=true;},{capture:true});
  // Menüde Etkinlikler
  const grid=$('#menuOverlay .menu-grid');if(grid&&badge){const m=document.createElement('button');m.id='menuEvents';m.innerHTML='<img src="/assets/icon-events-v1.webp" alt="" draggable="false"/><span>ETKİNLİKLER</span>';
    m.onclick=e=>{e.stopPropagation();$('#menuOverlay')?.classList.remove('open');full=true;badge.click();};grid.prepend(m);}}
// Casus: menü penceresinin başında
function setupMenuSpy(){const spy=$('#spyGo'),grid=$('#menuOverlay .menu-grid');if(!spy||!grid)return;
  const w=document.createElement('div');w.className='cp-spy';w.innerHTML='<img src="/assets/icon-spy-v1.webp" alt="" draggable="false"/><b>CASUS GÖNDER</b>';w.append(spy);grid.before(w);}
// Çıkış: köşe düğmesi yerine menünün içinde (aynı bekleme süresiyle)
function setupMenuLogout(o:{logout:()=>void;canLogout:()=>boolean}){const grid=$('#menuOverlay .menu-grid'),corner=$('#logoutCorner');if(!grid)return;
  const b=document.createElement('button');b.id='menuLogout';b.innerHTML=`${corner?.innerHTML??''}<span>ÇIKIŞ YAP</span>`;b.onclick=()=>o.logout();grid.append(b);corner?.classList.add('cp-hide');
  const sync=()=>{b.hidden=!o.canLogout();};sync();setInterval(sync,1000);}
// Mini harita: ilk dokunuşta büyür ve yanında Dünya düğmesi çıkar; büyükken dokunmak haritada gezdirir.
// Dışarıya dokununca ya da 10 sn dokunulmayınca küçülür.
function setupMapExpand(){const cl=$('.map-cluster'),mm=$('#minimap');if(!cl||!mm)return;let t=0;
  const shut=()=>{cl.classList.remove('mm-big');clearTimeout(t);},arm=()=>{clearTimeout(t);t=setTimeout(shut,10_000) as unknown as number;};
  mm.addEventListener('pointerdown',e=>{if(!cl.classList.contains('mm-big')){e.stopImmediatePropagation();e.preventDefault();cl.classList.add('mm-big');}arm();},{capture:true});
  document.addEventListener('pointerdown',e=>{if(cl.classList.contains('mm-big')&&!cl.contains(e.target as Node))shut();},{capture:true});
  $('#openWorldMap')?.addEventListener('click',shut);}
