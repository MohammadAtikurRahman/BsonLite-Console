'use strict';
const {app,BrowserWindow,ipcMain,dialog,protocol,net,session,safeStorage}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {Connection,safeError}=require('../src/connection.cjs');
const {fromJSON,json}=require('../src/query.cjs');
const {discoverConnections}=require('../src/discovery.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'bsonlite-app',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
let window,connection=new Connection(),lastResult=null,profiles=[];
const profileFile=()=>path.join(app.getPath('userData'),'connections.json');
function secureStorage(){return safeStorage.isEncryptionAvailable()&&(process.platform!=='linux'||safeStorage.getSelectedStorageBackend()!=='basic_text');}
async function saveProfiles(){await fs.writeFile(profileFile(),JSON.stringify(profiles),{mode:0o600});}
async function handle(action,p={}){
  switch(action){
    case 'discover': return discoverConnections();
    case 'connect': return connection.connect(p);
    case 'disconnect': await connection.disconnect();lastResult=null;return true;
    case 'databases': return connection.run('show dbs');
    case 'collections': {const result=await connection.runPlan({type:'collections',database:p.database});await connection.runPlan({type:'use',database:p.database});return result;}
    case 'browse': {
      if(!Number.isSafeInteger(p.page)||p.page<0||p.page>40000)throw new Error('Invalid page.');
      const source=`db.getCollection(${JSON.stringify(p.collection)}).find(${p.filter||'{}'}).sort(${p.sort||'{_id:1}'}).skip(${p.page*25}).limit(25)`;
      lastResult=await connection.run(source);return lastResult;
    }
    case 'query':lastResult=await connection.run(p.source);return lastResult;
    case 'indexes':lastResult=await connection.run(`db.getCollection(${JSON.stringify(p.collection)}).indexes()`);return lastResult;
    case 'write': {
      const base={type:'query',database:connection.database,collection:p.collection,modifiers:[]};
      let plan;
      if(p.operation==='insert'){const value=fromJSON(p.document);if(!value||typeof value!=='object'||Array.isArray(value)&&!value.length)throw new Error('Enter a document or a nonempty array of documents.');plan={...base,method:Array.isArray(value)?'insertMany':'insertOne',args:[value]};}
      else if(p.operation==='replace'){const doc=fromJSON(p.document),id=fromJSON(p.id);if(!doc||typeof doc!=='object'||Array.isArray(doc))throw new Error('Enter a single document.');plan={...base,method:'replaceOne',args:[{_id:id},doc]};}
      else if(p.operation==='delete')plan={...base,method:'deleteOne',args:[{_id:fromJSON(p.id)}]};
      else throw new Error('Unknown document operation.');
      return connection.runPlan(plan);
    }
    case 'createCollection':return connection.runPlan({type:'createCollection',database:connection.database,args:[p.name]});
    case 'export':{
      if(!lastResult)throw new Error('Run a query first.');const target=await dialog.showSaveDialog(window,{defaultPath:'bsonlite-result.json',filters:[{name:'Extended JSON',extensions:['json']}]});
      if(target.canceled)return{saved:false};await fs.writeFile(target.filePath,lastResult.text+'\n');return{saved:true};
    }
    case 'pickCertificate':{const result=await dialog.showOpenDialog(window,{properties:['openFile'],filters:[{name:'TLS certificates',extensions:['pem','crt','key']},{name:'All files',extensions:['*']}]});return result.canceled?'':result.filePaths[0];}
    case 'profiles':return{items:profiles.map(x=>({id:x.id,name:x.name})),canSave:secureStorage()};
    case 'saveProfile':{
      if(!secureStorage())throw new Error('Encrypted credential storage is unavailable on this computer. Use a session connection.');
      if(profiles.length>=20)throw new Error('Keep up to 20 saved connections.');
      if(typeof p.name!=='string'||!p.name.trim()||p.name.length>60||JSON.stringify(p.options).length>32768)throw new Error('Enter a short connection name.');
      const record={id:crypto.randomUUID(),name:p.name.trim(),encrypted:safeStorage.encryptString(JSON.stringify(p.options)).toString('base64')};
      profiles.push(record);await saveProfiles();return{id:record.id,name:record.name};
    }
    case 'loadProfile':{const record=profiles.find(x=>x.id===p.id);if(!record)throw new Error('Connection not found.');if(!secureStorage())throw new Error('Encrypted storage is unavailable.');return JSON.parse(safeStorage.decryptString(Buffer.from(record.encrypted,'base64')));}
    case 'deleteProfile':profiles=profiles.filter(x=>x.id!==p.id);await saveProfiles();return true;
    default:throw new Error('Unknown workspace action.');
  }
}
app.whenReady().then(async()=>{
  protocol.handle('bsonlite-app',request=>{const u=new URL(request.url);const file=decodeURIComponent(u.pathname.slice(1))||'index.html';if(u.host!=='workspace'||!['index.html','styles.css','renderer.js','icon.svg'].includes(file))return new Response('Not found',{status:404});return net.fetch(pathToFileURL(path.join(__dirname,'ui',file)).href);});
  try{const data=await fs.readFile(profileFile(),'utf8');if(data.length<1024*1024){const value=JSON.parse(data);if(Array.isArray(value))profiles=value.filter(x=>typeof x.id==='string'&&typeof x.name==='string'&&typeof x.encrypted==='string').slice(0,20);}}catch{}
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  window=new BrowserWindow({width:1440,height:950,minWidth:1024,minHeight:720,title:'BsonLite Console',icon:path.join(__dirname,'ui','icon.png'),backgroundColor:'#10141e',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',event=>event.preventDefault());
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  ipcMain.handle('workspace:request',async(event,action,payload)=>{
    if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||!event.senderFrame.url.startsWith('bsonlite-app://workspace/'))throw new Error('Untrusted request.');
    try{return{ok:true,value:await handle(action,payload)}}catch(e){return{ok:false,error:safeError(e)}}
  });
  await window.loadURL('bsonlite-app://workspace/index.html');
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{connection.adapter?.close().catch(()=>{});});
