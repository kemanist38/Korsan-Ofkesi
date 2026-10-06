export type SavedQuests={active:string|null;progress:Record<string,number>;cooldowns:Record<string,number>;rulesVersion?:number};
export function migrateQuestRules(saved:SavedQuests|null){
  if(!saved||saved.rulesVersion===2)return saved;
  const progress={...saved.progress},cooldowns:Record<string,number>={};
  for(const [id,until] of Object.entries(saved.cooldowns??{})){
    // Old deadlines were completion + 2h. Preserve completion time, extend to 8h.
    const key=id.endsWith('-chest')?id.replace(/-chest$/,'-sparkle'):id;
    if(Number.isFinite(until))cooldowns[key]=until+6*60*60*1000;
  }
  for(const id of Object.keys(progress)){
    if(id.endsWith('-chest'))delete progress[id];
    else progress[id]=Math.min(19,Math.max(0,progress[id]));
  }
  return{active:saved.active?.endsWith('-chest')?null:saved.active,progress,cooldowns,rulesVersion:2};
}
