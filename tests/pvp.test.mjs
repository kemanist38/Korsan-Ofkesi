import test from 'node:test';import assert from 'node:assert/strict';import {loadTs} from './load.mjs';
const P=await loadTs('pvp.ts');
const ttk=(maxHp,salvo,reload)=>{const b=P.newPvpBudget(maxHp,0);let hp=maxHp,t=0;while(hp>0&&t<600){hp-=P.pvpClamp(b,maxHp,salvo,t);if(hp>0)t+=reload;}return t;};
test('en güçlü gemi bile 30 saniyeden önce batıramaz',()=>{assert.ok(ttk(300_000,116_000,1.62)>=28);assert.ok(ttk(75_000,200_000,.6)>=28);});
test('zayıf saldırgan sınırdan etkilenmez',()=>{const t=ttk(97_500,4_700,2.65);assert.ok(t>50&&t<60,String(t));});
