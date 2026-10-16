// Günlük giriş takvimi ve Açılış Festivali ödüllerinin değer simülasyonu.
// Ölçü: ödülün inci karşılığı (gülle fiyatları src/arsenal.ts) ve oyuncunun günlük harcamasına oranı.
// Saatlik harcama/kazanç tools/simulate-economy.cjs referansından: ~2.800 inci/saat elit gülle, ~53.000 altın/saat.
// Kullanım: node tools/simulate-rewards.cjs
const PRICE={chain:3/300,fire:4/300,breaker:5/300,explosive:6/300,leech:8/300,heal:6/300,speed:2,mine:5}; // inci/adet
const GOLD_PRICE={powder:10,shield:10}; // altın/adet
const PEARL_PER_HOUR=2800,GOLD_PER_HOUR=53000,TL_PER_PEARL=49.99/3500;
const dailyGold=lvl=>Math.round(1500*Math.pow(1.6,lvl-1));const X2=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v*2]));
const DAILY=lvl=>{const G=dailyGold(lvl);return[
  {gold:G,fire:6000},
  {chain:6000,powder:100,shield:100},
  {pearls:50,breaker:6000},
  {gold:G*2,explosive:6000,speed:20},
  {pearls:100,leech:6000},
  {gold:G*3,powder:200,shield:200,mine:10},
  {pearls:300,gold:G*5,explosive:9000,fire:9000},
].map(X2);};
const FESTIVAL=[
  {pearls:200,fire:15000},
  {chain:30000,powder:300,shield:300},
  {pearls:300,speed:50},
  {gold:300000,explosive:15000},
  {pearls:400,breaker:15000},
  {gold:600000,leech:15000,mine:30},
  {pearls:500,heal:20000},
];
const GRAND={pearls:2500,explosive:30000,design:true};
const pearlValue=r=>Object.entries(r).reduce((s,[k,v])=>s+(k==='pearls'?v:PRICE[k]?v*PRICE[k]:0),0);
const goldValue=r=>(r.gold||0)+Object.entries(GOLD_PRICE).reduce((s,[k,p])=>s+(r[k]||0)*p,0);
const fmt=n=>Math.round(n).toLocaleString('tr-TR');
// Kaçırınca 1. güne dönen takvim: Monte Carlo
function weekly(prob,lvl,weeks=2000){let pv=0,gv=0,day=0;const rs=DAILY(lvl);for(let d=0;d<weeks*7;d++){if(Math.random()<prob){const r=rs[day%7];pv+=pearlValue(r);gv+=goldValue(r);day++;}else day=0;}return{pv:pv/weeks,gv:gv/weeks};}
console.log('=== GÜNLÜK GİRİŞ TAKVİMİ (seviye 5 için) ===');
DAILY(5).forEach((r,i)=>console.log(`${i+1}. gün: ${fmt(pearlValue(r))} inci değeri · ${fmt(goldValue(r))} altın değeri`));
const full=DAILY(5).reduce((a,r)=>({p:a.p+pearlValue(r),g:a.g+goldValue(r)}),{p:0,g:0});
console.log(`Tam hafta: ${fmt(full.p)} inci değeri (~${fmt(full.p*TL_PER_PEARL)} ₺) + ${fmt(full.g)} altın değeri`);
for(const [name,h] of [['Hafif (1 sa/gün)',1],['Normal (3 sa/gün)',3],['Sıkı (6 sa/gün)',6]]){
  const spend=PEARL_PER_HOUR*h*7,goldIn=GOLD_PER_HOUR*h*7;
  console.log(`${name}: haftalık gülle harcaması ${fmt(spend)} inci → ödül karşılar %${(full.p/spend*100).toFixed(1)} · haftalık altın kazancının %${(full.g/goldIn*100).toFixed(1)}'i`);}
for(const p of [1,.9,.7,.5]){const w=weekly(p,5);console.log(`Giriş olasılığı %${p*100}: ortalama haftalık ${fmt(w.pv)} inci değeri (kaçırınca 1. güne dönüş dahil)`);}
console.log('\n=== AÇILIŞ FESTİVALİ ===');
let fp=0,fg=0;FESTIVAL.forEach((r,i)=>{fp+=pearlValue(r);fg+=goldValue(r);console.log(`${i+1}. gün: ${fmt(pearlValue(r))} inci değeri · ${fmt(goldValue(r))} altın değeri`);});
console.log(`7 günlük ödüller: ${fmt(fp)} inci değeri (~${fmt(fp*TL_PER_PEARL)} ₺) + ${fmt(fg)} altın`);
console.log(`Büyük ödül (7/7): ${fmt(pearlValue(GRAND))} inci değeri (~${fmt(pearlValue(GRAND)*TL_PER_PEARL)} ₺) + Pirate Rage tasarımı`);
console.log(`7/7 giren oyuncunun toplamı: ${fmt(fp+pearlValue(GRAND))} inci değeri (~${fmt((fp+pearlValue(GRAND))*TL_PER_PEARL)} ₺) — normal oyuncunun ${((fp+pearlValue(GRAND))/(PEARL_PER_HOUR*3)).toFixed(1)} günlük gülle harcaması`);
const missOne=fp-pearlValue(FESTIVAL[4]);console.log(`5. günü kaçıran: ${fmt(missOne)} inci değeri (büyük ödül ve tasarım yok)`);
module.exports={DAILY,FESTIVAL,GRAND};
