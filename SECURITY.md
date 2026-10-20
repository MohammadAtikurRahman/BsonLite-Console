# Report a security issue

Email **info@bsonlite.com** with the affected version, impact and an example using synthetic data. Do not post live connection URLs, access tokens, private keys, customer records or session files in public issues or Discord.

The renderer is sandboxed and isolated from Node.js. Connections stay in the main process and start read-only. Enabling writes can change/delete data. Queries use a restricted database-expression interpreter, not arbitrary JavaScript.

Automatic SDK access uses authenticated loopback HTTP and private per-user session records. Tools under the same OS account can use them; treat that account as trusted. Disable discovery with `BSONLITE_CONSOLE=0` or the SDK's `console: false` option when required.

The native SDK engine is a separate component with its own compatibility, maintenance and encryption model. A Console release does not change or certify that engine.
