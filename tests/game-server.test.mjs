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
  assert.equal(S.checkState(prev,{x:9000,y:0,hp:1},100),'ok');
  assert.equal(S.checkState(prev,{x:'a',y:0,hp:1},100),'bad');
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
  assert.equal(S.hpCap(null),Infinity);
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
  const st={level:3,u_damage:0,c_cast:100};const c={sea:'sea-3-1',econ:st};
  // Salvo bildirmeden batırma: mermi yok
  assert.equal(S.killCredit(c,'n3-1-light',0).err,'mermi');
  // 100 ateş güllesi salvosu: kullanım sayılır, bütçe dolar
  const r=S.noteSalvo(c,{a:'fire',n:100,i:0,p:1});assert.equal(r.use.cn_a_fire,100);assert.equal(r.use.cn_a_powder,1);assert.equal(r.over,false);
  assert.ok(S.killCredit(c,'n3-1-light',0).add);
  // 1000 top yalanı kırpılır ve işaretlenir
  const big=S.noteSalvo(c,{a:'iron',n:1000,i:0});assert.equal(big.over,true);assert.ok(big.use.cn_iron<=105);
  // Bekleme süresi: hız iksiri 20 sn dolmadan (yetenekle en kısa 21 sn) ikinci kez erken sayılır
  assert.equal(S.noteUse(c,'speed',0).early,false);assert.equal(S.noteUse(c,'speed',5000).early,true);assert.equal(S.noteUse(c,'speed',40000).early,false);
  assert.equal(S.noteUse(c,'speed',40000).use.cn_a_speed,1);
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
  assert.ok(S.questCredit(c,'q2/1-sparkle',0).add);
  // Boss: pay yoksa ödül yok, %3 altı EP yok
  assert.equal(S.bossCredit('2/1',0,3),null);assert.equal(S.bossCredit('2/1',.02,3).ep,undefined);assert.ok(S.bossCredit('2/1',.5,3).ep>0);
  assert.ok(S.siegeCredit(100000,4,8).gold>0);
});
