// Sıralamalar: oyuncu ve filo tabloları. Sunucu gelene kadar liste bu tarayıcıdaki kaptan (ve test modunda test
// kaptanları) ile kurulur; sunucu bağlandığında aynı tablolar bütün oyuncuların kayıtlarıyla doldurulacak.
import {LEVEL_XP} from './campaign';

export type RankPlayer={nick:string;tag:string|null;fleet:string|null;level:number;xp:number;ep:number;sp:number;npc:number;monster:number;boss:number;treasure:number;me?:boolean};
export type RankFleet={tag:string;name:string;members:RankPlayer[];me?:boolean};
export type BoardId='xp'|'ep'|'sp'|'boss'|'monster'|'npc'|'treasure'|'fleetXp'|'fleetSp';
export type Board={id:BoardId;name:string;unit:string;fleet:boolean;desc:string};
export const BOARDS:Board[]=[
  {id:'xp',name:'Oyuncu Tecrübe',unit:'TP',fleet:false,desc:'Toplam kazanılan tecrübe puanı'},
  {id:'ep',name:'Elit Puan',unit:'EP',fleet:false,desc:'Toplam elit puan'},
  {id:'sp',name:'Oyuncu Savaş Puanı',unit:'SP',fleet:false,desc:'Rakip kaptan batırarak kazanılan savaş puanı'},
  {id:'boss',name:'Boss Avcıları',unit:'boss',fleet:false,desc:'Batırılan harita bossu'},
  {id:'monster',name:'Canavar Avcıları',unit:'canavar',fleet:false,desc:'Yenilen deniz canavarı'},
  {id:'npc',name:'Deniz Kurtları',unit:'gemi',fleet:false,desc:'Batırılan NPC gemisi'},
  {id:'treasure',name:'Define Avcıları',unit:'define',fleet:false,desc:'Kazılan hazine'},
  {id:'fleetXp',name:'Filo Tecrübe',unit:'TP',fleet:true,desc:'Filo üyelerinin toplam tecrübe puanı'},
  {id:'fleetSp',name:'Filo Savaş Puanı',unit:'SP',fleet:true,desc:'Filo üyelerinin toplam savaş puanı'},
];
// Seviye atlarken TP sıfırlandığı için sıralama toplam TP'yi kullanır: geçilen seviyelerin eşikleri + mevcut TP
export const totalXp=(level:number,xp:number)=>LEVEL_XP.slice(1,Math.max(1,level)).reduce((t,v)=>t+v,0)+Math.max(0,xp);
const playerScore=(p:RankPlayer,id:BoardId)=>id==='xp'?totalXp(p.level,p.xp):id==='ep'?p.ep:id==='sp'?p.sp:id==='boss'?p.boss:id==='monster'?p.monster:id==='npc'?p.npc:id==='treasure'?p.treasure:0;
const sum=(f:RankFleet,id:BoardId)=>f.members.reduce((t,m)=>t+playerScore(m,id),0);
export function fleetScore(f:RankFleet,id:BoardId){return id==='fleetXp'?sum(f,'xp'):id==='fleetSp'?sum(f,'sp'):0;}
export type RankRow={rank:number;name:string;tag:string|null;sub:string;score:number;me:boolean;sp?:number};
// Büyükten küçüğe; eşit puanda aynı sıra numarası verilir (1, 2, 2, 4)
export function rankRows(id:BoardId,players:RankPlayer[],fleets:RankFleet[]):RankRow[]{
  const board=BOARDS.find(b=>b.id===id)!;
  const rows=board.fleet?fleets.map(f=>({name:f.name,tag:f.tag,sub:`${f.members.length} üye`,score:fleetScore(f,id),me:!!f.me}))
    :players.map(p=>({name:p.nick,tag:p.tag,sub:`Seviye ${p.level}${p.fleet?` · ${p.fleet}`:''}`,score:playerScore(p,id),me:!!p.me,sp:p.sp}));
  rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'tr'));
  let rank=0;return rows.map((r,i)=>{if(i===0||rows[i-1].score!==r.score)rank=i+1;return{...r,rank};});
}
// Sayfalama: her sayfada 100 sıra. page 0'dan başlar; aralık dışı sayfa son geçerli sayfaya çekilir.
export const RANK_PAGE_SIZE=100;
export function rankPage<T>(rows:T[],page:number,size=RANK_PAGE_SIZE){const pages=Math.max(1,Math.ceil(rows.length/size)),p=Math.max(0,Math.min(pages-1,Math.floor(page)));
  return{rows:rows.slice(p*size,(p+1)*size),page:p,pages};}
