import test from 'node:test';import assert from 'node:assert/strict';import {loadTs} from './load.mjs';
const F=await loadTs('festival.ts');
const at=(d)=>new Date(2026,10,d,12);
test('7 günün hepsi alınınca tasarım verilir',()=>{const s={start:'2026-11-01',claimed:[]};let last;for(let d=1;d<=7;d++)last=F.claimFestival(s,at(d));assert.equal(last.design,true);assert.ok(F.festivalStatus(s,at(7)).complete);});
test('bir gün kaçarsa son ödül yok',()=>{const s={start:'2026-11-01',claimed:[]};let last;for(const d of [1,2,4,5,6,7])last=F.claimFestival(s,at(d));assert.equal(last.design,undefined);assert.deepEqual(F.festivalStatus(s,at(7)).missed,[3]);});
test('aynı gün iki kez alınmaz, festival dışında alınmaz',()=>{const s={start:'2026-11-01',claimed:[]};assert.ok(F.claimFestival(s,at(1)));assert.equal(F.claimFestival(s,at(1)),null);assert.equal(F.claimFestival(s,at(9)),null);assert.equal(F.claimFestival({start:'2026-11-05',claimed:[]},at(1)),null);});
test('büyük ödül 7. gün ödülüne eklenir; 5. gün kaçırılırsa 6. günden devam edilir ama büyük ödül yok',()=>{
  const a={start:'2026-11-01',claimed:[]};let last;for(let d=1;d<=7;d++)last=F.claimFestival(a,at(d));
  assert.equal(last.pearls,500+2500);assert.equal(last.explosive,30000);assert.equal(last.design,true);assert.equal(last.equip,undefined);
  const b={start:'2026-11-01',claimed:[]};for(const d of [1,2,3,4])F.claimFestival(b,at(d));assert.equal(F.claimFestival(b,at(5)) &&0,0);
  const c={start:'2026-11-01',claimed:[]};for(const d of [1,2,3,4])F.claimFestival(c,at(d));const six=F.claimFestival(c,at(6));assert.ok(six.leech);
  const seven=F.claimFestival(c,at(7));assert.equal(seven.pearls,500);assert.equal(seven.design,undefined);assert.equal(seven.equip,undefined);
});
