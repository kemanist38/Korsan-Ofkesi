// Sohbet filtresi: küfür ve hakaret içeren kelimeler yıldızla gizlenir. Sunucu global sohbeti göndermeden önce filtreler,
// oyun da filo sohbetini gösterirken aynı filtreyi uygular. Harf oyunları (a$k, 4mk, s.i.k) yakalanır; liste bilerek paylaşılmaz.
const ROOTS=['amk','amq','aq','amına','amina','aminakoy','amcık','amcik','orospu','orosbu','piç','pic','sik','yarrak','yarak','göt','got','oç','oc','pezevenk','kahpe','gavat','ibne','yavşak','yavsak','puşt','pust','kaltak','sürtük','surtuk','ananı','anani','bacını','bacini','fuck','shit','bitch','dick','pussy','whore','nigga','nigger'];
// Kısa köklerle başlayan masum kelimeler (sik → siklet, göt → götür, oc → ocak, pic → piknik, got → gotik)
const SAFE=['sikayet','siklet','siklon','sıkı','sıkıl','sıkış','sıkıntı','götür','gotik','ocak','ocağ','piknik','pick','amin','amir','amiral','gotham','ocean'];
const LEET:Record<string,string>={'4':'a','@':'a','3':'e','1':'i','!':'i','0':'o','5':'s','$':'s','7':'t'};
const norm=(w:string)=>w.toLocaleLowerCase('tr').replace(/[4@3105$7!]/g,c=>LEET[c]??c).replace(/[^a-zçğıöşü]/g,'').replace(/(.)\1+/g,'$1');
const SAFE_N=SAFE.map(norm),ROOTS_N=[...new Set(ROOTS.map(norm))];
function bad(w:string){const n=norm(w);if(n.length<2)return false;if(SAFE_N.some(s=>n===s||(s.length>=4&&n.startsWith(s))))return false;
  return ROOTS_N.some(k=>k.length<=3?n.startsWith(k):n.includes(k));}
export function filterChat(text:string){return text.replace(/\S+/g,w=>bad(w)?'*'.repeat(Math.min(8,w.length)):w);}
export const chatHasBad=(text:string)=>text.split(/\s+/).some(bad);
