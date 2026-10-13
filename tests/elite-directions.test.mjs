import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpile(readFileSync(new URL('../src/elite-ships.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const E=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('every elite ship has a 16-direction strip and card art on disk',()=>{
  for(const ship of E.ELITE_SHIPS){const d16=E.ELITE_DIR16[ship.id];
    assert.ok(d16,`${ship.id} için 16 yönlü şerit yok`);
    assert.ok(existsSync(new URL(`../public${d16}`,import.meta.url)),`${d16} bulunamadı`);
    assert.ok(existsSync(new URL(`../public${ship.asset}`,import.meta.url)),`${ship.asset} bulunamadı`);}
});
