import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function moduleAt(path,extra={}){
  const context=vm.createContext({exports:{},...extra});
  vm.runInContext(ts.transpile(readFileSync(new URL(path,import.meta.url),'utf8'),{module:ts.ModuleKind.CommonJS}),context);
  return context.exports;
}
const battle=moduleAt('../src/battle.ts');

test('sinking ships grants more SP for harder targets and deeper seas',()=>{
  assert.equal(battle.spReward('light',1),1);
  assert.ok(battle.spReward('heavy',1)>battle.spReward('light',1));
  assert.ok(battle.spReward('rival',1)>battle.spReward('heavy',1));
  assert.equal(battle.spReward('rival',8),8*battle.spReward('rival',1));
});
test('battle rank follows total SP and caps at the last rank',()=>{
  assert.equal(battle.battleRank(0).name,'Tayfa');
  assert.equal(battle.battleRank(499).name,'Tayfa');
  assert.equal(battle.battleRank(500).name,'Lostromo');
  assert.equal(Math.round(battle.battleRank(1250).pct),50);
  const top=battle.battleRank(10_000_000);assert.equal(top.next,null);assert.equal(top.pct,100);
});
test('a destroyed tower slot stays a ruin for one hour',()=>{
  const store={};const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
  const c=moduleAt('../src/conquest.ts',{localStorage});
  const r=c.loadRuins(),t0=1_000_000;
  assert.equal(c.ruinLeft(r,'3/1',4,t0),0);
  c.markRuin(r,'3/1',4,t0);
  assert.equal(c.ruinLeft(r,'3/1',4,t0+10*60_000),50*60_000);
  assert.equal(c.ruinLeft(r,'3/1',4,t0+c.TOWER_REBUILD_MS),0);
  assert.equal(c.ruinLeft(c.loadRuins(),'3/1',4,t0+1),c.TOWER_REBUILD_MS-1);
  assert.equal(c.ruinLabel(50*60_000),'50 dk');
});
