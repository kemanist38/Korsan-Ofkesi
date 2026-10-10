import test from 'node:test';import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';
const Q=await loadTs('level-quest.ts');
test('level quest gates level 2+ and counts only matching targets while ready',()=>{
  assert.equal(Q.levelQuestDone({level:1,ships:0,monsters:0}),true);
  assert.deepEqual(Q.levelQuestGoal(2),{ships:10,monsters:1});assert.deepEqual(Q.levelQuestGoal(7),{ships:20,monsters:3});
  const q={level:3,ships:0,monsters:0};
  assert.equal(Q.levelQuestKill(q,'npc','n3-1-heavy',3,false),false);
  assert.equal(Q.levelQuestKill(q,'npc','n3-1-light',3,true),false);
  assert.equal(Q.levelQuestKill(q,'npc','n2-1-heavy',2,true),false);
  for(let i=0;i<12;i++)Q.levelQuestKill(q,'npc',i%2?'n3-1-heavy':'n3-2-heavy',3,true);
  assert.equal(q.ships,12);assert.equal(Q.levelQuestDone(q),false);
  assert.equal(Q.levelQuestKill(q,'monster','m2-1',2,true),false);
  assert.equal(Q.levelQuestKill(q,'monster','m3-2',3,true),true);
  assert.equal(Q.levelQuestDone(q),true);
});
