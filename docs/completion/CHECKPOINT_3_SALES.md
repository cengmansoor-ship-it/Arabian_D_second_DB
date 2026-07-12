# Checkpoint 3 — Sales / Customers / Ledgers / Receipts / Installments

## Bugs fixed
1. **Nested-transaction bug causing sale creation to 500.** `postJournal`/`reverseJournal`
   always opened their own `sequelize.transaction()`, even when called from inside a caller's
   own transaction (no CLS namespace configured). Two independent transactions against the same
   SQLite connection caused sale creation to fail. Fixed by adding an optional `existingTransaction`
   parameter so callers can have posting join their transaction instead of opening a second one.
2. **Orphaned customer credit on receipt reversal.** `reverseSaleReceipt` never voided the
   `SaleCredit` row created by an overpayment, leaving a standing credit for money the customer no
   longer actually has after the receipt reverses. Fixed by adding `sourceReceiptId`/`voidedAt` to
   `SaleCredit` and voiding the matching credit inside the same reversal transaction.
3. **Stale balance recompute inside the reversal transaction.** `computeBalance()` queried
   `SaleReceipt` without passing the active transaction, so recomputing the sale balance
   immediately after voiding a receipt could read a pooled connection's pre-write snapshot and
   miss the just-voided receipt — leaving the sale stuck at `fully_paid` after a reversal that
   should have restored it to `active`. Fixed by threading the transaction through every
   `computeBalance` call site used mid-transaction.

## What "installments" means here
The brief's requirement is satisfied as **multiple sequential receipts against one sale's running
balance** (not a separate amortization-schedule table): each receipt records previousBalance,
receivedAmount, newBalance, currency, method, and creator; overpayment beyond the balance is
diverted to a `SaleCredit` instead of a negative balance; reversing a receipt restores the prior
balance and voids any credit it created.

## What was built
- Atomic `createSale`: validation, sale row, unit status transition, optional initial receipt,
  ledger + journal postings, and audit all inside one Sequelize transaction with all-or-nothing
  rollback.
- `addSaleReceipt` / `reverseSaleReceipt` in `lib/db-sequelize/src/sales-service.ts`, both fully
  atomic, both used by `POST /sales`, `POST /sales/:id/receipts`, `POST /sales/:id/receipts/:id/reverse`.
- New Sales frontend (previously API-only, no UI existed): `/sales` list with status filter and a
  create-sale modal (unit + party pickers, price/discount/currency, optional initial receipt), and
  `/sales/:id` detail page (balance, editable receipt list, add-receipt / reverse-receipt actions).
  Nav entry added to the sidebar.
- `GET /units` flat search endpoint (previously only reachable through the per-project unit map)
  to power the unit picker.

## Verification
- `pnpm --filter @workspace/db-sequelize run typecheck`, `pnpm run typecheck:libs`,
  `pnpm --filter @workspace/api-server run typecheck`, `pnpm --filter @workspace/web run typecheck`
  all pass.
- Two live Playwright runs against the running app: (1) sale creation with an initial receipt,
  rejected overpayment, accepted overpayment with credit, reversal restoring the correct balance,
  and a customer ledger cross-check; (2) a second sale isolating the reversal-recompute fix
  (fully paid → reversed → balance and status correctly restored to `active`/300000).
- `PRAGMA integrity_check` → `ok`. Journal debits (2,400,600) equal credits (2,400,600) after all
  test postings and their reversal — double-entry integrity holds.
- The two live-test sales (`SC-0001` on unit B5-605, `SC-0002` on unit B5-604) and their receipts
  were left in the database as real, balanced financial records rather than deleted — reversing or
  deleting posted financial transactions outside their own reversal flow would be a destructive
  action on ledger data, which the remediation brief calls to avoid. Their effect: units B5-604 and
  B5-605 are now `sold` instead of `available`; the residential structure (10 blocks / 60 floors /
  270 units) is otherwise unchanged.
