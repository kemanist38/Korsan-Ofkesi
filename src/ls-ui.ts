// Arena penceresi (Deniz Hakimiyeti · Lanetli Sular) ve Lanetli Sular arayüzü: 10 karelik giriş, maç üst çubuğu, eleme/sonuç ekranı.
// Kurallar sunucuda (src/cursed.ts, server/game-server.mjs); bu dosya yalnızca sunucudan gelen durumu gösterir.
import './dom.css';
import {DOM_TEAMS,DOM_NAME} from './domination';
import {LS_ITEMS,type LsDrop,type LsInv,type LsItem,LS_NAME,LS_SIZE,LS_ICON,LS_PEARLS,LS_PEARLS_REST,LS_KILL_PEARLS,LS_EP_PER_BALL,LS_PHASE_MS,LS_RADII,type LsFog} from './cursed';
import {sendLs,netOnline} from './net';

const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
function makeOverlay(eyebrow:string,title:string){const o=document.createElement('div');o.className='quest-overlay dom-overlay';
  o.innerHTML=`<section class="quest-log dom-log"><header><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div><button class="dom-close" aria-label="Kapat">×</button></header><div class="dom-body"></div></section>`;
  document.body.appendChild(o);return{o,body:o.querySelector<HTMLElement>('.dom-body')!,close:o.querySelector<HTMLButtonElement>('.dom-close')!};}

// ---- Arena: iki oyun modu kartı
const arena=makeOverlay('Oyun modları','ARENA');
arena.close.onclick=()=>arena.o.classList.remove('open');arena.o.onclick=e=>{if(e.target===arena.o)arena.o.classList.remove('open');};
export function openArena(openDom:()=>void,openLs:()=>void){
  arena.body.innerHTML=`<div class="arena-modes">
    <button class="arena-mode dom" data-mode="dom"><span class="arena-icons"><img src="${DOM_TEAMS.r.icon}" alt=""/><img src="${DOM_TEAMS.b.icon}" alt=""/></span><b>${DOM_NAME}</b><small>3’e 3 takım savaşı · bölgeyi en çok tutan takım kazanır · 8 dk</small></button>
    <button class="arena-mode ls" data-mode="ls"><span class="arena-icons"><img src="${LS_ICON}" alt=""/></span><b>${LS_NAME}</b><small>10 kaptan · herkes eşit gemi · lanetli sis daralır, son kalan kazanır</small></button></div>
    <p class="dom-status">Açık: hafta içi 20:00–24:00 · cumartesi ve pazar tüm gün</p>`;
  arena.body.querySelector<HTMLButtonElement>('[data-mode="dom"]')!.onclick=()=>{arena.o.classList.remove('open');openDom();};
  arena.body.querySelector<HTMLButtonElement>('[data-mode="ls"]')!.onclick=()=>{arena.o.classList.remove('open');openLs();};
  arena.o.classList.add('open');}

// ---- Lanetli Sular girişi: 10 kare; sıraya giren yeşil olur, 10 olunca 15 sn sayılır
export type LsLobby={open:boolean;q:string[];me:boolean;at:number;live:number};
let lobby:LsLobby|null=null,timer=0,blocked:(()=>string|null)|null=null;
const lob=makeOverlay('10 kaptan · son kalan kazanır',LS_NAME.toLocaleUpperCase('tr'));
lob.close.onclick=()=>closeLsLobby();lob.o.onclick=e=>{if(e.target===lob.o)closeLsLobby();};
export function openLsLobby(check?:()=>string|null){blocked=check??null;lob.o.classList.add('open');sendLs('watch',{on:true});render();clearInterval(timer);timer=setInterval(render,500) as unknown as number;}
export function closeLsLobby(){if(!lob.o.classList.contains('open'))return;lob.o.classList.remove('open');clearInterval(timer);if(!lobby?.me)sendLs('watch',{on:false});}
export function lsLobbyMsg(l:LsLobby){lobby=l;if(lob.o.classList.contains('open'))render();}
function render(){const l=lobby,count=l?.at?Math.max(0,Math.ceil((l.at-Date.now())/1000)):0,why=blocked?.()??null,off=!netOnline();
  const names=Array.from({length:LS_SIZE},(_,i)=>l?.q[i]??null);
  const status=off?'Sunucuya bağlanılıyor…':!l?'Bekleniyor…':l.at?`Kaptanlar hazır · lanetli sulara <b>${count}</b> sn sonra açılıyorsunuz`:!l.open?'Kapalı · hafta içi 20:00–24:00, cumartesi ve pazar tüm gün açık':`${l.q.length}/${LS_SIZE} kaptan hazır${l.live?` · ${l.live} maç sürüyor`:''}`;
  const btn=l?.me?`<button class="dom-go leave" ${l.at?'disabled':''}>${l.at?'HAZIRLAN…':'SIRADAN ÇIK'}</button>`:`<button class="dom-go" ${!l?.open||off||why?'disabled':''}>${why??'SAVAŞA GİR'}</button>`;
  lob.body.innerHTML=`<div class="ls-head"><img src="${LS_ICON}" alt=""/></div><div class="ls-slots">${names.map(n=>`<div class="dom-slot ${n?'on':''}">${n?esc(n):'BOŞ'}</div>`).join('')}</div><p class="dom-status">${status}</p>${btn}
    <ul class="dom-rules"><li>Herkes <b>eşit gemiyle</b> girer: aynı can, tam top. Başlangıçta yalnızca demir gülle vardır (stoğundan düşmez).</li><li>Zincir, ateş, patlayıcı gülle, kara barut, kalkan ve hız iksiri <b>denize saçılmıştır</b>; üstünden geçerek topla, yenileri belirir. Şifa ve tamir yoktur.</li><li><b>Lanetli sandık</b> gökten düşer: yeri 10 sn önceden haritada gösterilir, ilk ulaşan büyük ganimeti alır.</li>
    <li>Lanetli sis ${LS_PHASE_MS/1000} sn'de bir daralır (${LS_RADII.length} aşama); sis dışında kalan gemi her saniye can kaybeder ve batar.</li>
    <li>Yeniden doğma yok: batan elenir. Son kalan kaptan 1. olur.</li>
    <li>Ödül: 1. ${LS_PEARLS[0]}, 2. ${LS_PEARLS[1]}, 3. ${LS_PEARLS[2]}, diğerleri ${LS_PEARLS_REST} inci · her batırma +${LS_KILL_PEARLS} inci · atılan güllelerin ${LS_EP_PER_BALL} katı elit puan. Maçtan ayrılan ödül alamaz.</li></ul>`;
  const b=lob.body.querySelector<HTMLButtonElement>('.dom-go');if(b)b.onclick=()=>sendLs('q',{on:!l?.me});}

// ---- Maç üst çubuğu: kalan kaptan, sis aşaması ve sonraki daralmaya kalan süre
export type LsRun={id:string;n:number;alive:number;fog:LsFog;off:number;start:number;kills:number;dead:boolean;inv:LsInv;items:[number,LsItem,number,number][];drops:LsDrop[];ammo:'iron'|'chain'|'fire'|'explosive';powder:boolean};
export type LsHooks={leave:()=>void;ammo:(a:LsRun['ammo'])=>void;powder:()=>void;speed:()=>void};
const hud=document.createElement('div');hud.className='dom-hud ls-hud';hud.hidden=true;document.body.appendChild(hud);
const inv=document.createElement('div');inv.className='ls-inv';inv.hidden=true;document.body.appendChild(inv);
export function renderLsHud(r:LsRun|null,h:LsHooks){const onLeave=h.leave;if(!r){hud.hidden=true;inv.hidden=true;return;}hud.hidden=false;const now=Date.now()+r.off;
  const next=r.fog.phase<LS_RADII.length?r.start+(r.fog.phase+1)*LS_PHASE_MS:0,left=Math.max(0,next-now),shrinking=now-r.fog.at<20_000&&r.fog.phase>0;
  const t=next?`${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,'0')}`:'—';
  hud.innerHTML=`<div class="dom-score"><img src="${LS_ICON}" alt=""/><b>${r.alive}</b><em class="ls-lbl">KALAN</em></div>
    <div class="dom-mid"><strong>${t}</strong><em class="${shrinking?'contest':''}">${shrinking?'SİS DARALIYOR':next?`SİS AŞAMA ${r.fog.phase}/${LS_RADII.length}`:'SİS KAPANIYOR'}</em><button class="dom-quit">AYRIL</button></div>
    <div class="dom-score"><em class="ls-lbl">BATIRMA</em><b>${r.kills}</b></div>`;
  // Maç envanteri: gülle seçimi, barut (aç/kapa), kalkan (isabette kendiliğinden), hız iksiri
  const am=(['iron','chain','fire','explosive'] as const).map(a=>{const n=a==='iron'?Infinity:r.inv[a];return`<button class="ls-it ${r.ammo===a?'on':''}" data-a="${a}" ${n<=0?'disabled':''}><img src="${a==='iron'?'/assets/ammo-iron-v2.webp':LS_ITEMS[a].icon}" alt=""/><b>${n===Infinity?'∞':n}</b></button>`;}).join('');
  inv.hidden=r.dead;inv.innerHTML=`${am}<i></i><button class="ls-it ${r.powder&&r.inv.powder>0?'on':''}" data-x="powder" ${r.inv.powder<=0?'disabled':''} title="Kara barut: açıkken salvo başına 1"><img src="${LS_ITEMS.powder.icon}" alt=""/><b>${r.inv.powder}</b></button>
    <span class="ls-it passive" title="Kalkan: isabet başına 1 harcanır"><img src="${LS_ITEMS.shield.icon}" alt=""/><b>${r.inv.shield}</b></span><button class="ls-it" data-x="speed" ${r.inv.speed<=0?'disabled':''} title="Hız iksiri"><img src="${LS_ITEMS.speed.icon}" alt=""/><b>${r.inv.speed}</b></button>`;
  inv.querySelectorAll<HTMLButtonElement>('[data-a]').forEach(b=>b.onclick=()=>h.ammo(b.dataset.a as LsRun['ammo']));
  inv.querySelector<HTMLButtonElement>('[data-x="powder"]')!.onclick=h.powder;inv.querySelector<HTMLButtonElement>('[data-x="speed"]')!.onclick=h.speed;
  hud.querySelector<HTMLButtonElement>('.dom-quit')!.onclick=()=>{if(r.dead||confirm('Maçtan ayrılırsan elenirsin ve ödül alamazsın. Ayrılmak istiyor musun?'))onLeave();};}

// ---- Eleme / sonuç ekranı
export type LsOut={rank:number;n:number;kills:number;pearls:number;ep:number;win?:boolean};
export function showLsResult(d:LsOut,onClose:()=>void){document.querySelector('.dom-result')?.remove();const el=document.createElement('div');el.className='dom-result ls-result';
  el.innerHTML=`<section><img src="${LS_ICON}" alt=""/><h2>${d.rank===1?'SON KAPTAN':`${d.rank}. OLDUN`}</h2><p>${d.rank===1?'Lanetli sulardan sağ çıkan tek kaptan sensin':`${d.n} kaptan arasında ${d.rank}. sıradasın`}</p>
    <div class="dom-final">${d.kills} batırma</div><div class="dom-rew"><b>+${d.pearls} İnci</b><b>+${d.ep} Elit Puan</b></div><button>LİMANA DÖN</button></section>`;
  document.body.appendChild(el);el.querySelector('button')!.onclick=()=>{el.remove();onClose();};}
