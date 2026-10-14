// Tanıtım sitesi: elit gemi galerisi oyun verisinden üretilir
import {ELITE_SHIPS} from './elite-ships';
const box=document.getElementById('ships');
if(box)box.innerHTML=ELITE_SHIPS.map(s=>`<article><img src="${s.asset}" alt="" loading="lazy"/><span>Elit ${s.level}</span><h3>${s.name}</h3><p>${s.role}</p></article>`).join('');
