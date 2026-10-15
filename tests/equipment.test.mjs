import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpile(readFileSync(new URL('../src/equipment.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const E=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('four slots × two kinds: common for gold, epic for pearls and stronger',()=>{
  assert.equal(E.EQUIPMENT.length,8);
  for(const s of E.EQUIP_SLOTS){const items=E.EQUIPMENT.filter(e=>e.slot===s.id).sort((a,b)=>a.rarity-b.rarity);assert.equal(items.length,2);
    assert.equal(items[0].price.currency,'gold');assert.equal(items[1].price.currency,'pearls');assert.equal(items[1].rarity,2);
    const val=e=>Object.values(e.stats).reduce((a,b)=>a+b,0);assert.ok(val(items[1])>val(items[0]));}
});
test('equipped totals add up per stat',()=>{
  const t=E.equipTotals({sail:'sail-2',armor:'armor-0',carriage:'carriage-2',figure:null});
  assert.equal(t.speed,.16);assert.equal(t.hp,.06);assert.equal(t.reload,.14);assert.equal(t.range,40);assert.equal(t.damage,0);
});
