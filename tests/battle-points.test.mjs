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
const mem=()=>{const store={};return{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};};
const battle=moduleAt('../src/battle.ts',{localStorage:mem()});

test('a rival player gives the same 25 SP on every map',()=>{
  assert.equal(battle.RIVAL_SP,25);
  assert.equal(battle.RIVAL_DAILY_LIMIT,3);
});
test('the same rival gives SP at most three times a day',()=>{
  const b=moduleAt('../src/battle.ts',{localStorage:mem()}),log=b.loadRivalLog();
  assert.deepEqual([1,2,3,4].map(()=>b.claimRivalSp(log,'ADM_AHMET','2026-10-01')),[true,true,true,false]);
  assert.equal(b.claimRivalSp(log,'ADM_YASİN','2026-10-01'),true,'başka oyuncu ayrı sayılır');
  assert.equal(b.claimRivalSp(log,'ADM_AHMET','2026-10-02'),true,'ertesi gün sıfırlanır');
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
  c.clearRuins(r,'3/1');assert.equal(c.ruinLeft(r,'3/1',4,t0+1),0,'ele geçirince kule hemen dikilir');
});
