const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
const p=load('src/elite-progression.ts'),a=load('src/achievements.ts');
assert.equal(p.ELITE_CANNON_CAPACITY,315);
assert.equal(p.cumulativeEliteBonus(5).damage,.05);
assert.equal(JSON.stringify(p.cumulativeEliteBonus(15)),JSON.stringify({damage:.15,hp:.20,reload:.08,speed:.05,defense:.05,repair:.05}));
for(let level=1;level<=15;level++)for(const k of Object.keys(p.cumulativeEliteBonus(0)))assert(p.cumulativeEliteBonus(level)[k]>=p.cumulativeEliteBonus(level-1)[k]);
const partial={unlocked:a.MAIN_COLLECTION.slice(0,-1)};
assert.equal(a.achievementBonus(partial).damage,0);
partial.unlocked.push(a.MAIN_COLLECTION.at(-1));
assert.equal(a.achievementBonus(partial).damage,.05);
assert.equal(a.achievementBonus(partial).hp,.05);
partial.unlocked=[];assert.equal(a.achievementBonus(partial).damage,.05);
assert(a.ACHIEVEMENTS.every(x=>Object.keys(x.bonus).length===0));
// Execute actual capacity/migration functions: changing an elite design keeps capacity,
// and excess mounted cannons survive migration in inventory.
const main=fs.readFileSync('src/main.ts','utf8');
const capacity=main.match(/function cannonCapacity\(\)\{[^\n]+/)[0];
const fit=main.slice(main.indexOf('function fitCannonsToCapacity(){'),main.indexOf('\nfunction ',main.indexOf('function fitCannonsToCapacity(){')+10));
const ctx={ELITE_TEST_MODE:false,ELITE_CANNON_CAPACITY:315,BASE_CANNONS:100,earnedEliteLevel:()=>15,mountedCannons:{cast:0,long:0,rapid:0,heavy:525},cannonInventory:{cast:0,long:0,rapid:0,heavy:0},state:{cannonType:'heavy'},toast:()=>{}};
ctx.mountedCannonCount=()=>Object.values(ctx.mountedCannons).reduce((a,b)=>a+b,0);
vm.createContext(ctx);vm.runInContext(ts.transpileModule(capacity+'\n'+fit,{}).outputText,ctx);ctx.fitCannonsToCapacity();
assert.equal(ctx.mountedCannons.heavy,315);assert.equal(ctx.cannonInventory.heavy,210);
ctx.fitCannonsToCapacity();assert.equal(ctx.cannonInventory.heavy,210);
for(let level=1;level<=15;level++){ctx.earnedEliteLevel=()=>level;assert.equal(ctx.cannonCapacity(),315);}
console.log('PASS: elite totals, medal migration/persistence, fixed capacity, lossless cannon migration');
