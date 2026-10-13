import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

globalThis.localStorage??={_:{},getItem(k){return this._[k]??null;},setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
const code=ts.transpile(readFileSync(new URL('../src/auction.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const A=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('every hour has the same 4 distinct lots for all players: one cannon, one ammo, one supply',()=>{
  for(let h=490000;h<490200;h++){const lots=A.lotsFor(h);assert.equal(lots.length,4);assert.equal(new Set(lots.map(l=>l.key)).size,4);
    for(const k of ['cannon','ammo','supply'])assert.ok(lots.some(l=>l.kind===k));assert.deepEqual(A.lotsFor(h),lots);}
});
test('highest bid wins, outbid gold is refunded, lower or equal-later bids are rejected',()=>{
  const h=490001,lot=A.lotsFor(h)[0],s=A.emptyAuction(h),bid=(id,amount,at)=>({hour:h,lot:lot.key,amount,id,at});lot.start=20000;
  assert.equal(A.minNextBid(lot),1);
  assert.deepEqual(A.applyBid(s,bid('me',lot.start,1),'me'),{accepted:true,refund:0});s.mine[lot.key]=lot.start;
  assert.equal(A.minNextBid(lot,s.top[lot.key]),21000);
  assert.equal(A.applyBid(s,bid('other',lot.start,2),'me').accepted,false);
  assert.deepEqual(A.applyBid(s,bid('other',lot.start+5000,3),'me'),{accepted:true,refund:lot.start});
  assert.equal(s.mine[lot.key],undefined);assert.equal(A.wonLots(s,'me').length,0);assert.equal(A.wonLots(s,'other').length,0);
  assert.equal(A.applyBid(s,bid('x',999,4),'me').accepted,false);
  assert.equal(A.applyBid({...s,hour:h+1},bid('x',9e9,5),'me').accepted,false);
});
test('my top bid at the end of the hour wins the lot',()=>{
  const h=490002,lot={...A.lotsFor(h)[1],start:5000},s=A.emptyAuction(h);
  A.applyBid(s,{hour:h,lot:lot.key,amount:lot.start,id:'me',at:1},'me');s.mine[lot.key]=lot.start;
  assert.deepEqual(A.wonLots(s,'me').map(l=>l.key),[lot.key]);
});
