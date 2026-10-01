// Filo adası top kulesi (fleet-tower-<tema>-v4): surdaki kare kaidenin içine oturan, tek katlı kare taş kule.
// Kaideyle aynı yöne bakar (ön yüz kameraya dönük), taşı adanın kaide rengindedir; üstte mazgallı korkuluk,
// ahşap güverte ve uzun namlulu bronz top. Tema farkları yalnızca renk ve küçük süslerdir.
import * as THREE from 'three';
import * as T from './textures.js';

const std=o=>new THREE.MeshStandardMaterial({roughness:.85,metalness:0,...o});

// Kaide renkleri oyundaki ada görsellerinden alındı (ön yüz taşı, derz, pencere içi)
export const TOWER_THEMES={
  // stone: ön duvar taşı (gölgedeki kaide yüzünden), cap: zemin/korniş taşı (güneşteki kaide zemininden)
  coral:{stone:[196,156,158],mortar:'#7a5658',cap:[232,204,198],moss:0,port:'#2a1612'},
  verdant:{stone:[110,120,94],mortar:'#3c4432',cap:[178,168,134],moss:.45,port:'#141812'},
  misty:{stone:[150,132,118],mortar:'#5a4c42',cap:[226,206,178],moss:0,port:'#221c16'},
  ice:{stone:[150,192,226],mortar:'#5c7890',cap:[214,230,244],moss:0,port:'#1a2634',snow:true},
  storm:{stone:[96,104,120],mortar:'#3a404c',cap:[162,166,172],moss:.12,port:'#141a22'},
  abyss:{stone:[52,52,74],mortar:'#1c1c28',cap:[78,74,88],moss:0,port:'#7a3cff',glow:true},
  lava:{stone:[90,70,90],mortar:'#2c2030',cap:[140,112,118],moss:0,port:'#ff7a1a',glow:true},
};

function blockTexture({seed,rows=5,cols=6,base,mortar,moss=0}){
  const W=512,H=256,[c,x]=T.canvas(W,H),r=T.rng(seed);
  x.fillStyle=mortar;x.fillRect(0,0,W,H);
  const rh=H/rows;
  for(let j=0;j<rows;j++){const off=(j%2)*(W/cols/2);
    for(let i=-1;i<cols+1;i++){const bw=W/cols,x0=i*bw+off+3,y0=j*rh+3,w=bw-6,h=rh-6,k=.88+r()*.2;
      x.fillStyle=`rgb(${base.map(v=>Math.min(255,Math.round(v*k))).join(',')})`;
      x.beginPath();x.roundRect(x0,y0,w,h,6);x.fill();
      x.fillStyle='rgba(255,248,230,.22)';x.fillRect(x0+4,y0+2,w-8,4);
      x.fillStyle='rgba(30,20,10,.2)';x.fillRect(x0+4,y0+h-5,w-8,4);
      for(let n=0;n<16;n++){x.fillStyle=r()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.05)';x.fillRect(x0+r()*w,y0+r()*h,2+r()*7,1+r()*3);}
      if(r()<moss){x.fillStyle='rgba(84,122,54,.5)';x.beginPath();x.ellipse(x0+r()*w,y0+h-4,10+r()*18,5+r()*5,0,0,7);x.fill();}}}
  return T.toTexture(c,{repeat:true});
}
function plankTexture(seed){const W=256,[c,x]=T.canvas(W,W),r=T.rng(seed);
  for(let i=0;i<8;i++){const k=.85+r()*.25;x.fillStyle=`rgb(${Math.round(132*k)},${Math.round(92*k)},${Math.round(56*k)})`;x.fillRect(i*32,0,32,W);
    x.fillStyle='rgba(40,22,10,.55)';x.fillRect(i*32,0,2,W);for(let n=0;n<10;n++){x.fillStyle='rgba(60,34,16,.25)';x.fillRect(i*32+4+r()*24,r()*W,1,20+r()*60);}}
  return T.toTexture(c,{repeat:true});}

export function buildFleetTower(theme='coral'){
  const P=TOWER_THEMES[theme]??TOWER_THEMES.coral,g=new THREE.Group(),S=14,H=6,half=S/2;
  const wallTex=blockTexture({seed:7,base:P.stone,mortar:P.mortar,moss:P.moss});wallTex.repeat.set(2,1);
  const capTex=blockTexture({seed:9,rows:2,cols:10,base:P.cap,mortar:P.mortar});capTex.repeat.set(2,1);
  const wall=std({map:wallTex}),cap=std({map:capTex,roughness:.8});
  const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);g.add(b);return b;};
  box(S+1,.8,S+1,cap,0,.4,0);                 // taban taşı
  box(S,H,S,wall,0,.8+H/2,0);                 // gövde
  box(S+.8,.8,S+.8,cap,0,.8+H+.4,0);          // korniş
  const top=.8+H+.8;
  // ön ve yan yüzlerde kemerli mazgallar (pencere içi temaya göre koyu ya da parlayan)
  const portMat=P.glow?new THREE.MeshStandardMaterial({color:P.port,emissive:P.port,emissiveIntensity:1.6}):std({color:P.port,roughness:1});
  const arch=new THREE.Shape();arch.moveTo(-.85,0);arch.lineTo(-.85,1.2);arch.absarc(0,1.2,.85,Math.PI,0,true);arch.lineTo(.85,0);arch.closePath();
  const archGeo=new THREE.ShapeGeometry(arch,16),rim=std({color:`rgb(${P.cap.join(',')})`,roughness:.8});
  for(const [ax,az,ry] of [[0,1,0],[1,0,Math.PI/2],[-1,0,-Math.PI/2]])for(const t of [-3.2,3.2]){
    const px=ax?ax*(half+.02):t,pz=az?az*(half+.02):t,w=new THREE.Mesh(archGeo,portMat);w.position.set(px,1.8,pz);w.rotation.y=ry;g.add(w);
    const rg=new THREE.Mesh(new THREE.TorusGeometry(.95,.16,6,16,Math.PI),rim);rg.position.set(px+ax*.03,3.0,pz+az*.03);rg.rotation.y=ry;g.add(rg);}
  // taş döşeme (kaidenin zemini gibi)
  const floorTex=blockTexture({seed:5,rows:5,cols:5,base:P.cap.map(v=>v*.9),mortar:P.mortar,moss:P.moss*.6});floorTex.repeat.set(1.4,2.8);
  box(S-.4,.25,S-.4,std({map:floorTex}),0,top+.1,0);
  // mazgallı korkuluk: alçak duvar + her kenarda 3 diş
  const merlon=std({map:blockTexture({seed:11,rows:2,cols:3,base:P.stone,mortar:P.mortar,moss:P.moss*.5})});
  const low=(w,d,x,z)=>box(w,1.1,d,cap,x,top+.55,z);
  low(S+.8,1.7,0,half-.45);low(S+.8,1.7,0,-half+.45);low(1.7,S-2.6,half-.45,0);low(1.7,S-2.6,-half+.45,0);
  const teeth=[];for(const t of [-5.6,0,5.6]){for(const z of [half-.45,-half+.45])teeth.push([2.6,1.8,t,z]);for(const x of [half-.45,-half+.45])teeth.push([1.8,2.6,x,t]);}
  for(const [w,d,x,z] of teeth)box(w,1.4,d,merlon,x,top+1.8,z);
  if(P.snow){const snow=std({color:'#f4fbff',roughness:.6});for(const [w,d,x,z] of teeth)box(w+.1,.3,d+.1,snow,x,top+2.62,z);box(S+.9,.25,S+.9,snow,0,.8+H+.9,0);}
  // top: ahşap kundak + uzun bronz namlu, ön-sağa bakar
  const gun=new THREE.Group(),bronze=new THREE.MeshStandardMaterial({color:'#9a6a32',metalness:.85,roughness:.32}),iron=new THREE.MeshStandardMaterial({color:'#2c2a28',metalness:.7,roughness:.45});
  const wood=std({map:plankTexture(5),roughness:.8}),dark=std({color:'#5a3a22'});
  const gb=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);gun.add(b);};
  gb(4.2,1,5,wood,0,.5,0);
  for(const s of [-1,1]){gb(.6,1.9,4.2,wood,s*1.6,1.6,0);
    for(const z of [-1.7,1.7]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.35,16),dark);wh.rotation.z=Math.PI/2;wh.position.set(s*2.25,.8,z);gun.add(wh);}}
  const barrel=new THREE.Group();
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.75,1.15,8.5,24),bronze);tube.rotation.x=Math.PI/2;tube.position.z=2.6;barrel.add(tube);
  for(const [z,r] of [[-1.2,1.3],[1.4,1.18],[4.2,1.0],[6.75,1.02]]){const band=new THREE.Mesh(new THREE.TorusGeometry(r,.2,10,24),bronze);band.position.z=z;barrel.add(band);}
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(1.05,.85,.8,24),bronze);muzzle.rotation.x=Math.PI/2;muzzle.position.z=7.05;barrel.add(muzzle);
  const bore=new THREE.Mesh(new THREE.CircleGeometry(.6,20),std({color:'#0c0a08'}));bore.position.z=7.46;barrel.add(bore);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.55,16,12),bronze);knob.position.z=-1.95;barrel.add(knob);
  const trun=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,3.6,12),iron);trun.rotation.z=Math.PI/2;barrel.add(trun);
  barrel.position.y=2.6;barrel.rotation.x=-.16;gun.add(barrel);
  gun.scale.setScalar(1);gun.position.set(.3,top+.2,-.8);gun.rotation.y=Math.PI*.22;g.add(gun);
  for(const [x,z,y] of [[-4.4,2.4,0],[-3.5,3,0],[-4.3,3.4,0],[-4.0,2.9,.75]]){const b=new THREE.Mesh(new THREE.SphereGeometry(.55,14,10),iron);b.position.set(x,top+.8+y,z);g.add(b);}
  // sancak: arka sol köşede
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,7,8),std({color:'#4a3220'}));pole.position.set(-5.6,top+3.5,-5.6);g.add(pole);
  const fl=new THREE.PlaneGeometry(3.4,2,12,4),fp=fl.attributes.position;for(let i=0;i<fp.count;i++){const u=(fp.getX(i)+1.7)/3.4;fp.setZ(i,Math.sin(u*5)*.35*u);}fl.computeVertexNormals();
  const flag=new THREE.Mesh(fl,std({color:'#a8322a',side:THREE.DoubleSide,roughness:.9}));flag.position.set(-3.9,top+5.9,-5.6);g.add(flag);
  g.userData.top=top+7;
  return g;
}
