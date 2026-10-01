// Filo adası yerleşim şablonu (gri maket): doğu ve batıda iki geniş kapı, surlarda 12 (üstte 6, altta 6) ve
// iç adada 4 (ikisi doğu, ikisi batı kapısına bakan) boş yuvarlak kule kaidesi.
// Görsel üretim aracına "düzen referansı" olarak verilir; kaide konumları FLEET_LAYOUT ile oyuna da aynen yazılır.
import * as THREE from 'three';

// Plan görünüşte (tepeden) birim çember üzerinde açılar; 0° doğu, 90° kuzey. Kapılar doğu (0°) ve batı (180°).
export const FLEET_LAYOUT=(()=>{
  const gap=44,flank=gap/2+4,R=1;            // kapı açıklığı ve kapı yanı kuleleri (derece)
  const upper=[];for(let i=0;i<6;i++)upper.push(flank+i*(180-2*flank)/5);
  const angles=[...upper,...upper.map(a=>-a)];
  const inner=[32,-32,148,-148];              // iç ada kenarında, kapılara bakan kaideler
  return{R,gap,angles,inner,ringR:42.1,innerR:15.5};
})();

export function buildFleetLayout(){
  const g=new THREE.Group(),R=40,W=4.2,H=3.2;   // sur yarıçapı, yol genişliği, sur yüksekliği
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.9});
  // deniz/lagün ve kum şeridi (yalnızca okunabilirlik için)
  const gapR=FLEET_LAYOUT.gap/2*Math.PI/180;
  const lagoon=new THREE.Mesh(new THREE.CircleGeometry(R+W+3.6,128),mat('#2a5a5e'));lagoon.rotation.x=-Math.PI/2;lagoon.position.y=.01;g.add(lagoon);
  // kum şeridi de kapılarda kesilir: kapıdan lagüne açık deniz kanalı geçer
  for(const [a0,a1] of [[gapR,Math.PI-gapR],[Math.PI+gapR,2*Math.PI-gapR]]){const sh=new THREE.Shape();sh.absarc(0,0,R+W+3.5,a0,a1,false);sh.absarc(0,0,R-1.2,a1,a0,true);sh.closePath();
    const sand=new THREE.Mesh(new THREE.ShapeGeometry(sh,96),mat('#d8c8a6'));sand.rotation.x=-Math.PI/2;sand.position.y=.02;g.add(sand);}
  // iki hilal sur: kuzey ve güney yarım halkalar (kapılar doğu ve batıda)
  for(const [a0,a1] of [[gapR,Math.PI-gapR],[Math.PI+gapR,2*Math.PI-gapR]]){
    const sh=new THREE.Shape();sh.absarc(0,0,R+W,a0,a1,false);sh.absarc(0,0,R,a1,a0,true);sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:H,bevelEnabled:false,curveSegments:96});
    const wall=new THREE.Mesh(geo,[mat('#cbb994'),mat('#6e6253')]);wall.rotation.x=-Math.PI/2;g.add(wall);}
  // 12 boş yuvarlak kaide
  for(const a of FLEET_LAYOUT.angles){const r=a*Math.PI/180,c=new THREE.Mesh(new THREE.CylinderGeometry(W*.85,W*.95,H+1,32),[mat('#8a7a66'),mat('#e2d4b4'),mat('#e2d4b4')]);
    c.position.set(Math.cos(r)*(R+W/2),(H+1)/2,-Math.sin(r)*(R+W/2));g.add(c);}
  // orta ada ve kapılara bakan 4 kaide
  const isl=new THREE.Mesh(new THREE.CylinderGeometry(16,18,1.6,64),mat('#d8c8a6'));isl.position.y=.8;g.add(isl);
  for(const a of FLEET_LAYOUT.inner){const r=a*Math.PI/180,c=new THREE.Mesh(new THREE.CylinderGeometry(W*.85,W*.95,H+1,32),[mat('#8a7a66'),mat('#e2d4b4'),mat('#e2d4b4')]);
    c.position.set(Math.cos(r)*15.5,1.6+(H+1)/2,-Math.sin(r)*15.5);g.add(c);}
  const keep=new THREE.Mesh(new THREE.BoxGeometry(7,6,7),mat('#bfae90'));keep.position.y=4.6;g.add(keep);
  return g;
}
