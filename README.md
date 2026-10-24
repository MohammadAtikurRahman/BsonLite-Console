# BsonLite Console 0.2.0

An Electron database workspace and terminal CLI. **Start your BsonLite app, open Console, and click Connect.**

[Windows downloads](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/tag/v0.2.0) · [Website](https://bsonlite.com/console.html) · [বাংলায় শুরু করুন](START_HERE_BN.md) · [Build guide](BUILDING.md) · [Discord](https://discord.gg/vSRMRPYqs)

## Choose a download

| Download | Includes |
| --- | --- |
| `BsonLite.cjs` | Single-file SDK with automatic Console discovery; your app supplies Node.js. |
| `BsonLite-Easy-Connect-0.2.0.zip` | Updated SDK, Windows Console, terminal CLI tarball, offline npm SDK update, source and guides. |
| `BsonLite-Console-0.2.0-Windows-x64.zip` | Windows Console and terminal CLI tarball; use with an updated SDK app or your own URL. |

The desktop app is portable: extract it and run the `.exe`; it does not need a separate Node.js install. The native SDK still requires its supported Windows x64 environment. The terminal requires Node.js 20.19+. See [validation](VALIDATION.md) for the release-candidate build's test coverage.

## First-time update

Use the updated SDK supplied with this release once:

- Single-file apps: replace your previous `BsonLite.cjs` with the supplied file. Keep your existing `require` and `BsonLite.connect(...)` code.
- npm apps: run `npm install bsonlite-sdk` in your app folder. The published `0.6.0-rc.3` package includes automatic Console discovery. The supplied `.tgz` is also available for an offline update.

Restart your application, leave it running, and open `BsonLite-Console-0.2.0-Windows-x64.exe`. The database appears in **Running BsonLite databases**, its URL is filled in, and **Connect** opens it. Choose another item from the dropdown when multiple apps are running.

No separate bridge/helper installation, startup code change, project-folder picker or copied token is needed. Existing direct server URLs and older manually created app links still work.

## What is available

Database/collection explorer; document table/JSON views; filters, sort and pagination; insert/edit/delete; index list; collection creation; Extended JSON result export; an integrated query console; and a terminal CLI. Connections start read-only. Enable writes in Options when needed.

## How automatic connections work

The SDK automatically starts a token-protected endpoint on `127.0.0.1` after its normal database connection. It publishes a private per-user session record. Console reads that registry and verifies the live endpoint. It never scans projects or guesses database passwords. Native storage encryption, credentials, TLS, database files and the embedded native engine are unchanged.

Only running apps under the same OS account are discovered. Multiple apps/database handles get separate entries. A normal close removes the entry; stale or dead entries are ignored. Closing Console leaves the owning app running. A restart produces a fresh connection which Console discovers automatically.

Automatic records contain a local access token, not the engine password or TLS private key. Windows ACLs restrict the registry to the current account and SYSTEM; POSIX directories/files use 0700/0600. No URL/token is automatically printed or committed. Anyone allowed to use that OS account can connect to its published local sessions. Disable automatic Console access with `BSONLITE_CONSOLE=0` or `BsonLite.connect({ ...existingOptions, console: false })`.

The SDK endpoint permits ordinary collection writes; the viewer starts read-only and requires the user to enable writes. Unsupported engine-version features remain unsupported. There is no empty fake default database or automatic opening of stopped data files.

The experimental modern SDK uses the same app-link protocol, so the connection
steps stay the same. Its BSON 7 driver interoperates with this Console's BSON 6
client through the typed Extended JSON bridge. Source interoperability tests
pass; the full rebuilt 9.0.4 engine still has its own required Windows runtime
gate. Preserve existing data and follow the [engine upgrade guide](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE_BN.md)
before changing an app's engine. Console does not migrate or open stopped
database files itself.

## Nothing appears?

Start your app with the updated SDK and leave it running. Both apps must use the same Windows account. An older SDK cannot announce itself automatically. If Console is disabled by the application or Windows prevents the private registry from being protected, the owning database continues working and the SDK reports that automatic Console access is unavailable.

Advanced: both processes can use the same absolute `BSONLITE_CONSOLE_HOME` override. The default is the account's application-data directory; changing `BSONLITE_DATA_HOME` for database storage does not change discovery.

## Direct server connections

Paste a standard `mongodb://…` or `mongodb+srv://…` URI. The underlying driver is pinned to 6.16.0 to match the current BsonLite engine generation. Database features still depend on the actual server and the user's permissions.

The engine uses the MongoDB query protocol; BsonLite is an independent project. A shared query language does not mean that every server-version feature is available in every BsonLite database.

Use **Connection → Options** for an optional default database, CA certificate and combined client-certificate/private-key PEM. Certificate and hostname validation remain enabled. For password-protected private keys or additional supported TLS options, use the driver's supported URI options. Mutual TLS needs both the correct files and valid credentials.

Only authorized databases are listed. If listing databases is not permitted, the database selected by the URI is used. No guessing or scanning of local application folders takes place.

## Query console

```js
show dbs
use myapp
show collections
db.users.find({ active: true }).sort({ name: 1 }).limit(50)
db.getCollection('user-events').find({}).skip(25).limit(25)
db.users.findOne({ _id: ObjectId('507f1f77bcf86cd799439011') })
db.users.countDocuments({ active: true })
db.users.distinct('role')
db.users.aggregate([{ $match: { active: true } }, { $group: { _id: '$role', total: { $sum: 1 } } }])
db.users.insertOne({ name: 'Atik', createdAt: ISODate() })
db.users.updateOne({ name: 'Atik' }, { $set: { active: true } })
db.users.deleteOne({ _id: ObjectId('507f1f77bcf86cd799439011') })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.indexes()
db.users.dropIndex('email_1')
db.createCollection('events')
```

Each line above is a separate operation. Supported collection operations:

| Read | Write (requires writes enabled) |
| --- | --- |
| `find`, `findOne`, `countDocuments`, `estimatedDocumentCount` | `insertOne`, `insertMany` |
| `distinct`, `aggregate`, `indexes` | `updateOne`, `updateMany`, `replaceOne` |
| Cursor `sort`, `skip`, `limit`, `project`, `toArray` | `deleteOne`, `deleteMany`, `bulkWrite` |
| `getCollectionNames`, `getCollectionInfos` | `findOneAndUpdate`, `findOneAndReplace`, `findOneAndDelete` |
| `show dbs`, `show collections`, `use`, `help` | `createIndex`, `dropIndex`, collection `drop`, `createCollection` |

The console supports plain query objects, arrays, regular expressions and BSON constructors: `ObjectId`, `ISODate`, `Date`, `NumberInt`, `NumberLong`, `NumberDecimal`, `UUID`, `BinData`.

This is a database expression interpreter, not a full `mongosh` or Node.js shell. Variables, loops, functions, imports, scripts, filesystem access and server-side JavaScript are not supported. Run one expression at a time. Cursor results default to 50 documents and are capped at 1000; GUI pages show 25. Cursor BSON data is capped at 8 MB, serialized results at 20 MB, with 10-second server query timeouts.

Direct connections also allow these read commands through `db.runCommand(...)`: `ping`, `dbStats`, `collStats`, `count`, `distinct`, `listCollections`, `listIndexes`, `buildInfo`, and read-only `explain` for find/count/distinct. App links expose the SDK's public collection API, so arbitrary database commands are unavailable there. `use` on an app link cannot switch beyond its exposed database.

Aggregation stages that write (`$out`, `$merge`) require writes enabled. The underlying engine may reject unsupported stages or options; no claim of universal command compatibility is made.

## Terminal CLI

With exactly one running updated SDK app, the terminal finds it automatically. With several, choose its number. A URL is still accepted explicitly.

From the extracted source:

```powershell
npm ci
npm run cli
```

To install the command globally from the supplied tarball:

```powershell
npm install -g ".\packages\bsonlite-cli-0.2.0.tgz"
bsonlite
```

Paste the URL when prompted, or pass `--uri`. Use the `BSONLITE_URI` environment variable to avoid putting a credential in command arguments. Options:

```powershell
bsonlite --uri "CONNECTION_URL" --database myapp
bsonlite --uri "CONNECTION_URL" --write
bsonlite --uri "CONNECTION_URL" --eval "db.users.countDocuments({})"
bsonlite --uri "CONNECTION_URL" --ca "C:\certs\ca.pem" --cert "C:\certs\client.pem"
bsonlite --help
```

The terminal starts read-only unless `--write` is supplied. Enter `exit` to disconnect. Node.js 20.19+ is required for the CLI or source development; Node.js 24 is recommended for development.

The CLI tarball is supplied in the release ZIPs. This project does not claim that `bsonlite-cli` has been published on npm. From a source checkout you can also use `npm install -g . --omit=dev`.

## Develop and build

```powershell
npm ci
npm test
npm start
npm run build:win
```

The Windows portable executable is written to `release/`. Electron uses a local, sandboxed renderer with context isolation and a narrow IPC interface; database connections stay in the main process. Remote pages, renderer Node integration and navigation are disabled.

For UI checks, install Playwright (`npm install --no-save playwright@1.62.1`) and run `npm run test:ui` on a desktop or a configured virtual display. Root-only Linux test containers can set `BSONLITE_TEST_NO_SANDBOX=1` for that test launch; this flag is not part of the production app.

Real-driver integration tests are opt-in with `BSONLITE_TEST_MONGOD` pointing to a test `mongod` binary. They create disposable temporary databases and certificates, not your application data. See `VALIDATION.md` for what was actually checked.

See [BUILDING.md](BUILDING.md) for clean builds, optional UI/integration tests, SDK adapter reproduction and release instructions. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to send fixes.

## Related projects

- [BsonLite](https://github.com/MohammadAtikurRahman/BsonLite): core SDK and engine integration.
- [Bsonlite-SDK](https://github.com/MohammadAtikurRahman/Bsonlite-SDK): the `bsonlite-sdk` npm distribution.
- [Community Discord](https://discord.gg/vSRMRPYqs): questions, examples and feedback.

The project's MIT license applies to this tool. Electron, Chromium, the MongoDB Node.js driver and their dependencies retain their own licenses/notices. The native BsonLite engine and SDK are not bundled with this viewer.
