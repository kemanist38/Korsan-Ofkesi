import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const context=vm.createContext({exports:{}});
vm.runInContext(ts.transpile(readFileSync(new URL('../src/fleetMask.ts',import.meta.url),'utf8'),{module:ts.ModuleKind.CommonJS}),context);
const {n,cell,rle}=context.exports.FLEET_MASK,grid=[];
for(const run of rle.split(','))grid.push(...Array(parseInt(run.slice(1),36)).fill(+run[0]));
const half=n*cell/2;
const at=(x,y)=>grid[Math.floor((y+half)/cell)*n+Math.floor((x+half)/cell)];
test('both side gates connect open water to the lagoon',()=>{
  assert.equal(grid.length,n*n);
  for(const side of [-1,1]){
    assert.equal(at(side*735,0),1);
    for(let x=360;x<=735;x+=8)assert.notEqual(at(side*x,0),0,`blocked gate at ${side*x}`);
    assert.equal(at(side*430,-20),2);
  }
});
test('central island and upper/lower ramparts remain impassable',()=>{
  for(const [x,y] of [[0,65],[0,135],[0,-290],[0,340]])assert.equal(at(x,y),0,`land at ${x},${y}`);
});
