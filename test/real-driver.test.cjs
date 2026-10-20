'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const net=require('node:net');
const {spawn,execFileSync}=require('node:child_process');
const {once}=require('node:events');
const {MongoClient}=require('mongodb');
const {Connection}=require('../src/connection.cjs');
const {startBridge}=require('../src/bridge.cjs');
const {discoverConnections}=require('../src/discovery.cjs');
const binary=process.env.BSONLITE_TEST_MONGOD;
async function fixture(t,tls){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bsonlite-real-'));await fs.mkdir(path.join(dir,'db'));
  const server=net.createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(r=>server.close(r));
  const args=['--dbpath',path.join(dir,'db'),'--bind_ip','127.0.0.1','--port',String(port),'--quiet','--nounixsocket','--logpath',path.join(dir,'mongo.log')];
  const options={directConnection:true,serverSelectionTimeoutMS:1000};
  if(tls){
    const run=a=>execFileSync('openssl',a,{cwd:dir,stdio:'ignore'});
    run(['req','-x509','-newkey','rsa:2048','-nodes','-keyout','ca.key','-out','ca.pem','-days','1','-subj','/CN=BsonLite test CA']);
    await fs.writeFile(path.join(dir,'server.ext'),'subjectAltName=IP:127.0.0.1,DNS:localhost\nextendedKeyUsage=serverAuth,clientAuth\n');
    run(['req','-newkey','rsa:2048','-nodes','-keyout','server.key','-out','server.csr','-subj','/CN=localhost']);
    run(['x509','-req','-in','server.csr','-CA','ca.pem','-CAkey','ca.key','-CAcreateserial','-out','server.crt','-days','1','-extfile','server.ext']);
    run(['req','-newkey','rsa:2048','-nodes','-keyout','client.key','-out','client.csr','-subj','/CN=BsonLite test client']);
    run(['x509','-req','-in','client.csr','-CA','ca.pem','-CAkey','ca.key','-CAcreateserial','-out','client.crt','-days','1']);
    for(const kind of ['server','client'])await fs.writeFile(path.join(dir,kind+'.pem'),Buffer.concat([await fs.readFile(path.join(dir,kind+'.key')),await fs.readFile(path.join(dir,kind+'.crt'))]));
    args.push('--tlsMode','requireTLS','--tlsCertificateKeyFile',path.join(dir,'server.pem'),'--tlsCAFile',path.join(dir,'ca.pem'));
    Object.assign(options,{tls:true,tlsCAFile:path.join(dir,'ca.pem'),tlsCertificateKeyFile:path.join(dir,'client.pem')});
  }
  let process=spawn(binary,args,{stdio:'ignore'});
  t.after(async()=>{if(process.exitCode===null&&process.signalCode===null){const exited=once(process,'exit');process.kill('SIGTERM');await exited.catch(()=>{});}await fs.rm(dir,{recursive:true,force:true});});
  let bootstrap;
  for(let i=0;i<30;i++){try{bootstrap=new MongoClient('mongodb://127.0.0.1:'+port,options);await bootstrap.connect();break;}catch(e){await bootstrap?.close();bootstrap=null;if(i===29)throw new Error('Test engine did not start: '+await fs.readFile(path.join(dir,'mongo.log'),'utf8'));await new Promise(r=>setTimeout(r,100));}}
  try{await bootstrap.db('admin').command({createUser:'console_test',pwd:'test-password-only',roles:[{role:'readWrite',db:'demo'}]});}finally{await bootstrap.close();}
  const stopped=once(process,'exit');process.kill('SIGTERM');await stopped;
  process=spawn(binary,[...args,'--auth'],{stdio:'ignore'});
  return{uri:`mongodb://console_test:test-password-only@127.0.0.1:${port}/demo?authSource=admin&directConnection=true`,options};
}
test('real database driver: authenticated URI, queries, pagination, CRUD, indexes, aggregate and helper bridge',{skip:!binary,timeout:60000},async t=>{
  const f=await fixture(t,false),c=new Connection();t.after(()=>c.disconnect());await c.connect({uri:f.uri,readOnly:false});
  await c.run('db.users.insertMany([{name:"Atik",active:true},{name:"Nadia",active:true},{name:"Rafi",active:false}])');
  const read=await c.run('db.users.find({active:true}).sort({name:1}).limit(1)');assert.equal(read.value[0].name,'Atik');assert(read.truncated);
  assert.equal((await c.run('db.users.find({}).sort({name:1}).skip(1).limit(1)')).value[0].name,'Nadia');
  assert.equal((await c.run('db.users.updateOne({name:"Atik"},{$set:{role:"admin"}})')).value.modifiedCount,1);
  assert.equal((await c.run('db.users.aggregate([{$match:{active:true}},{$group:{_id:null,total:{$sum:1}}}])')).value[0].total,2);
  assert.equal((await c.run('db.users.createIndex({name:1},{unique:true})')).value,'name_1');assert.equal((await c.run('db.users.indexes()')).value.length,2);
  assert.equal((await c.run('db.users.distinct("role")')).value[0],'admin');assert.equal((await c.run('db.users.deleteOne({name:"Rafi"})')).value.deletedCount,1);
  assert((await c.run('show dbs')).value.some(x=>x.name==='demo'));assert((await c.run('show collections')).value.some(x=>x.name==='users'));
  await c.run('db.createCollection("events")');assert.equal((await c.run('db.runCommand({ping:1})')).value.ok,1);
  await c.connect({uri:f.uri});await assert.rejects(c.run('db.users.drop()'),/Read-only/);
  const client=new MongoClient(f.uri);await client.connect();t.after(()=>client.close());const db=client.db('demo');
  const bridge=await startBridge({name:'demo',collection:db.collection.bind(db),listCollections:db.listCollections.bind(db),createCollection:db.createCollection.bind(db)},{allowWrites:true});t.after(()=>bridge.close());
  const linked=new Connection();t.after(()=>linked.disconnect());await linked.connect({uri:bridge.url,readOnly:false});assert.equal((await linked.run('db.users.countDocuments({})')).value,2);await linked.run('db.users.insertOne({name:"Bridge verified",amount:NumberLong("9223372036854775807")})');assert.equal((await linked.run('db.users.findOne({name:"Bridge verified"})')).value.amount.toString(),'9223372036854775807');
});
test('real database driver: verified mutual TLS and credentials through Connection options',{skip:!binary,timeout:60000},async t=>{
  const f=await fixture(t,true),c=new Connection();t.after(()=>c.disconnect());await c.connect({uri:f.uri,...f.options,readOnly:false});await c.run('db.tlscheck.insertOne({verified:true})');assert.equal((await c.run('db.tlscheck.findOne({verified:true})')).value.verified,true);
  const bad=new Connection();await assert.rejects(bad.connect({uri:f.uri,...f.options,tlsCertificateKeyFile:f.options.tlsCAFile}));
});
test('built SDK adapter: automatic discovery and CRUD through an authenticated mutual-TLS database',{skip:!binary||!process.env.BSONLITE_ADDON_PATH,timeout:60000},async t=>{
  const f=await fixture(t,true),client=new MongoClient(f.uri,{...f.options,serverSelectionTimeoutMS:10000});await client.connect();
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'bsonlite-built-discovery-')),prior=process.env.BSONLITE_CONSOLE_HOME;process.env.BSONLITE_CONSOLE_HOME=directory;
  const {BSON,ObjectId}=require('mongodb');
  class Handle{#db;#closed=false;constructor(){this.#db=client.db('demo');this.name='demo';Object.freeze(this);}get closed(){return this.#closed;}collection(...a){return this.#db.collection(...a);}listCollections(...a){return this.#db.listCollections(...a);}createCollection(...a){return this.#db.createCollection(...a);}async close(){this.#closed=true;await client.close();}}
  const handle=new Handle();const core=Object.freeze({BSON,ObjectId,connect:async()=>handle,open:async()=>handle,stop:()=>handle.close(),BsonLiteError:Error});
  const sdk=require(process.env.BSONLITE_ADDON_PATH)(core),viewer=new Connection();
  t.after(async()=>{await viewer.disconnect();await sdk.stop();if(prior===undefined)delete process.env.BSONLITE_CONSOLE_HOME;else process.env.BSONLITE_CONSOLE_HOME=prior;await fs.rm(directory,{recursive:true,force:true});});
  await sdk.connect();const found=await discoverConnections({directory});assert.equal(found.length,1);assert.equal(found[0].uri,sdk.connectionURL);
  await viewer.connect({uri:found[0].uri,readOnly:false});await viewer.run('db.automatic.insertOne({name:"No helper",n:NumberLong("9223372036854775807")})');assert.equal((await viewer.run('db.automatic.findOne({name:"No helper"})')).value.n.toString(),'9223372036854775807');
  await viewer.disconnect();await sdk.stop();assert.deepEqual(await discoverConnections({directory}),[]);
});
