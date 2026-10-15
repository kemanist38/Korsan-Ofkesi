// Fiyat denetimi: inci/altın ile alınan her şeyin TL karşılığı, kalıcı yatırım toplamları ve savaşta saatlik tüketim.
// Kullanım: node tools/audit-prices.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache={};function load(file){file=path.resolve(file);if(cache[file])return cache[file];const exports={};cache[file]=exports;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>load(path.resolve(path.dirname(file),id+'.ts'))});return exports;}
const a=load('src/arsenal.ts'),e=load('src/economy.ts'),q=load('src/equipment.ts'),shop=load('src/pearlShop.ts');
const fmt=n=>Math.round(n).toLocaleString('tr-TR');
const packs=shop.PEARL_PACKS??Object.values(shop).find(v=>Array.isArray(v)&&v[0]?.pearls);
console.log('=== İNCİ PAKETLERİ ===');for(const p of packs){const t=p.pearls+p.bonus;console.log(`${p.name.padEnd(16)} ${fmt(t).padStart(7)} inci · ${p.price} ₺ · 1 ₺ = ${(t/p.price).toFixed(1)} inci · 1.000 inci = ${(p.price/t*1000).toFixed(2)} ₺`);}
const TL_LOW=49.99/3500,TL_HIGH=1999.99/196000;const tl=n=>`${(n*TL_LOW).toFixed(0)}–${(n*TL_HIGH).toFixed(0)} ₺`;
console.log('\n=== KALICI YATIRIM (inci) ===');
const GUNS=315;let total=0;
const up=['hull','damage','range','reload','speed','repair'],upBase={hull:8,damage:10,range:9,reload:12,speed:9,repair:7};
for(const k of up){let s=0;for(let l=0;l<10;l++)s+=Math.round(upBase[k]*e.UPGRADE_PRICE_MULTIPLIER*(1+l*.55));total+=s;console.log(`Geliştirme ${k.padEnd(7)} 10 seviye: ${fmt(s)} inci (${tl(s)})`);}
const heavy=e.CANNON_COSTS.heavy.amount*GUNS;total+=heavy;console.log(`315 Ağır top: ${fmt(heavy)} inci (${tl(heavy)}) · Uzun ${fmt(e.CANNON_COSTS.long.amount*GUNS)} · Seri ${fmt(e.CANNON_COSTS.rapid.amount*GUNS)}`);
const epic=q.EQUIPMENT.filter(x=>x.price.currency==='pearls').reduce((s,x)=>s+x.price.amount,0);total+=epic;console.log(`Destansı donanım (4): ${fmt(epic)} inci (${tl(epic)})`);
total+=e.ELITE_ENTRY_PRICE;console.log(`Elit gemi girişi: ${fmt(e.ELITE_ENTRY_PRICE)} inci`);
console.log(`TOPLAM kalıcı yatırım: ${fmt(total)} inci (${tl(total)})`);
const goldOnce=q.EQUIPMENT.filter(x=>x.price.currency==='gold').reduce((s,x)=>s+x.price.amount,0)+e.CANNON_COSTS.cast.amount*GUNS;
console.log(`Altınla kalıcı alınabilenlerin hepsi: ${fmt(goldOnce)} altın (sıradan donanım + 315 döküm top)`);
console.log('\n=== SAVAŞTA SAATLİK TÜKETİM (315 top, salvo 1,3 sn, sürekli ateş) ===');
const salvos=3600/1.3,balls=salvos*GUNS;
console.log(`Demir gülle: ${fmt(a.priceOf(a.IRON_PRICE,balls))} altın/sa`);
for(const [k,p] of Object.entries(a.AMMO_PRICES)){const c=a.priceOf(p,balls);console.log(`${k.padEnd(9)}: ${fmt(c)} inci/sa (${tl(c)}) · EP ${fmt(balls*a.ELITE_POINTS_PER_BALL[k])}/sa`);}
console.log(`Kara barut (salvo başına 1): ${fmt(salvos*10)} altın/sa · Kalkan (isabet başına 1, ~1.500 isabet): ${fmt(15000)} altın/sa`);
console.log('\n=== ALTIN DENGESİ (sev 8, demir gülle + barut + kalkan) ===');
const goldIn=[80000,117000],goldOut=a.priceOf(a.IRON_PRICE,balls)+salvos*10+15000;
console.log(`Kazanç ~${fmt(goldIn[0])}–${fmt(goldIn[1])} altın/sa · harcama ~${fmt(goldOut)} altın/sa · net ${fmt(goldIn[0]-goldOut)}–${fmt(goldIn[1]-goldOut)} altın/sa birikir`);
