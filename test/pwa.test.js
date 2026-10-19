import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
test('manifest has required install fields',()=>{for(const k of['name','short_name','start_url','display','icons'])assert.ok(m[k]);assert.equal(m.display,'standalone')});
test('icons exist and match declared size',()=>{for(const i of m.icons){const b=fs.readFileSync(i.src);const[w,h]=[b.readUInt32BE(16),b.readUInt32BE(20)];assert.equal(`${w}x${h}`,i.sizes)}});
test('service worker shell files all exist',()=>{const sw=fs.readFileSync('sw.js','utf8');const list=sw.match(/SHELL=\[(.*?)\]/)[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1));
 for(const f of list)if(f!=='./')assert.ok(fs.existsSync(f),f)});
test('index links manifest and app registers sw',()=>{assert.match(fs.readFileSync('index.html','utf8'),/manifest\.webmanifest/);assert.match(fs.readFileSync('src/app.js','utf8'),/serviceWorker/)});
