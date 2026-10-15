// Oyun sunucusu yük testi: N sahte oyuncu aynı denizde dolaşır (oyundaki gibi hareketliyken ~3–10 durum/sn) ve
// arada ateş eder. Sunucunun gönderdiği trafik ve işlemci kullanımı ölçülür.
// Kullanım: node tools/bench-server.mjs [oyuncu=150] [saniye=20]
import {spawn} from 'node:child_process';
import WebSocket from 'ws';
const N=Number(process.argv[2]||150),SECS=Number(process.argv[3]||20),PORT=3997;
const srv=spawn('node',['public/srv/game-server.cjs'],{env:{...process.env,PORT:String(PORT),BENCH_AUTH:'1',FLAG_FILE:'/tmp/bench-flags.jsonl'},stdio:['ignore','pipe','inherit']});
await new Promise(r=>srv.stdout.once('data',r));
let rxBytes=0,rxMsgs=0,states=0;const clients=[];
const crowd=Math.max(1,N/30),rate=Math.min(.35,.1*crowd); // istemcinin kalabalıkta gönderme aralığı (sn)
for(let i=0;i<N;i++){const ws=new WebSocket(`ws://127.0.0.1:${PORT}/ws`);const b={ws,id:'n'+i,x:Math.random()*6000,y:Math.random()*4000,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300};
  ws.on('open',()=>ws.send(JSON.stringify({t:'auth',token:'bench:'+i,netId:b.id})));
  ws.on('message',d=>{rxBytes+=d.length;rxMsgs++;const m=JSON.parse(d);if(m.t==='hello')ws.send(JSON.stringify({t:'join',sea:'sea-1-1'}));if(m.t==='batch')states+=m.d.length;});
  clients.push(b);}
await new Promise(r=>setTimeout(r,1500));
const t0=Date.now(),cpu0=process.cpuUsage();let sent=0;
const timers=clients.map((b,i)=>setInterval(()=>{b.x=Math.max(0,Math.min(6000,b.x+b.vx*rate));b.y=Math.max(0,Math.min(4000,b.y+b.vy*rate));
  const full=Math.random()<rate/2;const d={id:b.id,x:Math.round(b.x),y:Math.round(b.y),east:true,north:false,hp:50000,t:Date.now(),vx:Math.round(b.vx),vy:Math.round(b.vy),d16:3,...(full?{nick:'Bot'+i,tag:null,ship:'phantom',maxHp:60000,sp:1200,level:6}:{})};
  b.ws.send(JSON.stringify({t:'state',d}));sent++;if(Math.random()<.15)b.ws.send(JSON.stringify({t:'fire',d:{to:'n'+((i+1)%N),x:b.x,y:b.y,tx:b.x+100,ty:b.y,damage:20000,ammo:'fire'}}));},rate*1000));
rxBytes=0;rxMsgs=0;states=0;const wire0=clients.reduce((n,b)=>n+(b.ws._socket?.bytesRead||0),0);
await new Promise(r=>setTimeout(r,SECS*1000));const wire=clients.reduce((n,b)=>n+(b.ws._socket?.bytesRead||0),0)-wire0;
timers.forEach(clearInterval);const el=(Date.now()-t0)/1000;
const ps=await import('node:child_process').then(m=>m.execSync(`ps -o %cpu=,rss= -p ${srv.pid}`).toString().trim());
console.log(JSON.stringify({oyuncu:N,saniye:Math.round(el),gonderilenDurum_sn:Math.round(sent/el),acilmis_MBsn:+(rxBytes/el/1e6).toFixed(2),hattaGercek_MBsn:+(wire/el/1e6).toFixed(2),mesaj_sn:Math.round(rxMsgs/el),iletilenDurum_sn:Math.round(states/el),sunucuCPU_yuzde_ve_RAM_KB:ps,saatlikTrafik_GB:+(wire/el*3600/1e9).toFixed(1)}));
clients.forEach(b=>b.ws.close());srv.kill();process.exit(0);
