import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

import {loadTs} from './load.mjs';
const store={};globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
const S=await loadTs('siege.ts');

test('siege is open only on Friday 20:00-22:00',()=>{
  assert.equal(S.siegeWindow(new Date(2026,9,2,19,59)).open,false);
  assert.equal(S.siegeWindow(new Date(2026,9,2,19,59)).upcoming,true);
  assert.equal(S.siegeWindow(new Date(2026,9,2,20,0)).open,true);
  assert.equal(S.siegeWindow(new Date(2026,9,2,21,59)).open,true);
  assert.equal(S.siegeWindow(new Date(2026,9,2,22,0)).open,false);
  assert.equal(S.siegeWindow(new Date(2026,9,3,20,30)).open,false,'Cumartesi kapalı');
});
test('phases: 12 wall guns (6 per gate), then 4 inner towers, then the commander',()=>{
  const s=S.newSiege('x',0);
  assert.equal(S.WALL_TOWERS.filter(i=>S.gateOf(i)==='west').length,6);
  assert.equal(S.siegePhase(s),1);
  s.destroyed.push(...S.WALL_TOWERS.filter(i=>S.gateOf(i)==='west'));
  assert.equal(S.gateLeft(s,'west'),0);assert.equal(S.gateLeft(s,'east'),6);assert.equal(S.siegePhase(s),1,'iki kapı da düşmeli');
  s.destroyed.push(...S.WALL_TOWERS.filter(i=>S.gateOf(i)==='east'));assert.equal(S.siegePhase(s),2);
  s.destroyed.push(...S.INNER_TOWERS);assert.equal(S.siegePhase(s),3);
  s.result='won';assert.equal(S.siegePhase(s),4);assert.equal(S.siegeProgress(s),1);
});
test('rewards follow the share of the fortress destroyed; chest needs 2 percent',()=>{
  const total=S.siegeTotalHp();
  const fair=total/4,b=S.contribBase(8);
  assert.deepEqual(S.contribReward(fair,4,8),b);
  assert.equal(S.contribReward(fair*10,4,8).pearls,Math.round(b.pearls*2.2));
  assert.ok(S.contribReward(fair*.1,4,8).pearls<S.contribReward(fair*.25,4,8).pearls);
  assert.ok(S.contribBase(8).pearls>S.contribBase(3).pearls);
  const c=S.victoryChest(()=>.5,8);assert.equal(c.pearls,1100);assert.equal(Object.keys(c.ammo).length,2);assert.equal(c.speed,20);assert.ok(!('equip' in c));
});
test('hero title lasts a week',()=>{
  const t=S.grantTitle(1000);assert.equal(t.name,'Kuşatma Kahramanı');
  assert.ok(S.loadTitle(1000+6*86_400_000));assert.equal(S.loadTitle(1000+7*86_400_000+1),null);
  assert.deepEqual(S.ranking({a:5,b:9,c:1}).map(([n])=>n),['b','a','c']);
});
