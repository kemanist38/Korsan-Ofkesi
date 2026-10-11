import test from 'node:test';import assert from 'node:assert/strict';import {loadTs} from './load.mjs';
globalThis.localStorage={_:{},getItem(k){return this._[k]??null},setItem(k,v){this._[k]=v}};
const S=await loadTs('spy.ts');
const rivals=[{nick:'ADM_AHMET',online:false,map:'4/2',coord:'31BK'}];
test('shield blocks spies until it runs out, then the location is revealed',()=>{
  const st={shields:{ADM_AHMET:2}};
  assert.equal(S.sendSpy(st,'adm_ahmet',rivals).kind,'blocked');
  const r2=S.sendSpy(st,'ADM_AHMET',rivals);assert.equal(r2.kind,'blocked');assert.equal(r2.shieldLeft,0);
  const r3=S.sendSpy(st,'ADM_AHMET',rivals);assert.equal(r3.kind,'found');assert.equal(r3.rival.map,'4/2');
  assert.equal(S.sendSpy(st,'YOKBOYLE',rivals).kind,'unknown');
});
