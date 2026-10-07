// Testler için ortak TypeScript yükleyici: src altındaki dosyayı bağımlılıklarıyla (./campaign, ./economy, ./pve-balance …)
// tek bir ES modülüne paketler. Böylece kaynak dosyalara yeni import eklendiğinde testler bozulmaz.
import {build} from 'esbuild';
export async function loadTs(rel){
  const r=await build({entryPoints:[new URL(`../src/${rel}`,import.meta.url).pathname],bundle:true,format:'esm',platform:'neutral',target:'es2022',write:false,logLevel:'silent'});
  return import(`data:text/javascript;base64,${Buffer.from(r.outputFiles[0].text).toString('base64')}`);
}
