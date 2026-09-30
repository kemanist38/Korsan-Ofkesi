// Raster ritual seal, projected onto the same sea plane as the target marker.
const seal=new Image();
seal.decoding='async';
seal.src='/assets/player-mystic-ring-v1.webp';
const TAU=Math.PI*2;

export function drawMysticPlayerMarker(ctx:CanvasRenderingContext2D,x:number,y:number,time:number){
  if(!seal.complete||!seal.naturalWidth)return;
  ctx.save();
  ctx.translate(x,y);
  ctx.globalCompositeOperation='screen';
  // Slow rotation is applied before the 2:1 sea projection, never in screen space.
  ctx.save();
  ctx.scale(1,.5);
  ctx.rotate(time*.055);
  ctx.globalAlpha=.60+Math.sin(time*1.2)*.06;
  ctx.drawImage(seal,-112,-112,224,224);
  ctx.restore();
  // A small, fixed number of rising embers; no particles added to the world pool.
  // Rendered below the hull so the ship and captain label remain unobstructed.
  for(let i=0;i<8;i++){
    const phase=(time*.16+i*.61803398875)%1;
    const angle=i*TAU/8+time*.035;
    const px=Math.cos(angle)*88+Math.sin(phase*TAU+i)*4;
    const py=Math.sin(angle)*42-phase*38;
    ctx.globalAlpha=Math.sin(phase*Math.PI)*.45;
    ctx.fillStyle=i%3===0?'#9eeee0':'#d2a1ff';
    ctx.beginPath();ctx.ellipse(px,py,1.1,2.1,0,0,TAU);ctx.fill();
    ctx.globalAlpha*=.22;
    ctx.beginPath();ctx.ellipse(px,py,3,5,0,0,TAU);ctx.fill();
  }
  ctx.restore();
}
