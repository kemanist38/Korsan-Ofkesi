// Çevrim içi deniz. Hesapla girişte önce VPS oyun sunucusuna (wss://game.piraterage.com/ws) bağlanılır: kimlik, kaptan adı,
// mesaj sıklığı, hasar ve hız sunucuda denetlenir (server/game-server.mjs). Sunucuya ulaşılamazsa eski yol: Supabase Realtime. Aynı haritadaki oyuncular bir kanala katılır ve birbirine durum, atış ve batma
// mesajı yayınlar. Sunucu tarafında hesap yoktur: her oyuncu kendisine gelen gülleyi kendi tarafında hesaplar
// (yeterli: arkadaş grubuyla ilk sürüm). Kanal adı: sea-<harita>; sohbet için tek global kanal.
import {type RealtimeChannel} from '@supabase/supabase-js';
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
export type NetHandlers={boss?:(b:NetBoss)=>void;bossHp?:(id:string,hp:number)=>void;bossDown?:(d:NetBossDown)=>void;bossGone?:(id:string)=>void;state:(s:NetState)=>void;leave:(id:string)=>void;fire:(f:NetFire)=>void;sunk:(s:NetSunk)=>void;chat:(c:NetChat)=>void;bid?:(b:NetBid)=>void;bidAsk?:(hour:number)=>void;bidKnown?:(bids:NetBid[])=>void};

const ID_KEY='yedi-deniz-net-id';
export const myNetId=(()=>{try{let v=sessionStorage.getItem(ID_KEY);if(!v){v=Math.random().toString(36).slice(2,10);sessionStorage.setItem(ID_KEY,v);}return v;}catch{return Math.random().toString(36).slice(2,10);}})();

let client:ReturnType<typeof supa>=null,sea:RealtimeChannel|null=null,chatCh:RealtimeChannel|null=null,auctionCh:RealtimeChannel|null=null,seaName='';
let handlers:NetHandlers|null=null;
// Bağlantı durumu (ekranda gösterilir): 'off' | 'connecting' | 'ok' | 'error'
export let netStatus:'off'|'connecting'|'ok'|'error'='off',netError='';
export const netOnline=()=>netStatus==='ok';
// Hangi yoldan bağlı: VPS oyun sunucusu ya da yedek (Supabase)
export let vpsError='';
export const netMode=()=>wsFallback?'yedek':'VPS';

// ---------------------------------------------------------------- VPS oyun sunucusu (WebSocket)
let ws:WebSocket|null=null,wsReady=false,wsSea='',wsTries=0,wsFallback=false;
const wsSend=(t:string,d?:unknown)=>{if(ws&&wsReady)ws.send(JSON.stringify({t,d}));};
async function connectWs(){const sb=supa();if(!sb||!session.account){fallback();return;}
  const {data}=await sb.auth.getSession();const token=data.session?.access_token;if(!token){fallback();return;}
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
      case'chat':handlers?.chat(m.d as NetChat);break;
      case'boss':handlers?.boss?.(m.d as NetBoss);break;
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
    // İlk bağlantı hiç kurulamadıysa eski yola geç; kurulduysa yeniden dene
    if(!was&&++wsTries>=2){vpsError=netError=`VPS: ${ev.code}${ev.reason?' '+ev.reason:''}`;console.warn('Oyun sunucusuna bağlanılamadı',ev.code,ev.reason);fallback();return;}
    netStatus='connecting';setTimeout(()=>{void connectWs();},Math.min(15000,1000*2**wsTries++));};
}
function fallback(){if(wsFallback)return;wsFallback=true;ws=null;startSupabase();const s=wsSea;seaName='';if(s)joinSea(s.replace(/^sea-/,''));}
const useWs=()=>!wsFallback;

export function startNet(h:NetHandlers){
  handlers=h;
  if(session.account&&!new URLSearchParams(location.search).has('eskiag')){void connectWs();return;}
  wsFallback=true;startSupabase();
}
function startSupabase(){
  client=supa();if(!client)return;
  chatCh=client.channel('chat-global',{config:{broadcast:{self:false}}});
  chatCh.on('broadcast',{event:'chat'},({payload})=>handlers?.chat(payload as NetChat)).subscribe();
  const ac=client.channel('auction-global',{config:{broadcast:{self:false}}});auctionCh=ac;
  ac.on('broadcast',{event:'bid'},({payload})=>handlers?.bid?.(payload as NetBid))
    .on('broadcast',{event:'ask'},({payload})=>handlers?.bidAsk?.((payload as {hour:number}).hour))
    .on('broadcast',{event:'known'},({payload})=>handlers?.bidKnown?.((payload as {bids:NetBid[]}).bids))
    .subscribe(status=>{if(status==='SUBSCRIBED')send(ac,'ask',{hour:Math.floor(Date.now()/3600000)});});
}
// Haritaya katıl (harita değişince eski kanaldan çıkılır). Siege gibi özel alanlarda null verilir.
export function joinSea(map:string|null){
  const name=map?`sea-${map.replace('/','-')}`:'';
  if(useWs()){if(name===wsSea)return;wsSea=name;if(ws&&wsReady)ws.send(JSON.stringify({t:'join',sea:name}));return;}
  if(name===seaName)return;seaName=name;
  if(sea){void sea.unsubscribe();sea=null;}
  if(!client||!name)return;
  const ch=client.channel(name,{config:{broadcast:{self:false},presence:{key:myNetId}}});
  ch.on('broadcast',{event:'state'},({payload})=>handlers?.state(payload as NetState))
    .on('broadcast',{event:'fire'},({payload})=>handlers?.fire(payload as NetFire))
    .on('broadcast',{event:'sunk'},({payload})=>handlers?.sunk(payload as NetSunk))
    .on('presence',{event:'leave'},({key})=>handlers?.leave(key))
    .subscribe((status,err)=>{if(sea!==ch)return;if(status==='SUBSCRIBED'){netStatus='ok';netError='';void ch.track({id:myNetId});}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){netStatus='error';netError=status+(err?` · ${err.message}`:'');}});
  netStatus='connecting';
  sea=ch;
}
const send=(ch:RealtimeChannel|null,event:string,payload:unknown)=>{if(ch)void ch.send({type:'broadcast',event,payload});};
export const sendState=(s:NetState)=>useWs()?wsSend('state',s):send(sea,'state',s);
export const sendFire=(f:NetFire)=>useWs()?wsSend('fire',f):send(sea,'fire',f);
export const sendSunk=(s:NetSunk)=>useWs()?wsSend('sunk',s):send(sea,'sunk',s);
export const sendChat=(c:NetChat)=>useWs()?wsSend('chat',c):send(chatCh,'chat',c);
export const sendBid=(b:NetBid)=>useWs()?wsSend('bid',b):send(auctionCh,'bid',b);
export const sendKnownBids=(bids:NetBid[])=>useWs()?wsSend('known',{bids}):send(auctionCh,'known',{bids});
// Boss'lar VPS bağlantısı varken paylaşılır; yedek yolda (Supabase) her oyuncu kendi boss'unu keser
export const sharedBosses=()=>useWs()&&wsReady;
export const sendBossKill=(need:number)=>wsSend('bkill',{need});
export const sendBossHit=(dmg:number)=>wsSend('bhit',{dmg:Math.round(dmg)});
