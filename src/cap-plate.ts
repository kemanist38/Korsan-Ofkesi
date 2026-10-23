// Üst bar: kılıçlı çerçeve; solda TP, ortada seviye rozeti, sağda HP, ortadaki parşömende SP. Çubuklar ve amblem oyunun kendi öğeleridir (kimlikleri aynı), yalnız yeni kutuya taşınır.
// Sohbet düğmesi parşömen; özel mesajlar sohbetin Özel sekmesinde (mühürlü mektup ikonu).
import './cap-plate.css';
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s);
export function setupCapPlate(o:{nick:()=>string;logout:()=>void;canLogout:()=>boolean}){
  setupSideButtons();setupMenuSpy();setupMenuLogout(o);setupMapExpand();
  const stats=$('.strip-stats');if(!stats)return;
  const plate=document.createElement('div');plate.className='cap-plate tb';
  plate.innerHTML='<div class="tb-tp"></div><div class="tb-lv"></div><div class="tb-hp"></div><div class="tb-sp"></div><i class="tb-lab l">TP</i><i class="tb-lab r">HP</i>';
  stats.after(plate);stats.classList.add('cp-empty');void o.nick;
  const lv=$('#level'),hp=stats.querySelector('.hp-line'),xp=stats.querySelector('.xp-line'),sp=stats.querySelector('.battle-line');
  if(lv)plate.querySelector('.tb-lv')!.append(lv);
  // Uzun değerler (ör. 125.000.000 / 250.000.000) kutuya sığana kadar küçülür; SP parşömeninde mevcut / sonraki rütbe yazar, sığmazsa küçülür
  const spv=document.createElement('em');spv.className='tb-spv';plate.querySelector('.tb-sp')!.append(spv);
  const cv=document.createElement('canvas').getContext('2d')!;
  const fit=()=>{for(const b of plate.querySelectorAll<HTMLElement>('.tb-tp b,.tb-hp b')){const txt=b.textContent??'',w=(b.parentElement?.querySelector('i')?.clientWidth??b.clientWidth)-8;if(b.dataset.t===`${txt}|${w}`)continue;b.dataset.t=`${txt}|${w}`;b.style.removeProperty('font-size');
      const cs=getComputedStyle(b),f=parseFloat(cs.fontSize);cv.font=`${cs.fontWeight} ${f}px ${cs.fontFamily}`;const need=cv.measureText(txt).width*1.08+6;if(need>w&&w>0)b.style.setProperty('font-size',`${Math.max(6,f*w/need).toFixed(1)}px`,'important');}
    const t=`SP ${(sp?.querySelector('b')?.textContent??'').trim()}`;if(spv.textContent!==t){spv.textContent=t;spv.style.removeProperty('font-size');const cs=getComputedStyle(spv),f=parseFloat(cs.fontSize),w=spv.parentElement!.clientWidth-4;cv.font=`${cs.fontWeight} ${f}px ${cs.fontFamily}`;const need=cv.measureText(t).width*1.08;if(need>w&&w>0)spv.style.setProperty('font-size',`${Math.max(5.5,f*w/need).toFixed(1)}px`,'important');spv.title=`Savaş puanı: ${t.slice(3)} (sonraki rütbe)`;}};
  fit();setInterval(fit,250);if(hp)plate.querySelector('.tb-hp')!.append(hp);if(xp)plate.querySelector('.tb-tp')!.append(xp);if(sp)plate.querySelector('.tb-sp')!.append(sp);
  // Sohbet: parşömen ikonu
  const ct=$('#chatToggle');if(ct){ct.querySelector('svg')?.remove();const im=document.createElement('img');im.src='/assets/icon-chat-v1.webp';im.alt='';im.draggable=false;ct.prepend(im);ct.classList.add('cp-chat');}
}
// Dünya mini harita büyüyünce ortasında; Görevler, Grup, Arkadaşlar, Arena sağ üstte; Etkinlikler menüde, o günün etkinliği mini haritanın sağında kısa yazıyla
function setupSideButtons(){const cl=$('.map-cluster');if(!cl)return;cl.classList.add('cp-side');
  const badge=$<HTMLButtonElement>('.map-cluster .day-badge'),pop=$('.map-cluster .day-pop');
  // Kısayollar sağ üstte tek sıra
  const row=document.createElement('div');row.className='cp-top';document.body.append(row);
  for(const q of ['#openQuestTop','.grp-btn','.fr-btn','.arena-button','#openShop','#openMenu']){const b=$(q);if(b)row.append(b);}
  for(const [q,t] of [['#openShop','MARKET'],['#openMenu','MENÜ']] as const){const b=$(q);if(b&&!b.querySelector('span')){const sp=document.createElement('span');sp.textContent=t;b.append(sp);}}
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
