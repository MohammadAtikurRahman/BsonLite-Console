# Validation — BsonLite Console 0.2.0

The automatic connection adapter preserves the previous native SDK and engine byte for byte. The standalone SDK file appends the adapter; the npm package loads the original core through a separate bundled adapter. No native engine rebuild or database format migration is involved.

## Windows checks on 2026-10-24

- Console commit `d03a5898a976280833653117b9a071d6bd4097ef` passed [Windows test and portable build run 40123265157](https://github.com/MohammadAtikurRahman/BsonLite-Console/actions/runs/40123265157). The test suite passed 21 cases and skipped three real-server cases because that job does not supply their fixtures. It covers discovery, query policies, shared startup promise identity, conflicting Console settings and startup retries; the Electron portable EXE built on Windows.
- The SDK repository's [Windows run 40085137332](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/40085137332) packed and installed the preserved npm SDK in an isolated consumer. It ran the actual encrypted 4.0.28 Windows engine and verified automatic discovery, viewer connection read/write controls, CLI without a URL, BSON Long, CRUD/indexes, shutdown cleanup and Console opt-out. Both npm contents/import tests also passed. This is a connection-layer smoke test, not a Windows Electron UI automation result.
- The current core's [run 40123385230](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40123385230) passed all 10 final native SDK cases and all 18 earlier-format cases, including concurrent cache publication and the Console-wrapped shared `start()` contract.

The experimental modern SDK uses the existing app-link protocol. Source tests exercise its BSON 7/Console BSON 6 bridge. Full 9.0.4 native storage, migration, CLI and bundled-consumer checks are a separate gate in [the modern engine workflow](https://github.com/MohammadAtikurRahman/BsonLite/actions/workflows/modern-engine.yml); they were pending when this record was updated. A successful old-engine check does not validate a rebuilt engine. Published SDK/release artifacts remain separate from source changes in `main`.

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

The latest portable app built on Windows and remains unsigned. A manual GUI smoke test on a clean Windows Home/Pro PC and installer/signing checks remain outside these CI results. Root Linux UI tests use a test-only no-sandbox launch; production renderer isolation and sandbox settings remain enabled.

## Reproduce

`npm test` runs core/discovery tests. Real-server checks require `BSONLITE_TEST_MONGOD`; the compiled-adapter test also uses `BSONLITE_ADDON_PATH`. UI checks use `npm run test:ui` with Playwright 1.62.1 and a desktop display. They use isolated temporary session records and synthetic documents, not the user's databases.

## First Windows smoke test

1. Replace the standalone SDK file or install the supplied npm SDK update. Start the existing app with its unchanged connection code.
2. Run the portable `.exe`, verify the running database and prefilled URL appear automatically, and click Connect.
3. Open a collection, read a document and run `db.yourCollection.find({}).limit(1)`.
4. On a disposable test collection, enable writes in the viewer, then insert, edit and delete a document.
5. Close the viewer and confirm the owning app continues using its database. Stop the SDK normally and confirm the automatic entry disappears.
