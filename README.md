# BsonLite Console 0.3.0

A Windows database GUI, query console and terminal CLI for [BsonLite](https://bsonlite.com/), the portable MongoDB-based local database for Node.js. **Start your BsonLite app, open Console, and click Connect.**

[Desktop downloads](https://bsonlite.com/console.html) · [Getting started](START_HERE.md) · [Build guide](BUILDING.md) · [Discord](https://discord.gg/vSRMRPYqs)

## Product names

- **BsonLite** is the database, available as `BsonLite.cjs`.
- **`bsonlite-sdk`** is the npm package for BsonLite.
- **BsonLite Console** is the desktop GUI and terminal CLI.

[Support BsonLite](https://buymeacoffee.com/bsonlite) · [Website downloads](https://bsonlite.com/download.html)

## Choose a download

| Download | Includes |
| --- | --- |
| `BsonLite.cjs` | Single-file BsonLite with automatic Console discovery; your app supplies Node.js. |
| `BsonLite-Console-Setup-0.3.0-Windows-x64.exe` | Single offline Windows installer with Electron included, desktop and Start Menu shortcuts, and a Control Panel uninstall entry. |
| `bsonlite-sdk` | The npm package for BsonLite. Install it in your Node.js project with `npm i bsonlite-sdk`. |

Download the installer from the [official Console page](https://bsonlite.com/console.html), or build it from this checkout. Double-click the setup file: it installs for your Windows account, creates **BsonLite Console** on the desktop and in Start, then opens it. No separate Node.js installation, external archive or online setup downloader is needed to use the installed GUI. Subsequent launches use either shortcut; launching again brings the existing window forward.

To remove the software, use **Settings → Apps → Installed apps → BsonLite Console → Uninstall**, or **Control Panel → Programs and Features**. Reinstall repairs a missing desktop shortcut. Saved connections are retained across reinstall/uninstall; application databases remain owned by their BsonLite apps.

The native BsonLite build still requires its supported Windows x64 environment. The separate terminal CLI requires Node.js 20.19+. See [validation](VALIDATION.md) for actual test coverage.

## First-time update

Use the updated BsonLite supplied with this release once:

- Single-file apps: replace your previous `BsonLite.cjs` with the supplied file. Keep your existing `require` and `BsonLite.connect(...)` code.
- npm apps: run `npm i bsonlite-sdk`, then restart your application. If you already use an older BsonLite database, follow the [migration guide](https://bsonlite.com/docs/migration.html) before upgrading. The npm package and Console installer are separate downloads.

Restart your application, leave it running, and open **BsonLite Console** from the desktop or Start. The database appears in **Running BsonLite databases**, its URL is filled in, and **Connect** opens it. Choose another item from the dropdown when multiple apps are running.

The connection URL is always visible. There is no Show/Hide toggle. Use the adjacent **Copy connection URL** button to copy it, or **Ctrl K** to focus the field. Saved profiles keep using encrypted OS storage; making the field visible does not change storage or error redaction.

No separate bridge/helper installation, startup code change, project-folder picker or copied token is needed. Existing direct server URLs and older manually created app links still work.

## What is available

Database/collection explorer; document table/JSON views; filters, sort and pagination; insert/edit/delete; index list; collection creation; Extended JSON result export; an integrated query console; and a terminal CLI. Connections start read-only. Enable writes in Options when needed.

## How automatic connections work

BsonLite automatically starts a token-protected endpoint on `127.0.0.1` after its normal database connection. It publishes a private per-user session record. Console reads that registry and verifies the live endpoint. It never scans projects or guesses database passwords. Native storage encryption, credentials, TLS, database files and the embedded native engine are unchanged.

Only running apps under the same OS account are discovered. Multiple apps/database handles get separate entries. A normal close removes the entry; stale or dead entries are ignored. Closing Console leaves the owning app running. A restart produces a fresh connection which Console discovers automatically.

Automatic records contain a local access token, not the engine password or TLS private key. Windows ACLs restrict the registry to the current account and SYSTEM; POSIX directories/files use 0700/0600. No URL/token is automatically printed or committed. Anyone allowed to use that OS account can connect to its published local sessions. Disable automatic Console access with `BSONLITE_CONSOLE=0` or `BsonLite.connect({ ...existingOptions, console: false })`.

BsonLite endpoint permits ordinary collection writes; the viewer starts read-only and requires the user to enable writes. Unsupported engine-version features remain unsupported. There is no empty fake default database or automatic opening of stopped data files.

The experimental modern BsonLite uses the same app-link protocol, so the connection
steps stay the same. Its BSON 7 driver interoperates with this Console's BSON 6
client through the typed Extended JSON bridge. Native engine validation is
recorded separately in the [core workflow](https://github.com/MohammadAtikurRahman/BsonLite/actions/workflows/modern-engine.yml).
Preserve existing data and follow the [engine upgrade guide](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE.md)
before changing an app's engine. Console does not migrate or open stopped
database files itself.

## Nothing appears?

Start your app with the updated BsonLite and leave it running. Both apps must use the same Windows account. An older BsonLite cannot announce itself automatically. If Console is disabled by the application or Windows prevents the private registry from being protected, the owning database continues working and BsonLite reports that automatic Console access is unavailable.

Advanced: both processes can use the same absolute `BSONLITE_CONSOLE_HOME` override. The default is the account's application-data directory; changing `BSONLITE_DATA_HOME` for database storage does not change discovery.

## Direct server connections

Paste a standard `mongodb://…` or `mongodb+srv://…` URI. The direct-connection driver remains pinned to 6.16.0 for existing connections. BsonLite apps use their discovered `bsonlite://…` links, including the modern BsonLite. Database features depend on the actual server, driver support and the user's permissions.

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

Direct connections also allow these read commands through `db.runCommand(...)`: `ping`, `dbStats`, `collStats`, `count`, `distinct`, `listCollections`, `listIndexes`, `buildInfo`, and read-only `explain` for find/count/distinct. App links expose BsonLite's public collection API, so arbitrary database commands are unavailable there. `use` on an app link cannot switch beyond its exposed database.

Aggregation stages that write (`$out`, `$merge`) require writes enabled. The underlying engine may reject unsupported stages or options; no claim of universal command compatibility is made.

## Terminal CLI

With exactly one running updated BsonLite app, the terminal finds it automatically. With several, choose its number. A URL is still accepted explicitly.

From the extracted source:

```powershell
npm ci
npm run cli
```

To install the command globally from a locally packed tarball:

```powershell
npm install -g ".\bsonlite-cli-0.3.0.tgz"
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

Create a CLI tarball with `npm pack --ignore-scripts`, or install from the checkout with `npm install -g . --omit=dev`. This project does not claim that `bsonlite-cli` has been published on npm. The desktop installer already includes its own query console; terminal CLI installation is optional.

## Develop and build

```powershell
npm ci
npm test
npm start
npm run build:win
```

The single Windows setup executable is written to `release/BsonLite-Console-Setup-0.3.0-Windows-x64.exe`. Distribute that `.exe` alone; the build output's unpacked directory is for development. Electron uses a local, sandboxed renderer with context isolation and a narrow IPC interface; database connections stay in the main process. Remote pages, renderer Node integration and navigation are disabled.

For UI checks, run `npm run test:ui` after `npm ci` on a desktop or a configured virtual display. Playwright is pinned in the lockfile and launches Electron directly, so no browser download is required. Root-only Linux test containers can set `BSONLITE_TEST_NO_SANDBOX=1` for that test launch; this flag is not part of the production app.

Real-driver integration tests are opt-in with `BSONLITE_TEST_MONGOD` pointing to a test `mongod` binary. They create disposable temporary databases and certificates, not your application data. See `VALIDATION.md` for what was actually checked.

See [BUILDING.md](BUILDING.md) for clean builds, optional UI/integration tests, BsonLite adapter reproduction and release instructions. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to send fixes.

## Related projects

- [BsonLite](https://github.com/MohammadAtikurRahman/BsonLite): core BsonLite and engine integration.
- [npm package repository](https://github.com/MohammadAtikurRahman/Bsonlite-SDK): the `bsonlite-sdk` npm distribution.
- [Community Discord](https://discord.gg/vSRMRPYqs): questions, examples and feedback.

The project's MIT license applies to this tool. Electron, Chromium, the MongoDB Node.js driver and their dependencies retain their own licenses/notices. The native BsonLite engine and BsonLite are not bundled with this viewer.
