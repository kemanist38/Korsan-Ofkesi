import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load.mjs';
const store={};globalThis.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
const L=await loadTs('logbook.ts');

test('logbook keeps the newest 300 entries and survives a reload',()=>{
  const log=[];for(let i=0;i<320;i++)L.addLog(log,{t:i,kind:'battle',text:`#${i}`});
  assert.equal(log.length,L.LOG_MAX);assert.equal(log[0].text,'#20');
  L.saveLog(log);assert.deepEqual(L.loadLog().map(e=>e.text),log.map(e=>e.text));
});
test('today summary counts sinks and gained TP, gold and SP only for today',()=>{
  const now=new Date(2026,9,7,15,0),today=new Date(2026,9,7,9,0).getTime(),yesterday=new Date(2026,9,6,22,0).getTime();
  const log=[{t:yesterday,kind:'battle',text:'eski',xp:999,gold:999,sink:true},{t:today,kind:'battle',text:'a',xp:100,gold:50,sink:true},{t:today,kind:'battle',text:'b',sp:25,sink:true},{t:today,kind:'shop',text:'c'}];
  assert.deepEqual(L.daySummary(log,now),{sinks:2,xp:100,gold:50,sp:25});
});
