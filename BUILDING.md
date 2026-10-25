# Build BsonLite Console

This repo includes the Electron GUI, terminal CLI, connection/discovery code, BsonLite adapter, tests and build scripts. Native BsonLite binaries belong in Releases, not Git.

## Windows: clone and run

Install Git and Node.js 24 LTS with npm. Open PowerShell:

```powershell
git clone https://github.com/MohammadAtikurRahman/BsonLite-Console.git
cd BsonLite-Console
npm ci
npm test
npm start
```

Build the single offline Windows x64 setup installer:

```powershell
npm run build:win
```

Output: `release/BsonLite-Console-Setup-0.3.0-Windows-x64.exe`. Filenames follow the version in `package.json`. Upload/distribute just this `.exe`. The first build downloads Electron and packaging tools; the finished setup embeds the GUI and all its runtime files, so users do not need Node.js or an internet download during installation.

Setup installs for the current Windows account without elevation. It creates desktop and Start Menu shortcuts named **BsonLite Console**, repairs a missing desktop shortcut on reinstall and registers **BsonLite Console** in Settings/Control Panel for uninstall. The application, shortcuts, installer and uninstaller use the included multi-size icon. The application opens after an interactive install. Repeated launches focus the existing window.

Existing connection profiles keep the previous `bsonlite-cli` application-data identity. Reinstall and ordinary uninstall retain that data. The installer does not bundle an BsonLite engine, register database services or manage the owning application's database folders.

The current executable is unsigned; signing requires the maintainer's own signing setup. `signExecutable: false` leaves icon and Windows product metadata editing enabled. Do not disable `signAndEditExecutable`, which would also remove those branding edits.

`npm run build:dir` creates an unpacked app for the current host. Windows x64 is the distributed target. Development on other operating systems does not make the native Windows BsonLite cross-platform.

## Terminal CLI without the GUI

```powershell
npm run cli
npm run cli -- --write
npm run cli -- --eval "db.users.countDocuments({})"
```

One running updated BsonLite app is discovered automatically. With several, interactive mode asks which to use. An explicit `--uri` or `BSONLITE_URI` also works; see README for query and TLS options.

Create a tarball without publishing:

```powershell
npm pack --ignore-scripts --pack-destination .
npm install -g .\bsonlite-cli-0.3.0.tgz
bsonlite
```

CLI production dependencies do not install Electron. Electron is a development dependency for the desktop app.

## Tests

`npm test` runs core/query, bridge and BsonLite discovery checks. Real-server cases skip explicitly unless `BSONLITE_TEST_MONGOD` points to a disposable test server binary. Tests use temporary instances and synthetic records, never your app's data. Windows TLS tests also need OpenSSL in PATH.

```powershell
$env:BSONLITE_TEST_MONGOD = 'C:\tools\mongodb\bin\mongod.exe'
npm test
```

For actual Electron UI checks on a desktop session:

```powershell
npm run test:ui
```

Playwright is installed by `npm ci`. The test launches Electron, so a browser download is unnecessary. Headless Linux needs a virtual display. `BSONLITE_TEST_NO_SANDBOX=1` is a root-container test flag; production enables renderer sandboxing. Tests use temporary profiles and a synthetic bridge database.

CI also runs `npm run test:installer` on a disposable Windows runner. It installs the real setup into a path containing spaces, verifies shortcut targets/icons, product metadata and the uninstall registration, reinstalls to repair a removed desktop icon, runs the same UI workflow against the **installed** executable, then uninstalls and checks cleanup while retaining a user-data marker. This lifecycle script refuses to run on an ordinary desktop to avoid changing a maintainer's installed copy.

## Optional: reproduce the earlier BsonLite Console adapter

`src/sdk/auto-console.cjs` is the maintainable adapter source. This historical reproduction path bundles it and appends it to the exact earlier native BsonLite build baseline without recompiling/replacing the engine. It is not needed to build the Console installer or to connect an already updated BsonLite. Modern BsonLite distributions are built and verified in the core/BsonLite repositories.

```powershell
New-Item -ItemType Directory -Force vendor | Out-Null
Invoke-WebRequest 'https://raw.githubusercontent.com/MohammadAtikurRahman/Bsonlite-SDK/3e06d43cd205d269f39d07967f025c4b2d51e1ea/BsonLite.cjs' -OutFile vendor\BsonLite.cjs
Get-FileHash vendor\BsonLite.cjs -Algorithm SHA256
npm run build:sdk -- vendor/BsonLite.cjs sdk-output
```

Required baseline SHA-256: `7e195c261a0bafe9d93b4afe8536d18e4006298c16d125a27093c1bbdd99309f`. Other inputs are refused. Output includes standalone `BsonLite.cjs`, npm adapter, entry point and build metadata. For compiled-adapter integration tests, set `BSONLITE_ADDON_PATH` to the generated `auto-console.cjs`.

Keep original BsonLite notices and the matching modified native engine source available when distributing BsonLite. Their licenses differ from this Console project's MIT license. The npm package repo contains the matching archive in `source/` and component notices in `licenses/`.

## Automatic Windows builds

`.github/workflows/build.yml` tests, builds and checks the installer on main pushes, pull requests and manual runs. Download `BsonLite-Console-Windows-x64` from a successful run's Artifacts section if you want CI's setup file. UI screenshots are retained separately. GitHub packages workflow artifacts in a ZIP; that is not the end-user format, and you can build the setup directly using the command above. CI does not publish to npm or create public releases automatically.

## Maintainer release

1. Update `package.json` and the lockfile together. Run checks plus the Windows smoke test in `VALIDATION.md`.
2. Build the Windows executable and CLI tarball. Keep versioned asset names and the website manifest in sync.
3. Tag the matching source and record the setup file's SHA-256 checksum. The single-file BsonLite and npm package stay separate distributions.
4. Upload the setup `.exe` to the website or a suitable release host and verify the public URL/hash. Keep component notices inside the installed application.
5. Publish an npm package update separately when ready. A supplied offline tarball does not imply that version is on the registry.
