// Ortak filo adası görselinin saydamlığından seyir maskesi üretir (src/fleetMask.ts).
// Kullanım (depo kökünden): node tools/asset-studio/fleet-raster-mask.mjs
// 0 = kara, 1 = açık deniz, 2 = lagün (surların içi). Görsel FLEET.base.w × FLEET.base.h dünya birimine yayılır.
import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const BASE_W=1500,N=190,CELL=8,HALF=N*CELL/2;
const src='data:image/webp;base64,'+fs.readFileSync(path.join(ROOT,'public/assets/fleet-island-v4.webp')).toString('base64');
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});const p=await b.newPage();
const land=await p.evaluate(async([src,BASE_W,N,CELL,HALF])=>{const i=new Image();i.src=src;await i.decode();const W=i.width,H=i.height,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,W,H).data;
  const s=W/BASE_W,bh=H/s,out=[];
  for(let j=0;j<N;j++)for(let k=0;k<N;k++){let hit=0;for(const fy of [.2,.5,.8])for(const fx of [.2,.5,.8]){const wx=(k+fx)*CELL-HALF,wy=(j+fy)*CELL-HALF,px=Math.floor((wx+BASE_W/2)*s),py=Math.floor((wy+bh/2)*s);if(px>=0&&py>=0&&px<W&&py<H&&d[(py*W+px)*4+3]>96)hit++;}out.push(hit>=3?1:0);}
  return out;},[src,BASE_W,N,CELL,HALF]);
await b.close();
// İç adanın kuzeyi: kale çatısı ve üst iki kule kaidesi görselde yukarı uzanıp arkalarındaki suyu örter. Seyir için zemin
// izi esas alınır: iç adanın kumunun kuzeyinde (y < -125) ve üst surun iç kıyısına kadar kalan bant sudur.
for(let k=0;k<N*N;k++){const wx=(k%N+.5)*CELL-HALF,wy=((k/N|0)+.5)*CELL-HALF;if(wy<-125&&wy>-232&&(wx/360)**2+((wy+40)/190)**2<1)land[k]=0;}
// geminin merkezi için kıyıda bir hücre pay
const blocked=land.map((_,k)=>{const x=k%N,y=k/N|0;for(let ny=Math.max(0,y-1);ny<=Math.min(N-1,y+1);ny++)for(let nx=Math.max(0,x-1);nx<=Math.min(N-1,x+1);nx++)if(land[ny*N+nx])return 1;return 0;});
const open=new Uint8Array(N*N),q=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=y*N+x;if((x===0||y===0||x===N-1||y===N-1)&&!blocked[k]){open[k]=1;q.push(k);}}
while(q.length){const k=q.pop(),x=k%N,y=k/N|0;for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const j=ny*N+nx;if(nx>=0&&ny>=0&&nx<N&&ny<N&&!open[j]&&!blocked[j]){open[j]=1;q.push(j);}}}
const values=[];for(let k=0;k<N*N;k++){const wx=(k%N+.5)*CELL-HALF,wy=((k/N|0)+.5)*CELL-HALF;values.push(open[k]?((wx/700)**2+(wy/390)**2<1?2:1):0);}
const at=(wx,wy)=>values[Math.floor((wy+HALF)/CELL)*N+Math.floor((wx+HALF)/CELL)];
if(at(-430,-20)!==2||at(430,-20)!==2)throw new Error('Lagün kapılardan açık denize bağlanmalı');
const runs=[];let cur=values[0],n=0;for(const v of values){if(v===cur)n++;else{runs.push(cur+n.toString(36));cur=v;n=1;}}runs.push(cur+n.toString(36));
fs.writeFileSync(path.join(ROOT,'src/fleetMask.ts'),`// Generated from public/assets/fleet-island-v4.webp alpha by tools/asset-studio/fleet-raster-mask.mjs.\n// ${N} x ${N} cells, ${CELL} world units; origin (-${HALF},-${HALF}). 0 land, 1 sea, 2 lagoon.\nexport const FLEET_MASK={n:${N},cell:${CELL},rle:'${runs.join(',')}'};\n`);
console.log(`${values.filter(v=>v===0).length} land, ${values.filter(v=>v===1).length} sea, ${values.filter(v=>v===2).length} lagoon cells`);
