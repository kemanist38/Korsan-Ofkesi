// Deterministic offline balance model; not a browser test or an economy simulator.
// Assumes purchased loadouts below; reports required active hours, excluding offline time.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports={};cache[file]=exports;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>load(path.resolve(path.dirname(file),id+'.ts'))});return exports;}
const c=load('src/campaign.ts'),p=load('src/elite-progression.ts'),a=load('src/arsenal.ts');
const main=fs.readFileSync('src/main.ts','utf8');
const cannonText=main.slice(main.indexOf('const CANNONS:'),main.indexOf('\nconst ',main.indexOf('const CANNONS:')+1));
const cannonContext={};vm.createContext(cannonContext);vm.runInContext(ts.transpileModule(cannonText+'\nglobalThis.cannons=CANNONS;',{}).outputText,cannonContext);
const cannons=cannonContext.cannons;
// Baseline: iron ammunition, progressive cannons/upgrades and earned elite levels.
// No assumption that test-mode upgrades/stocks are available to a new player.
const profiles=[null,
 {guns:50,gun:'cast',up:0,elite:0,off:0,gear:0},
 {guns:100,gun:'cast',up:1,elite:1,off:1,gear:0},
 {guns:200,gun:'cast',up:2,elite:2,off:2,gear:0},
 {guns:315,gun:'heavy',up:4,elite:3,off:3,gear:1},
 {guns:315,gun:'heavy',up:6,elite:5,off:4,gear:1},
 {guns:315,gun:'heavy',up:8,elite:7,off:5,gear:2},
 {guns:315,gun:'heavy',up:10,elite:10,off:5,gear:2}];
const modes={normal:{},vip:{vip:1.1},fast:{max:true,vip:1.1,travel:.5,ammo:'explosive'},slow:{travel:1.5}};
function ship(level,mode){const s=mode.max?{guns:315,gun:'heavy',up:10,elite:15,off:5,gear:2}:profiles[level],b=p.cumulativeEliteBonus(s.elite),gun=cannons[s.gun],ammo=mode.ammo?a.SPECIAL_AMMO[mode.ammo]:{damage:1,reload:1};
 return{damage:s.guns*a.BALL_DAMAGE*(1+s.up*.11)*gun.damage*(1+.05*s.off)*(1+[0,.08,.13][s.gear]+b.damage+(mode.max?.05:0))*ammo.damage*(mode.max?1.1:1),
 reload:(1-[0,.09,.14][s.gear])*gun.reload*Math.max(.6,1-s.up*.04)/(1+b.reload)*ammo.reload,
 hp:(75000+(level-1)*2500+s.up*2500)*(1+[0,.12,.20][s.gear]+b.hp+(mode.max?.05:0)),
 repair:(.035+s.up*.008)*(level>=6?2:1)*(1+b.repair),
 speed:(128+s.up*5)*(1+[0,.1,.16][s.gear]+b.speed),taken:(1-.03*Math.min(5,level-1))*(mode.max?.8*.9:1)*(1-b.defense)};}
function action(target,level,mode,sparkle=false){const s=ship(level,mode),travel=(mode.travel??1)*(sparkle?700:1000)/s.speed+3;
 if(sparkle)return{seconds:travel,xp:Math.round(target.xp*.15)};
 const salvos=Math.ceil(target.hp/s.damage),combat=2+(salvos-1)*s.reload,loss=Math.max(0,Math.floor((combat-1)/target.reload))*target.damage*s.taken;
 // Time spent repairing damage, plus retreat/re-engagement overhead on lethal exchanges.
 const repair=loss/(s.hp*s.repair)+Math.floor(loss/s.hp)*45;
 return{seconds:travel+combat+repair,xp:target.xp};}
function simulate(modeName='normal',targets=null){const mode=modes[modeName],due={},bossKills={},rows=[];let seconds=0,xp=0,level=1,questCount=0,lastMap='1/1';
 const wall=()=>Math.floor(seconds/36000)*86400+seconds%36000; // 10 active hours/day
 const mult=()=> (mode.vip??1)*(Math.floor(wall()/86400)%7===6?1.5:1); // Monday start; actual Sunday bonus
 while(level<8){const start=seconds,goal=targets?start+targets[level-1]*3600:Infinity;let gained=0;
  while(targets?seconds<goal:xp<c.xpNeed(level)){
   const available=c.QUESTS.filter(q=>q.tier<=level&&(due[q.id]??0)<=wall()).sort((a,b)=>b.tier-a.tier||a.id.localeCompare(b.id));
   let q=available[0],bestFarm=null;
   if(mode.max){
    const farms=c.MAP_KEYS.filter(k=>c.MAPS[k].tier<=level).flatMap(k=>[...c.MAPS[k].npcs.map(id=>c.NPCS[id]),c.MONSTERS[c.MAPS[k].monster]].map(t=>({key:k,target:t,rate:t.xp/action(t,level,mode).seconds})));
    bestFarm=farms.sort((a,b)=>b.rate-a.rate)[0];
    const rate=q=>{const sparkle=q.kind==='sparkle',t=q.kind==='monster'?c.MONSTERS[q.ids[0]]:sparkle?c.NPCS[c.MAPS[q.map].npcs[0]]:c.NPCS[q.ids[0]],v=action(t,level,mode,sparkle);return(v.xp*q.required+q.xp)/(v.seconds*q.required+(q.map===lastMap?0:120));};
    q=available.sort((a,b)=>rate(b)-rate(a))[0];if(q&&rate(q)<bestFarm.rate)q=null;
   }
   let key=q?.map||bestFarm?.key||`${level}/1`;
   if(key!==lastMap){seconds+=120;lastMap=key;}
   let target,sparkle=false,count=1;
   if(q){sparkle=q.kind==='sparkle';target=q.kind==='monster'?c.MONSTERS[q.ids[0]]:sparkle?c.NPCS[c.MAPS[key].npcs[0]]:c.NPCS[q.ids[0]];count=q.required;}
   else{const choices=[...c.MAPS[key].npcs.map(id=>c.NPCS[id]),c.MONSTERS[c.MAPS[key].monster]];target=bestFarm?.target||choices.sort((a,b)=>{const x=action(a,level,mode),y=action(b,level,mode);return y.xp/y.seconds-x.xp/x.seconds;})[0];}
   for(let i=0;i<count;i++){
    const v=action(target,level,mode,sparkle);seconds+=v.seconds;const reward=v.xp*(sparkle?1:mult());xp+=reward;gained+=reward;
    if(!sparkle&&target.id===c.bossFor(key).trigger){bossKills[key]=(bossKills[key]??0)+1;
     if(bossKills[key]>=(Math.floor(wall()/86400)%7===1?100:200)){bossKills[key]=0;const boss=c.bossFor(key),bv=action(boss,level,mode);seconds+=bv.seconds*1.5;const br=boss.xp*mult();xp+=br;gained+=br;}}
   }
   if(q){const reward=q.xp*mult();xp+=reward;gained+=reward;due[q.id]=wall()+c.QUEST_COOLDOWN_MS/1000;questCount++;}
   if(seconds>3600*3000)throw Error('Simulation did not converge');
  }
  rows.push({from:level,to:level+1,hours:+((seconds-start)/3600).toFixed(2),totalHours:+(seconds/3600).toFixed(2),xp:Math.round(gained),required:targets?Math.round(xp/1000)*1000:c.xpNeed(level)});
  xp=targets?0:xp-c.xpNeed(level);level++;
 }
 return{mode:modeName,hours:+(seconds/3600).toFixed(2),days:+(seconds/36000).toFixed(2),quests:questCount,rows};}
if(process.argv.includes('--calibrate'))console.log(JSON.stringify(simulate('normal',[4,8,14,20,26,32,36]),null,2));
else{for(const name of Object.keys(modes)){const result=simulate(name);console.log(JSON.stringify(result));if(name==='normal')assert(result.hours>=130&&result.hours<=150,'Baseline must be near 140h');if(name==='fast')assert(result.hours>20,'Stress scenario must not finish in two 10-hour days');}}
