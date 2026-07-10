---
name: sqlite3 native build in this environment
description: How to get node-sqlite3 working in Replit's NixOS/pnpm sandbox without wasting time on node-gyp
---

`sqlite3` (TryGhost/node-sqlite3) ships prebuilt napi binaries fetched via `prebuild-install`. In this
environment that path just works (downloads from GitHub releases, no compiler needed).

**Why this matters:** the `install` script tries `prebuild-install -r napi || node-gyp rebuild`. If the
prebuild step is skipped or fails silently, it falls through to `node-gyp rebuild`, which fails here because
Python 3.12 (the only python3 available via `installSystemDependencies`) removed `distutils`, which
node-gyp's bundled gyp still imports. There is no system pip either, so patching distutils in is not
straightforward.

**How to apply:** if `sqlite3` native binding is missing (`Could not locate the bindings file`), re-run
prebuild-install directly instead of debugging node-gyp/python:

```
cd node_modules/.pnpm/sqlite3@<version>/node_modules/sqlite3
node_modules/.bin/prebuild-install -r napi
```

Also remember: a dependency that's only pulled in transitively (e.g. through an internal workspace package)
won't get a symlink in a pnpm workspace package's own `node_modules` unless it's also a direct dependency of
that package — needed when esbuild's `external` list forces a runtime `require`/`import` of it.
