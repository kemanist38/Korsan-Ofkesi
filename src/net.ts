// Çevrim içi deniz: her şey VPS oyun sunucusundan (wss://game.piraterage.com/ws) geçer. Kimlik, kaptan adı, mesaj sıklığı,
// hasar ve hız sunucuda denetlenir (server/game-server.mjs). Yedek yol yoktur: bağlantı koparsa oyun sürekli yeniden dener
// ve ekranda uyarı gösterir; boss, filo adaları ve kuşatma yalnızca sunucuyla çalışır.
import {supa} from './supabase';
import {session} from './session';
const GAME_WS='wss://game.piraterage.com/ws';


// Kalabalık haritada trafik az olsun diye kimlik bilgileri (nick, tag, gemi, can üst sınırı, rütbe) yalnızca ara sıra gelen tam
// mesajda bulunur; sık gelen kısa mesaj sadece konum/yön/can taşır.
export type NetState={id:string;nick?:string;tag?:string|null;ship?:string;x:number;y:number;east:boolean;north:boolean;hp:number;maxHp?:number;sp?:number;level?:number;t:number;vx?:number;vy?:number;d16?:number};
export type NetFire={from:string;to:string;x:number;y:number;tx:number;ty:number;damage:number;ammo:string};
export type NetSunk={victim:string;by:string;victimNick:string;byNick:string};
export type NetChat={nick:string;text:string;at:number};
// İhale: tekliflerin kendisi (bid), yeni katılanın mevcut teklifleri istemesi (ask) ve buna verilen cevap (known)
export type NetBid={hour:number;lot:string;amount:number;id:string;nick:string;at:number};
// Paylaşılan boss (yalnızca VPS sunucusunda): ortaya çıkış, can güncellemesi, batış (pay) ve süre dolunca kayboluş
export type NetBoss={sea:string;id:string;hp:number;maxHp:number;x:number;y:number;left:number};
export type NetBossDown={id:string;n:number;share:number;dmg:number};
// Paylaşılan filo adası: sahibi filo, kule canları ([can, üst can] ya da null) ve yıkık kaideler
export type NetIsland={key:string;guild:number;tag:string;towers:([number,number]|null)[];ruins:Record<string,number>};
// Ortak kuşatma: tam durum, can güncellemesi, yıkılan parça, sıralama ve sonuç
export type NetSiege={id:string;end:number;n:number;hp:number[];max:number[];result:'won'|'lost'|null;top:[string,number][];mine:number};
export type NetSiegeEnd={won:boolean;n:number;top:[string,number][];mine:number;share:number};
export type NetHandlers={forceSink?:(d:{by:string;byNick:string})=>void;siegeState?:(s:NetSiege)=>void;siegeHp?:(l:[number,number,number][])=>void;siegeDown?:(i:number)=>void;siegeRank?:(d:{n:number;top:[string,number][];mine:number})=>void;siegeEnd?:(d:NetSiegeEnd)=>void;island?:(i:NetIsland)=>void;towerHp?:(key:string,s:[number,number][])=>void;towerDown?:(key:string,slot:number,by:string)=>void;
  islandCaptured?:(d:{key:string;tag:string;by:string;nick:string})=>void;islandAlert?:(key:string)=>void;boss?:(b:NetBoss)=>void;bossHp?:(id:string,hp:number)=>void;bossDown?:(d:NetBossDown)=>void;bossGone?:(id:string)=>void;state:(s:NetState)=>void;leave:(id:string)=>void;fire:(f:NetFire)=>void;sunk:(s:NetSunk)=>void;chat:(c:NetChat)=>void;bid?:(b:NetBid)=>void;bidAsk?:(hour:number)=>void;bidKnown?:(bids:NetBid[])=>void};

const ID_KEY='yedi-deniz-net-id';
export const myNetId=(()=>{try{let v=sessionStorage.getItem(ID_KEY);if(!v){v=Math.random().toString(36).slice(2,10);sessionStorage.setItem(ID_KEY,v);}return v;}catch{return Math.random().toString(36).slice(2,10);}})();

let handlers:NetHandlers|null=null;
// Bağlantı durumu (ekranda gösterilir): 'off' | 'connecting' | 'ok' | 'error'
export let netStatus:'off'|'connecting'|'ok'|'error'='off',netError='';
export const netOnline=()=>netStatus==='ok';
export let vpsError='';
export const netMode=()=>'VPS';

// ---------------------------------------------------------------- VPS oyun sunucusu (WebSocket)
let ws:WebSocket|null=null,wsReady=false,wsSea='',wsTries=0;
const wsSend=(t:string,d?:unknown)=>{if(ws&&wsReady)ws.send(JSON.stringify({t,d}));};
async function connectWs(){const sb=supa();if(!sb||!session.account){netStatus='off';return;}
  const {data}=await sb.auth.getSession();const token=data.session?.access_token;if(!token){netStatus='error';netError='Oturum bulunamadı';setTimeout(()=>{void connectWs();},5000);return;}
  let opened=false;const sock=new WebSocket(GAME_WS);ws=sock;netStatus='connecting';
  const timer=setTimeout(()=>{if(!opened){sock.close();}},6000);
  sock.onopen=()=>{opened=true;clearTimeout(timer);sock.send(JSON.stringify({t:'auth',token,netId:myNetId}));};
  sock.onmessage=ev=>{let m:{t:string;d?:unknown;id?:string};try{m=JSON.parse(String(ev.data));}catch{return;}
    switch(m.t){
      case'hello':wsReady=true;wsTries=0;netStatus='ok';netError='';if(wsSea){const s=wsSea;wsSea='';joinSea(s.replace(/^sea-/,''));}sock.send(JSON.stringify({t:'ask',d:{hour:Math.floor(Date.now()/3600000)}}));break;
      case'state':handlers?.state(m.d as NetState);break;
      case'batch':for(const st of m.d as NetState[])handlers?.state(st);break;
      case'leave':handlers?.leave(String(m.id));break;
      case'fire':handlers?.fire(m.d as NetFire);break;
      case'sunk':handlers?.sunk(m.d as NetSunk);break;
      case'forceSink':handlers?.forceSink?.(m.d as {by:string;byNick:string});break;
      case'chat':handlers?.chat(m.d as NetChat);break;
      case'boss':handlers?.boss?.(m.d as NetBoss);break;
      case'sstate':handlers?.siegeState?.(m.d as NetSiege);break;
      case'shp':handlers?.siegeHp?.(m.d as [number,number,number][]);break;
      case'sdown':handlers?.siegeDown?.((m.d as {i:number}).i);break;
      case'srank':handlers?.siegeRank?.(m.d as {n:number;top:[string,number][];mine:number});break;
      case'send':handlers?.siegeEnd?.(m.d as NetSiegeEnd);break;
      case'isle':handlers?.island?.(m.d as NetIsland);break;
      case'thp':{const d=m.d as {key:string;s:[number,number][]};handlers?.towerHp?.(d.key,d.s);break;}
      case'tdown':{const d=m.d as {key:string;slot:number;by:string};handlers?.towerDown?.(d.key,d.slot,d.by);break;}
      case'icap':handlers?.islandCaptured?.(m.d as {key:string;tag:string;by:string;nick:string});break;
      case'ialert':handlers?.islandAlert?.((m.d as {key:string}).key);break;
      case'bhp':{const d=m.d as {id:string;hp:number};handlers?.bossHp?.(d.id,d.hp);break;}
      case'bdown':handlers?.bossDown?.(m.d as NetBossDown);break;
      case'bgone':handlers?.bossGone?.((m.d as {id:string}).id);break;
      case'bid':handlers?.bid?.(m.d as NetBid);break;
      case'ask':handlers?.bidAsk?.((m.d as {hour:number}).hour);break;
      case'known':handlers?.bidKnown?.((m.d as {bids:NetBid[]}).bids);break;
    }};
  sock.onclose=ev=>{clearTimeout(timer);const was=wsReady;wsReady=false;if(ws!==sock)return;ws=null;
    if(ev.code===4002){netStatus='error';netError='Hesap kapalı';return;}
    if(ev.code===4004){netStatus='error';netError='Hesabına başka bir yerden bağlanıldı';return;}
    // Bağlantı kurulamadı ya da koptu: artan aralıklarla (en çok 15 sn) sürekli yeniden dene
    if(!was){wsTries++;vpsError=netError=`Sunucuya bağlanılamıyor (${ev.code}${ev.reason?' '+ev.reason:''})`;netStatus='error';}else netStatus='connecting';
    setTimeout(()=>{void connectWs();},Math.min(15000,1000*2**Math.min(4,wsTries)));};
}
export function startNet(h:NetHandlers){handlers=h;void connectWs();}
// Haritaya katıl (harita değişince eski kanaldan çıkılır). Siege gibi özel alanlarda null verilir.
// Haritaya katıl (harita değişince eski denizden çıkılır); kuşatmada 'siege'
export function joinSea(map:string|null){
  const name=map?`sea-${map.replace('/','-')}`:'';
  if(name===wsSea)return;wsSea=name;if(ws&&wsReady)ws.send(JSON.stringify({t:'join',sea:name}));
}
export const sendState=(s:NetState)=>wsSend('state',s);
export const sendFire=(f:NetFire)=>wsSend('fire',f);
export const sendSunk=(s:NetSunk)=>wsSend('sunk',s);
export const sendChat=(c:NetChat)=>wsSend('chat',c);
export const sendBid=(b:NetBid)=>wsSend('bid',b);
export const sendKnownBids=(bids:NetBid[])=>wsSend('known',{bids});
// Sunucuya bağlı ve hazır mı (boss, filo adaları ve kuşatma buna bağlı)
export const sharedBosses=()=>wsReady;
export const sendBossKill=(need:number)=>wsSend('bkill',{need});
export const sendBossHit=(dmg:number)=>wsSend('bhit',{dmg:Math.round(dmg)});
export const sendTowerHit=(slot:number,dmg:number,heal=false)=>wsSend('thit',{slot,dmg:Math.round(dmg),heal});
export const sendTowerBuilt=(key:string)=>wsSend('tbuilt',{key});
export const sendGuildRefresh=()=>wsSend('gref');
export const sendSiegeHit=(i:number,dmg:number)=>wsSend('shit',{i,dmg:Math.round(dmg)});
