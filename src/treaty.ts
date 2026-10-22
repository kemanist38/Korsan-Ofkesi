// Deniz Antlaşması (Perşembe etkinliği): bütün denizlerde toplanan pırıltılar ortak sayaca yazılır. Hedef (son 24 saatte
// giren kaptan × 15, en az 300 en çok 5.000) dolunca 1/1'de Deniz Elçisi demir atar ve 30 dk oylama açılır. Seçilen etki
// 24 saat o turda en az 40 pırıltı toplamış kaptanlara işler (oy da yalnız onlarındır); onlar katılım ödülü, en çok toplayan ilk 3 sıra ödülü de alır.
// Hiç toplamayan ya da 40'a ulaşmayan kaptana etki işlemez. Her şeyi sunucu yürütür.
import type {TreatyFxId} from './events';
export const TREATY_FX:Record<TreatyFxId,{name:string;desc:string}>={
  dmg:{name:'Savaş Antlaşması',desc:'NPC ve boss\'a %5 fazla hasar (PvP\'ye işlemez)'},
  treasure:{name:'Hazine Antlaşması',desc:'Sandıklardan hazine parçası çıkma şansı 2 kat'},
  ammo:{name:'Cephane Antlaşması',desc:'Batırdığın her NPC\'den +10 Ateş Güllesi'},
  gold:{name:'Altın Antlaşması',desc:'Bütün altın kazançları %10 fazla'},
  xp:{name:'Tecrübe Antlaşması',desc:'Bütün TP kazançları %10 fazla'},
};
export const TREATY_FX_IDS=Object.keys(TREATY_FX) as TreatyFxId[];
export const TREATY_MAP='1/1',TREATY_VOTE_MS=30*60_000,TREATY_FX_MS=24*3600_000,TREATY_MIN_PICKS=40,TREATY_ENVOY_R=140;
export const TREATY_PRIZES=[{pearls:300,gold:150_000},{pearls:200,gold:100_000},{pearls:100,gold:50_000}];
export const TREATY_JOIN={pearls:25,gold:25_000};
export const treatyGoal=(active:number)=>Math.max(300,Math.min(5000,Math.round(active)*15));
export type TreatyPhase='idle'|'collect'|'vote'|'done'|'fail';
export type TreatyInfo={phase:TreatyPhase;goal:number;count:number;options:TreatyFxId[];tally:number[];voteEnd:number;now:number;
  fx:{id:TreatyFxId;until:number}|null;fxMine:boolean;envoy:{map:string;x:number;y:number}|null;top:[string,number][];mine:number;myVote:number;double:boolean};
// Oyların sayımı: önceki turun birincisinin oyu 2 sayılır; eşitlikte rastgele
export function treatyTally(options:TreatyFxId[],votes:Record<string,number>,double:string|null){const t=options.map(()=>0);
  for(const [uid,o] of Object.entries(votes))if(o>=0&&o<t.length)t[o]+=uid===double?2:1;return t;}
export function treatyWinner(tally:number[],rand=Math.random){const best=Math.max(...tally),idx=tally.flatMap((v,i)=>v===best?[i]:[]);return idx[Math.floor(rand()*idx.length)];}
// Ödüller: sıralama toplanan pırıltıya göre (eşitlikte önce toplayan önde); katılım ödülü ilk 3'e de ayrıca verilir
export function treatyRewards(contrib:[string,number][]){const out=new Map<string,{pearls:number;gold:number;rank:number}>();
  contrib.filter(([,n])=>n>=TREATY_MIN_PICKS).forEach(([uid,n],i)=>{void n;const p=TREATY_PRIZES[i];out.set(uid,{pearls:TREATY_JOIN.pearls+(p?.pearls??0),gold:TREATY_JOIN.gold+(p?.gold??0),rank:p?i+1:0});});
  return out;}
