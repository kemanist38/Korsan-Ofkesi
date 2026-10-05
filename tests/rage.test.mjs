import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpile(readFileSync(new URL('../src/rage.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const R=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('rage fills from hits and kills, then gives two stronger salvos',()=>{
  const r=R.newRage();assert.ok(!R.rageReady(r));
  R.gainRage(r,R.rageFromHit(500,1000));assert.equal(r.meter,60);
  assert.ok(!R.startRage(r),'cannot start before the bar is full');
  R.gainRage(r,R.RAGE_PER_KILL*5);assert.equal(r.meter,R.RAGE_MAX);assert.ok(R.rageReady(r));
  assert.ok(R.startRage(r));assert.equal(r.meter,0);assert.ok(R.rageActive(r));
  R.gainRage(r,50);assert.equal(r.meter,0,'no filling while raging');
  assert.equal(R.rageSalvo(r),1.25);assert.equal(R.rageSalvo(r),1.25);assert.equal(R.rageSalvo(r),1);
  assert.ok(!R.rageActive(r));
});
test('rage fades after ten seconds even without firing',()=>{
  const r=R.newRage();R.gainRage(r,100);R.startRage(r);R.tickRage(r,9.9);assert.ok(R.rageActive(r));R.tickRage(r,.2);assert.ok(!R.rageActive(r));assert.equal(R.rageSalvo(r),1);
});
