// Kaptan & Muço: usta-çırak sistemi. Usta (en az Seviye 5) çıraklık isteklerini kabul eder, istemediği muçoyu çıkarabilir.
// Muço yeni oyuncudur: en fazla Seviye 5 ve ustasından en az MIN_GAP seviye aşağıda olmalı. Seviye 5 oyuncu ya muço ya usta olabilir;
// ustası olmadan Seviye 6'ya geçen bir daha muço olamaz. Muço Seviye 8'e ulaşınca mezun olur. Birlikte aynı denizdeyken muço daha çok TP kazanır, ustaya da öğretmen payı düşer.
// Gerçek oyuncu eşleşmesi sunucu gelince çalışır; şimdilik ilişki ve istekler bu cihazda saklanır.
export const MENTOR_MIN_LEVEL=5,APPRENTICE_MAX_LEVEL=5,GRADUATE_LEVEL=8,MIN_GAP=2,MAX_APPRENTICES=3;
export const TOGETHER_XP_BONUS=.5,MENTOR_SHARE=.1;
export type Mate={nick:string;level:number};
export type Apprentice=Mate&{rewarded:number[]};
// Ödüller kendiliğinden verilmez: hak edilince "pending"e düşer, oyuncu Kaptan & Muço penceresinden talep eder.
export type MentorReward={key:string;label:string;gold:number;pearls:number};
export type Mentorship={mentor:Mate|null;apprentices:Apprentice[];requests:Mate[];lockedOut:boolean;graduated:boolean;graduates:number;pending:MentorReward[];claimed:string[];startLevel?:number};
// Seviye ödülleri (1-8): her seviye için bir sandık. Muço ustasıyla ulaştığı her seviyede, usta da muçosu her seviyeye ulaştığında sandık kazanır.
// Seviye 1 sandığı çıraklık başlayınca açılır; 8 mezuniyet sandığıdır.
const AG=[50_000,75_000,100_000,150_000,250_000,300_000,400_000,600_000],AP=[20,40,60,100,200,250,350,500];
const MG=[30_000,50_000,70_000,100_000,150_000,200_000,300_000,400_000],MP=[30,60,90,150,300,400,550,800];
export const MILESTONES:{level:number;apprentice:{gold:number;pearls:number};mentor:{gold:number;pearls:number}}[]=
  AG.map((_,i)=>({level:i+1,apprentice:{gold:AG[i],pearls:AP[i]},mentor:{gold:MG[i],pearls:MP[i]}}));
const KEY='yedi-deniz-mentorship-v1';
export const emptyMentorship=():Mentorship=>({mentor:null,apprentices:[],requests:[],lockedOut:false,graduated:false,graduates:0,pending:[],claimed:[]});
export function loadMentorship():Mentorship{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'){const e={...emptyMentorship(),...v};if(!Array.isArray(e.pending))e.pending=[];if(!Array.isArray(e.claimed))e.claimed=[];return e;}}catch{}return emptyMentorship();}
export function saveMentorship(m:Mentorship){try{localStorage.setItem(KEY,JSON.stringify(m));}catch{}}

export const canMentor=(level:number)=>level>=MENTOR_MIN_LEVEL;
// Muço olabilir mi? (ustası yoksa, kilitlenmemişse ve seviyesi uygunsa)
export function apprenticeBlock(m:Mentorship,level:number):string|null{
  if(m.graduated)return 'Mezun oldun; artık muço olamazsın';
  if(m.lockedOut||level>APPRENTICE_MAX_LEVEL)return `Seviye ${APPRENTICE_MAX_LEVEL}'i ustasız geçtin; artık muço olamazsın`;
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
  m.requests=m.requests.filter(r=>r.nick!==nick);m.apprentices.push({...req,rewarded:MILESTONES.filter(s=>s.level<req.level).map(s=>s.level)});onApprenticeLevel(m,req.nick,req.level);
  return null;
}
export const rejectRequest=(m:Mentorship,nick:string)=>{m.requests=m.requests.filter(r=>r.nick!==nick);};
export const removeApprentice=(m:Mentorship,nick:string)=>{m.apprentices=m.apprentices.filter(a=>a.nick!==nick);};
// Muço bir ustaya bağlanınca: bulunduğu seviyenin sandığı hemen açılır, sonrakiler seviye atladıkça
export function joinMentor(m:Mentorship,mentor:Mate,level:number){if(level>APPRENTICE_MAX_LEVEL||m.lockedOut||m.graduated)return false;m.mentor=mentor;m.startLevel=level;onOwnLevel(m,level);return true;}
const known=(m:Mentorship,key:string)=>m.claimed.includes(key)||m.pending.some(r=>r.key===key);
export const apprenticeKey=(level:number)=>`app-${level}`;
export const mentorKey=(nick:string,level:number)=>`men-${nick}-${level}`;
// Muço kendi seviyesi değişince: ustasızsa ve 5'i geçtiyse kilitlenir; ustası varsa 8'de mezun olur.
// Yeni hak edilen ödüller talep listesine eklenir ve döner.
export function onOwnLevel(m:Mentorship,level:number){
  const out:{level:number;gold:number;pearls:number}[]=[];
  if(!m.mentor){if(level>APPRENTICE_MAX_LEVEL)m.lockedOut=true;return out;}
  const from=m.startLevel??1;for(const s of MILESTONES){const key=apprenticeKey(s.level);if(level>=s.level&&s.level>=from&&!known(m,key)){out.push({level:s.level,...s.apprentice});m.pending.push({key,label:s.level>=GRADUATE_LEVEL?'Mezuniyet sandığı':`Muço sandığı · Seviye ${s.level}`,...s.apprentice});}}
  if(level>=GRADUATE_LEVEL){m.mentor=null;m.graduated=true;}
  return out;
}
// Usta tarafı: muçonun seviyesi güncellenince yeni geçilen kilometre taşlarının usta ödüllerini döner; mezun olanı listeden çıkarır.
export function onApprenticeLevel(m:Mentorship,nick:string,level:number){
  const a=m.apprentices.find(x=>x.nick===nick),out:{level:number;gold:number;pearls:number}[]=[];if(!a)return out;
  a.level=level;for(const s of MILESTONES)if(level>=s.level&&!a.rewarded.includes(s.level)){a.rewarded.push(s.level);out.push({level:s.level,...s.mentor});m.pending.push({key:mentorKey(nick,s.level),label:`Usta sandığı · ${nick} · ${s.level>=GRADUATE_LEVEL?'mezuniyet':`Seviye ${s.level}`}`,...s.mentor});}
  if(level>=GRADUATE_LEVEL){removeApprentice(m,nick);m.graduates++;}
  return out;
}
// Bekleyen ödülü talep et: ödülü döner ve "alındı" olarak işaretler
export function claimReward(m:Mentorship,key:string):MentorReward|null{
  const i=m.pending.findIndex(r=>r.key===key);if(i<0)return null;
  const [r]=m.pending.splice(i,1);m.claimed.push(key);return r;
}
// Birlikte aynı denizdeyken muçonun TP'si artar
export const apprenticeXp=(xp:number,mentorNearby:boolean)=>mentorNearby?Math.round(xp*(1+TOGETHER_XP_BONUS)):xp;
export const mentorShare=(apprenticeXpGain:number)=>Math.round(apprenticeXpGain*MENTOR_SHARE);
