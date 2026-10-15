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
