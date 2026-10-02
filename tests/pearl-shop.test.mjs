import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpile(readFileSync(new URL('../src/pearlShop.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const P=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('bigger pearl packs cost more but give more pearls per lira',()=>{
  const packs=P.PEARL_PACKS;assert.ok(packs.length>=5);
  for(let i=1;i<packs.length;i++){
    assert.ok(packs[i].price>packs[i-1].price);assert.ok(P.packTotal(packs[i])>P.packTotal(packs[i-1]));
    assert.ok(P.pearlsPerLira(packs[i])>P.pearlsPerLira(packs[i-1]),`${packs[i].id} is better value`);}
  assert.equal(new Set(packs.map(p=>p.id)).size,packs.length);
});
test('VIP packs last 1, 3 and 6 months and stack on top of the time left',()=>{
  assert.deepEqual(P.VIP_PACKS.map(p=>p.months),[1,3,6]);
  const now=1_000_000,day=P.VIP_DAY_MS;
  const a=P.extendVip(0,1,now);assert.equal(a,now+30*day);assert.ok(P.vipActive(a,now));assert.equal(P.vipDaysLeft(a,now),30);
  const b=P.extendVip(a,3,now+10*day);assert.equal(b,a+90*day,'adds to the remaining time');
  assert.ok(!P.vipActive(a,a));assert.equal(P.VIP_XP_BONUS,.1);
});
