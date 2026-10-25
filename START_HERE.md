# Getting started

Download the desktop software from the [BsonLite Console page](https://bsonlite.com/console.html), or build it using [BUILDING.md](BUILDING.md).

For Console 0.3.0, run `BsonLite-Console-Setup-0.3.0-Windows-x64.exe` once. Open **BsonLite Console** from its desktop icon or the Start Menu afterwards. Setup includes the desktop runtime. To uninstall, choose **BsonLite Console** in Windows Settings → Apps or Control Panel → Programs and Features.

Start an application using the integrated BsonLite and `await BsonLite.connect()`. Open Console, select the discovered application and click Connect. With several running apps, choose the one you want. BsonLite does not open the GUI itself.

You can also enter a `bsonlite://`, `mongodb://` or `mongodb+srv://` connection URL. Treat credentials and generated bearer-token URLs as private. Direct mutual-TLS connections need the matching CA and client certificate options.

The URL field is always visible. Its Copy button copies the current URL; **Ctrl K** focuses the field. There is no Show/Hide switch. Saved connections are encrypted using supported OS credential storage.

The viewer starts read-only. Enable writes explicitly before creating collections or changing data. Supported queries include CRUD, indexes and aggregation; the tool is not an unrestricted JavaScript interpreter.

For terminal use from a source checkout:

```sh
npm ci --ignore-scripts
node bin/bsonlite.cjs --help
node bin/bsonlite.cjs --eval 'db.users.find({})'
node bin/bsonlite.cjs --write --eval 'db.users.insertOne({name:"Atik"})'
```

No URI flag discovers the running BsonLite automatically. Closing Console leaves the application database running. Stop BsonLite from the application to remove its automatic session.

Existing 4.0.28 files need a [logical upgrade](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE.md) before the modern 9.0 core can open the new destination. See BsonLite's requirements and validation evidence for the selected engine profile.
