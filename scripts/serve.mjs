import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const port=+process.env.PORT||5173,host=process.env.HOST||'127.0.0.1';
http.createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';
const f=path.join(root,p);if(!f.startsWith(root)||/\/(scripts|test|node_modules)\//.test(p)){r.writeHead(404).end('not found');return}
fs.readFile(f,(e,d)=>{if(e){r.writeHead(404).end('not found');return}r.writeHead(200,{'content-type':(T[path.extname(f)]||'application/octet-stream')+'; charset=utf-8','cache-control':'no-cache'}).end(d)})
}).listen(port,host,()=>console.log(`PHANTOM  http://${host==='0.0.0.0'?'localhost':host}:${port}`));
