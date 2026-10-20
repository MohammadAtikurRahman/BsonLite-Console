'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {discoveryDirectory}=require('../discovery-path.cjs');
const {protectDirectory}=require('./permissions.cjs');
const {startBridge}=require('../bridge.cjs');
function atomicRecord(file,value){const temporary=file+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';try{fs.writeFileSync(temporary,JSON.stringify(value),{flag:'wx',mode:0o600});fs.renameSync(temporary,file);}finally{try{fs.unlinkSync(temporary);}catch(e){if(e.code!=='ENOENT')throw e;}}}
async function startAutoConsole(database,{directory=discoveryDirectory(),protect=protectDirectory,allowWrites=true}={}){
  await protect(directory,[],false);
  const bridge=await startBridge(database,{allowWrites});
  const id=crypto.randomBytes(16).toString('hex'),file=path.join(directory,id+'.json');
  const record={format:'bsonlite-console/1',id,database:database.name,appName:path.basename(process.cwd()).slice(0,120),pid:process.pid,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),uri:bridge.url};
  let closed=false,closing=null;
  const remove=()=>{try{fs.unlinkSync(file);}catch(e){if(e.code!=='ENOENT')throw e;}};
  let heartbeat;
  const onExit=()=>{try{remove();}catch{}};
  const close=()=>{
    if(closing)return closing;closed=true;clearInterval(heartbeat);process.off('exit',onExit);
    closing=(async()=>{try{remove();}finally{await bridge.close();}})();return closing;
  };
  try{atomicRecord(file,record);}catch(error){await bridge.close();throw error;}
  process.once('exit',onExit);
  heartbeat=setInterval(()=>{
    if(closed)return;
    if(database.closed){void close().catch(()=>{});return;}
    record.updatedAt=new Date().toISOString();try{atomicRecord(file,record);}catch{void close().catch(()=>{});}
  },20000);heartbeat.unref();
  return Object.freeze({url:bridge.url,id,close});
}
function enhanceSDK(core,settings={}){
  if(core.consoleVersion)return core;
  const entries=new WeakMap(),starting=new Set();let shared=null,stopping=null;
  function inputOptions(input){if(input&&typeof input==='object'&&Object.hasOwn(input,'console')){if(typeof input.console!=='boolean')throw new core.BsonLiteError('BSONLITE_INVALID_OPTIONS','console must be true or false.');const copy={...input};delete copy.console;return copy;}return input;}
  function enabled(input){if(process.env.BSONLITE_CONSOLE==='0')return false;return input&&typeof input==='object'&&Object.hasOwn(input,'console')?input.console:undefined;}
  async function attach(database,wanted){
    if(entries.has(database)){const existing=entries.get(database);if(wanted!==undefined&&wanted!==existing.wanted)throw new core.BsonLiteError('BSONLITE_CONFIG_CONFLICT','Stop the database before changing automatic Console access.');return existing.pending;}
    wanted=wanted!==false;
    const pending=(async()=>{
      let link=null;
      if(wanted)try{link=await startAutoConsole(database,settings);}catch{process.emitWarning('Automatic Console connection is unavailable. The database is still running.',{code:'BSONLITE_CONSOLE_UNAVAILABLE'});}
      let closing;
      const close=()=>closing||(closing=(async()=>{try{await link?.close();}finally{await database.close();}})());
      const methods=new Map();
      const proxy=new Proxy(database,{get(target,key){if(key==='connectionURL')return link?.url||null;if(key==='close')return close;const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;const descriptor=Object.getOwnPropertyDescriptor(target,key);if(descriptor&&!descriptor.configurable&&!descriptor.writable)return value;if(!methods.has(key))methods.set(key,value.bind(target));return methods.get(key);}});
      return{proxy,closeLink:()=>link?.close(),database};
    })();entries.set(database,{wanted,pending});return pending;
  }
  function start(input){
    if(stopping)return Promise.reject(new core.BsonLiteError('BSONLITE_STOPPING','Wait for BsonLite.stop() before starting again.'));
    const pending=(async()=>{const db=await core.connect(inputOptions(input));const record=await attach(db,enabled(input));shared=record;return record.proxy;})();
    starting.add(pending);return pending.finally(()=>starting.delete(pending));
  }
  async function open(input){return(await attach(await core.open(inputOptions(input)),enabled(input))).proxy;}
  function stop(){if(stopping)return stopping;stopping=(async()=>{await Promise.allSettled([...starting]);try{if(shared)await shared.closeLink();}finally{await core.stop();shared=null;}})().finally(()=>{stopping=null;});return stopping;}
  const api={...core,connect:start,start,open,stop,disconnect:stop,consoleVersion:'0.2.0'};
  Object.defineProperty(api,'connectionURL',{enumerable:false,get:()=>shared&&!shared.database.closed?shared.proxy.connectionURL:null});
  return Object.freeze(api);
}
module.exports={startAutoConsole,enhanceSDK};
