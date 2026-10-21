// Mağaza uygulaması için web paketi: dist (site + oyun) → dist-app. Uygulama doğrudan oyunla açılır (oyna/index.html kök sayfa olur);
// yönetim paneli ve oyun sunucusu paketi uygulamaya girmez. Ardından: npx cap sync
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),src=path.join(root,'dist'),out=path.join(root,'dist-app');
if(!fs.existsSync(path.join(src,'oyna/index.html')))throw new Error('önce npm run build');
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(src,out,{recursive:true});
fs.copyFileSync(path.join(out,'oyna/index.html'),path.join(out,'index.html'));
for(const d of ['srv','yonetim'])fs.rmSync(path.join(out,d),{recursive:true,force:true});
console.log('dist-app hazır');
