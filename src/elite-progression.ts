export type EliteBonus={damage:number;hp:number;reload:number;speed:number;defense:number;repair:number};
export const ELITE_CANNON_CAPACITY=315;
export const ELITE_REWARDS:Partial<EliteBonus>[]=[{},
  {damage:2},{hp:3},{reload:2},{speed:2},{damage:3},{hp:4},{reload:3},
  {defense:3},{speed:3},{damage:4},{hp:5},{reload:3},{defense:2},{repair:5},{damage:6,hp:8}
];
export function cumulativeEliteBonus(level:number):EliteBonus{
  const total:EliteBonus={damage:0,hp:0,reload:0,speed:0,defense:0,repair:0};
  for(let i=1;i<=Math.min(15,Math.max(0,Math.floor(level)));i++)
    for(const key of Object.keys(total) as (keyof EliteBonus)[])total[key]+=ELITE_REWARDS[i][key]??0;
  for(const key of Object.keys(total) as (keyof EliteBonus)[])total[key]/=100;
  return total;
}
export function eliteBonusText(b:Partial<EliteBonus>,percent=false){
  const labels:Record<keyof EliteBonus,string>={damage:'hasar',hp:'can',reload:'dolum hızı',speed:'hız',defense:'hasar azaltma',repair:'tamir'};
  return(Object.keys(labels) as (keyof EliteBonus)[]).filter(k=>b[k]).map(k=>`+%${Math.round(b[k]!*(percent?1:100))} ${labels[k]}`).join(' · ');
}
