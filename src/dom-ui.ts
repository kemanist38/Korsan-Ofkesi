// Deniz Hakimiyeti arayüzü: giriş penceresi (iki bölmede 3 + 3 kare), maç üst çubuğu ve sonuç ekranı.
// Kurallar sunucuda; bu dosya yalnızca sunucudan gelen durumu gösterir (src/domination.ts, server/game-server.mjs).
import './dom.css';
import {DOM_TEAMS,DOM_SIZE,DOM_WIN,DOM_MATCH_MS,DOM_PEARLS,DOM_EP_PER_BALL,type DomTeam} from './domination';
import {sendDom,netOnline} from './net';

export type DomLobby={open:boolean;q:string[];me:boolean;teams:{r:string[];b:string[]}|null;at:number;live:number};
export type DomRun={id:string;team:DomTeam;end:number;teams:{r:string[];b:string[]};s:[number,number];cap:number;own:DomTeam|null;c:boolean;n:[number,number];done:boolean};
export type DomEnd={win:DomTeam|null;s:[number,number];team:DomTeam;pearls:number;ep:number};

const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
let lobby:DomLobby|null=null,lobbyTimer=0,blocked:(()=>string|null)|null=null;
const overlay=document.createElement('div');overlay.className='quest-overlay dom-overlay';overlay.innerHTML='<section class="quest-log dom-log"><header><div><span class="eyebrow">3’e 3 takım savaşı</span><h2>DENİZ HAKİMİYETİ</h2></div><button class="dom-close" aria-label="Kapat">×</button></header><div class="dom-body"></div></section>';
document.body.appendChild(overlay);
const body=overlay.querySelector<HTMLElement>('.dom-body')!;
overlay.querySelector<HTMLButtonElement>('.dom-close')!.onclick=()=>closeDomLobby();
overlay.onclick=e=>{if(e.target===overlay)closeDomLobby();};

// Giriş penceresi: sıradaki kaptanlar kareleri sırayla yeşile boyar; altı kişi olunca sunucu takımları dengeler ve sayım başlar
export function openDomLobby(check?:()=>string|null){blocked=check??null;overlay.classList.add('open');sendDom('watch',{on:true});renderLobby();
  clearInterval(lobbyTimer);lobbyTimer=setInterval(renderLobby,500) as unknown as number;}
export function closeDomLobby(){if(!overlay.classList.contains('open'))return;overlay.classList.remove('open');clearInterval(lobbyTimer);if(!lobby?.me)sendDom('watch',{on:false});}
export const domLobbyOpen=()=>overlay.classList.contains('open');
function slots(team:DomTeam){const l=lobby;let names:(string|null)[];
  if(l?.teams)names=l.teams[team];else{const q=l?.q??[];names=q.filter((_,i)=>(i%2===0)===(team==='r'));}
  return Array.from({length:DOM_SIZE},(_,i)=>names[i]??null);}
function renderLobby(){const l=lobby,t=DOM_TEAMS,count=l?.at?Math.max(0,Math.ceil((l.at-Date.now())/1000)):0;
  const side=(k:DomTeam)=>`<div class="dom-side dom-${k}"><img src="${t[k].icon}" alt="" draggable="false"/><h3>${t[k].name}</h3><div class="dom-slots">${slots(k).map(n=>`<div class="dom-slot ${n?'on':''}">${n?esc(n):'BOŞ'}</div>`).join('')}</div></div>`;
  const why=blocked?.()??null,off=!netOnline();
  const status=off?'Sunucuya bağlanılıyor…':!l?'Bekleniyor…':l.teams?`Takımlar hazır · savaş <b>${count}</b> sn sonra başlıyor`:!l.open?'Kapalı · hafta içi 20:00–24:00, cumartesi ve pazar tüm gün açık':`${l.q.length}/${DOM_SIZE*2} kaptan hazır${l.live?` · ${l.live} maç sürüyor`:''}`;
  const btn=l?.me?`<button class="dom-go leave" ${l.teams?'disabled':''}>${l.teams?'HAZIRLAN…':'SIRADAN ÇIK'}</button>`:`<button class="dom-go" ${!l?.open||off||why?'disabled':''}>${why??'SAVAŞA GİR'}</button>`;
  body.innerHTML=`<div class="dom-vs">${side('r')}<b class="dom-x">VS</b>${side('b')}</div><p class="dom-status">${status}</p>${btn}
    <ul class="dom-rules"><li>Gemindeki malzeme ve güllelerle girersin; maç ${DOM_MATCH_MS/60000} dakika sürer.</li><li>Ortadaki <b>Hakimiyet Bölgesi</b>'ni tutan takımın sayacı ilerler; ${DOM_WIN} puana ulaşan ya da süre bitince önde olan kazanır.</li><li>Takımlar elit puana göre eşit dağıtılır.</li><li>Şifa güllesi ve tamir yoktur. Batan gemi üssünde doğar; 5 sn korunur ve 5 sn hareket edemez.</li><li>Ödül: kazanan ${DOM_PEARLS.win}, berabere ${DOM_PEARLS.draw}, kaybeden ${DOM_PEARLS.lose} inci + harcanan güllelerin ${DOM_EP_PER_BALL} katı elit puan (maç sonunda).</li></ul>`;
  const b=body.querySelector<HTMLButtonElement>('.dom-go');if(b)b.onclick=()=>{sendDom('q',{on:!l?.me});};}
export function domLobbyMsg(l:DomLobby){lobby=l;if(domLobbyOpen())renderLobby();}

// Maç üst çubuğu: takım puanları, kalan süre, bölge durumu
const hud=document.createElement('div');hud.className='dom-hud';hud.hidden=true;document.body.appendChild(hud);
export function renderDomHud(r:DomRun|null,onLeave:()=>void){if(!r){hud.hidden=true;return;}hud.hidden=false;
  const left=Math.max(0,r.end-Date.now()),mm=Math.floor(left/60000),ss=Math.floor(left/1000)%60,t=DOM_TEAMS;
  const zone=r.c?'<em class="contest">BÖLGE ÇEKİŞMELİ</em>':r.own?`<em style="color:${t[r.own].color}">BÖLGE: ${t[r.own].short}</em>`:'<em>BÖLGE BOŞ</em>';
  const capR=Math.max(0,r.cap),capB=Math.max(0,-r.cap);
  hud.innerHTML=`<div class="dom-score r ${r.team==='r'?'mine':''}"><img src="${t.r.icon}" alt=""/><b>${r.s[0]}</b><i><u style="width:${r.s[0]/DOM_WIN*100}%"></u></i></div>
    <div class="dom-mid"><strong>${mm}:${String(ss).padStart(2,'0')}</strong>${zone}<span class="dom-cap"><u class="r" style="width:${capR/2}%"></u><u class="b" style="width:${capB/2}%"></u></span><button class="dom-quit">AYRIL</button></div>
    <div class="dom-score b ${r.team==='b'?'mine':''}"><i><u style="width:${r.s[1]/DOM_WIN*100}%"></u></i><b>${r.s[1]}</b><img src="${t.b.icon}" alt=""/></div>`;
  hud.querySelector<HTMLButtonElement>('.dom-quit')!.onclick=()=>{if(r.done||confirm('Maçtan ayrılırsan ödül alamazsın. Ayrılmak istiyor musun?'))onLeave();};}

// Sonuç ekranı
export function showDomResult(d:DomEnd,onClose:()=>void){document.querySelector('.dom-result')?.remove();const t=DOM_TEAMS,won=d.win===d.team;
  const el=document.createElement('div');el.className='dom-result';
  el.innerHTML=`<section><img src="${t[d.win??d.team].icon}" alt=""/><h2>${d.win===null?'BERABERE':won?'ZAFER':'YENİLGİ'}</h2><p>${d.win?`${t[d.win].name} kazandı`:'İki takım eşit puanda kaldı'}</p>
    <div class="dom-final"><span style="color:${t.r.color}">${t.r.short} ${d.s[0]}</span> — <span style="color:${t.b.color}">${d.s[1]} ${t.b.short}</span></div>
    <div class="dom-rew"><b>+${d.pearls} İnci</b><b>+${d.ep} Elit Puan</b></div><button>LİMANA DÖN</button></section>`;
  document.body.appendChild(el);el.querySelector('button')!.onclick=()=>{el.remove();onClose();};}
