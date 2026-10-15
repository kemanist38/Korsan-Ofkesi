// Büyük Kuşatma ödül simülasyonu: seviyeye ve katkıya göre katkı ödülü + zafer sandığı (src/siege.ts ile aynı formüller).
// Kullanım: node tools/simulate-siege.cjs
const LXP=[0,20000,200000,500000,1500000,3200000,5800000,11400000,11400000];
const PRICE={chain:3/300,fire:4/300,breaker:5/300,explosive:6/300,leech:8/300,speed:2,mine:5},TL_PER_PEARL=49.99/3500,PEARL_PER_HOUR=2800;
const base=l=>({xp:Math.round(LXP[l]*.05),gold:Math.round(1500*Math.pow(1.6,l-1)*4),pearls:500+250*l});
const mult=rel=>rel<.25?.4*rel/.25:.4+.6*Math.min(3,rel);
const chest=l=>{const q=1500+500*l;return{pearls:300+100*l,ammoPearl:2*q*PRICE.explosive*.95,speed:20,mine:5+l,powder:100*l,shield:100*l};};
const chestPearl=c=>c.pearls+c.ammoPearl+c.speed*PRICE.speed+c.mine*PRICE.mine;
const fmt=n=>Math.round(n).toLocaleString('tr-TR');
console.log('=== KATKI ÖDÜLÜ (adil pay = kale canı / katılımcı) ===');
console.log('Sev | Az (0,4×) | Adil (1×) | Güçlü (2×) | Kahraman (3×+) | seviye TP\'sinin %\'si (adil)');
for(let l=1;l<=8;l++){const b=base(l),row=[.4,1,2,3].map(r=>{const m=mult(r);return`${fmt(b.pearls*m)} inci/${fmt(b.gold*m)} a`;});
  console.log(`${l} | ${row.join(' | ')} | ${l<8?(b.xp/LXP[l]*100).toFixed(0)+'% ('+fmt(b.xp)+' TP)':fmt(b.xp)+' TP'}`);}
console.log('\n=== ZAFER SANDIĞI (kale düşer + en az %2 hasar) ===');
for(let l=1;l<=8;l++){const c=chest(l);console.log(`Sev ${l}: ${c.pearls} inci + 2×${fmt(1500+500*l)} özel gülle + ${c.speed} hız + ${c.mine} mayın + ${c.powder} barut/kalkan → ~${fmt(chestPearl(c))} inci değeri (~${fmt(chestPearl(c)*TL_PER_PEARL)} ₺)`);}
console.log('\n=== HAFTALIK KATILIM (40 kaptan, rastgele katkı, kale düşer) ===');
for(const l of [3,5,8]){let tot=0,min=1e9,max=0;const N=4000;for(let i=0;i<N;i++){const rel=Math.max(.05,-Math.log(Math.random()));const v=base(l).pearls*mult(rel)+(rel*0.025>=.02?chestPearl(chest(l)):0);tot+=v;min=Math.min(min,v);max=Math.max(max,v);}
  const avg=tot/N;console.log(`Sev ${l}: ortalama ${fmt(avg)} inci değeri/hafta (en az ${fmt(min)}, en çok ${fmt(max)}) = ${(avg/PEARL_PER_HOUR).toFixed(1)} saatlik gülle harcaması`);}
