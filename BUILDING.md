# Build BsonLite Console

This repo includes the Electron GUI, terminal CLI, connection/discovery code, SDK adapter, tests and build scripts. Native SDK binaries belong in Releases, not Git.

## Windows: clone and run

Install Git and Node.js 24 LTS with npm. Open PowerShell:

```powershell
git clone https://github.com/MohammadAtikurRahman/BsonLite-Console.git
cd BsonLite-Console
npm ci
npm test
npm start
```

Build a portable Windows x64 app:

```powershell
npm run build:win
```

Output: `release/BsonLite-Console-0.2.0-Windows-x64.exe`. Filenames follow the version in `package.json`. The first build downloads Electron and packaging tools. The current executable is unsigned; signing requires the maintainer's own signing setup.

`npm run build:dir` creates an unpacked app for the current host. Windows x64 is the distributed target. Development on other operating systems does not make the native Windows SDK cross-platform.

## Terminal CLI without the GUI

```powershell
npm run cli
npm run cli -- --write
npm run cli -- --eval "db.users.countDocuments({})"
```

One running updated SDK app is discovered automatically. With several, interactive mode asks which to use. An explicit `--uri` or `BSONLITE_URI` also works; see README for query and TLS options.

Create a tarball without publishing:

```powershell
npm pack --ignore-scripts --pack-destination .
npm install -g .\bsonlite-cli-0.2.0.tgz
bsonlite
```

CLI production dependencies do not install Electron. Electron is a development dependency for the desktop app.

## Tests

`npm test` runs core/query, bridge and SDK discovery checks. Real-server cases skip explicitly unless `BSONLITE_TEST_MONGOD` points to a disposable test server binary. Tests use temporary instances and synthetic records, never your app's data. Windows TLS tests also need OpenSSL in PATH.

```powershell
$env:BSONLITE_TEST_MONGOD = 'C:\tools\mongodb\bin\mongod.exe'
npm test
```

For actual Electron UI checks on a desktop session:

```powershell
npm install --no-save --package-lock=false playwright@1.62.1
npm run test:ui
```

The test launches Electron, so a Playwright browser download is unnecessary. Headless Linux needs a virtual display. `BSONLITE_TEST_NO_SANDBOX=1` is a root-container test flag; production enables renderer sandboxing.

## Reproduce the SDK Console adapter

`src/sdk/auto-console.cjs` is the maintainable adapter source. The build bundles it and appends it to the exact native SDK baseline without recompiling/replacing the engine.

```powershell
New-Item -ItemType Directory -Force vendor | Out-Null
Invoke-WebRequest 'https://raw.githubusercontent.com/MohammadAtikurRahman/Bsonlite-SDK/3e06d43cd205d269f39d07967f025c4b2d51e1ea/BsonLite.cjs' -OutFile vendor\BsonLite.cjs
Get-FileHash vendor\BsonLite.cjs -Algorithm SHA256
npm run build:sdk -- vendor/BsonLite.cjs sdk-output
```

Required baseline SHA-256: `7e195c261a0bafe9d93b4afe8536d18e4006298c16d125a27093c1bbdd99309f`. Other inputs are refused. Output includes standalone `BsonLite.cjs`, npm adapter, entry point and build metadata. For compiled-adapter integration tests, set `BSONLITE_ADDON_PATH` to the generated `auto-console.cjs`.

Keep original SDK notices and the matching modified native engine source available when distributing the SDK. Their licenses differ from this Console project's MIT license. The npm SDK repo contains the matching archive in `source/` and component notices in `licenses/`.

## Automatic Windows builds

`.github/workflows/build.yml` tests and builds on main pushes, pull requests and manual runs. Download `BsonLite-Console-Windows-x64` from a successful run's Artifacts section. CI does not publish to npm or create public releases automatically.

## Maintainer release

1. Update `package.json` and the lockfile together. Run checks plus the Windows smoke test in `VALIDATION.md`.
2. Build the Windows executable and CLI tarball. Keep versioned asset names and the website manifest in sync.
3. Package Console-only and SDK+Console ZIPs, first-run guides, source/notices and SHA-256 checksums. Tag the matching source.
4. Upload assets to GitHub Releases and verify public download URLs/hashes before updating the website.
5. Publish an npm SDK update separately when ready. A supplied offline tarball does not imply that version is on the registry.
