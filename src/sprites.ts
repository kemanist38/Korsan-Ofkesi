// Raster sprite sayfaları: NPC gemileri, canavarlar, adalar, filo adaları, sandıklar, mayınlar.
// Görseller tools/asset-studio içindeki 3B modellerden üretilir (npm run render).
import {FLEET_SCALE} from './campaign';
export type ChestKind='wood'|'gilded';

const cache=new Map<string,HTMLImageElement>();
function load(src:string){let image=cache.get(src);if(!image){image=new Image();image.decoding='async';image.src=src;cache.set(src,image);}return image;}
const ready=(image:HTMLImageElement)=>image.complete&&image.naturalWidth>0;
export function preload(srcs:string[]){srcs.filter(Boolean).forEach(load);}

// NPC gemileri: 16 yön, 8 sütun × 2 satır, 192 px kare; kare 0 = kuzey, saat yönünde 22,5°.
// span: karenin kapsadığı dünya birimi. Oyunda 1 birim ≈ 1,23 px.
const SHIP={frame:192,dirs:16,cols:8,anchorX:96,anchorY:108.35,pxPerUnit:1.23};
export const shipDrawSize=(span:number)=>span*SHIP.pxPerUnit;
export const shipLabelOffset=(span:number)=>-Math.round(shipDrawSize(span)*.46);
// 4 görünüşlü sayfa (dosya adında "-iso-"): elitler gibi sıra KD, GD, GB, KB; açı hangi çeyrekteyse o çapraz çizilir.
// Ölçüye bakılmaz: eski 16 yönlü sayfa (8 × 2 kare) de genişlik = 4 × yükseklik olduğu için ayırt edilemez.
export function isoQuadrant(angle:number){const a=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);return a<Math.PI/2?0:a<Math.PI?1:a<Math.PI*1.5?2:3;}
export function drawNpcShip(ctx:CanvasRenderingContext2D,sprite:string,span:number,x:number,y:number,angle:number,time:number){
  if(!sprite)return false;
  const sheet=load(sprite);if(!ready(sheet))return false;
  if(sprite.includes('-iso-')){const F=sheet.naturalHeight,size=shipDrawSize(span),i=isoQuadrant(angle);void time;
    ctx.save();ctx.shadowColor='#000a';ctx.shadowBlur=11;ctx.shadowOffsetY=3;ctx.drawImage(sheet,i*F,0,F,F,x-size*SHIP.anchorX/SHIP.frame,y-size*SHIP.anchorY/SHIP.frame,size,size);ctx.restore();return true;}
  const step=Math.PI*2/SHIP.dirs,index=((Math.round(angle/step)%SHIP.dirs)+SHIP.dirs)%SHIP.dirs;
  // Kare boyu sayfadan okunur (NPC 192 px, boss 224 px); çapa karenin aynı oranındadır.
  const F=sheet.naturalWidth/SHIP.cols,size=shipDrawSize(span),k=size/F;void time;
  ctx.save();ctx.shadowColor='#000a';ctx.shadowBlur=11;ctx.shadowOffsetY=3;
  ctx.drawImage(sheet,(index%SHIP.cols)*F,Math.floor(index/SHIP.cols)*F,F,F,x-F*SHIP.anchorX/SHIP.frame*k,y-F*SHIP.anchorY/SHIP.frame*k,size,size);
  ctx.restore();return true;
}

// Canavarlar: 8 karelik döngü, 4 × 2, 256 px kare; geçişli çizilir.
// Canavar: tek kare (256 px, güneybatıya bakan); yön değiştirmez, yalnızca hafifçe süzülür.
export function drawMonsterSheet(ctx:CanvasRenderingContext2D,def:{sprite:string;span:number;anchorY:number;radius:number},x:number,y:number,phase:number){
  if(!def.sprite)return false;
  const img=load(def.sprite);if(!ready(img))return false;
  const size=def.span*def.radius/55,k=size/256;
  ctx.drawImage(img,x-size/2,y-def.anchorY*k+Math.sin(phase*1.3)*1.5,size,size);
  return true;
}

// Eight themed sheets, each with six supplied islands in a 3 × 2 grid.
const ISLAND_SHEETS:Record<string,string>={
  haven:'islands-haven-v2.webp',coral:'islands-coral-v2.webp',
  verdant:'islands-verdant-v2.webp',misty:'islands-misty-v2.webp',
  ice:'islands-ice-v2.webp',storm:'islands-storm-v2.webp',
  abyss:'islands-abyss-v2.webp',lava:'islands-lava-v2.webp',
};
export function islandSheetUrl(look:string){return `/assets/${ISLAND_SHEETS[look]??ISLAND_SHEETS.haven}`;}
export function drawIslandSprite(ctx:CanvasRenderingContext2D,island:{look:string;variant:number;r:number;flip?:boolean},x:number,y:number){
  const sheet=load(islandSheetUrl(island.look));if(!ready(sheet))return false;
  const size=island.r*2.36;ctx.save();ctx.translate(x,y);if(island.flip)ctx.scale(-1,1);
  const frame=Math.max(0,Math.min(5,Math.floor(island.variant))),cw=sheet.naturalWidth/3,ch=sheet.naturalHeight/2;
  ctx.drawImage(sheet,(frame%3)*cw,Math.floor(frame/3)*ch,cw,ch,-size/2,-size/2,size,size);ctx.restore();return true;
}

// Ortak filo adası (tüm denizlerde aynı görsel, 1500 × 838 dünya birimi) ve tek tip filo kulesi.
// Deniz farkı renk tonuyla verilir: görsel yüklenince tema başına bir kez boyanıp önbelleğe alınır.
export const fleetBaseUrl=(_theme:string)=>'/assets/fleet-island-v4.webp';
export const fleetTowerUrl=(_theme:string)=>'/assets/fleet-tower-v6.webp';
export const FLEET_ART={w:1500*FLEET_SCALE,h:838*FLEET_SCALE};
const FLEET_TINT:Record<string,{dark:number;color:string;alpha:number}>={
  coral:{dark:0,color:'#ff9fb6',alpha:.1},verdant:{dark:0,color:'#7fcf5f',alpha:.1},misty:{dark:.04,color:'#d8c8a8',alpha:.06},
  ice:{dark:0,color:'#cfeaff',alpha:.24},storm:{dark:.1,color:'#7f98c4',alpha:.16},abyss:{dark:.32,color:'#7a3cff',alpha:.16},lava:{dark:.26,color:'#ff6a2a',alpha:.14}};
let towerTheme='coral';
export function setTowerTheme(theme:string){towerTheme=theme;}
const tinted=new Map<string,HTMLCanvasElement>();
function tintedArt(url:string,theme:string){const img=load(url);if(!ready(img))return null;const key=url+'|'+theme;let c=tinted.get(key);if(c)return c;
  c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d')!;x.drawImage(img,0,0);
  const t=FLEET_TINT[theme];if(t){x.globalCompositeOperation='source-atop';if(t.dark){x.globalAlpha=t.dark;x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);}x.globalAlpha=t.alpha;x.fillStyle=t.color;x.fillRect(0,0,c.width,c.height);}
  tinted.set(key,c);return c;}
export function drawFleetBase(ctx:CanvasRenderingContext2D,theme:string,x:number,y:number){
  // Saydam deniz/lagün; doğu ve batı kapıları, 16 boş kare kule kaidesi.
  const art=tintedArt(fleetBaseUrl(theme),theme);if(!art)return false;
  ctx.drawImage(art,x-FLEET_ART.w/2,y-FLEET_ART.h/2,FLEET_ART.w,FLEET_ART.h);return true;
}
// İç adanın yüksek parçaları (kale ve üst iki kule kaidesi): arkasından geçen geminin üstüne yeniden çizilir ki gemi
// gerçekten arkada kalsın. rects: ada merkezine göre dünya birimi [x0,y0,x1,y1].
export const FLEET_OCCLUDERS:[number,number,number,number][]=([[-86,-230,86,48],[-237,-134,-71,-29],[99,-131,249,-28]] as [number,number,number,number][]).map(r=>r.map(v=>v*FLEET_SCALE) as [number,number,number,number]);
export function drawFleetOccluder(ctx:CanvasRenderingContext2D,theme:string,x:number,y:number){
  const art=tintedArt(fleetBaseUrl(theme),theme);if(!art)return;const k=art.width/FLEET_ART.w;
  for(const [x0,y0,x1,y1] of FLEET_OCCLUDERS)ctx.drawImage(art,(x0+FLEET_ART.w/2)*k,(y0+FLEET_ART.h/2)*k,(x1-x0)*k,(y1-y0)*k,x+x0,y+y0,x1-x0,y1-y0);
}
// Rakip adanın varsayılan top kuleleri; oyuncu kuleleriyle aynı yerleşim.
export function drawBastion(ctx:CanvasRenderingContext2D,slot:number,x:number,y:number,alpha=1){
  return drawBuiltTower(ctx,0,slot,x,y,alpha);
}
// İnce kare taş kule: onaylı ada tasarımıyla aynı çatı ve ışık, 65 × 158 dünya birimi.
// Çapa, kare temelin alt ucudur; 16 kaidenin tamamında aynı sprite kullanılır.
export const TOWER_ART={w:65,h:158,anchorX:.5,anchorY:.987};
export function drawBuiltTower(ctx:CanvasRenderingContext2D,_frame:number,slot:number,x:number,y:number,alpha=1){
  const art=tintedArt(fleetTowerUrl(''),towerTheme);if(slot<0||slot>=16||!art)return false;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.drawImage(art,x-TOWER_ART.w*TOWER_ART.anchorX,y-TOWER_ART.h*TOWER_ART.anchorY,TOWER_ART.w,TOWER_ART.h);
  ctx.restore();return true;
}
export const TOWER_LABEL_OFFSET=-164;

// Ganimet sandıkları: 2 kare (tahta, yaldızlı), 128 px.
const CHEST={frame:128,anchorX:64,anchorY:70.8,size:46};
export function drawChestSprite(ctx:CanvasRenderingContext2D,kind:ChestKind,x:number,y:number,time:number,alpha=1){
  const sheet=load('/assets/loot-chests-v1.webp'),bob=Math.sin(time/380+x*.02)*1.8,k=CHEST.size/CHEST.frame;
  ctx.save();ctx.globalAlpha=alpha;
  if(kind==='gilded'){const glow=ctx.createRadialGradient(x,y,4,x,y,34);glow.addColorStop(0,'#ffd97a55');glow.addColorStop(1,'#ffd97a00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,34,0,Math.PI*2);ctx.fill();}
  if(ready(sheet))ctx.drawImage(sheet,kind==='gilded'?CHEST.frame:0,0,CHEST.frame,CHEST.frame,x-CHEST.anchorX*k,y+bob-CHEST.anchorY*k,CHEST.size,CHEST.size);
  else{ctx.fillStyle=kind==='gilded'?'#b8862f':'#6a4128';ctx.fillRect(x-9,y-7+bob,18,13);}
  ctx.restore();
}

// Deniz pırıltısı: su yüzünde parlayan inci, 8 karelik döngü (4 × 2, 128 px).
export function drawSeaSparkle(ctx:CanvasRenderingContext2D,x:number,y:number,time:number,seed:number,alpha=1){
  const sheet=load('/assets/sea-sparkle-v1.webp'),size=58,frame=Math.floor(time/110+seed*8)%8;
  ctx.save();ctx.globalAlpha=alpha;
  if(ready(sheet))ctx.drawImage(sheet,(frame%4)*128,Math.floor(frame/4)*128,128,128,x-size/2,y-size/2,size,size);
  else{ctx.fillStyle='#f4ecf4';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();}
  ctx.restore();
}

// Deniz mayını: 128 px, yarısı suya gömülü.
export function drawMineSprite(ctx:CanvasRenderingContext2D,x:number,y:number,time:number,arming:boolean,expiring:boolean){
  const sheet=load('/assets/sea-mine-v1.webp'),size=40,k=size/128,bob=Math.sin(time/300+x)*1.2;
  ctx.save();if(expiring)ctx.globalAlpha=Math.floor(time/180)%2?.4:.9;
  if(ready(sheet))ctx.drawImage(sheet,x-64*k,y+bob-68.8*k,size,size);else{ctx.fillStyle='#1d1f22';ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();}
  if(!arming){ctx.fillStyle=Math.floor(time/400)%2?'#ff5a3a':'#ff5a3a55';ctx.beginPath();ctx.arc(x,y-11+bob,2.4,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

// Deniz: harita renginin üstüne binen, kesintisiz tekrarlanan raster ışıltı dokusu.
let seaPattern:CanvasPattern|null=null;
export function seaTilePattern(ctx:CanvasRenderingContext2D){const tile=load('/assets/sea-tile-v3.webp');if(!seaPattern&&ready(tile))seaPattern=ctx.createPattern(tile,'repeat');return seaPattern;}

// Portre atlası: hücre indeksinden CSS arka plan konumu.
export function portraitStyle(atlas:string,index:number,count:number,cols:number){
  if(!atlas)return '';
  const lavaPortraits:Record<number,number>={28:0,29:1,30:1,31:2,46:3,47:4};
  const voidPortraits:Record<number,number>={24:0,25:1,26:1,27:2,44:3,45:4};
  const stormPortraits:Record<number,number>={20:0,21:1,22:1,23:2,42:3,43:4};
  const frostPortraits:Record<number,number>={16:0,17:1,18:1,19:2,40:3,41:4};
  const hauntPortraits:Record<number,number>={12:0,13:1,14:1,15:2,38:3,39:4};
  const azurPortraits:Record<number,number>={8:0,9:1,10:1,11:2,36:3,37:4};
  const pearlPortraits:Record<number,number>={4:0,5:1,6:1,7:2,34:3,35:4};
  const trialPortraits:Record<number,number>={0:0,1:1,2:1,3:2,32:3,33:4};
  if(atlas==='/assets/trial-coast-portraits-v1.webp'){
    if(index in lavaPortraits){atlas='/assets/lava-portraits-v1.webp';index=lavaPortraits[index];}
    else if(index in voidPortraits){atlas='/assets/void-portraits-v1.webp';index=voidPortraits[index];}
    else if(index in stormPortraits){atlas='/assets/storm-portraits-v1.webp';index=stormPortraits[index];}
    else if(index in frostPortraits){atlas='/assets/frost-portraits-v1.webp';index=frostPortraits[index];}
    else if(index in hauntPortraits){atlas='/assets/haunt-portraits-v1.webp';index=hauntPortraits[index];}
    else if(index in azurPortraits){atlas='/assets/azur-portraits-v1.webp';index=azurPortraits[index];}
    else if(index in pearlPortraits){atlas='/assets/pearl-portraits-v1.webp';index=pearlPortraits[index];}
    else if(index in trialPortraits){index=trialPortraits[index];}
    else return '';
    count=5;cols=5;
  }
  const rows=Math.ceil(count/cols),c=index%cols,r=Math.floor(index/cols);
  return`background-image:url(${atlas});background-size:${cols*100}% ${rows*100}%;background-position:${cols>1?c/(cols-1)*100:0}% ${rows>1?r/(rows-1)*100:0}%`;
}
