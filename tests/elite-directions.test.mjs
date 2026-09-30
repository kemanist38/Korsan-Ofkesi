import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';

const code=ts.transpile(readFileSync(new URL('../src/elite-ships.ts',import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const E=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('every elite ship has a 4-view diagonal sheet and card art on disk',()=>{
  for(const ship of E.ELITE_SHIPS){const iso=E.ELITE_ISO[ship.id];
    assert.ok(iso,`${ship.id} için 4 yönlü sayfa yok`);
    assert.ok(existsSync(new URL(`../public${iso}`,import.meta.url)),`${iso} bulunamadı`);
    assert.ok(existsSync(new URL(`../public${ship.asset}`,import.meta.url)),`${ship.asset} bulunamadı`);}
});
