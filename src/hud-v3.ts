// Arayüz v3: üst çerçeve kalkar. Sol üstte kaptan plakası (seviye amblemi, ad, can, TP, SP), altında pusula çerçeveli
// yuvarlak mini harita ve konum satırı, haritanın sağında 2 sütunlu menü düğmeleri; sağ üstte altın ve inci.
// Var olan öğeler (kimlikleri ve olayları aynı kalarak) yeni kutulara taşınır; yalnız yerleşim ve görünüm değişir.
import './hud-v3.css';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s);
export function setupHudV3(o:{nick:()=>string;openDay:()=>void}){
  const root=document.createElement('div');root.className='hud3';document.body.append(root);document.body.classList.add('hud-v3');
  // Kaptan plakası
  const plate=document.createElement('div');plate.className='h3-plate';
  plate.innerHTML='<div class="h3-socket"></div><div class="h3-info"><div class="h3-row"><b class="h3-nick"></b><span class="h3-sp"></span></div><div class="h3-hp"></div><div class="h3-tp"></div></div>';
  root.append(plate);
  const lv=$('#level');if(lv)plate.querySelector('.h3-socket')!.append(lv);
  const hp=$('.strip-stats .hp-line'),xp=$('.strip-stats .xp-line'),sp=$('.strip-stats .battle-line');
  if(hp)plate.querySelector('.h3-hp')!.append(hp);if(xp)plate.querySelector('.h3-tp')!.append(xp);if(sp)plate.querySelector('.h3-sp')!.append(sp);
  const net=$('#netPill');if(net)plate.append(net);
  const nick=plate.querySelector<HTMLElement>('.h3-nick')!;const setNick=()=>{const n=o.nick();if(nick.textContent!==n)nick.textContent=n;};setNick();setInterval(setNick,2000);
  // Mini harita: pusula çerçevesi, yuvarlak deniz, konum satırı (dokununca koordinata git açılır)
  const map=document.createElement('div');map.className='h3-map';
  map.innerHTML='<div class="h3-sea"></div><img class="h3-frame" src="/assets/hud-minimap-frame-v1.webp" alt="" draggable="false"/>';root.append(map);
  const cv=$('#minimap');if(cv)map.querySelector('.h3-sea')!.append(cv);
  const zoom=$('.map-cluster .zoom-controls');if(zoom)map.append(zoom);
  const loc=document.createElement('div');loc.className='h3-loc';root.append(loc);
  const badge=$('#mapBadge');if(badge)loc.append(badge);
  const go=$('#coordGo');if(go){loc.append(go);go.classList.add('h3-go');}
  badge?.addEventListener('click',()=>go?.classList.toggle('open'));
  // Menü düğmeleri (haritanın sağında, 2 sütun)
  const btns=document.createElement('div');btns.className='h3-btns';root.append(btns);
  for(const s of ['.fr-btn','.grp-btn','#openWorldMap','#openQuestTop','.arena-button']){const b=$(s);if(b)btns.append(b);}
  const ev=document.createElement('button');ev.className='world-map-button h3-ev';ev.setAttribute('aria-label','Etkinlikler');ev.innerHTML='<img src="/assets/icon-events-v1.webp" alt="" draggable="false"/><span>ETKİNLİKLER</span>';
  ev.onclick=e=>{e.stopPropagation();o.openDay();};btns.append(ev);
  const pop=$('.day-pop');if(pop)btns.append(pop);
  // Sağ üst: altın ve inci (sayılar oyunun kendi sayaçlarından kopyalanır)
  const res=document.createElement('div');res.className='h3-res';res.innerHTML='<span><i class="sprite icon-gold"></i><b data-k="stripGold"></b></span><span><i class="sprite icon-pearl"></i><b data-k="stripPearls"></b><button aria-label="İnci satın al">+</button></span>';
  document.body.append(res);
  const sync=()=>res.querySelectorAll<HTMLElement>('b[data-k]').forEach(b=>{const t=document.getElementById(b.dataset.k!)?.textContent??'';if(b.textContent!==t)b.textContent=t;});
  sync();setInterval(sync,500);res.querySelector('button')!.onclick=()=>$<HTMLButtonElement>('#stripPearlPlus')?.click();
  // Casus: menü penceresinin başına
  const spy=$('#spyGo'),grid=$('#menuOverlay .menu-grid');if(spy&&grid){const w=document.createElement('div');w.className='h3-spy';w.innerHTML='<b>CASUS GÖNDER</b>';w.append(spy);grid.before(w);}
}
