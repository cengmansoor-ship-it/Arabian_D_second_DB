---
name: Sequelize + SQLite nested transaction pitfalls
description: Two related bugs found and fixed in the ledger/sales posting code — relevant to any new module (rentals, purchases, payroll, etc.) that posts journal entries or recomputes a running balance inside a transaction.
---

Two distinct pitfalls, both from the same root cause: no CLS (continuation-local storage)
namespace is configured on the Sequelize instance, so nothing automatically propagates an active
transaction to nested calls or to non-transacted queries on a pooled connection.

1. **Nested transactions**: a shared posting helper (e.g. `postJournal`) must never call
   `sequelize.transaction()` internally if it can also be invoked from inside a caller's own
   transaction — that opens two independent transactions against SQLite and can fail/500. Fix
   pattern: give the shared helper an optional `existingTransaction` param; if present, run the
   helper's body inside it directly instead of opening a new one.

2. **Stale reads mid-transaction**: any read query used to recompute derived state (e.g. a running
   balance) that omits `{ transaction: t }` can, depending on pool routing, miss the current
   transaction's own uncommitted writes — so recomputing state right after a write in the same
   transaction can silently see pre-write data. Fix pattern: every helper that reads then decides
   something (recompute balance, check status, etc.) must accept and thread through the active
   transaction on every call site, not just the "write" call sites.

**Why this matters for future modules:** any new module with a running balance, multi-step atomic
creation (e.g. rentals with a deposit + first payment, purchases with supplier balance), or a
reversal/void flow that recomputes balance afterward is exposed to both bugs. Structure those
services the same way: one thin public function per transaction boundary, an internal function
that always takes `t: Transaction` and never opens its own, and every read used for a decision
inside that function passes `{ transaction: t }`.
