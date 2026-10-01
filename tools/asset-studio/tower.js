// Filo adası top kulesi (fleet-tower-v3): surdaki kare kaideye oturan basık, sekizgen taş top platformu.
// Kalın taş gövde, mazgallı korkuluk, ahşap güverte ve üstte uzun namlulu bronz top. Tüm temalarda aynı model kullanılır.
import * as THREE from 'three';
import * as T from './textures.js';

const std=o=>new THREE.MeshStandardMaterial({roughness:.85,metalness:0,...o});

// Taş blok dokusu: sıra sıra kesme taş, açık derz, kenar ışığı ve hafif yosun/leke
function blockTexture({seed,rows=6,cols=8,base=[156,142,120],mortar='#4a4236',moss=.12}){
  const W=512,H=256,[c,x]=T.canvas(W,H),r=T.rng(seed);
  x.fillStyle=mortar;x.fillRect(0,0,W,H);
  const rh=H/rows;
  for(let j=0;j<rows;j++){const off=(j%2)*(W/cols/2);
    for(let i=-1;i<cols+1;i++){const bw=W/cols,x0=i*bw+off+2,y0=j*rh+2,w=bw-4,h=rh-4,k=.86+r()*.22;
      const [R,G,B]=base.map(v=>Math.round(v*k));x.fillStyle=`rgb(${R},${G},${B})`;
      x.beginPath();x.roundRect(x0,y0,w,h,5);x.fill();
      x.fillStyle='rgba(255,246,222,.28)';x.fillRect(x0+3,y0+2,w-6,3);
      x.fillStyle='rgba(40,30,20,.22)';x.fillRect(x0+3,y0+h-4,w-6,3);
      for(let n=0;n<14;n++){x.fillStyle=r()<.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.06)';x.fillRect(x0+r()*w,y0+r()*h,2+r()*6,1+r()*3);}
      if(r()<moss){x.fillStyle='rgba(92,120,64,.35)';x.beginPath();x.ellipse(x0+r()*w,y0+h-3,8+r()*14,4+r()*4,0,0,7);x.fill();}}}
  return T.toTexture(c,{repeat:true});
}
function plankTexture(seed){const W=256,[c,x]=T.canvas(W,W),r=T.rng(seed);
  for(let i=0;i<8;i++){const k=.85+r()*.25;x.fillStyle=`rgb(${Math.round(132*k)},${Math.round(92*k)},${Math.round(56*k)})`;x.fillRect(i*32,0,32,W);
    x.fillStyle='rgba(40,22,10,.55)';x.fillRect(i*32,0,2,W);for(let n=0;n<10;n++){x.fillStyle='rgba(60,34,16,.25)';x.fillRect(i*32+4+r()*24,r()*W,1,20+r()*60);}}
  return T.toTexture(c,{repeat:true});}

export function buildFleetTower(){
  const g=new THREE.Group(),R=10,H=6.2;
  const wallTex=blockTexture({seed:7});wallTex.repeat.set(4,1.2);
  const wall=std({map:wallTex});
  const capTex=blockTexture({seed:9,rows:2,cols:16,base:[176,164,140],moss:0});capTex.repeat.set(4,1);
  const cap=std({map:capTex,roughness:.8});
  // gövde: hafif konik sekizgen
  const body=new THREE.Mesh(new THREE.CylinderGeometry(R,R*1.06,H,8,1),wall);body.rotation.y=Math.PI/8;body.position.y=H/2;g.add(body);
  // taban taşı ve üst kornişi
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(R*1.1,R*1.13,1,8),cap);plinth.rotation.y=Math.PI/8;plinth.position.y=.5;g.add(plinth);
  const cornice=new THREE.Mesh(new THREE.CylinderGeometry(R*1.07,R*1.0,.9,8),cap);cornice.rotation.y=Math.PI/8;cornice.position.y=H+.45;g.add(cornice);
  // ön yüzlerde kemerli mazgal pencereleri
  const dark=std({color:'#1c1612',roughness:1}),arch=new THREE.Shape();arch.moveTo(-.9,0);arch.lineTo(-.9,1.5);arch.absarc(0,1.5,.9,Math.PI,0,true);arch.lineTo(.9,0);arch.closePath();
  const archGeo=new THREE.ShapeGeometry(arch,16),rim=std({color:'#b4a486',roughness:.8});
  for(let i=0;i<8;i++){const a=i*Math.PI/4,ap=R*1.045*Math.cos(Math.PI/8)+.06;
    const w=new THREE.Mesh(archGeo,dark);w.position.set(Math.sin(a)*ap,1.5,Math.cos(a)*ap);w.rotation.y=a;g.add(w);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.98,.16,6,16,Math.PI),rim);ring.position.set(Math.sin(a)*(ap+.03),3.0,Math.cos(a)*(ap+.03));ring.rotation.y=a;g.add(ring);}
  // ahşap güverte
  const deckTex=plankTexture(3);deckTex.repeat.set(2,2);
  const deck=new THREE.Mesh(new THREE.CylinderGeometry(R*.98,R*.98,.3,8),std({map:deckTex}));deck.rotation.y=Math.PI/8;deck.position.y=H+.75;g.add(deck);
  // mazgallı korkuluk: her kenarda iki diş
  const merlonTex=blockTexture({seed:11,rows:2,cols:4,base:[168,154,130]});
  const merlonMat=std({map:merlonTex}),low=std({map:capTex});
  const top=H+.9,side=2*R*Math.sin(Math.PI/8),inr=R*Math.cos(Math.PI/8)-.55;
  for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;
    const lowWall=new THREE.Mesh(new THREE.BoxGeometry(side*1.02,1,1.1),low);lowWall.position.set(Math.sin(a)*inr,top+.5,Math.cos(a)*inr);lowWall.rotation.y=a;g.add(lowWall);
    for(const t of [-.27,.27]){const m=new THREE.Mesh(new THREE.BoxGeometry(side*.3,1.5,1.25),merlonMat);
      m.position.set(Math.sin(a)*inr+Math.cos(a)*t*side,top+1.75,Math.cos(a)*inr-Math.sin(a)*t*side);m.rotation.y=a;g.add(m);}}
  // top: ahşap kundak + uzun bronz namlu; kameraya göre sağ-öne (güneydoğu) bakar
  const gun=new THREE.Group(),bronze=new THREE.MeshStandardMaterial({color:'#9a6a32',metalness:.85,roughness:.32}),iron=new THREE.MeshStandardMaterial({color:'#2c2a28',metalness:.7,roughness:.45});
  const wood=std({map:plankTexture(5),roughness:.8});
  const base=new THREE.Mesh(new THREE.BoxGeometry(4.2,1,5),wood);base.position.y=.5;gun.add(base);
  for(const s of [-1,1]){const cheek=new THREE.Mesh(new THREE.BoxGeometry(.6,1.9,4.2),wood);cheek.position.set(s*1.6,1.6,0);gun.add(cheek);
    for(const z of [-1.7,1.7]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.35,16),std({color:'#5a3a22'}));wheel.rotation.z=Math.PI/2;wheel.position.set(s*2.25,.8,z);gun.add(wheel);}}
  const barrel=new THREE.Group();
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.75,1.15,8.5,24),bronze);tube.rotation.x=Math.PI/2;tube.position.z=2.6;barrel.add(tube);
  for(const [z,r] of [[-1.2,1.3],[1.4,1.18],[4.2,1.0],[6.75,1.02]]){const band=new THREE.Mesh(new THREE.TorusGeometry(r,.2,10,24),bronze);band.position.z=z;barrel.add(band);}
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(1.05,.85,.8,24),bronze);muzzle.rotation.x=Math.PI/2;muzzle.position.z=7.05;barrel.add(muzzle);
  const bore=new THREE.Mesh(new THREE.CircleGeometry(.6,20),std({color:'#0c0a08'}));bore.position.z=7.46;barrel.add(bore);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.55,16,12),bronze);knob.position.z=-1.95;barrel.add(knob);
  const trun=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,3.6,12),iron);trun.rotation.z=Math.PI/2;barrel.add(trun);
  barrel.position.y=2.6;barrel.rotation.x=-.16;gun.add(barrel);
  gun.scale.setScalar(1.25);gun.position.set(.4,H+.9,-.8);gun.rotation.y=Math.PI*.2;g.add(gun);
  // gülle yığını
  for(const [x,z,y] of [[-4.6,1.8,0],[-3.7,2.4,0],[-4.5,2.8,0],[-4.2,2.3,.75]]){const b=new THREE.Mesh(new THREE.SphereGeometry(.55,14,10),iron);b.position.set(x,H+1.5+y,z);g.add(b);}
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,7,8),std({color:'#4a3220'}));pole.position.set(-5.2,H+4.4,-4.2);g.add(pole);
  const fl=new THREE.PlaneGeometry(3.4,2,12,4),fp=fl.attributes.position;for(let i=0;i<fp.count;i++){const u=(fp.getX(i)+1.7)/3.4;fp.setZ(i,Math.sin(u*5)*.35*u);}fl.computeVertexNormals();
  const flag=new THREE.Mesh(fl,std({color:'#a8322a',side:THREE.DoubleSide,roughness:.9}));flag.position.set(-3.5,H+6.8,-4.2);g.add(flag);
  g.userData.top=H+8;
  return g;
}
