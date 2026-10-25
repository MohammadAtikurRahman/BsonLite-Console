# Validation — BsonLite Console 0.3.0

## Windows installer and GUI checks on 2026-10-25

Functional commit `9b295bfb5e87288200d13dc926cb024a60c66448` passed [Windows run 40218973518](https://github.com/MohammadAtikurRahman/BsonLite-Console/actions/runs/40218973518), job `121246191966`, on Windows Server 2022 with Node.js 24.22.1, Electron 44.9.1 and electron-builder 26.15.3.

- Core/discovery/bridge/query tests: **21 passed, 0 failed**. Three opt-in real-server cases skipped because this installer job does not provide their engine fixtures.
- Actual source Electron GUI: product name/version, always-visible URL, clipboard copy, one window after a second launch, renderer isolation, automatic discovery, explorer, pagination, filter, read-only controls, document insert/edit/delete, query results/errors, export, indexes, JSON view, collection creation, encrypted saved-profile roundtrip, minimum window layout and disconnect all passed.
- Built the real offline NSIS setup: `BsonLite-Console-Setup-0.3.0-Windows-x64.exe`.
- Installed into a directory containing spaces. Verified the application's product metadata, desktop and Start Menu shortcut targets/icons, and a **BsonLite Console** Control Panel uninstall entry with the matching version, display icon and registered uninstaller.
- Deleted the desktop shortcut and reinstalled. The shortcut was restored, and a user-data marker survived.
- Ran the same Electron GUI workflow against the **installed executable**; every check, including encrypted profile saving/loading, passed.
- Uninstalled and verified removal of the executable, both shortcuts and the uninstall registry entry. The user-data marker remained.

The GUI uses a synthetic in-memory bridge database for this workflow. It does not substitute for native engine/storage validation; that evidence belongs to the core/SDK repositories. A separate local Node.js 24.22.1 source run also passed 21 tests with the same three explicit fixture skips, and an unpacked Linux development build completed.

This installer is unsigned. Clean Windows 11 Home/Pro hardware and signing/reputation checks remain manual release checks; this record makes no claim that they ran on the CI server. No npm or website release is created by these tests.

## Earlier 0.2.0 evidence

The automatic connection adapter preserves the previous native SDK and engine byte for byte. The standalone SDK file appends the adapter; the npm package loads the original core through a separate bundled adapter. No native engine rebuild or database format migration is involved.

## Windows checks on 2026-10-24

- Console commit `d03a5898a976280833653117b9a071d6bd4097ef` passed [Windows test and portable build run 40123265157](https://github.com/MohammadAtikurRahman/BsonLite-Console/actions/runs/40123265157). The test suite passed 21 cases and skipped three real-server cases because that job does not supply their fixtures. It covers discovery, query policies, shared startup promise identity, conflicting Console settings and startup retries; the Electron portable EXE built on Windows.
- The SDK repository's [Windows run 40085137332](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/40085137332) packed and installed the preserved npm SDK in an isolated consumer. It ran the actual encrypted 4.0.28 Windows engine and verified automatic discovery, viewer connection read/write controls, CLI without a URL, BSON Long, CRUD/indexes, shutdown cleanup and Console opt-out. Both npm contents/import tests also passed. This is a connection-layer smoke test, not a Windows Electron UI automation result.
- The current core's [run 40123385230](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40123385230) passed all 10 final native SDK cases and all 18 earlier-format cases, including concurrent cache publication and the Console-wrapped shared `start()` contract.

The experimental modern SDK uses the existing app-link protocol. Source tests exercise its BSON 7/Console BSON 6 bridge. Full 9.0.4 native storage, migration, CLI and bundled-consumer checks are a separate gate in [the modern engine workflow](https://github.com/MohammadAtikurRahman/BsonLite/actions/workflows/modern-engine.yml); they were pending at the time of this earlier 0.2.0 record. A successful old-engine check does not validate a rebuilt engine. Published SDK/release artifacts remain separate from source changes in `main`.

## Earlier Linux and UI evidence

The original core/discovery/real-driver suite and the actual Electron workflow passed. npm distribution checks and CommonJS/ESM imports also passed. That recorded suite had **21 tests passed with 0 failures and 0 skipped; 2 additional npm checks passed** before the three shared-startup regression cases were added.

- SDK startup automatically announces a private local session; no helper package or startup code is used.
- Concurrent connect calls create one endpoint and retain safe access to the frozen Database object's private-field methods.
- Independent databases have separate entries; normal close and stop remove their own entries.
- Closed, stale, remote, malformed, permissive or dead-owner records are excluded from discovery.
- Console opt-out works; stopping during startup leaves no session behind.
- The compiled standalone SDK imports without starting a database. The npm distribution preserves core checksums, exact native source, CommonJS/ESM exports and licenses.
- The automatic flow is tested against a disposable real database through the compiled adapter, including authenticated mutual TLS and BSON Long values.
- The Electron workflow detects the database and fills the URL automatically before Connect; no manual URL paste or bridge installation is used in the test.

## Runtime scope

The earlier Linux/UI validation used Node.js 24.19.0, Electron 44.9.1, and the MongoDB 6.16.0 driver. The Ubuntu 24.04 build of the disposable test server crashed before startup in that container; the Ubuntu 22.04 build was used for the live-driver checks instead. This is separate from the actual native Windows smoke test above.

The earlier portable app built on Windows and remains unsigned. Its earlier results did not cover an installer; the 0.3.0 installer checks are recorded above. A manual GUI smoke test on a clean Windows Home/Pro PC and signing checks remain outside these CI results. Root Linux UI tests use a test-only no-sandbox launch; production renderer isolation and sandbox settings remain enabled.

## Reproduce

`npm test` runs core/discovery tests. Real-server checks require `BSONLITE_TEST_MONGOD`; the compiled-adapter test also uses `BSONLITE_ADDON_PATH`. UI checks use `npm run test:ui` with Playwright 1.62.1 and a desktop display. They use isolated temporary session records and synthetic documents, not the user's databases.

## First Windows smoke test

1. Replace the standalone SDK file or install the supplied npm SDK update. Start the existing app with its unchanged connection code.
2. Run the 0.3.0 setup once, then open **BsonLite Console** from the desktop or Start Menu. Verify the running database and visible prefilled URL appear automatically, and click Connect.
3. Open a collection, read a document and run `db.yourCollection.find({}).limit(1)`.
4. On a disposable test collection, enable writes in the viewer, then insert, edit and delete a document.
5. Close the viewer and confirm the owning app continues using its database. Stop the SDK normally and confirm the automatic entry disappears.
