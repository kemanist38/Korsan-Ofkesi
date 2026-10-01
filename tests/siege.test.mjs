import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const url=src=>`data:text/javascript;base64,${Buffer.from(ts.transpile(src,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022})).toString('base64')}`;
const campaign=url(readFileSync(new URL('../src/campaign.ts',import.meta.url),'utf8'));
const store={};globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
const S=await import(url(readFileSync(new URL('../src/siege.ts',import.meta.url),'utf8').replace("from './campaign'",`from '${campaign}'`)));

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
  assert.deepEqual(S.contribReward(total),{xp:60000,gold:40000,pearls:500});
  assert.deepEqual(S.contribReward(total/4),{xp:15000,gold:10000,pearls:125});
  assert.equal(S.earnsChest(total*.019),false);assert.equal(S.earnsChest(total*.02),true);
  const c=S.victoryChest(()=>.5,['sail-1']);assert.equal(c.pearls,150);assert.equal(Object.keys(c.ammo).length,2);assert.equal(c.speed,10);
  assert.equal(S.victoryChest(()=>.1,['sail-1']).equip,'sail-1');
});
test('hero title lasts a week',()=>{
  const t=S.grantTitle(1000);assert.equal(t.name,'Kuşatma Kahramanı');
  assert.ok(S.loadTitle(1000+6*86_400_000));assert.equal(S.loadTitle(1000+7*86_400_000+1),null);
  assert.deepEqual(S.ranking({a:5,b:9,c:1}).map(([n])=>n),['b','a','c']);
});
