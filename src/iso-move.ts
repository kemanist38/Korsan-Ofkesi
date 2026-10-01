// Seafight usulü hareket (kullanıcının videolarından ölçüldü): gemi yalnızca 4 çaprazda gider (yatay hız V, dikey V/2,
// yataydan ~27°). Düz bir yöne gitmek için iki çaprazı ~0,11 sn'lik adımlarla art arda atar (doğuya: GD-KD-GD-KD…);
// her adımda başlangıç→hedef çizgisine en yakın kalan çapraz seçilir. Kalkış ve duruş anlıktır; görünüş o anki çaprazdır.
export type IsoFace={east:boolean;north:boolean};
export type IsoMove={sx:number;sy:number;left:number;ox:number;oy:number;tx:number;ty:number};
export const ISO_STEP=.11;
export function isoAdvance(m:IsoMove|null,px:number,py:number,tx:number,ty:number,V:number,dt:number,face:IsoFace){
  if(!m||Math.hypot(m.tx-tx,m.ty-ty)>1)m={sx:0,sy:0,left:0,ox:px,oy:py,tx,ty};
  const dx=tx-px,dy=ty-py,H=V*.5;
  if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return{m,mx:0,my:0,done:true};
  // son adımdan kısa kalan yol: her eksen kendi hızıyla hedefe (gözle görülmeyecek kadar küçük)
  if(Math.abs(dx)<=V*ISO_STEP&&Math.abs(dy)<=H*ISO_STEP){const mx=Math.sign(dx)*Math.min(Math.abs(dx),V*dt),my=Math.sign(dy)*Math.min(Math.abs(dy),H*dt);return{m,mx,my,done:false};}
  if(m.left<=0){const lx=tx-m.ox,ly=ty-m.oy,ll=Math.hypot(lx,ly)||1,xdom=Math.abs(dx)/V>=Math.abs(dy)/H;
    const opts:[number,number][]=xdom?[[Math.sign(dx)||1,-1],[Math.sign(dx)||1,1]]:[[-1,Math.sign(dy)||1],[1,Math.sign(dy)||1]];
    let best=opts[0],bd=1e18;for(const [sx,sy] of opts){const qx=px+sx*V*ISO_STEP-m.ox,qy=py+sy*H*ISO_STEP-m.oy,d=Math.abs(lx*qy-ly*qx)/ll+(sx===m.sx&&sy===m.sy?.01:0);if(d<bd){bd=d;best=[sx,sy];}}
    m.sx=best[0];m.sy=best[1];m.left=ISO_STEP;}
  const t=Math.min(dt,m.left);m.left-=dt;face.east=m.sx>0;face.north=m.sy<0;
  return{m,mx:m.sx*V*t,my:m.sy*H*t,done:false};}
