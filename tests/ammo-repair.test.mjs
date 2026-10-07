import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';
globalThis.localStorage??={getItem:()=>null,setItem:()=>{}};
const A=await loadTs('arsenal.ts');

test('only iron, chain, fire, tower breaker and leech remain',()=>{
  assert.deepEqual(Object.keys(A.SPECIAL_AMMO).sort(),['breaker','fire','leech']);
  assert.deepEqual(Object.keys(A.AMMO_PRICES).sort(),['breaker','chain','fire','leech']);
  assert.ok(A.FIRE_NPC_FACTOR>1);assert.ok(A.SPECIAL_AMMO.breaker.towerFactor>2);
  assert.ok(A.CHAIN_SLOW.factor<1&&A.CHAIN_SLOW.seconds>0);
});
test('leech heals only on a lucky hit, less from players, capped by own max HP',()=>{
  assert.equal(A.leechHeal(10_000,false,100_000,.5),0,'no proc on an unlucky roll');
  assert.equal(A.leechHeal(10_000,false,1_000_000,.1),3000);
  assert.equal(A.leechHeal(10_000,true,1_000_000,.1),1500,'half as much from players');
  assert.equal(A.leechHeal(100_000,true,100_000,.1),2000,'never more than 2% of own max HP');
  // ortalama: oyuncuya verilen hasarın çok küçük bir kısmı geri gelir
  let sum=0;for(let i=0;i<1000;i++)sum+=A.leechHeal(10_000,true,1e9,i/1000);assert.ok(sum/(1000*10_000)<.04);
});
test('repair adds a fixed amount per second, bonuses capped',()=>{
  assert.equal(A.repairAmount(1),1500);assert.equal(A.repairAmount(5),Math.round(1500*1.7));assert.equal(A.repairAmount(.5),1500);
});
