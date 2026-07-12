---
name: Multi-currency journal posting pattern
description: How to post a single business transaction that spans two currencies when the ledger enforces per-currency debit=credit balance.
---

If the ledger's posting helper enforces debit == credit **per currency code** (not just overall), a
transaction that swaps one currency for another (e.g. a currency-exchange/spot trade) cannot be posted
as a single balanced multi-currency journal entry — each currency's lines must independently balance.

**Why:** the posting helper's per-currency invariant is a hard constraint, not a business rule to work
around by relaxing validation.

**How to apply:** introduce a dedicated clearing account (e.g. "Exchange Clearing") used as the
counter-leg for both currencies: currency A debits Cash / credits Clearing, currency B debits Clearing /
credits Cash. Each currency's lines balance on their own, while tagging the same counterparty on both
legs preserves a coherent per-party ledger history across the "swap". Reusable for any two-currency
swap-style transaction, not just currency exchange specifically.
