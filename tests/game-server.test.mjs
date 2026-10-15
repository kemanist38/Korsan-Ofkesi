import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
const S=await import('../server/game-server.mjs');
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
