// Kaptan kimliği: seviye amblemi ve TP sıra madalyası. Büyük hâlleri burada: seçilen rakibin oyuncu kartı ve kaptan profili.
import './captain-card.css';
import {tpMedal,tpMedalUrl,TP_MEDALS} from './tp-rank';

const LEVELS=8;
const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const fmt=(n:number)=>Math.floor(n).toLocaleString('tr-TR');
export const levelBadge=(level:number,cls='')=>`<i class="cc-level ${cls}" style="background-position:${(Math.max(1,Math.min(LEVELS,level))-1)/(LEVELS-1)*100}% 0"><b>${Math.max(1,Math.min(LEVELS,level))}</b></i>`;
const bar=(pct:number,text:string)=>`<span class="cc-bar"><em style="width:${Math.max(0,Math.min(100,pct))}%"></em><b>${text}</b></span>`;

// Kaptan profili: seviye ve TP sıra madalyası yan yana; her birinin altında sonraki kademeye ilerleme
export function trioHtml(o:{level:number;xp:number;xpNeed:number;sp:number;sinks:number;tr?:number}){
  const lvPct=Number.isFinite(o.xpNeed)?o.xp/o.xpNeed*100:100;
  return`<section class="cc-trio">
    <article>${levelBadge(o.level,'big')}<strong>SEVİYE ${o.level}</strong>${bar(lvPct,Number.isFinite(o.xpNeed)?`${fmt(o.xp)} / ${fmt(o.xpNeed)} TP`:'En yüksek seviye')}</article>
    ${o.tr&&tpMedal(o.tr)>=0?`<article><img class="cc-tp big" src="${tpMedalUrl(tpMedal(o.tr))}" alt=""/><strong>${TP_MEDALS[tpMedal(o.tr)].name.toLocaleUpperCase('tr')}</strong>${bar(100,`TP sıralaması: ${o.tr}.`)}</article>`:''}
  </section>`;}

// Seçilen rakip kaptanın kartı (ekranın üst ortasında, hedef seçiliyken)
const card=document.createElement('div');card.className='cc-card';card.hidden=true;document.body.append(card);let cardKey='';
export function showPlayerCard(o:{name:string;level?:number;sp:number;sinks?:number;tag?:string|null;adm?:boolean;tr?:number}|null){
  if(!o){if(!card.hidden){card.hidden=true;cardKey='';}return;}
  const key=`${o.name}|${o.level}|${o.tr}|${o.sinks}`;if(key===cardKey&&!card.hidden)return;cardKey=key;
  card.innerHTML=`${o.level?levelBadge(o.level,'mid'):''}<div class="cc-who"><strong class="${o.adm?'adm':''}">${esc(o.name)}</strong><small>${o.adm?'Oyun yöneticisi':`${o.level?`Seviye ${o.level}`:''}${o.sinks!==undefined?`${o.level?' · ':''}${fmt(o.sinks)} batırma`:''}${o.tr?` · TP sırası ${o.tr}.`:''}`}</small></div>${o.adm?'':(o.tr&&tpMedal(o.tr)>=0?`<img class="cc-tp" src="${tpMedalUrl(tpMedal(o.tr))}" alt="" title="${TP_MEDALS[tpMedal(o.tr)].name}"/>`:'')}`;
  card.hidden=false;}

