const http = require('http');
const fs = require('fs');
const path = require('path');
const { DEVICE_CODE, DEVICE_TYPE } = require('./code.js');

const PORT = 3000;
const controller = 'http://127.0.0.1:8080';

const terminalPage = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Corn Terminal</title>
<style>html,body{margin:0;height:100%;background:#000;color:#ddd;font:15px monospace}#out{padding:14px;white-space:pre-wrap;overflow:auto;height:calc(100% - 44px);box-sizing:border-box}form{display:flex;border-top:1px solid #333;height:44px}input{flex:1;background:#000;color:#fff;border:0;outline:0;padding:0 14px;font:inherit}button{background:#111;color:#aaa;border:0;padding:0 16px;font:inherit}</style></head>
<body><div id="out">Corn Terminal\nType "help" for commands.\n\n</div><form><input id="cmd" autocomplete="off" autofocus><button>Run</button></form>
<script>
const out=document.getElementById('out'), input=document.getElementById('cmd');
function print(s){out.textContent+=s+'\\n';out.scrollTop=out.scrollHeight}
async function run(command){
  const p=command.trim().split(/\\s+/); if(!p[0])return;
  print('C:\\\\Corn> '+command);
  if(command==='help'){print('ls device_apps\\nrun device_app "app name"\\nclear');return}
  if(command==='clear'){out.textContent='';return}
  if(command==='ls device_apps'){
    try{const r=await fetch('/api/device-apps'); const d=await r.json(); print(d.apps.join('\\n'));}catch(e){print('Unable to query device apps.')} return;
  }
  const m=command.match(/^run\\s+device_app\\s+"(.+)"$/i);
  if(m){try{const r=await fetch('/api/run-device-app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({app:m[1]})});const d=await r.json();print(d.message||d.error||'Command failed.');}catch(e){print('Unable to reach controller.')}return}
  print('Unknown command. Type "help".');
}
document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const c=input.value;input.value='';run(c)});
</script></body></html>`;

function json(res, status, value) { res.writeHead(status, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}); res.end(JSON.stringify(value)); }
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch(e){reject(e)}})})}
async function proxy(pathname, method='GET', data){
  const r=await fetch(controller+pathname,{method,headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
  return {status:r.status,data:await r.json()};
}

const server=http.createServer(async (req,res)=>{
  try {
    if(req.url==='/'){
      const isHomePhone=DEVICE_TYPE==='HomePhone';
      if(isHomePhone){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(terminalPage);return;}
      const file=fs.readFileSync(path.join(__dirname,'web','index.html'));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(file);return;
    }
    if(req.url==='/api/pair-code' && req.method==='POST'){
      const r=await proxy('/api/pair-code','POST');
      return json(res,r.status,r.data);
    }
    if(req.url==='/api/device-apps'){
      if(DEVICE_CODE==='PLACEHOLDER-CODE') return json(res,400,{error:'Set DEVICE_CODE in code.js first.'});
      return json(res,200,{apps:['Google Chrome','Safari','Among Us','Discord','Settings'],note:'Demo allowlist. Real app enumeration is platform-specific.'});
    }
    if(req.url==='/api/run-device-app' && req.method==='POST'){
      const b=await body(req); const allowed=['Google Chrome','Safari','Among Us'];
      if(DEVICE_CODE==='PLACEHOLDER-CODE') return json(res,400,{error:'Set DEVICE_CODE in code.js first.'});
      if(!allowed.includes(b.app)) return json(res,400,{error:'App is not in the allowlist.'});
      return json(res,200,{ok:true,message:'Requested '+b.app+' to open on the paired device.'});
    }
    if(req.url.startsWith('/web/')){const f=path.join(__dirname,req.url.slice(5)); if(fs.existsSync(f)){res.end(fs.readFileSync(f));return}}
    res.writeHead(404);res.end('Not found');
  } catch(e){json(res,500,{error:'Manager error'});}
});
server.listen(PORT,'127.0.0.1',()=>console.log('CornHub manager listening at http://localhost:'+PORT));
