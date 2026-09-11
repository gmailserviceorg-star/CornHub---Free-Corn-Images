from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from datetime import datetime, timezone
import os, secrets

app=Flask(__name__, static_folder="../web"); CORS(app)
TOKEN=os.environ.get("CONTROLLER_TOKEN","CHANGE_ME")
devices={}; logs=[]; pair_codes={}
ALLOWED={"ping","lock","restart","shutdown"}

def now(): return datetime.now(timezone.utc).isoformat()
def auth(): return secrets.compare_digest(request.headers.get("Authorization",""), f"Bearer {TOKEN}")
def log(device,action,result):
    logs.insert(0,{"time":now(),"device":device,"action":action,"result":result}); del logs[100:]

def valid_pair(code):
    if not isinstance(code,str) or len(code)!=64: return False
    for issued in list(pair_codes):
        if secrets.compare_digest(issued, code):
            pair_codes.pop(issued, None)
            return True
    return False

@app.get("/")
def index(): return send_from_directory(app.static_folder,"index.html")
@app.get("/<path:name>")
def static(name): return send_from_directory(app.static_folder,name)

@app.post("/api/pair-code")
def pair_code():
    code=secrets.token_hex(32)
    pair_codes[code]={"created":now()}
    return jsonify(code=code)

@app.get("/api/devices")
def get_devices():
    if not auth(): return jsonify(error="unauthorized"),401
    cutoff=datetime.now(timezone.utc).timestamp()-12; out=[]
    for d in devices.values():
        d["online"]=datetime.fromisoformat(d["lastSeen"]).timestamp()>=cutoff; out.append(d)
    return jsonify(out)
@app.get("/api/logs")
def get_logs():
    if not auth(): return jsonify(error="unauthorized"),401
    return jsonify(logs)

@app.post("/api/enroll")
def enroll():
    x=request.get_json(silent=True) or {}; did=x.get("id"); code=x.get("code")
    if not did:return jsonify(error="missing device id"),400
    if not valid_pair(code): return jsonify(error="invalid or already-used pairing code"),401
    devices[did]={"id":did,"name":x.get("name",did),"platform":x.get("platform","unknown"),"version":x.get("version","unknown"),"lastSeen":now(),"online":True,"pending":[]}
    log(did,"enroll","accepted"); return jsonify(ok=True,device=devices[did])

@app.post("/api/heartbeat")
def heartbeat():
    if not auth(): return jsonify(error="unauthorized"),401
    x=request.get_json(silent=True) or {}; did=x.get("id")
    if did not in devices:return jsonify(error="unknown device"),404
    devices[did]["lastSeen"]=now(); devices[did]["online"]=True; return jsonify(ok=True)
@app.post("/api/command")
def command():
    if not auth(): return jsonify(error="unauthorized"),401
    x=request.get_json(silent=True) or {}; did=x.get("device"); action=x.get("action")
    if action not in ALLOWED:return jsonify(error="action not allowed"),400
    if did not in devices:return jsonify(error="unknown device"),404
    cid=secrets.token_hex(12); devices[did]["pending"].append({"id":cid,"action":action,"created":now()}); log(did,action,"queued")
    return jsonify(ok=True,commandId=cid)
@app.get("/api/commands/<did>")
def commands(did):
    if not auth():return jsonify(error="unauthorized"),401
    if did not in devices:return jsonify(error="unknown device"),404
    p=devices[did]["pending"]; devices[did]["pending"]=[]; return jsonify(p)
@app.post("/api/command-result")
def result():
    if not auth():return jsonify(error="unauthorized"),401
    x=request.get_json(silent=True) or {}; log(x.get("device","unknown"),x.get("action","unknown"),x.get("message","completed" if x.get("ok") else "failed")); return jsonify(ok=True)

if __name__=="__main__": app.run(host="127.0.0.1",port=8080,debug=False)
