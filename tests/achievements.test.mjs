import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const c=ts.transpile(readFileSync(new URL('../src/achievements.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const A=await import(`data:text/javascript;base64,${Buffer.from(c).toString('base64')}`);
test('achievements unlock once; only the full collection gives a permanent bonus',()=>{
  const s={stats:{npc:0,heavy:0,monster:0,boss:0,chest:0,treasure:0,quest:0,eliteBalls:0,level:1,daily:0},unlocked:[]};
  assert.equal(A.unlockReached(s).length,0);
  s.stats.npc=100;s.stats.boss=1;const fresh=A.unlockReached(s).map(d=>d.id);assert.deepEqual(fresh.sort(),['boss-1','npc-100']);
  assert.equal(A.unlockReached(s).length,0,'not twice');
  assert.deepEqual(A.achievementBonus(s),{gold:0,xp:0,damage:0,hp:0},'single medals give pearls only');
  const full={stats:s.stats,unlocked:[...A.MAIN_COLLECTION]};const b=A.achievementBonus(full);
  assert.equal(b.damage,.05);assert.equal(b.hp,.05);assert.equal(full.collectionComplete,true);
  full.unlocked=[];assert.equal(A.achievementBonus(full).hp,.05,'the collection bonus stays once earned');
  assert.equal(new Set(A.ACHIEVEMENTS.map(d=>d.id)).size,A.ACHIEVEMENTS.length);assert.ok(A.ACHIEVEMENTS.length<=A.BADGE_COLS*A.BADGE_ROWS);
});
