import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const code=ts.transpile(readFileSync(new URL('../src/events.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const E=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
// 2026-10-03 Cumartesi, 04 Pazar, 05 Pazartesi, 06 Salı, 07 Çarşamba
const day=n=>new Date(2026,9,n,12,0,0);
test('each weekday gives its own bonus',()=>{
  assert.equal(E.spMult(day(3)),2);assert.equal(E.xpMult(day(3)),1);
  assert.equal(E.xpMult(day(4)),1.5);assert.equal(E.spMult(day(4)),1);
  assert.equal(E.epMult(day(5)),1.5);
  assert.equal(E.bossKillsNeeded(200,day(6)),100);assert.equal(E.bossKillsNeeded(200,day(5)),200);
  assert.equal(E.goldMult(day(7)),1.5);assert.equal(E.goldMult(day(8)),1);
  assert.equal(E.sparkleMult(day(8)),2);assert.equal(E.sparkleMult(day(7)),1);
  assert.equal(E.dayEvent(day(9)).id,'siege','Cuma Büyük Kuşatma');
});
test('time left until midnight',()=>{
  assert.equal(E.untilMidnight(new Date(2026,9,3,18,48)),'5 sa 12 dk');
  assert.equal(E.untilMidnight(new Date(2026,9,3,23,30)),'30 dk');
});
