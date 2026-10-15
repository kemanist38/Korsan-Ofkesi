// Pirate Rage oyun sunucusu (VPS). Oyuncular WebSocket ile bağlanır; deniz, sohbet ve ihale mesajları sunucudan geçer.
// Sunucu her mesajı denetler: kimlik ve kaptan adı hesaptan gelir (taklit edilemez), mesaj sıklığı, hasar ve hız sınırlanır,
// banlı hesaplar bağlanamaz. Şüpheli davranış günlüğe (pm2 logs) yazılır.
// Çalıştırma: node game-server.cjs  (ortam: PORT=3000, SUPABASE_URL, SUPABASE_ANON)
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {WebSocketServer} from 'ws';

const PORT=Number(process.env.PORT||3000);
const SUPABASE_URL=process.env.SUPABASE_URL||'https://vidjvineafeiyoclioau.supabase.co';
const SUPABASE_ANON=process.env.SUPABASE_ANON||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZGp2aW5lYWZlaXlvY2xpb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mjk2NjMsImV4cCI6MjEwNzMwNTY2M30.sKlmmfQRr-ZASkaSbax22ca80cyDCc8DNz4Idq19g5s';
// Sınırlar
export const LIMITS={maxHit:400000,maxSpeed:900,firesPerSec:12,statesPerSec:15,chatPerMin:20,chatLen:200,maxPerSea:300};
const started=Date.now();
// Shopier OSB bilgileri ve sunucu anahtarı yalnızca VPS'teki /opt/game/.env dosyasında durur
const OSB_USER=process.env.SHOPIER_OSB_USER||'',OSB_PASS=process.env.SHOPIER_OSB_PASS||'',SERVER_SECRET=process.env.SERVER_SECRET||'';

// ---------------------------------------------------------------- Kimlik doğrulama (Supabase oturum anahtarı)
export async function verifyToken(token){
  const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`}});
  if(!u.ok)return null;const user=await u.json();
  const p=await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=nick,player_no,banned`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`}});
  const rows=p.ok?await p.json():[];const prof=rows[0];if(!prof)return null;
  return{uid:user.id,nick:prof.nick,playerNo:prof.player_no,banned:!!prof.banned};
}

// ---------------------------------------------------------------- Shopier Otomatik Sipariş Bildirimi
// Shopier POST eder: res (base64 JSON) ve hash = HMAC-SHA256(res + kullanıcı, şifre). İmza tutarsa sipariş veritabanına işlenir.
export function verifyOsb(res,hash,user,pass){if(!res||!hash||!user||!pass)return false;const raw=crypto.createHmac('sha256',pass).update(res+user).digest();
  const hex=raw.toString('hex'),b64=raw.toString('base64'),h=String(hash);
  const eq=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));return eq(h.toLowerCase(),hex)||eq(h,b64);}
export function parseOsb(res){const d=JSON.parse(Buffer.from(res,'base64').toString('utf8'));const pick=(...k)=>{for(const x of k)if(d[x]!==undefined&&d[x]!==null&&d[x]!=='')return d[x];return null;};
  return{order:String(pick('orderid','order_id','platform_order_id','id')??''),email:pick('email','buyer_email','buyeremail'),note:pick('customernote','customer_note','note','buyernote'),
    price:Number(String(pick('price','total','total_order_value','amount')??'0').replace(',','.')),test:['1','true',1,true].includes(pick('istest','is_test','test')),keys:Object.keys(d)};}
async function handleOsb(body){const form=new URLSearchParams(body),res=form.get('res')||'',hash=form.get('hash')||'';
  if(!verifyOsb(res,hash,OSB_USER,OSB_PASS)){log('SHOPIER imza geçersiz');return false;}
  let o;try{o=parseOsb(res);}catch{log('SHOPIER veri okunamadı');return false;}
  log('SHOPIER sipariş',o.order,o.price,'alanlar:',o.keys.join(','));
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/shopier_credit`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},
    body:JSON.stringify({p_secret:SERVER_SECRET,p_order:o.order,p_email:o.email,p_note:o.note,p_price:o.price,p_test:o.test})});
  const st=r.ok?await r.json():`hata ${r.status} ${await r.text()}`;log('SHOPIER sonuç',o.order,st);return r.ok;}

// ---------------------------------------------------------------- Denetim (saf fonksiyonlar, testli)
const num=v=>typeof v==='number'&&Number.isFinite(v);
export function checkState(prev,s,now){
  if(!s||!num(s.x)||!num(s.y)||!num(s.hp))return'bad';
  if(prev&&prev.x!==undefined){const dt=Math.max(.05,(now-prev.at)/1000),d=Math.hypot(s.x-prev.x,s.y-prev.y);
    // Harita içi ışınlanma (yeniden doğma, liman) 3000 birimden uzun olur; arada kalan aşırı hız şüphelidir
    if(d<3000&&d/dt>LIMITS.maxSpeed*1.6+200)return'speed';}
  return'ok';
}
export function checkFire(f){if(!f||!num(f.damage)||!num(f.x)||!num(f.y)||typeof f.to!=='string')return'bad';if(f.damage<0||f.damage>LIMITS.maxHit)return'damage';return'ok';}
export class Rate{constructor(perWindow,windowMs){this.n=perWindow;this.w=windowMs;this.t=[];}hit(now){while(this.t.length&&now-this.t[0]>this.w)this.t.shift();if(this.t.length>=this.n)return false;this.t.push(now);return true;}}

// ---------------------------------------------------------------- Sunucu
const seas=new Map(); // ad → Set<Client>
const all=new Set();
const log=(...a)=>console.log(new Date().toISOString(),...a);
// Şüpheli kayıtları: bellekte son 500, ayrıca dosyaya (yönetici paneli /flags ile okur)
const FLAG_FILE=process.env.FLAG_FILE||'/opt/game/flags.jsonl';const flags=[];
try{for(const l of fs.readFileSync(FLAG_FILE,'utf8').trim().split('\n').slice(-500))if(l)flags.push(JSON.parse(l));}catch{}
function addFlag(c,why,extra){const now=Date.now(),f=flags.findLast?.(x=>x.playerNo===c.playerNo&&x.reason===why&&now-x.last<60000);
  if(f){f.count++;f.last=now;f.detail=extra;return;}const n={playerNo:c.playerNo,nick:c.nick,reason:why,detail:extra,count:1,at:now,last:now};flags.push(n);if(flags.length>500)flags.shift();
  try{fs.appendFileSync(FLAG_FILE,JSON.stringify(n)+'\n');}catch{}}
export async function isAdminToken(token){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`,'content-type':'application/json'},body:'{}'});return r.ok&&(await r.json())===true;}
const suspect=(c,why,extra='')=>{c.strikes++;addFlag(c,why,String(extra));log('ŞÜPHELİ',`#${c.playerNo}`,c.nick,why,extra,`(uyarı ${c.strikes})`);if(c.strikes>=30){log('ATILDI',`#${c.playerNo}`,c.nick);c.ws.close(4003,'hile');}};
const send=(c,o)=>{if(c.ws.readyState===1)c.ws.send(typeof o==='string'?o:JSON.stringify(o));};
const toSea=(c,o,self=false)=>{const room=seas.get(c.sea);if(!room)return;const s=JSON.stringify(o);for(const x of room)if(self||x!==c)send(x,s);};
const toAll=(c,o)=>{const s=JSON.stringify(o);for(const x of all)if(x!==c&&x.uid)send(x,s);};
function leaveSea(c){if(!c.sea)return;const room=seas.get(c.sea);if(room){room.delete(c);if(!room.size)seas.delete(c.sea);}if(c.netId)toSea(c,{t:'leave',id:c.netId});c.sea='';c.last=null;}

const httpServer=http.createServer(async(q,r)=>{const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization','content-type':'application/json'};
  if(q.method==='OPTIONS'){r.writeHead(204,cors);r.end();return;}
  if(q.method==='POST'&&q.url?.startsWith('/shopier/osb')){let body='';q.on('data',d=>{body+=d;if(body.length>100000)q.destroy();});
    q.on('end',async()=>{const ok=await handleOsb(body).catch(e=>{log('SHOPIER hata',e?.message);return false;});r.writeHead(ok?200:400,{'content-type':'text/plain'});r.end(ok?'success':'fail');});return;}
  if(q.url?.startsWith('/flags')){const token=String(q.headers.authorization||'').replace(/^Bearer /,'');
    if(!token||!(await isAdminToken(token).catch(()=>false))){r.writeHead(403,cors);r.end('{"error":"yetki yok"}');return;}
    r.writeHead(200,cors);r.end(JSON.stringify([...flags].reverse().slice(0,300)));return;}
  // Oyuncu sayıları herkese açık değil: yalnızca yönetici oturumuyla /stats
  if(q.url?.startsWith('/stats')){const token=String(q.headers.authorization||'').replace(/^Bearer /,'');
    if(!token||!(await isAdminToken(token).catch(()=>false))){r.writeHead(403,cors);r.end('{"error":"yetki yok"}');return;}
    r.writeHead(200,cors);r.end(JSON.stringify({online:[...all].filter(c=>c.uid).length,seas:Object.fromEntries([...seas].map(([k,v])=>[k,v.size])),uptime:Math.round((Date.now()-started)/1000)}));return;}
  r.writeHead(200,cors);r.end(JSON.stringify({ok:true,name:'Pirate Rage oyun sunucusu'}));});
const wss=new WebSocketServer({server:httpServer,path:'/ws',maxPayload:16*1024});
wss.on('connection',ws=>{
  const c={ws,uid:'',nick:'',playerNo:0,netId:'',sea:'',last:null,strikes:0,rState:new Rate(LIMITS.statesPerSec,1000),rFire:new Rate(LIMITS.firesPerSec,1000),rChat:new Rate(LIMITS.chatPerMin,60000),rMsg:new Rate(60,1000)};
  all.add(c);const authTimer=setTimeout(()=>{if(!c.uid)ws.close(4001,'giriş yok');},10000);
  ws.on('message',async raw=>{const now=Date.now();if(!c.rMsg.hit(now)){suspect(c,'mesaj seli');return;}
    let m;try{m=JSON.parse(String(raw));}catch{return;}if(!m||typeof m.t!=='string')return;
    if(m.t==='auth'){if(c.uid)return;const who=await verifyToken(String(m.token||'')).catch(()=>null);
      if(!who){ws.close(4001,'giriş geçersiz');return;}if(who.banned){ws.close(4002,'hesap kapalı');return;}
      for(const x of all)if(x.uid===who.uid&&x!==c)x.ws.close(4004,'başka yerden bağlanıldı');
      Object.assign(c,who);c.netId=String(m.netId||'').slice(0,16)||Math.random().toString(36).slice(2,10);clearTimeout(authTimer);
      send(c,{t:'hello',id:c.netId,nick:c.nick,playerNo:c.playerNo});log('GİRİŞ',`#${c.playerNo}`,c.nick);return;}
    if(!c.uid)return;
    switch(m.t){
      case'join':{const name=String(m.sea||'').slice(0,40);if(name===c.sea)return;leaveSea(c);if(!name)return;
        const room=seas.get(name)??new Set();if(room.size>=LIMITS.maxPerSea){send(c,{t:'full'});return;}room.add(c);seas.set(name,room);c.sea=name;send(c,{t:'joined',sea:name});return;}
      case'state':{if(!c.sea||!c.rState.hit(now))return;const s=m.d;const v=checkState(c.last,s,now);if(v==='bad')return;if(v==='speed')suspect(c,'hız',`${Math.round(s.x)},${Math.round(s.y)}`);
        c.last={x:s.x,y:s.y,at:now};s.id=c.netId;if('nick' in s)s.nick=c.nick;toSea(c,{t:'state',d:s});return;}
      case'fire':{if(!c.sea||!c.rFire.hit(now)){suspect(c,'atış hızı');return;}const f=m.d;const v=checkFire(f);if(v!=='ok'){suspect(c,'hasar',String(f?.damage));return;}f.from=c.netId;toSea(c,{t:'fire',d:f});return;}
      case'sunk':{if(!c.sea)return;const s=m.d||{};s.victim=c.netId;s.victimNick=c.nick;toSea(c,{t:'sunk',d:s});return;}
      case'chat':{if(!c.rChat.hit(now))return;const text=String(m.d?.text||'').slice(0,LIMITS.chatLen).trim();if(!text)return;
        toAll(c,{t:'chat',d:{nick:c.nick,tag:m.d?.tag??null,text,at:now}});return;}
      case'bid':{const b=m.d||{};b.id=c.uid;b.nick=c.nick;toAll(c,{t:'bid',d:b});return;}
      case'known':case'ask':{toAll(c,{t:m.t,d:m.d});return;}
    }
  });
  ws.on('close',()=>{clearTimeout(authTimer);leaveSea(c);all.delete(c);if(c.uid)log('ÇIKIŞ',`#${c.playerNo}`,c.nick);});
  ws.on('error',()=>{});
});
// Ölü bağlantıları temizle
setInterval(()=>{for(const c of all){if(c.ws.isAlive===false){c.ws.terminate();continue;}c.ws.isAlive=false;try{c.ws.ping();}catch{}}},30000).unref();
wss.on('connection',ws=>{ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true;});});
if(process.env.NODE_ENV!=='test')httpServer.listen(PORT,'127.0.0.1',()=>log(`Oyun sunucusu ${PORT} portunda`));
