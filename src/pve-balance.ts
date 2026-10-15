// PvE durability and rewards are independent: changing HP must not inflate the economy.
// Columns: small NPC, medium NPC, large NPC, monster. Both maps share the same tier values.
export const PVE_HP=[[],
  [8000,18000,35000,60000],[20000,45000,85000,140000],
  [45000,90000,170000,280000],[80000,160000,300000,500000],
  [130000,260000,480000,800000],[200000,400000,750000,1250000],
  [300000,600000,1100000,1800000],[450000,900000,1650000,2600000]
];
export const PVE_XP=[[],
  [100,175,300,500],[160,280,480,800],[250,440,750,1250],
  [400,700,1200,2000],[600,1050,1800,3000],[900,1575,2700,4500],
  [1300,2275,3900,6500],[1800,3150,5400,9000]
];
// Boss canı (tek oyuncu ateş güllesiyle ~2 dk); oyun sunucusu da paylaşılan boss için bunu kullanır.
export const BOSS_HP=[0,165000,410000,980000,2200000,3000000,4500000,5800000,6300000];
