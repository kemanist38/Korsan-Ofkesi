// Çevrim içi deniz (Supabase Realtime). Aynı haritadaki oyuncular bir kanala katılır ve birbirine durum, atış ve batma
// mesajı yayınlar. Sunucu tarafında hesap yoktur: her oyuncu kendisine gelen gülleyi kendi tarafında hesaplar
// (yeterli: arkadaş grubuyla ilk sürüm). Kanal adı: sea-<harita>; sohbet için tek global kanal.
import {createClient,type RealtimeChannel} from '@supabase/supabase-js';

const URL='https://vidjvineafeiyoclioau.supabase.co';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZGp2aW5lYWZlaXlvY2xpb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mjk2NjMsImV4cCI6MjEwNzMwNTY2M30.sKlmmfQRr-ZASkaSbax22ca80cyDCc8DNz4Idq19g5s';

export type NetState={id:string;nick:string;tag:string|null;ship:string;x:number;y:number;east:boolean;north:boolean;hp:number;maxHp:number;sp:number;level:number;t:number;vx?:number;vy?:number};
export type NetFire={from:string;to:string;x:number;y:number;tx:number;ty:number;damage:number;ammo:string};
export type NetSunk={victim:string;by:string;victimNick:string;byNick:string};
export type NetChat={nick:string;text:string;at:number};
export type NetHandlers={state:(s:NetState)=>void;leave:(id:string)=>void;fire:(f:NetFire)=>void;sunk:(s:NetSunk)=>void;chat:(c:NetChat)=>void};

const ID_KEY='yedi-deniz-net-id';
export const myNetId=(()=>{try{let v=sessionStorage.getItem(ID_KEY);if(!v){v=Math.random().toString(36).slice(2,10);sessionStorage.setItem(ID_KEY,v);}return v;}catch{return Math.random().toString(36).slice(2,10);}})();

let client:ReturnType<typeof createClient>|null=null,sea:RealtimeChannel|null=null,chatCh:RealtimeChannel|null=null,seaName='';
let handlers:NetHandlers|null=null;
// Bağlantı durumu (ekranda gösterilir): 'off' | 'connecting' | 'ok' | 'error'
export let netStatus:'off'|'connecting'|'ok'|'error'='off',netError='';
export const netOnline=()=>netStatus==='ok';

export function startNet(h:NetHandlers){
  handlers=h;
  try{client=createClient(URL,ANON,{realtime:{params:{eventsPerSecond:40}}});}catch{client=null;return;}
  chatCh=client.channel('chat-global',{config:{broadcast:{self:false}}});
  chatCh.on('broadcast',{event:'chat'},({payload})=>handlers?.chat(payload as NetChat)).subscribe();
}
// Haritaya katıl (harita değişince eski kanaldan çıkılır). Siege gibi özel alanlarda null verilir.
export function joinSea(map:string|null){
  const name=map?`sea-${map.replace('/','-')}`:'';if(name===seaName)return;seaName=name;
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
export const sendState=(s:NetState)=>send(sea,'state',s);
export const sendFire=(f:NetFire)=>send(sea,'fire',f);
export const sendSunk=(s:NetSunk)=>send(sea,'sunk',s);
export const sendChat=(c:NetChat)=>send(chatCh,'chat',c);
