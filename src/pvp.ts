// Oyuncu–oyuncu hasar sınırı: en güçlü gemi bile bir oyuncuyu PVP_MIN_SECONDS saniyeden önce batıramasın.
// Her hedefin bir "hasar bütçesi" var; bütçe saniyede maxHp/PVP_MIN_SECONDS dolar, en fazla maxHp×PVP_BURST birikir.
// Bir isabet bütçeden fazlasını götüremez; NPC ve canavar savaşlarına dokunmaz.
export const PVP_MIN_SECONDS=30,PVP_BURST=.06;
export type PvpBudget={pool:number;t:number};
export const newPvpBudget=(maxHp:number,now:number):PvpBudget=>({pool:maxHp*PVP_BURST,t:now});
// İsabeti sınırla: verilebilecek hasarı döner ve bütçeden düşer (now saniye cinsinden)
export function pvpClamp(b:PvpBudget,maxHp:number,hit:number,now:number){
  const cap=maxHp*PVP_BURST;b.pool=Math.min(cap,b.pool+Math.max(0,now-b.t)*maxHp/PVP_MIN_SECONDS);b.t=now;
  const dealt=Math.max(0,Math.min(hit,b.pool));b.pool-=dealt;return dealt;
}
