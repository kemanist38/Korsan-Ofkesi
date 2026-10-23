// Kaptan kimliği: seviye amblemi, SP rütbe madalyası ve güverte nişanı. Geminin altında yalnızca rütbe rozeti + ad + küçük seviye
// amblemi çizilir; büyük hâlleri ve ilerlemeler burada: seçilen rakibin oyuncu kartı, kaptan profilindeki üçlü ve rütbe atlama ekranı.
import './captain-card.css';
import {BATTLE_RANKS,RANK_SHEET,RANK_COLS} from './battle';
import {INSIGNIA_SHEET,INSIGNIA_TIERS,insigniaTier} from './insignia';

export const INSIGNIA_NAMES=['Acemi Nişanı','Bronz Nişan','Gümüş Nişan','Altın Nişan','Efsane Nişanı'];
const LEVELS=8,RANK_ROWS=Math.ceil(BATTLE_RANKS.length/RANK_COLS),TIERS=INSIGNIA_TIERS.length;
const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const fmt=(n:number)=>Math.floor(n).toLocaleString('tr-TR');
export const levelBadge=(level:number,cls='')=>`<i class="cc-level ${cls}" style="background-position:${(Math.max(1,Math.min(LEVELS,level))-1)/(LEVELS-1)*100}% 0"></i>`;
export const rankBadge=(index:number,cls='')=>{const i=Math.max(0,Math.min(BATTLE_RANKS.length-1,index));
  return`<i class="cc-rank ${cls}" style="background-image:url(${RANK_SHEET});background-size:${RANK_COLS*100}% ${RANK_ROWS*100}%;background-position:${(i%RANK_COLS)/(RANK_COLS-1)*100}% ${Math.floor(i/RANK_COLS)/(RANK_ROWS-1)*100}%"></i>`;};
export const insigniaBadge=(tier:number,cls='')=>`<i class="cc-insignia ${cls}" style="background-image:url(${INSIGNIA_SHEET});background-position:0 ${Math.max(0,Math.min(TIERS-1,tier))/(TIERS-1)*100}%"></i>`;
const bar=(pct:number,text:string)=>`<span class="cc-bar"><em style="width:${Math.max(0,Math.min(100,pct))}%"></em><b>${text}</b></span>`;

// Kaptan profili: seviye ve nişan yan yana; her birinin altında sonraki kademeye ilerleme
export function trioHtml(o:{level:number;xp:number;xpNeed:number;sp:number;sinks:number}){
  const t=insigniaTier(o.sinks),nextT=INSIGNIA_TIERS[t+1];
  const lvPct=Number.isFinite(o.xpNeed)?o.xp/o.xpNeed*100:100,inPct=nextT?(o.sinks-INSIGNIA_TIERS[t])/(nextT-INSIGNIA_TIERS[t])*100:100;
  return`<section class="cc-trio">
    <article>${levelBadge(o.level,'big')}<strong>SEVİYE ${o.level}</strong>${bar(lvPct,Number.isFinite(o.xpNeed)?`${fmt(o.xp)} / ${fmt(o.xpNeed)} TP`:'En yüksek seviye')}</article>
    <article>${insigniaBadge(t,'big')}<strong>${INSIGNIA_NAMES[t]}</strong>${bar(inPct,nextT?`${fmt(o.sinks)} / ${fmt(nextT)} batırma`:`${fmt(o.sinks)} batırma · en yüksek nişan`)}</article>
  </section>`;}

// Seçilen rakip kaptanın kartı (ekranın üst ortasında, hedef seçiliyken)
const card=document.createElement('div');card.className='cc-card';card.hidden=true;document.body.append(card);let cardKey='';
export function showPlayerCard(o:{name:string;level?:number;sp:number;sinks?:number;tag?:string|null;adm?:boolean}|null){
  if(!o){if(!card.hidden){card.hidden=true;cardKey='';}return;}
  const t=insigniaTier(o.sinks??0),key=`${o.name}|${o.level}|${o.sp}|${o.sinks}`;if(key===cardKey&&!card.hidden)return;cardKey=key;
  card.innerHTML=`${o.level?levelBadge(o.level,'mid'):''}<div class="cc-who"><strong class="${o.adm?'adm':''}">${esc(o.name)}</strong><small>${o.adm?'Oyun yöneticisi':`${o.level?`Seviye ${o.level}`:''}${o.sinks!==undefined?`${o.level?' · ':''}${fmt(o.sinks)} batırma`:''}`}</small></div>${o.adm?'':insigniaBadge(t,'card')}`;
  card.hidden=false;}

// Rütbe atlama ekranı (seviye atlamadakine benzer kutlama)
let rankTimer=0;
export function showRankUp(index:number){const r=BATTLE_RANKS[Math.max(0,Math.min(BATTLE_RANKS.length-1,index))];
  let el=document.getElementById('rankUpSplash');if(!el){el=document.createElement('div');el.id='rankUpSplash';el.className='levelup-splash rankup-splash';document.body.append(el);el.onclick=()=>el!.classList.remove('open');}
  el.innerHTML=`<div class="lu-rays"></div><div class="lu-card">${rankBadge(index,'hero')}<span>YENİ RÜTBE</span><h2>${esc(r.name.toLocaleUpperCase('tr'))}</h2><p>${index+1}. rütbe madalyası kaptan profiline eklendi</p></div>`;
  el.classList.remove('open');void el.offsetWidth;el.classList.add('open');clearTimeout(rankTimer);rankTimer=window.setTimeout(()=>el!.classList.remove('open'),3800);}
