// Reproducible consumption model, not a live combat/economy playthrough.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>load(path.resolve(path.dirname(file),id+'.ts'))});return exports;}
const a=load('src/arsenal.ts'),e=load('src/economy.ts'),p=load('src/elite-progression.ts'),shop=load('src/pearlShop.ts'),gear=load('src/equipment.ts');
const main=fs.readFileSync('src/main.ts','utf8');
function constant(name){const start=main.indexOf(`const ${name}:`),end=main.indexOf('\n};',start)+3;const ctx={};vm.createContext(ctx);vm.runInContext(ts.transpileModule(main.slice(start,end)+`\nglobalThis.result=${name};`,{}).outputText,ctx);return ctx.result;}
const cannons=constant('CANNONS'),upgrades=constant('UPGRADES');
function cheapestPack(need){const packs=shop.PEARL_PACKS,limit=Math.ceil(need/500)+280,cost=Array(limit+1).fill(Infinity),prev=[];cost[0]=0;
 for(let n=1;n<=limit;n++)for(let j=0;j<packs.length;j++){const q=shop.packTotal(packs[j])/500,v=Math.round(packs[j].price*100);if(n>=q&&cost[n-q]+v<cost[n]){cost[n]=cost[n-q]+v;prev[n]=j;}}
 let best=Math.ceil(need/500);for(let n=best;n<=limit;n++)if(cost[n]<cost[best])best=n;
 const counts={};let n=best;while(n>0){const pack=packs[prev[n]];counts[pack.id]=(counts[pack.id]||0)+1;n-=shop.packTotal(pack)/500;}
 return{required:need,pearls:best*500,tl:cost[best]/100,packs:counts};}
const upgradeTotal=Object.fromEntries(Object.entries(upgrades).map(([id,u])=>[id,Array.from({length:10},(_,rank)=>Math.round(u.pearls*e.UPGRADE_PRICE_MULTIPLIER*(1+rank*.55))).reduce((a,b)=>a+b,0)]));
const setup=e.ELITE_ENTRY_PRICE+a.priceOf(e.CANNON_COSTS.heavy,315)+Object.values(upgradeTotal).reduce((a,b)=>a+b,0)+gear.EQUIPMENT.filter(x=>x.rarity===2).reduce((n,x)=>n+x.price.amount,0);
// Encounter-driven calibration: actual target HP, damage, reload, fire DOT and leech.
// Navigation distances and captain/loadout milestones are explicit assumptions, not measured telemetry.
{
 const c=load('src/campaign.ts');let time=0,ep=0,index=0,gold=0,pearls=0;const balls={grape:0,fire:0,breaker:0,explosive:0,leech:0},stats={},bossCount={};
 const milestones=[4,12.7,26.4,46.3,72.7,104.5,140.8,Infinity];
 while(ep<a.eliteLevelEp(15)){
  const hours=time/3600,tier=1+milestones.findIndex(h=>hours<h),up=Math.min(10,Math.floor(hours/8)),gun=hours<12?cannons.cast:cannons.heavy,b=p.cumulativeEliteBonus(a.eliteLevelFromEp(ep));
  const gearFactor=hours<20?0:hours<60?.08:.13,armor=hours<20?0:hours<60?.12:.20,carriage=hours<20?0:hours<60?.09:.14;
  const guns=hours<4?50:hours<12?100:315,speed=(128+up*5)*(1+(hours>=60?.16:0)+b.speed),hpMax=(75000+(tier-1)*2500+up*2500)*(1+armor+b.hp);
  // Every fifth action is a 20-sparkle quest/collection route, not a firing window.
  if(index%5===4){time+=20*(700/speed+2);index++;continue;}
  const slot=[0,1,0,2,0,1,3,0,2,1,0,3,1,2,0,1][index%16],monster=slot===3;
  let target=monster?c.MONSTERS[c.MONSTER_OF_TIER[tier]]:c.NPCS[`n${tier}-${slot===2?'2-heavy':slot===1?'1-heavy':'1-light'}`],kind=monster?'monster':'npc';
  // One PvP exchange per 25 encounters; outgoing damage reduced by armor/shield.
  const pvp=index>0&&index%25===0;
  if(pvp){target={hp:170375,damage:25000,reload:2.5,gold:0,xp:0};kind='pvp';}
  if(!pvp&&slot===2){bossCount[tier]=(bossCount[tier]??0)+1;if(bossCount[tier]%200===0){target=c.bossFor(`${tier}/1`);kind='boss';}}
  const ammo=process.argv.includes('--all-leech')?'leech':pvp?'leech':monster?'explosive':slot===2?'breaker':'fire',def=a.SPECIAL_AMMO[ammo];
  const damage=guns*a.BALL_DAMAGE*(1+up*.11)*gun.damage*(1+.05*Math.min(5,Math.floor(hours/10)))*(1+gearFactor+b.damage)*def.damage*1.1*(pvp?.65:1);
  const reload=(1-carriage)*gun.reload*Math.max(.6,1-up*.04)/(1+b.reload)*def.reload;
  let remaining=target.hp,combat=0,nextShot=0,nextEnemy=target.reload,own=hpMax,burnUntil=0,burnDps=0,shots=0,retreats=0;
  // Small fixed step resolves burn and retaliation between salvos; full 315 rounds are consumed on overkill.
  while(remaining>0&&combat<3600){
   const dt=.1;if(combat<burnUntil)remaining-=burnDps*dt;if(remaining<=0)break;
   if(combat>=nextShot){remaining-=damage;shots++;balls[ammo]+=guns;ep+=guns*a.ELITE_POINTS_PER_BALL[ammo]*(Math.floor((time+combat)/36000)%7===6?1.5:1);nextShot=combat+reload;
    if(ammo==='fire'){burnUntil=combat+12;burnDps=damage*a.FIRE_DOT_SHARE/12;}
    if(ammo==='leech')own=Math.min(hpMax,own+damage*def.leech);
   }
   if(remaining<=0)break;
   if(combat>=nextEnemy){own-=target.damage*(1-.03*Math.min(5,tier-1))*.9*(1-b.defense);nextEnemy=combat+target.reload;}
   if(own<=0){retreats++;break;}combat+=dt;
  }
  const row=stats[tier]??={kills:0,losses:0,balls:0,fightSeconds:0};row.balls+=shots*guns;row.fightSeconds+=combat;
  if(remaining<=0){row.kills++;gold+=target.gold??0;pearls+=target.pearls??0;}else row.losses++;
  const repair=(hpMax-Math.max(0,own))/(hpMax*(.035+up*.008)*(hours>=60?2:1)*(1+b.repair));
  const navigation=(800+(index%7)*150)/speed*1.3*(process.argv.includes('--fast-route')?.7:process.argv.includes('--slow-route')?1.3:1);
  time+=combat+Math.max(1,repair)+navigation+6+retreats*90;index++;
 }
 const ammoPearls=Object.entries(balls).reduce((n,[id,qty])=>n+a.priceOf(a.AMMO_PRICES[id],qty),0);
 const speedPotions=Math.ceil(time*.25/a.ABILITIES.speed.duration),mines=Math.ceil(time/3600*5),supplyPearls=a.priceOf(a.SUPPLY_PRICES.speed,speedPotions)+a.priceOf(a.SUPPLY_PRICES.mine,mines);
 const result={hours:time/3600,ep,balls,totalBalls:Object.values(balls).reduce((a,b)=>a+b,0),ammoPearls,setup,supplyPearls,setupPurchase:cheapestPack(setup),ammoPurchase:cheapestPack(ammoPearls),purchase:cheapestPack(setup+ammoPearls+supplyPearls),stats,gold,bossPearls:pearls};
 console.log(JSON.stringify(result,null,2));
 if(!process.argv.includes('--all-leech')&&!process.argv.includes('--fast-route')&&!process.argv.includes('--slow-route')){assert(result.hours>=200&&result.hours<=220);assert(result.purchase.tl>=5500&&result.purchase.tl<=8500);}
 const old=[0,0,25000,65000,130000,230000,360000,530000,750000,1020000,1360000,1780000,2300000,2950000,3850000,5000000];
 for(let level=1;level<=15;level++){const value=e.migrateElitePoints(old[level]);assert.equal(a.eliteLevelFromEp(value),level);assert.equal(e.migrateElitePoints(value,2),value);}
 assert(Object.values(a.ELITE_POINTS_PER_BALL).every(v=>v===.1));
 console.log('PASS: encounter budget and existing elite levels preserved');
}
