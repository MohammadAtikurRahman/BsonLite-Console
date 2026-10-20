'use strict';
const http=require('node:http');
const crypto=require('node:crypto');
const {json,fromJSON}=require('./query.cjs');
const {executePlan}=require('./execute.cjs');
const MAX_BODY=2*1024*1024;
async function startBridge(database,{allowWrites=false,port=0}={}) {
  if(!database||typeof database.name!=='string'||typeof database.collection!=='function'||typeof database.listCollections!=='function') throw new Error('Pass the Database returned by await BsonLite.connect() or BsonLite.open().');
  if(!Number.isInteger(port)||port<0||port>65535) throw new Error('Invalid bridge port.');
  const token=crypto.randomBytes(32).toString('hex'),expected=Buffer.from('Bearer '+token);
  let active=0;
  const server=http.createServer(async(req,res)=>{
    const reply=(status,value)=>{if(res.destroyed)return;const body=json(value);if(Buffer.byteLength(body)>20*1024*1024){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"Result exceeds 20 MB. Use a smaller query or projection."}');return;} res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);};
    const credential=Buffer.from(req.headers.authorization||'');
    if(req.headers.origin||credential.length!==expected.length||!crypto.timingSafeEqual(credential,expected)){reply(401,{error:'Invalid connection token.'});req.resume();return;}
    if(active>=4){reply(429,{error:'Too many running operations.'});req.resume();return;}
    if(database.closed){reply(410,{error:'The owning database is closed.'});req.resume();return;}
    if(req.method==='GET'&&req.url==='/info'){reply(200,{name:database.name,allowWrites,protocol:1});return;}
    if(req.method!=='POST'||req.url!=='/execute'){reply(404,{error:'Unknown endpoint.'});req.resume();return;}
    active++;
    try {
      let size=0,chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY){reply(413,{error:'Query exceeds 2 MB.'});return;}chunks.push(chunk);}
      const plan=fromJSON(Buffer.concat(chunks).toString('utf8'));
      if(plan.database!==database.name) throw new Error('This URL grants access only to database '+database.name+'.');
      const result=await executePlan(()=>database,plan,{readOnly:!allowWrites,allowCommands:false});reply(200,result);
    } catch(error){reply(400,{error:error.message});} finally {active--;}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=1000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return Object.freeze({url:`bsonlite://127.0.0.1:${server.address().port}/${encodeURIComponent(database.name)}#${token}`,close:()=>new Promise((resolve,reject)=>{server.close(e=>e?reject(e):resolve());server.closeIdleConnections();})});
}
module.exports={startBridge};
