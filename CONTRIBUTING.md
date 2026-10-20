# Contribute

Bug reports, documentation improvements and pull requests are welcome.

- GUI, terminal commands, connections and discovery: use this repository.
- Core SDK, storage and engine integration: [BsonLite](https://github.com/MohammadAtikurRahman/BsonLite).
- npm exports, packaging and publishing documentation: [Bsonlite-SDK](https://github.com/MohammadAtikurRahman/Bsonlite-SDK).

Read `BUILDING.md`, run `npm ci` and `npm test`. Explain the problem, resulting behavior and relevant validation. Check GUI changes with `npm run test:ui`; Windows discovery changes also need the smoke test in `VALIDATION.md`.

Use disposable databases. Keep executables, dependencies, database folders, credentials, certificates and session records out of Git. Preserve read-only defaults, loopback SDK access, renderer isolation and certificate verification.

Join [Discord](https://discord.gg/vSRMRPYqs) for help. Report vulnerabilities privately as described in `SECURITY.md`.
