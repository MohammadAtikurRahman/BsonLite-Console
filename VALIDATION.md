# Validation — BsonLite Console 0.2.0

The automatic connection adapter preserves the previous native SDK and engine byte for byte. The standalone SDK file appends the adapter; the npm package loads the original core through a separate bundled adapter. No native engine rebuild or database format migration is involved.

## New checks

The core/discovery/real-driver suite and the actual Electron workflow passed. npm distribution checks and CommonJS/ESM imports also passed. **21 tests passed with 0 failures and 0 skipped; 2 additional npm checks passed.** Windows runtime checks remain pending.

- SDK startup automatically announces a private local session; no helper package or startup code is used.
- Concurrent connect calls create one endpoint and retain safe access to the frozen Database object's private-field methods.
- Independent databases have separate entries; normal close and stop remove their own entries.
- Closed, stale, remote, malformed, permissive or dead-owner records are excluded from discovery.
- Console opt-out works; stopping during startup leaves no session behind.
- The compiled standalone SDK imports without starting a database. The npm distribution preserves core checksums, exact native source, CommonJS/ESM exports and licenses.
- The automatic flow is tested against a disposable real database through the compiled adapter, including authenticated mutual TLS and BSON Long values.
- The Electron workflow detects the database and fills the URL automatically before Connect; no manual URL paste or bridge installation is used in the test.

## Runtime scope

Validation uses Node.js 24.19.0, Electron 44.9.1, and the MongoDB 6.16.0 driver on Linux. The Ubuntu 24.04 build of the disposable test server crashed before startup in this container; the Ubuntu 22.04 build is used for the live-driver checks instead. This is separate from the unchanged Windows-only BsonLite native engine.

The Windows app is cross-built and unsigned. The new discovery flow, Windows ACL behavior and the actual native BsonLite engine still need a Windows smoke test. Existing native-engine validation records belong to the preserved baseline; they do not certify this new Console adapter. Root Linux UI tests use a test-only no-sandbox launch; production renderer isolation and sandbox settings remain enabled.

## Reproduce

`npm test` runs core/discovery tests. Real-server checks require `BSONLITE_TEST_MONGOD`; the compiled-adapter test also uses `BSONLITE_ADDON_PATH`. UI checks use `npm run test:ui` with Playwright 1.62.1 and a desktop display. They use isolated temporary session records and synthetic documents, not the user's databases.

## First Windows smoke test

1. Replace the standalone SDK file or install the supplied npm SDK update. Start the existing app with its unchanged connection code.
2. Run the portable `.exe`, verify the running database and prefilled URL appear automatically, and click Connect.
3. Open a collection, read a document and run `db.yourCollection.find({}).limit(1)`.
4. On a disposable test collection, enable writes in the viewer, then insert, edit and delete a document.
5. Close the viewer and confirm the owning app continues using its database. Stop the SDK normally and confirm the automatic entry disappears.
