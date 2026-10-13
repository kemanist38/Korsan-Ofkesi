// Seviye görevi: 2. seviyeden itibaren TP dolunca seviye hemen gelmez; oyuncu bulunduğu seviyenin denizinde
// ağır gemi batırarak seviyeyi açar. Görev bitene kadar kazanılan TP birikir, boşa gitmez.
// 1→2 görevsizdir (yeni oyuncu ilk seviyeyi hızlıca görsün).
export type LevelQuest={level:number;ships:number;monsters:number;map?:string};
export const LEVEL_QUEST_FROM=2;
// Canavarlar oyundan kaldırıldı: seviye görevi yalnızca ağır gemi batırmadır (monsters alanı eski kayıtlar için 0 kalır).
export const levelQuestGoal=(level:number)=>({ships:10+(level-2)*2,monsters:0});
export const levelQuestTargets=(level:number)=>({ships:[`n${level}-1-heavy`,`n${level}-2-heavy`],tier:level});
export const needsLevelQuest=(level:number)=>level>=LEVEL_QUEST_FROM;
const KEY='yedi-deniz-level-quest-v1';
export function loadLevelQuest(level:number):LevelQuest{
  try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.level===level)return{level,ships:Math.max(0,+v.ships||0),monsters:Math.max(0,+v.monsters||0),map:typeof v.map==='string'?v.map:undefined};}catch{}
  return{level,ships:0,monsters:0};
}
export function saveLevelQuest(q:LevelQuest){try{localStorage.setItem(KEY,JSON.stringify(q));}catch{}}
export function levelQuestDone(q:LevelQuest){if(!needsLevelQuest(q.level))return true;const g=levelQuestGoal(q.level);return q.ships>=g.ships&&q.monsters>=g.monsters;}
// Kill sayımı: yalnızca TP dolmuşken (görev açıkken) ve doğru seviye denizindeki hedeflerde sayılır. Sayıldıysa true.
// Seviye görevi yalnızca seviyenin ilk haritasında (ör. 3. seviye → 3/1) yapılır; başka haritadaki batırmalar sayılmaz.
export const levelQuestMap=(level:number)=>`${level}/1`;
export function levelQuestKill(q:LevelQuest,kind:'npc'|'monster',id:string,tier:number,ready:boolean,map?:string){
  if(map&&map!==levelQuestMap(q.level))return false;
  if(!ready||!needsLevelQuest(q.level)||levelQuestDone(q))return false;const g=levelQuestGoal(q.level);
  if(kind==='npc'&&levelQuestTargets(q.level).ships.includes(id)&&q.ships<g.ships){q.ships++;return true;}
  if(kind==='monster'&&tier===q.level&&q.monsters<g.monsters){q.monsters++;return true;}
  return false;
}
