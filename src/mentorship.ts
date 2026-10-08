// Kaptan & Muço: usta-çırak sistemi. Usta (en az Seviye 5) çıraklık isteklerini kabul eder, istemediği muçoyu çıkarabilir.
// Muço yeni oyuncudur: ustasından en az MIN_GAP seviye aşağıda olmalı. Ustası olmadan Seviye 8'e ulaşan bir daha muço olamaz;
// muço Seviye 8'e ulaşınca mezun olur. Birlikte aynı denizdeyken muço daha çok TP kazanır, ustaya da öğretmen payı düşer.
// Gerçek oyuncu eşleşmesi sunucu gelince çalışır; şimdilik ilişki ve istekler bu cihazda saklanır.
export const MENTOR_MIN_LEVEL=5,APPRENTICE_MAX_LEVEL=7,GRADUATE_LEVEL=8,MIN_GAP=2,MAX_APPRENTICES=3;
export const TOGETHER_XP_BONUS=.5,MENTOR_SHARE=.1;
export type Mate={nick:string;level:number};
export type Apprentice=Mate&{rewarded:number[]};
export type Mentorship={mentor:Mate|null;apprentices:Apprentice[];requests:Mate[];lockedOut:boolean;graduated:boolean;graduates:number};
// Seviye ödülleri: muço bu seviyeye ulaşınca ikisi birden ödül alır (8 = mezuniyet)
export const MILESTONES:{level:number;apprentice:{gold:number;pearls:number};mentor:{gold:number;pearls:number}}[]=[
  {level:5,apprentice:{gold:250_000,pearls:200},mentor:{gold:150_000,pearls:300}},
  {level:GRADUATE_LEVEL,apprentice:{gold:600_000,pearls:500},mentor:{gold:400_000,pearls:800}},
];
const KEY='yedi-deniz-mentorship-v1';
export const emptyMentorship=():Mentorship=>({mentor:null,apprentices:[],requests:[],lockedOut:false,graduated:false,graduates:0});
export function loadMentorship():Mentorship{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')return{...emptyMentorship(),...v};}catch{}return emptyMentorship();}
export function saveMentorship(m:Mentorship){try{localStorage.setItem(KEY,JSON.stringify(m));}catch{}}

export const canMentor=(level:number)=>level>=MENTOR_MIN_LEVEL;
// Muço olabilir mi? (ustası yoksa, kilitlenmemişse ve seviyesi uygunsa)
export function apprenticeBlock(m:Mentorship,level:number):string|null{
  if(m.graduated)return 'Mezun oldun; artık muço olamazsın';
  if(m.lockedOut||level>=GRADUATE_LEVEL)return `Seviye ${GRADUATE_LEVEL}'e ustasız ulaştın; artık muço olamazsın`;
  if(level>APPRENTICE_MAX_LEVEL)return `Muçolar en fazla Seviye ${APPRENTICE_MAX_LEVEL} olabilir`;
  return null;
}
// Usta, bu isteği kabul edebilir mi? Engel varsa sebebini döner.
export function pairBlock(m:Mentorship,mentorLevel:number,req:Mate):string|null{
  if(!canMentor(mentorLevel))return `Usta olmak için en az Seviye ${MENTOR_MIN_LEVEL} olmalısın`;
  if(m.mentor)return 'Ustan varken muço kabul edemezsin';
  if(m.apprentices.length>=MAX_APPRENTICES)return `En fazla ${MAX_APPRENTICES} muçon olabilir`;
  if(req.level>APPRENTICE_MAX_LEVEL)return `${req.nick} muço olamaz (Seviye ${req.level})`;
  if(mentorLevel-req.level<MIN_GAP)return `Aranızda en az ${MIN_GAP} seviye fark olmalı`;
  if(m.apprentices.some(a=>a.nick===req.nick))return `${req.nick} zaten muçon`;
  return null;
}
export function acceptRequest(m:Mentorship,mentorLevel:number,nick:string):string|null{
  const req=m.requests.find(r=>r.nick===nick);if(!req)return 'İstek bulunamadı';
  const block=pairBlock(m,mentorLevel,req);if(block)return block;
  m.requests=m.requests.filter(r=>r.nick!==nick);m.apprentices.push({...req,rewarded:MILESTONES.filter(s=>req.level>=s.level).map(s=>s.level)});
  return null;
}
export const rejectRequest=(m:Mentorship,nick:string)=>{m.requests=m.requests.filter(r=>r.nick!==nick);};
export const removeApprentice=(m:Mentorship,nick:string)=>{m.apprentices=m.apprentices.filter(a=>a.nick!==nick);};
// Muço kendi seviyesi değişince: ustasızsa ve 8'e ulaştıysa kilitlenir; ustası varsa 8'de mezun olur.
// Dönen ödüller muçoya verilir.
export function onOwnLevel(m:Mentorship,level:number){
  const out:{level:number;gold:number;pearls:number}[]=[];
  if(!m.mentor){if(level>=GRADUATE_LEVEL)m.lockedOut=true;return out;}
  for(const s of MILESTONES)if(level>=s.level)out.push({level:s.level,...s.apprentice});
  if(level>=GRADUATE_LEVEL){m.mentor=null;m.graduated=true;}
  return out;
}
// Usta tarafı: muçonun seviyesi güncellenince yeni geçilen kilometre taşlarının usta ödüllerini döner; mezun olanı listeden çıkarır.
export function onApprenticeLevel(m:Mentorship,nick:string,level:number){
  const a=m.apprentices.find(x=>x.nick===nick),out:{level:number;gold:number;pearls:number}[]=[];if(!a)return out;
  a.level=level;for(const s of MILESTONES)if(level>=s.level&&!a.rewarded.includes(s.level)){a.rewarded.push(s.level);out.push({level:s.level,...s.mentor});}
  if(level>=GRADUATE_LEVEL){removeApprentice(m,nick);m.graduates++;}
  return out;
}
// Birlikte aynı denizdeyken muçonun TP'si artar
export const apprenticeXp=(xp:number,mentorNearby:boolean)=>mentorNearby?Math.round(xp*(1+TOGETHER_XP_BONUS)):xp;
export const mentorShare=(apprenticeXpGain:number)=>Math.round(apprenticeXpGain*MENTOR_SHARE);
