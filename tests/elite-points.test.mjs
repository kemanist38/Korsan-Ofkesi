import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';

const A=await loadTs('arsenal.ts');

test('elite levels rise with elite points and cap at 15',()=>{
  assert.equal(A.eliteLevelFromEp(0),1);assert.equal(A.eliteLevelEp(2),50000);
  assert.equal(A.eliteLevelFromEp(49999),1);assert.equal(A.eliteLevelFromEp(50000),2);
  for(let l=2;l<=A.ELITE_MAX_LEVEL;l++)assert.ok(A.eliteLevelEp(l)>A.eliteLevelEp(l-1),'thresholds increase');
  assert.equal(A.eliteLevelFromEp(1e9),A.ELITE_MAX_LEVEL);
  assert.equal(A.eliteLevelEp(15),36000000);assert.equal(A.eliteLevelFromEp(35999999),14);assert.equal(A.eliteLevelFromEp(36000000),15);
  for(let l=3;l<=A.ELITE_MAX_LEVEL;l++)assert.ok(A.eliteLevelEp(l)-A.eliteLevelEp(l-1)>=A.eliteLevelEp(l-1)-A.eliteLevelEp(l-2),'each step costs at least as much as the one before');
});
test('every bought ammo is pearl-priced and earns elite points; pricier balls cost more pearls',()=>{
  const order=['chain','fire','breaker','explosive','leech'];
  for(const k of order){assert.equal(A.AMMO_PRICES[k].currency,'pearls');assert.ok(A.ELITE_POINTS_PER_BALL[k]>0);}
  for(let i=1;i<order.length;i++){assert.ok(A.AMMO_PRICES[order[i]].amount>A.AMMO_PRICES[order[i-1]].amount);assert.ok(A.ELITE_POINTS_PER_BALL[order[i]]>=A.ELITE_POINTS_PER_BALL[order[i-1]],'pricier ball never gives less EP');}
  for(const k of order)assert.ok(Number.isInteger(A.ELITE_POINTS_PER_BALL[k])&&A.ELITE_POINTS_PER_BALL[k]<=2,'1 or 2 EP per ball');
});
