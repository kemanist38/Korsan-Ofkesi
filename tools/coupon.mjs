// Yeni kupon satırı üretir: node tools/coupon.mjs KOD pearls=100 gold=50000 xp=0 ep=0 vipDays=0 until=2026-12-31 "note=Etkinlik"
// Çıktıyı src/coupons.ts içindeki COUPONS listesine yapıştır. Kodun kendisini kaynağa yazma.
import {createHash} from 'node:crypto';
const [code,...args]=process.argv.slice(2);
if(!code){console.error('Kullanım: node tools/coupon.mjs KOD pearls=100 gold=50000 until=2026-12-31 "note=Açıklama"');process.exit(1);}
const norm=code.trim().replace(/[iıİ]/g,'I').toUpperCase().replace(/\s+/g,'');
const opt=Object.fromEntries(args.map(a=>{const i=a.indexOf('=');return[a.slice(0,i),a.slice(i+1)];}));
const reward=Object.fromEntries(['pearls','gold','xp','ep','vipDays'].filter(k=>opt[k]).map(k=>[k,Number(opt[k])]));
const hash=createHash('sha256').update(norm).digest('hex');
console.log(`  // ${norm}\n  {hash:'${hash}',reward:${JSON.stringify(reward)},${opt.until?`until:'${opt.until}',`:''}note:${JSON.stringify(opt.note??'Etkinlik')}},`);
