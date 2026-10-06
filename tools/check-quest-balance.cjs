const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>load(path.resolve(path.dirname(file),id+'.ts'))});return exports;}
const c=load('src/campaign.ts'),m=load('src/quest-migration.ts');
assert.equal(c.QUEST_COOLDOWN_MS,8*3600000);assert.equal(c.QUESTS.length,64);
assert(c.QUESTS.every(q=>q.required===20));
for(const key of c.MAP_KEYS){assert.equal(c.QUESTS.filter(q=>q.map===key&&q.kind==='sparkle').length,1);assert(c.bossFor(key).trigger.endsWith('-2-heavy'));}
for(let t=1;t<=8;t++){assert.equal(c.NPCS[`n${t}-1-heavy`].hp,c.NPCS[`n${t}-2-light`].hp);assert.equal(c.NPCS[`n${t}-1-heavy`].xp,c.NPCS[`n${t}-2-light`].xp);}
const completedAt=100000,old={active:'q1/1-chest',progress:{'q1/1-chest':6,'q1/1-heavy':28},cooldowns:{'q1/1-chest':completedAt+2*3600000}};
const next=m.migrateQuestRules(old);assert.equal(next.cooldowns['q1/1-sparkle'],completedAt+8*3600000);assert.equal(next.active,null);assert.equal(next.progress['q1/1-heavy'],19);assert.equal(m.migrateQuestRules(next),next);
// Execute the real quest-progress handler with isolated state: wrong map/kind cannot count.
const main=fs.readFileSync('src/main.ts','utf8'),start=main.indexOf('function recordQuestProgress('),end=main.indexOf('\nfunction updateUI',start);
const q=c.QUESTS.find(q=>q.map==='1/1'&&q.kind==='sparkle');let paid=0;
const context={state:{activeQuest:q.id,gold:0,fame:0,pearls:0},currentMap:'1/2',questById:()=>q,questProgress:{},questCooldownUntil:{},QUEST_COOLDOWN_MS:c.QUEST_COOLDOWN_MS,saveQuestState:()=>{},saveAccount:()=>{},goldGainAch:n=>n,xpGain:n=>n,bumpAch:()=>paid++,rewardNotice:()=>{},toast:()=>{}};
vm.createContext(context);vm.runInContext(ts.transpileModule(main.slice(start,end),{}).outputText,context);
context.recordQuestProgress('sparkle','1/1');assert.equal(context.questProgress[q.id],undefined);context.currentMap='1/1';
context.recordQuestProgress('chest','1/1');assert.equal(context.questProgress[q.id],undefined);
for(let i=0;i<19;i++)context.recordQuestProgress('sparkle','1/1');assert.equal(paid,0);
context.recordQuestProgress('sparkle','1/1');assert.equal(paid,1);assert.equal(context.state.activeQuest,null);assert.equal(context.state.fame,q.xp);
context.recordQuestProgress('sparkle','1/1');assert.equal(paid,1);
console.log('PASS: all map goals 20, cooldown 8h, migration idempotent, 20th sparkle pays once on correct map');
