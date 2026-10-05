import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpile(readFileSync(new URL('../src/rage.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const R=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('rage fills from hits and kills, then gives two stronger salvos',()=>{
  const r=R.newRage();assert.ok(!R.rageReady(r));
  R.gainRage(r,R.RAGE_PER_RIVAL*2);assert.equal(r.meter,68);
  assert.ok(!R.startRage(r),'cannot start before the bar is full');
  R.gainRage(r,R.RAGE_PER_RIVAL);assert.equal(r.meter,R.RAGE_MAX,'three rival sinks fill the bar');assert.ok(R.rageReady(r));
  const b=R.newRage();R.gainRage(b,R.RAGE_PER_BOSS*2);assert.ok(R.rageReady(b),'two bosses fill the bar');
  assert.ok(R.startRage(r));assert.equal(r.meter,0);assert.ok(R.rageActive(r));
  R.gainRage(r,50);assert.equal(r.meter,0,'no filling while raging');
  assert.equal(R.rageSalvo(r),1.25);assert.equal(R.rageSalvo(r),1.25);assert.equal(R.rageSalvo(r),1);
  assert.ok(!R.rageActive(r));
});
test('rage fades after five seconds even without firing',()=>{
  const r=R.newRage();R.gainRage(r,100);R.startRage(r);R.tickRage(r,4.9);assert.ok(R.rageActive(r));R.tickRage(r,.2);assert.ok(!R.rageActive(r));assert.equal(R.rageSalvo(r),1);
});
