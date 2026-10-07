import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('../src/special-designs.ts',import.meta.url),'utf8');
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const c=vm.createContext({exports:{},localStorage:storage});
vm.runInContext(ts.transpile(source,{module:ts.ModuleKind.CommonJS}),c);
const api=c.exports;
test('cosmetic choice persists, can be removed and rejects stale design ids',()=>{
  assert.equal(api.loadSpecialDesign(),null);api.saveSpecialDesign('pirate-rage');
  assert.equal(api.loadSpecialDesign(),'pirate-rage');
  for(const key of data.keys())data.set(key,'unknown');assert.equal(api.loadSpecialDesign(),null);
  api.saveSpecialDesign(null);assert.equal(api.loadSpecialDesign(),null);
});
test('shipyard special-design toggle changes appearance without changing the equipped hull or combat stats',()=>{
  const file=ts.createSourceFile('main.ts',readFileSync(new URL('../src/main.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true);
  const render=file.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='renderEliteShips');
  // Tersane ızgarası: Pirate Rage kartının SEÇ/ÇIKAR düğmesi (data-select-ship="pirate-rage")
  const select={dataset:{selectShip:'pirate-rage'},onclick:null};
  const elements=new Map(),ui=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',hidden:false,parentElement:{scrollTop:0},querySelectorAll:q=>q==='[data-select-ship]'?[select]:[]});return elements.get(id);};
  const ctx=vm.createContext({ui,ELITE_TEST_MODE:true,ELITE_MAX_LEVEL:15,ELITE_SHIPS:[],ELITE_REWARDS:[],PIRATE_RAGE_DESIGN:api.PIRATE_RAGE_DESIGN,elitePurchased:true,
    eliteLevelFromEp:()=>15,earnedEliteLevel:()=>15,eliteBonus:()=>({}),eliteBonusText:()=>'',
    shipyardTab:'special',activeShip:'phantom',activeSpecialDesign:null,previewShip:'pirate-rage',state:{hp:87000,cannon:125,pearls:30},saveSpecialDesign:api.saveSpecialDesign,toast:()=>{}});
  vm.runInContext(ts.transpile(render.getText(file)),ctx);vm.runInContext('renderEliteShips()',ctx);
  assert.match(ui('eliteShipGrid').innerHTML,/ÖZEL GEMİLER/);assert.match(ui('eliteShipGrid').innerHTML,/Pirate Rage/);
  select.onclick();assert.equal(ctx.activeSpecialDesign,'pirate-rage');assert.equal(api.loadSpecialDesign(),'pirate-rage');
  assert.equal(ctx.activeShip,'phantom');assert.deepEqual(ctx.state,{hp:87000,cannon:125,pearls:30});
  select.onclick();assert.equal(ctx.activeSpecialDesign,null);assert.equal(api.loadSpecialDesign(),null);
});
