import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';
const L=await loadTs('sparkle-limit.ts');
test('500 sparkles per 24 hours, the 501st is blocked until the window ends',()=>{
  let s={start:0,count:0};const t0=10*3_600_000;
  for(let i=0;i<500;i++){assert.ok(L.canCollect(s,t0+i));s=L.collect(s,t0+i);}
  assert.equal(s.count,500);assert.equal(s.start,t0);assert.ok(!L.canCollect(s,t0+1000));
  assert.ok(!L.canCollect(s,t0+L.SPARKLE_WINDOW_MS-1));assert.ok(L.canCollect(s,t0+L.SPARKLE_WINDOW_MS));
  s=L.collect(s,t0+L.SPARKLE_WINDOW_MS+5);assert.equal(s.count,1);
});
