// TP sıralama madalyası: sunucu ilk 100 kaptanın TP sırasını (seviye, sonra TP) 10 dakikada bir hesaplar.
// 1. Korsan Kralı (taç), 2. Sağ Kol, 3. Sol Kol, 4–20 Amiral (altın), 21–50 Kaptan (gümüş), 51–100 Lostromo (bronz).
export const TP_RANK_MAX=100;
export const TP_MEDALS=[{name:'Korsan Kralı',to:1},{name:'Sağ Kol',to:2},{name:'Sol Kol',to:3},{name:'Amiral',to:20},{name:'Kaptan',to:50},{name:'Lostromo',to:100}];
// Sıradan madalya sırası (0..5); sıralamada değilse -1
export const tpMedal=(rank:number)=>rank>0?TP_MEDALS.findIndex(m=>rank<=m.to):-1;
export const tpMedalUrl=(i:number)=>`/assets/tp-rank-${i+1}.webp`;
