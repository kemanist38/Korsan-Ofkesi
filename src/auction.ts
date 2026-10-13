// Altın ihalesi: her saat başı yeni ihale açılır. Lotlar saatin numarasından üretilir, böylece bütün oyuncular aynı lotları görür.
// Teklifler canlı kanaldan yayılır; en yüksek teklif kazanır (eşitse önce veren). Teklif verilen altın emanete alınır,
// teklif geçilirse hemen geri verilir; saat dolunca kazanan eşyayı alır ve ihale sıfırlanır.
export const AUCTION_MS=3600000;
export type LotKind='cannon'|'ammo'|'supply';
export type LotDef={key:string;kind:LotKind;item:string;qty:number};
// Teklif verenin yalnızca kaptan adı gösterilir; kazananı tanımak için ayrıca gizli kimlik taşınır
export type Bid={hour:number;lot:string;amount:number;id:string;nick:string;at:number};
export type AuctionState={hour:number;top:Record<string,Bid>;mine:Record<string,number>};

// Lot havuzu (başlangıç fiyatı yok: ilk teklif istenen herhangi bir tutar olabilir)
const POOL:LotDef[]=[
  {key:'heavy',kind:'cannon',item:'heavy',qty:20},
  {key:'rapid',kind:'cannon',item:'rapid',qty:20},
  {key:'long',kind:'cannon',item:'long',qty:20},
  {key:'explosive',kind:'ammo',item:'explosive',qty:3000},
  {key:'leech',kind:'ammo',item:'leech',qty:3000},
  {key:'breaker',kind:'ammo',item:'breaker',qty:3000},
  {key:'fire',kind:'ammo',item:'fire',qty:3000},
  {key:'heal',kind:'ammo',item:'heal',qty:3000},
  {key:'speed',kind:'supply',item:'speed',qty:20},
  {key:'mine',kind:'supply',item:'mine',qty:15},
  {key:'shield',kind:'supply',item:'shield',qty:300},
  {key:'powder',kind:'supply',item:'powder',qty:300},
];
export const auctionHour=(now:number)=>Math.floor(now/AUCTION_MS);
export const auctionEnds=(hour:number)=>(hour+1)*AUCTION_MS;
function rng(seed:number){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
// Her saat 4 lot: bir top, bir gülle, bir malzeme ve rastgele bir tane daha (aynı lot iki kez çıkmaz)
export function lotsFor(hour:number):LotDef[]{const r=rng(hour*2654435761),pick=(list:LotDef[])=>list[Math.floor(r()*list.length)];
  const out:LotDef[]=[];for(const kind of ['cannon','ammo','supply'] as LotKind[])out.push(pick(POOL.filter(l=>l.kind===kind)));
  out.push(pick(POOL.filter(l=>!out.includes(l))));return out;}
// Bir sonraki geçerli teklif: ilk teklif en az 1 altın; sonrakiler en yüksek teklifin %5 fazlası (en az +100), 100'e yuvarlanır
export function minNextBid(_lot:LotDef,top?:Bid){if(!top)return 1;return Math.ceil(Math.max(top.amount+100,top.amount*1.05)/100)*100;}
// a teklifi b'yi geçer mi: daha yüksek olan, eşitse önce verilen kazanır (eşit anda kimlik sırası)
export const beats=(a:Bid,b?:Bid)=>!b||a.amount>b.amount||(a.amount===b.amount&&(a.at<b.at||(a.at===b.at&&a.id<b.id)));
export const emptyAuction=(hour:number):AuctionState=>({hour,top:{},mine:{}});

const STORE='yedi-deniz-auction-v1',ID_STORE='yedi-deniz-auction-id';
// Kazananı sayfa yenilense de tanıyabilmek için kalıcı kimlik (ağ kimliği her sekmede değişir)
export const auctionId=(()=>{try{let v=localStorage.getItem(ID_STORE);if(!v){v=Math.random().toString(36).slice(2,12);localStorage.setItem(ID_STORE,v);}return v;}catch{return Math.random().toString(36).slice(2,12);}})();
export function loadAuction(now:number):AuctionState{try{const s=JSON.parse(localStorage.getItem(STORE)||'null');if(s&&typeof s.hour==='number'&&s.top&&s.mine)return s;}catch{}return emptyAuction(auctionHour(now));}
export function saveAuction(s:AuctionState){try{localStorage.setItem(STORE,JSON.stringify(s));}catch{}}
// Biten ihalede kazanılan lotlar (en yüksek teklif bizimse)
export function wonLots(s:AuctionState,me:string){const lots=lotsFor(s.hour);return lots.filter(l=>s.top[l.key]?.id===me&&s.mine[l.key]===s.top[l.key].amount);}
// Gelen teklif: geçerliyse en yüksek teklif olur. Bizim teklifimiz geçildiyse iade edilecek tutar döner.
export function applyBid(s:AuctionState,b:Bid,me:string):{accepted:boolean;refund:number}{
  if(b.hour!==s.hour||!lotsFor(s.hour).some(l=>l.key===b.lot)||!(b.amount>0))return{accepted:false,refund:0};
  const cur=s.top[b.lot];if(!beats(b,cur))return{accepted:false,refund:0};
  let refund=0;if(cur&&cur.id===me&&b.id!==me){refund=s.mine[b.lot]??0;delete s.mine[b.lot];}
  s.top[b.lot]=b;return{accepted:true,refund};}
