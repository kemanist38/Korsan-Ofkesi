// Genel denge denetimi: her seviyede oyuncu gücü, NPC/canavar/boss canı ve hasarı, öldürme süresi, alınan hasar,
// TP/altın/inci kazanç hızları ve pırıltı toplama. Oyuncu profilleri tools/simulate-leveling.cjs ile aynıdır.
// Kullanım: node tools/audit-balance.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports={};cache[file]=exports;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>load(path.resolve(path.dirname(file),id+'.ts'))});return exports;}
const fb=load('src/fleetBalance.ts'),c=load('src/campaign.ts'),p=load('src/elite-progression.ts'),a=load('src/arsenal.ts');
const main=fs.readFileSync('src/main.ts','utf8');
const cannonText=main.slice(main.indexOf('const CANNONS:'),main.indexOf('\nconst ',main.indexOf('const CANNONS:')+1));
const ctx={};vm.createContext(ctx);vm.runInContext(ts.transpileModule(cannonText+'\nglobalThis.cannons=CANNONS;',{}).outputText,ctx);const cannons=ctx.cannons;
const profiles=[null,{guns:50,gun:'cast',up:0,elite:0,off:0,gear:0},{guns:100,gun:'cast',up:1,elite:1,off:1,gear:0},{guns:200,gun:'cast',up:2,elite:2,off:2,gear:0},
 {guns:315,gun:'heavy',up:4,elite:3,off:3,gear:1},{guns:315,gun:'heavy',up:6,elite:5,off:4,gear:1},{guns:315,gun:'heavy',up:8,elite:7,off:5,gear:2},{guns:315,gun:'heavy',up:10,elite:10,off:5,gear:2},{guns:315,gun:'heavy',up:10,elite:15,off:5,gear:2}];
function ship(level,ammo){const s=profiles[level],b=p.cumulativeEliteBonus(s.elite),gun=cannons[s.gun],am=ammo?a.SPECIAL_AMMO[ammo]:{damage:1,reload:1};
 return{damage:s.guns*a.BALL_DAMAGE*(1+s.up*.11)*gun.damage*(1+.05*s.off)*(1+[0,.08,.13][s.gear]+b.damage)*am.damage,
 reload:(1-[0,.09,.14][s.gear])*gun.reload*Math.max(.6,1-s.up*.04)/(1+b.reload)*am.reload,
 hp:fb.playerBaseHp(level,s.up)*(1+[0,.12,.20][s.gear]+b.hp),taken:(1-.03*Math.min(5,level-1))*(1-b.defense),repair:(.035+s.up*.008)*(level>=6?2:1)*(1+b.repair)};}
const fmt=n=>Math.round(n).toLocaleString('tr-TR'),warn=[];
function fight(s,t){const salvos=Math.ceil(t.hp/s.damage),sec=2+(salvos-1)*s.reload,hits=Math.max(0,Math.floor((sec-1)/t.reload)),taken=hits*t.damage*s.taken;return{salvos,sec,taken,pct:taken/s.hp*100};}
const TRAVEL=12;
for(const ammo of [null,'fire']){
console.log(`\n================ ${ammo?'ATEŞ GÜLLESİ':'DEMİR GÜLLE'} ================`);
for(let L=1;L<=8;L++){const s=ship(L,ammo),key=`${L}/1`,m=c.MAPS[key];
 console.log(`\n--- Seviye ${L} (${key}) · oyuncu: ${fmt(s.damage)} hasar/salvo, ${s.reload.toFixed(2)} sn, DPS ${fmt(s.damage/s.reload)}, can ${fmt(s.hp)}`);
 const bs=c.bossFor(key),boss={...bs,name:bs.name+' (boss)',damage:bs.damage*1.5};const targets=[...m.npcs.map(id=>c.NPCS[id]),boss].filter(Boolean);
 for(const t of targets){const f=fight(s,t),cycle=f.sec+TRAVEL+(f.taken/(s.hp*s.repair));
  console.log(`${t.name.padEnd(22)} can ${fmt(t.hp).padStart(9)} · vuruş ${fmt(t.damage).padStart(6)}/${t.reload.toFixed(1)}sn · ${String(f.salvos).padStart(3)} salvo ${f.sec.toFixed(0).padStart(3)} sn · alınan %${f.pct.toFixed(0).padStart(3)} · ${fmt(t.xp*3600/cycle).padStart(9)} TP/sa · ${fmt(t.gold*3600/cycle).padStart(8)} altın/sa`);
  if(!ammo){if(f.pct>100)warn.push(`Sev ${L}: ${t.name} oyuncuyu tek çatışmada batırıyor (%${f.pct.toFixed(0)})`);if(f.sec<3&&t.hp>20000)warn.push(`Sev ${L}: ${t.name} çok çabuk ölüyor (${f.sec.toFixed(1)} sn)`);if(f.sec>120)warn.push(`Sev ${L}: ${t.name} çok uzun sürüyor (${f.sec.toFixed(0)} sn)`);}}
 if(!ammo){const light=c.NPCS[m.npcs[0]],sp=3600/(700/170+3);console.log(`Pırıltı: tanesi ~${fmt(light.gold*.15)} altın + ${fmt(light.xp*.15)} TP + %20 inci → saatte en çok ~${fmt(sp)} adet (günlük sınır 500)`);}
}}
console.log('\n=== SEVİYE GEÇİŞ ORANLARI (bir üst seviyeye göre) ===');
for(let L=2;L<=8;L++){const a1=c.NPCS[c.MAPS[`${L-1}/1`].npcs[1]],b1=c.NPCS[c.MAPS[`${L}/1`].npcs[1]];
 const r=b1.hp/a1.hp,x=b1.xp/a1.xp,g=b1.gold/a1.gold;console.log(`${L-1}→${L}: NPC can ×${r.toFixed(2)} · TP ×${x.toFixed(2)} · altın ×${g.toFixed(2)} · TP/can ${(b1.xp/b1.hp*1000).toFixed(2)}‰`);
 if(x<1.2)warn.push(`${L-1}→${L}: TP artışı zayıf (×${x.toFixed(2)})`);}
console.log('\n=== UYARILAR ===');console.log(warn.length?warn.join('\n'):'Yok');
