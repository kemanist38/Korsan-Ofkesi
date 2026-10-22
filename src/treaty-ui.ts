// Deniz Antlaşması arayüzü: üstte ilerleme / oylama / etki rozeti, oylama penceresi (3 seçenek, canlı oy oranı, katkı sıralaması).
// Kurallar sunucuda (src/treaty.ts, server/game-server.mjs); bu dosya yalnızca sunucudan gelen durumu gösterir.
import './treaty.css';
import {TREATY_FX,TREATY_PRIZES,TREATY_JOIN,TREATY_MIN_PICKS,TREATY_MAP,type TreatyInfo} from './treaty';
import {sendTreatyVote,netOnline} from './net';

export const TREATY_ICON='/assets/icon-treaty-v1.webp',TREATY_ENVOY='/assets/treaty-envoy-v1.webp';
const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const fmt=(n:number)=>Math.floor(n).toLocaleString('tr-TR');
let info:TreatyInfo|null=null,off=0,timer=0;
const now=()=>Date.now()+off;
const clock=(ms:number)=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=3600?`${Math.floor(s/3600)} sa ${Math.floor(s/60)%60} dk`:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};

const pill=document.createElement('button');pill.type='button';pill.className='treaty-pill';pill.hidden=true;document.body.append(pill);
pill.onclick=()=>openTreaty();
const overlay=document.createElement('div');overlay.className='quest-overlay treaty-overlay';
overlay.innerHTML=`<section class="quest-log treaty-log"><header><div><span class="eyebrow">Perşembe etkinliği</span><h2>DENİZ ANTLAŞMASI</h2></div><button class="treaty-close" aria-label="Kapat">×</button></header><div class="treaty-body"></div></section>`;
document.body.append(overlay);
const body=overlay.querySelector<HTMLElement>('.treaty-body')!;
overlay.querySelector<HTMLButtonElement>('.treaty-close')!.onclick=()=>closeTreaty();
overlay.onclick=e=>{if(e.target===overlay)closeTreaty();};
export function openTreaty(){overlay.classList.add('open');render();clearInterval(timer);timer=setInterval(()=>{render();renderPill();},1000) as unknown as number;}
export function closeTreaty(){overlay.classList.remove('open');clearInterval(timer);timer=setInterval(renderPill,1000) as unknown as number;}
export const treatyOpen=()=>overlay.classList.contains('open');
export const treatyEnvoy=()=>info?.phase==='vote'&&now()<info.voteEnd?info.envoy:null;

export function treatyMsg(d:TreatyInfo&{err?:string}){info=d;off=d.now-Date.now();renderPill();if(treatyOpen())render();if(!timer)timer=setInterval(renderPill,1000) as unknown as number;}

function renderPill(){const d=info;if(!d){pill.hidden=true;return;}const t=now();
  let html='',cls='';
  if(d.phase==='vote'&&t<d.voteEnd){html=`<b>OYLAMA</b> ${clock(d.voteEnd-t)}`;cls='vote';}
  else if(d.fx&&t<d.fx.until){html=`<b>${TREATY_FX[d.fx.id].name}</b> ${d.fxMine?clock(d.fx.until-t):'· sana işlemiyor'}`;cls=d.fxMine?'fx':'fx off';}
  else if(d.phase==='collect'){html=`<b>ANTLAŞMA</b> ${fmt(d.count)} / ${fmt(d.goal)}<i><em style="width:${Math.min(100,d.count/d.goal*100)}%"></em></i>`;}
  if(!html){pill.hidden=true;return;}
  pill.hidden=false;pill.className=`treaty-pill ${cls}`;pill.innerHTML=`<img src="${TREATY_ICON}" alt=""/><span>${html}</span>`;}

function render(){const d=info,t=now();
  if(!d){body.innerHTML='<p class="treaty-status">Bekleniyor…</p>';return;}
  const total=d.tally.reduce((a,b)=>a+b,0)||1,voting=d.phase==='vote'&&t<d.voteEnd,winner=d.fx?.id;
  const cards=d.options.map((id,i)=>{const fx=TREATY_FX[id],pct=d.tally.length?Math.round(d.tally[i]/total*100):0,mine=d.myVote===i;
    return`<button class="treaty-opt ${mine?'mine':''} ${!voting&&winner===id?'win':''}" data-o="${i}" ${voting&&netOnline()&&d.mine>=TREATY_MIN_PICKS?'':'disabled'}><b>${fx.name}</b><small>${fx.desc}</small>${d.tally.length?`<i><em style="width:${pct}%"></em></i><span>%${pct}${mine?' · senin oyun':''}</span>`:''}</button>`;}).join('');
  const status=voting?`Deniz Elçisi ${TREATY_MAP}'de bekliyor · oylama bitimine <b>${clock(d.voteEnd-t)}</b>${d.double?' · oyun 2 sayılıyor':''}`
    :d.phase==='collect'?`Bütün denizlerde pırıltı topla: <b>${fmt(d.count)} / ${fmt(d.goal)}</b>. Hedef dolunca Deniz Elçisi ${TREATY_MAP}'de demir atar ve oylama açılır.`
    :d.fx&&t<d.fx.until?`İmzalandı: <b>${TREATY_FX[d.fx.id].name}</b> · ${clock(d.fx.until-t)} daha geçerli${d.fxMine?' · sana işliyor':` · bu turda ${TREATY_MIN_PICKS} pırıltı toplamadığın için sana işlemiyor`}`
    :d.phase==='fail'?'Bu hafta hedef dolmadı, antlaşma imzalanamadı.':'Antlaşma her perşembe toplanır.';
  const top=d.top.length?d.top.map(([n,c],i)=>`<li><b>${i+1}.</b> ${esc(n)}<span>${fmt(c)} pırıltı</span></li>`).join(''):'<li class="empty">Henüz pırıltı toplanmadı</li>';
  body.innerHTML=`<div class="treaty-head"><img src="${TREATY_ICON}" alt=""/><p class="treaty-status">${status}</p></div>
    ${d.options.length?`<div class="treaty-opts">${cards}</div>`:''}
    <div class="treaty-cols"><div><h4>EN ÇOK TOPLAYANLAR</h4><ol class="treaty-top">${top}</ol><p class="treaty-mine">Senin katkın: <b>${fmt(d.mine)}</b> pırıltı${d.mine<TREATY_MIN_PICKS?` · oy, etki ve ödül için ${TREATY_MIN_PICKS-d.mine} daha`:' · oy, etki ve ödül hakkın var'}</p></div>
    <div><h4>ÖDÜLLER</h4><ul class="treaty-prizes">${TREATY_PRIZES.map((p,i)=>`<li><b>${i+1}.</b> ${fmt(p.pearls)} inci + ${fmt(p.gold)} altın${i===0?' · sonraki oylamada oyun 2 sayılır':''}</li>`).join('')}<li><b>${TREATY_MIN_PICKS}+</b> pırıltı toplayan herkese ${fmt(TREATY_JOIN.pearls)} inci + ${fmt(TREATY_JOIN.gold)} altın</li></ul></div></div>
    <p class="treaty-note">Oy kullanma, etki ve ödül hakkı yalnız bu turda en az ${TREATY_MIN_PICKS} pırıltı toplayan kaptanlarındır. Seçilen etki 24 saat sürer. Oylama 30 dakika sürer; oyunu süre bitene kadar değiştirebilirsin.</p>`;
  body.querySelectorAll<HTMLButtonElement>('.treaty-opt').forEach(b=>b.onclick=()=>sendTreatyVote(Number(b.dataset.o)));}
