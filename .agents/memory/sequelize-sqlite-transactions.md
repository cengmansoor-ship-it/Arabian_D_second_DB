---
name: Sequelize + SQLite nested transaction pitfalls
description: No CLS configured; shared posting helpers must accept an optional existing transaction, and every balance-recompute read must thread the active transaction or it can see stale pre-write data. Also covers a raw-migration column-naming pitfall.
---

## Transactions
No CLS (continuation-local storage) is configured for Sequelize in this project. Shared posting helpers must accept an optional existing transaction parameter and pass it through, rather than assuming an ambient transaction. Any balance-recompute read must thread the same active transaction, or it can see stale pre-write data (reads before the write commits).

**Why:** Without CLS, Sequelize does not auto-propagate a transaction to nested calls — omitting it silently breaks read-your-own-write consistency inside a posting flow.

**How to apply:** When adding new financial posting logic (journal entries, receipts, etc.), check that every DB call in the flow explicitly receives `{ transaction }` from the caller.

## Migration column naming
In this project's migrations (`lib/db-sequelize/src/migrations/`), raw `queryInterface.createTable`/`addColumn` calls must use the **same camelCase attribute names as the Sequelize model** (no `field: "snake_case"` mapping) — models here don't set `field`, so `queryInterface.createTable` with a `field` override creates a column Sequelize's own `addIndex`/model queries then can't find, throwing `SQLITE_ERROR: no such column`.

**Why:** Sequelize's raw `queryInterface.createTable` does not consistently honor a `field` override the way `Model.init` mapping does in this codebase's setup — mismatches only surface at runtime, not at build/typecheck time.

**How to apply:** Before writing a new migration, check `lib/db-sequelize/src/models/<Model>.ts` for the exact attribute name and mirror it as the raw column name in the migration.
