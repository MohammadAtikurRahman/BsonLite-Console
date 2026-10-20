'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const esbuild=require('esbuild');
async function main(){
  const original=path.resolve(process.argv[2]||'../../bsonlite-npm/BsonLite.cjs');
  const target=path.resolve(process.argv[3]||'sdk-output');fs.mkdirSync(target,{recursive:true});
  const core=fs.readFileSync(original),hash=crypto.createHash('sha256').update(core).digest('hex');
  if(hash!=='7e195c261a0bafe9d93b4afe8536d18e4006298c16d125a27093c1bbdd99309f')throw Error('Use the exact validated native SDK baseline. Engine bytes were not substituted.');
  const result=await esbuild.build({entryPoints:[path.resolve('src/sdk/auto-console.cjs')],bundle:true,write:false,platform:'node',format:'iife',globalName:'BsonLiteConsoleAddon',target:'node20',minify:false,legalComments:'inline',plugins:[{name:'sdk-bson',setup(build){build.onResolve({filter:/^mongodb$/},()=>({path:'sdk-bson',namespace:'sdk'}));build.onLoad({filter:/.*/,namespace:'sdk'},()=>({contents:'module.exports = __BSONLITE_CORE__;',loader:'js'}));}}]});
  const acornLicense=fs.readFileSync(path.join(path.dirname(require.resolve('acorn/package.json')),'LICENSE'),'utf8');
  const factory='/* BsonLite Console 0.2.0 automatic local connections. MIT. Native engine unchanged.\nIncludes Acorn, under the following license:\n'+acornLicense+'\n*/\nmodule.exports = function enableConsole(__BSONLITE_CORE__) {\n'+result.outputFiles[0].text+'\nreturn BsonLiteConsoleAddon.enhanceSDK(__BSONLITE_CORE__);\n};\n';
  fs.writeFileSync(path.join(target,'auto-console.cjs'),factory);
  const append='\n/* Integrated automatic Console discovery; native SDK/engine payload above is preserved byte for byte. */\nif (process.argv[2] !== "--bsonlite-internal-supervisor") {\nmodule.exports = (function(core) {\nconst addonModule = {exports:{}};\n(function(module) {\n'+factory+'\n})(addonModule);\nreturn addonModule.exports(core);\n})(module.exports);\n}\n';
  fs.writeFileSync(path.join(target,'BsonLite.cjs'),Buffer.concat([core,Buffer.from(append)]));
  fs.writeFileSync(path.join(target,'index.cjs'),'"use strict";\nmodule.exports = require("./auto-console.cjs")(require("./BsonLite.cjs"));\n');
  fs.writeFileSync(path.join(target,'build-info.json'),JSON.stringify({consoleVersion:'0.2.0',baselineSDKVersion:'0.6.0-rc.1',npmVersion:'0.6.0-rc.3',baselineSHA256:hash,nativeEngineChanged:false,sdkSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(target,'BsonLite.cjs'))).digest('hex')},null,2)+'\n');
  console.log('Built standalone BsonLite.cjs and npm add-on. Original native SDK/engine preserved.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
