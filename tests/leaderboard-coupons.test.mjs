import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const load=async(file,replace=s=>s)=>{const code=ts.transpile(replace(readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8')),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);};
// leaderboard.ts yalnızca LEVEL_XP'yi kullanır; campaign.ts'nin bağımlılıkları yerine tablo doğrudan verilir
const LEVEL_XP=[0,74000,242000,753000,2054000,4363000,6161000,10542000];
const L=await load('leaderboard.ts',s=>s.replace(/import \{LEVEL_XP\} from '.\/campaign';/,`const LEVEL_XP=${JSON.stringify(LEVEL_XP)};`));
const C=await load('coupons.ts');
globalThis.localStorage??={getItem:()=>null,setItem:()=>{}};

const p=(nick,o)=>({nick,tag:null,fleet:null,level:1,xp:0,ep:0,sp:0,npc:0,monster:0,boss:0,treasure:0,...o});
test('total XP adds the thresholds of passed levels',()=>{
  assert.equal(L.totalXp(1,500),500);
  assert.equal(L.totalXp(3,10),74000+242000+10);
});
test('player boards sort high to low and share ranks on ties',()=>{
  const rows=L.rankRows('sp',[p('A',{sp:10}),p('B',{sp:50}),p('C',{sp:10}),p('D',{sp:1})],[]);
  assert.deepEqual(rows.map(r=>[r.rank,r.name]),[[1,'B'],[2,'A'],[2,'C'],[4,'D']]);
  const xp=L.rankRows('xp',[p('Low',{level:2,xp:0}),p('High',{level:1,xp:73999})],[]);
  assert.equal(xp[0].name,'Low','a higher level outranks more XP inside a lower level');
});
test('fleet boards sum their members',()=>{
  const a=p('A',{sp:100,xp:5,ep:7}),b=p('B',{sp:20,xp:6,ep:1});
  const rows=L.rankRows('fleetSp',[],[{tag:'X',name:'X',members:[a,b],islands:2},{tag:'Y',name:'Y',members:[p('C',{sp:500})],islands:0}]);
  assert.deepEqual(rows.map(r=>[r.name,r.score]),[['Y',500],['X',120]]);
  assert.equal(L.rankRows('fleetXp',[],[{tag:'X',name:'X',members:[a,b],islands:0}])[0].score,11);
  assert.equal(L.rankRows('fleetIslands',[],[{tag:'X',name:'X',members:[a],islands:2}])[0].score,2);
});
test('coupon codes are checked by hash, once, and until their last day',async()=>{
  const h=await C.hashCode('PIRATERAGE');assert.ok(C.COUPONS.some(c=>c.hash===h),'beta welcome code is listed');
  const list=[{hash:await C.hashCode('ETKINLIK1'),reward:{pearls:5},until:'2026-10-10',note:''}],used=[];
  assert.equal((await C.redeem('nope',used,'2026-10-01',list)).ok,false);
  const r=await C.redeem('  etkinlik1 ',used,'2026-10-10',list);assert.ok(r.ok,'case and spaces are ignored, last day counts');
  assert.equal((await C.redeem('ETKINLIK1',used,'2026-10-10',list)).error,'Bu kuponu zaten kullandın');
  assert.equal((await C.redeem('ETKINLIK1',[],'2026-10-11',list)).error,'Bu kuponun süresi dolmuş');
  assert.equal(C.rewardText({pearls:100,gold:50000,vipDays:3}),'100 İnci · 50.000 Altın · 3 gün VİP');
});
