// Deniz Antlaşması arayüzü: üstte ilerleme / oylama / etki rozeti, oylama penceresi (3 seçenek, canlı oy oranı, katkı sıralaması).
// Kurallar sunucuda (src/treaty.ts, server/game-server.mjs); bu dosya yalnızca sunucudan gelen durumu gösterir.
import './treaty.css';
import {TREATY_FX,TREATY_PRIZES,TREATY_JOIN,TREATY_MIN_PICKS,TREATY_MAP,type TreatyInfo} from './treaty';
import {sendTreatyVote,netOnline} from './net';
import {infoTip} from './info-tip';

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
  void html;void cls;pill.hidden=true;}
// Etkinlik panelinde (hazine parçalarının olduğu yerde) satır: durum + ilerleme
export function treatyRowHtml(){const d=info;if(!d)return'';const t=now();let small='',strong='',bar=-1,cls='';
  if(d.phase==='vote'&&t<d.voteEnd){small='DENİZ ANTLAŞMASI · OYLAMA';strong=clock(d.voteEnd-t);cls='vote';}
  else if(d.fx&&t<d.fx.until){small='DENİZ ANTLAŞMASI · ETKİ';strong=`${TREATY_FX[d.fx.id].name} · ${d.fxMine?clock(d.fx.until-t):'sana işlemiyor'}`;cls=d.fxMine?'fx':'off';}
  else if(d.phase==='collect'){small='DENİZ ANTLAŞMASI · PIRILTI';strong=`${fmt(d.count)} / ${fmt(d.goal)}`;bar=Math.min(100,d.count/d.goal*100);}
  else return'';
  return`<button class="event-row treaty-row ${cls}"><img src="${TREATY_ICON}" alt=""/><span><small>${small}</small><strong>${strong}</strong>${bar>=0?`<i><em style="width:${bar}%"></em></i>`:''}</span></button>`;}

function render(){const d=info,t=now();
  if(!d){body.innerHTML='<p class="treaty-status">Bekleniyor…</p>';return;}
  const total=d.tally.reduce((a,b)=>a+b,0)||1,voting=d.phase==='vote'&&t<d.voteEnd,winner=d.fx?.id;
  const cards=d.options.map((id,i)=>{const fx=TREATY_FX[id],pct=d.tally.length?Math.round(d.tally[i]/total*100):0,mine=d.myVote===i;
    return`<button class="treaty-opt ${mine?'mine':''} ${!voting&&winner===id?'win':''}" data-o="${i}" ${voting&&netOnline()&&d.mine>=TREATY_MIN_PICKS?'':'disabled'}><b>${fx.name}${infoTip(fx.desc)}</b>${d.tally.length?`<i><em style="width:${pct}%"></em></i><span>%${pct}${mine?' · senin oyun':''}</span>`:''}</button>`;}).join('');
  const how=`<ul><li>Perşembe günü bütün denizlerde toplanan pırıltılar ortak sayaca yazılır.</li><li>Hedef dolunca Deniz Elçisi ${TREATY_MAP}'de demir atar, <b>30 dk</b> oylama açılır.</li><li>Kazanan etki <b>24 saat</b> sürer.</li><li>Oy, etki ve ödül yalnız bu turda en az <b>${TREATY_MIN_PICKS} pırıltı</b> toplayan kaptanlarındır.</li><li>Oyunu süre bitene kadar değiştirebilirsin.</li></ul>`;
  const status=voting?`Oylama · <b>${clock(d.voteEnd-t)}</b>${d.double?' · oyun ×2':''}`
    :d.phase==='collect'?`Pırıltı: <b>${fmt(d.count)} / ${fmt(d.goal)}</b>`
    :d.fx&&t<d.fx.until?`<b>${TREATY_FX[d.fx.id].name}</b> · ${clock(d.fx.until-t)}${d.fxMine?'':' · sana işlemiyor'}`
    :d.phase==='fail'?'Bu hafta hedef dolmadı':'Her perşembe';
  const top=d.top.length?d.top.map(([n,c],i)=>`<li><b>${i+1}.</b> ${esc(n)}<span>${fmt(c)}</span></li>`).join(''):'<li class="empty">Henüz yok</li>';
  const k=(n:number)=>n>=1000?`${fmt(n/1000)} bin`:fmt(n);
  body.innerHTML=`<div class="treaty-head"><img src="${TREATY_ICON}" alt=""/><p class="treaty-status">${status}${infoTip(how)}</p></div>
    ${d.options.length?`<div class="treaty-opts">${cards}</div>`:''}
    <div class="treaty-cols"><div><h4>EN ÇOK TOPLAYANLAR</h4><ol class="treaty-top">${top}</ol><p class="treaty-mine">Katkın: <b>${fmt(d.mine)}</b> / ${TREATY_MIN_PICKS}${infoTip(d.mine<TREATY_MIN_PICKS?`Oy, etki ve ödül için <b>${TREATY_MIN_PICKS-d.mine}</b> pırıltı daha topla.`:'Oy, etki ve ödül hakkın var.')}</p></div>
    <div><h4>ÖDÜLLER${infoTip(`Birinci, sonraki oylamada <b>2 oy</b> sayılır. En az ${TREATY_MIN_PICKS} pırıltı toplayan herkes katılım ödülü alır; ilk 3 sıra ödülünü ayrıca alır.`)}</h4><ul class="treaty-prizes">${TREATY_PRIZES.map((p,i)=>`<li><b>${i+1}.</b> ${fmt(p.pearls)} inci · ${k(p.gold)} altın</li>`).join('')}<li><b>${TREATY_MIN_PICKS}+</b> ${fmt(TREATY_JOIN.pearls)} inci · ${k(TREATY_JOIN.gold)} altın</li></ul></div></div>`;
  body.querySelectorAll<HTMLButtonElement>('.treaty-opt').forEach(b=>b.onclick=()=>sendTreatyVote(Number(b.dataset.o)));}
