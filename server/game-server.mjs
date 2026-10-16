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
import {RIVAL_SP,RIVAL_DAILY_LIMIT} from '../src/battle.ts';
import {NPCS,MONSTERS,MAPS,QUESTS,QUEST_COOLDOWN_MS,bossFor,BOSS_KILLS,FLEET,WORLD_WIDTH,WORLD_HEIGHT,coordLabel} from '../src/campaign.ts';
import {TREASURE_PARTS,PART_CHANCE,DIG_RADIUS,treasureReward} from '../src/treasure.ts';
import {questEp,bossEp,ELITE_POINTS_PER_BALL,eliteLevelFromEp} from '../src/arsenal.ts';
import {CANNONS,salvoDamage,reloadTime,rangeOf,targetFactor} from '../src/combat.ts';
import {EQUIPMENT,equipTotals} from '../src/equipment.ts';
import {cumulativeEliteBonus,ELITE_CANNON_CAPACITY} from '../src/elite-progression.ts';
import {ACHIEVEMENTS,MAIN_COLLECTION} from '../src/achievements.ts';
import {officerSlots,OFFICER_MAX_RANK,talentPoints,TALENTS} from '../src/crew.ts';
import {MINE} from '../src/arsenal.ts';
import {sparkleMult} from '../src/events.ts';
import {HERO_DAMAGE,HERO_DAYS} from '../src/siege.ts';
import {createChest} from '../src/loot.ts';
import {fleetReward} from '../src/campaign.ts';
import {contribReward,earnsChest,victoryChest} from '../src/siege.ts';
import {levelQuestGoal,levelQuestTargets,levelQuestMap} from '../src/level-quest.ts';

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
  // Acknowledge only after the order was persisted; failures remain retryable.
  return r.ok && st !== null && !(typeof st==='object' && st.error);}

// ---------------------------------------------------------------- Denetim (saf fonksiyonlar, testli)
const num=v=>typeof v==='number'&&Number.isFinite(v);
export function checkState(prev,s,now){
  if(!s||typeof s!=='object'||Array.isArray(s)||!num(s.x)||!num(s.y)||!num(s.hp)||s.hp<0)return'bad';
  if(s.x<0||s.x>WORLD_WIDTH||s.y<0||s.y>WORLD_HEIGHT)return'bad';
  if(prev&&prev.x!==undefined){const dt=Math.max(.05,(now-prev.at)/1000),d=Math.hypot(s.x-prev.x,s.y-prev.y);
    // Her aşırı hız şüphelidir; yeniden doğma ve liman gibi ışınlanmalar istemcinin tp işaretiyle 8 sn'de bir kabul edilir
    if(d/dt>LIMITS.maxSpeed*1.6+200)return'speed';}
  return'ok';
}
// Karaya çıkma: denizin adalarının kıyı çizgisinin (oyundaki gibi yarıçap×0,72+28) 25 birim içine giren konum kabul edilmez
export const SHORE_SLACK=25;
export function onLand(map,x,y){const m=MAPS[map];if(!m)return null;for(const is of m.islands){if(Math.hypot(x-is.x,y-is.y)<is.r*.72+28-SHORE_SLACK)return is.name;}return null;}
export function checkFire(f){if(!f||!num(f.damage)||!num(f.x)||!num(f.y)||typeof f.to!=='string')return'bad';if(f.damage<0||f.damage>LIMITS.maxHit)return'damage';return'ok';}
// ---------------------------------------------------------------- PvP denetimi (saf fonksiyonlar, testli)
// Can sınırı: sunucudaki seviye ve gövde geliştirmesinden; donanım, elit gemi ve madalya bonusları için ×1,8 pay
// Sunucu her oyuncunun PvP canını da tutar: kendi bildirdiği can, iyileşme payı (tam can/40 sn) ve ona isabet eden atışlar.
// Oyuncu güllesi hedefini izlediği için gönderilen atış isabet demektir. Hasar hedefin bütçesiyle sınırlanır (20 sn'den önce batmaz).
// Sunucudaki can, gecikme ve iyileşme payıyla birlikte canın %30'u kadar eksiye düşerse oyuncu ölümsüz sayılır ve batırılır.
export const HP_BONUS_MAX=1.8,HEAL_SECONDS=40,GOD_MARGIN=.3,PVP_RANGE=1500;
export function hpCap(st){if(!st)return 0;return Math.round(playerBaseHp(Number(st.level)||1,Number(st.u_hull)||0)*HP_BONUS_MAX);}
const pvpOf=t=>t.pvp??={budget:null,heal:null,hp:null,at:0,from:new Map()};
export function pvpGuard(t,dmg,now){const p=pvpOf(t),max=t.maxHp||1;p.budget??=newPvpBudget(max,now/1000);
  const dealt=pvpClamp(p.budget,max,Math.max(0,dmg),now/1000);if(p.hp!==null)p.hp-=dealt;p.hitAt=now;return Math.round(dealt);}
// Dost iyileştirme güllesi: aynı bütçe kuralıyla (saniyede en çok tam can/20)
export function pvpHeal(t,amt,now){const p=pvpOf(t),max=t.maxHp||1;p.heal??=newPvpBudget(max,now/1000);
  const got=pvpClamp(p.heal,max,Math.max(0,amt),now/1000);if(p.hp!==null)p.hp=Math.min(max,p.hp+got);return Math.round(got);}
// İyileşme payı: savaş dışında tam can/40 sn (tamir); son 10 sn'de hasar aldıysa tamir yapılamaz, yalnız can emici payı (tam can/200 sn)
export const COMBAT_HEAL_SECONDS=200,COMBAT_MS=10_000;
export function noteHp(t,hp,now){const p=pvpOf(t),max=t.maxHp||hp,secs=now-(p.hitAt??-1e12)<COMBAT_MS?COMBAT_HEAL_SECONDS:HEAL_SECONDS;
  p.hp=p.hp===null?hp:Math.min(hp,Math.min(max,p.hp+Math.max(0,now-p.at)*max/secs/1000));p.at=now;}
export function godCheck(t){const p=t.pvp;return!!p&&p.hp!==null&&!!t.maxHp&&p.hp<=-GOD_MARGIN*t.maxHp;}
export function pvpReset(t){if(t.pvp){t.pvp.budget=null;t.pvp.heal=null;t.pvp.hp=null;t.pvp.from.clear();}}
// Oyuncu başına saniyelik hasar sınırı (boss, kuşatma, ada kuleleri): seviyenin bossunu tek başına ~40 sn'de batıracak hız
// (tasarımdaki en güçlü tek oyuncunun ~3 katı), en çok 3 saniyelik birikim. Fazlası sayılmaz; sınırı 2 kat aşan işaretlenir.
export function dpsCap(level){const l=Math.max(1,Math.min(8,Math.round(Number(level)||1)));return BOSS_HP[l]/40;}
export function dpsTake(c,dmg,now){const rate=dpsCap(c.econ?.level??8);c.dps??={pool:rate*3,t:now,over:0};const d=c.dps;
  d.pool=Math.min(rate*3,d.pool+Math.max(0,now-d.t)/1000*rate);d.t=now;const ok=Math.max(0,Math.min(dmg,d.pool));d.pool-=ok;
  d.over=dmg>ok?d.over+(dmg-ok):Math.max(0,d.over-ok);return{ok,flag:d.over>rate*6};}
// NPC ve canavar batırma doğrulaması (014): hedef bu denizin hedefi mi, oyuncunun saniyelik hasar bütçesi canına yetiyor mu.
// Doğrulanan batırmanın altın ve TP'si (bonuslar için ×2,5 pay) ve sayaçları ekonomiye bonus hakkı olarak yazılır.
// Seviye görevi: oyuncunun seviyesinin ilk haritasındaki görev ağır gemileri sayılır (lqk); seviye atlama buna bağlıdır.
export const KILL_CREDIT_MULT=2.5;
// Salvo bütçesi (015): oyuncunun bildirdiği salvolar en çok ne kadar hasar verebilir. Gülle başına üst sınır: top hasarı
// (en güçlü top) × geliştirme × gülle çarpanı × hedef türü (1,4) × ateş yanması (1,8) × diğer bonuslar (2,2). Bildirilen
// gülle sayısı gemideki top sayısını aşamaz. Batırma, boss, kuşatma, kule ve PvP hasarı bu bütçeden düşer.
const AMMO_MULT={iron:1,chain:1.25,fire:2.5*1.8,explosive:2.5,breaker:2.25*2.6,leech:3,heal:0};
export function perBall(ammo,st){return 20*1.38*(1+(st?Number(st.u_damage)||0:10)*.11)*(AMMO_MULT[ammo]??1)*1.4*2.2;}
export function cannonsOf(st){if(!st)return 0;return Math.min(315,['cast','long','rapid','heavy'].reduce((a,k)=>a+Math.max(0,Number(st['c_'+k])||0),0));}
const ITEM_OF={iron:'iron',chain:'chain'};
const stockOf=(st,k)=>Math.max(0,Number(st?.[k])||0)+Math.max(0,(Number(st?.['cu_'+k])||0)-(Number(st?.['cn_'+k])||0));
export function noteSalvo(c,d){const a=String(d?.a||'iron');
  if(!Object.hasOwn(AMMO_MULT,a)||!c.econ||![d?.n,d?.i??0].every(x=>Number.isSafeInteger(x)&&x>=0&&x<=10000))return{err:'salvo'};let n=Math.max(0,Math.floor(Number(d?.n)||0)),i=Math.max(0,Math.floor(Number(d?.i)||0));
  const cap=cannonsOf(c.econ),over=n+i>cap*1.05+5;if(over){const k=cap/(n+i);n=Math.floor(n*k);i=Math.floor(i*k);}
  const key=ITEM_OF[a]??'a_'+a;
  if(n+i===0||stockOf(c.econ,key)<n+(a==='iron'?i:0)||(a!=='iron'&&stockOf(c.econ,'iron')<i)||(d?.p&&stockOf(c.econ,'a_powder')<1))return{err:'stok'};
  const dmg=n*perBall(a,c.econ)+i*perBall('iron',c.econ);c.sb??={pool:0};c.sb.pool=Math.min(c.sb.pool+dmg,Math.max(dmg,1)*40);
  const use={};if(n&&a!=='iron')use['cn_'+(ITEM_OF[a]??'a_'+a)]=n;if(i)use.cn_iron=(use.cn_iron||0)+i;if(n&&a==='iron')use.cn_iron=(use.cn_iron||0)+n;if(d?.p)use.cn_a_powder=1;
  return{use,over};}
// Bütçeden hasar düş: karşılanabilen miktarı döner
export function sbTake(c,amount){c.sb??={pool:0};const ok=Math.max(0,Math.min(amount,c.sb.pool));c.sb.pool-=ok;return ok;}
// İksir, mayın, pusula ve kalkan: bekleme süresi denetimi ve kullanım sayımı
export const USE_COOLDOWN={speed:20_000,mine:20_000,compass:16_000,shield:0};
export function noteUse(c,id,now){if(!(id in USE_COOLDOWN))return{err:'tür'};c.uses??={};const last=c.uses[id]??-1e12,early=now-last<USE_COOLDOWN[id];
  if(early)return{err:'bekleme',early:true};
  if(!c.econ||stockOf(c.econ,'a_'+id)<1)return{err:'stok'};
  c.uses[id]=now;
  return{use:{['cn_a_'+id]:1},early};}
export function killCredit(c,id,now){const map=seaMap(c.sea);if(!map||!MAPS[map])return{err:'deniz'};const m=MAPS[map],npc=NPCS[id],mon=MONSTERS[id];
  if(npc?!m.npcs.includes(id):!(mon&&m.monsters.includes(id)))return{err:'hedef'};const def=npc??mon;
  // Batırma bütçesi: saniyelik hasar sınırı kadar dolar, 30 saniyelik birikir (büyük gemi uzun sürer); canın yarısı karşılanmalı
  const rate=dpsCap(c.econ?.level??8);c.kb??={pool:rate*30,t:now,miss:0};const b=c.kb;b.pool=Math.min(rate*30,b.pool+Math.max(0,now-b.t)/1000*rate);b.t=now;
  if(b.pool<def.hp*.5){b.miss++;return{err:'hız',flag:b.miss>=10};}
  if((c.sb?.pool??0)<def.hp*.6){b.miss++;return{err:'mermi',flag:b.miss>=10};}
  sbTake(c,def.hp*.6);b.pool=Math.max(0,b.pool-def.hp);b.miss=0;
  const add={gold:Math.round(def.gold*KILL_CREDIT_MULT),xp:Math.round(def.xp*KILL_CREDIT_MULT)};
  if(npc){add.st_npc=1;if(npc.role==='heavy')add.st_heavy=1;}else add.st_monster=1;
  c.qk??={};c.qk[id]=(c.qk[id]||0)+1;
  const lvl=Math.round(Number(c.econ?.level)||1);if(npc&&lvl>=2&&map===levelQuestMap(lvl)&&levelQuestTargets(lvl).ships.includes(id))add.lqk=1;
  return{add};}
// Görev: bitiş bildirimi sunucunun saydığı batırmalarla ve 8 saatlik bekleme süresiyle denetlenir.
// Geçerliyse ödülü (altın/TP ×2,5 pay, EP, sayaç) kazanç hakkı olarak yazılır. Sayaç ve süreler bellektedir; sunucu yeniden
// başlarsa yarım görevin batırmaları sayılmaz (görev yine biter, ödülü genel saatlik haktan geçer).
export const questCooldowns=new Map(); // uid → Map(görev → zaman)
export function questCredit(c,id,now){const q=QUESTS.find(x=>x.id===id);if(!q)return{err:'görev'};
  if(!c.econ||Number(c.econ.level)<q.tier||seaMap(c.sea)!==q.map)return{err:'deniz'};
  const cd=questCooldowns.get(c.uid)??new Map();questCooldowns.set(c.uid,cd);if(now-(cd.get(id)??-1e15)<QUEST_COOLDOWN_MS*.95)return{err:'bekleme'};
  if(q.kind==='sparkle'){c.qk??={};const k='spk:'+q.map;if((c.qk[k]||0)<q.required)return{err:'sayı',have:c.qk[k]||0};c.qk[k]-=q.required;}
  if(q.kind==='npc'||q.kind==='monster'){c.qk??={};const have=q.ids.reduce((a,k)=>a+(c.qk[k]||0),0);if(have<q.required)return{err:'sayı',have};
    let need=q.required;for(const k of q.ids){const t=Math.min(need,c.qk[k]||0);c.qk[k]-=t;need-=t;}}
  cd.set(id,now);return{add:{pearls:q.pearls,gold:Math.round(q.gold*KILL_CREDIT_MULT),xp:Math.round(q.xp*KILL_CREDIT_MULT),ep:Math.round(questEp(q.tier)*1.5),st_quest:1}};}
// Boss ödülü: payı sunucu bilir; katılımcıya oyunun formülüyle (havuz × pay) kazanç hakkı yazılır
export const bossPool=n=>1+.6*(Math.min(5,Math.max(1,n))-1);
export function bossCredit(map,share,n){if(!MAPS[map]||!(share>0))return null;const b=bossFor(map),pool=bossPool(n);
  const add={gold:Math.round(NPCS[b.trigger].gold*20*pool*share*KILL_CREDIT_MULT),xp:Math.round(b.xp*pool*share*KILL_CREDIT_MULT)};
  if(share>=.03){add.ep=Math.round(bossEp(b.tier)*1.5);add.st_boss=1;add.pearls=b.pearls;}return add;}
// Kuşatma: kabul edilen her hasar için katkı ödülü (oyunun formülüyle) kazanç hakkı olarak
export function siegeCredit(dmg,n,level){const r=contribReward(dmg,Math.max(1,n),Math.max(1,Math.min(8,Math.round(Number(level)||8))));return{gold:Math.round(r.gold*KILL_CREDIT_MULT),xp:Math.round(r.xp*KILL_CREDIT_MULT),pearls:r.pearls};}
// Hazine avı: oyun yalnız toplanan sandığı bildirir; parça zarını sunucu atar, 4 parçada hazine yerini sunucu seçer,
// kazıyı (oyuncu o denizde ve noktada mı) ve ödülü sunucu onaylar. Sandık bildirimi sandık çıkma hızıyla sınırlıdır.
export const treasures=new Map(); // uid → {parts, spot, chest:{pool,t}}
const treOf=uid=>{let t=treasures.get(uid);if(!t){t={parts:0,spot:null,chest:{pool:4,t:0}};treasures.set(uid,t);}return t;};
export function pickSpot(map,rand=Math.random){const m=MAPS[map];
  for(let i=0;i<80;i++){const x=300+rand()*(WORLD_WIDTH-600),y=300+rand()*(WORLD_HEIGHT-600);
    if(m.islands.some(is=>Math.hypot(x-is.x,y-is.y)<is.r+90))continue;if(Math.hypot(x-m.fleet.x,y-m.fleet.y)<FLEET.islandR+160)continue;
    return{map,x:Math.round(x),y:Math.round(y),label:coordLabel({x,y})};}
  return{map,x:Math.round(WORLD_WIDTH/2),y:Math.round(WORLD_HEIGHT-400),label:coordLabel({x:WORLD_WIDTH/2,y:WORLD_HEIGHT-400})};}
// Sandık: denizde aynı anda en çok 4 sandık, 22 sn'de bir yenisi → kova 6 sandık, 18 sn'de bir dolar
export function chestPicked(c,now,rand=Math.random){const map=seaMap(c.sea);if(!map||!MAPS[map])return{err:'deniz'};const t=treOf(c.uid);
  t.chest.pool=Math.min(6,t.chest.pool+Math.max(0,now-t.chest.t)/18_000);t.chest.t=now;if(t.chest.pool<1)return{err:'hız'};t.chest.pool-=1;
  if(rand()>=PART_CHANCE)return{parts:t.parts};t.parts++;
  if(t.parts>=TREASURE_PARTS&&!t.spot){t.parts-=TREASURE_PARTS;t.spot=pickSpot(map,rand);return{parts:t.parts,spot:t.spot,found:true};}
  return{parts:t.parts,found:true};}
// Pırıltı toplama sınırsızdır; yalnız imkânsız hız reddedilir: art arda 40 (inci gününde haritada 24 pırıltı olur), sonra saniyede 1,5.
export function sparklePicked(c,now){const map=seaMap(c.sea);if(!map||!MAPS[map])return{err:'deniz'};c.spb??={pool:40,t:now};
  c.spb.pool=Math.min(40,c.spb.pool+Math.max(0,now-c.spb.t)*1.5/1000);c.spb.t=now;if(c.spb.pool<1)return{err:'hız'};c.spb.pool-=1;
  c.qk??={};const k='spk:'+map;c.qk[k]=Math.min(200,(c.qk[k]||0)+1);return{ok:true};}
// Sandık ve pırıltı yerleri sunucuda (oyuncuya özel): alım yalnızca sunucunun verdiği yerde ve geminin yanındayken sayılır
export const LOOT={chests:3,chestMax:4,chestRespawn:22_000,sparkles:12,chestR:46,sparkleR:40,slack:110};
export function lootFor(c,rand=Math.random){const map=seaMap(c.sea);if(!map||!MAPS[map])return null;
  if(c.loot?.map!==map){c.loot={map,ch:[],sp:[],seq:0,chT:Date.now()};for(let i=0;i<LOOT.chests;i++)lootAdd(c.loot,'ch',rand);for(let i=0;i<LOOT.sparkles*sparkleMult();i++)lootAdd(c.loot,'sp',rand);}
  return c.loot;}
function lootAdd(l,kind,rand=Math.random){const p=pickSpot(l.map,rand);l[kind].push([++l.seq,Math.round(p.x),Math.round(p.y)]);}
export const lootInfo=l=>({ch:l.ch,sp:l.sp});
// Alım: kimlik sunucunun listesinde olmalı ve gemi yanında olmalı
export function lootTake(c,kind,id){const l=c.loot;if(!l||l.map!==seaMap(c.sea)||!c.last)return{err:'yok'};const list=l[kind],i=list.findIndex(x=>x[0]===Number(id));if(i<0)return{err:'yok'};
  const [,x,y]=list[i];if(Math.hypot(x-c.last.x,y-c.last.y)>(kind==='ch'?LOOT.chestR:LOOT.sparkleR)+LOOT.slack)return{err:'uzak'};
  list.splice(i,1);if(kind==='sp')lootAdd(l,'sp');return{ok:true};}
export function lootTick(c,now){const l=c.loot;if(!l||now-l.chT<LOOT.chestRespawn)return false;l.chT=now;if(l.ch.length>=LOOT.chestMax)return false;lootAdd(l,'ch');return true;}
// Sandık ve pırıltı içeriğini sunucu belirler; içerik kazanç hakkı (inci doğrudan cüzdana) olarak yazılır ve oyuna gönderilir
export function chestReward(c,gilded,rand=Math.random){const map=seaMap(c.sea);const ch=createChest('drift',0,0,Math.max(0,Math.min(.24,Number(gilded)||0)),MAPS[map]?.tier??1,rand);
  const out={kind:ch.kind,pearls:ch.pearls,powder:ch.powder,shield:ch.shield,ammo:ch.ammo,ammoQty:ch.ammoQty,speed:ch.speed,mine:ch.mine};
  const add={pearls:ch.pearls,a_powder:ch.powder,a_shield:ch.shield,['a_'+ch.ammo]:ch.ammoQty,a_speed:ch.speed,a_mine:ch.mine,st_chest:1};
  for(const k in add)if(!add[k])delete add[k];return{out,add};}
export function sparkleReward(c,rand=Math.random){const tier=MAPS[seaMap(c.sea)]?.tier??1,roll=rand(),r=(a,b)=>a+Math.floor(rand()*(b-a+1)),kinds=['fire','explosive','breaker','leech'];
  if(roll<.5){const n=r(1,2);return{out:{pearls:n},add:{pearls:n}};}
  if(roll<.65){const n=r(2,5);return{out:{powder:n},add:{a_powder:n}};}
  if(roll<.8){const n=r(2,5);return{out:{shield:n},add:{a_shield:n}};}
  if(roll<.95){const k=kinds[Math.floor(rand()*kinds.length)],n=30+15*tier;return{out:{ammo:k,ammoQty:n},add:{['a_'+k]:n}};}
  if(roll<.99)return{out:{speed:1},add:{a_speed:1}};
  return{out:{pearls:5,mine:1},add:{pearls:5,a_mine:1}};}
export function treasureDig(c){const t=treOf(c.uid);if(!t.spot)return{err:'harita'};const map=seaMap(c.sea);
  if(map!==t.spot.map||!c.last||Math.hypot(c.last.x-t.spot.x,c.last.y-t.spot.y)>DIG_RADIUS+60)return{err:'yer'};
  const m=MAPS[map],r=treasureReward(m.tier,NPCS[m.npcs[0]].gold);t.spot=null;
  return{reward:r,add:{gold:Math.round(r.gold*KILL_CREDIT_MULT),pearls:r.pearls,st_treasure:1,[r.ammo==='chain'?'chain':'a_'+r.ammo]:r.ammoQty,a_powder:r.powder,a_shield:r.shield}};}
// Görev sayaçları, bekleme süreleri ve hazine durumu sunucu dosyasında saklanır (yeniden başlatmada kaybolmaz)
export const pendingCredits=new Map();
const STATE_FILE=process.env.STATE_FILE||'/opt/game/state.json';const qkByUid=new Map();
// Kuşatma Kahramanı unvanı (ilk 3, 7 gün): sunucu verir, oyuncunun bildirdiği unvan sayılmaz
export const heroUntil=new Map();
export function saveServerState(){if(process.env.NODE_ENV==='test')return;try{for(const c of all)if(c.credit&&!c.grant){c.grant={id:crypto.randomUUID(),add:c.credit};c.credit=null;pendingCredits.set(c.grant.id,c);}
  fs.writeFileSync(STATE_FILE+'.tmp',JSON.stringify({g:[...pendingCredits.values()].map(c=>({uid:c.uid,grant:c.grant,credit:c.credit})),q:[...questCooldowns].map(([u,m])=>[u,[...m]]),k:[...qkByUid],t:[...treasures],h:[...heroUntil]}));fs.renameSync(STATE_FILE+'.tmp',STATE_FILE);}catch(e){log('DURUM kayıt hatası',e?.code);}}
function loadServerState(){if(process.env.NODE_ENV==='test')return;try{const d=JSON.parse(fs.readFileSync(STATE_FILE,'utf8'));for(const c of d.g||[])if(c.grant?.id)pendingCredits.set(c.grant.id,c);for(const [u,m] of d.q||[])questCooldowns.set(u,new Map(m));for(const [u,k] of d.k||[])qkByUid.set(u,k);for(const [u,t] of d.t||[])treasures.set(u,t);for(const [u,t] of d.h||[])heroUntil.set(u,t);}catch{}}
loadServerState();setInterval(saveServerState,60_000).unref();process.on('SIGTERM',()=>{saveServerState();process.exit(0);});process.on('SIGINT',()=>{saveServerState();process.exit(0);});
// Savaş puanı: sunucunun doğruladığı oyuncu batırmasından (aynı rakipten günde en çok 3 kez; etkinlik günü ×2 payı)
export const spByUid=new Map(); // batıran → Map(rakip → {gün, sayı})
export function spCredit(killer,victimUid,now){if(!killer?.uid||!victimUid||killer.uid===victimUid)return null;const day=new Date(now+3*3600_000).toISOString().slice(0,10);
  const m=spByUid.get(killer.uid)??new Map();spByUid.set(killer.uid,m);const r=m.get(victimUid);const n=r&&r.day===day?r.n:0;if(n>=RIVAL_DAILY_LIMIT)return null;
  m.set(victimUid,{day,n:n+1});return{sp:RIVAL_SP*2};}
// ---------------------------------------------------------------- Sunucu atışı
// Oyuncu donanımını bildirir (ld); sunucu her kalemi sahip olduklarıyla sınırlar ve atışı (atk) kendisi hesaplar:
// dolum süresi, menzil, stok ve hasar oyunun formülüyle (src/combat.ts) sunucuda. Oyuncu hasar bildirmez.
export function buildLoadout(st,d){if(!st)return null;const lvl=Math.max(1,Math.min(8,Number(st.level)||1)),elite=Number(st.elite)>0?eliteLevelFromEp(Number(st.ep)||0):0;
  const cap=elite>0?ELITE_CANNON_CAPACITY:100,mt={};let total=0;
  for(const k of Object.keys(CANNONS)){const want=Math.max(0,Math.floor(Number(d?.mt?.[k])||0)),own=Math.max(0,Number(st['c_'+k])||0);mt[k]=Math.min(want,own,cap-total);total+=mt[k];}
  let type=String(d?.type||'cast');if(!CANNONS[type]||!mt[type])type=Object.keys(mt).sort((a,b)=>mt[b]-mt[a])[0]||'cast';
  const eq={},used={};for(const [slot,id] of Object.entries(d?.eq||{})){if(typeof id!=='string'||!EQUIPMENT.some(e=>e.id===id&&e.slot===slot))continue;used[id]=(used[id]||0)+1;if(used[id]<=(Number(st['e_'+id])||0))eq[slot]=id;}
  const et=equipTotals(eq),active=(Array.isArray(d?.act)?d.act:[]).filter(x=>typeof x==='string').slice(0,officerSlots(lvl));
  const rank=id=>active.includes(id)?Math.max(0,Math.min(OFFICER_MAX_RANK,Number(st['o_'+id])||0)):0;
  // Madalya koleksiyonu: sayaçlarla doğrulanır (günlük seri doğrulanamaz, kabul edilir)
  const achOk=!!d?.ach&&MAIN_COLLECTION.every(id=>{const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return true;if(a.stat==='daily')return true;if(a.stat==='level')return lvl>=a.goal;return(Number(st['st_'+a.stat])||0)>=a.goal;});
  const el=cumulativeEliteBonus(elite);
  // Yetenekler: toplam puan seviyeyi, her biri kendi sınırını aşamaz; yalnız Mayın Uzmanı savaşı etkiler
  let tal={},spent=0;for(const [id,r] of Object.entries(d?.tal||{})){const t=TALENTS[id];const n=Math.max(0,Math.min(t?.max??0,Math.floor(Number(r)||0)));if(t&&n){tal[id]=n;spent+=n;}}if(spent>talentPoints(lvl))tal={};
  return{level:lvl,mineMult:1+.15*(tal.sapper||0),cannons:total,type,upDamage:Number(st.u_damage)||0,upReload:Number(st.u_reload)||0,upRange:Number(st.u_range)||0,crewDamage:1+.05*rank('gunner'),crewReload:1,crewRange:12*rank('lookout'),
    equipDamage:et.damage,equipReload:et.reload,equipRange:et.range,achDamage:achOk?.05:0,eliteDamage:el.damage,eliteReload:el.reload,hero:d?.hero?HERO_DAMAGE:0};}
// Atış denetimi: dolum süresi (%15 pay) ve menzil (150 birim gecikme payı); öfke 30 sn'de en çok 2 salvo
export function shotCheck(c,L,a,dist,now,rage){const rl=reloadTime(L,a)*1000*.85;if(now-(c.lastAtk??-1e12)<rl)return'dolum';if(dist>rangeOf(L)+150)return'menzil';
  if(rage){c.rageShots=(c.rageShots||[]).filter(t=>now-t<30_000);if(c.rageShots.length>=2)return'öfke';c.rageShots.push(now);}c.lastAtk=now;return null;}
export function addCredit(c,add){c.credit??={};for(const k in add)c.credit[k]=(c.credit[k]||0)+add[k];}
// ---------------------------------------------------------------- Sunucu NPC'leri
// Her denizin normal NPC'lerini oyun sunucusu yaşatır: yer, hareket ve can sunucudadır, herkes aynı NPC'yi görür.
// Oyuncu verdiği hasarı bildirir (nhit); hasar menzil, saniyelik hız ve salvo bütçesiyle sınırlanır. Batışa sunucu karar verir,
// ödül hasar payına göre dağıtılır (pay ≥ %30 olanlara batırma sayılır: görev, seviye görevi, sayaçlar).
// NPC'nin oyuncuya ateşi oyuncunun tarayıcısında kalır (yalnız kendi aleyhine olabilir).
export const NPC_RANGE=900,NPC_LEASH=680,NPC_RESPAWN_MS=3000,NPC_KILL_SHARE=.3;
export const seaNpcs=new Map(); // deniz → {list:Map(id→npc), seq, respawn:[zaman,...]}
const npcPick=(m,list)=>{const defs=m.npcs.map(id=>NPCS[id]).filter(d=>d&&d.sprite);const missing=defs.filter(d=>![...list.values()].some(n=>n.def.id===d.id));const pool=missing.length?missing:defs;return pool[Math.floor(Math.random()*pool.length)];};
export function npcSpawn(sea,now=Date.now(),rand=Math.random){const map=seaMap(sea),m=MAPS[map];if(!m)return null;let st=seaNpcs.get(sea);if(!st){st={list:new Map(),seq:0,respawn:[]};seaNpcs.set(sea,st);}
  const def=npcPick(m,st.list);if(!def)return null;const p=pickSpot(map,rand),id=`${map}:${++st.seq}`;
  const n={id,def,x:p.x,y:p.y,hx:p.x,hy:p.y,hp:def.hp,max:def.hp,wx:p.x,wy:p.y,aggro:null,aggroUntil:0,dmg:new Map(),moved:true,hpDirty:false};st.list.set(id,n);return n;}
export function npcFill(sea,now=Date.now()){const m=MAPS[seaMap(sea)];if(!m)return[];let st=seaNpcs.get(sea);const out=[];
  while((st?.list.size??0)+(st?.respawn.length??0)<m.npcCount){const n=npcSpawn(sea,now);if(!n)break;out.push(n);st=seaNpcs.get(sea);}return out;}
export const npcInfo=n=>({id:n.id,d:n.def.id,x:Math.round(n.x),y:Math.round(n.y),hp:Math.round(n.hp),max:n.max});
// Hareket: evinin çevresinde dolaşır; vurulunca vuranın peşine düşer (evden 680 birim uzaklaşınca bırakır), 240 birimde durur
export function npcMove(n,dt,players,now){let tx=n.wx,ty=n.wy,v=n.def.speed*.45*1.4;
  const foe=n.aggro&&now<n.aggroUntil?players.find(p=>p.uid===n.aggro&&p.last):null;
  if(foe&&Math.hypot(n.x-n.hx,n.y-n.hy)<NPC_LEASH){tx=foe.last.x;ty=foe.last.y;v=n.def.speed*1.4;if(Math.hypot(tx-n.x,ty-n.y)<240)return;}
  else{n.aggro=null;if(Math.hypot(n.wx-n.x,n.wy-n.y)<20){const a=Math.random()*Math.PI*2,r=60+Math.random()*240;n.wx=Math.max(80,Math.min(WORLD_WIDTH-80,n.hx+Math.cos(a)*r));n.wy=Math.max(80,Math.min(WORLD_HEIGHT-80,n.hy+Math.sin(a)*r));tx=n.wx;ty=n.wy;}}
  const d=Math.hypot(tx-n.x,ty-n.y);if(d<1)return;const st=Math.min(d,v*dt);n.x+=(tx-n.x)/d*st;n.y+=(ty-n.y)/d*st;n.moved=true;}
// Ateş: NPC, kendisini vuran ya da 360 birime yaklaşan oyuncuya oyunun hızıyla ateş eder (güvenli denizde etmez, yeniden doğan
// oyuncuya 3 sn dokunmaz). Hasar oyuncuya bildirilir ve sunucudaki can modelinden düşülür (kalkan, yetenek gibi azaltıcılar için %70).
export const NPC_FIRE_RANGE=360,NPC_SPAWN_GRACE=3000,NPC_DMG_MODEL=.7;
export function npcFire(n,players,now,safe,rand=Math.random){if(safe||now<(n.cdUntil??0))return null;
  let t=n.aggro&&now<n.aggroUntil?players.find(p=>p.uid===n.aggro&&p.last):null;
  if(!t||Math.hypot(t.last.x-n.x,t.last.y-n.y)>NPC_FIRE_RANGE){t=null;let bd=NPC_FIRE_RANGE;for(const p of players){if(!p.last||now-(p.tpAt||0)<NPC_SPAWN_GRACE)continue;const d=Math.hypot(p.last.x-n.x,p.last.y-n.y);if(d<bd){bd=d;t=p;}}}
  if(!t)return null;if(!n.aggro){n.aggro=t.uid;n.aggroUntil=now+4000;}
  n.cdUntil=now+(n.def.reload+rand()*.55)*1000;return{to:t,dmg:Math.round(n.def.damage*(.85+rand()*.3))};}
// Vuruş: menzil ve bütçeyle sınırlanmış hasar uygulanır; batarsa paylar döner
export function npcHit(c,sea,id,dmg,now){const n=seaNpcs.get(sea)?.list.get(String(id));if(!n||!(dmg>0))return null;
  if(!c.last||Math.hypot(c.last.x-n.x,c.last.y-n.y)>NPC_RANGE)return{err:'menzil'};
  const t=dpsTake(c,dmg,now);let d=sbTake(c,t.ok);d=Math.min(d,n.hp);if(d<=0)return{err:'bütçe',flag:t.flag};
  return{...npcApply(c,sea,n,d,now),flag:t.flag};}
export function npcApply(c,sea,n,d,now){d=Math.min(d,n.hp);n.hp-=d;n.hpDirty=true;n.dmg.set(c.uid,(n.dmg.get(c.uid)||0)+d);n.aggro=c.uid;n.aggroUntil=now+12_000;
  if(n.hp>0)return{dealt:d};
  const st=seaNpcs.get(sea);st.list.delete(n.id);st.respawn.push(now+NPC_RESPAWN_MS);
  const total=[...n.dmg.values()].reduce((a,v)=>a+v,0)||1;return{dealt:d,dead:n,shares:[...n.dmg].map(([uid,v])=>[uid,v/total])};}
// Batış ödülü: altın/TP payla (×2,5 bonus payı), batırma sayaçları payı %30 üstündekilere
export function npcDeathCredit(c,def,map,share){const add={gold:Math.round(def.gold*share*KILL_CREDIT_MULT),xp:Math.round(def.xp*share*KILL_CREDIT_MULT)};
  if(share>=NPC_KILL_SHARE){add.st_npc=1;if(def.role==='heavy')add.st_heavy=1;c.qk??={};c.qk[def.id]=(c.qk[def.id]||0)+1;
    const lvl=Math.round(Number(c.econ?.level)||1);if(lvl>=2&&map===levelQuestMap(lvl)&&levelQuestTargets(lvl).ships.includes(def.id))add.lqk=1;}
  return add;}
export class Rate{constructor(perWindow,windowMs){this.n=perWindow;this.w=windowMs;this.t=[];}hit(now){while(this.t.length&&now-this.t[0]>this.w)this.t.shift();if(this.t.length>=this.n)return false;this.t.push(now);return true;}}

export function canJoin(c,name,now=Date.now()){
  if(!name)return true;if(!c.econ)return false;
  if(name===SIEGE_ROOM)return siegeWindowAt(now).open||SIEGE_TRIAL;
  const map=MAPS[seaMap(name)];return !!map&&Number(c.econ.level)>=map.tier;
}
async function applyUsage(c,salvo,item,now){
  const shadow={...c,sb:{...(c.sb||{pool:0})},uses:{...(c.uses||{})}};
  let r=item===null?noteSalvo(shadow,salvo):noteUse(shadow,item,now);
  if(r.err==='stok'){await loadEcon(c);shadow.econ=c.econ;r=item===null?noteSalvo(shadow,salvo):noteUse(shadow,item,now);}
  if(r.err){send(c,{t:'usageDenied',reason:r.err});return;}
  const use=Object.fromEntries(Object.entries(r.use).map(([k,v])=>[k.slice(3),v]));
  const st=process.env.BENCH_AUTH==='1'&&c.uid.startsWith('b')?c.econ:
    await dbRpcJson('economy_reserve_usage',{p_uid:c.uid,p_use:use});
  if(!st||st.error){send(c,{t:'usageDenied',reason:'stok doğrulanamadı'});return;}
  c.econ=st;c.sb=shadow.sb;c.uses=shadow.uses;
  if(r.over)suspect(c,'top sayısı');
  // Elit gülle EP'si ve sayacı sunucudan (pazartesi %50 EP etkinliği için ×1,5 pay)
  if(item===null){const a=String(salvo?.a||''),n=Number(use[ITEM_OF[a]??'a_'+a])||0;if(n>0&&ELITE_POINTS_PER_BALL[a])addCredit(c,{ep:Math.ceil(n*ELITE_POINTS_PER_BALL[a]*1.5),st_eliteBalls:n});}
}

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
async function loadEcon(c){if(process.env.BENCH_AUTH==='1'&&c.uid?.startsWith('b')){c.econ={level:8,c_cast:315,iron:1e9,a_fire:1e9};return;}if(!SERVER_SECRET||!c.uid)return;try{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/economy_peek`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},body:JSON.stringify({p_secret:SERVER_SECRET,p_uid:c.uid})});
  if(r.ok){const st=await r.json();if(st&&typeof st==='object')c.econ=st;}}catch{}
  if(all.has(c)&&!c.econTimer)c.econTimer=setTimeout(()=>{c.econTimer=null;void loadEcon(c);},5*60_000);c.econTimer?.unref?.();}
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
  if(!heal){const t=dpsTake(c,dmg,now);if(t.flag){suspect(c,'saniyelik hasar','kule');c.dps.over=0;}dmg=sbTake(c,t.ok);if(dmg<=0)return;}
  await towerApply(c,key,slot,dmg,heal,now);}
async function towerApply(c,key,slot,dmg,heal,now){const r=towerHit(key,slot,c.guildId,dmg,heal,now);if(!r?.destroyed)return;const i=islands.get(key);
  sendRoom(key,{t:'tdown',d:{key,slot,by:c.netId}});
  if(r.captured){log('ADA ELE GEÇİRİLDİ',key,c.nick);i.tag=await guildTag(i.guild).catch(()=>'');await dbRpc('island_capture',{p_map:key,p_guild:i.guild}).catch(()=>{});
    sendRoom(key,{t:'isle',d:islandInfo(i)});{const rw=fleetReward(Number(String(key).split('/')[0])||1);addCredit(c,{gold:Math.round(rw.gold*KILL_CREDIT_MULT),xp:Math.round(rw.xp*KILL_CREDIT_MULT)});}const msg=JSON.stringify({t:'icap',d:{key,tag:i.tag,by:c.netId,nick:c.nick}});for(const x of all)if(x.uid)send(x,msg);}
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
  if(r.hp[i]>0)return{damage:d};if(i===16){r.result='won';return{down:i,won:true,damage:d};}return{down:i,damage:d};}
const siegeTop=r=>[...r.contrib.values()].filter(c=>c.dmg>0).sort((a,b)=>b.dmg-a.dmg).slice(0,10).map(c=>[c.nick,Math.round(c.dmg)]);
export const siegeInfo=(r,uid)=>({id:r.id,end:r.end,n:r.caps.size,hp:r.hp.map(Math.round),max:r.max,result:r.result,top:siegeTop(r),mine:Math.round(r.contrib.get(uid)?.dmg??0)});
function siegeFinish(){const r=siegeRun,room=seas.get(SIEGE_ROOM),total=[...r.contrib.values()].reduce((a,c)=>a+c.dmg,0)||1;log('KUŞATMA BİTTİ',r.result,r.caps.size,'kaptan');
  // Zafer sandığı: kalenin yeterli payını vuran herkese sunucu verir (içerik oyuna gönderilir)
  if(r.result==='won'){const t=Date.now()+HERO_DAYS*86_400_000;[...r.contrib].filter(([,c])=>c.dmg>0).sort((a,b)=>b[1].dmg-a[1].dmg).slice(0,3).forEach(([u])=>heroUntil.set(u,t));}
  const chests=new Map();if(r.result==='won')for(const x of all){const dmg=r.contrib.get(x.uid)?.dmg??0;if(!x.uid||!earnsChest(dmg,r.caps.size))continue;
    const ch=victoryChest(Math.random,Number(x.econ?.level)||8),add={pearls:ch.pearls,a_speed:ch.speed,a_mine:ch.mine,a_powder:ch.powder,a_shield:ch.shield};for(const [k,n] of Object.entries(ch.ammo))add['a_'+k]=(add['a_'+k]||0)+n;addCredit(x,add);chests.set(x.uid,ch);}
  for(const x of room||[])send(x,{t:'send',d:{won:r.result==='won',n:r.caps.size,top:siegeTop(r),mine:Math.round(r.contrib.get(x.uid)?.dmg??0),share:(r.contrib.get(x.uid)?.dmg??0)/total,chest:chests.get(x.uid)??null}});}
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
setInterval(()=>{tickNo++;if(tickNo%2===0){npcTick(Date.now());void mineTick(Date.now());}if(tickNo%10===0){const now=Date.now();for(const c of all)if(c.sea&&lootTick(c,now))send(c,{t:'loot',d:lootInfo(c.loot)});}if(tickNo%3===0){const now=Date.now();bossTick(now);islandTick(now);siegeTick(now);}for(const room of seas.values()){if(room.size<2)continue;for(const rec of room){const b=buildBatch(rec,room,tickNo);if(b.length)send(rec,{t:'batch',d:b});}}},TICK_MS).unref();

// NPC'ler: oyuncu olan denizlerde 0,2 sn'de bir hareket ve can güncellemesi; boş denizin NPC'leri silinir
function npcTick(now){for(const [sea,st] of seaNpcs){const room=seas.get(sea);if(!room||!room.size){seaNpcs.delete(sea);continue;}
  const players=[...room];st.respawn=st.respawn.filter(t=>{if(t>now)return true;const n=npcSpawn(sea,now);if(n){const m=JSON.stringify({t:'nspawn',d:npcInfo(n)});for(const x of room)send(x,m);}return false;});
  const safe=!!MAPS[seaMap(sea)]?.safe,fires=[];
  const pos=[],hp=[];for(const n of st.list.values()){npcMove(n,.2,players,now);const f=npcFire(n,players,now,safe);if(f){fires.push([n.id,f.to.netId,f.dmg]);npcDamage(f.to,f.dmg,n,now);}if(n.moved){n.moved=false;pos.push([n.id,Math.round(n.x),Math.round(n.y)]);}if(n.hpDirty){n.hpDirty=false;hp.push([n.id,Math.round(n.hp)]);}}
  if(pos.length||hp.length||fires.length){const m=JSON.stringify({t:'npos',d:{p:pos,h:hp,f:fires}});for(const x of room)send(x,m);}}}
// NPC hasarı oyuncunun sunucudaki can modeline işlenir; canı hasara rağmen hiç düşmeyen oyuncu (ölümsüz) batırılır
function npcDamage(t,dmg,n,now){const p=pvpOf(t);p.hitAt=now;if(p.hp===null)return;p.hp-=dmg*NPC_DMG_MODEL;
  if(godCheck(t)){suspect(t,'ölümsüz','npc');pvpReset(t);send(t,{t:'forceSink',d:{by:'',byNick:n.def.name}});}}
function onNpcHit(c,list,now){const map=seaMap(c.sea);if(!map||!Array.isArray(list))return;
  for(const it of list.slice(0,40)){if(!Array.isArray(it))continue;const r=npcHit(c,c.sea,it[0],Number(it[1]),now);if(!r)continue;if(r.flag){suspect(c,'saniyelik hasar','npc');if(c.dps)c.dps.over=0;}
    if(r.dead)npcDeath(c,r,now);}}
function npcDeath(c,r,now){{const map=seaMap(c.sea);const room=seas.get(c.sea)||new Set(),def=r.dead.def;
    for(const [uid,share] of r.shares){const x=[...room].find(p=>p.uid===uid)??[...all].find(p=>p.uid===uid);if(!x)continue;addCredit(x,npcDeathCredit(x,def,map,share));send(x,{t:'nkilled',d:{id:r.dead.id,share}});}
    const m=JSON.stringify({t:'ndie',d:{id:r.dead.id}});for(const x of room)send(x,m);
    if(def.id===bossFor(map).trigger){const b=bossKill(c.sea,BOSS_KILLS,now);if(b)toSea(c,{t:'boss',d:bossInfo(c.sea,b)},true);}}}
// ---------------------------------------------------------------- Mayınlar (sunucuda)
// Mayın oyuncunun bildirdiği yere (geminin 80 birim yakını) konur, 1 sn'de kurulur, 40 sn yaşar. 46 birime yaklaşan düşman NPC'de,
// başka filodan oyuncuda ya da düşman ada kulesinde patlar; 95 birim içindekilere seviye ve Mayın Uzmanı yeteneğiyle hasar verir.
export const seaMines=new Map();let mineSeq=0;
export function placeMine(c,x,y,now){if(!c.last||!num(x)||!num(y)||Math.hypot(x-c.last.x,y-c.last.y)>80)return null;
  const list=seaMines.get(c.sea)??[];seaMines.set(c.sea,list);if(list.filter(m=>m.uid===c.uid).length>=MINE.maxActive)return null;
  const L=c.ldRaw?buildLoadout(c.econ,c.ldRaw):null,m={id:++mineSeq,uid:c.uid,netId:c.netId,guildId:c.guildId||0,x:Math.round(x),y:Math.round(y),arm:now+MINE.armSeconds*1000,until:now+40_000,
    dmg:Math.round((MINE.baseDamage+(L?.level??1)*MINE.damagePerLevel)*(L?.mineMult??1))};list.push(m);return m;}
function mineFoes(sea,m){const out={npcs:[],players:[],towers:[]};const near=(x,y,r)=>Math.hypot(x-m.x,y-m.y)<r;
  for(const n of seaNpcs.get(sea)?.list.values()??[])out.npcs.push(n);
  for(const p of seas.get(sea)??[])if(p.uid!==m.uid&&p.last&&!(m.guildId&&p.guildId===m.guildId))out.players.push(p);
  const key=islandOfSea(sea),isle=key?islands.get(key):null;if(isle&&MAPS[key]&&!(m.guildId&&isle.guild===m.guildId)){const f=MAPS[key].fleet;isle.towers.forEach((t,slot)=>{if(t){const [dx,dy]=FLEET.towers[slot]??[0,0];out.towers.push({key,slot,x:f.x+dx,y:f.y+dy});}});}
  return{all:out,near};}
async function mineTick(now){for(const [sea,list] of seaMines){const room=seas.get(sea);if(!room||!room.size){seaMines.delete(sea);continue;}
  for(let k=list.length-1;k>=0;k--){const m=list[k];if(now>m.until){list.splice(k,1);continue;}if(now<m.arm)continue;
    const {all:f,near}=mineFoes(sea,m);const R=MINE.triggerRadius;
    if(!f.npcs.some(n=>near(n.x,n.y,R))&&!f.players.some(p=>near(p.last.x,p.last.y,R))&&!f.towers.some(t=>near(t.x,t.y,R)))continue;
    list.splice(k,1);const owner=[...all].find(x=>x.uid===m.uid)??{uid:m.uid,netId:m.netId,nick:'',sea,econ:null};const B=MINE.blastRadius;
    const boom=JSON.stringify({t:'mboom',d:{id:m.id,x:m.x,y:m.y}});for(const x of room)send(x,boom);
    for(const n of f.npcs)if(near(n.x,n.y,B)&&seaNpcs.get(sea)?.list.has(n.id)){const r=npcApply(owner,sea,n,m.dmg,now);if(r.dead&&owner.ws)npcDeath(owner,r,now);}
    for(const p of f.players)if(near(p.last.x,p.last.y,B)){const dealt=pvpGuard(p,m.dmg,now);pvpOf(p).from.set(m.netId,now);if(dealt>0)send(p,{t:'mhit',d:{dmg:dealt,by:m.netId}});}
    for(const t of f.towers)if(near(t.x,t.y,B)&&owner.ws)await towerApply(owner,t.key,t.slot,m.dmg,false,now);}}}
// Sunucu atışı: NPC hedefi
function bossApply(c,dmg){const r=bossHit(c.sea,c.uid,dmg);if(!r)return;const room=seas.get(c.sea);log('BOSS BATTI',c.sea,r.n,'kaptan');
  {const map=seaMap(c.sea);for(const x of all){const sh=r.shares[x.uid];if(!sh)continue;const add=bossCredit(map,sh.share,r.n);if(add)addCredit(x,add);}}
  for(const x of room||[])send(x,{t:'bdown',d:{id:r.id,n:r.n,...(r.shares[x.uid]??{share:0,dmg:0})}});}
function siegeApply(c,i,dmg){const r=siegeHitPiece(c.uid,c.nick,i,dmg);if(r?.damage>0)addCredit(c,siegeCredit(r.damage,siegeRun.caps.size,c.econ?.level));if(!r?.down&&r?.down!==0)return;toSea(c,{t:'sdown',d:{i:r.down}},true);if(r.won)siegeFinish();}
// Sunucu atışı: hedef türü k = n (NPC), b (boss), s (kuşatma parçası), t (ada kulesi), p (oyuncu). Hasarı sunucu hesaplar.
// Konumu sunucunun bildiği hedeflerde (NPC, ada kulesi, oyuncu) menzil de denetlenir.
export function attackTarget(c,d){const k=String(d?.k||'n'),id=String(d?.id??'');
  if(k==='n'){const n=seaNpcs.get(c.sea)?.list.get(id);return n?{k,n,x:n.x,y:n.y,kind:'npc'}:null;}
  if(k==='b')return bossSeas.get(c.sea)?.boss?{k,kind:'boss'}:null;
  if(k==='s'){const i=Number(id);return c.sea===SIEGE_ROOM&&Number.isInteger(i)&&i>=0&&i<SIEGE_PIECES?{k,i,kind:'tower'}:null;}
  if(k==='t'){const key=islandOfSea(c.sea),slot=Number(id);if(!key||!Number.isInteger(slot)||slot<0||slot>=TOWER_SLOTS||!MAPS[key])return null;const f=MAPS[key].fleet,[dx,dy]=FLEET.towers[slot]??[0,0];return{k,key,slot,x:f.x+dx,y:f.y+dy,kind:'tower'};}
  if(k==='p'){const t=[...(seas.get(c.sea)||[])].find(x=>x.netId===id&&x!==c);if(!t?.last||(c.guildId&&c.guildId===t.guildId))return null;return{k,t,x:t.last.x,y:t.last.y,kind:'player'};}
  return null;}
async function onAttack(c,d,now){if(!c.ldRaw||!c.last)return;const tg=attackTarget(c,d);if(!tg)return;c.ld=buildLoadout(c.econ,c.ldRaw);if(!c.ld)return;
  const a=String(d?.a||'iron');if(!['iron','chain','fire','explosive','breaker','leech',...(tg.k==='p'||tg.k==='t'?['heal']:[])].includes(a))return;
  const why=shotCheck(c,c.ld,a,tg.x===undefined?0:Math.hypot(c.last.x-tg.x,c.last.y-tg.y),now,!!d?.r);if(why){if(why!=='dolum')suspect(c,'atış',why);return;}
  const cap=c.ld.cannons;let k=Math.max(0,Math.floor(Number(d?.n)||0)),i=Math.max(0,Math.floor(Number(d?.i)||0));if(k+i>cap){const f=cap/(k+i);k=Math.floor(k*f);i=Math.floor(i*f);}if(a==='iron'){i+=k;k=0;}
  const before=c.econ,pool=c.sb?.pool??0;await applyUsage(c,{a,n:k,i,p:d?.p?1:0},null,now);if(c.sb)c.sb.pool=pool;// sunucu atışı hasar bütçesi doldurmaz (çift hasar olmasın)
  if(c.econ===before&&SERVER_SECRET&&!(process.env.BENCH_AUTH==='1'&&c.uid.startsWith('b')))return;// stok onaylanmadı
  const raw=salvoDamage(c.ld,a,k,i,!!d?.p,!!d?.r),dmg=raw*targetFactor(a,tg.kind);
  if(tg.k==='n'){const live=seaNpcs.get(c.sea)?.list.get(tg.n.id);if(!live)return;const r=npcApply(c,c.sea,live,dmg,now);if(r.dead)npcDeath(c,r,now);return;}
  if(tg.k==='b'){bossApply(c,dmg);return;}
  if(tg.k==='s'){siegeApply(c,tg.i,dmg);return;}
  if(tg.k==='t'){if(a==='heal')towerHit(tg.key,tg.slot,c.guildId,Math.round(raw*2.6),true,now);else await towerApply(c,tg.key,tg.slot,dmg,false,now);return;}
  // Oyuncu: şifa (oyunun formülüyle en çok canın %8–9,2'si) ya da hasar (hedefin 20 sn bütçesiyle); oyuna gülle olarak iletilir
  const t=tg.t,f={from:c.netId,to:t.netId,x:Math.round(c.last.x),y:Math.round(c.last.y),tx:Math.round(t.last.x),ty:Math.round(t.last.y),ammo:a,damage:0};
  if(a==='heal'){f.damage=Math.round(Math.min(raw,(t.maxHp||163000)*(.08+Math.random()*.012)));pvpHeal(t,f.damage,now);}
  else{f.damage=pvpGuard(t,dmg,now);pvpOf(t).from.set(c.netId,now);
    if(godCheck(t)){suspect(t,'ölümsüz');pvpReset(t);send(t,{t:'forceSink',d:{by:c.netId,byNick:c.nick}});toSea(t,{t:'sunk',d:{victim:t.netId,victimNick:t.nick,by:c.netId,byNick:c.nick}});return;}}
  toNear(c,{t:'fire',d:f},t.netId);}
// Doğrulanan kazançlar 20 saniyede bir veritabanına yazılır; dönen değerlerle oyuncunun seviyesi tazelenir
export async function flushCredit(c){
  if(c.flushing||!c.uid)return;c.flushing=true;
  try{
    if(!c.grant&&c.credit){c.grant={id:crypto.randomUUID(),add:c.credit};c.credit=null;pendingCredits.set(c.grant.id,c);}
    if(!c.grant)return;
    const st=await dbRpcJson('economy_grant_once',{p_uid:c.uid,p_event:c.grant.id,p_add:c.grant.add});
    if(st&&typeof st==='object'){c.econ=st;pendingCredits.delete(c.grant.id);c.grant=null;
      if(c.credit){c.grant={id:crypto.randomUUID(),add:c.credit};c.credit=null;pendingCredits.set(c.grant.id,c);}}
  }catch{ /* Keep the same event ID for a safe retry after an uncertain response. */ }
  finally{c.flushing=false;}
}
setInterval(()=>{for(const c of new Set([...all,...pendingCredits.values()]))if(c.credit||c.grant)void flushCredit(c);},20_000).unref();
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
  const c={ws,uid:'',nick:'',playerNo:0,netId:'',sea:'',last:null,strikes:0,rState:new Rate(LIMITS.statesPerSec,1000),rFire:new Rate(LIMITS.firesPerSec,1000),rChat:new Rate(LIMITS.chatPerMin,60000),rMsg:new Rate(60,1000),rBoss:new Rate(5,1000),rKill:new Rate(3,1000),rSalvo:new Rate(3,1000),rUse:new Rate(12,1000),rTower:new Rate(12,1000)};
  all.add(c);const authTimer=setTimeout(()=>{if(!c.uid)ws.close(4001,'giriş yok');},10000);
  const handleMessage=async raw=>{const now=Date.now();
    let m;try{m=JSON.parse(String(raw));}catch{return;}if(!m||typeof m.t!=='string')return;
    if(m.t==='auth'){if(c.uid)return;const who=await verifyToken(String(m.token||'')).catch(()=>null);
      if(!who){ws.close(4001,'giriş geçersiz');return;}if(who.banned){ws.close(4002,'hesap kapalı');return;}
      for(const x of all)if(x.uid===who.uid&&x!==c)x.ws.close(4004,'başka yerden bağlanıldı');
      Object.assign(c,who);c.netId=String(m.netId||'').slice(0,16)||Math.random().toString(36).slice(2,10);clearTimeout(authTimer);
      await loadEcon(c);if(!c.econ){ws.close(4003,'hesap verisi yüklenemedi');return;}
      send(c,{t:'hello',id:c.netId,nick:c.nick,playerNo:c.playerNo});log('GİRİŞ',`#${c.playerNo}`,c.nick);if(!qkByUid.has(c.uid))qkByUid.set(c.uid,{});c.qk=qkByUid.get(c.uid);{const t=treasures.get(c.uid);if(t)send(c,{t:'tstate',d:{parts:t.parts,spot:t.spot}});}return;}
    if(!c.uid||!c.econ)return;
    switch(m.t){
      case'join':{const name=String(m.sea||'').slice(0,40);if(name===c.sea)return;if(!canJoin(c,name,now)){send(c,{t:'denied',reason:'harita kilitli'});return;}leaveSea(c);c.last=null;if(!name)return;
        const room=seas.get(name)??new Set();if(room.size>=LIMITS.maxPerSea){send(c,{t:'full'});return;}room.add(c);seas.set(name,room);c.sea=name;c.seen=null;send(c,{t:'joined',sea:name});
        if(seaMap(name)){const fresh=npcFill(name,now);const st=seaNpcs.get(name);send(c,{t:'nlist',d:[...(st?.list.values()??[])].map(npcInfo)});
          if(fresh.length){const m=JSON.stringify({t:'nlist',d:[...st.list.values()].map(npcInfo)});for(const x of room)if(x!==c)send(x,m);}}
        {const l=lootFor(c);if(l)send(c,{t:'loot',d:lootInfo(l)});}
        const b=bossSeas.get(name)?.boss;if(b)send(c,{t:'boss',d:bossInfo(name,b)});
        const isle=islands.get(islandOfSea(name));if(isle)send(c,{t:'isle',d:islandInfo(isle)});
        if(name===SIEGE_ROOM){const r=siegeJoin(c.uid,c.nick,now);if(r)send(c,{t:'sstate',d:siegeInfo(r,c.uid)});}return;}
      case'state':{if(!c.sea||!c.rState.hit(now))return;const s=m.d;let v=checkState(c.last,s,now);if(v==='bad')return;if(v==='speed'&&s.tp&&now-(c.tpAt||0)>8000){c.tpAt=now;v='ok';}delete s.tp;if(v==='bad')return;if(v==='speed'){suspect(c,'hız',`${Math.round(s.x)},${Math.round(s.y)}`);if(c.last)send(c,{t:'pos',d:{x:c.last.x,y:c.last.y}});return;}
        {const land=onLand(seaMap(c.sea),s.x,s.y);if(land){c.landHits=(c.landHits||0)+1;if(c.landHits%10===1)suspect(c,'karaya çıkma',land);if(c.last)send(c,{t:'pos',d:{x:c.last.x,y:c.last.y}});return;}}
        if(num(s.maxHp)){const cap=hpCap(c.econ);if(s.maxHp>cap*1.02){suspect(c,'can sınırı',`${Math.round(s.maxHp)}>${cap}`);s.maxHp=cap;}c.maxHp=s.maxHp;}
        if(c.maxHp&&s.hp>c.maxHp)s.hp=c.maxHp;noteHp(c,s.hp,now);
        c.last={x:s.x,y:s.y,at:now};s.id=c.netId;queueState(c,s);return;}
      case'fire':return; // oyuncular arası atış yalnız sunucu atışıyla (atk); oyuncunun bildirdiği hasar kabul edilmez
      case'sunk':{if(!c.sea)return;const s=m.d||{};s.victim=c.netId;s.victimNick=c.nick;
        // Batıran yalnızca son 60 sn'de bu oyuncuya ateş etmiş biri olabilir (arkadaşa SP yazdırma engeli)
        if(s.by&&!(now-(c.pvp?.from.get(String(s.by))??-1e12)<60_000)){suspect(c,'sahte batırma',String(s.by));s.by=null;s.byNick=null;}
        if(s.by){const k=[...(seas.get(c.sea)||[])].find(x=>x.netId===String(s.by));const add=spCredit(k,c.uid,now);if(add)addCredit(k,add);}
        pvpReset(c);toSea(c,{t:'sunk',d:s});return;}
      case'bkill':return; // Only accepted nkill events advance the boss counter.
      case'bhit':return; // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case'shit':return; // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case'ld':{const d={...(m.d&&typeof m.d==='object'?m.d:{}),hero:(heroUntil.get(c.uid)??0)>now};c.ld=buildLoadout(c.econ,d);c.ldRaw=d;return;}
      case'atk':{if(!c.sea||!c.rSalvo.hit(now))return;await onAttack(c,m.d,now);return;}
      case'nhit':return; // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case'nkill':{if(NPCS[String(m.d?.id||'')])return;if(!c.sea||!c.rKill.hit(now))return;const r=killCredit(c,String(m.d?.id||''),now);
        if(r.err){if((r.err!=='hız'&&r.err!=='mermi')||r.flag){suspect(c,'batırma',`${r.err} ${m.d?.id}`);if(c.kb)c.kb.miss=0;}return;}addCredit(c,r.add);
        const map=seaMap(c.sea);if(map&&String(m.d?.id)===bossFor(map).trigger){const b=bossKill(c.sea,BOSS_KILLS,now);if(b)toSea(c,{t:'boss',d:bossInfo(c.sea,b)},true);}return;}
      case'salvo':{if(!c.rSalvo.hit(now)){suspect(c,'salvo hızı');return;}await applyUsage(c,m.d,null,now);return;}
      case'use':{if(!c.rUse.hit(now))return;const id=String(m.d?.id||''),before=c.econ;await applyUsage(c,null,id,now);
        if(id==='mine'&&(c.econ!==before||!SERVER_SECRET||(process.env.BENCH_AUTH==='1'&&c.uid.startsWith('b')))){const mn=placeMine(c,Number(m.d?.x),Number(m.d?.y),now);if(mn)toSea(c,{t:'mine',d:{id:mn.id,x:mn.x,y:mn.y,by:c.netId}});}return;}
      case'qdone':{if(!c.uid||!c.rKill.hit(now))return;const id=String(m.d?.id||'');const r=questCredit(c,id,now);
        if(r.err){if(r.err==='bekleme')suspect(c,'görev bekleme',id);send(c,{t:'qres',d:{id,ok:false,err:r.err}});return;}addCredit(c,r.add);send(c,{t:'qres',d:{id,ok:true}});return;}
      case'spk':{if(!c.sea||!c.rUse.hit(now))return;{const t=lootTake(c,'sp',m.d?.id);if(t.err){if(t.err==='uzak')suspect(c,'uzak pırıltı');return;}send(c,{t:'loot',d:lootInfo(c.loot)});}const r=sparklePicked(c,now);if(r.err){if(r.err==='hız')suspect(c,'pırıltı hızı');return;}const sr=sparkleReward(c);addCredit(c,sr.add);send(c,{t:'spkr',d:sr.out});return;}
      case'chest':{if(!c.sea||!c.rKill.hit(now))return;{const t=lootTake(c,'ch',m.d?.id);if(t.err){if(t.err==='uzak')suspect(c,'uzak sandık');return;}send(c,{t:'loot',d:lootInfo(c.loot)});}const r=chestPicked(c,now);if(r.err){if(r.err==='hız')suspect(c,'sandık hızı');return;}{const cr=chestReward(c,m.d?.g);addCredit(c,cr.add);send(c,{t:'chestr',d:cr.out});}if(r.found)send(c,{t:'tstate',d:{parts:r.parts,spot:treOf(c.uid).spot,part:true}});return;}
      case'tdig':{if(!c.sea||!c.rKill.hit(now))return;const r=treasureDig(c);if(r.err){send(c,{t:'tdig',d:{ok:false,err:r.err}});return;}addCredit(c,r.add);send(c,{t:'tdig',d:{ok:true,reward:r.reward}});return;}
      case'spy':{if(!c.rKill.hit(now))return;await onSpy(c,m.d?.nick);return;}
      case'thit':return; // kule hasarı ve tamiri yalnız sunucu atışıyla
      // Kule dikildi (veritabanında): önce canlar yazılır, sonra ada yeniden okunup denize gönderilir
      case'tbuilt':{const key=String(m.d?.key||'');const i=islands.get(key);if(!i||!c.rKill.hit(now))return;await saveIslandHp({...i,hpDirty:true});const n=await loadIsland(key).catch(()=>null);if(n)sendRoom(key,{t:'isle',d:islandInfo(n)});return;}
      // Filoya girme/çıkma sonrası filo bilgisi yenilenir
      case'gref':{if(!c.rKill.hit(now))return;c.guildId=await guildOf(c.uid).catch(()=>c.guildId);return;}
      case'chat':{if(!c.rChat.hit(now))return;const text=String(m.d?.text||'').slice(0,LIMITS.chatLen).trim();if(!text)return;
        toAll(c,{t:'chat',d:{nick:c.nick,tag:m.d?.tag??null,text,at:now}});return;}
      case'bid':{const b=m.d||{};b.id=c.uid;b.nick=c.nick;toAll(c,{t:'bid',d:b});return;}
      case'known':case'ask':{toAll(c,{t:m.t,d:m.d});return;}
    }
  };
  // Serialize asynchronous handlers: stock reservation must finish before the following hit.
  let queue=Promise.resolve(),pending=0;
  ws.on('message',raw=>{
    if(!c.rMsg.hit(Date.now())||pending>=64){suspect(c,'mesaj seli');return;}
    pending++;queue=queue.then(()=>{if(ws.readyState===1)return handleMessage(raw);})
      .catch(e=>{log('PAKET reddedildi',c.playerNo,e?.name||'hata');})
      .finally(()=>{pending--;});
  });
  ws.on('close',()=>{clearTimeout(authTimer);clearTimeout(c.econTimer);void flushCredit(c);if(c.uid&&c.last&&seaMap(c.sea))void dbRpc('spy_seen',{p_uid:c.uid,p_map:seaMap(c.sea),p_x:Math.round(c.last.x),p_y:Math.round(c.last.y)}).catch(()=>{});leaveSea(c);all.delete(c);if(c.uid)log('ÇIKIŞ',`#${c.playerNo}`,c.nick);});
  ws.on('error',()=>{});
});
// Ölü bağlantıları temizle
setInterval(()=>{for(const c of all){if(c.ws.isAlive===false){c.ws.terminate();continue;}c.ws.isAlive=false;try{c.ws.ping();}catch{}}},30000).unref();
wss.on('connection',ws=>{ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true;});});
if(process.env.NODE_ENV!=='test')void loadIslands();
if(process.env.NODE_ENV!=='test')httpServer.listen(PORT,'127.0.0.1',()=>log(`Oyun sunucusu ${PORT} portunda`));
