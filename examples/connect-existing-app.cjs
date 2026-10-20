"use strict";
// Keep your existing connection options. Automatic Console access is built in.
const BsonLite = require('bsonlite-sdk');
async function main() {
  await BsonLite.connect();
  console.log('Open BsonLite Console and click Connect.');
  // Continue running your usual application here.
}
process.once('SIGINT', () => BsonLite.stop().catch(console.error));
main().catch(console.error);
