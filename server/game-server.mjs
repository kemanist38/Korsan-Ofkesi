// Pirate Rage oyun sunucusu (VPS). Oyuncular WebSocket ile bağlanır; deniz, sohbet ve ihale mesajları sunucudan geçer.
// Sunucu her mesajı denetler: kimlik ve kaptan adı hesaptan gelir (taklit edilemez), mesaj sıklığı, hasar ve hız sınırlanır,
// banlı hesaplar bağlanamaz. Şüpheli davranış günlüğe (pm2 logs) yazılır.
// Çalıştırma: node game-server.cjs  (ortam: PORT=3000, SUPABASE_URL, SUPABASE_ANON)
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {WebSocketServer} from 'ws';
import {BOSS_HP,SIEGE_HP_PER_CAPTAIN} from '../src/pve-balance.ts';
import {fleetTowerStats,playerBaseHp} from '../src/fleetBalance.ts';
import {pvpClamp,newPvpBudget} from '../src/pvp.ts';

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
  // Yalnızca yük testi (tools/bench-server.mjs): BENCH_AUTH=1 iken sahte hesaplar. Canlı sunucuda bu değişken yoktur.
  if(process.env.BENCH_AUTH==='1'&&token.startsWith('bench:')){const [n,g]=token.slice(6).split(':').map(Number);return{uid:'b'+n,nick:'Bot'+n,playerNo:90000+n,banned:false,guildId:g||0};}
  const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`}});
  if(!u.ok)return null;const user=await u.json();
  const p=await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=nick,player_no,banned`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`}});
  const rows=p.ok?await p.json():[];const prof=rows[0];if(!prof)return null;
  return{uid:user.id,nick:prof.nick,playerNo:prof.player_no,banned:!!prof.banned,guildId:await guildOf(user.id).catch(()=>0)};
}
export async function guildOf(uid){const r=await fetch(`${SUPABASE_URL}/rest/v1/guild_members?user_id=eq.${uid}&select=guild_id`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`}});
  const rows=r.ok?await r.json():[];return Number(rows[0]?.guild_id||0);}

// ---------------------------------------------------------------- Shopier Otomatik Sipariş Bildirimi
// Shopier POST eder: res (base64 JSON) ve hash = HMAC-SHA256(res + kullanıcı, şifre). İmza tutarsa sipariş veritabanına işlenir.
// Hangi hesaplama tuttuysa adı döner (teşhis için); hiçbiri tutmazsa ''
export function osbMatch(res,hash,user,pass){if(!res||!hash||!user||!pass)return'';user=user.trim();pass=pass.trim();const h=String(hash).trim();
  const eq=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
  const tries=[['res+kullanıcı',pass,res+user],['kullanıcı+res',pass,user+res],['res (anahtar=şifre)',pass,res],['ters anahtar',user,res+pass]];
  for(const [name,key,data] of tries){const raw=crypto.createHmac('sha256',key).update(data).digest();if(eq(h.toLowerCase(),raw.toString('hex'))||eq(h,raw.toString('base64')))return name;}
  return'';}
export const verifyOsb=(res,hash,user,pass)=>!!osbMatch(res,hash,user,pass);
export function parseOsb(res){const d=JSON.parse(Buffer.from(res,'base64').toString('utf8'));const pick=(...k)=>{for(const x of k)if(d[x]!==undefined&&d[x]!==null&&d[x]!=='')return d[x];return null;};
  return{order:String(pick('orderid','order_id','platform_order_id','id')??''),email:pick('email','buyer_email','buyeremail'),note:pick('customernote','customer_note','note','buyernote'),
    price:Number(String(pick('price','total','total_order_value','amount')??'0').replace(',','.')),test:['1','true',1,true].includes(pick('istest','is_test','test')),keys:Object.keys(d)};}
// Shopier alanları multipart/form-data ya da urlencoded gönderebilir
export function parseForm(body,ctype=''){const m=/boundary=(?:"([^"]+)"|([^;]+))/i.exec(ctype);if(!m)return new URLSearchParams(body);
  const out=new URLSearchParams(),b='--'+(m[1]||m[2]).trim();
  for(const part of body.split(b)){const i=part.indexOf('\r\n\r\n');if(i<0)continue;const head=part.slice(0,i),name=/name="([^"]+)"/i.exec(head)?.[1];if(!name)continue;
    out.append(name,part.slice(i+4).replace(/\r\n$/,''));}
  return out;}
async function handleOsb(body,ctype){const form=parseForm(body,ctype),res=form.get('res')||'',hash=form.get('hash')||'';
  // Teşhis: gelen alanların adları ve uzunlukları (değerler yazılmaz)
  log('SHOPIER istek geldi',ctype||'-','alanlar:',[...form.keys()].map(k=>`${k}(${(form.get(k)||'').length})`).join(',')||`gövde ${body.length} bayt`,'ayar:',OSB_USER?'kullanıcı var':'KULLANICI YOK',OSB_PASS?'şifre var':'ŞİFRE YOK',SERVER_SECRET?'anahtar var':'ANAHTAR YOK');
  const how=osbMatch(res,hash,OSB_USER,OSB_PASS);
  if(!how){let json='hayır';try{JSON.parse(Buffer.from(res,'base64').toString('utf8'));json='evet';}catch{}
    log('SHOPIER imza geçersiz','res uzunluk',res.length,'json okunuyor',json,'hash uzunluk',hash.length,'kullanıcı uzunluk',OSB_USER.length,'şifre uzunluk',OSB_PASS.length);return false;}
  log('SHOPIER imza doğru:',how);
  let o;try{o=parseOsb(res);}catch{log('SHOPIER veri okunamadı');return false;}
  log('SHOPIER sipariş',o.order,o.price,'alanlar:',o.keys.join(','));
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/shopier_credit`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},
    body:JSON.stringify({p_secret:SERVER_SECRET,p_order:o.order,p_email:o.email,p_note:o.note,p_price:o.price,p_test:o.test})});
  const st=r.ok?await r.json():`hata ${r.status} ${await r.text()}`;log('SHOPIER sonuç',o.order,st);
  // İmza doğruysa Shopier'a başarı dönülür; veritabanı hatası olursa sipariş günlükte kalır, yönetici elle yükler
  return true;}

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
// ---------------------------------------------------------------- PvP denetimi (saf fonksiyonlar, testli)
// Can sınırı: sunucudaki seviye ve gövde geliştirmesinden; donanım, elit gemi ve madalya bonusları için ×1,8 pay
// Sunucu her oyuncunun PvP canını da tutar: kendi bildirdiği can, iyileşme payı (tam can/40 sn) ve ona isabet eden atışlar.
// Oyuncu güllesi hedefini izlediği için gönderilen atış isabet demektir. Hasar hedefin bütçesiyle sınırlanır (20 sn'den önce batmaz).
// Sunucudaki can, gecikme ve iyileşme payıyla birlikte canın %30'u kadar eksiye düşerse oyuncu ölümsüz sayılır ve batırılır.
export const HP_BONUS_MAX=1.8,HEAL_SECONDS=40,GOD_MARGIN=.3,PVP_RANGE=1500;
export function hpCap(st){if(!st)return Infinity;return Math.round(playerBaseHp(Number(st.level)||1,Number(st.u_hull)||0)*HP_BONUS_MAX);}
const pvpOf=t=>t.pvp??={budget:null,heal:null,hp:null,at:0,from:new Map()};
export function pvpGuard(t,dmg,now){const p=pvpOf(t),max=t.maxHp||1;p.budget??=newPvpBudget(max,now/1000);
  const dealt=pvpClamp(p.budget,max,Math.max(0,dmg),now/1000);if(p.hp!==null)p.hp-=dealt;return Math.round(dealt);}
// Dost iyileştirme güllesi: aynı bütçe kuralıyla (saniyede en çok tam can/20)
export function pvpHeal(t,amt,now){const p=pvpOf(t),max=t.maxHp||1;p.heal??=newPvpBudget(max,now/1000);
  const got=pvpClamp(p.heal,max,Math.max(0,amt),now/1000);if(p.hp!==null)p.hp=Math.min(max,p.hp+got);return Math.round(got);}
export function noteHp(t,hp,now){const p=pvpOf(t),max=t.maxHp||hp;
  p.hp=p.hp===null?hp:Math.min(hp,Math.min(max,p.hp+Math.max(0,now-p.at)*max/HEAL_SECONDS/1000));p.at=now;}
export function godCheck(t){const p=t.pvp;return!!p&&p.hp!==null&&!!t.maxHp&&p.hp<=-GOD_MARGIN*t.maxHp;}
export function pvpReset(t){if(t.pvp){t.pvp.budget=null;t.pvp.heal=null;t.pvp.hp=null;t.pvp.from.clear();}}
// Oyuncu başına saniyelik hasar sınırı (boss, kuşatma, ada kuleleri): seviyenin bossunu tek başına ~40 sn'de batıracak hız
// (tasarımdaki en güçlü tek oyuncunun ~3 katı), en çok 3 saniyelik birikim. Fazlası sayılmaz; sınırı 2 kat aşan işaretlenir.
export function dpsCap(level){const l=Math.max(1,Math.min(8,Math.round(Number(level)||1)));return BOSS_HP[l]/40;}
export function dpsTake(c,dmg,now){const rate=dpsCap(c.econ?.level??8);c.dps??={pool:rate*3,t:now,over:0};const d=c.dps;
  d.pool=Math.min(rate*3,d.pool+Math.max(0,now-d.t)/1000*rate);d.t=now;const ok=Math.max(0,Math.min(dmg,d.pool));d.pool-=ok;
  d.over=dmg>ok?d.over+(dmg-ok):Math.max(0,d.over-ok);return{ok,flag:d.over>rate*6};}
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
// Atış: yalnızca atan oyuncuya yakın olanlara ve hedefe (uzaktakiler görmez)
const toNear=(c,o,target)=>{const room=seas.get(c.sea);if(!room)return;const s=JSON.stringify(o);for(const x of room){if(x===c)continue;if(x.netId===target||!c.last||!x.last||Math.abs(x.last.x-c.last.x)+Math.abs(x.last.y-c.last.y)<NEAR)send(x,s);}};
const toAll=(c,o)=>{const s=JSON.stringify(o);for(const x of all)if(x!==c&&x.uid)send(x,s);};
function leaveSea(c){c.seen=null;c.state=null;for(const x of seas.get(c.sea)||[])x.seen?.delete(c);if(!c.sea)return;const room=seas.get(c.sea);if(room){room.delete(c);if(!room.size)seas.delete(c.sea);}if(c.netId)toSea(c,{t:'leave',id:c.netId});c.sea='';c.last=null;}

// ---------------------------------------------------------------- Paylaşılan boss
// Boss'un canı ve katkılar sunucuda tutulur: denizdeki herkes aynı boss'a vurur. Tetikleyici NPC batırmaları deniz için ortak
// sayılır (bkill). Oyuncular verdikleri hasarı toplu bildirir (bhit; tek pakette en çok BOSS_HIT_CAP, saniyede 5 paket).
// Boss batınca o denizde bulunan her katılımcıya payı (hasar / toplam) ve katılımcı sayısı gönderilir. 20 dakikada batmazsa kaybolur.
export const BOSS_LIFE_MS=20*60_000,BOSS_HIT_CAP=80_000;
export const bossSeas=new Map(); // deniz adı → {kills, boss}
export const seaTier=name=>{const m=/^sea-(\d)-\d$/.exec(name);return m?Number(m[1]):0;};
export function bossKill(name,need,now=Date.now(),rand=Math.random){const tier=seaTier(name);if(!tier)return null;
  const st=bossSeas.get(name)??{kills:0,boss:null};bossSeas.set(name,st);if(st.boss)return null;
  need=Math.max(50,Math.min(200,Math.round(Number(need)||200)));if(++st.kills<need)return null;st.kills=0;
  st.boss={id:Math.random().toString(36).slice(2,9),hp:BOSS_HP[tier],maxHp:BOSS_HP[tier],x:Math.round(700+rand()*4600),y:Math.round(600+rand()*2800),at:now,dmg:new Map(),dirty:false};
  return st.boss;}
export const bossInfo=(name,b)=>({sea:name,id:b.id,hp:b.hp,maxHp:b.maxHp,x:b.x,y:b.y,left:Math.max(0,BOSS_LIFE_MS-(Date.now()-b.at))});
// Hasar işlenir; boss batarsa {uid: {share,dmg}} ve katılımcı sayısı döner
export function bossHit(name,uid,dmg){const b=bossSeas.get(name)?.boss;if(!b||!(dmg>0))return null;dmg=Math.min(BOSS_HIT_CAP,dmg,b.hp);
  b.hp-=dmg;b.dmg.set(uid,(b.dmg.get(uid)||0)+dmg);b.dirty=true;if(b.hp>0)return null;
  const total=[...b.dmg.values()].reduce((a,v)=>a+v,0)||1,shares={};for(const [u,d] of b.dmg)shares[u]={share:d/total,dmg:Math.round(d)};
  bossSeas.get(name).boss=null;return{id:b.id,shares,n:b.dmg.size};}
function bossTick(now){for(const [name,st] of bossSeas){const b=st.boss;if(!b)continue;const room=seas.get(name);
  if(now-b.at>BOSS_LIFE_MS){st.boss=null;if(room)for(const x of room)send(x,{t:'bgone',d:{id:b.id}});continue;}
  if(b.dirty&&room){b.dirty=false;const msg=JSON.stringify({t:'bhp',d:{id:b.id,hp:Math.round(b.hp)}});for(const x of room)send(x,msg);}}}

// ---------------------------------------------------------------- Paylaşılan filo adaları
// Ada sahibi, kuleler ve yıkık kaideler veritabanında (islands); kule canı burada canlı tutulur ve 30 sn'de bir yazılır.
// Saldırı: sahibi olmayan filo/oyuncu vurur (thit). Şifa: yalnız sahibi filonun üyeleri (thit heal). Kendiliğinden onarım yok.
// Son kuleyi yıkan oyuncunun filosu adayı alır. Sahipsiz (NPC) adanın yıkılan kulesi 1 saat sonra geri gelir.
// Saldırı altındaki adanın sahibi filonun çevrim içi üyelerine 5 sn'de bir uyarı gider.
export const ISLAND_KEYS=['2/1','2/2','3/1','3/2','4/1','4/2','5/1','5/2','6/1','6/2','7/1','7/2','8/1','8/2'];
export const TOWER_SLOTS=16,RUIN_MS=3600_000,TOWER_HIT_CAP=400_000,TOWER_HEAL_CAP=300_000;
export const islands=new Map();
const islandTier=k=>Number(String(k)[0]);
export function islandFromRow(row,tag='',now=Date.now()){const tier=islandTier(row.map_key),max=fleetTowerStats(tier).hp,ruins={...(row.ruins||{})};
  let towers;if(!row.guild_id)towers=Array.from({length:TOWER_SLOTS},(_,i)=>ruins[i]&&now-ruins[i]<RUIN_MS?null:{type:'npc',hp:max,maxHp:max});
  else towers=Array.from({length:TOWER_SLOTS},(_,i)=>{const t=(row.towers||[])[i];return t&&typeof t==='object'?{type:t.type||'cannon',hp:Math.max(1,Math.min(max,Number(t.hp)||max)),maxHp:max}:null;});
  return{key:row.map_key,guild:Number(row.guild_id||0),tag,towers,ruins,hitAt:0,hpDirty:false,dirty:new Set(),emptySince:towers.some(Boolean)?0:now};}
export const islandInfo=i=>({key:i.key,guild:i.guild,tag:i.tag,towers:i.towers.map(t=>t?[Math.round(t.hp),t.maxHp]:null),ruins:i.ruins});
const seaOfIsland=k=>`sea-${k.replace('/','-')}`,islandOfSea=name=>{const m=/^sea-(\d)-(\d)$/.exec(name);return m&&Number(m[1])>=2?`${m[1]}/${m[2]}`:null;};
// Vuruş ya da şifa; sonuç: {destroyed, captured} ya da null
export function towerHit(key,slot,guildId,dmg,heal,now=Date.now()){const i=islands.get(key),t=i?.towers[slot];if(!t||!(dmg>0))return null;
  if(heal){if(!guildId||guildId!==i.guild||t.hp>=t.maxHp)return null;t.hp=Math.min(t.maxHp,t.hp+Math.min(TOWER_HEAL_CAP,dmg));i.dirty.add(slot);i.hpDirty=true;return{healed:true};}
  if(i.guild&&guildId===i.guild)return null;
  t.hp-=Math.min(TOWER_HIT_CAP,dmg);i.hitAt=now;i.dirty.add(slot);i.hpDirty=true;if(t.hp>0)return{};
  i.towers[slot]=null;i.ruins[slot]=now;const res={destroyed:true,captured:false};
  if(i.towers.every(x=>!x)){i.emptySince=now;if(guildId){i.guild=guildId;i.ruins={};res.captured=true;}}
  return res;}
async function dbRpc(fn,args){if(!SERVER_SECRET)return;const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},body:JSON.stringify({p_secret:SERVER_SECRET,...args})});
  if(!r.ok)log('ADA kayıt hatası',fn,r.status,await r.text());}
async function dbRpcJson(fn,args){if(!SERVER_SECRET)return null;const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},body:JSON.stringify({p_secret:SERVER_SECRET,...args})});
  if(!r.ok){log('RPC hatası',fn,r.status,await r.text());return null;}return r.json();}
export const seaMap=name=>{const m=/^sea-(\d)-(\d)$/.exec(name||'');return m?`${m[1]}/${m[2]}`:null;};
// Casus (013_spy.sql): bedeli ve kalkanı veritabanı işler; konum oyundaysa sunucudan, değilse son çıkış yerinden
async function onSpy(c,nick){const r=await dbRpcJson('spy_charge',{p_spy:c.uid,p_nick:String(nick||'').slice(0,24)}).catch(()=>null);
  if(!r){send(c,{t:'spyr',d:{status:'error'}});return;}
  if(r.status==='found'){const live=[...all].find(x=>x.uid===r.target&&x.sea&&x.last);
    if(live){const map=seaMap(live.sea);send(c,{t:'spyr',d:{status:'found',nick:r.nick,online:true,map:map??'kale',x:live.last.x,y:live.last.y}});return;}
    send(c,{t:'spyr',d:{status:'found',nick:r.nick,online:false,map:r.map??null,x:r.x??null,y:r.y??null}});return;}
  send(c,{t:'spyr',d:r});}
// Oyuncunun sunucudaki seviyesi ve geliştirmeleri (011 economy_peek); 5 dakikada bir tazelenir
async function loadEcon(c){if(!SERVER_SECRET||!c.uid)return;try{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/economy_peek`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},body:JSON.stringify({p_secret:SERVER_SECRET,p_uid:c.uid})});
  if(r.ok){const st=await r.json();if(st&&typeof st==='object')c.econ=st;}}catch{}
  if(all.has(c))setTimeout(()=>{void loadEcon(c);},5*60_000).unref?.();}
async function guildTag(id){if(!id)return'';const r=await fetch(`${SUPABASE_URL}/rest/v1/guilds?id=eq.${id}&select=tag`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`}});const rows=r.ok?await r.json():[];return rows[0]?.tag||'';}
async function loadIsland(key){const r=await fetch(`${SUPABASE_URL}/rest/v1/islands?map_key=eq.${encodeURIComponent(key)}&select=*`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`}});
  const row=(r.ok?await r.json():[])[0]??{map_key:key};const i=islandFromRow(row,await guildTag(row.guild_id).catch(()=>''));islands.set(key,i);return i;}
export async function loadIslands(){for(const k of ISLAND_KEYS)await loadIsland(k).catch(e=>{log('ADA okunamadı',k,e?.message);islands.set(k,islandFromRow({map_key:k}));});log('ADALAR yüklendi');}
async function saveIslandHp(i){if(!i.guild||!i.hpDirty)return;i.hpDirty=false;await dbRpc('island_hp',{p_map:i.key,p_hps:i.towers.map(t=>t?Math.round(t.hp):null)}).catch(()=>{});}
function sendRoom(key,o){const room=seas.get(seaOfIsland(key));if(!room)return;const m=JSON.stringify(o);for(const x of room)send(x,m);}
let islandTickNo=0;
function islandTick(now){islandTickNo++;
  for(const i of islands.values()){
    if(i.dirty.size){sendRoom(i.key,{t:'thp',d:{key:i.key,s:[...i.dirty].map(n=>[n,Math.round(i.towers[n]?.hp??0)])}});i.dirty.clear();}
    // Sahipsiz adada yıkılan kule 1 saat sonra geri gelir
    if(!i.guild&&i.towers.some((t,n)=>!t&&now-(i.ruins[n]??0)>=RUIN_MS)){const max=fleetTowerStats(islandTier(i.key)).hp;i.towers=i.towers.map((t,n)=>t||(now-(i.ruins[n]??0)>=RUIN_MS?{type:'npc',hp:max,maxHp:max}:null));sendRoom(i.key,{t:'isle',d:islandInfo(i)});}
    if(i.guild&&now-i.hitAt<6000&&islandTickNo%17===0){const m=JSON.stringify({t:'ialert',d:{key:i.key}});for(const c of all)if(c.guildId===i.guild)send(c,m);}
    if(islandTickNo%100===0)void saveIslandHp(i);
    // Kulesiz kalan filo adası 1 saat içinde kule dikilmezse sahipsiz (NPC) adaya döner
    if(i.guild&&i.towers.some(Boolean))i.emptySince=0;
    else if(i.guild&&i.emptySince&&now-i.emptySince>=RUIN_MS){log('ADA SAHİPSİZ KALDI',i.key);const n=islandFromRow({map_key:i.key},'',now);Object.assign(i,{guild:0,tag:'',towers:n.towers,ruins:{},emptySince:0});
      void dbRpc('island_capture',{p_map:i.key,p_guild:null}).catch(()=>{});sendRoom(i.key,{t:'isle',d:islandInfo(i)});}}}
async function onTowerHit(c,m,now){const key=islandOfSea(c.sea),d=m.d||{},slot=Number(d.slot),heal=!!d.heal;let dmg=Number(d.dmg);
  if(!key||!Number.isInteger(slot)||slot<0||slot>=TOWER_SLOTS||!num(dmg)||dmg<=0)return;if(!heal&&dmg>TOWER_HIT_CAP)suspect(c,'kule hasarı',String(dmg));
  if(!heal){const t=dpsTake(c,dmg,now);if(t.flag){suspect(c,'saniyelik hasar','kule');c.dps.over=0;}dmg=t.ok;if(dmg<=0)return;}
  const r=towerHit(key,slot,c.guildId,dmg,heal,now);if(!r?.destroyed)return;const i=islands.get(key);
  sendRoom(key,{t:'tdown',d:{key,slot,by:c.netId}});
  if(r.captured){log('ADA ELE GEÇİRİLDİ',key,c.nick);i.tag=await guildTag(i.guild).catch(()=>'');await dbRpc('island_capture',{p_map:key,p_guild:i.guild}).catch(()=>{});
    sendRoom(key,{t:'isle',d:islandInfo(i)});const msg=JSON.stringify({t:'icap',d:{key,tag:i.tag,by:c.netId,nick:c.nick}});for(const x of all)if(x.uid)send(x,msg);}
  else await dbRpc('island_destroy',{p_map:key,p_slot:slot,p_at:now}).catch(()=>{});}

// ---------------------------------------------------------------- Ortak kuşatma (Cuma 20:00–22:00, Türkiye saati)
// Kara Kale tek: 12 sur kulesi (0–11), 4 iç kule (12–15), komutan (16). Can, katılan kaptan sayısıyla büyür (oran korunur).
// Sırayla açılır: iç kuleler surlar düşmeden, komutan iç kuleler düşmeden vurulamaz. Katkı sunucuda tutulur.
// Pencere dışında kuşatma kapalıdır; yalnızca SIEGE_TRIAL=1 ortam değişkeniyle 2 saatlik deneme kuşatması açılır.
const SIEGE_TRIAL=process.env.SIEGE_TRIAL==='1';
export const SIEGE_ROOM='sea-siege',SIEGE_PIECES=17,SIEGE_HIT_CAP=400_000;
const SIEGE_GRACE_MS=10*60_000;
const pieceBase=i=>i<12?SIEGE_HP_PER_CAPTAIN.wall:i<16?SIEGE_HP_PER_CAPTAIN.inner:SIEGE_HP_PER_CAPTAIN.commander;
export function siegeWindowAt(now){const t=new Date(now+3*3600_000),day=t.getUTCDay(),h=t.getUTCHours();const start=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate(),20)-3*3600_000;
  return{open:day===5&&h>=20&&h<22,id:`w-${t.toISOString().slice(0,10)}`,end:start+2*3600_000};}
export let siegeRun=null;
export function resetSiege(){siegeRun=null;}
export function siegeJoin(uid,nick,now=Date.now()){const w=siegeWindowAt(now);if(!w.open&&!SIEGE_TRIAL)return null;
  const reuse=siegeRun&&(w.open?siegeRun.id===w.id:(!siegeRun.result&&now<siegeRun.end));
  if(!reuse){if(w.open||!siegeRun||siegeRun.result||now>=siegeRun.end){siegeRun={id:w.open?w.id:`t-${now}`,end:w.open?w.end:now+2*3600_000,hp:Array.from({length:SIEGE_PIECES},(_,i)=>pieceBase(i)),max:Array.from({length:SIEGE_PIECES},(_,i)=>pieceBase(i)),
    caps:new Set(),contrib:new Map(),result:null,dirty:new Set(),rankDirty:true};}}
  const r=siegeRun;if(!r.caps.has(uid)&&!r.result){r.caps.add(uid);const n=r.caps.size;
    for(let i=0;i<SIEGE_PIECES;i++){const nm=pieceBase(i)*n;if(r.hp[i]>0)r.hp[i]=r.hp[i]/r.max[i]*nm;r.max[i]=nm;r.dirty.add(i);}}
  if(!r.contrib.has(uid))r.contrib.set(uid,{nick,dmg:0});return r;}
const siegePhaseOf=r=>r.hp.slice(0,12).some(h=>h>0)?1:r.hp.slice(12,16).some(h=>h>0)?2:3;
// Vuruş: sonuç {down:parça} ya da {won:true}; sıra dışı parça ya da biten kuşatma yok sayılır
export function siegeHitPiece(uid,nick,i,dmg){const r=siegeRun;if(!r||r.result||!(dmg>0)||!Number.isInteger(i)||i<0||i>=SIEGE_PIECES||r.hp[i]<=0)return null;
  const ph=siegePhaseOf(r);if((i>=12&&i<16&&ph<2)||(i===16&&ph<3))return null;
  const d=Math.min(SIEGE_HIT_CAP,dmg,r.hp[i]);r.hp[i]-=d;const c=r.contrib.get(uid)??{nick,dmg:0};c.dmg+=d;c.nick=nick;r.contrib.set(uid,c);r.dirty.add(i);r.rankDirty=true;
  if(r.hp[i]>0)return{};if(i===16){r.result='won';return{down:i,won:true};}return{down:i};}
const siegeTop=r=>[...r.contrib.values()].filter(c=>c.dmg>0).sort((a,b)=>b.dmg-a.dmg).slice(0,10).map(c=>[c.nick,Math.round(c.dmg)]);
export const siegeInfo=(r,uid)=>({id:r.id,end:r.end,n:r.caps.size,hp:r.hp.map(Math.round),max:r.max,result:r.result,top:siegeTop(r),mine:Math.round(r.contrib.get(uid)?.dmg??0)});
function siegeFinish(){const r=siegeRun,room=seas.get(SIEGE_ROOM),total=[...r.contrib.values()].reduce((a,c)=>a+c.dmg,0)||1;log('KUŞATMA BİTTİ',r.result,r.caps.size,'kaptan');
  for(const x of room||[])send(x,{t:'send',d:{won:r.result==='won',n:r.caps.size,top:siegeTop(r),mine:Math.round(r.contrib.get(x.uid)?.dmg??0),share:(r.contrib.get(x.uid)?.dmg??0)/total}});}
let siegeTickNo=0;
function siegeTick(now){const r=siegeRun;if(!r)return;siegeTickNo++;const room=seas.get(SIEGE_ROOM);
  if(!r.result&&now>r.end){r.result='lost';siegeFinish();}
  if(r.dirty.size&&room){const m=JSON.stringify({t:'shp',d:[...r.dirty].map(i=>[i,Math.round(r.hp[i]),r.max[i]])});for(const x of room)send(x,m);r.dirty.clear();}
  if(r.rankDirty&&siegeTickNo%7===0&&room){r.rankDirty=false;const top=siegeTop(r);for(const x of room)send(x,{t:'srank',d:{n:r.caps.size,top,mine:Math.round(r.contrib.get(x.uid)?.dmg??0)}});}
  if(r.result&&now>r.end+SIEGE_GRACE_MS)siegeRun=null;}

// ---------------------------------------------------------------- Durum paketleme (trafik)
// Hareket mesajları anında herkese iletilmez: her oyuncunun son durumu tutulur ve 10/sn'lik turda her alıcıya tek pakette gider.
// Yakındakiler (NEAR birim) her turda, uzaktakiler saniyede bir güncellenir. Kimlik alanları (ad, gemi, rütbe…) yalnızca
// değiştiğinde ya da alıcı ilk kez gördüğünde gönderilir.
export const NEAR=1800,TICK_MS=100,FAR_EVERY=20;
const IDENT=['nick','tag','ship','maxHp','sp','level'];
function queueState(c,s){const id={};let changed=false;for(const k of IDENT)if(k in s){if(k==='nick')s.nick=c.nick;if(JSON.stringify(c.ident?.[k])!==JSON.stringify(s[k]))changed=true;id[k]=s[k];delete s[k];}
  if(changed){c.ident={...c.ident,...id};c.identVer=(c.identVer||0)+1;}c.state=s;c.stateVer=(c.stateVer||0)+1;}
let tickNo=0;
export function buildBatch(rec,room,tick){const out=[];if(!rec.seen)rec.seen=new Map();const far=tick%FAR_EVERY===0;
  for(const o of room){if(o===rec||!o.state)continue;const seen=rec.seen.get(o)||{s:0,i:0};if(seen.s===o.stateVer)continue;
    const near=!rec.last||!o.last||Math.abs(o.last.x-rec.last.x)+Math.abs(o.last.y-rec.last.y)<NEAR;if(!near&&!far)continue;
    const d={...o.state};if(seen.i!==o.identVer&&o.ident){Object.assign(d,o.ident);seen.i=o.identVer;}seen.s=o.stateVer;rec.seen.set(o,seen);out.push(d);}
  return out;}
setInterval(()=>{tickNo++;if(tickNo%3===0){const now=Date.now();bossTick(now);islandTick(now);siegeTick(now);}for(const room of seas.values()){if(room.size<2)continue;for(const rec of room){const b=buildBatch(rec,room,tickNo);if(b.length)send(rec,{t:'batch',d:b});}}},TICK_MS).unref();

const httpServer=http.createServer(async(q,r)=>{const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization','content-type':'application/json'};
  if(q.method==='OPTIONS'){r.writeHead(204,cors);r.end();return;}
  if(q.method==='POST'&&q.url?.startsWith('/shopier/osb')){let body='';q.on('data',d=>{body+=d;if(body.length>100000)q.destroy();});
    q.on('end',async()=>{const ok=await handleOsb(body,q.headers['content-type']).catch(e=>{log('SHOPIER hata',e?.message);return false;});r.writeHead(ok?200:400,{'content-type':'text/plain'});r.end(ok?'success':'fail');});return;}
  if(q.url?.startsWith('/flags')){const token=String(q.headers.authorization||'').replace(/^Bearer /,'');
    if(!token||!(await isAdminToken(token).catch(()=>false))){r.writeHead(403,cors);r.end('{"error":"yetki yok"}');return;}
    r.writeHead(200,cors);r.end(JSON.stringify([...flags].reverse().slice(0,300)));return;}
  // Oyuncu sayıları herkese açık değil: yalnızca yönetici oturumuyla /stats
  if(q.url?.startsWith('/stats')){const token=String(q.headers.authorization||'').replace(/^Bearer /,'');
    if(!token||!(await isAdminToken(token).catch(()=>false))){r.writeHead(403,cors);r.end('{"error":"yetki yok"}');return;}
    r.writeHead(200,cors);r.end(JSON.stringify({online:[...all].filter(c=>c.uid).length,seas:Object.fromEntries([...seas].map(([k,v])=>[k,v.size])),uptime:Math.round((Date.now()-started)/1000)}));return;}
  r.writeHead(200,cors);r.end(JSON.stringify({ok:true,name:'Pirate Rage oyun sunucusu'}));});
// Sıkıştırma: 256 bayttan büyük paketler (durum paketleri) deflate ile ~4–5 kat küçülür
const wss=new WebSocketServer({server:httpServer,path:'/ws',maxPayload:16*1024,perMessageDeflate:{threshold:256,zlibDeflateOptions:{level:3},serverNoContextTakeover:false,clientNoContextTakeover:true}});
wss.on('connection',ws=>{
  const c={ws,uid:'',nick:'',playerNo:0,netId:'',sea:'',last:null,strikes:0,rState:new Rate(LIMITS.statesPerSec,1000),rFire:new Rate(LIMITS.firesPerSec,1000),rChat:new Rate(LIMITS.chatPerMin,60000),rMsg:new Rate(60,1000),rBoss:new Rate(5,1000),rKill:new Rate(3,1000),rTower:new Rate(12,1000)};
  all.add(c);const authTimer=setTimeout(()=>{if(!c.uid)ws.close(4001,'giriş yok');},10000);
  ws.on('message',async raw=>{const now=Date.now();if(!c.rMsg.hit(now)){suspect(c,'mesaj seli');return;}
    let m;try{m=JSON.parse(String(raw));}catch{return;}if(!m||typeof m.t!=='string')return;
    if(m.t==='auth'){if(c.uid)return;const who=await verifyToken(String(m.token||'')).catch(()=>null);
      if(!who){ws.close(4001,'giriş geçersiz');return;}if(who.banned){ws.close(4002,'hesap kapalı');return;}
      for(const x of all)if(x.uid===who.uid&&x!==c)x.ws.close(4004,'başka yerden bağlanıldı');
      Object.assign(c,who);c.netId=String(m.netId||'').slice(0,16)||Math.random().toString(36).slice(2,10);clearTimeout(authTimer);
      send(c,{t:'hello',id:c.netId,nick:c.nick,playerNo:c.playerNo});log('GİRİŞ',`#${c.playerNo}`,c.nick);void loadEcon(c);return;}
    if(!c.uid)return;
    switch(m.t){
      case'join':{const name=String(m.sea||'').slice(0,40);if(name===c.sea)return;leaveSea(c);if(!name)return;
        const room=seas.get(name)??new Set();if(room.size>=LIMITS.maxPerSea){send(c,{t:'full'});return;}room.add(c);seas.set(name,room);c.sea=name;c.seen=null;send(c,{t:'joined',sea:name});
        const b=bossSeas.get(name)?.boss;if(b)send(c,{t:'boss',d:bossInfo(name,b)});
        const isle=islands.get(islandOfSea(name));if(isle)send(c,{t:'isle',d:islandInfo(isle)});
        if(name===SIEGE_ROOM){const r=siegeJoin(c.uid,c.nick,now);if(r)send(c,{t:'sstate',d:siegeInfo(r,c.uid)});}return;}
      case'state':{if(!c.sea||!c.rState.hit(now))return;const s=m.d;let v=checkState(c.last,s,now);if(v==='speed'&&s.tp&&now-(c.tpAt||0)>8000){c.tpAt=now;v='ok';}delete s.tp;if(v==='bad')return;if(v==='speed'){suspect(c,'hız',`${Math.round(s.x)},${Math.round(s.y)}`);if(c.last)send(c,{t:'pos',d:{x:c.last.x,y:c.last.y}});return;}
        if(num(s.maxHp)){const cap=hpCap(c.econ);if(s.maxHp>cap*1.02){suspect(c,'can sınırı',`${Math.round(s.maxHp)}>${cap}`);s.maxHp=cap;}c.maxHp=s.maxHp;}
        if(c.maxHp&&s.hp>c.maxHp)s.hp=c.maxHp;noteHp(c,s.hp,now);
        c.last={x:s.x,y:s.y,at:now};s.id=c.netId;queueState(c,s);return;}
      case'fire':{if(!c.sea||!c.rFire.hit(now)){suspect(c,'atış hızı');return;}const f=m.d;const v=checkFire(f);if(v!=='ok'){suspect(c,'hasar',String(f?.damage));return;}f.from=c.netId;
        {const t=[...(seas.get(c.sea)||[])].find(x=>x.netId===f.to);if(t){
          if(c.last&&t.last&&Math.hypot(c.last.x-t.last.x,c.last.y-t.last.y)>PVP_RANGE){suspect(c,'menzil');return;}
          if(f.ammo==='heal')pvpHeal(t,f.damage,now);
          else{pvpGuard(t,f.damage,now);pvpOf(t).from.set(c.netId,now);
            if(godCheck(t)){suspect(t,'ölümsüz');pvpReset(t);send(t,{t:'forceSink',d:{by:c.netId,byNick:c.nick}});toSea(t,{t:'sunk',d:{victim:t.netId,victimNick:t.nick,by:c.netId,byNick:c.nick}});return;}}}}
        toNear(c,{t:'fire',d:f},f.to);return;}
      case'sunk':{if(!c.sea)return;const s=m.d||{};s.victim=c.netId;s.victimNick=c.nick;
        // Batıran yalnızca son 60 sn'de bu oyuncuya ateş etmiş biri olabilir (arkadaşa SP yazdırma engeli)
        if(s.by&&!(now-(c.pvp?.from.get(String(s.by))??-1e12)<60_000)){suspect(c,'sahte batırma',String(s.by));s.by=null;s.byNick=null;}
        pvpReset(c);toSea(c,{t:'sunk',d:s});return;}
      case'bkill':{if(!c.sea||!c.rKill.hit(now))return;const b=bossKill(c.sea,m.d?.need,now);if(b){log('BOSS',c.sea);toSea(c,{t:'boss',d:bossInfo(c.sea,b)},true);}return;}
      case'bhit':{if(!c.sea||!c.rBoss.hit(now))return;let dmg=Number(m.d?.dmg);if(!num(dmg)||dmg<=0)return;if(dmg>BOSS_HIT_CAP)suspect(c,'boss hasarı',String(dmg));
        {const t=dpsTake(c,dmg,now);if(t.flag){suspect(c,'saniyelik hasar','boss');c.dps.over=0;}dmg=t.ok;if(dmg<=0)return;}
        const r=bossHit(c.sea,c.uid,dmg);if(!r)return;const room=seas.get(c.sea);log('BOSS BATTI',c.sea,r.n,'kaptan');
        for(const x of room||[])send(x,{t:'bdown',d:{id:r.id,n:r.n,...(r.shares[x.uid]??{share:0,dmg:0})}});return;}
      case'shit':{if(c.sea!==SIEGE_ROOM||!c.rTower.hit(now))return;let dmg=Number(m.d?.dmg);if(!num(dmg)||dmg<=0)return;if(dmg>SIEGE_HIT_CAP)suspect(c,'kuşatma hasarı',String(dmg));
        {const t=dpsTake(c,dmg,now);if(t.flag){suspect(c,'saniyelik hasar','kuşatma');c.dps.over=0;}dmg=t.ok;if(dmg<=0)return;}
        const r=siegeHitPiece(c.uid,c.nick,Number(m.d?.i),dmg);if(!r?.down&&r?.down!==0)return;toSea(c,{t:'sdown',d:{i:r.down}},true);if(r.won)siegeFinish();return;}
      case'spy':{if(!c.rKill.hit(now))return;await onSpy(c,m.d?.nick);return;}
      case'thit':{if(!c.sea||!c.rTower.hit(now))return;await onTowerHit(c,m,now);return;}
      // Kule dikildi (veritabanında): önce canlar yazılır, sonra ada yeniden okunup denize gönderilir
      case'tbuilt':{const key=String(m.d?.key||'');const i=islands.get(key);if(!i||!c.rKill.hit(now))return;await saveIslandHp({...i,hpDirty:true});const n=await loadIsland(key).catch(()=>null);if(n)sendRoom(key,{t:'isle',d:islandInfo(n)});return;}
      // Filoya girme/çıkma sonrası filo bilgisi yenilenir
      case'gref':{if(!c.rKill.hit(now))return;c.guildId=await guildOf(c.uid).catch(()=>c.guildId);return;}
      case'chat':{if(!c.rChat.hit(now))return;const text=String(m.d?.text||'').slice(0,LIMITS.chatLen).trim();if(!text)return;
        toAll(c,{t:'chat',d:{nick:c.nick,tag:m.d?.tag??null,text,at:now}});return;}
      case'bid':{const b=m.d||{};b.id=c.uid;b.nick=c.nick;toAll(c,{t:'bid',d:b});return;}
      case'known':case'ask':{toAll(c,{t:m.t,d:m.d});return;}
    }
  });
  ws.on('close',()=>{clearTimeout(authTimer);if(c.uid&&c.last&&seaMap(c.sea))void dbRpc('spy_seen',{p_uid:c.uid,p_map:seaMap(c.sea),p_x:Math.round(c.last.x),p_y:Math.round(c.last.y)}).catch(()=>{});leaveSea(c);all.delete(c);if(c.uid)log('ÇIKIŞ',`#${c.playerNo}`,c.nick);});
  ws.on('error',()=>{});
});
// Ölü bağlantıları temizle
setInterval(()=>{for(const c of all){if(c.ws.isAlive===false){c.ws.terminate();continue;}c.ws.isAlive=false;try{c.ws.ping();}catch{}}},30000).unref();
wss.on('connection',ws=>{ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true;});});
if(process.env.NODE_ENV!=='test')void loadIslands();
if(process.env.NODE_ENV!=='test')httpServer.listen(PORT,'127.0.0.1',()=>log(`Oyun sunucusu ${PORT} portunda`));
