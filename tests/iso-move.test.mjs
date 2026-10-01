import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpile(readFileSync(new URL('../src/iso-move.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const M=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('staircase movement only uses the four diagonals and reaches the target',()=>{
  let m=null,x=0,y=0;const face={east:false,north:false},V=200;
  for(let i=0;i<400;i++){const r=M.isoAdvance(m,x,y,300,0,V,1/60,face);m=r.m;
    if(r.done)break;if(Math.abs(r.mx)>0&&Math.abs(r.my)>0)assert.ok(Math.abs(Math.abs(r.my/r.mx)-.5)<1e-6,'yataydan ~27°');x+=r.mx;y+=r.my;}
  assert.ok(Math.hypot(300-x,y)<1,`hedefe vardı (${x.toFixed(1)},${y.toFixed(1)})`);
  assert.equal(face.east,true);
});
