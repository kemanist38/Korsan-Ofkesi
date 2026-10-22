// Kaptan plakası: üst çerçevenin ortasından sarkan plaka; solda seviye amblemi (yuvarlak, altın halkalı), sağda kaptan adı,
// SP, can (HP) ve TP çubukları. Çubuklar ve amblem oyunun kendi öğeleridir (kimlikleri aynı), yalnız yeni kutuya taşınır.
// Sohbet düğmesi parşömen, sağ üstte özel mesajlar için mühürlü mektup.
import './cap-plate.css';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s);
export function setupCapPlate(o:{nick:()=>string;logout:()=>void;canLogout:()=>boolean}){
  setupSideButtons();setupMenuSpy();setupMenuLogout(o);
  const stats=$('.strip-stats');if(!stats)return;
  const plate=document.createElement('div');plate.className='cap-plate';
  plate.innerHTML='<div class="cp-socket"></div><div class="cp-info"><div class="cp-row"><b class="cp-nick"></b><span class="cp-sp"></span></div><div class="cp-hp"></div><div class="cp-tp"></div></div>';
  stats.after(plate);stats.classList.add('cp-empty');
  const lv=$('#level'),hp=stats.querySelector('.hp-line'),xp=stats.querySelector('.xp-line'),sp=stats.querySelector('.battle-line');
  if(lv)plate.querySelector('.cp-socket')!.append(lv);if(hp)plate.querySelector('.cp-hp')!.append(hp);if(xp)plate.querySelector('.cp-tp')!.append(xp);if(sp)plate.querySelector('.cp-sp')!.append(sp);
  const nick=plate.querySelector<HTMLElement>('.cp-nick')!;const setNick=()=>{const n=o.nick();if(nick.textContent!==n)nick.textContent=n;};setNick();setInterval(setNick,2000);
  // Sohbet: parşömen ikonu
  const ct=$('#chatToggle');if(ct){ct.querySelector('svg')?.remove();const im=document.createElement('img');im.src='/assets/icon-chat-v1.webp';im.alt='';im.draggable=false;ct.prepend(im);ct.classList.add('cp-chat');}
  // Mektup: sohbetin Özel sekmesini açar; okunmamış sayısı sohbet düğmesindekiyle aynı
  const corner=$('.corner-buttons');if(corner){const m=document.createElement('button');m.className='round-button cp-mail';m.setAttribute('aria-label','Özel mesajlar');
    m.innerHTML='<img src="/assets/icon-mail-v1.webp" alt="" draggable="false"/><i class="chat-n" hidden></i>';corner.prepend(m);
    const n=m.querySelector<HTMLElement>('.chat-n')!;setInterval(()=>{const c=$('#chatToggle .chat-n');n.hidden=!c||c.hidden;n.textContent=c?.textContent??'';},500);
    m.onclick=()=>{if(!$('.chat')?.classList.contains('open'))$<HTMLButtonElement>('#chatToggle')?.click();$<HTMLButtonElement>('[data-chat-tab="pm"]')?.click();};}
}
// Haritanın sağında Dünya; Görevler, Grup, Arkadaşlar, Arena ve Etkinlikler sol üstte tek sırada
function setupSideButtons(){const cl=$('.map-cluster');if(!cl)return;
  const ev=document.createElement('button');ev.type='button';ev.className='world-map-button cp-ev';ev.setAttribute('aria-label','Etkinlikler');
  ev.innerHTML='<img src="/assets/icon-events-v1.webp" alt="" draggable="false"/><span>ETKİNLİKLER</span>';
  ev.onclick=e=>{e.stopPropagation();$<HTMLButtonElement>('.map-cluster .day-badge')?.click();};cl.classList.add('cp-side');
  // Dünya dışındakiler sol üstte tek sıra
  const row=document.createElement('div');row.className='cp-top';document.body.append(row);
  for(const q of ['#openQuestTop','.grp-btn','.fr-btn','.arena-button']){const b=$(q);if(b)row.append(b);}row.append(ev);}
// Casus: menü penceresinin başında
function setupMenuSpy(){const spy=$('#spyGo'),grid=$('#menuOverlay .menu-grid');if(!spy||!grid)return;
  const w=document.createElement('div');w.className='cp-spy';w.innerHTML='<img src="/assets/icon-spy-v1.webp" alt="" draggable="false"/><b>CASUS GÖNDER</b>';w.append(spy);grid.before(w);}
// Çıkış: köşe düğmesi yerine menünün içinde (aynı bekleme süresiyle)
function setupMenuLogout(o:{logout:()=>void;canLogout:()=>boolean}){const grid=$('#menuOverlay .menu-grid'),corner=$('#logoutCorner');if(!grid)return;
  const b=document.createElement('button');b.id='menuLogout';b.innerHTML=`${corner?.innerHTML??''}<span>ÇIKIŞ YAP</span>`;b.onclick=()=>o.logout();grid.append(b);corner?.classList.add('cp-hide');
  const sync=()=>{b.hidden=!o.canLogout();};sync();setInterval(sync,1000);}
