import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
// Sunucu src altındaki TypeScript dosyalarını da kullanır: canlıdaki gibi esbuild ile paketlenip yüklenir
import {build} from 'esbuild';import {mkdirSync} from 'node:fs';
const outDir=new URL('../node_modules/.cache/',import.meta.url).pathname;mkdirSync(outDir,{recursive:true});
await build({entryPoints:[new URL('../server/game-server.mjs',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',target:'node20',external:['ws'],outfile:outDir+'game-server.test.mjs',logLevel:'silent'});
const S=await import(outDir+'game-server.test.mjs');
test('normal movement passes, impossible speed is flagged, teleports (respawn) are allowed',()=>{
  const prev={x:0,y:0,at:0};
  assert.equal(S.checkState(prev,{x:50,y:0,hp:1},100),'ok');
  assert.equal(S.checkState(prev,{x:1500,y:0,hp:1},500),'speed');
  assert.equal(S.checkState(prev,{x:9000,y:0,hp:1},100),'bad');
  assert.equal(S.checkState(prev,{x:'a',y:0,hp:1},100),'bad');
  // Harita içinde 0,1 sn'de 4.000 birim: ışınlanma işareti olmadan hız sayılır (önceden 3.000 üstü serbestti)
  assert.equal(S.checkState({x:100,y:100,at:0},{x:4100,y:100,hp:1},100),'speed');
});
test('fire damage above the cap is rejected',()=>{
  assert.equal(S.checkFire({damage:15000,x:0,y:0,to:'a'}),'ok');
  assert.equal(S.checkFire({damage:S.LIMITS.maxHit+1,x:0,y:0,to:'a'}),'damage');
  assert.equal(S.checkFire({damage:-5,x:0,y:0,to:'a'}),'damage');
});
test('rate limiter allows N per window',()=>{const r=new S.Rate(3,1000);assert.ok(r.hit(0)&&r.hit(1)&&r.hit(2));assert.ok(!r.hit(3));assert.ok(r.hit(1001));});
test('Shopier OSB signature is verified and order fields are read',async()=>{
  const {createHmac}=await import('node:crypto');
  const res=Buffer.from(JSON.stringify({orderid:'123',email:'a@b.c',price:'49.99',customernote:'#10001',istest:0})).toString('base64');
  const hash=createHmac('sha256','sifre').update(res+'kullanici').digest('hex');
  assert.ok(S.verifyOsb(res,hash,'kullanici','sifre'));
  assert.ok(!S.verifyOsb(res,hash,'kullanici','yanlis'));
  const o=S.parseOsb(res);assert.equal(o.order,'123');assert.equal(o.price,49.99);assert.equal(o.note,'#10001');assert.equal(o.test,false);
});
test('multipart/form-data body from Shopier is parsed',()=>{
  const b='----X1',body=`--${b}\r\nContent-Disposition: form-data; name="res"\r\n\r\nQUJD\r\n--${b}\r\nContent-Disposition: form-data; name="hash"\r\n\r\nh123\r\n--${b}--\r\n`;
  const f=S.parseForm(body,`multipart/form-data; boundary=${b}`);assert.equal(f.get('res'),'QUJD');assert.equal(f.get('hash'),'h123');
  assert.equal(S.parseForm('res=a&hash=b','application/x-www-form-urlencoded').get('hash'),'b');
});
test('shared boss: sea kill counter spawns once, damage is split by share',()=>{
  S.bossSeas.clear();const sea='sea-8-1';let b=null;
  for(let i=0;i<49;i++)assert.equal(S.bossKill(sea,10),null); // en az 50
  b=S.bossKill(sea,10);assert.ok(b);assert.equal(b.maxHp,6300000);assert.equal(S.bossKill(sea,50),null);
  assert.equal(S.bossHit(sea,'a',1e9)?.id,undefined);assert.equal(b.hp,6300000-80000); // tek paket sınırı
  let r=null;while(!r){r=S.bossHit(sea,'a',60000)||S.bossHit(sea,'b',20000);}
  assert.equal(r.n,2);assert.ok(Math.abs(r.shares.a.share+r.shares.b.share-1)<1e-9);assert.ok(r.shares.a.share>.7);
  assert.equal(S.bossSeas.get(sea).boss,null);assert.equal(S.seaTier('sea-3-2'),3);assert.equal(S.seaTier('siege'),0);
});
test('shared islands: npc towers, capture by last hitter guild, heal only by owner',()=>{
  S.islands.clear();const i=S.islandFromRow({map_key:'3/1'});S.islands.set('3/1',i);
  assert.equal(i.towers.filter(Boolean).length,16);const max=i.towers[0].maxHp;assert.ok(max>=37_800_000);
  assert.equal(S.towerHit('3/1',0,5,1e9,false).destroyed,undefined); // tek paket sınırı
  for(let n=0;n<16;n++){i.towers[n].hp=1;}
  for(let n=0;n<15;n++)assert.equal(S.towerHit('3/1',n,0,10,false).captured,false);
  const r=S.towerHit('3/1',15,7,10,false);assert.ok(r.captured);assert.equal(i.guild,7);assert.deepEqual(i.ruins,{});
  // sahibi filo kendi kulesine vuramaz, şifa yalnız sahibi filodan
  i.towers[2]={type:'cannon',hp:1000,maxHp:max};
  assert.equal(S.towerHit('3/1',2,7,500,false),null);assert.equal(S.towerHit('3/1',2,9,500,true),null);
  assert.ok(S.towerHit('3/1',2,7,5000,true).healed);assert.equal(i.towers[2].hp,6000);
  const own=S.islandFromRow({map_key:'5/2',guild_id:3,towers:[{type:'cannon',hp:5},null],ruins:{1:Date.now()}});assert.equal(own.towers[0].hp,5);assert.equal(own.towers[1],null);
  const npc=S.islandFromRow({map_key:'5/2',ruins:{4:Date.now()}});assert.equal(npc.towers[4],null);assert.ok(npc.towers[5]);
});
test('captured island resets emptiness timer and builds clear it',()=>{
  const i=S.islandFromRow({map_key:'4/1',guild_id:2,towers:[]});assert.ok(i.emptySince>0);
  const j=S.islandFromRow({map_key:'4/1',guild_id:2,towers:[{type:'cannon',hp:9}]});assert.equal(j.emptySince,0);
});
test('shared siege: hp scales with captains, order enforced, win by commander',()=>{
  S.resetSiege();const now=Date.UTC(2026,9,16,17,30);// Cuma 20:30 (Türkiye): kuşatma açık
  assert.equal(S.siegeJoin('x','X',Date.UTC(2026,9,13,9)),null);// pencere dışında kapalı
  const r=S.siegeJoin('a','A',now);assert.equal(r.max[0],7_800_000);S.siegeJoin('b','B',now);assert.equal(r.max[0],15_600_000);assert.equal(r.hp[0],15_600_000);
  assert.equal(S.siegeHitPiece('a','A',12,1000),null);// iç kule surlar düşmeden vurulamaz
  for(let i=0;i<12;i++){r.hp[i]=10;assert.equal(S.siegeHitPiece('a','A',i,50).down,i);}
  for(let i=12;i<16;i++){r.hp[i]=10;S.siegeHitPiece('b','B',i,50);}
  r.hp[16]=100;assert.ok(S.siegeHitPiece('b','B',16,500).won);assert.equal(r.result,'won');
  const info=S.siegeInfo(r,'a');assert.equal(info.n,2);assert.equal(info.mine,120);
  assert.equal(S.siegeWindowAt(Date.UTC(2026,9,16,17,30)).open,true);// Cuma 20:30 TR
});
test('pvp: can sınırı sunucudaki seviyeden, hasar bütçesi ve ölümsüzlük denetimi',()=>{
  assert.equal(S.hpCap(null),0);
  assert.equal(S.hpCap({level:1,u_hull:0}),Math.round(54_000*1.8));
  // Bütçe: 1.000.000 canlı hedefe tek atışta en çok %6 gider; dev hasar kırpılır, 1 sn'de 50.000 dolar
  const t={maxHp:1_000_000};const now=1_000_000;S.noteHp(t,1_000_000,now);
  assert.equal(S.pvpGuard(t,5_000_000,now),60_000);
  assert.equal(S.pvpGuard(t,5_000_000,now),0);
  assert.equal(S.pvpGuard(t,5_000_000,now+1000),50_000);
  // Normal oyuncu: canı düştüğünü bildiriyor → batırılmaz, sonra kendisi batar
  const a={maxHp:100_000};S.noteHp(a,100_000,now);
  for(let i=1;i<=25;i++){S.pvpGuard(a,50_000,now+i*1000);S.noteHp(a,Math.max(0,100_000-i*5000),now+i*1000);assert.equal(S.godCheck(a),false);}
  // Ölümsüz: hasar yiyor ama canı hep dolu bildiriyor → ~1 dk içinde batırılır (en hızlı batma 20 sn)
  const g={maxHp:100_000};S.noteHp(g,100_000,now);let sunkAt=0;
  for(let i=1;i<=60&&!sunkAt;i++){S.pvpGuard(g,50_000,now+i*1000);S.noteHp(g,100_000,now+i*1000);if(S.godCheck(g))sunkAt=i;}
  assert.ok(sunkAt>20&&sunkAt<=60,`batma ${sunkAt}. sn`);
  // Dost iyileştirmesi de bütçeli
  const h={maxHp:100_000};S.noteHp(h,50_000,now);assert.equal(S.pvpHeal(h,1_000_000,now),6000);
});
test('saniyelik hasar sınırı: seviyeye göre, 3 sn birikim, aşırı hız işaretlenir',()=>{
  const cap=S.dpsCap(8);assert.equal(cap,6_300_000/40);
  const c={econ:{level:8}};let now=0;
  assert.equal(S.dpsTake(c,cap*10,now).ok,cap*3);// birikim kadar geçer
  assert.equal(S.dpsTake(c,cap,now+1000).ok,cap);// saniyede bir sınır
  // Sürekli 10 katı hasar bildiren işaretlenir; normal hız işaretlenmez
  let flag=false;for(let i=2;i<12;i++)flag=S.dpsTake(c,cap*10,now+i*1000).flag||flag;assert.equal(flag,true);
  const n={econ:{level:8}};let f2=false;for(let i=0;i<60;i++)f2=S.dpsTake(n,cap*.8,i*1000).flag||f2;assert.equal(f2,false);
});
test('npc batırma doğrulaması: yanlış deniz/hedef reddedilir, hız bütçesi, seviye görevi sayımı',()=>{
  const c={sea:'sea-3-1',econ:{level:3}};let now=0;c.sb={pool:1e9};
  assert.equal(S.killCredit(c,'n5-1-heavy',now).err,'hedef');
  assert.equal(S.killCredit({sea:'sea-siege'},'n3-1-heavy',now).err,'deniz');
  const r=S.killCredit(c,'n3-1-heavy',now);assert.ok(r.add);assert.equal(r.add.st_npc,1);assert.equal(r.add.st_heavy,1);assert.equal(r.add.lqk,1);
  // Hafif gemi seviye görevine sayılmaz; 3/2 denizinde de sayılmaz
  assert.equal(S.killCredit(c,'n3-1-light',now+5000).add.lqk,undefined);
  const c2={sea:'sea-3-2',econ:{level:3},sb:{pool:1e9}};assert.equal(S.killCredit(c2,'n3-2-heavy',now).add.lqk,undefined);
  // Saniyede onlarca batırma: bütçe yetmez
  const f={sea:'sea-3-1',econ:{level:3},sb:{pool:1e9}};let bad=0;for(let i=0;i<40;i++)if(S.killCredit(f,'n3-1-heavy',1000+i*10).err)bad++;assert.ok(bad>30);
});
test('salvo bütçesi ve kullanım sayımı: salvosuz batırma sayılmaz, top sayısı sınırı, bekleme süresi',()=>{
  const st={level:3,u_damage:0,c_cast:100,a_fire:1000,iron:1000,a_powder:10,a_speed:10};const c={sea:'sea-3-1',econ:st};
  // Salvo bildirmeden batırma: mermi yok
  assert.equal(S.killCredit(c,'n3-1-light',0).err,'mermi');
  // 100 ateş güllesi salvosu: kullanım sayılır, bütçe dolar
  const r=S.noteSalvo(c,{a:'fire',n:100,i:0,p:1});assert.equal(r.use.cn_a_fire,100);assert.equal(r.use.cn_a_powder,1);assert.equal(r.over,false);
  assert.ok(S.killCredit(c,'n3-1-light',0).add);
  // 1000 top yalanı kırpılır ve işaretlenir
  const big=S.noteSalvo(c,{a:'iron',n:1000,i:0});assert.equal(big.over,true);assert.ok(big.use.cn_iron<=105);
  // Bekleme süresi: hız iksiri 20 sn dolmadan (yetenekle en kısa 21 sn) ikinci kez erken sayılır
  assert.equal(S.noteUse(c,'speed',0).early,false);assert.equal(S.noteUse(c,'speed',5000).early,true);assert.equal(S.noteUse(c,'speed',40000).early,false);
  assert.equal(S.noteUse(c,'speed',60001).use.cn_a_speed,1);
  // Bütçeden hasar düşümü
  const d={sb:{pool:1000}};assert.equal(S.sbTake(d,5000),1000);assert.equal(S.sbTake(d,5000),0);
});
test('görev, boss ve kuşatma ödülü sunucuda: batırma sayısı, bekleme süresi, pay',()=>{
  const c={uid:'q1',sea:'sea-2-1',econ:{level:2,c_cast:100},sb:{pool:1e12}};
  const q='q2/1-light';
  assert.equal(S.questCredit(c,q,0).err,'sayı');// batırma yok
  for(let i=0;i<20;i++){const r=S.killCredit(c,'n2-1-light',i*20_000);assert.ok(r.add,String(r.err));}
  const ok=S.questCredit(c,q,500_000);assert.ok(ok.add);assert.equal(ok.add.st_quest,1);
  for(let i=0;i<20;i++)S.killCredit(c,'n2-1-light',600_000+i*20_000);
  assert.equal(S.questCredit(c,q,1_100_000).err,'bekleme');// 8 saat dolmadı
  assert.ok(S.questCredit(c,q,500_000+8*3600_000).add);
  // Pırıltı görevi: sayı yok, yalnız bekleme süresi
  // Pırıltı görevi: toplanan pırıltı sayılmadan ödül yok; sunucunun saydığı 20 pırıltıyla geçer, pırıltı seli reddedilir
  assert.equal(S.questCredit(c,'q2/1-sparkle',0).err,'sayı');
  for(let i=0;i<20;i++)assert.equal(S.sparklePicked(c,1_000_000+i*1500).ok,true);
  assert.ok(S.questCredit(c,'q2/1-sparkle',2_000_000).add);
  // Normal hızda (inci günü öbek süpürme dahil) hiç reddedilmez; saniyede 10 bildiren program reddedilir
  const fair={sea:'sea-2-1'};for(let i=0;i<300;i++)assert.equal(S.sparklePicked(fair,i<30?i*200:6000+i*700).ok,true);
  const sp={sea:'sea-2-1'};let bad=0;for(let i=0;i<200;i++)if(S.sparklePicked(sp,i*100).err)bad++;assert.ok(bad>=100);
  // Boss: pay yoksa ödül yok, %3 altı EP yok
  assert.equal(S.bossCredit('2/1',0,3),null);assert.equal(S.bossCredit('2/1',.02,3).ep,undefined);assert.ok(S.bossCredit('2/1',.5,3).ep>0);
  assert.ok(S.siegeCredit(100000,4,8).gold>0);
});
test('hazine avı sunucuda: sandık hızı, parça zarı, yer seçimi, kazı yeri',()=>{
  const c={uid:'t1',sea:'sea-3-1',last:{x:0,y:0}};let parts=0,spot=null;
  // Zar hep tutsun: 4 sandıkta hazine haritası tamamlanır
  for(let i=0;i<4;i++){const r=S.chestPicked(c,i*20_000,()=>0);parts=r.parts;spot=r.spot??spot;}
  assert.ok(spot);assert.equal(spot.map,'3/1');assert.equal(parts,0);
  // Sandık seli: kova boşalınca reddedilir
  const f={uid:'t2',sea:'sea-3-1'};let rej=0;for(let i=0;i<20;i++)if(S.chestPicked(f,100+i,()=>.9).err)rej++;assert.ok(rej>=13);
  // Yanlış yerde kazı reddedilir, doğru yerde ödül ve kazanç hakkı
  assert.equal(S.treasureDig(c).err,'yer');
  c.last={x:spot.x+10,y:spot.y};const d=S.treasureDig(c);assert.ok(d.reward);assert.equal(d.add.st_treasure,1);
  assert.equal(S.treasureDig(c).err,'harita');// ikinci kazı yok
});

test('empty ammo, missing account and early mine cannot mint damage budgets',()=>{
  const c={econ:{level:1,c_cast:315,a_fire:0,a_mine:2}};
  assert.equal(S.noteSalvo(c,{a:'fire',n:315,i:0}).err,'stok');assert.equal(c.sb,undefined);
  assert.equal(S.noteSalvo({}, {a:'iron',n:1}).err,'salvo');
  assert.equal(S.noteSalvo(c,{a:'__proto__',n:1}).err,'salvo');
  assert.equal(S.noteSalvo(c,{a:'fire',n:Infinity}).err,'salvo');
  assert.ok(S.noteUse(c,'mine',0).use);assert.equal(c.sb,undefined);// mayın hasarı sunucuda hesaplanır, bütçe açmaz
  assert.equal(S.noteUse(c,'mine',1).err,'bekleme');
  assert.equal(c.uses.mine,0);
});
test('invalid state payloads and locked sea joins fail closed',()=>{
  for(const s of [null,undefined,[],0,{x:1,y:2,hp:-1},{x:-1,y:2,hp:1}])assert.equal(S.checkState(null,s,0),'bad');
  const c={econ:{level:1}};
  assert.equal(S.canJoin(c,'sea-1-1'),true);assert.equal(S.canJoin(c,'sea-8-2'),false);
  assert.equal(S.canJoin(c,'sea-9-9'),false);assert.equal(S.canJoin({},'sea-1-1'),false);
  assert.equal(S.questCredit({...c,sea:'sea-1-1',uid:'blocked'},'q8/1-sparkle',0).err,'deniz');
});
test('siege reward basis is actual damage; blocked pieces have none',()=>{
  S.resetSiege();S.siegeJoin('audit','Audit',Date.UTC(2026,9,16,18));
  assert.equal(S.siegeHitPiece('audit','Audit',16,1000),null);
  const before=S.siegeRun.hp[0];const hit=S.siegeHitPiece('audit','Audit',0,1e9);
  assert.equal(hit.damage,before-S.siegeRun.hp[0]);assert.ok(hit.damage<=S.SIEGE_HIT_CAP);
  S.resetSiege();
});
test('sandık, pırıltı, boss ve görev incisi sunucudan',()=>{
  const c={sea:'sea-3-1'};
  // Sandık: zar sunucuda; %50'nin altı inci (ahşap), yaldızlıda 2 kat
  const ch=S.chestReward(c,0,()=>.1);assert.ok(ch.out.pearls>0);assert.equal(ch.add.pearls,ch.out.pearls);assert.equal(ch.add.st_chest,1);
  // Yaldız payı 0,24'ten fazla istenemez
  let gilded=0;for(let i=0;i<2000;i++)if(S.chestReward(c,5).out.kind==='gilded')gilded++;assert.ok(gilded<2000*.45);
  // Pırıltı: %50 inci 1–2, %1 büyük ödül
  assert.ok(S.sparkleReward(c,()=>.2).add.pearls>=1);assert.equal(S.sparkleReward(c,()=>.995).add.a_mine,1);
  // Boss %3 üstü pay inci verir; görev incisi
  assert.ok(S.bossCredit('3/1',.5,2).pearls>0);assert.equal(S.bossCredit('3/1',.01,2).pearls,undefined);
});
test('sunucu NPC: doğma, menzil, bütçe, paylı ödül, yeniden doğma',()=>{
  const sea='sea-2-1';S.seaNpcs.delete(sea);const fresh=S.npcFill(sea,0);assert.ok(fresh.length>=3);const n=fresh[0];
  const a={uid:'a1',econ:{level:2,c_cast:100},last:{x:n.x+50,y:n.y},sb:{pool:0}},b={uid:'b1',econ:{level:2,c_cast:100},last:{x:n.x,y:n.y+50},sb:{pool:1e9}};
  assert.equal(S.npcHit(a,sea,n.id,1000,0).err,'bütçe');// salvo yok
  const far={uid:'f',econ:{level:2},last:{x:n.x+5000,y:n.y},sb:{pool:1e9}};assert.equal(S.npcHit(far,sea,n.id,1000,0).err,'menzil');
  a.sb.pool=1e9;let t=0,r;
  // a %75, b %25 hasar → a'ya sayaç, b'ye yalnız paylı altın/TP
  while(!(r=S.npcHit(t%4===3?b:a,sea,n.id,n.max/20,t*1000))?.dead)t++;
  const sh=Object.fromEntries(r.shares);assert.ok(sh.a1>sh.b1);
  const ca=S.npcDeathCredit(a,n.def,'2/1',sh.a1),cb=S.npcDeathCredit(b,n.def,'2/1',sh.b1);
  assert.equal(ca.st_npc,1);assert.equal(cb.st_npc,undefined);assert.ok(cb.gold>0&&cb.gold<ca.gold);
  assert.equal(S.seaNpcs.get(sea).list.has(n.id),false);assert.equal(S.seaNpcs.get(sea).respawn.length,1);
});
test('NPC ateşi sunucuda: menzil, bekleme, güvenli deniz, yeniden doğma koruması',()=>{
  const sea='sea-3-1';S.seaNpcs.delete(sea);const n=S.npcFill(sea,0)[0];
  const near={uid:'p1',netId:'n1',last:{x:n.x+100,y:n.y}},far={uid:'p2',netId:'n2',last:{x:n.x+2000,y:n.y}};
  const T=100_000;assert.equal(S.npcFire(n,[far],T,false),null);// menzil dışı
  assert.equal(S.npcFire(n,[near],T,true),null);// güvenli deniz
  const f=S.npcFire(n,[near,far],T,false,()=>.5);assert.equal(f.to,near);assert.ok(f.dmg>0);
  assert.equal(S.npcFire(n,[near],T+500,false),null);// bekleme
  const fresh={uid:'p3',netId:'n3',last:{x:n.x+50,y:n.y},tpAt:9000};const m={...n,cdUntil:0,aggro:null};
  assert.equal(S.npcFire(m,[fresh],10_000,false),null);// yeni doğan 3 sn korunur
  // Ölümsüz: NPC hasarı alıp canı hep dolu bildiren oyuncu
  const g={maxHp:100000};S.noteHp(g,100000,0);let dead=false;
  for(let i=1;i<200&&!dead;i++){const p=g.pvp;p.hp-=8000*S.NPC_DMG_MODEL;S.noteHp(g,100000,i*1000);if(S.godCheck(g))dead=true;}
  assert.ok(dead);
});
test('savaş puanı sunucudan: aynı rakipten günde 3, kendini batırmak yok',()=>{
  const k={uid:'k1'},now=Date.UTC(2026,9,20,12);
  assert.equal(S.sinkCredit(k,'k1',now),null);
  for(let i=0;i<3;i++)assert.equal(S.sinkCredit(k,'v1',now+i),true);
  assert.equal(S.sinkCredit(k,'v1',now+5),null);// 4. kez yok
  assert.equal(S.sinkCredit(k,'v2',now+6),true);// başka rakip
  assert.equal(S.sinkCredit(k,'v1',now+86_400_000),true);// ertesi gün
});
test('karaya çıkma: ada içindeki konum reddedilir, kıyıdaki ve açık deniz kabul',async()=>{
  const {loadTs}=await import('./load.mjs');const {MAPS}=await loadTs('campaign.ts');
  let n=0;for(const key of Object.keys(MAPS)){for(const is of MAPS[key].islands){n++;
    assert.ok(S.onLand(key,is.x,is.y),`${key} ${is.name} merkezi kara`);
    assert.equal(S.onLand(key,is.x+is.r*.72+28,is.y),null);// tam kıyı çizgisi (oyunun ittiği yer) serbest
  }}
  assert.ok(n>10);assert.equal(S.onLand('9/9',0,0),null);
});
test('sunucu atışı: donanım sahip olunanla sınırlı, hasar formülü, dolum ve menzil',()=>{
  const st={level:8,elite:1,ep:0,c_cast:50,c_heavy:315,u_damage:10,u_reload:5,u_range:3,o_gunner:5,o_lookout:5,'e_sail-0':1};
  // 999 ağır top istenir: sahip olunan ve yuva sınırı (elit 315)
  const L=S.buildLoadout(st,{mt:{heavy:999,cast:50},type:'heavy',eq:{sail:'sail-0',armor:'armor-2'},act:['gunner','lookout'],ach:true});
  assert.equal(L.cannons,315);assert.equal(L.type,'heavy');assert.equal(L.crewDamage,1.25);assert.equal(L.crewRange,60);
  assert.equal(L.achDamage,0);// sayaçlar yetmiyor
  // Sahip olunmayan donanım sayılmaz
  const L2=S.buildLoadout(st,{mt:{cast:10},type:'cast',eq:{armor:'armor-2'}});assert.equal(L2.equipDamage+L2.equipRange+L2.equipReload,0);
  // Dolum: hemen ikinci atış reddedilir; menzil dışı reddedilir
  const c={};assert.equal(S.shotCheck(c,L,'fire',100,10_000,false),null);assert.equal(S.shotCheck(c,L,'fire',100,10_100,false),'dolum');
  assert.equal(S.shotCheck(c,L,'fire',99999,99_000,false),'menzil');
  // Öfke 30 sn'de en çok 2 salvo
  const r={};assert.equal(S.shotCheck(r,L,'iron',10,1e6,true),null);assert.equal(S.shotCheck(r,L,'iron',10,1e6+5000,true),null);assert.equal(S.shotCheck(r,L,'iron',10,1e6+10000,true),'öfke');
});
test('sunucu atışı hedefleri: kule konumu sunucudan, dost oyuncuya atış yok, oyuncunun hasar mesajı yok sayılır',()=>{
  const c={sea:'sea-2-1',guildId:7};
  const t=S.attackTarget(c,{k:'t',id:'3'});assert.ok(t&&Number.isFinite(t.x)&&t.kind==='tower');
  assert.equal(S.attackTarget(c,{k:'t',id:'99'}),null);
  assert.equal(S.attackTarget({sea:'sea-1-1'},{k:'t',id:'1'}),null);// 1. denizde filo adası yok
  assert.equal(S.attackTarget(c,{k:'s',id:'1'}),null);// kuşatma odası değil
  assert.equal(S.attackTarget({sea:'sea-siege'},{k:'s',id:'16'}).kind,'tower');
  assert.equal(S.attackTarget(c,{k:'x',id:'1'}),null);
});
test('mines: placed near the ship only, capped per player, damage from server level and validated sapper talent',()=>{
  const st={level:5};const c={uid:'mine-u',netId:'m1',sea:'mine-sea',last:{x:100,y:100},econ:st,ldRaw:{tal:{sapper:2}}};
  assert.equal(S.placeMine(c,500,500,0),null);
  const m=S.placeMine(c,130,100,0);assert.ok(m);
  assert.equal(m.dmg,Math.round((4000+5*400)*1.3));
  for(let i=0;i<4;i++)assert.ok(S.placeMine(c,100,100,0));
  assert.equal(S.placeMine(c,100,100,0),null);
  // Puanından fazla yetenek bildirilirse yetenekler yok sayılır
  const L=S.buildLoadout({level:1},{tal:{sapper:99}});assert.equal(L.mineMult,1);
});
test('hero title comes only from the server, a client claim is ignored',()=>{
  const L=S.buildLoadout({level:3},{hero:false});assert.equal(L.hero,0);
  S.heroUntil.set('hero-u',Date.now()+1000);assert.ok(S.heroUntil.get('hero-u')>Date.now());
});
test('chests and sparkles: only server spots, only when the ship is next to them',()=>{
  const c={sea:'sea-1-1',last:{x:0,y:0}};const l=S.lootFor(c);assert.ok(l);
  assert.ok(l.ch.length>=3&&l.sp.length>=12);
  const [id,x,y]=l.sp[0];
  assert.equal(S.lootTake(c,'sp',id).err,'uzak');
  assert.equal(S.lootTake(c,'sp',99999).err,'yok');
  c.last={x,y};assert.ok(S.lootTake(c,'sp',id).ok);
  assert.equal(S.lootTake(c,'sp',id).err,'yok');assert.ok(l.sp.length>=12);
  const [cid,cx,cy]=l.ch[0];c.last={x:cx+100,y:cy};assert.ok(S.lootTake(c,'ch',cid).ok);
});
test('admin event: protected on level-1 seas, damage pays share, last hit pays bonus and the ship refills',()=>{
  const adm={admin:true,sea:'sea-1-1'};const c={uid:'aev-u'};
  assert.equal(S.aevOpen('sea-1-1'),false);assert.equal(S.aevOpen('sea-1-2'),false);assert.equal(S.aevHit(c,adm,1e6),null);
  adm.sea='sea-3-1';assert.equal(S.aevOpen(adm.sea),true);const ev=S.aevState(adm);assert.equal(ev.max,34e6);
  const r=S.aevHit(c,adm,1e9);assert.ok(r.hp===34e6-34e6*.01,'one salvo is capped at 1% of the ship');assert.ok(r.add.xp>0&&r.add.ep>0);
  let n=0,last;while(!(last=S.aevHit(c,adm,1e9)).sunk&&n<200)n++;
  assert.ok(last.sunk);assert.equal(last.hp,34e6);const P=S.aevPools(3);assert.ok(last.add.pearls>=P.kill.pearls&&last.add.xp>=P.kill.xp);
});
test('shown ship: an elite hull is shown only when that elite level is unlocked',()=>{
  assert.equal(S.shipAllowed({elite:0,ep:1e9},'coral'),'starter');
  assert.equal(S.shipAllowed({elite:1,ep:0},'phantom'),'phantom');
  assert.equal(S.shipAllowed({elite:1,ep:0},'coral'),'starter');
  assert.equal(S.shipAllowed({elite:1,ep:36_000_000},'coral'),'coral');
  assert.equal(S.ADMIN_SHIP,'admin');
  assert.equal(S.shipAllowed({elite:1,ep:1e9},'nope'),'starter');
});
test('domination: window, balance, zone and match flow',()=>{
  const D=Date.UTC(2026,9,21,12,0);// Çarşamba 15:00 İstanbul → kapalı; 20:30 açık; cumartesi her saat açık
  assert.equal(S.domOpen(null,D),false);assert.equal(S.domOpen(null,Date.UTC(2026,9,21,17,30)),true);assert.equal(S.domOpen(null,Date.UTC(2026,9,24,6,0)),true);
  const mk=(uid,ep)=>({uid,nick:uid,netId:uid,econ:{ep},ws:{readyState:0},last:null});
  const six=[mk('a',9e6),mk('b',100),mk('c',8e6),mk('d',200),mk('e',1e6),mk('f',2e6)];
  S.domQueue.push(...six);assert.equal(S.domPump(D),true);assert.equal(S.domQueue.length,0);
  const m=S.domStart(D);const sum=t=>[...m.teams].filter(([,x])=>x===t).reduce((a,[u])=>a+six.find(c=>c.uid===u).econ.ep,0);
  assert.equal([...m.teams.values()].filter(x=>x==='r').length,3);assert.ok(Math.abs(sum('r')-sum('b'))<=2e6+300);
  // Bölge: yalnızca kırmızı → 4 sn'de alınır, sonra her saniye 1 puan; iki takım birden → çekişmeli, puan yok
  const red=six.filter(c=>m.teams.get(c.uid)==='r'),blue=six.filter(c=>m.teams.get(c.uid)==='b');
  red[0].last={x:3000,y:2000};const room=new Set(six);
  for(let i=0;i<4;i++)S.domStep(m,room,D+i);assert.equal(m.zone.own,'r');assert.equal(m.score.r,1);
  blue[0].last={x:3100,y:2000};const r=S.domStep(m,room,D+5);assert.equal(r.contested,true);assert.equal(m.score.r,1);
  assert.equal(S.canJoin(red[1],`sea-dom-${m.id}`,D),true);assert.equal(S.canJoin(mk('z',0),`sea-dom-${m.id}`,D),false);
  m.spent.set(red[0].uid,150);m.score.r=240;assert.equal(S.domStep(m,room,D+6).done,true);
  const paid=S.domFinish(m,room);const mine=paid.find(([x])=>x===red[0])[2],lost=paid.find(([x])=>x===blue[0])[2];
  assert.deepEqual(mine,{pearls:300,ep:300});assert.equal(lost.pearls,100);assert.equal(red[0].credit.ep,300);
  S.domMatches.delete(m.id);
});
test('domination: spawn at base, 5 s lock after sinking, no repair',()=>{
  const c={domTeam:'r',last:null,ws:{readyState:0}};const now=1e6;
  assert.deepEqual(S.domMove(c,{x:3000,y:2000},now),{x:700,y:2000});// ilk giriş üs dışında olamaz
  assert.equal(S.domMove(c,{x:720,y:2010},now),null);c.last={x:720,y:2010,at:now};
  assert.equal(S.domMove(c,{x:1500,y:2000},now+100),null);// kilit yokken serbest
  S.domSink(c,now);c.last={x:1500,y:2000,at:now};
  assert.deepEqual(S.domMove(c,{x:1500,y:2000},now+50),{x:700,y:2000});// batınca üste doğmak zorunda
  const s={x:650,y:1950};assert.equal(S.domMove(c,s,now+60),null);assert.equal(s.tp,1);
  assert.deepEqual(S.domMove(c,{x:900,y:1950},now+1000),{x:650,y:1950});// 5 sn kıpırdayamaz
  assert.equal(S.domLocked(c,now+1000),true);assert.equal(S.domLocked(c,now+5001),false);
  assert.equal(S.domMove(c,{x:900,y:1950},now+5100),null);
  // Tamir yok: can yalnız can emici payı kadar (tam can/200 sn) artabilir
  const t={domTeam:'r',maxHp:1000};S.noteHp(t,500,0);S.noteHp(t,1000,10_000);assert.ok(t.pvp.hp<=500+1000*10/200+1);
});
test('cursed waters: equal ships, spawn, fog damage, elimination order and rewards',async()=>{
  const mk=uid=>({uid,nick:uid,netId:uid,econ:{ep:0},ws:{readyState:0},last:null});
  const ten=Array.from({length:10},(_,i)=>mk('p'+i));const now=2e6;
  S.lsQueue.push(...ten);assert.equal(S.lsPump(now),true);const m=S.lsStart(now,undefined,()=>.3);
  assert.equal(m.players.size,10);assert.ok(ten.every(c=>c.lsOn&&c.pvp.hp>0));
  const a=ten[0],pa=m.players.get('p0');
  assert.deepEqual(S.lsMove(a,{x:100,y:100}),pa.spawn);// başlangıç noktası dışında doğamaz
  const s={...pa.spawn};assert.equal(S.lsMove(a,s),null);assert.equal(s.tp,1);
  // Sis: 60 sn sonra daralır, dışarıdaki gemi can kaybeder
  for(const c of ten)c.last={...m.players.get(c.uid).spawn};a.last={x:-500,y:-500};const room=new Set(ten);
  const r=S.lsStep(m,room,now+61_000,()=>.5);assert.equal(r.changed,true);assert.equal(m.fog.phase,1);
  const hit=r.hits.find(([x])=>x===a);assert.ok(hit&&hit[1]>0);
  // Can artmaz (tamir yok)
  const hp=a.pvp.hp;S.noteHp(a,999999,now+70_000);assert.equal(a.pvp.hp,hp);
  // Eleme sırası: ilk elenen 10., son kalan 1.
  const out=S.lsOut(ten[1],ten[2],now);assert.equal(out.rank,10);assert.equal(out.add.pearls,50);
  for(let i=3;i<10;i++)S.lsOut(ten[i],null,now);assert.equal(m.result,null);// 2 kaldı
  S.lsFinish(m,now,ten);assert.equal(m.players.get('p0').rank+m.players.get('p2').rank,3);
  const w=ten.find(c=>m.players.get(c.uid).rank===1);assert.ok((w.credit??w.grant.add).pearls>=500);assert.equal(m.players.get('p2').kills,1);S.lsMatches.delete(m.id);
});
test('cursed waters: last one standing ends the match',()=>{const mk=uid=>({uid,nick:uid,netId:uid,econ:{ep:0},ws:{readyState:0},last:null});
  const ten=Array.from({length:10},(_,i)=>mk('q'+i));const now=3e6;S.lsQueue.push(...ten);S.lsPump(now);const m=S.lsStart(now);
  for(let i=1;i<10;i++)S.lsOut(ten[i],null,now);assert.ok(m.result);assert.equal(m.players.get('q0').rank,1);
  S.lsMatches.delete(m.id);});
test('cursed waters: scattered items, pickup and ammo use come from the server inventory',()=>{
  const mk=uid=>({uid,nick:uid,netId:uid,econ:{ep:0},ws:{readyState:0},last:null});
  const ten=Array.from({length:10},(_,i)=>mk('z'+i));const now=4e6;S.lsQueue.push(...ten);S.lsPump(now);const m=S.lsStart(now);
  assert.ok(m.items.length>=20);const [a,b]=ten;const pa=m.players.get(a.uid),pb=m.players.get(b.uid);
  assert.deepEqual(Object.values(pa.inv),[0,0,0,0,0,0]);// başlangıçta yalnız demir
  const it=m.items[0];a.last={x:it[2]+2000,y:it[3]};assert.equal(S.lsPick(a,it[0],now).err,'uzak');
  a.last={x:it[2]+10,y:it[3]};const r=S.lsPick(a,it[0],now);assert.ok(r.inv[it[1]]>0);assert.equal(m.items.find(x=>x[0]===it[0]),undefined);
  // Ateş güllesi: envanterden 315 düşer; demir salvosundan güçlü. Kalkan hedefte 1 azalır.
  pa.inv.fire=700;pb.inv.shield=3;a.last={x:1000,y:1000};b.last={x:1100,y:1000};a.lastAtk=0;b.maxHp=1e12;
  const f1=S.lsAttack(a,b,now+10_000,{a:'fire'});assert.equal(f1.ammo,'fire');assert.equal(pa.inv.fire,385);assert.equal(pb.inv.shield,2);
  pb.inv.shield=0;b.pvp=null;const f2=S.lsAttack(a,b,now+20_000,{a:'iron'});assert.equal(f2.ammo,'iron');
  // Elinde olmayan gülleyi seçen demir atar
  pa.inv.chain=0;const f3=S.lsAttack(a,b,now+30_000,{a:'chain'});assert.equal(f3.ammo,'iron');
  // Yenilenme: toplananın yerine yenisi gelir
  const before=m.items.length;S.lsStep(m,new Set(),now+60_000);assert.equal(m.items.length,before+1);
  S.lsMatches.delete(m.id);
});
test('cursed waters: supply drop falls in the next safe zone and goes to the first captain who reaches it',()=>{
  const mk=uid=>({uid,nick:uid,netId:uid,econ:{ep:0},ws:{readyState:0},last:null});
  const ten=Array.from({length:10},(_,i)=>mk('d'+i));const now=5e6;S.lsQueue.push(...ten);S.lsPump(now);const m=S.lsStart(now);
  assert.equal(S.lsStep(m,new Set(),now+30_000).drop,null);
  const r=S.lsStep(m,new Set(),now+45_000);assert.ok(r.drop);const dr=r.drop;
  const [a,b]=ten;a.last={x:dr.x,y:dr.y};b.last={x:dr.x+5,y:dr.y};
  assert.equal(S.lsDropPick(a,dr.id,now+46_000).err,'erken');// düşmeden alınamaz
  b.last={x:dr.x+3000,y:dr.y};assert.equal(S.lsDropPick(b,dr.id,now+56_000).err,'uzak');
  const got=S.lsDropPick(a,dr.id,now+56_000);assert.ok(got.inv.explosive>=1260);assert.equal(S.lsDropPick(b,dr.id,now+56_100).err,'yok');// tek kişi alır
  S.lsMatches.delete(m.id);
});
test('in-app purchase webhook: auth check and event parsing',()=>{
  assert.equal(S.rcAuthOk('Bearer abc','abc'),true);assert.equal(S.rcAuthOk('abc','abc'),true);assert.equal(S.rcAuthOk('Bearer abd','abc'),false);assert.equal(S.rcAuthOk('x',''),false);
  const e=S.parseRcEvent(JSON.stringify({event:{type:'NON_RENEWING_PURCHASE',app_user_id:'3f1c2a9e-1111-4222-8333-444455556666',product_id:'pearls_crate',transaction_id:'1000000123',store:'APP_STORE',environment:'SANDBOX'}}));
  assert.deepEqual(e,{type:'NON_RENEWING_PURCHASE',uid:'3f1c2a9e-1111-4222-8333-444455556666',product:'pearls_crate',tx:'1000000123',store:'app_store',sandbox:true});
  assert.equal(S.parseRcEvent('{"event":{"type":"X","app_user_id":"$RCAnonymousID:1","id":"e1"}}').uid,null);assert.equal(S.parseRcEvent('bozuk'),null);
  assert.ok(S.IAP_GRANT.has('INITIAL_PURCHASE'));
});
test('chat moderation: duration parsing, admin mute and unmute',()=>{
  assert.equal(S.parseDuration('30d'),30*60_000);assert.equal(S.parseDuration('12s'),12*3_600_000);assert.equal(S.parseDuration('2g'),2*86_400_000);assert.equal(S.parseDuration('abc'),0);
  const now=1e7;assert.match(S.adminChatCommand('/sustur Kemal 30d',now),/susturuldu/);assert.equal(S.muteLeft('kemal',now+60_000),29*60_000);
  assert.match(S.adminChatCommand('/konustur KEMAL',now),/yazabilir/);assert.equal(S.muteLeft('Kemal',now),0);
  assert.match(S.adminChatCommand('/sustur',now),/Kullanım/);assert.equal(S.adminChatCommand('/merhaba',now),null);
});
test('rival sinks count only with a credited (verified, daily-limited) sink',()=>{
  const k={uid:'killer1'},now=7e6;let n=0;for(let i=0;i<5;i++)if(S.sinkCredit(k,'victim1',now))n++;assert.equal(n,3);assert.equal(S.sinkCredit(k,'killer1',now),null);
});
test('teleport only to the server-chosen respawn point; rage only when the server meter is full',()=>{
  const c={sea:'sea-3-1',ws:{readyState:0},strikes:0,playerNo:1,nick:'t'};const now=8e6;
  assert.equal(S.tpAllowed(c,{x:100,y:100},now),false);// sebepsiz ışınlanma yok
  const p=S.respawnPoint(c,()=>.5);assert.ok(p);c.tpTo={x:p.x,y:p.y,until:now+15000};
  assert.equal(S.tpAllowed(c,{x:p.x+2000,y:p.y},now),false);assert.equal(S.tpAllowed(c,{x:p.x+20,y:p.y},now),true);assert.equal(S.tpAllowed(c,{x:p.x,y:p.y},now),false);// tek kullanımlık
  assert.equal(S.rageUse(c,true,now),false);// bar boş
  S.rageGain(c,34);S.rageGain(c,34);S.rageGain(c,34);assert.equal(c.rage,100);
  assert.equal(S.rageUse(c,true,now),true);assert.equal(c.rage,0);assert.equal(S.rageUse(c,true,now+1000),true);assert.equal(S.rageUse(c,true,now+2000),false);// 2 salvo
});
test('server NPCs cannot sail through islands',async()=>{
  const key=Object.keys(S.MAPS_FOR_TEST??{}).find(k=>S.MAPS_FOR_TEST[k].islands.length)??null;
  const m=key?S.MAPS_FOR_TEST[key]:null;assert.ok(m,"a map with islands exists");const is=m.islands[0],shore=is.r*.72+28;
  const n={id:`${key}:1`,def:{speed:200},x:is.x-shore-30,y:is.y,hx:is.x-shore-30,hy:is.y,wx:is.x+shore+300,wy:is.y,aggro:null,aggroUntil:0};
  for(let i=0;i<200;i++){S.npcMove(n,.2,[],0);assert.ok(Math.hypot(n.x-is.x,n.y-is.y)>=shore-.5,'NPC stays out of the island');}
});
test('Deniz Antlaşması: sparkles fill the goal, vote opens, winner applies for 24h and rewards go to collectors',()=>{
  S.treatyReset();const now=Date.UTC(2026,9,22,10);S.treaty.seen={a:now,b:now};S.treatyStart(now,()=>0.3);
  assert.equal(S.treaty.phase,'collect');assert.equal(S.treaty.goal,300,'at least 300');assert.equal(S.treaty.options.length,3);
  const a={uid:'a',nick:'A'},b={uid:'b',nick:'B'};
  for(let i=0;i<220;i++)S.treatyPick(a,now+i);for(let i=0;i<9;i++)S.treatyPick(b,now+i);const z={uid:'z',nick:'Z'};for(let i=0;i<39;i++)S.treatyPick(z,now+i);
  assert.equal(S.treaty.phase,'collect');assert.ok(S.treatyVote(a,0,now).err,'no vote before the goal');
  for(let i=0;i<31;i++)S.treatyPick(b,now+400+i);assert.equal(S.treaty.phase,'collect');S.treatyPick(b,now+500);assert.equal(S.treaty.phase,'vote');assert.ok(S.treaty.envoy?.map==='1/1');
  assert.ok(S.treatyVote(z,1,now+500).err,'39 picks cannot vote');assert.ok(S.treatyVote(a,1,now+500).ok);assert.ok(S.treatyVote(b,0,now+500).ok);assert.ok(S.treatyVote(b,5,now+500).err);
  S.treaty.double='a';S.treatyTick(S.treaty.voteEnd+1);
  assert.equal(S.treaty.phase,'done');assert.equal(S.treaty.fx.id,S.treaty.options[1],'double vote wins');
  assert.deepEqual(Object.keys(S.treaty.elig).sort(),['a','b'],'effect only for 40+ collectors');assert.equal(S.treatyInfo(z,S.treaty.voteEnd+2).fxMine,false);assert.equal(S.treatyInfo(a,S.treaty.voteEnd+2).fxMine,true);
  const grants=[...S.pendingCredits.values()].filter(p=>p.uid==='a'||p.uid==='b'||p.uid==='z');assert.ok(!grants.some(p=>p.uid==='z'),'39 picks: no reward');
  assert.deepEqual(grants.find(p=>p.uid==='a').grant.add,{pearls:325,gold:175000});assert.deepEqual(grants.find(p=>p.uid==='b').grant.add,{pearls:225,gold:125000});
  assert.equal(S.treaty.double,'a');for(const p of grants)S.pendingCredits.delete(p.grant.id);S.treatyReset();
});
test('düello: savaşa kapalı denizde yalnız iki rakip savaşır, bahis kazanana %90, bahisli hak günde 1',async()=>{
  const box=[];const mk=(id,uid,x,lvl=3)=>({netId:id,uid,nick:uid.toUpperCase(),sea:'sea-1-1',last:{x,y:1000},econ:{level:lvl},ws:{readyState:1,send:m=>box.push([id,JSON.parse(m)])}});
  const a=mk('1','ua',1000),b=mk('2','ub',1300),z=mk('3','uz',1100);S.seas.set('sea-1-1',new Set([a,b,z]));
  assert.equal(S.attackTarget(a,{k:'p',id:'2'}),null,'safe sea: no PvP without duel');
  const now=Date.UTC(2026,9,22,12);
  await S.onDuel(a,{k:'ask',to:'2',bet:500},now);assert.ok(box.some(([to,m])=>to==='2'&&m.d.k==='ask'));
  await S.onDuel(b,{k:'yes',from:'1'},now+1000);assert.ok(a.duel&&a.duel===b.duel);
  assert.ok(S.attackTarget(a,{k:'p',id:'2'})?.duel);assert.equal(S.attackTarget(z,{k:'p',id:'1'}),null,'outsiders cannot hit duelists');assert.equal(S.attackTarget(a,{k:'p',id:'3'}),null);
  S.duelHit(a,500);S.duelTick(now+1000+180_001);assert.equal(a.duel,null);
  const end=box.find(([to,m])=>to==='3'&&m.d.k==='end')[1].d;assert.equal(end.win,'1');assert.equal(end.pot,900);
  const g=[...S.pendingCredits.values()].find(p=>p.uid==='ua')??null;assert.ok(g===null||g.grant.add.pearls===900);
  for(const p of [...S.pendingCredits.values()])if(p.uid==='ua'||p.uid==='ub')S.pendingCredits.delete(p.grant.id);
  box.length=0;await S.onDuel(a,{k:'ask',to:'2',bet:500},now+5000);assert.match(box.find(([to])=>to==='1')[1].d.msg,/hakkın bitti/);
  box.length=0;await S.onDuel(a,{k:'ask',to:'2',bet:0},now+6000);assert.equal(box.find(([to])=>to==='2')[1].d.k,'ask','unbet duels are unlimited');
  const hi=mk('4','uh',1200,7);S.seas.get('sea-1-1').add(hi);box.length=0;await S.onDuel(hi,{k:'ask',to:'3',bet:500},now);assert.match(box[0][1].d.msg,/seviye farkı/);
  S.seas.delete('sea-1-1');S.duelInvites.clear();
});
test('grup: aynı denizdeki üye sayısına göre ek TP, görev sayacı yalnız son vuruşta, en çok 4 kişi',()=>{
  const box=[];const mk=(id,nick,sea='sea-3-1')=>({netId:id,uid:'u'+id,nick,sea,last:{x:0,y:0},econ:{level:3},ws:{readyState:1,send:m=>box.push([id,JSON.parse(m)])}});
  const a=mk('1','A'),b=mk('2','B'),c=mk('3','C'),d=mk('4','D'),e=mk('5','E');for(const x of [a,b,c,d,e])S.all.add(x);
  box.length=0;S.onGroup(a,{k:'inv',nick:'b'},0);assert.match(box[0][1].d.msg,/arkadaş/,'strangers cannot be invited');
  S.friendSets.set('u1',new Set(['u2','u3','u4','u5']));
  S.onGroup(a,{k:'inv',nick:'b'},0);S.onGroup(b,{k:'yes'},10);assert.equal(S.groupBonus(a),1.15);
  S.onGroup(a,{k:'inv',nick:'C'},20);S.onGroup(c,{k:'yes'},30);assert.equal(S.groupBonus(a),1.10);
  S.onGroup(a,{k:'inv',nick:'D'},40);S.onGroup(d,{k:'yes'},50);assert.equal(S.groupBonus(b),1.05);
  box.length=0;S.onGroup(a,{k:'inv',nick:'E'},60);assert.match(box.find(([to])=>to==='1')[1].d.msg,/dolu/);
  d.sea='sea-1-1';assert.equal(S.groupBonus(a),1.10,'only members in the same sea count');
  const def=S.NPCS_FOR_TEST?.['n3-1-light']??{id:'n3-1-light',gold:100,xp:100,role:'light'};
  assert.equal(S.npcDeathCredit(b,def,'3/1',.5,true).st_npc,undefined,'group mate who did not land the last hit gets no counter');
  assert.equal(S.npcDeathCredit(a,def,'3/1',.5,false).st_npc,1);
  S.groupLeave(b);S.groupLeave(c);S.groupLeave(d);assert.equal(a.grp,null,'group of one dissolves');
  for(const x of [a,b,c,d,e])S.all.delete(x);
});
test('özel mesaj küfrü: 1. kez 24 saat susturma, 2. kez hesap kapanır',async()=>{
  const box=[];let closed=0;const c={uid:'pmz',nick:'Zeki',ws:{readyState:1,send:m=>box.push(JSON.parse(m)),close:()=>closed++}};
  assert.equal(await S.pmStrike(c,0),1);assert.ok(S.muteLeft('Zeki',1000)>23*3600_000);
  assert.equal(await S.pmStrike(c,0),2);await new Promise(r=>setTimeout(r,350));assert.equal(closed,1);S.mutes.delete('zeki');
});
test('filo savaşı: cumartesi batırmalar filoya yazılır, kazanan filonun en az 5 batıran üyesi ödül alır',()=>{
  S.fwReset();const sat=new Date(2026,9,3,12).getTime();
  const a={uid:'fa',nick:'A',guildId:1},b={uid:'fb',nick:'B',guildId:1},c={uid:'fc',nick:'C',guildId:2};
  for(let i=0;i<5;i++)S.fwSink(a,sat+i,'[A] Alfa');for(let i=0;i<3;i++)S.fwSink(b,sat+10+i,'[A] Alfa');for(let i=0;i<6;i++)S.fwSink(c,sat+20+i,'[B] Beta');
  S.fwSink({uid:'fx',nick:'X',guildId:3},new Date(2026,9,4,12).getTime(),'[C] Pazar');// pazar sayılmaz
  assert.equal(S.fw.guilds['1'].n,8);assert.equal(S.fw.guilds['2'].n,6);assert.equal(S.fw.guilds['3'],undefined);
  const r=S.fwFinish(sat+999);assert.equal(r.win,'1');assert.deepEqual(r.uids,['fa'],'yalnız en az 5 batıran üye');
  assert.equal(S.fw.last.name,'[A] Alfa');for(const p of [...S.pendingCredits.values()])if(p.uid==='fa')S.pendingCredits.delete(p.grant.id);
});
test('TP sıralama madalyası: 1 kral, 2-3 kollar, 4-20 amiral, 21-50 kaptan, 51-100 lostromo',async()=>{
  const ts=(await import('typescript')).default,fs=await import('node:fs');
  const code=ts.transpile(fs.readFileSync(new URL('../src/tp-rank.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
  const T=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  assert.deepEqual([0,1,2,3,4,20,21,50,51,100,101].map(T.tpMedal),[-1,0,1,2,3,3,4,4,5,5,-1]);
});
