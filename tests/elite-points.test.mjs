import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';

const A=await loadTs('arsenal.ts');

test('elite levels rise with elite points and cap at 15',()=>{
  // Eşikler 25.000 … 5.000.000 tablosunun 0,72 katı (src/economy.ts ELITE_THRESHOLD_SCALE)
  assert.equal(A.eliteLevelFromEp(0),1);assert.equal(A.eliteLevelEp(2),18000);
  assert.equal(A.eliteLevelFromEp(17999),1);assert.equal(A.eliteLevelFromEp(18000),2);
  for(let l=2;l<=A.ELITE_MAX_LEVEL;l++)assert.ok(A.eliteLevelEp(l)>A.eliteLevelEp(l-1),'thresholds increase');
  assert.equal(A.eliteLevelFromEp(1e9),A.ELITE_MAX_LEVEL);
  assert.equal(A.eliteLevelEp(15),3600000);assert.equal(A.eliteLevelFromEp(3599999),14);assert.equal(A.eliteLevelFromEp(3600000),15);
  for(let l=3;l<=A.ELITE_MAX_LEVEL;l++)assert.ok(A.eliteLevelEp(l)-A.eliteLevelEp(l-1)>=A.eliteLevelEp(l-1)-A.eliteLevelEp(l-2),'each step costs at least as much as the one before');
});
test('only pearl ammo earns elite points; pricier balls cost more pearls',()=>{
  const order=['fire','breaker','explosive','leech'];
  for(const k of order){assert.equal(A.AMMO_PRICES[k].currency,'pearls');assert.ok(A.ELITE_POINTS_PER_BALL[k]>0);}
  for(let i=1;i<order.length;i++)assert.ok(A.AMMO_PRICES[order[i]].amount>A.AMMO_PRICES[order[i-1]].amount);
  assert.equal(A.ELITE_POINTS_PER_BALL.chain,undefined);
});
