// Deterministic balance model, not a multiplayer/runtime test.
// One tower focuses successive ships. No respawn, retreat, travel time or adjacent towers.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/fleetBalance.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject});
const {fleetTowerStats,fleetTowerRegen}=exportsObject;
// Level 8, elite 15, all upgrades 10, epic gear, all damage/HP medals;
// gunner + surgeon rank 5, tough rank 5, shield, powder, first two shots with rage.
const shipHp=(75000+7*2500+10*2500)*1.45;
const salvo=315*20*2.1*1.38*1.25*2.25*2.6*1.33*1.1;
const reload=2.65*.6*.86*1.15/1.08,taken=.85*.8*.9*.95;
function fight(tier,count){
  const tower=fleetTowerStats(tier),ships=Array(count).fill(shipHp),next=Array(count).fill(0);
  let hp=tower.hp,time=0,fireAt=1;
  for(;time<120&&hp>0&&ships.some(h=>h>0);time+=.01){
    hp=Math.min(tower.hp,hp+fleetTowerRegen(tower.hp,true)*.01);
    for(let i=0;i<count;i++)if(ships[i]>0&&time>=next[i]){hp-=salvo*(next[i]<reload*2?1.25:1);next[i]+=reload;}
    if(hp<=0)break;
    if(time>=fireAt){ships[ships.findIndex(h=>h>0)]-=tower.damage*2*taken;fireAt+=tower.reload;}
  }
  return {won:hp<=0,seconds:+time.toFixed(1),survivors:ships.filter(h=>h>0).length};
}
for(let tier=2;tier<=8;tier++){
  const solo=fight(tier,1),four=fight(tier,4),five=fight(tier,5);
  assert(!solo.won&&solo.seconds<=10,'Solo must sink quickly');
  assert(!four.won,'Four reference ships must fail');
  assert(five.won,'Five reference ships must win');
  assert(fleetTowerRegen(fleetTowerStats(tier).hp,false)>fleetTowerRegen(fleetTowerStats(tier).hp,true));
  console.log({tier,solo,four,five});
}
console.log('PASS: reference balance for all seven hostile sea tiers');
