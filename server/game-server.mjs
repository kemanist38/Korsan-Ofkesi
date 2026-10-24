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
const RIVAL_DAILY_LIMIT=3;// aynı rakip günde en çok 3 kez sayılır
import {NPCS,MAPS,QUESTS,QUEST_COOLDOWN_MS,bossFor,BOSS_KILLS,FLEET,WORLD_WIDTH,WORLD_HEIGHT,coordLabel} from '../src/campaign.ts';
import {TREASURE_PARTS,PART_CHANCE,DIG_RADIUS,treasureReward} from '../src/treasure.ts';
import {questEp,bossEp,ELITE_POINTS_PER_BALL,IRON_EP_PER_BALL,eliteLevelFromEp} from '../src/arsenal.ts';
import {CANNONS,salvoDamage,reloadTime,rangeOf,targetFactor} from '../src/combat.ts';
import {EQUIPMENT,equipTotals} from '../src/equipment.ts';
import {cumulativeEliteBonus,ELITE_CANNON_CAPACITY} from '../src/elite-progression.ts';
import {ACHIEVEMENTS,MAIN_COLLECTION} from '../src/achievements.ts';
import {officerSlots,OFFICER_MAX_RANK,talentPoints,TALENTS} from '../src/crew.ts';
import {MINE,CONSUMABLES} from '../src/arsenal.ts';
import {goldMult,xpMult,epMult,dayEvent,TREATY_KILL_AMMO} from '../src/events.ts';
import {FW_MIN_SINKS,FW_PRIZE,fwWinner,fwEligible} from '../src/fleetwar.ts';
import {TREATY_FX,TREATY_FX_IDS,TREATY_MIN_PICKS,TREATY_MAP,TREATY_VOTE_MS,TREATY_FX_MS,TREATY_ENVOY_R,treatyGoal,treatyTally,treatyWinner,treatyRewards} from '../src/treaty.ts';
import {HERO_DAMAGE,HERO_DAYS} from '../src/siege.ts';
import {createChest} from '../src/loot.ts';
import {fleetReward,LEVEL_XP} from '../src/campaign.ts';
import {ELITE_SHIPS} from '../src/elite-ships.ts';
import {contribReward,earnsChest,victoryChest} from '../src/siege.ts';
import {DOM_SIZE,DOM_COUNTDOWN_MS,DOM_MATCH_MS,DOM_WIN,DOM_ZONE,DOM_BASE,domWindowAt,domBalance,domZoneStep,domWinner,domReward} from '../src/domination.ts';
import {LS_DROP_FIRST_MS,LS_DROP_EVERY_MS,LS_DROP_FALL_MS,LS_DROP_PICK_R,LS_DROP_LOOT,LS_ITEMS,LS_ITEM_MAX,LS_ITEM_RESPAWN_MS,LS_PICK_R,LS_SPEED_MS,lsEmptyInv,lsPickKind,LS_SIZE,LS_COUNTDOWN_MS,LS_LOADOUT,LS_HP,LS_START_R,LS_RADII,LS_PHASE_MS,LS_FOG_DPS,LS_MATCH_MS,lsZoneAt,lsNext,lsReward,lsSpawn} from '../src/cursed.ts';
import {filterChat,chatHasBad} from '../src/chat-filter.ts';
import {GROUP_MAX,groupMult} from '../src/social.ts';
import {DUEL_MAPS,DUEL_BETS,DUEL_MS,DUEL_R,DUEL_ASK_MS,DUEL_NEAR,DUEL_LEVEL_GAP,duelPot,duelLeft,duelUse} from '../src/duel.ts';
import {RAGE_MAX,RAGE_SALVOS,RAGE_SECONDS,RAGE_PER_RIVAL,RAGE_PER_BOSS} from '../src/rage.ts';
import {levelQuestGoal,levelQuestTargets,levelQuestMap} from '../src/level-quest.ts';

const PORT=Number(process.env.PORT||3000);
const SUPABASE_URL=process.env.SUPABASE_URL||'https://vidjvineafeiyoclioau.supabase.co';
const SUPABASE_ANON=process.env.SUPABASE_ANON||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZGp2aW5lYWZlaXlvY2xpb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mjk2NjMsImV4cCI6MjEwNzMwNTY2M30.sKlmmfQRr-ZASkaSbax22ca80cyDCc8DNz4Idq19g5s';
// Sınırlar
export const LIMITS={maxHit:400000,maxSpeed:900,firesPerSec:12,statesPerSec:15,chatPerMin:20,chatLen:200,maxPerSea:300};
const started=Date.now();
// Shopier OSB bilgileri ve sunucu anahtarı yalnızca VPS'teki /opt/game/.env dosyasında durur
const RC_WEBHOOK_AUTH=process.env.REVENUECAT_WEBHOOK_AUTH||'';
const OSB_USER=process.env.SHOPIER_OSB_USER||'',OSB_PASS=process.env.SHOPIER_OSB_PASS||'',SERVER_SECRET=process.env.SERVER_SECRET||'';

// ---------------------------------------------------------------- Kimlik doğrulama (Supabase oturum anahtarı)
export async function verifyToken(token){
  // Yalnızca yük testi (tools/bench-server.mjs): BENCH_AUTH=1 iken sahte hesaplar. Canlı sunucuda bu değişken yoktur.
  if(process.env.BENCH_AUTH==='1'&&token.startsWith('bench:')){const [n,g]=token.slice(6).split(':').map(Number);return{uid:'b'+n,nick:'Bot'+n,playerNo:90000+n,banned:false,guildId:g||0};}
  const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`}});
  if(!u.ok)return null;const user=await u.json();
  const p=await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=nick,player_no,banned`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${token}`}});
  const rows=p.ok?await p.json():[];const prof=rows[0];if(!prof)return null;
  // Süreli ban bittiyse sunucu kaldırır (033_social.sql); denetlenemezse ban sürer
  let banned=!!prof.banned;if(banned){const b=await dbRpcJson('ban_check',{p_uid:user.id}).catch(()=>null);if(b===false)banned=false;}
  return{uid:user.id,nick:prof.nick,playerNo:prof.player_no,banned,guildId:await guildOf(user.id).catch(()=>0)};
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
// Uygulama içi satın alma (App Store / Google Play): RevenueCat ödemeyi mağazayla doğrular ve buraya bildirir (webhook).
// Yetki: RevenueCat panelinde yazılan Authorization değeri VPS .env'deki REVENUECAT_WEBHOOK_AUTH ile aynı olmalı.
// app_user_id = oyuncunun hesap kimliği (uygulama satın almadan önce RevenueCat'e bununla giriş yapar). Aynı işlem iki kez yüklenmez.
export const IAP_GRANT=new Set(['INITIAL_PURCHASE','NON_RENEWING_PURCHASE']);
export function rcAuthOk(header,secret){if(!secret||!header)return false;const a=Buffer.from(String(header).replace(/^Bearer /,'')),b=Buffer.from(secret.replace(/^Bearer /,''));return a.length===b.length&&crypto.timingSafeEqual(a,b);}
export function parseRcEvent(body){let o;try{o=JSON.parse(body);}catch{return null;}const e=o?.event;if(!e||typeof e!=='object')return null;
  const uid=String(e.app_user_id||'');const tx=String(e.transaction_id||e.id||'');if(!tx)return null;
  return{type:String(e.type||''),uid:/^[0-9a-f-]{36}$/i.test(uid)?uid:null,product:String(e.product_id||''),tx,store:String(e.store||'').toLowerCase()||'store',sandbox:e.environment==='SANDBOX'};}
export function sandboxAllowed(uid,testUids=process.env.IAP_TEST_UIDS||'',online=all){if(!uid)return false;
  if(testUids.split(',').map(x=>x.trim()).includes(uid))return true;for(const c of online)if(c.uid===uid&&c.admin)return true;return false;}
async function handleRevenueCat(body){const e=parseRcEvent(body);if(!e){log('IAP okunamadı');return true;}
  const rpc=(fn,args)=>fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},body:JSON.stringify({p_secret:SERVER_SECRET,...args})});
  // Test (sandbox) ödemesi gerçek para değildir: yalnız yöneticiye ve .env'deki IAP_TEST_UIDS listesindeki hesaplara (ör. Apple inceleme hesabı) inci verir
  if(IAP_GRANT.has(e.type)&&e.sandbox&&!sandboxAllowed(e.uid)){log('IAP test ödemesi reddedildi',e.store,e.product,e.tx);return true;}
  if(IAP_GRANT.has(e.type)){const r=await rpc('iap_credit',{p_tx:e.tx,p_store:e.store,p_product:e.product,p_uid:e.uid});const st=r.ok?await r.json():null;log('IAP',e.type,e.store,e.product,e.tx,e.sandbox?'(test)':'',st??`hata ${r.status}`);return r.ok;}
  if(e.type==='CANCELLATION'){const r=await rpc('iap_refund',{p_tx:e.tx});log('IAP iade',e.tx,r.ok?await r.json():`hata ${r.status}`);return r.ok;}
  log('IAP olay',e.type);return true;}
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
export function noteHp(t,hp,now){const p=pvpOf(t),max=t.maxHp||hp,secs=t.domTeam||now-(p.hitAt??-1e12)<COMBAT_MS?COMBAT_HEAL_SECONDS:HEAL_SECONDS;// Deniz Hakimiyeti: tamir yok, yalnız can emici payı
  p.hp=p.hp===null?Math.min(hp,max):Math.min(hp,Math.min(max,p.hp+(t.lsOn?0:Math.max(0,now-p.at)*max/secs/1000)));p.at=now;}// Lanetli Sular: can hiç artmaz
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
// Ödülü sunucu kesin hesaplar (oyunla aynı formül): etkinlik günü çarpanları ve Ödül Avcısı yeteneği sunucuda.
// Ekonomi eşitlemesi sunucunun verdiğini olduğu gibi yazar; oyuncunun kendi hesapladığı kazanç sayılmaz.
const talentRank=(c,id)=>Number(c?.ld?.tal?.[id])||0;
// Deniz Antlaşması etkisi yalnız o turda en az 40 pırıltı toplamış kaptana işler (treaty.elig)
const trOn=(c,id)=>!!treaty.fx&&treaty.fx.id===id&&Date.now()<treaty.fx.until&&!!c?.uid&&!!treaty.elig?.[c.uid];
const G=(n,c)=>Math.round(n*goldMult(undefined,trOn(c,'gold'))),X=(n,c)=>Math.round(n*xpMult(undefined,trOn(c,'xp'))*groupBonus(c));
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
export function killCredit(c,id,now){const map=seaMap(c.sea);if(!map||!MAPS[map])return{err:'deniz'};const m=MAPS[map],npc=NPCS[id];
  if(!npc||!m.npcs.includes(id))return{err:'hedef'};const def=npc;
  // Batırma bütçesi: saniyelik hasar sınırı kadar dolar, 30 saniyelik birikir (büyük gemi uzun sürer); canın yarısı karşılanmalı
  const rate=dpsCap(c.econ?.level??8);c.kb??={pool:rate*30,t:now,miss:0};const b=c.kb;b.pool=Math.min(rate*30,b.pool+Math.max(0,now-b.t)/1000*rate);b.t=now;
  if(b.pool<def.hp*.5){b.miss++;return{err:'hız',flag:b.miss>=10};}
  if((c.sb?.pool??0)<def.hp*.6){b.miss++;return{err:'mermi',flag:b.miss>=10};}
  sbTake(c,def.hp*.6);b.pool=Math.max(0,b.pool-def.hp);b.miss=0;
  const add={gold:G(def.gold,c),xp:X(def.xp,c)};
  add.st_npc=1;if(npc.role==='heavy')add.st_heavy=1;if(trOn(c,'ammo'))add.a_fire=TREATY_KILL_AMMO;
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
  if(q.kind==='npc'){c.qk??={};const have=q.ids.reduce((a,k)=>a+(c.qk[k]||0),0);if(have<q.required)return{err:'sayı',have};
    let need=q.required;for(const k of q.ids){const t=Math.min(need,c.qk[k]||0);c.qk[k]-=t;need-=t;}}
  cd.set(id,now);return{add:{pearls:q.pearls,gold:G(q.gold,c),xp:X(q.xp,c),ep:Math.round(questEp(q.tier)*epMult()),st_quest:1}};}
// Boss ödülü: payı sunucu bilir; katılımcıya oyunun formülüyle (havuz × pay) kazanç hakkı yazılır
export const bossPool=n=>1+.6*(Math.min(5,Math.max(1,n))-1);
export function bossCredit(map,share,n,c){if(!MAPS[map]||!(share>0))return null;const b=bossFor(map),pool=bossPool(n);
  const add={gold:G(Math.round(NPCS[b.trigger].gold*20*pool*share),c),xp:X(Math.round(b.xp*pool*share),c)};
  if(share>=.03){add.ep=Math.round(bossEp(b.tier)*epMult());add.st_boss=1;add.pearls=b.pearls;}return add;}
// Kuşatma: kabul edilen her hasar için katkı ödülü (oyunun formülüyle) kazanç hakkı olarak
export function siegeCredit(dmg,n,level,c){const r=contribReward(dmg,Math.max(1,n),Math.max(1,Math.min(8,Math.round(Number(level)||8))));return{gold:G(r.gold,c),xp:X(r.xp,c),pearls:r.pearls};}
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
  if(rand()>=PART_CHANCE*(trOn(c,'treasure')?2:1))return{parts:t.parts};t.parts++;
  if(t.parts>=TREASURE_PARTS&&!t.spot){t.parts-=TREASURE_PARTS;t.spot=pickSpot(map,rand);return{parts:t.parts,spot:t.spot,found:true};}
  return{parts:t.parts,found:true};}
// Pırıltı toplama sınırsızdır; yalnız imkânsız hız reddedilir: art arda 40, sonra saniyede 1,5.
export function sparklePicked(c,now){const map=seaMap(c.sea);if(!map||!MAPS[map])return{err:'deniz'};c.spb??={pool:40,t:now};
  c.spb.pool=Math.min(40,c.spb.pool+Math.max(0,now-c.spb.t)*1.5/1000);c.spb.t=now;if(c.spb.pool<1)return{err:'hız'};c.spb.pool-=1;
  c.qk??={};const k='spk:'+map;c.qk[k]=Math.min(200,(c.qk[k]||0)+1);return{ok:true};}
// Sandık ve pırıltı yerleri sunucuda (oyuncuya özel): alım yalnızca sunucunun verdiği yerde ve geminin yanındayken sayılır
export const LOOT={chests:3,chestMax:4,chestRespawn:22_000,sparkles:12,chestR:46,sparkleR:40,slack:110};
export function lootFor(c,rand=Math.random){const map=seaMap(c.sea);if(!map||!MAPS[map])return null;
  if(c.loot?.map!==map){c.loot={map,ch:[],sp:[],seq:0,chT:Date.now()};for(let i=0;i<LOOT.chests;i++)lootAdd(c.loot,'ch',rand);for(let i=0;i<LOOT.sparkles;i++)lootAdd(c.loot,'sp',rand);}
  return c.loot;}
function lootAdd(l,kind,rand=Math.random){const p=pickSpot(l.map,rand);l[kind].push([++l.seq,Math.round(p.x),Math.round(p.y)]);}
export const lootInfo=l=>({ch:l.ch,sp:l.sp});
// Alım: kimlik sunucunun listesinde olmalı ve gemi yanında olmalı
export function lootTake(c,kind,id){const l=c.loot;if(!l||l.map!==seaMap(c.sea)||!c.last)return{err:'yok'};const list=l[kind],i=list.findIndex(x=>x[0]===Number(id));if(i<0)return{err:'yok'};
  const [,x,y]=list[i];if(Math.hypot(x-c.last.x,y-c.last.y)>(kind==='ch'?LOOT.chestR:LOOT.sparkleR)+LOOT.slack)return{err:'uzak'};
  list.splice(i,1);if(kind==='sp')lootAdd(l,'sp');return{ok:true};}
export function lootTick(c,now){const l=c.loot;if(!l||now-l.chT<LOOT.chestRespawn)return false;l.chT=now;if(l.ch.length>=LOOT.chestMax)return false;lootAdd(l,'ch');return true;}
// Sandık ve pırıltı içeriğini sunucu belirler; içerik kazanç hakkı (inci doğrudan cüzdana) olarak yazılır ve oyuna gönderilir
export function chestReward(c,gilded,rand=Math.random){const map=seaMap(c.sea);const ch=createChest('drift',0,0,.08*Math.min(3,talentRank(c,'scavenger')),MAPS[map]?.tier??1,rand);
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
  return{reward:r,add:{gold:G(r.gold,c),pearls:r.pearls,st_treasure:1,[r.ammo==='chain'?'chain':'a_'+r.ammo]:r.ammoQty,a_powder:r.powder,a_shield:r.shield}};}
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
// Rakip batırma sayacı: aynı rakip günde en çok RIVAL_DAILY_LIMIT kez sayılır 
export function sinkCredit(killer,victimUid,now){if(!killer?.uid||!victimUid||killer.uid===victimUid)return null;const day=new Date(now+3*3600_000).toISOString().slice(0,10);
  const m=spByUid.get(killer.uid)??new Map();spByUid.set(killer.uid,m);const r=m.get(victimUid);const n=r&&r.day===day?r.n:0;if(n>=RIVAL_DAILY_LIMIT)return null;
  m.set(victimUid,{day,n:n+1});return true;}
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
  return{tal,level:lvl,mineMult:1+.15*(tal.sapper||0),cannons:total,type,upDamage:Number(st.u_damage)||0,upReload:Number(st.u_reload)||0,upRange:Number(st.u_range)||0,crewDamage:1+.05*rank('gunner'),crewReload:1,crewRange:12*rank('lookout'),
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
  else{n.aggro=null;if(Math.hypot(n.wx-n.x,n.wy-n.y)<20){const a=Math.random()*Math.PI*2,r=60+Math.random()*240;n.wx=Math.max(80,Math.min(WORLD_WIDTH-80,n.hx+Math.cos(a)*r));n.wy=Math.max(80,Math.min(WORLD_HEIGHT-80,n.hy+Math.sin(a)*r));const map=n.id.slice(0,n.id.lastIndexOf(':'));if(npcSolids(map).some(o=>Math.hypot(n.wx-o.x,n.wy-o.y)<o.r+40)){n.wx=n.x;n.wy=n.y;return;}tx=n.wx;ty=n.wy;}}
  const d=Math.hypot(tx-n.x,ty-n.y);if(d<1)return;const st=Math.min(d,v*dt);n.x+=(tx-n.x)/d*st;n.y+=(ty-n.y)/d*st;n.moved=true;
  // Adalar oyuncu gemisindeki gibi katıdır: NPC kıyıya itilir ve kıyı boyunca kayar; dolaşma hedefi adanın arkasında kaldıysa yeni hedef seçer
  if(npcShore(n)&&!foe){n.wx=n.x;n.wy=n.y;}}
const npcSolids=map=>{const m=MAPS[map];if(!m)return[];return[...m.islands.map(is=>({x:is.x,y:is.y,r:is.r*.72+28})),...(m.fleet?[{x:m.fleet.x,y:m.fleet.y,r:FLEET.islandR}]:[])];};
export const MAPS_FOR_TEST=MAPS;
export function npcShore(n){let hit=false;for(const o of npcSolids(n.id.slice(0,n.id.lastIndexOf(':')))){const d=Math.hypot(n.x-o.x,n.y-o.y);if(d<o.r){const a=d>.01?Math.atan2(n.y-o.y,n.x-o.x):0;n.x=o.x+Math.cos(a)*o.r;n.y=o.y+Math.sin(a)*o.r;hit=true;}}return hit;}
// Ateş: NPC, kendisini vuran ya da 360 birime yaklaşan oyuncuya oyunun hızıyla ateş eder (güvenli denizde etmez, yeniden doğan
// oyuncuya 3 sn dokunmaz). Hasar oyuncuya bildirilir ve sunucudaki can modelinden düşülür (kalkan, yetenek gibi azaltıcılar için %70).
export const NPC_FIRE_RANGE=360,NPC_SPAWN_GRACE=3000,NPC_DMG_MODEL=.7;
export function npcFire(n,players,now,safe,rand=Math.random){if(safe||now<(n.cdUntil??0))return null;
  let t=n.aggro&&now<n.aggroUntil?players.find(p=>p.uid===n.aggro&&p.last):null;
  if(!t||Math.hypot(t.last.x-n.x,t.last.y-n.y)>NPC_FIRE_RANGE){t=null;let bd=NPC_FIRE_RANGE;for(const p of players){if(!p.last||p.admin||now-(p.tpAt||0)<NPC_SPAWN_GRACE)continue;const d=Math.hypot(p.last.x-n.x,p.last.y-n.y);if(d<bd){bd=d;t=p;}}}
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
export function npcDeathCredit(c,def,map,share,noCount=false){const add={gold:G(def.gold*share*(1+.05*talentRank(c,'bounty')),c),xp:X(def.xp*share,c)};
  if(share>=NPC_KILL_SHARE&&!noCount){add.st_npc=1;if(def.role==='heavy')add.st_heavy=1;if(trOn(c,'ammo'))add.a_fire=TREATY_KILL_AMMO;c.qk??={};c.qk[def.id]=(c.qk[def.id]||0)+1;
    const lvl=Math.round(Number(c.econ?.level)||1);if(lvl>=2&&map===levelQuestMap(lvl)&&levelQuestTargets(lvl).ships.includes(def.id))add.lqk=1;}
  return add;}
export class Rate{constructor(perWindow,windowMs){this.n=perWindow;this.w=windowMs;this.t=[];}hit(now){while(this.t.length&&now-this.t[0]>this.w)this.t.shift();if(this.t.length>=this.n)return false;this.t.push(now);return true;}}

export function canJoin(c,name,now=Date.now()){
  if(!name)return true;if(c.admin&&name!==SIEGE_ROOM&&MAPS[seaMap(name)])return true;if(!c.econ)return false;
  if(name===SIEGE_ROOM)return siegeWindowAt(now).open||SIEGE_TRIAL;
  {const id=lsMatchOfSea(name);if(id!==undefined){const m=lsMatches.get(id);return !!m&&!m.result&&!!m.players.get(c.uid)?.alive;}}
  {const id=domMatchOfSea(name);if(id!==undefined){const m=domMatches.get(id);return !!m&&!m.result&&m.teams.has(c.uid);}}
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
  if(item===null){const a=String(salvo?.a||''),n=Number(use[ITEM_OF[a]??'a_'+a])||0;
    // Deniz Hakimiyeti: maçta elit puan ilerlemez; harcanan gülleler sayılır, maç sonunda 2 katı EP verilir
    const dm=domMatches.get(domMatchOfSea(c.sea));if(dm&&dm.teams.has(c.uid)){const balls=a==='iron'?(Number(use.iron)||0):n+(Number(use.iron)||0);dm.spent.set(c.uid,(dm.spent.get(c.uid)||0)+balls);return;}
    if(n>0&&ELITE_POINTS_PER_BALL[a])addCredit(c,{ep:Math.round(n*ELITE_POINTS_PER_BALL[a]*epMult()),st_eliteBalls:n});
    const ni=Number(use.iron)||0;if(ni>0)addCredit(c,{ep:Math.round(ni*IRON_EP_PER_BALL*epMult())});}
}

// ---------------------------------------------------------------- Sunucu
export const seas=new Map(); // ad → Set<Client>
export const all=new Set();
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
function leaveSea(c){if(c.duel)duelForfeit(c,'denizden ayrıldı');c.seen=null;c.state=null;for(const x of seas.get(c.sea)||[])x.seen?.delete(c);if(!c.sea)return;const room=seas.get(c.sea);if(room){room.delete(c);if(!room.size)seas.delete(c.sea);}if(c.netId)toSea(c,{t:'leave',id:c.netId});c.sea='';c.last=null;}

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
// Batırma sayısı (güverte nişanı): veritabanında; doğrulanmış batırmada 1 artar, girişte okunur, oyuncunun kendisine bildirilir
async function sinkAdd(c,add){if(!c?.uid)return;const n=Number(await dbRpcJson('rival_sink',{p_uid:c.uid,p_add:add}).catch(()=>null));if(!Number.isFinite(n))return;c.sinks=n;send(c,{t:'sinks',d:{n}});}
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
// İhale teklifi: oyuncunun gönderdiği tutara güvenilmez; o saatin en yüksek teklifi veritabanından okunup duyurulur
async function auctionTop(lot){try{const h=Math.floor(Date.now()/3600000);const r=await fetch(`${SUPABASE_URL}/rest/v1/auction_top?hour=eq.${h}&lot=eq.${lot}&select=user_id,nick,amount,at`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`}});const x=r.ok?(await r.json())[0]:null;return x?{hour:h,lot,amount:Number(x.amount),id:x.user_id,nick:x.nick,at:Date.parse(x.at)}:null;}catch{return null;}}
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
    sendRoom(key,{t:'isle',d:islandInfo(i)});{const rw=fleetReward(Number(String(key).split('/')[0])||1);addCredit(c,{gold:rw.gold,xp:rw.xp});}const msg=JSON.stringify({t:'icap',d:{key,tag:i.tag,by:c.netId,nick:c.nick}});for(const x of all)if(x.uid)send(x,msg);}
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
const IDENT=['nick','tag','ship','maxHp','sp','level','adm','tm','sk','tr'];
// Kimlik alanlarını oyuncu değil sunucu belirler: ad, filo etiketi, seviye, yönetici işareti, batırma sayısı ve TP sırası (sp artık yok)
export function serverIdent(c,s,k){if(k==='nick')s.nick=c.nick;else if(k==='tag')s.tag=c.tag||null;else if(k==='level')s.level=Number(c.econ?.level)||1;
  else if(k==='sk')s.sk=c.sinks??0;else if(k==='tr')s.tr=tpRanks.get(c.uid)??0;else if(k==='sp'||k==='adm'&&!c.admin){delete s[k];return false;}return true;}
function queueState(c,s){const id={};let changed=false;for(const k of IDENT)if(k in s){if(!serverIdent(c,s,k))continue;if(JSON.stringify(c.ident?.[k])!==JSON.stringify(s[k]))changed=true;id[k]=s[k];delete s[k];}
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
    for(const [uid,share] of r.shares){const x=[...room].find(p=>p.uid===uid)??[...all].find(p=>p.uid===uid);if(!x)continue;addCredit(x,npcDeathCredit(x,def,map,share,x!==c&&!!x.grp&&x.grp===c.grp));/* grup içinde görev sayacı yalnız son vuruşu yapana */send(x,{t:'nkilled',d:{id:r.dead.id,share}});}
    const m=JSON.stringify({t:'ndie',d:{id:r.dead.id}});for(const x of room)send(x,m);
    if(def.id===bossFor(map).trigger){const b=bossKill(c.sea,BOSS_KILLS,now);if(b)toSea(c,{t:'boss',d:bossInfo(c.sea,b)},true);}}}
// ---------------------------------------------------------------- Mayınlar (sunucuda)
// Mayın oyuncunun bildirdiği yere (geminin 80 birim yakını) konur, 1 sn'de kurulur, 40 sn yaşar. 46 birime yaklaşan düşman NPC'de,
// başka filodan oyuncuda ya da düşman ada kulesinde patlar; 95 birim içindekilere seviye ve Mayın Uzmanı yeteneğiyle hasar verir.
export const seaMines=new Map();let mineSeq=0;
export function placeMine(c,x,y,now){if(!c.last||!num(x)||!num(y)||Math.hypot(x-c.last.x,y-c.last.y)>80)return null;
  const list=seaMines.get(c.sea)??[];seaMines.set(c.sea,list);if(list.filter(m=>m.uid===c.uid).length>=MINE.maxActive)return null;
  const L=c.ldRaw?buildLoadout(c.econ,c.ldRaw):null,m={id:++mineSeq,uid:c.uid,netId:c.netId,guildId:c.guildId||0,team:c.domTeam||null,x:Math.round(x),y:Math.round(y),arm:now+MINE.armSeconds*1000,until:now+40_000,
    dmg:Math.round((MINE.baseDamage+(L?.level??1)*MINE.damagePerLevel)*(L?.mineMult??1))};list.push(m);return m;}
function mineFoes(sea,m){const out={npcs:[],players:[],towers:[]};const near=(x,y,r)=>Math.hypot(x-m.x,y-m.y)<r;
  for(const n of seaNpcs.get(sea)?.list.values()??[])out.npcs.push(n);
  for(const p of seas.get(sea)??[])if(p.uid!==m.uid&&p.last&&!(m.guildId&&p.guildId===m.guildId&&!m.team)&&!(m.team&&(p.domTeam===m.team||domLocked(p,Date.now()))))out.players.push(p);
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
  {const map=seaMap(c.sea);for(const x of all){const sh=r.shares[x.uid];if(!sh)continue;const add=bossCredit(map,sh.share,r.n,x);if(add){addCredit(x,add);if(sh.share>=.03)rageGain(x,RAGE_PER_BOSS);}}}
  for(const x of room||[])send(x,{t:'bdown',d:{id:r.id,n:r.n,...(r.shares[x.uid]??{share:0,dmg:0})}});}
function siegeApply(c,i,dmg){const r=siegeHitPiece(c.uid,c.nick,i,dmg);if(r?.damage>0)addCredit(c,siegeCredit(r.damage,siegeRun.caps.size,c.econ?.level,c));if(!r?.down&&r?.down!==0)return;toSea(c,{t:'sdown',d:{i:r.down}},true);if(r.won)siegeFinish();}
// Sunucu atışı: hedef türü k = n (NPC), b (boss), s (kuşatma parçası), t (ada kulesi), p (oyuncu). Hasarı sunucu hesaplar.
// Konumu sunucunun bildiği hedeflerde (NPC, ada kulesi, oyuncu) menzil de denetlenir.
export function attackTarget(c,d){const k=String(d?.k||'n'),id=String(d?.id??'');
  if(k==='n'){const n=seaNpcs.get(c.sea)?.list.get(id);return n?{k,n,x:n.x,y:n.y,kind:'npc'}:null;}
  if(k==='b')return bossSeas.get(c.sea)?.boss?{k,kind:'boss'}:null;
  if(k==='s'){const i=Number(id);return c.sea===SIEGE_ROOM&&Number.isInteger(i)&&i>=0&&i<SIEGE_PIECES?{k,i,kind:'tower'}:null;}
  if(k==='t'){const key=islandOfSea(c.sea),slot=Number(id);if(!key||!Number.isInteger(slot)||slot<0||slot>=TOWER_SLOTS||!MAPS[key])return null;const f=MAPS[key].fleet,[dx,dy]=FLEET.towers[slot]??[0,0];return{k,key,slot,x:f.x+dx,y:f.y+dy,kind:'tower'};}
  if(k==='p'&&lsMatchOfSea(c.sea)!==undefined){const t=[...(seas.get(c.sea)||[])].find(x=>x.netId===id&&x!==c);return t?.last&&t.lsOn&&c.lsOn?{k,t,x:t.last.x,y:t.last.y,kind:'player',ls:true}:null;}
  if(k==='p'&&domMatchOfSea(c.sea)!==undefined){const t=[...(seas.get(c.sea)||[])].find(x=>x.netId===id&&x!==c);return t?.last&&t.domTeam&&!domLocked(t,Date.now())?{k,t,x:t.last.x,y:t.last.y,kind:'player',dom:true}:null;}
  if(k==='p'){const t=[...(seas.get(c.sea)||[])].find(x=>x.netId===id&&x!==c);if(!t?.last)return null;
    // Savaşa kapalı denizlerde (1/1, 1/2) yalnız düellodaki iki kaptan birbirine ateş edebilir; düellodaki kaptana başkası ateş edemez
    if(c.duel||t.duel)return c.duel&&c.duel!=='lock'&&c.duel===t.duel?{k,t,x:t.last.x,y:t.last.y,kind:'player',duel:true}:null;
    if(MAPS[seaMap(c.sea)]?.safe&&!t.admin)return null;
    if(c.guildId&&c.guildId===t.guildId&&!t.admin)return null;if(t.admin&&!aevOpen(c.sea))return null;return{k,t,x:t.last.x,y:t.last.y,kind:'player'};}
  return null;}
async function onAttack(c,d,now){if(!c.last)return;const tg=attackTarget(c,d);if(!tg)return;if(tg.ls){lsAttack(c,tg.t,now,d);return;}if(!c.ldRaw)return;c.ld=buildLoadout(c.econ,c.ldRaw);if(!c.ld)return;
  const a=String(d?.a||'iron');if(tg.dom&&(a==='heal'||tg.t.domTeam===c.domTeam))return;// Deniz Hakimiyeti: şifa güllesi yok, gülle yalnız rakibe
  if(!['iron','chain','fire','explosive','breaker','leech',...(tg.k==='p'||tg.k==='t'?['heal']:[])].includes(a))return;
  const rr=rageUse(c,!!d?.r,now);
  const why=shotCheck(c,c.ld,a,tg.x===undefined?0:Math.hypot(c.last.x-tg.x,c.last.y-tg.y),now,rr);if(why){if(why!=='dolum')suspect(c,'atış',why);return;}
  const cap=c.ld.cannons;let k=Math.max(0,Math.floor(Number(d?.n)||0)),i=Math.max(0,Math.floor(Number(d?.i)||0));if(k+i>cap){const f=cap/(k+i);k=Math.floor(k*f);i=Math.floor(i*f);}if(a==='iron'){i+=k;k=0;}
  const before=c.econ,pool=c.sb?.pool??0;await applyUsage(c,{a,n:k,i,p:d?.p?1:0},null,now);if(c.sb)c.sb.pool=pool;// sunucu atışı hasar bütçesi doldurmaz (çift hasar olmasın)
  if(c.econ===before&&SERVER_SECRET&&!(process.env.BENCH_AUTH==='1'&&c.uid.startsWith('b')))return;// stok onaylanmadı
  const raw=salvoDamage(c.ld,a,k,i,!!d?.p,rr),dmg=raw*targetFactor(a,tg.kind);
  if(tg.k==='n'){const live=seaNpcs.get(c.sea)?.list.get(tg.n.id);if(!live)return;const r=npcApply(c,c.sea,live,dmg,now);if(r.dead)npcDeath(c,r,now);return;}
  if(tg.k==='b'){bossApply(c,dmg);return;}
  if(tg.k==='s'){siegeApply(c,tg.i,dmg);return;}
  if(tg.k==='t'){if(a==='heal')towerHit(tg.key,tg.slot,c.guildId,Math.round(raw*2.6),true,now);else await towerApply(c,tg.key,tg.slot,dmg,false,now);return;}
  // Oyuncu: şifa (oyunun formülüyle en çok canın %8–9,2'si) ya da hasar (hedefin 20 sn bütçesiyle); oyuna gülle olarak iletilir
  if(tg.t.admin&&a!=='heal'&&!tg.dom){const t=tg.t,r=aevHit(c,t,dmg);if(!r)return;addCredit(c,r.add);send(c,{t:'arew',d:r.add});
    t.state&&(t.state.hp=r.hp);toNear(c,{t:'fire',d:{from:c.netId,to:t.netId,x:Math.round(c.last.x),y:Math.round(c.last.y),tx:Math.round(t.last.x),ty:Math.round(t.last.y),ammo:a,damage:0}},t.netId);
    if(r.sunk){const msg=JSON.stringify({t:'chat',d:{nick:'Duyuru',tag:null,adm:true,text:`⚓ ${c.nick} yönetici gemisini batırdı! Gemi yeniden toplandı, avlanma sürüyor.`,at:now}});for(const x of all)send(x,msg);toSea(c,{t:'aboom',d:{id:t.netId}},true);}
    return;}
  const t=tg.t,f={from:c.netId,to:t.netId,x:Math.round(c.last.x),y:Math.round(c.last.y),tx:Math.round(t.last.x),ty:Math.round(t.last.y),ammo:a,damage:0};
  if(a==='heal'){f.damage=Math.round(Math.min(raw,(t.maxHp||163000)*(.08+Math.random()*.012)));pvpHeal(t,f.damage,now);}
  else{f.damage=pvpGuard(t,dmg,now);pvpOf(t).from.set(c.netId,now);if(tg.duel)duelHit(c,f.damage);
    if(godCheck(t)){suspect(t,'ölümsüz');pvpReset(t);if(t.domTeam)domSink(t,now);send(t,{t:'forceSink',d:{by:c.netId,byNick:c.nick}});toSea(t,{t:'sunk',d:{victim:t.netId,victimNick:t.nick,by:c.netId,byNick:c.nick}});return;}}
  toNear(c,{t:'fire',d:f},t.netId);}

// ---------------------------------------------------------------- Yönetici batırma etkinliği (Kaptan Öfke)
// Yönetici 1. seviye denizlerde (1/1, 1/2) saldırıya kapalıdır; daha üst denizlerde 20–30 kaptanın 5–10 dk'da batırabileceği
// yüksek canlı bir gemiye dönüşür. Can ve ödüller denizin seviyesine göre; her isabet verilen hasar kadar TP, EP ve inci kazandırır,
// son vuruşu yapan ayrıca batırma ödülü alır. Can sunucuda tutulur; yöneticinin gemisi oyuncu savaşının can kurallarına girmez.
export const ADMIN_SHIP='admin';
// Görünen gemi: elit gemi yalnızca elit açılmışsa ve elit seviyesi o gemiye yetiyorsa gösterilir, yoksa başlangıç gemisi
export function shipAllowed(st,ship){const e=ELITE_SHIPS.find(x=>x.id===ship);if(!e)return'starter';
  return st&&Number(st.elite)>0&&eliteLevelFromEp(Number(st.ep)||0)>=e.level?ship:'starter';}
export const AEV_HP=[0,0,15e6,34e6,75e6,112e6,165e6,225e6,262e6];
export const aevTier=sea=>MAPS[seaMap(sea)]?.tier??0;
export const aevOpen=sea=>aevTier(sea)>=2;
export function aevPools(tier){const t=Math.max(2,Math.min(8,tier)),need=LEVEL_XP[t]||LEVEL_XP[7];
  return{xp:need,ep:250_000*t,pearls:5000,kill:{xp:Math.round(need*.1),ep:25_000*t,pearls:500}};}
export function aevState(adm){const tier=aevTier(adm.sea);if(!adm.aev||adm.aev.sea!==adm.sea)adm.aev={sea:adm.sea,hp:AEV_HP[tier]||0,max:AEV_HP[tier]||0};return adm.aev;}
// İsabet: hasarı düşer, saldırana hasar payı kadar ödül; batarsa son vuruşa bonus ve can yenilenir
export function aevHit(c,adm,dmg){if(!aevOpen(adm.sea)||!(dmg>0))return null;const ev=aevState(adm),tier=aevTier(adm.sea),P=aevPools(tier);
  const d=Math.min(dmg,ev.max*.01,ev.hp);if(!(d>0))return null;ev.hp-=d;const share=d/ev.max;
  c.aevFrac??={xp:0,ep:0,pearls:0};const add={};for(const k of ['xp','ep','pearls']){c.aevFrac[k]+=P[k]*share;const n=Math.floor(c.aevFrac[k]);if(n>0){add[k]=n;c.aevFrac[k]-=n;}}
  let sunk=false;if(ev.hp<=0){sunk=true;for(const k of ['xp','ep','pearls'])add[k]=(add[k]||0)+P.kill[k];ev.hp=ev.max;}
  return{add,sunk,hp:Math.round(ev.hp),max:ev.max};}
// ---------------------------------------------------------------- Deniz Hakimiyeti (src/domination.ts)
// Sıra: altı kaptan dolunca takımlar elit puana göre dengelenir, 15 sn sonra maç başlar (oda: sea-dom-<id>).
// Bölge, sayaç, bitiş ve ödül sunucuda; istemci yalnızca gösterir. Maçtan ayrılan ödül alamaz.
const DOM_TRIAL=process.env.DOM_TRIAL==='1';
export const domQueue=[];export const domMatches=new Map();export let domPending=null;
export const domMatchOfSea=sea=>/^sea-dom-([a-z0-9]+)$/.exec(sea||'')?.[1];
export const domOpen=(c,now)=>domWindowAt(now).open||DOM_TRIAL||!!c?.admin;
const domNick=c=>c.nick||'Kaptan';
const domInMatch=c=>[...domMatches.values()].some(m=>!m.result&&m.teams.has(c.uid));
export function domLobby(c,now=Date.now()){const p=domPending;
  return{k:'lobby',open:domOpen(c,now),q:domQueue.slice(0,DOM_SIZE*2).map(domNick),me:domQueue.includes(c)||!!p?.list.includes(c),
    teams:p?{r:p.r.map(domNick),b:p.b.map(domNick)}:null,at:p?p.at:0,live:domMatches.size};}
function domBroadcast(now){const to=new Set([...all].filter(x=>x.domWatch));for(const x of domQueue)to.add(x);for(const x of domPending?.list??[])to.add(x);for(const x of to)send(x,{t:'dom',d:domLobby(x,now)});}
// Batış ve doğuş sunucuda: batan gemi (kendisi bildirse de sunucu batırsa da) üssünde doğmak zorunda, 5 sn kıpırdayamaz ve
// vurulamaz. Maça ilk giriş de üsten olur. Işınlanma yalnız bu doğuşta kabul edilir.
export const DOM_LOCK_MS=5000,DOM_BASE_R=400,DOM_LOCK_SLACK=40;
export const domLocked=(c,now)=>!!c.domLock&&now<c.domLock.until;
export function domSink(c,now){c.domLock={until:now+DOM_LOCK_MS,pos:null,spawn:true};}
export function domMove(c,s,now){if(!num(s?.x)||!num(s?.y))return null;const base=DOM_BASE[c.domTeam];
  const spawn=!c.last||c.domLock?.spawn;
  if(spawn){if(Math.hypot(s.x-base.x,s.y-base.y)>DOM_BASE_R)return{x:base.x,y:base.y};c.domLock={until:c.domLock?.until??0,pos:{x:s.x,y:s.y},spawn:false};s.tp=1;c.tpFree=true;return null;}
  delete s.tp;
  if(domLocked(c,now)&&c.domLock.pos&&Math.hypot(s.x-c.domLock.pos.x,s.y-c.domLock.pos.y)>DOM_LOCK_SLACK)return c.domLock.pos;
  return null;}
// Işınlanma: yalnız sunucunun bildiği anlarda (sunucunun seçtiği doğma noktası, arena doğuşu, yönetici); başka her ani konum hız sayılır
export function tpAllowed(c,s,now){if(c.admin)return true;if(c.tpFree){c.tpFree=false;return true;}
  const t=c.tpTo;if(t&&now<t.until&&Math.hypot(s.x-t.x,s.y-t.y)<150){c.tpTo=null;return true;}
  if(c.sea===SIEGE_ROOM&&Math.hypot(s.x-3000,s.y-2850)<260)return true;return false;}
export function respawnPoint(c,rand=Math.random){const map=seaMap(c.sea);if(map&&MAPS[map]){const p=pickSpot(map,rand);return{x:p.x,y:p.y};}return null;}
// Korsan Öfkesi barı sunucuda: yalnız doğrulanmış oyuncu batırma (+34) ve boss payı (+50) doldurur; dolu bar 2 salvo %25 verir
export function rageGain(c,n){if(!c)return;c.rage=Math.min(RAGE_MAX,(c.rage||0)+n);send(c,{t:'rage',d:{m:c.rage}});}
export function rageUse(c,want,now){if(!want)return false;if((c.rageLeft||0)>0&&now<(c.rageUntil||0)){c.rageLeft--;return true;}
  if((c.rage||0)>=RAGE_MAX){c.rage=0;c.rageLeft=RAGE_SALVOS-1;c.rageUntil=now+RAGE_SECONDS*1000+500;send(c,{t:'rage',d:{m:0}});return true;}
  suspect(c,'öfke','bar dolmadan');return false;}
export function domPump(now){if(domPending||domQueue.length<DOM_SIZE*2)return false;const list=domQueue.splice(0,DOM_SIZE*2);
  const t=domBalance(list,x=>Number(x.econ?.ep)||0);domPending={list,r:t.r,b:t.b,at:now+DOM_COUNTDOWN_MS};return true;}
export function domDrop(c){const i=domQueue.indexOf(c);if(i>=0)domQueue.splice(i,1);
  if(domPending?.list.includes(c)){domQueue.unshift(...domPending.list.filter(x=>x!==c&&all.has(x)));domPending=null;}}
export function domStart(now,pend=domPending){const id=crypto.randomUUID().replace(/-/g,'').slice(0,10),teams=new Map();
  for(const x of pend.r)teams.set(x.uid,'r');for(const x of pend.b)teams.set(x.uid,'b');
  const m={id,teams,nicks:{r:pend.r.map(domNick),b:pend.b.map(domNick)},score:{r:0,b:0},zone:{cap:0,own:null},start:now,end:now+DOM_MATCH_MS,spent:new Map(),result:null};
  domMatches.set(id,m);if(pend===domPending)domPending=null;
  for(const x of pend.list){x.domTeam=teams.get(x.uid);x.domLock=null;pvpReset(x);send(x,{t:'dom',d:{k:'start',id,team:x.domTeam,end:m.end,teams:m.nicks}});}
  log('HAKİMİYET BAŞLADI',id,m.nicks.r.join(','),'vs',m.nicks.b.join(','));return m;}
export function domStep(m,room,now){let nr=0,nb=0;
  for(const x of room||[]){const tm=m.teams.get(x.uid);if(!tm||!x.last||(x.state&&!(x.state.hp>0)))continue;if(Math.hypot(x.last.x-DOM_ZONE.x,x.last.y-DOM_ZONE.y)<=DOM_ZONE.r){if(tm==='r')nr++;else nb++;}}
  const {contested}=domZoneStep(m.zone,nr,nb);if(m.zone.own&&!contested)m.score[m.zone.own]=Math.min(DOM_WIN,m.score[m.zone.own]+1);
  const done=m.score.r>=DOM_WIN||m.score.b>=DOM_WIN||now>=m.end;return{nr,nb,contested,done};}
export function domFinish(m,room){m.result={win:domWinner(m.score)};const out=[];
  for(const x of room||[]){const tm=m.teams.get(x.uid);if(!tm)continue;const add=domReward(tm,m.result.win,m.spent.get(x.uid)||0);
    addCredit(x,{pearls:add.pearls,ep:add.ep});out.push([x,tm,add]);}
  for(const x of all)if(m.teams.has(x.uid))x.domTeam=null;return out;}
function domTick(now){
  if(domPending){if(domPending.list.some(x=>!all.has(x)||!x.uid)){for(const x of domPending.list.filter(y=>!all.has(y)))domDrop(x);domBroadcast(now);}
    else if(now>=domPending.at){domStart(now);domBroadcast(now);}}
  for(const [id,m] of domMatches){const room=seas.get(`sea-dom-${id}`);
    if(m.result){if(now-m.end>60_000||!room?.size)domMatches.delete(id);continue;}
    const r=domStep(m,room,now);const tick=JSON.stringify({t:'dom',d:{k:'tick',s:[m.score.r,m.score.b],cap:m.zone.cap,own:m.zone.own,c:r.contested,n:[r.nr,r.nb],end:m.end}});
    for(const x of room||[])send(x,tick);
    if(r.done){const paid=domFinish(m,room);m.end=now;log('HAKİMİYET BİTTİ',id,m.score.r,m.score.b,m.result.win??'berabere');
      for(const [x,tm,add] of paid){send(x,{t:'dom',d:{k:'end',win:m.result.win,s:[m.score.r,m.score.b],team:tm,pearls:add.pearls,ep:add.ep}});void flushCredit(x);}}}}
function onDom(c,d,now){const k=String(d?.k||'');
  if(k==='watch'){c.domWatch=!!d?.on;send(c,{t:'dom',d:domLobby(c,now)});return;}
  if(k==='q'){if(d?.on){if(!domOpen(c,now)){send(c,{t:'dom',d:{k:'err',msg:'Deniz Hakimiyeti şu an kapalı'}});return;}if(domInMatch(c)||lsInMatch(c)){send(c,{t:'dom',d:{k:'err',msg:'Zaten bir maçtasın'}});return;}lsDrop(c);
      if(!domQueue.includes(c)&&!domPending?.list.includes(c))domQueue.push(c);domPump(now);}
    else domDrop(c);domBroadcast(now);return;}
  if(k==='leave'){const id=domMatchOfSea(c.sea);const m=domMatches.get(id);if(m&&!m.result){m.teams.delete(c.uid);c.domTeam=null;}return;}}
setInterval(()=>domTick(Date.now()),1000).unref();

// ---------------------------------------------------------------- Sohbet cezaları (Oyun Kuralları)
// Yönetici sohbette: /sustur <kaptan adı> <süre>  (süre: 30d, 12s, 2g · dakika/saat/gün)  ·  /konustur <kaptan adı>
// Susturma kaptan adına bağlıdır, sunucu yeniden başlasa da sürer (MUTE_FILE).
const MUTE_FILE=process.env.MUTE_FILE||'/opt/game/mutes.json';export const mutes=new Map();
try{for(const [k,v] of JSON.parse(fs.readFileSync(MUTE_FILE,'utf8')))mutes.set(k,v);}catch{}
const saveMutes=()=>{if(process.env.NODE_ENV==='test')return;try{fs.writeFileSync(MUTE_FILE,JSON.stringify([...mutes].filter(([,v])=>v>Date.now())));}catch{}};
const muteKey=n=>String(n||'').trim().toLocaleLowerCase('tr');
export const muteLeft=(nick,now=Date.now())=>Math.max(0,(mutes.get(muteKey(nick))??0)-now);
export function parseDuration(s){const m=/^(\d+)\s*(d|dk|dakika|s|sa|saat|g|gün|gun)?$/i.exec(String(s||'').trim());if(!m)return 0;const n=Number(m[1]),u=(m[2]||'d').toLocaleLowerCase('tr');
  return n*(u.startsWith('g')?86_400_000:u==='s'||u.startsWith('sa')?3_600_000:60_000);}
export function adminChatCommand(text,now=Date.now()){const p=text.trim().split(/\s+/);const cmd=p[0].toLocaleLowerCase('tr');
  if(cmd==='/sustur'){const ms=parseDuration(p.slice(2).join(''));if(!p[1]||!ms)return'Kullanım: /sustur <kaptan adı> <süre>  ör. /sustur Ahmet 30d · 12s · 2g';
    mutes.set(muteKey(p[1]),now+ms);saveMutes();const t=[...all].find(x=>muteKey(x.nick)===muteKey(p[1]));if(t)send(t,{t:'muted',d:{left:ms}});log('SUSTURMA',p[1],Math.round(ms/60000),'dk');return`${p[1]} ${Math.round(ms/60000)} dakika susturuldu`;}
  if(cmd==='/konustur'){if(!p[1])return'Kullanım: /konustur <kaptan adı>';const had=mutes.delete(muteKey(p[1]));saveMutes();return had?`${p[1]} artık yazabilir`:`${p[1]} susturulmamış`;}
  return null;}

// ---------------------------------------------------------------- Lanetli Sular: Hayatta Kalma (src/cursed.ts)
// 10 kaptan dolunca 15 sn sayılır; herkes eşit gemiyle (LS_LOADOUT, LS_HP, bedava demir gülle) halkadaki yerinde doğar.
// Sis, can, atış hasarı, eleme sırası ve ödül sunucuda. Batan elenir (yeniden doğma yok); son kalan 1. olur.
const LS_TRIAL=process.env.LS_TRIAL==='1';
export const lsQueue=[];export const lsMatches=new Map();export let lsPending=null;
export const lsMatchOfSea=sea=>/^sea-ls-([a-z0-9]+)$/.exec(sea||'')?.[1];
export const lsOpen=(c,now)=>domWindowAt(now).open||LS_TRIAL||!!c?.admin;
const lsInMatch=c=>[...lsMatches.values()].some(m=>!m.result&&m.players.get(c.uid)?.alive);
export function lsLobby(c,now=Date.now()){const p=lsPending;return{k:'lobby',open:lsOpen(c,now),q:(p?p.list:lsQueue.slice(0,LS_SIZE)).map(domNick),me:lsQueue.includes(c)||!!p?.list.includes(c),at:p?p.at:0,live:lsMatches.size};}
function lsBroadcast(now){const to=new Set([...all].filter(x=>x.lsWatch));for(const x of lsQueue)to.add(x);for(const x of lsPending?.list??[])to.add(x);for(const x of to)send(x,{t:'ls',d:lsLobby(x,now)});}
export function lsPump(now){if(lsPending||lsQueue.length<LS_SIZE)return false;lsPending={list:lsQueue.splice(0,LS_SIZE),at:now+LS_COUNTDOWN_MS};return true;}
export function lsDrop(c){const i=lsQueue.indexOf(c);if(i>=0)lsQueue.splice(i,1);
  if(lsPending?.list.includes(c)){lsQueue.unshift(...lsPending.list.filter(x=>x!==c&&all.has(x)));lsPending=null;}}
const lsFogInfo=m=>({from:m.fog.from,to:m.fog.to,at:m.fog.at,phase:m.fog.phase,now:Date.now()});
export function lsStart(now,pend=lsPending,rand=Math.random){const id=crypto.randomUUID().replace(/-/g,'').slice(0,10),players=new Map();
  const order=[...pend.list].sort(()=>rand()-.5);order.forEach((x,i)=>players.set(x.uid,{nick:domNick(x),alive:true,kills:0,balls:0,rank:0,spawn:lsSpawn(i,order.length),inv:lsEmptyInv()}));
  const z={x:3000,y:2000,r:LS_START_R};const m={id,players,fog:{from:z,to:z,at:now,phase:0},start:now,end:now+LS_MATCH_MS,result:null,items:[],seq:0,itemAt:now,drops:[],dropNext:now+LS_DROP_FIRST_MS};lsMatches.set(id,m);for(let i=0;i<LS_ITEM_MAX;i++)lsAddItem(m,now,rand);if(pend===lsPending)lsPending=null;
  for(const x of order){const p=players.get(x.uid);x.lsOn=true;x.lsMatch=id;x.lsSpawned=false;x.maxHp=LS_HP;pvpReset(x);if(x.pvp)x.pvp.hp=LS_HP;else{x.pvp={budget:null,heal:null,hp:LS_HP,at:now,from:new Map()};}
    send(x,{t:'ls',d:{k:'start',id,spawn:p.spawn,n:order.length,end:m.end,fog:lsFogInfo(m),items:m.items,drops:m.drops}});}
  log('LANETLİ SULAR BAŞLADI',id,order.length);return m;}
// Doğuş yalnızca kendi başlangıç noktasında (300 birim içinde); sonrası normal hız denetimi
export function lsMove(c,s){const m=lsMatches.get(c.lsMatch),p=m?.players.get(c.uid);if(!p||!num(s?.x)||!num(s?.y))return null;
  if(!c.lsSpawned){if(Math.hypot(s.x-p.spawn.x,s.y-p.spawn.y)>300)return p.spawn;c.lsSpawned=true;s.tp=1;c.tpFree=true;return null;}delete s.tp;return null;}
const lsAlive=m=>[...m.players.values()].filter(p=>p.alive).length;
// Eleme: sıra = elenmeden önce hayatta kalan sayısı. Ödül hemen yazılır (ayrılan ödül almaz).
export function lsOut(c,killer,now,left=false){const m=lsMatches.get(c.lsMatch),p=m?.players.get(c.uid);if(!m||!p?.alive||m.result)return null;
  p.alive=false;p.rank=lsAlive(m)+1;c.lsOn=false;pvpReset(c);if(c.netId&&lsMatchOfSea(c.sea)===m.id)toSea(c,{t:'leave',id:c.netId});
  const k=killer&&killer!==c&&killer.lsOn?m.players.get(killer.uid):null;if(k)k.kills++;
  const add=lsReward(p.rank,p.kills,p.balls);if(!left){addCredit(c,add);send(c,{t:'ls',d:{k:'out',rank:p.rank,n:m.players.size,kills:p.kills,...add}});void flushCredit(c);}
  const room=seas.get(`sea-ls-${m.id}`);const msg=JSON.stringify({t:'ls',d:{k:'alive',n:lsAlive(m),out:p.nick,by:k?.nick??null}});for(const x of room||[])send(x,msg);
  if(lsAlive(m)<=1)lsFinish(m,now,[...all,c,...(killer?[killer]:[])]);return{rank:p.rank,add};}
export function lsFinish(m,now,clients=[...all]){if(m.result)return;
  // Kalanlar sunucudaki canlarına göre sıralanır (tek kalan 1. olur); bağlı olmayan kalan sıralanır ama ödül alamaz
  const alive=[...m.players].filter(([,p])=>p.alive).map(([uid,p])=>({uid,p,x:clients.find(y=>y.uid===uid&&y.lsMatch===m.id)})).sort((a,b)=>(b.x?.pvp?.hp??-1)-(a.x?.pvp?.hp??-1));
  alive.forEach(({p,x},i)=>{p.alive=false;p.rank=i+1;if(!x)return;x.lsOn=false;const add=lsReward(p.rank,p.kills,p.balls);addCredit(x,add);send(x,{t:'ls',d:{k:'out',rank:p.rank,n:m.players.size,kills:p.kills,win:p.rank===1,...add}});void flushCredit(x);});

  for(const p of m.players.values())p.alive=false;m.result={at:now};m.end=now;log('LANETLİ SULAR BİTTİ',m.id,alive[0]?.p.nick??'-');}
// Atış: seçilen özel gülle envanterden topların sayısı kadar düşer, kalan toplar demir atar; barut varsa salvo başına 1 harcanır.
// Hedefin kalkanı varsa isabet başına 1 kalkan harcanır ve gelen hasar azalır. Hepsi sunucudaki maç envanterinden.
export const LS_AMMO=['iron','chain','fire','explosive'];
export function lsAttack(c,t,now,d={}){const m=lsMatches.get(c.lsMatch),me=m?.players.get(c.uid),tp=m?.players.get(t.uid);if(!me?.alive||!tp?.alive)return null;
  const a=LS_AMMO.includes(String(d?.a))?String(d.a):'iron';
  const why=shotCheck(c,LS_LOADOUT,a,Math.hypot(c.last.x-t.last.x,c.last.y-t.last.y),now,false);if(why){if(why!=='dolum')suspect(c,'atış',why);return null;}
  const cap=LS_LOADOUT.cannons,loaded=a==='iron'?0:Math.min(cap,me.inv[a]);if(loaded)me.inv[a]-=loaded;const ammo=loaded?a:'iron';
  const powder=!!d?.p&&me.inv.powder>0;if(powder)me.inv.powder--;
  me.balls+=cap;let raw=salvoDamage(LS_LOADOUT,ammo,loaded,cap-loaded,powder,false)*targetFactor(ammo,'player');
  if(tp.inv.shield>0){tp.inv.shield--;raw*=CONSUMABLES.shield.factor;send(t,{t:'ls',d:{k:'inv',inv:tp.inv}});}
  if(loaded||powder)send(c,{t:'ls',d:{k:'inv',inv:me.inv}});
  const f={from:c.netId,to:t.netId,x:Math.round(c.last.x),y:Math.round(c.last.y),tx:Math.round(t.last.x),ty:Math.round(t.last.y),ammo,damage:pvpGuard(t,raw,now)};pvpOf(t).from.set(c.netId,now);
  toNear(c,{t:'fire',d:f},t.netId);
  if(godCheck(t)){suspect(t,'ölümsüz');send(t,{t:'forceSink',d:{by:c.netId,byNick:c.nick}});toSea(t,{t:'sunk',d:{victim:t.netId,victimNick:t.nick,by:c.netId,byNick:c.nick}});lsOut(t,c,now);}
  return f;}
// Denizdeki eşyalar: güvenli alanın içinde rastgele yerde belirir, toplanınca LS_ITEM_RESPAWN_MS'de bir yenisi gelir (en çok LS_ITEM_MAX)
export function lsAddItem(m,now,rand=Math.random){const z=lsZoneAt(m.fog,now),r=Math.max(0,z.r*.85),a=rand()*Math.PI*2,d=Math.sqrt(rand())*r;
  const x=Math.round(Math.max(120,Math.min(5880,z.x+Math.cos(a)*d))),y=Math.round(Math.max(120,Math.min(3880,z.y+Math.sin(a)*d)));m.items.push([++m.seq,lsPickKind(rand),x,y]);}
export function lsPick(c,id,now){const m=lsMatches.get(c.lsMatch),p=m?.players.get(c.uid);if(!p?.alive||!c.last)return{err:'yok'};
  const i=m.items.findIndex(x=>x[0]===Number(id));if(i<0)return{err:'yok'};const it=m.items[i];
  if(Math.hypot(c.last.x-it[2],c.last.y-it[3])>LS_PICK_R+90)return{err:'uzak'};
  m.items.splice(i,1);p.inv[it[1]]+=LS_ITEMS[it[1]].qty;return{kind:it[1],inv:p.inv};}
export function lsDropPick(c,id,now){const m=lsMatches.get(c.lsMatch),p=m?.players.get(c.uid);if(!p?.alive||!c.last)return{err:'yok'};
  const i=m.drops.findIndex(x=>x.id===Number(id));if(i<0)return{err:'yok'};const dr=m.drops[i];if(now<dr.land)return{err:'erken'};
  if(Math.hypot(c.last.x-dr.x,c.last.y-dr.y)>LS_DROP_PICK_R+90)return{err:'uzak'};
  m.drops.splice(i,1);for(const [k,v] of Object.entries(LS_DROP_LOOT))p.inv[k]+=v;return{inv:p.inv,nick:p.nick};}
export function lsSpeed(c,now){const p=lsMatches.get(c.lsMatch)?.players.get(c.uid);if(!p?.alive||p.inv.speed<=0)return null;p.inv.speed--;c.lsSpeedUntil=now+LS_SPEED_MS;return p.inv;}
// Sis: her LS_PHASE_MS'de yeni güvenli alan; dışarıdaki gemi saniyede tam canın LS_FOG_DPS payını kaybeder (sunucu canından düşülür)
export function lsStep(m,room,now,rand=Math.random){let changed=false;
  if(m.fog.phase<LS_RADII.length&&now>=m.start+(m.fog.phase+1)*LS_PHASE_MS){const cur=lsZoneAt(m.fog,now);m.fog={from:cur,to:lsNext(cur,LS_RADII[m.fog.phase],rand),at:now,phase:m.fog.phase+1};changed=true;}
  let drop=null;if(now>=m.dropNext){m.dropNext+=LS_DROP_EVERY_MS;const t=m.fog.to,r=Math.max(0,t.r*.7),a=rand()*Math.PI*2,d=Math.sqrt(rand())*r;
    drop={id:++m.seq,x:Math.round(Math.max(150,Math.min(5850,t.x+Math.cos(a)*d))),y:Math.round(Math.max(150,Math.min(3850,t.y+Math.sin(a)*d))),land:now+LS_DROP_FALL_MS};m.drops.push(drop);}
  let items=false;if(now-m.itemAt>=LS_ITEM_RESPAWN_MS){m.itemAt=now;if(m.items.length<LS_ITEM_MAX){lsAddItem(m,now,rand);items=true;}}
  const z=lsZoneAt(m.fog,now),hits=[];
  for(const x of room||[]){if(!x.lsOn||x.lsMatch!==m.id||!x.last)continue;if(Math.hypot(x.last.x-z.x,x.last.y-z.y)<=z.r)continue;
    const dmg=Math.round(LS_HP*LS_FOG_DPS[Math.min(m.fog.phase,LS_FOG_DPS.length-1)]);const p=pvpOf(x);if(p.hp===null)p.hp=LS_HP;p.hp-=dmg;hits.push([x,dmg,p.hp<=0]);}
  return{changed,hits,items,drop};}
function lsTick(now){
  if(lsPending){if(lsPending.list.some(x=>!all.has(x)||!x.uid)){for(const x of lsPending.list.filter(y=>!all.has(y)))lsDrop(x);lsBroadcast(now);}
    else if(now>=lsPending.at){lsStart(now);lsBroadcast(now);}}
  for(const [id,m] of lsMatches){const room=seas.get(`sea-ls-${id}`);
    if(m.result){if(now-m.end>60_000||!room?.size)lsMatches.delete(id);continue;}
    // Maçtan kopan ya da odadan çıkan elenir (ödülsüz)
    for(const [uid,p] of m.players){if(!p.alive)continue;const x=[...all].find(y=>y.uid===uid);if(!x||(now-m.start>20_000&&x.sea!==`sea-ls-${id}`)){if(x)lsOut(x,null,now,true);else{p.alive=false;p.rank=lsAlive(m)+1;}}}
    if(m.result)continue;if(lsAlive(m)<=1){lsFinish(m,now);continue;}
    const r=lsStep(m,room,now);if(r.drop){const msg=JSON.stringify({t:'ls',d:{k:'drops',drops:m.drops,fresh:r.drop.id}});for(const x of room||[])send(x,msg);}if(r.items){const msg=JSON.stringify({t:'ls',d:{k:'items',items:m.items}});for(const x of room||[])send(x,msg);}if(r.changed){const msg=JSON.stringify({t:'ls',d:{k:'fog',fog:lsFogInfo(m),n:lsAlive(m)}});for(const x of room||[])send(x,msg);}
    for(const [x,dmg,dead] of r.hits){send(x,{t:'ls',d:{k:'burn',dmg}});if(dead){send(x,{t:'forceSink',d:{by:'',byNick:'Lanetli Sis'}});toSea(x,{t:'sunk',d:{victim:x.netId,victimNick:x.nick,by:null,byNick:'Lanetli Sis'}});lsOut(x,null,now);}}
    if(now>=m.end)lsFinish(m,now);}}
function onLs(c,d,now){const k=String(d?.k||'');
  if(k==='watch'){c.lsWatch=!!d?.on;send(c,{t:'ls',d:lsLobby(c,now)});return;}
  if(k==='q'){if(d?.on){if(!lsOpen(c,now)){send(c,{t:'ls',d:{k:'err',msg:'Lanetli Sular şu an kapalı'}});return;}if(lsInMatch(c)||domInMatch(c)){send(c,{t:'ls',d:{k:'err',msg:'Zaten bir maçtasın'}});return;}domDrop(c);
      if(!lsQueue.includes(c)&&!lsPending?.list.includes(c))lsQueue.push(c);lsPump(now);}
    else lsDrop(c);lsBroadcast(now);return;}
  if(k==='leave'){if(c.lsOn)lsOut(c,null,now,true);return;}
  if(k==='pick'){const r=lsPick(c,d?.id,now);if(r.err){if(r.err==='uzak')suspect(c,'uzak eşya');return;}send(c,{t:'ls',d:{k:'inv',inv:r.inv,got:r.kind}});
    const m=lsMatches.get(c.lsMatch);const msg=JSON.stringify({t:'ls',d:{k:'items',items:m.items}});for(const x of seas.get(`sea-ls-${m.id}`)||[])send(x,msg);return;}
  if(k==='dpick'){const r=lsDropPick(c,d?.id,now);if(r.err){if(r.err==='uzak')suspect(c,'uzak sandık');return;}send(c,{t:'ls',d:{k:'inv',inv:r.inv,drop:1}});
    const m=lsMatches.get(c.lsMatch);const msg=JSON.stringify({t:'ls',d:{k:'drops',drops:m.drops,by:r.nick}});for(const x of seas.get(`sea-ls-${m.id}`)||[])send(x,msg);return;}
  if(k==='speed'){const inv=lsSpeed(c,now);if(inv)send(c,{t:'ls',d:{k:'inv',inv,speed:1}});return;}}
setInterval(()=>lsTick(Date.now()),1000).unref();



// ---------------------------------------------------------------- Arkadaşlar, özel mesaj ve grup (src/social.ts, 033_social.sql)
// Arkadaşlık karşılıklı onaylıdır ve veritabanında durur; çevrim içi arkadaşın denizi ve koordinatı sunucudan gelir.
// Özel mesaj yalnız arkadaşlar arasında, saklanmaz. Küfürde mesaj gitmez: 1. kez 24 saat susturma, 2. kez 7 gün, 3. kez kalıcı ban.
async function rpcTry(fn,args){if(!SERVER_SECRET)return{err:'Sunucu hazır değil'};
  try{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`,'content-type':'application/json'},body:JSON.stringify({p_secret:SERVER_SECRET,...args})});
    const j=await r.json().catch(()=>null);if(!r.ok)return{err:String(j?.message||'İşlem yapılamadı').replace(/^.*?: /,'')};return{data:j};}catch{return{err:'Bağlantı hatası'};}}
export const friendSets=new Map(),strikesMem=new Map();
const onlineByUid=uid=>{for(const x of all)if(x.uid===uid)return x;return null;};
export const whereOf=x=>!x?.sea?'Limanda':x.domTeam?'Deniz Hakimiyeti':x.lsOn?'Lanetli Sular':x.sea===SIEGE_ROOM?'Büyük Kuşatma':seaMap(x.sea)?`${seaMap(x.sea)}${x.last?` · ${coordLabel(x.last)}`:''}`:'Denizde';
async function loadFriends(c){const r=await rpcTry('friend_list',{p_uid:c.uid});if(Array.isArray(r.data)){c.friends=r.data;c.frAt=Date.now();friendSets.set(c.uid,new Set(r.data.filter(f=>f.ok).map(f=>f.id)));}return c.friends??[];}
export const friendView=c=>(c.friends??[]).map(f=>{const o=f.ok?onlineByUid(f.id):null;return{id:f.id,nick:f.nick,ok:!!f.ok,in:!!f.in,on:!!o,at:o?whereOf(o):''};});
// Arkadaş girince/çıkınca çevrim içi arkadaşlarının listesi tazelenir
function friendPing(c){for(const id of friendSets.get(c.uid)??[]){const o=onlineByUid(id);if(o)send(o,{t:'fr',d:{k:'list',list:friendView(o)}});}}
async function onFriend(c,d,now){const k=String(d.k||''),done=async(err)=>{await loadFriends(c);send(c,{t:'fr',d:{k:'list',list:friendView(c),err}});};
  if(k==='list'){if(!c.friends||now-(c.frAt||0)>15_000)await loadFriends(c);send(c,{t:'fr',d:{k:'list',list:friendView(c)}});return;}
  if(k==='add'){const nick=String(d.nick||'').trim().slice(0,24);if(!nick)return;const r=await rpcTry('friend_request',{p_uid:c.uid,p_nick:nick});if(r.err){await done(r.err);return;}
    await done();const t=onlineByUid(r.data.id);if(t){await loadFriends(t);send(t,{t:'fr',d:{k:'list',list:friendView(t),note:r.data.ok?`${c.nick} ile artık arkadaşsınız`:`${c.nick} sana arkadaşlık isteği gönderdi`}});}return;}
  if(k==='ans'||k==='del'){const id=String(d.id||'');if(!/^[0-9a-f-]{36}$/.test(id))return;const r=k==='ans'?await rpcTry('friend_answer',{p_uid:c.uid,p_from:id,p_ok:!!d.ok}):await rpcTry('friend_remove',{p_uid:c.uid,p_other:id});
    await done(r.err);const t=onlineByUid(id);if(t){await loadFriends(t);send(t,{t:'fr',d:{k:'list',list:friendView(t)}});}}}
async function onPm(c,d,now){const to=String(d.to||''),text=String(d.text||'').trim().slice(0,LIMITS.chatLen);if(!text)return;
  if(!friendSets.get(c.uid)?.has(to)){send(c,{t:'pm',d:{k:'err',msg:'Yalnız arkadaşlarına mesaj atabilirsin'}});return;}
  const mu=muteLeft(c.nick,now);if(mu>0){send(c,{t:'muted',d:{left:mu}});return;}
  if(chatHasBad(text)){await pmStrike(c,now);return;}
  const t=onlineByUid(to);if(!t){send(c,{t:'pm',d:{k:'err',msg:'Arkadaşın çevrim dışı'}});return;}
  const msg={k:'msg',from:c.uid,nick:c.nick,to,text,at:now};send(t,{t:'pm',d:msg});send(c,{t:'pm',d:{...msg,mine:true,tn:t.nick}});}
// Mesaj kutusu (034_mail.sql): arkadaşa konu + metin; alıcı çevrim dışıyken de kutusunda kalır. Küfür kuralları özel mesajla aynı.
async function onMail(c,d,now){const k=String(d.k||''),box=d.box==='out'?'out':'in',list=async(b,err,note)=>{const r=await rpcTry('mail_box',{p_uid:c.uid,p_box:b});send(c,{t:'mail',d:{k:'box',box:b,list:r.data?.list??[],unread:r.data?.unread??0,err:err||r.err,note}});};
  if(k==='box'){await list(box);return;}
  if(k==='read'){const id=Number(d.id);if(Number.isSafeInteger(id))await rpcTry('mail_read',{p_uid:c.uid,p_id:id});await list('in');return;}
  if(k==='del'){const id=d.id==null?null:Number(d.id);if(id!==null&&!Number.isSafeInteger(id))return;await rpcTry('mail_delete',{p_uid:c.uid,p_box:box,p_id:id});await list(box);return;}
  if(k==='send'){const to=String(d.to||''),subject=String(d.subject||'').trim().slice(0,60),body=String(d.body||'').trim().slice(0,500);if(!/^[0-9a-f-]{36}$/.test(to)||!body)return;
    const mu=muteLeft(c.nick,now);if(mu>0){send(c,{t:'muted',d:{left:mu}});return;}
    if(chatHasBad(subject+' '+body)){await pmStrike(c,now);return;}
    const r=await rpcTry('mail_send',{p_uid:c.uid,p_to:to,p_subject:subject,p_body:body});if(r.err){send(c,{t:'mail',d:{k:'err',msg:r.err}});return;}
    await list('out',null,'Mektup gönderildi');const t=onlineByUid(to);if(!t)return;const q=await rpcTry('mail_box',{p_uid:t.uid,p_box:'in'});send(t,{t:'mail',d:{k:'new',from:c.nick,unread:q.data?.unread??0}});}}
export async function pmStrike(c,now){const r=await rpcTry('chat_strike',{p_uid:c.uid});const n=typeof r.data==='number'?r.data:(strikesMem.get(c.uid)||0)+1;strikesMem.set(c.uid,n);log('KÜFÜR CEZASI',c.nick,n);
  if(n<=1){mutes.set(muteKey(c.nick),now+24*3600_000);saveMutes();send(c,{t:'pm',d:{k:'err',msg:'Mesajında küfür var, gönderilmedi. 24 saat sohbet ve özel mesaj yazamazsın. Tekrarlanırsa hesabın kapatılır.'}});send(c,{t:'muted',d:{left:24*3600_000}});return n;}
  send(c,{t:'pm',d:{k:'err',msg:n===2?'Küfür nedeniyle hesabın 7 gün kapatıldı.':'Küfür nedeniyle hesabın kalıcı olarak kapatıldı.'}});setTimeout(()=>c.ws?.close?.(4002,'hesap kapalı'),300);return n;}
// Grup: en çok 4 kaptan. Aynı denizdeki grup üyesi sayısına göre ek TP: 2 kişi %15, 3 kişi %10, 4 kişi %5.
export const groups=new Map(),groupInvites=new Map();let groupSeq=0;
export function groupBonus(c){const g=c?.grp?groups.get(c.grp):null;if(!g||!c.sea)return 1;let n=0;for(const x of g.members)if(x.sea===c.sea)n++;return groupMult(n);}
const groupView=g=>({id:g.id,lead:g.lead.uid,members:[...g.members].map(x=>({uid:x.uid,nick:x.nick,at:whereOf(x)}))});
function groupCast(g){const v=groupView(g);for(const x of g.members)send(x,{t:'grp',d:{k:'state',...v,bonus:Math.round((groupBonus(x)-1)*100)}});}
export function groupLeave(c){const g=c.grp?groups.get(c.grp):null;c.grp=null;if(!g)return;g.members.delete(c);send(c,{t:'grp',d:{k:'state',id:null}});
  if(g.members.size<2){for(const x of g.members){x.grp=null;send(x,{t:'grp',d:{k:'state',id:null,note:'Grup dağıldı'}});}groups.delete(g.id);return;}
  if(g.lead===c)g.lead=[...g.members][0];groupCast(g);}
export function onGroup(c,d,now){const k=String(d.k||''),err=msg=>send(c,{t:'grp',d:{k:'err',msg}});
  if(k==='inv'){const nick=String(d.nick||'').trim().toLocaleLowerCase('tr');const t=[...all].find(x=>x.uid&&x.nick?.toLocaleLowerCase('tr')===nick);
    if(!t)return err('Kaptan çevrim içi değil');if(t===c)return err('Kendini davet edemezsin');if(!friendSets.get(c.uid)?.has(t.uid))return err('Gruba yalnız arkadaşlarını davet edebilirsin');if(t.grp)return err(`${t.nick} zaten bir grupta`);
    let g=c.grp?groups.get(c.grp):null;if(g&&g.lead!==c)return err('Davet yalnız grup lideri yapabilir');if(g&&g.members.size>=GROUP_MAX)return err(`Grup dolu (${GROUP_MAX} kişi)`);
    if(!g){g={id:`g${++groupSeq}`,lead:c,members:new Set([c])};groups.set(g.id,g);c.grp=g.id;}
    groupInvites.set(t.uid,{gid:g.id,at:now});send(t,{t:'grp',d:{k:'inv',from:c.nick,gid:g.id}});groupCast(g);send(c,{t:'grp',d:{k:'note',msg:`${t.nick} gruba davet edildi`}});return;}
  if(k==='yes'){const inv=groupInvites.get(c.uid);groupInvites.delete(c.uid);const g=inv&&now-inv.at<60_000?groups.get(inv.gid):null;if(!g)return err('Davetin süresi doldu');
    if(g.members.size>=GROUP_MAX)return err('Grup dolu');if(c.grp)groupLeave(c);g.members.add(c);c.grp=g.id;groupCast(g);return;}
  if(k==='no'){const inv=groupInvites.get(c.uid);groupInvites.delete(c.uid);const g=inv?groups.get(inv.gid):null;if(g)send(g.lead,{t:'grp',d:{k:'note',msg:`${c.nick} daveti reddetti`}});return;}
  if(k==='leave'){groupLeave(c);return;}
  if(k==='kick'){const g=c.grp?groups.get(c.grp):null;if(!g||g.lead!==c)return;const t=[...g.members].find(x=>x.uid===String(d.uid));if(t&&t!==c){groupLeave(t);send(t,{t:'grp',d:{k:'note',msg:'Gruptan çıkarıldın'}});}}}
setInterval(()=>{for(const g of groups.values())groupCast(g);},5000).unref();

// ---------------------------------------------------------------- Açık deniz düellosu (src/duel.ts)
// Savaşa kapalı denizlerde iki kaptan anlaşınca yalnız birbirleriyle savaşır. Bahis (500 inci) düello başında iki taraftan
// veritabanında kilitlenir (032_duel.sql); kazanan toplamın %90'ını alır. Hak sayıları dosyada saklanır.
const DUEL_FILE=process.env.DUEL_FILE||'/opt/game/duels.json';
export const duels=new Map(),duelInvites=new Map(); // düello kimliği → düello; davet edilen netId → {from, bet, at}
export let duelCounts={};let duelSeq=0,duelCountsDirty=false;
try{if(process.env.NODE_ENV!=='test')duelCounts=JSON.parse(fs.readFileSync(DUEL_FILE,'utf8'));}catch{}
setInterval(()=>{if(!duelCountsDirty||process.env.NODE_ENV==='test')return;duelCountsDirty=false;try{fs.writeFileSync(DUEL_FILE+'.tmp',JSON.stringify(duelCounts));fs.renameSync(DUEL_FILE+'.tmp',DUEL_FILE);}catch{}},30_000).unref();
export const duelInfo=d=>({id:d.id,a:d.a.netId,b:d.b.netId,an:d.a.nick,bn:d.b.nick,x:Math.round(d.x),y:Math.round(d.y),r:DUEL_R,end:d.end,bet:d.bet});
const duelErr=(c,msg)=>send(c,{t:'duel',d:{k:'err',msg}});
// Teklif ve kabulde aynı denetimler: savaşa kapalı deniz, aynı deniz, yakın, ikisi de boşta; bahisliyse seviye farkı ve hak
export function duelCheck(a,b,bet,now=Date.now()){if(!a.uid||!b?.uid||a===b)return'Rakip bulunamadı';
  if(!DUEL_MAPS.includes(seaMap(a.sea))||a.sea!==b.sea)return'Düello yalnız savaşa kapalı denizlerde (1/1, 1/2) yapılır';
  if(a.duel||b.duel)return'Kaptanlardan biri zaten düelloda';if(a.domTeam||b.domTeam||a.lsOn||b.lsOn)return'Kaptan arenada';
  if(!a.last||!b.last||Math.hypot(a.last.x-b.last.x,a.last.y-b.last.y)>DUEL_NEAR)return'Rakibe daha çok yaklaş';
  if(!DUEL_BETS.includes(bet))return'Geçersiz bahis';
  if(bet){if(Math.abs((Number(a.econ?.level)||1)-(Number(b.econ?.level)||1))>DUEL_LEVEL_GAP)return`Bahisli düelloda seviye farkı en çok ${DUEL_LEVEL_GAP} olabilir`;
    const d=new Date(now);if(!duelLeft(duelCounts[a.uid],d))return'Bahisli düello hakkın bitti (günde 1, haftada 2)';if(!duelLeft(duelCounts[b.uid],d))return'Rakibin bahisli düello hakkı bitmiş';}
  return null;}
export async function onDuel(c,d,now){const k=String(d.k||'');
  if(k==='ask'){const t=[...(seas.get(c.sea)||[])].find(x=>x.netId===String(d.to));const bet=Number(d.bet)||0,why=duelCheck(c,t,bet,now);if(why){duelErr(c,why);return;}
    const old=duelInvites.get(t.netId);if(old&&now-old.at<DUEL_ASK_MS&&old.from!==c){duelErr(c,'Rakibin başka bir teklifi var');return;}
    duelInvites.set(t.netId,{from:c,bet,at:now});send(t,{t:'duel',d:{k:'ask',from:c.netId,nick:c.nick,level:Number(c.econ?.level)||1,bet,until:now+DUEL_ASK_MS}});send(c,{t:'duel',d:{k:'sent',to:t.netId,nick:t.nick,bet}});return;}
  if(k==='no'){const inv=duelInvites.get(c.netId);if(!inv)return;duelInvites.delete(c.netId);send(inv.from,{t:'duel',d:{k:'err',msg:`${c.nick} düelloyu reddetti`}});return;}
  if(k==='yes'){const inv=duelInvites.get(c.netId);duelInvites.delete(c.netId);if(!inv||now-inv.at>DUEL_ASK_MS||inv.from.netId!==String(d.from)){duelErr(c,'Teklifin süresi doldu');return;}
    const a=inv.from,why=duelCheck(a,c,inv.bet,now);if(why){duelErr(c,why);duelErr(a,why);return;}
    const id=`d${++duelSeq}`,stakes=[];
    if(inv.bet){a.duel=c.duel='lock';// kilit sürerken başka teklif kabul edilmez
      for(const x of [a,c]){const ev=crypto.randomUUID();const ok=SERVER_SECRET?await dbRpcJson('duel_stake',{p_uid:x.uid,p_event:ev,p_amount:inv.bet}).catch(()=>false):process.env.NODE_ENV==='test';if(ok===true){stakes.push(x);continue;}
        for(const y of stakes)grantUid(y.uid,{pearls:inv.bet});a.duel=c.duel=null;for(const y of [a,c])duelErr(y,y===x?'Bahis için yeterli incin yok':`${x.nick} bahsi karşılayamadı`);return;}
      for(const x of [a,c]){duelCounts[x.uid]=duelUse(duelCounts[x.uid],new Date(now));send(x,{t:'duel',d:{k:'stake',n:-inv.bet}});}duelCountsDirty=true;}
    const du={id,a,b:c,bet:inv.bet,sea:c.sea,x:(a.last.x+c.last.x)/2,y:(a.last.y+c.last.y)/2,end:now+DUEL_MS,dmg:new Map([[a,0],[c,0]])};duels.set(id,du);a.duel=c.duel=id;
    toSea(c,{t:'duel',d:{k:'start',...duelInfo(du)}},true);log('DÜELLO',a.nick,'vs',c.nick,inv.bet);return;}
  if(k==='quit'&&c.duel&&c.duel!=='lock')duelForfeit(c,'teslim oldu');}
export function duelHit(c,dmg){const d=duels.get(c.duel);if(d&&d.dmg.has(c))d.dmg.set(c,d.dmg.get(c)+Math.max(0,dmg));}
export function duelForfeit(c,why,now=Date.now()){const d=duels.get(c.duel);if(!d)return;duelFinish(d,d.a===c?d.b:d.a,why,now);}
// Bitiş: kazanan bahis toplamının %90'ını alır; berabere biterse iki tarafa bahis geri verilir
export function duelFinish(d,win,why,now=Date.now()){if(!duels.has(d.id))return;duels.delete(d.id);d.a.duel=d.b.duel=null;pvpReset(d.a);pvpReset(d.b);
  const lose=win?(win===d.a?d.b:d.a):null;
  if(d.bet){if(win)grantUid(win.uid,{pearls:duelPot(d.bet)});else for(const x of [d.a,d.b])grantUid(x.uid,{pearls:d.bet});}
  const out={k:'end',id:d.id,win:win?.netId??null,wn:win?.nick??null,ln:lose?.nick??null,why,bet:d.bet,pot:win?duelPot(d.bet):0};
  const room=seas.get(d.sea);if(room){const m=JSON.stringify({t:'duel',d:out});for(const x of room)send(x,m);}
  for(const x of [d.a,d.b])if(x.sea!==d.sea)send(x,{t:'duel',d:out});
  if(d.bet&&win){const msg=JSON.stringify({t:'chat',d:{nick:'Düello',tag:null,adm:true,text:`⚔ ${win.nick}, ${lose.nick} kaptanını düelloda yendi · ${duelPot(d.bet)} inci`,at:now}});for(const x of all)if(x.uid)send(x,msg);}
  log('DÜELLO BİTTİ',win?.nick??'berabere',why);return out;}
// Süre ve çember: süre bitince daha çok hasar veren kazanır; çemberin dışına çıkan kaybeder
export function duelTick(now){for(const d of [...duels.values()]){
  for(const x of [d.a,d.b])if(x.last&&Math.hypot(x.last.x-d.x,x.last.y-d.y)>DUEL_R+80){duelFinish(d,x===d.a?d.b:d.a,'çemberden çıktı',now);break;}
  if(!duels.has(d.id)||now<d.end)continue;const da=d.dmg.get(d.a),db=d.dmg.get(d.b);duelFinish(d,da===db?null:da>db?d.a:d.b,'süre doldu',now);}}
setInterval(()=>duelTick(Date.now()),1000).unref();

// ---------------------------------------------------------------- Deniz Antlaşması (src/treaty.ts)
// Perşembe günü pırıltılar ortak sayaca yazılır; hedef dolunca oylama, sonra 24 saatlik etki ve ödüller. Durum dosyada saklanır.
const TREATY_FILE=process.env.TREATY_FILE||'/opt/game/treaty.json';
export let treaty={day:'',phase:'idle',goal:0,count:0,contrib:{},options:[],votes:{},voteEnd:0,fx:null,elig:{},double:null,seen:{},envoy:null};
let treatyDirty=false,treatyCastAt=0,treatyCastDue=false;
function loadTreaty(){if(process.env.NODE_ENV==='test')return;try{treaty={...treaty,...JSON.parse(fs.readFileSync(TREATY_FILE,'utf8'))};}catch{}}
function saveTreaty(){if(process.env.NODE_ENV==='test'||!treatyDirty)return;treatyDirty=false;try{fs.writeFileSync(TREATY_FILE+'.tmp',JSON.stringify(treaty));fs.renameSync(TREATY_FILE+'.tmp',TREATY_FILE);}catch(e){log('ANTLAŞMA kayıt hatası',e?.code);}}
export const treatyReset=()=>{treaty={day:'',phase:'idle',goal:0,count:0,contrib:{},options:[],votes:{},voteEnd:0,fx:null,elig:{},double:null,seen:{},envoy:null};};
const dayKey=d=>`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
// Elçi 1/1'de doğma noktasının yakınında, adaların dışında demir atar
function treatyEnvoySpot(){const m=MAPS[TREATY_MAP],sp=m.spawn;for(const [dx,dy] of [[420,-260],[-420,-260],[420,260],[-420,260],[0,-480],[600,0]]){const x=sp.x+dx,y=sp.y+dy;
  if(x<200||y<200||x>WORLD_WIDTH-200||y>WORLD_HEIGHT-200)continue;if(m.islands.some(is=>Math.hypot(x-is.x,y-is.y)<is.r+TREATY_ENVOY_R))continue;if(Math.hypot(x-m.fleet.x,y-m.fleet.y)<FLEET.islandR+TREATY_ENVOY_R)continue;return{map:TREATY_MAP,x,y};}
  const p=pickSpot(TREATY_MAP);return{map:TREATY_MAP,x:p.x,y:p.y};}
const treatySorted=()=>Object.entries(treaty.contrib).sort((a,b)=>b[1][1]-a[1][1]||a[1][2]-b[1][2]);
export function treatyInfo(c,now=Date.now()){const showVote=treaty.phase==='vote'||treaty.phase==='done';
  return{phase:treaty.phase,goal:treaty.goal,count:treaty.count,options:treaty.options,tally:showVote?treatyTally(treaty.options,treaty.votes,treaty.double):[],voteEnd:treaty.voteEnd,now,
    fx:treaty.fx&&now<treaty.fx.until?treaty.fx:null,fxMine:!!treaty.fx&&now<treaty.fx.until&&!!treaty.elig?.[c?.uid],envoy:treaty.phase==='vote'?treaty.envoy:null,top:treatySorted().slice(0,3).map(([,v])=>[v[0],v[1]]),
    mine:treaty.contrib[c?.uid]?.[1]??0,myVote:treaty.votes[c?.uid]??-1,double:!!c?.uid&&treaty.double===c.uid};}
function treatyCast(){treatyCastAt=Date.now();treatyCastDue=false;for(const x of all)if(x.uid)send(x,{t:'treaty',d:treatyInfo(x,treatyCastAt)});}
// Yeni tur: Perşembe başında hedef son 24 saatte giren kaptan sayısına göre belirlenir, 3 etki rastgele seçilir
export function treatyStart(now,rand=Math.random){const cut=now-24*3600_000;for(const [u,t] of Object.entries(treaty.seen))if(t<cut)delete treaty.seen[u];
  const ids=[...TREATY_FX_IDS];for(let i=ids.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  Object.assign(treaty,{day:dayKey(new Date(now)),phase:'collect',goal:treatyGoal(Object.keys(treaty.seen).length),count:0,contrib:{},options:ids.slice(0,3),votes:{},voteEnd:0,envoy:null});treatyDirty=true;}
export function treatyPick(c,now){if(treaty.phase!=='collect'||!c.uid)return;const e=treaty.contrib[c.uid]??=[c.nick,0,now];e[0]=c.nick;e[1]++;e[2]=now;treaty.count++;treatyDirty=true;treatyCastDue=true;
  if(treaty.count>=treaty.goal){treaty.phase='vote';treaty.voteEnd=now+TREATY_VOTE_MS;treaty.envoy=treatyEnvoySpot();log('ANTLAŞMA oylama açıldı',treaty.goal);treatyCast();
    const msg=JSON.stringify({t:'chat',d:{nick:'Deniz Elçisi',tag:null,adm:true,text:`📜 Antlaşma hedefi doldu! Deniz Elçisi ${TREATY_MAP}'de demir attı, oylama 30 dakika açık.`,at:now}});for(const x of all)if(x.uid)send(x,msg);}}
export function treatyVote(c,o,now){if(treaty.phase!=='vote'||now>=treaty.voteEnd)return{err:'Oylama açık değil'};if(!(o>=0&&o<treaty.options.length))return{err:'Geçersiz seçim'};if((treaty.contrib[c.uid]?.[1]??0)<TREATY_MIN_PICKS)return{err:`Oy için bu turda en az ${TREATY_MIN_PICKS} pırıltı toplamış olmalısın`};
  treaty.votes[c.uid]=o;treatyDirty=true;return{ok:true};}
// Ödül: çevrimiçi kaptanın kazancına, çevrimdışıysa bekleyen kazanç olarak veritabanına (economy_grant_once) yazılır
function grantUid(uid,add){const c=[...all].find(x=>x.uid===uid);if(c){addCredit(c,add);return c;}const p={uid,grant:{id:crypto.randomUUID(),add},credit:null};pendingCredits.set(p.grant.id,p);return null;}
export function treatyFinish(now,rand=Math.random){const tally=treatyTally(treaty.options,treaty.votes,treaty.double),win=treaty.options[treatyWinner(tally,rand)];
  const sorted=treatySorted();treaty.fx={id:win,until:now+TREATY_FX_MS};treaty.elig=Object.fromEntries(sorted.filter(([,v])=>v[1]>=TREATY_MIN_PICKS).map(([u])=>[u,1]));treaty.phase='done';const rw=treatyRewards(sorted.map(([u,v])=>[u,v[1]]));
  for(const [uid,r] of rw){const c=grantUid(uid,{pearls:r.pearls,gold:r.gold});if(c)send(c,{t:'treaty',d:{...treatyInfo(c,now),reward:r}});}
  treaty.double=sorted[0]&&sorted[0][1][1]>=TREATY_MIN_PICKS?sorted[0][0]:null;treatyDirty=true;log('ANTLAŞMA',TREATY_FX[win].name,tally.join('/'),'ödül',rw.size);
  treatyCast();const msg=JSON.stringify({t:'chat',d:{nick:'Deniz Elçisi',tag:null,adm:true,text:`📜 Antlaşma imzalandı: ${TREATY_FX[win].name} 24 saat geçerli. ${TREATY_FX[win].desc}.`,at:now}});for(const x of all)if(x.uid)send(x,msg);return win;}
export function treatyTick(now){const d=new Date(now),today=dayEvent(d)?.id==='treaty';
  if(treaty.phase==='vote'){if(now>=treaty.voteEnd)treatyFinish(now);return;}
  if(today&&treaty.day!==dayKey(d)){treatyStart(now);treatyCast();return;}
  if(treaty.phase==='collect'&&!today){treaty.phase='fail';treatyDirty=true;treatyCast();return;}
  if(treaty.phase==='collect'&&treatyCastDue&&now-treatyCastAt>3000)treatyCast();}
loadTreaty();setInterval(()=>{treatyTick(Date.now());saveTreaty();},2000).unref();
// Filo Savaşı (Cumartesi, src/fleetwar.ts): kredilenen her rakip batırma filoya ve üyeye yazılır; gün bitince kazanan filonun
// en az FW_MIN_SINKS batırmış üyelerine ödül verilir. Durum /opt/game/fleetwar.json'da saklanır (sunucu yeniden başlarsa kaybolmaz).
const FW_FILE=process.env.FW_FILE||'/opt/game/fleetwar.json';
export let fw={day:'',guilds:{},members:{},last:null};let fwDirty=false,fwCastAt=0,fwCastDue=false;const guildNames=new Map();
function loadFw(){if(process.env.NODE_ENV==='test')return;try{fw={...fw,...JSON.parse(fs.readFileSync(FW_FILE,'utf8'))};}catch{}}
function saveFw(){if(process.env.NODE_ENV==='test'||!fwDirty)return;fwDirty=false;try{fs.writeFileSync(FW_FILE+'.tmp',JSON.stringify(fw));fs.renameSync(FW_FILE+'.tmp',FW_FILE);}catch(e){log('FİLO SAVAŞI kayıt hatası',e?.code);}}
export const fwReset=()=>{fw={day:'',guilds:{},members:{},last:null};};
async function guildName(gid){if(guildNames.has(gid))return guildNames.get(gid);let n=`Filo ${gid}`;
  try{const r=await fetch(`${SUPABASE_URL}/rest/v1/guilds?id=eq.${gid}&select=tag,name`,{headers:{apikey:SUPABASE_ANON,authorization:`Bearer ${SUPABASE_ANON}`}});const j=await r.json();if(j?.[0])n=`[${j[0].tag}] ${j[0].name}`;}catch{}
  guildNames.set(gid,n);return n;}
export function fwSink(k,now,name){if(dayEvent(new Date(now))?.id!=='sp'||!k?.uid||!k.guildId)return;const day=dayKey(new Date(now));if(fw.day!==day){fw={day,guilds:{},members:{},last:fw.last};}
  const g=String(k.guildId),G=fw.guilds[g]??={name:name??guildNames.get(k.guildId)??`Filo ${g}`,n:0,at:now};G.n++;G.at=now;
  const m=fw.members[k.uid]??={g,n:0,nick:k.nick};m.n++;m.g=g;fwDirty=true;fwCastDue=true;
  if(!name&&!guildNames.has(k.guildId))void guildName(k.guildId).then(n=>{if(fw.guilds[g])fw.guilds[g].name=n;});}
export function fwInfo(c,now=Date.now()){const top=Object.values(fw.guilds).sort((a,b)=>b.n-a.n||a.at-b.at).slice(0,3).map(v=>[v.name,v.n]);
  const g=c?.guildId?String(c.guildId):null;return{on:dayEvent(new Date(now))?.id==='sp',top,fleet:g?fw.guilds[g]?.n??0:0,mine:fw.members[c?.uid]?.n??0,fleetName:g?fw.guilds[g]?.name??null:null,last:fw.last};}
function fwCast(){fwCastAt=Date.now();fwCastDue=false;for(const x of all)if(x.uid)send(x,{t:'fw',d:fwInfo(x,fwCastAt)});}
export function fwFinish(now){const win=fwWinner(fw.guilds),uids=fwEligible(fw.members,win);
  for(const u of uids){const c=grantUid(u,{pearls:FW_PRIZE.pearls,gold:FW_PRIZE.gold});if(c)send(c,{t:'fw',d:{...fwInfo(c,now),reward:FW_PRIZE}});}
  fw.last=win?{name:fw.guilds[win].name,n:fw.guilds[win].n}:null;log('FİLO SAVAŞI',fw.last?.name??'kazanan yok','ödül',uids.length);
  if(win){const msg=JSON.stringify({t:'chat',d:{nick:'Filo Savaşı',tag:null,adm:true,text:`⚔ Filo Savaşı bitti! Kazanan: ${fw.guilds[win].name} (${fw.guilds[win].n} batırma). En az ${FW_MIN_SINKS} rakip batıran ${uids.length} üye ödülünü aldı.`,at:now}});for(const x of all)if(x.uid)send(x,msg);}
  fw={day:'',guilds:{},members:{},last:fw.last};fwDirty=true;fwCast();return{win,uids};}
export function fwTick(now){const d=new Date(now);if(fw.day&&fw.day!==dayKey(d)){fwFinish(now);return;}if(fwCastDue&&now-fwCastAt>3000)fwCast();}
// TP sıralaması (036_tp_top.sql): ilk 100 kaptanın sırası 10 dakikada bir yenilenir; her kaptana kendi sırası gönderilir
export const tpRanks=new Map();
async function tpRefresh(){const r=await rpcTry('tp_top',{});if(!Array.isArray(r.data))return;tpRanks.clear();r.data.forEach((u,i)=>tpRanks.set(u,i+1));for(const x of all)if(x.uid)send(x,{t:'tpr',d:{rank:tpRanks.get(x.uid)??0}});}
if(process.env.NODE_ENV!=='test'){setTimeout(()=>void tpRefresh(),5000).unref();setInterval(()=>void tpRefresh(),600_000).unref();}
loadFw();setInterval(()=>{fwTick(Date.now());saveFw();},2000).unref();

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
  if(q.method==='POST'&&q.url?.startsWith('/iap/revenuecat')){if(!rcAuthOk(q.headers.authorization,RC_WEBHOOK_AUTH)){r.writeHead(401,{'content-type':'text/plain'});r.end('yetki yok');return;}
    let body='';q.on('data',d=>{body+=d;if(body.length>200000)q.destroy();});
    q.on('end',async()=>{const ok=await handleRevenueCat(body).catch(e=>{log('IAP hata',e?.message);return false;});r.writeHead(ok?200:500,{'content-type':'text/plain'});r.end(ok?'ok':'tekrar');});return;}
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
      Object.assign(c,who);c.tag=await guildTag(c.guildId).catch(()=>null);c.admin=await isAdminToken(String(m.token||'')).catch(()=>false);c.netId=String(m.netId||'').slice(0,16)||Math.random().toString(36).slice(2,10);clearTimeout(authTimer);
      await loadEcon(c);if(!c.econ){ws.close(4003,'hesap verisi yüklenemedi');return;}
      void sinkAdd(c,0);send(c,{t:'hello',id:c.netId,nick:c.nick,playerNo:c.playerNo});log('GİRİŞ',`#${c.playerNo}`,c.nick);void loadFriends(c).then(()=>{send(c,{t:'fr',d:{k:'list',list:friendView(c)}});friendPing(c);});void rpcTry('mail_box',{p_uid:c.uid,p_box:'in'}).then(r=>{if(r.data)send(c,{t:'mail',d:{k:'box',box:'in',list:r.data.list,unread:r.data.unread}});});treaty.seen[c.uid]=Date.now();treatyDirty=true;send(c,{t:'treaty',d:treatyInfo(c)});send(c,{t:'fw',d:fwInfo(c)});send(c,{t:'tpr',d:{rank:tpRanks.get(c.uid)??0}});if(!qkByUid.has(c.uid))qkByUid.set(c.uid,{});c.qk=qkByUid.get(c.uid);{const t=treasures.get(c.uid);if(t)send(c,{t:'tstate',d:{parts:t.parts,spot:t.spot}});}return;}
    if(!c.uid||!c.econ)return;
    switch(m.t){
      case'join':{const name=String(m.sea||'').slice(0,40);if(name===c.sea)return;if(!canJoin(c,name,now)){send(c,{t:'denied',reason:'harita kilitli'});return;}leaveSea(c);c.last=null;if(!name)return;
        const room=seas.get(name)??new Set();if(room.size>=LIMITS.maxPerSea){send(c,{t:'full'});return;}room.add(c);seas.set(name,room);c.sea=name;c.seen=null;send(c,{t:'joined',sea:name});
        if(seaMap(name)){const fresh=npcFill(name,now);const st=seaNpcs.get(name);send(c,{t:'nlist',d:[...(st?.list.values()??[])].map(npcInfo)});
          if(fresh.length){const m=JSON.stringify({t:'nlist',d:[...st.list.values()].map(npcInfo)});for(const x of room)if(x!==c)send(x,m);}}
        {const l=lootFor(c);if(l)send(c,{t:'loot',d:lootInfo(l)});}
        send(c,{t:'duel',d:{k:'list',duels:[...duels.values()].filter(d=>d.sea===name).map(duelInfo)}});
        const b=bossSeas.get(name)?.boss;if(b)send(c,{t:'boss',d:bossInfo(name,b)});
        const isle=islands.get(islandOfSea(name));if(isle)send(c,{t:'isle',d:islandInfo(isle)});
        if(name===SIEGE_ROOM){const r=siegeJoin(c.uid,c.nick,now);if(r)send(c,{t:'sstate',d:siegeInfo(r,c.uid)});}return;}
      case'state':{if(!c.sea||!c.rState.hit(now))return;const s=m.d;
        if(c.domTeam&&domMatchOfSea(c.sea)!==undefined){const r=domMove(c,s,now);if(r){send(c,{t:'pos',d:r});return;}}
        if(!c.lsOn&&lsMatchOfSea(c.sea)!==undefined)return;// elenen kaptan izleyicidir, gemisi görünmez
        if(c.lsOn){const r=lsMove(c,s);if(r){send(c,{t:'pos',d:r});return;}s.maxHp=LS_HP;}let v=checkState(c.last,s,now);if(v==='bad')return;if(v==='speed'&&s.tp&&tpAllowed(c,s,now))v='ok';delete s.tp;if(v==='bad')return;if(v==='speed'){suspect(c,'hız',`${Math.round(s.x)},${Math.round(s.y)}`);if(c.last)send(c,{t:'pos',d:{x:c.last.x,y:c.last.y}});return;}
        {const land=onLand(seaMap(c.sea),s.x,s.y);if(land){c.landHits=(c.landHits||0)+1;if(c.landHits%10===1)suspect(c,'karaya çıkma',land);if(c.last)send(c,{t:'pos',d:{x:c.last.x,y:c.last.y}});return;}}
        if(c.lsOn)c.maxHp=LS_HP;else if(num(s.maxHp)){const cap=hpCap(c.econ);if(s.maxHp>cap*1.02){suspect(c,'can sınırı',`${Math.round(s.maxHp)}>${cap}`);s.maxHp=cap;}c.maxHp=s.maxHp;}
        if(c.maxHp&&s.hp>c.maxHp)s.hp=c.maxHp;noteHp(c,s.hp,now);
        if(s.ship!==undefined)s.ship=shipAllowed(c.econ,s.ship);
        if(c.admin){s.adm=1;s.ship=ADMIN_SHIP;if(aevOpen(c.sea)){const ev=aevState(c);s.hp=Math.round(ev.hp);s.maxHp=ev.max;if(now-(c.ahpAt||0)>1000){c.ahpAt=now;send(c,{t:'ahp',d:{hp:s.hp,max:ev.max}});}}}
        if(c.lsOn){const ph=c.pvp?.hp;if(num(s.hp)&&ph!=null)s.hp=Math.max(0,Math.min(s.hp,Math.round(ph)));s.ship='ls';delete s.adm;delete s.tag;}
        if(c.domTeam&&domMatchOfSea(c.sea)!==undefined){const ph=c.pvp?.hp;if(num(s.hp)&&ph!=null)s.hp=Math.max(0,Math.min(s.hp,Math.round(ph)));s.ship='dom-'+c.domTeam;s.tm=c.domTeam;delete s.adm;}else delete s.tm;
        if('nick' in s){s.sk=c.sinks??0;s.tr=tpRanks.get(c.uid)??0;}
        c.last={x:s.x,y:s.y,at:now};s.id=c.netId;queueState(c,s);return;}
      case'fire':return; // oyuncular arası atış yalnız sunucu atışıyla (atk); oyuncunun bildirdiği hasar kabul edilmez
      case'sunk':{if(!c.sea)return;const s=m.d||{};s.victim=c.netId;s.victimNick=c.nick;
        // Batıran yalnızca son 60 sn'de bu oyuncuya ateş etmiş biri olabilir (arkadaşa SP yazdırma engeli)
        if(s.by&&!(now-(c.pvp?.from.get(String(s.by))??-1e12)<60_000)){suspect(c,'sahte batırma',String(s.by));s.by=null;s.byNick=null;}
        if(c.duel){const d=duels.get(c.duel);pvpReset(c);toSea(c,{t:'sunk',d:s});if(d)duelFinish(d,d.a===c?d.b:d.a,'batırdı',now);return;}
        if(s.by){const k=[...(seas.get(c.sea)||[])].find(x=>x.netId===String(s.by));if(k)rageGain(k,RAGE_PER_RIVAL);}
        if(s.by&&domMatchOfSea(c.sea)===undefined){const k=[...(seas.get(c.sea)||[])].find(x=>x.netId===String(s.by));if(sinkCredit(k,c.uid,now)){void sinkAdd(k,1);fwSink(k,now);}}
        if(c.domTeam)domSink(c,now);if(c.lsOn){lsOut(c,s.by?[...(seas.get(c.sea)||[])].find(x=>x.netId===String(s.by)):null,now);toSea(c,{t:'sunk',d:s});return;}pvpReset(c);toSea(c,{t:'sunk',d:s});return;}
      case'bkill':return; // Only accepted nkill events advance the boss counter.
      case'bhit':return; // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case'shit':return; // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case'ld':{const d={...(m.d&&typeof m.d==='object'?m.d:{}),hero:(heroUntil.get(c.uid)??0)>now};c.ld=buildLoadout(c.econ,d);c.ldRaw=d;return;}
      case'atk':{if(!c.sea||!c.rSalvo.hit(now))return;await onAttack(c,m.d,now);return;}
      case'nhit':return; // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case'nkill':return; // NPC batırmasını sunucu kendisi sayar (npcDeath); oyuncunun bildirdiği batırma kabul edilmez
      case'salvo':{if(c.lsOn)return;if(!c.rSalvo.hit(now)){suspect(c,'salvo hızı');return;}await applyUsage(c,m.d,null,now);return;}
      case'use':{if(c.lsOn||!c.rUse.hit(now))return;const id=String(m.d?.id||''),before=c.econ;await applyUsage(c,null,id,now);
        if(id==='mine'&&(c.econ!==before||!SERVER_SECRET||(process.env.BENCH_AUTH==='1'&&c.uid.startsWith('b')))){const mn=placeMine(c,Number(m.d?.x),Number(m.d?.y),now);if(mn)toSea(c,{t:'mine',d:{id:mn.id,x:mn.x,y:mn.y,by:c.netId}});}return;}
      case'qdone':{if(!c.uid||!c.rKill.hit(now))return;const id=String(m.d?.id||'');const r=questCredit(c,id,now);
        if(r.err){if(r.err==='bekleme')suspect(c,'görev bekleme',id);send(c,{t:'qres',d:{id,ok:false,err:r.err}});return;}addCredit(c,r.add);send(c,{t:'qres',d:{id,ok:true}});return;}
      case'mail':{if(!c.uid||!c.rUse.hit(now))return;await onMail(c,m.d||{},now);return;}
      case'fr':{if(!c.uid||!c.rUse.hit(now))return;await onFriend(c,m.d||{},now);return;}
      case'pm':{if(!c.uid||!c.rChat.hit(now))return;await onPm(c,m.d||{},now);return;}
      case'grp':{if(!c.uid||!c.rUse.hit(now))return;onGroup(c,m.d||{},now);return;}
      case'duel':{if(!c.uid||!c.rUse.hit(now))return;await onDuel(c,m.d||{},now);return;}
      case'treaty':{if(!c.uid||!c.rUse.hit(now))return;const r=treatyVote(c,Number(m.d?.o),now);if(r.err){send(c,{t:'treaty',d:{...treatyInfo(c),err:r.err}});return;}send(c,{t:'treaty',d:treatyInfo(c)});return;}
      case'spk':{if(!c.sea||!c.rUse.hit(now))return;{const t=lootTake(c,'sp',m.d?.id);if(t.err){if(t.err==='uzak')suspect(c,'uzak pırıltı');return;}send(c,{t:'loot',d:lootInfo(c.loot)});}const r=sparklePicked(c,now);if(r.err){if(r.err==='hız')suspect(c,'pırıltı hızı');return;}const sr=sparkleReward(c);addCredit(c,sr.add);send(c,{t:'spkr',d:sr.out});treatyPick(c,now);return;}
      case'chest':{if(!c.sea||!c.rKill.hit(now))return;{const t=lootTake(c,'ch',m.d?.id);if(t.err){if(t.err==='uzak')suspect(c,'uzak sandık');return;}send(c,{t:'loot',d:lootInfo(c.loot)});}const r=chestPicked(c,now);if(r.err){if(r.err==='hız')suspect(c,'sandık hızı');return;}{const cr=chestReward(c,m.d?.g);addCredit(c,cr.add);send(c,{t:'chestr',d:cr.out});}if(r.found)send(c,{t:'tstate',d:{parts:r.parts,spot:treOf(c.uid).spot,part:true}});return;}
      case'tdig':{if(!c.sea||!c.rKill.hit(now))return;const r=treasureDig(c);if(r.err){send(c,{t:'tdig',d:{ok:false,err:r.err}});return;}addCredit(c,r.add);send(c,{t:'tdig',d:{ok:true,reward:r.reward}});return;}
      case'spy':{if(!c.rKill.hit(now))return;await onSpy(c,m.d?.nick);return;}
      case'thit':return; // kule hasarı ve tamiri yalnız sunucu atışıyla
      // Kule dikildi (veritabanında): önce canlar yazılır, sonra ada yeniden okunup denize gönderilir
      case'tbuilt':{const key=String(m.d?.key||'');const i=islands.get(key);if(!i||!c.rKill.hit(now))return;await saveIslandHp({...i,hpDirty:true});const n=await loadIsland(key).catch(()=>null);if(n)sendRoom(key,{t:'isle',d:islandInfo(n)});return;}
      // Filoya girme/çıkma sonrası filo bilgisi yenilenir
      case'gref':{if(!c.rKill.hit(now))return;c.guildId=await guildOf(c.uid).catch(()=>c.guildId);c.tag=await guildTag(c.guildId).catch(()=>c.tag);return;}
      // Gemi battı (NPC, kule, mayın ya da rakip): yeniden doğma noktasını sunucu seçer; ışınlanma yalnız oraya kabul edilir
      case'died':{if(!c.sea||!c.rKill.hit(now))return;const p=respawnPoint(c);if(!p)return;c.tpTo={x:p.x,y:p.y,until:now+15_000};pvpReset(c);send(c,{t:'respawn',d:{x:p.x,y:p.y}});return;}
      case'dom':{if(!c.rUse.hit(now))return;onDom(c,m.d,now);return;}
      case'ls':{if(!c.rUse.hit(now))return;onLs(c,m.d,now);return;}
      case'chat':{if(!c.rChat.hit(now))return;const raw=String(m.d?.text||'').slice(0,LIMITS.chatLen).trim();if(!raw)return;
        if(c.admin&&raw.startsWith('/')){const r=adminChatCommand(raw,now);if(r){send(c,{t:'chat',d:{nick:'Sistem',tag:null,text:r,at:now,adm:true}});return;}}
        const mu=muteLeft(c.nick,now);if(mu>0){send(c,{t:'muted',d:{left:mu}});return;}
        const text=c.admin?raw:filterChat(raw);toAll(c,{t:'chat',d:{nick:c.nick,tag:m.d?.tag??null,text,at:now,...(c.admin?{adm:true}:{})}});
        c.chatLog=[...(c.chatLog||[]),`${new Date(now).toISOString().slice(11,16)} ${raw}`].slice(-5);return;}
      // Oyuncu bildirimi: bildirilen oyuncunun son mesajlarıyla yönetim paneline (Şüpheli kayıtlar) düşer
      case'cerr':{if(now-(c.cerrAt||0)<10_000)return;c.cerrAt=now;log('İSTEMCİ HATASI',c.nick,String(m.d?.msg||'').slice(0,200),String(m.d?.at||'').slice(0,120));return;}
      case'report':{if(!c.rKill.hit(now)||now-(c.reportAt||0)<20_000)return;c.reportAt=now;const nick=String(m.d?.nick||'').slice(0,40),why=String(m.d?.why||'').slice(0,120);
        const t=[...all].find(x=>x.nick&&x.nick.toLocaleLowerCase('tr')===nick.toLocaleLowerCase('tr'));
        addFlag({playerNo:t?.playerNo??0,nick:t?.nick??nick},'oyuncu bildirimi',`bildiren #${c.playerNo} ${c.nick}: ${why}${t?.chatLog?.length?` · son mesajlar: ${t.chatLog.join(' | ')}`:''}`);
        log('BİLDİRİM',`#${c.playerNo}`,c.nick,'→',nick,why);send(c,{t:'reported'});return;}
      case'bid':{const lot=String(m.d?.lot||'');if(!c.uid||!/^[a-z]{2,12}$/.test(lot))return;void auctionTop(lot).then(b=>{if(b&&b.id===c.uid)toAll(c,{t:'bid',d:b});});return;}
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
  ws.on('close',()=>{clearTimeout(authTimer);if(c.grp)groupLeave(c);if(c.uid)setTimeout(()=>friendPing(c),50);clearTimeout(c.econTimer);void flushCredit(c);if(c.uid&&c.last&&seaMap(c.sea))void dbRpc('spy_seen',{p_uid:c.uid,p_map:seaMap(c.sea),p_x:Math.round(c.last.x),p_y:Math.round(c.last.y)}).catch(()=>{});leaveSea(c);all.delete(c);domDrop(c);lsDrop(c);if(c.uid)log('ÇIKIŞ',`#${c.playerNo}`,c.nick);});
  ws.on('error',()=>{});
});
// Ölü bağlantıları temizle
setInterval(()=>{for(const c of all){if(c.ws.isAlive===false){c.ws.terminate();continue;}c.ws.isAlive=false;try{c.ws.ping();}catch{}}},30000).unref();
wss.on('connection',ws=>{ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true;});});
if(process.env.NODE_ENV!=='test')void loadIslands();
if(process.env.NODE_ENV!=='test')httpServer.listen(PORT,'127.0.0.1',()=>log(`Oyun sunucusu ${PORT} portunda`));

// ---- Bakım: bellek temizliği (her saat) ve günlük yedek. Oyuncu ilerlemesi (hazine parçaları, görev sayaçları) silinmez;
// yalnız süresi geçmiş kayıtlar ve çevrim dışı kaptanların arkadaş önbelleği atılır. Böylece sunucu günlerce açık kalabilir.
export function pruneMemory(now=Date.now()){const day=new Date(now+3*3600_000).toISOString().slice(0,10);let n=0;
  for(const [u,m] of spByUid){for(const [v,r] of m)if(r.day!==day){m.delete(v);n++;}if(!m.size)spByUid.delete(u);}
  for(const [u,m] of questCooldowns){for(const [q,t] of m)if(now-t>=QUEST_COOLDOWN_MS){m.delete(q);n++;}if(!m.size)questCooldowns.delete(u);}
  for(const [u,t] of heroUntil)if(t<=now){heroUntil.delete(u);n++;}
  const online=new Set([...all].map(c=>c.uid).filter(Boolean));for(const u of friendSets.keys())if(!online.has(u)){friendSets.delete(u);n++;}
  return n;}
// Günlük yedek: /opt/game altındaki kayıt dosyaları backup/GÜN klasörüne kopyalanır, 14 günden eskiler silinir
const DATA_DIR=process.env.DATA_DIR||'/opt/game',BACKUP_KEEP=14;
export function backupData(now=Date.now(),dir=DATA_DIR){const day=new Date(now+3*3600_000).toISOString().slice(0,10),root=`${dir}/backup`,to=`${root}/${day}`;
  if(fs.existsSync(to))return false;fs.mkdirSync(to,{recursive:true});
  for(const f of fs.readdirSync(dir))if(/\.(json|jsonl)$/.test(f))fs.copyFileSync(`${dir}/${f}`,`${to}/${f}`);
  const old=fs.readdirSync(root).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort().slice(0,-BACKUP_KEEP);for(const d of old)fs.rmSync(`${root}/${d}`,{recursive:true,force:true});
  return true;}
if(process.env.NODE_ENV!=='test'){setInterval(()=>{const n=pruneMemory();if(n)log('BAKIM',`${n} eski kayıt temizlendi`);try{if(backupData())log('YEDEK','günlük yedek alındı');}catch(e){log('YEDEK hata',e?.message);}},3600_000).unref();
  setTimeout(()=>{try{if(backupData())log('YEDEK','günlük yedek alındı');}catch(e){log('YEDEK hata',e?.message);}},30_000).unref();}
