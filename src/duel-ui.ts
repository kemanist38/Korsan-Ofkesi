// Açık deniz düellosu arayüzü: rakibin kartının altındaki DÜELLO düğmesi, bahis seçimi, gelen teklif penceresi,
// düello sırasında üst çubuk ve sonuç. Kurallar sunucuda (src/duel.ts, server/game-server.mjs).
import './duel.css';
import {DUEL_BETS,DUEL_MS,duelPot,type DuelInfo} from './duel';
import {sendDuel} from './net';
import {infoTip} from './info-tip';

const esc=(t:string)=>t.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const fmt=(n:number)=>Math.floor(n).toLocaleString('tr-TR');
let me='',list:DuelInfo[]=[],target:{id:string;nick:string}|null=null,sent:{to:string;until:number}|null=null;
export const setDuelMe=(id:string)=>{me=id;};
export const duelList=()=>list;
export const myDuel=()=>list.find(d=>d.a===me||d.b===me)??null;
export const duelPartner=()=>{const d=myDuel();return d?(d.a===me?d.b:d.a):null;};
export const inDuel=(id:string)=>list.some(d=>d.a===id||d.b===id);

const RULES=`<ul><li>Yalnız savaşa kapalı denizlerde (1/1, 1/2); sadece iki rakip birbirine ateş edebilir.</li><li>Süre <b>${DUEL_MS/60000} dakika</b>. Batıran kazanır; süre biterse daha çok hasar veren kazanır.</li><li>Işıklı çemberden çıkan kaybeder.</li><li>Bahisli düello: <b>500 inci</b>, kazanan <b>${fmt(duelPot(500))}</b> inci alır (%10 sunucu payı). Günde 1, haftada 2 hak; seviye farkı en çok 2.</li><li>Berabere biterse bahis geri verilir.</li></ul>`;

// Rakip kartının altındaki düğme ve bahis seçimi
const btn=document.createElement('div');btn.className='duel-btn';btn.hidden=true;document.body.append(btn);
let btnKey='';
export function duelSelect(t:{id:string;nick:string}|null){const show=!!t&&!myDuel()&&!inDuel(t.id);const key=show?`${t!.id}|${sent?.to===t!.id&&Date.now()<sent.until}`:'';
  if(key===btnKey)return;btnKey=key;target=show?t:null;btn.hidden=!show;if(!show)return;
  if(sent&&sent.to===t!.id&&Date.now()<sent.until){btn.innerHTML=`<span class="duel-wait">⚔ Teklif gönderildi · bekleniyor</span>`;return;}
  btn.innerHTML=`<b>⚔ DÜELLO${infoTip(RULES)}</b>${DUEL_BETS.map(bet=>`<button data-bet="${bet}">${bet?`${fmt(bet)} İNCİ`:'BAHİSSİZ'}</button>`).join('')}`;
  btn.querySelectorAll<HTMLButtonElement>('button[data-bet]').forEach(b=>b.onclick=()=>{if(target)sendDuel('ask',{to:target.id,bet:Number(b.dataset.bet)});});}

// Gelen teklif
const ask=document.createElement('div');ask.className='duel-ask';ask.hidden=true;document.body.append(ask);let askTimer=0;
function showAsk(d:{from:string;nick:string;level:number;bet:number;until:number}){clearInterval(askTimer);ask.hidden=false;
  const draw=()=>{const left=Math.max(0,Math.ceil((d.until-Date.now())/1000));if(!left){ask.hidden=true;clearInterval(askTimer);return;}
    ask.innerHTML=`<h3>⚔ DÜELLO TEKLİFİ${infoTip(RULES)}</h3><p><b>${esc(d.nick)}</b> (Seviye ${d.level}) seni ${d.bet?`<b>${fmt(d.bet)} inci</b> bahisli`:'bahissiz'} düelloya çağırıyor.</p>${d.bet?`<small>Kazanan ${fmt(duelPot(d.bet))} inci alır</small>`:''}<div><button class="yes">KABUL (${left})</button><button class="no">RED</button></div>`;
    ask.querySelector<HTMLButtonElement>('.yes')!.onclick=()=>{sendDuel('yes',{from:d.from});ask.hidden=true;clearInterval(askTimer);};
    ask.querySelector<HTMLButtonElement>('.no')!.onclick=()=>{sendDuel('no');ask.hidden=true;clearInterval(askTimer);};};
  draw();askTimer=setInterval(draw,1000) as unknown as number;}

// Düello sırasında üst çubuk
const hud=document.createElement('div');hud.className='duel-hud';hud.hidden=true;document.body.append(hud);
export function renderDuelHud(off=0){const d=myDuel();if(!d){hud.hidden=true;return;}hud.hidden=false;const left=Math.max(0,d.end-(Date.now()+off)),s=Math.ceil(left/1000);
  const foe=d.a===me?d.bn:d.an;const html=`<b>⚔ DÜELLO</b><span>${esc(foe)}</span><strong>${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</strong>${d.bet?`<em>${fmt(duelPot(d.bet))} inci</em>`:''}<button>TESLİM OL</button>`;
  if(hud.dataset.h!==html){hud.dataset.h=html;hud.innerHTML=html;hud.querySelector('button')!.onclick=()=>{if(confirm('Teslim olursan düelloyu kaybedersin. Emin misin?'))sendDuel('quit');};}}

export type DuelMsg={k:string;[x:string]:unknown};
// Sunucu mesajları; dönüş değeri oyuna gösterilecek bildirim (varsa)
export function duelMsg(d:DuelMsg,toast:(t:string)=>void,onStake:(n:number)=>void){
  if(d.k==='list'){list=(d.duels as DuelInfo[])??[];return;}
  if(d.k==='start'){const x=d as unknown as DuelInfo;list=list.filter(y=>y.id!==x.id).concat(x);sent=null;btnKey='';if(x.a===me||x.b===me)toast(`⚔ Düello başladı · ${DUEL_MS/60000} dakika · çemberin içinde kal`);return;}
  if(d.k==='end'){const id=String(d.id);const was=list.find(y=>y.id===id);list=list.filter(y=>y.id!==id);btnKey='';
    if(was&&(was.a===me||was.b===me)){const won=d.win===me;toast(d.win?won?`⚔ Düelloyu kazandın${d.pot?` · +${fmt(Number(d.pot))} inci`:''}`:`⚔ Düelloyu kaybettin · ${d.why}`:`⚔ Düello berabere${d.bet?' · bahis geri verildi':''}`);}return;}
  if(d.k==='ask'){showAsk(d as never);return;}
  if(d.k==='sent'){sent={to:String(d.to),until:Date.now()+20_000};btnKey='';toast(`Düello teklifi gönderildi · ${d.nick}`);return;}
  if(d.k==='err'){sent=null;btnKey='';toast(String(d.msg));return;}
  if(d.k==='stake'){onStake(Number(d.n)||0);return;}}
