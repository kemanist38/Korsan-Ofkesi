import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';
const C=await loadTs('cloud-save.ts');
const mem=()=>{const m=new Map();return{get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
test('only account keys are synced, device-local keys stay',()=>{
  const s=mem();s.setItem('yedi-deniz-account-v1','A');s.setItem('yedi-deniz-bar-1','x');s.setItem('yedi-deniz-dock-pos','p');s.setItem('other','o');
  assert.deepEqual(C.collectSave(s),{'yedi-deniz-account-v1':'A'});
});
test('applying a save replaces synced keys and keeps local ones',()=>{
  const s=mem();s.setItem('yedi-deniz-account-v1','old');s.setItem('yedi-deniz-quests','q');s.setItem('yedi-deniz-dock-pos','p');
  C.applySave({'yedi-deniz-account-v1':'new','yedi-deniz-net-id':'bad'},s);
  assert.equal(s.getItem('yedi-deniz-account-v1'),'new');assert.equal(s.getItem('yedi-deniz-quests'),null);assert.equal(s.getItem('yedi-deniz-dock-pos'),'p');assert.equal(s.getItem('yedi-deniz-net-id'),null);
});
test('a different account on the same browser clears the previous local save',()=>{
  const s=mem();C.claimOwner('u1',s);s.setItem('yedi-deniz-account-v1','u1data');C.claimOwner('u1',s);assert.equal(s.getItem('yedi-deniz-account-v1'),'u1data');
  C.claimOwner('u2',s);assert.equal(s.getItem('yedi-deniz-account-v1'),null);assert.equal(s.getItem('yedi-deniz-owner'),'u2');
});
