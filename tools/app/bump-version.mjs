// Mağaza sürümünü artırır: node tools/app/bump-version.mjs 1.0.1
// Android versionName/versionCode ve iOS MARKETING_VERSION/CURRENT_PROJECT_VERSION birlikte güncellenir (yapı numarası her seferinde +1).
import {readFileSync,writeFileSync} from 'node:fs';
const v=process.argv[2];if(!/^\d+\.\d+(\.\d+)?$/.test(v||'')){console.error('Kullanım: node tools/app/bump-version.mjs 1.0.1');process.exit(1);}
const gradle='android/app/build.gradle',pbx='ios/App/App.xcodeproj/project.pbxproj';
let g=readFileSync(gradle,'utf8');const code=Number(/versionCode (\d+)/.exec(g)[1])+1;
g=g.replace(/versionCode \d+/,`versionCode ${code}`).replace(/versionName "[^"]*"/,`versionName "${v}"`);writeFileSync(gradle,g);
let p=readFileSync(pbx,'utf8');const build=Math.max(code,Number(/CURRENT_PROJECT_VERSION = (\d+);/.exec(p)[1])+1);
p=p.replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${v};`).replace(/CURRENT_PROJECT_VERSION = \d+;/g,`CURRENT_PROJECT_VERSION = ${build};`);writeFileSync(pbx,p);
console.log(`Sürüm ${v} · Android versionCode ${code} · iOS yapı ${build}`);
