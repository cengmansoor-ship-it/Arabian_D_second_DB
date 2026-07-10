# REQUIREMENTS TRACEABILITY MATRIX
## Arabian D Residence — Real Estate Management System

**Last updated:** 2026-07-10  
**Status:** Pre-implementation (Phase 0 complete)  
**Source of Truth:** `01_MASTER_PROMPT/REPLIT_MASTER_PROMPT_ARABIAN_D.md`  
**Supporting Documents:** `03_REQUIREMENTS/*`, `04_REFERENCE_BLOCKS/*`

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and tested |
| 🔧 | In progress |
| ⬜ | Not yet started |
| ❌ | Blocked / requires decision |

---

## 1. AUTHENTICATION & USER MANAGEMENT (Master Prompt §7)

| Req ID | Requirement | Source | DB Tables | API Endpoints | Frontend Pages | Tests | Status |
|--------|-------------|--------|-----------|---------------|----------------|-------|--------|
| AUTH-01 | Login form with username/password, person icon, lock icon | §7, System-Req-PDF | `users` | `POST /api/v1/auth/login` | `/login` | T-01 | ⬜ |
| AUTH-02 | Show/hide password toggle | §7, System-Req-PDF | — | — | `/login` | — | ⬜ |
| AUTH-03 | After 3 failed attempts, lock account for configurable period (default 15 min) | §7, System-Req-PDF | `users.failed_login_count`, `users.locked_until` | — | `/login` | T-01 | ⬜ |
| AUTH-04 | Forgot password workflow | §7 | `password_reset_tokens` | `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` | `/forgot-password`, `/reset-password` | T-02 | ⬜ |
| AUTH-05 | Password change screen | §7 | `users` | `PUT /api/v1/auth/change-password` | `/settings/password` | — | ⬜ |
| AUTH-06 | Session logout | §7 | `sessions` (if session-based) | `POST /api/v1/auth/logout` | All pages | — | ⬜ |
| AUTH-07 | User status: active, disabled, locked | §7 | `users.status` | `PUT /api/v1/users/:id/status` | `/settings/users` | — | ⬜ |
| AUTH-08 | Last login timestamp | §7 | `users.last_login_at` | — | `/settings/users` | — | ⬜ |
| AUTH-09 | Failed login counter | §7 | `users.failed_login_count` | — | — | T-01 | ⬜ |
| AUTH-10 | Audit login/security events | §7, §28 | `audit_logs` | — | `/settings/audit` | — | ⬜ |
| AUTH-11 | Super Admin unlock command (offline recovery) | §7 | `users` | CLI command | — | — | ⬜ |
| AUTH-12 | Password hashing (Argon2 or bcrypt) | §7 | `users.password_hash` | — | — | — | ⬜ |
| AUTH-13 | Secure JWT / session cookies + CSRF | §7 | — | Auth middleware | — | — | ⬜ |
| AUTH-14 | Rate limiting on auth endpoints | §7 | — | Express rate-limit middleware | — | — | ⬜ |
| AUTH-15 | No default production password | §7 | — | First-run script | — | — | ⬜ |

### Roles and Permissions

| Req ID | Role | Permissions | Status |
|--------|------|-------------|--------|
| ROLE-01 | Super Admin | All permissions including unlock user, hard-delete draft | ⬜ |
| ROLE-02 | Admin | Project, sales, rentals, reports, settings (no user management) | ⬜ |
| ROLE-03 | Accountant | Create receipts, view/print reports, journal | ⬜ |
| ROLE-04 | Project Manager | Project layout management, unit map | ⬜ |
| ROLE-05 | Sales Manager | Customer management, sales, receipts | ⬜ |
| ROLE-06 | Rental Manager | Tenant management, rental contracts, rent receipts | ⬜ |
| ROLE-07 | Purchase/Inventory Officer | Purchases, inventory, supplier ledger, returns | ⬜ |
| ROLE-08 | HR/Attendance Officer | Employee records, attendance, wage posting | ⬜ |
| ROLE-09 | Viewer/Auditor | Read-only access to reports, audit log | ⬜ |

**Granular permission verbs:** view, create, update, post, approve, receive/payment, void/reverse, hard-delete draft, export, print, backup, restore, unlock-user, manage-settings.

---

## 2. WELCOME/SPLASH SCREEN (Master Prompt §8)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| WELC-01 | Welcome page shown 3 seconds after login | §8, System-Req-PDF | `settings` | — | `/welcome` | — | ⬜ |
| WELC-02 | Skip with Enter key or Continue button | §8 | — | — | `/welcome` | — | ⬜ |
| WELC-03 | Show company logo and name | §8 | `settings` | `GET /api/v1/settings/company` | `/welcome` | — | ⬜ |
| WELC-04 | Configurable Pashto and English slogans | §8 | `settings.welcome_slogans` | — | `/welcome`, `/settings/branding` | — | ⬜ |
| WELC-05 | Welcome screen can be disabled from Settings | §8 | `settings.welcome_enabled` | — | `/settings/branding` | — | ⬜ |

---

## 3. COMPANY SETUP & SETTINGS (Master Prompt §11)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| SET-01 | First-run setup wizard (18 fields) | §11 | `settings`, `users` | `POST /api/v1/setup/init` | `/setup` | — | ⬜ |
| SET-02 | Company profile (logo, name, phones, email, website, Facebook) | §11 | `settings` | `GET/PUT /api/v1/settings/company` | `/settings/company` | — | ⬜ |
| SET-03 | Currencies configuration (AFN, USD, PKR + additional) | §10, §11 | `currencies` | `GET/POST/PUT /api/v1/currencies` | `/settings/currencies` | T-25 | ⬜ |
| SET-04 | Document number sequences with company prefix | §11 | `document_sequences` | `GET/PUT /api/v1/settings/sequences` | `/settings/sequences` | — | ⬜ |
| SET-05 | Fiscal year configuration | §11 | `fiscal_periods` | `GET/POST /api/v1/fiscal-periods` | `/settings/fiscal` | — | ⬜ |
| SET-06 | Backup folder path | §11, §29 | `settings` | — | `/settings/backup` | — | ⬜ |
| SET-07 | Default print paper sizes (A4 / half-A4) | §11, §26 | `settings` | — | `/settings/printing` | — | ⬜ |
| SET-08 | Attendance/workweek policy | §11, §21 | `settings` | — | `/settings/hr` | — | ⬜ |
| SET-09 | Rental proration policy (30-day or actual-days) | §11, §20 | `settings` | — | `/settings/rental` | — | ⬜ |
| SET-10 | Exchange-rate policy (manual or auto) | §11 | `settings` | — | `/settings/finance` | — | ⬜ |
| SET-11 | Audit viewer (read-only) | §11, §28 | `audit_logs` | `GET /api/v1/audit-logs` | `/settings/audit` | — | ⬜ |

---

## 4. CENTRAL ACCOUNTING & POSTING ENGINE (Master Prompt §9)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| ACCT-01 | Central journal — accounts, journal_transactions, journal_lines | §9 | `accounts`, `journal_transactions`, `journal_lines`, `posting_links` | — (internal engine) | — | T-20 | ⬜ |
| ACCT-02 | Cash accounts table | §9 | `cash_accounts` | `GET/POST /api/v1/cash-accounts` | `/settings/cash-accounts` | — | ⬜ |
| ACCT-03 | Debit must equal credit per transaction and currency | §9 | — | — | — | T-25, T-20 | ⬜ |
| ACCT-04 | Source transaction posted only once (unique constraint) | §9 | `posting_links.unique(source_module, source_id, posting_type)` | — | — | T-21 | ⬜ |
| ACCT-05 | UUID/idempotency key per posting | §9 | `journal_transactions.idempotency_key` | Idempotency header middleware | — | T-21 | ⬜ |
| ACCT-06 | طلب/Receivable vs پور/Payable — directional clarity | §9 | `journal_lines.direction` | — | All ledger pages | — | ⬜ |
| ACCT-07 | Color: green=received, red=outstanding/debt, black=sale info | §9, System-Req-PDF | — | — | All ledger/receipt pages | — | ⬜ |
| ACCT-08 | Void/Reverse with reason, timestamp, user, reversal transaction | §9 | `journal_transactions.voided_at`, `reversal_of` | `POST /api/v1/journal/:id/reverse` | All financial pages | T-13, T-29 | ⬜ |
| ACCT-09 | Duplicate protection: client UUID + idempotency + DB constraint + disabled button | §9 | — | Idempotency middleware | All forms | T-21 | ⬜ |
| ACCT-10 | Fiscal periods table | §9 | `fiscal_periods` | `GET /api/v1/fiscal-periods` | — | — | ⬜ |
| ACCT-11 | Document sequences table | §9 | `document_sequences` | — | — | — | ⬜ |
| ACCT-12 | No floating-point money (DECIMAL 20,4; use decimal.js) | §6 of principles, §9 | All money columns | — | — | — | ⬜ |

---

## 5. MULTI-CURRENCY (Master Prompt §10)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| CUR-01 | Separate ledger per currency (AFN, USD, PKR) | §10, System-Req-PDF | `currencies`, money fields have `currency_id` | — | All ledger pages | T-25 | ⬜ |
| CUR-02 | Never add AFN+USD+PKR into one total | §10 | — | — | Reports | T-25 | ⬜ |
| CUR-03 | Exchange rates stored with date, source, user | §10 | `exchange_rates` | `POST /api/v1/exchange-rates` | `/exchange/rates` | T-26 | ⬜ |
| CUR-04 | Receipt cannot apply to invoice in another currency without explicit exchange | §10 | — | Service validation | — | — | ⬜ |
| CUR-05 | Converted report requires explicit rate and shows that rate | §10 | — | `GET /api/v1/reports/*?base_currency=&rate=` | Reports | — | ⬜ |

---

## 6. DYNAMIC PROJECT & PROPERTY LAYOUT (Master Prompt §12)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| PROJ-01 | Project entity with status (Draft/Active/On Hold/Completed/Archived) | §12, Pasted-57.txt | `projects` | `GET/POST/PUT /api/v1/projects` | `/projects` | — | ⬜ |
| PROJ-02 | Layout version (Draft/Published/Archived) — sales use only published | §12 | `project_layout_versions` | `GET/POST/PUT /api/v1/layout-versions` | `/projects/:id/layout` | T-03, T-04 | ⬜ |
| PROJ-03 | Block entity (name, code, order, floors, notes) | §12, Block-PDFs | `blocks` | `GET/POST/PUT /api/v1/blocks` | `/projects/:id/blocks` | — | ⬜ |
| PROJ-04 | Floor entity (block, level number, floor type, order) | §12, Block-PDFs | `floors` | `GET/POST/PUT /api/v1/floors` | `/projects/:id/blocks/:blockId/floors` | — | ⬜ |
| PROJ-05 | Floor types: basement, ground, mezzanine, residential, commercial, parking, roof, other | §12 | `floors.floor_type` enum | — | Floor form | — | ⬜ |
| PROJ-06 | Unit entity (all fields) with status and purpose | §12, Pasted-57.txt, Sales-Ledger-PDF | `units` | `GET/POST/PUT /api/v1/units` | `/projects/:id/unit-map` | T-07, T-08 | ⬜ |
| PROJ-07 | Unit status: Draft, Available, Reserved, Sold, Rented, Blocked, Cancelled, Inactive | §12 | `units.status` | — | Unit map | — | ⬜ |
| PROJ-08 | Unit purpose: For Sale / For Rent / Both / Not Available | §12, Shops-PDF | `units.purpose` | — | Unit form | — | ⬜ |
| PROJ-09 | Unit types dynamic master list (Apartment, Shop, Parking, Restaurant, Clinic, Supermarket, Mosque, Office, Storage, Other, Other Commercial) | §12 | `unit_types` | `GET/POST /api/v1/unit-types` | `/settings/unit-types` | — | ⬜ |
| PROJ-10 | Multi-level commercial units (`unit_parts`) — one legal unit occupies multiple floors | §12, System-Req-PDF | `unit_parts` | `GET/POST /api/v1/units/:id/parts` | Unit form | T-06 | ⬜ |
| PROJ-11 | Visual unit map: project→block→floor→unit cards with status colors + click-through | §12 | — | — | `/projects/:id/unit-map` | T-31 | ⬜ |
| PROJ-12 | Layout generation wizard (bulk-generate floors and units with numbering rules) | §12 | — | `POST /api/v1/layout-versions/:id/generate` | `/projects/:id/layout/generate` | T-05 | ⬜ |
| PROJ-13 | Published unit with transaction cannot be structurally deleted | §12 | DB constraint / service guard | — | — | T-04 | ⬜ |
| PROJ-14 | 15 total levels per block, ground = commercial, 14 residential × 13 units = 182 | §2 (provisional) | — | — | Setup wizard | T-05 | ⬜ |
| PROJ-15 | Separate block group/section (A, B, Phase 1, Phase 2, etc.) | §12 | `block_groups` | `GET/POST /api/v1/block-groups` | `/projects/:id/layout` | — | ⬜ |
| PROJ-16 | Reference example only: 10 blocks (A1-A5, B1-B5), 60 floors, 270 apartments (do NOT hardcode) | Block-PDFs, Project-PDF | — | — | — | — | ⬜ |
| PROJ-17 | Configurable unit numbering format, e.g. ADR-A1-03-012 | §12 | `document_sequences` | — | Setup wizard | — | ⬜ |

---

## 7. PARTY & CUSTOMER MASTER (Master Prompt §13)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| PARTY-01 | Shared parties master (one identity, multiple roles) | §13, System-Req-PDF | `parties`, `party_roles` | `GET/POST/PUT /api/v1/parties` | `/parties` | — | ⬜ |
| PARTY-02 | Party types: Individual/Market Customer, Supplier, Sales Customer, Tenant, Exchange Dealer, Employee, Partner/Investor, Other | §13 | `parties.type` | — | Party form | — | ⬜ |
| PARTY-03 | Fields: name, father name, grandfather name, Tazkira, tax/reg number, phones, address, notes, photo, documents | §13, Sales-Ledger-PDF | `parties` | — | Party form | — | ⬜ |
| PARTY-04 | Fast search and duplicate identity warning | §13 | Index on name/tazkira | `GET /api/v1/parties?q=` | Party list | — | ⬜ |
| PARTY-05 | Separate ledger per currency per party | §13 | `journal_lines` filtered by party+currency | `GET /api/v1/parties/:id/ledger?currency=` | Party ledger | T-25 | ⬜ |
| PARTY-06 | Opening ledger with debt shows 5-second warning with طلب/پور label | §13, System-Req-PDF | — | — | Party ledger | — | ⬜ |
| PARTY-07 | Party ledger printable with company header/footer, Jalali and Gregorian dates | §13 | — | — | Party ledger print | — | ⬜ |
| PARTY-08 | Full activity timeline per party | §13 | `journal_lines`, `sales`, `rental_contracts`, etc. | `GET /api/v1/parties/:id/activity` | Party detail | — | ⬜ |

---

## 8. DAILY JOURNAL / ROZNAMCHA (Master Prompt §14)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| JOUR-01 | Two views: Money In (راغلي پیسې) and Money Out (تللي پیسې) | §14, System-Req-PDF | `journal_transactions` | `GET /api/v1/journal?date=&direction=` | `/journal` | — | ⬜ |
| JOUR-02 | Auto-populated from all financial modules | §14 | `posting_links` | — | — | T-20 | ⬜ |
| JOUR-03 | Opens on today's Jalali date; next-day auto-advance | §14 | — | — | `/journal` | — | ⬜ |
| JOUR-04 | Totals by currency and direction at bottom | §14, System-Req-PDF | — | — | `/journal` | — | ⬜ |
| JOUR-05 | Date navigation, search, filters | §14 | — | `GET /api/v1/journal` with filters | `/journal` | — | ⬜ |
| JOUR-06 | Edit draft / reverse posted item | §14 | — | `PUT`, `POST .../reverse` | `/journal` | T-08, T-29 | ⬜ |
| JOUR-07 | Print/PDF/Excel with company header/footer | §14, System-Req-PDF | — | `GET /api/v1/journal/export` | `/journal` | T-31 | ⬜ |
| JOUR-08 | Permission-controlled manual journal entry | §14 | `journal_transactions.is_manual` | `POST /api/v1/journal/manual` | `/journal/new` | T-29 | ⬜ |
| JOUR-09 | Three currency totals: AFN, USD, PKR | §14, System-Req-PDF | — | — | `/journal` | T-25 | ⬜ |

---

## 9. EXPENSE MANAGEMENT (Master Prompt §15)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| EXP-01 | Dynamic expense categories | §15, System-Req-PDF | `expense_categories` | `GET/POST /api/v1/expense-categories` | `/settings/expense-categories` | — | ⬜ |
| EXP-02 | Expense fields: number, category, project (optional), party (optional), description, amount, currency, date, payment method, attachment | §15 | `expenses` | `GET/POST/PUT /api/v1/expenses` | `/expenses` | — | ⬜ |
| EXP-03 | Approval status for expenses | §15 | `expenses.approval_status` | `PUT /api/v1/expenses/:id/approve` | `/expenses` | — | ⬜ |
| EXP-04 | Category ledger, date-range, combined-category, project-filter reports | §15, System-Req-PDF | — | `GET /api/v1/reports/expenses` | `/reports/expenses` | — | ⬜ |
| EXP-05 | Automatic Money Out posting to journal | §15 | `posting_links` | — | — | T-20 | ⬜ |
| EXP-06 | Expense posted only once | §15 | `posting_links` unique constraint | — | — | T-20 | ⬜ |

---

## 10. MATERIAL PURCHASES, SUPPLIER LEDGERS, INVENTORY & RETURNS (Master Prompt §16)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| PUR-01 | Item master with categories, units, spec | §16, Purchase-Ledger-PDF | `items`, `item_units` | `GET/POST/PUT /api/v1/items` | `/inventory/items` | — | ⬜ |
| PUR-02 | Multiple unit types: piece, brick, kg, ton, meter, m², m³, truck, parcel, bundle, bag, liter, custom | §16, Purchase-Ledger-PDF | `unit_of_measure` | — | Item form | — | ⬜ |
| PUR-03 | Purchase with multi-line items (quantity, unit, price, total) | §16, Purchase-Ledger-PDF | `purchases`, `purchase_lines` | `GET/POST/PUT /api/v1/purchases` | `/purchases/new` | T-16 | ⬜ |
| PUR-04 | Supplier ledger auto-update on purchase | §16, Purchase-Ledger-PDF | `journal_lines` | — | `/suppliers/:id/ledger` | T-19 | ⬜ |
| PUR-05 | Supplier ledger columns: serial, date, description, bill number, quantity/unit, unit price, total, payment, balance | §16, Purchase-Ledger-PDF | — | `GET /api/v1/parties/:id/supplier-ledger` | `/suppliers/:id/ledger` | T-19 | ⬜ |
| PUR-06 | Supplier ledger footer: total purchased, total paid, outstanding, item totals by unit | §16, Purchase-Ledger-PDF | — | — | `/suppliers/:id/ledger` | — | ⬜ |
| PUR-07 | Inventory increases on purchase received | §16 | `inventory_stock` | — | — | T-16 | ⬜ |
| PUR-08 | Paid cash → Money Out posting; unpaid → payable | §16 | `journal_lines`, `cash_accounts` | — | — | — | ⬜ |
| PUR-09 | Purchase return: select original purchase, select lines, enter returned quantity | §16, System-Req-PDF | `purchase_returns`, `purchase_return_lines` | `GET/POST /api/v1/purchase-returns` | `/purchases/:id/return` | T-17, T-18 | ⬜ |
| PUR-10 | Return quantity cannot exceed available (received − previous returns) | §16 | Service validation | — | — | T-18 | ⬜ |
| PUR-11 | Purchase return auto-generates return bill with sequential company-prefix number | §16, System-Req-PDF | `document_sequences` | — | Return bill print | — | ⬜ |
| PUR-12 | Return decreases stock, decreases supplier payable or creates supplier receivable | §16 | `inventory_stock`, `journal_lines` | — | — | T-17 | ⬜ |
| PUR-13 | Do not sum incompatible units without conversion | §16 | — | Service validation | Reports | — | ⬜ |

---

## 11. EXCHANGE DEALER / SARAFI MODULE (Master Prompt §17)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| EXC-01 | Exchange dealer registration (name, business name, market, shop no., phone, documents) | §17 | `exchange_dealers` (subset of `parties`) | `GET/POST/PUT /api/v1/exchange-dealers` | `/exchange/dealers` | — | ⬜ |
| EXC-02 | Separate AFN/USD/PKR ledger per dealer | §17, System-Req-PDF | `journal_lines` | `GET /api/v1/exchange-dealers/:id/ledger?currency=` | `/exchange/dealers/:id/ledger` | T-25 | ⬜ |
| EXC-03 | Transaction types: give to dealer, receive from dealer, investor/customer payment via dealer, currency exchange, fee/commission | §17 | `exchange_transactions` | `POST /api/v1/exchange-transactions` | `/exchange/new` | T-26 | ⬜ |
| EXC-04 | Currency exchange creates two balanced currency legs | §17 | `journal_lines` (two rows) | — | — | T-26 | ⬜ |
| EXC-05 | Exchange reports: per dealer, per currency, balances, date range | §17 | — | `GET /api/v1/reports/exchange` | `/reports/exchange` | — | ⬜ |

---

## 12. SALES MODULE (Master Prompt §18)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| SALE-01 | Sale fields: number, contract number, project, layout version, block, floor, unit, type, room count, price, discount, final price, currency, date, payment type | §18, Sales-Ledger-PDF, Pasted-57.txt | `sales` | `GET/POST /api/v1/sales` | `/sales/new` | T-07 | ⬜ |
| SALE-02 | Sale status: Draft, Reserved, Active, Fully Paid, Cancelled, Reversed | §18 | `sales.status` | — | Sales list | — | ⬜ |
| SALE-03 | Sale creation DB transaction (validate, lock, prevent duplicate, post, set status, generate number) | §18 | All related tables | `POST /api/v1/sales` | — | T-07 | ⬜ |
| SALE-04 | Sold unit cannot be sold again | §18 | `units.status` constraint | — | — | T-07 | ⬜ |
| SALE-05 | Sold unit cannot be rented | §18, §19 | Service validation | — | — | T-08 | ⬜ |
| SALE-06 | Sale receipt fields: number, sale, date, amount, currency, method, cash account, reference, note, received_by | §18 | `sale_receipts` | `POST /api/v1/sales/:id/receipts` | `/sales/:id/receipts/new` | T-10 | ⬜ |
| SALE-07 | Remaining balance = final price − valid posted receipts (calculated, not manual) | §18 | — | `GET /api/v1/sales/:id` | Sales detail | T-10 | ⬜ |
| SALE-08 | Prevent overpayment unless Admin confirms; overpayment → customer credit | §18 | `sale_credits` | Service + `POST /api/v1/sales/:id/receipts` | Receipt form | T-11, T-12 | ⬜ |
| SALE-09 | Sale becomes Fully Paid when balance = 0 | §18 | `sales.status` | — | — | T-10 | ⬜ |
| SALE-10 | Every receipt → Money In posting + journal entry | §18 | `journal_transactions`, `posting_links` | — | — | T-20 | ⬜ |
| SALE-11 | Reversal recalculates balance and status | §18 | — | `POST /api/v1/sales/:id/receipts/:rid/reverse` | — | T-13 | ⬜ |
| SALE-12 | Sales customer ledger with running balance | §18, Sales-Ledger-PDF | — | `GET /api/v1/sales/:id/ledger` | `/sales/:id/ledger` | — | ⬜ |
| SALE-13 | Sale documents: contract, first-payment receipt, installment receipt, half-A4 receipt, A4 customer ledger, cancellation doc | §18 | — | `GET /api/v1/sales/:id/print/*` | Print pages | T-31 | ⬜ |
| SALE-14 | Print header: logo, company name, slogans, phone, email, website, address | §18, Sales-Ledger-PDF | `settings` | — | All print pages | — | ⬜ |

---

## 13. SHOPS & COMMERCIAL UNITS (Master Prompt §19)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| SHOP-01 | Shop purpose configurable: For Sale / For Rent / Both / Not Available | §19, Shops-PDF | `units.purpose` | — | Unit form | — | ⬜ |
| SHOP-02 | Sold shop not available for rental; rented shop not available for sale | §19, Shops-PDF | Service validation | — | — | T-07, T-08 | ⬜ |
| SHOP-03 | Reserved shop cannot be rented or sold to another party | §19 | Service validation | — | — | — | ⬜ |
| SHOP-04 | Multi-level shop parts move together with legal unit | §19 | `unit_parts` cascade | — | — | T-06 | ⬜ |
| SHOP-05 | Reports show legal unit status, not each level separately | §19 | — | `GET /api/v1/reports/shops` | `/reports/shops` | — | ⬜ |
| SHOP-06 | Dedicated Shops & Commercial Units menu, linked to Project/Sales/Rental | §19 | — | — | `/shops` | — | ⬜ |
| SHOP-07 | Shop ledger: customer name, block, floor, unit, sale date, price, receipts, balance | §19, Shops-PDF | — | `GET /api/v1/shops/:id/ledger` | `/shops/:id/ledger` | — | ⬜ |

---

## 14. RENTAL MODULE (Master Prompt §20)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| RENT-01 | Rental contract fields: number, project, block, floor, unit, monthly rent, currency, daily-rate policy, start date, expected end date, actual end date, deposit, status | §20, Rental-Ledger-from-Shops-PDF | `rental_contracts` | `GET/POST/PUT /api/v1/rental-contracts` | `/rentals/new` | T-09 | ⬜ |
| RENT-02 | No overlapping active rental for same unit + period | §20 | DB constraint + service | — | — | T-09 | ⬜ |
| RENT-03 | Configurable proration policy (30-day or actual calendar) | §20, Shops-PDF | `settings.rental_proration` | — | `/settings/rental` | — | ⬜ |
| RENT-04 | Rental schedule auto-generated: period label, dates, days, rent due, due date, paid, remaining, status | §20 | `rental_periods` | `GET /api/v1/rental-contracts/:id/schedule` | `/rentals/:id/schedule` | T-14 | ⬜ |
| RENT-05 | Rent payment allocated to exact period(s); default oldest-first | §20, Shops-PDF | `rental_payments`, `rental_period_allocations` | `POST /api/v1/rental-contracts/:id/payments` | `/rentals/:id/payments/new` | T-14 | ⬜ |
| RENT-06 | Payment shows which month it applies to | §20, Shops-PDF | — | — | Rental ledger | — | ⬜ |
| RENT-07 | Early contract termination: calculate days/months/payable/paid/balance per policy | §20, Shops-PDF | — | `POST /api/v1/rental-contracts/:id/end` | `/rentals/:id/end` | T-15 | ⬜ |
| RENT-08 | Security deposit settlement on contract end | §20 | `rental_contracts.deposit_settlement` | — | Contract-end form | — | ⬜ |
| RENT-09 | Unit released to Available only if not sold/blocked/reserved | §20 | Service validation | — | — | T-15 | ⬜ |
| RENT-10 | Rental payment → Money In posting + journal | §20 | `posting_links` | — | — | — | ⬜ |
| RENT-11 | Rental reports: active tenants, expected/received/outstanding, late, advance credits, expired/ending-soon | §20 | — | `GET /api/v1/reports/rental` | `/reports/rental` | — | ⬜ |

---

## 15. EMPLOYEE, ATTENDANCE, WAGE & LEDGER (Master Prompt §21)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| EMP-01 | Employee with auto ID (`ADR-EMP-0001`), fields, photo, documents | §21 | `employees` | `GET/POST/PUT /api/v1/employees` | `/hr/employees` | — | ⬜ |
| EMP-02 | Pay mode: daily wage or monthly salary | §21 | `employees.pay_mode` | — | Employee form | — | ⬜ |
| EMP-03 | Employment periods (rehire without losing history) | §21 | `employment_periods` | — | Employee detail | — | ⬜ |
| EMP-04 | Attendance: daily, Present/Absent/Leave/Holiday, opens on current Jalali date | §21, System-Req-PDF | `attendance_records` | `GET/POST /api/v1/attendance` | `/hr/attendance` | T-22 | ⬜ |
| EMP-05 | Prevent duplicate attendance for employee/date | §21 | DB unique(employee_id, date) | — | — | T-22 | ⬜ |
| EMP-06 | Absent daily-wage employee earns zero (not negative) | §21 | — | Wage calculation service | — | T-23 | ⬜ |
| EMP-07 | Friday attendance can be entered on Saturday (configurable) | §21, System-Req-PDF | `settings.friday_backfill` | — | `/settings/hr` | — | ⬜ |
| EMP-08 | Bulk attendance screen | §21 | — | — | `/hr/attendance/bulk` | — | ⬜ |
| EMP-09 | Employee ledger: wage earned, payment to employee, repayment from employee, advance, adjustment, opening balance | §21 | `employee_transactions` | `GET /api/v1/employees/:id/ledger` | `/hr/employees/:id/ledger` | T-24 | ⬜ |
| EMP-10 | Employee overpayment → employee debt (`طلب` from company view), red warning | §21 | — | — | Employee ledger | T-24 | ⬜ |
| EMP-11 | Monthly closing: carry forward balance only | §21 | `employee_month_closings` | `POST /api/v1/employees/:id/close-month` | — | — | ⬜ |
| EMP-12 | Employee ledger print/PDF/Excel | §21 | — | `GET /api/v1/employees/:id/ledger/export` | — | — | ⬜ |

---

## 16. PARTNER / INVESTOR / HAJI MODULE (Master Prompt §22)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| PART-01 | Partner master: party, project, contribution type, value, currency, ownership %, profit split %, loss split % | §22 | `partners` | `GET/POST/PUT /api/v1/partners` | `/partners` | T-27 | ⬜ |
| PART-02 | Total active distribution % must equal 100% for calculation set | §22 | Service validation | — | — | T-27 | ⬜ |
| PART-03 | Partner transactions: contribution, additional contribution, withdrawal, distribution paid, personal expense, reimbursement, adjustment | §22 | `partner_transactions` | `POST /api/v1/partners/:id/transactions` | `/partners/:id` | — | ⬜ |
| PART-04 | Haji/Investor ledger separate per currency: serial, date, description, from investor, paid to investor, balance | §22, System-Req-PDF | — | `GET /api/v1/partners/:id/ledger?currency=` | `/partners/:id/ledger` | — | ⬜ |
| PART-05 | Clear balance label: company owes investor vs investor owes company | §22 | — | — | Partner ledger | — | ⬜ |
| PART-06 | Profit/loss: cash-basis view AND accrual/contract-basis view | §22, System-Req-PDF | — | `GET /api/v1/reports/profit-loss` | `/reports/profit-loss` | — | ⬜ |
| PART-07 | Proposed distribution requires authorized approval; not auto-paid | §22 | `profit_distributions.status` | `PUT /api/v1/profit-distributions/:id/approve` | — | — | ⬜ |
| PART-08 | Partner report: invested, withdrawals, profit/loss, paid, remaining | §22 | — | `GET /api/v1/reports/partners` | `/reports/partners` | — | ⬜ |

---

## 17. DOCUMENT ATTACHMENT SYSTEM (Master Prompt §23)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| DOC-01 | Generic attachment support for all entities | §23 | `documents` (polymorphic: entity_type, entity_id) | `POST /api/v1/documents`, `GET /api/v1/documents?entity=&id=` | All entity forms | — | ⬜ |
| DOC-02 | Image/PDF upload with type, description, date, uploaded_by | §23 | `documents` | — | Document widget | — | ⬜ |
| DOC-03 | Preview, download, replace with history, soft delete, file hash, max size | §23 | `documents`, `document_versions` | — | Document widget | — | ⬜ |
| DOC-04 | Local file storage under configurable uploads path | §23 | `settings.uploads_path` | — | — | — | ⬜ |
| DOC-05 | Storage adapter prepared for future object storage | §23 | — | Storage service abstraction | — | — | ⬜ |

---

## 18. DASHBOARD (Master Prompt §24)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Tests | Status |
|--------|-------------|--------|-----------|-----|----------|-------|--------|
| DASH-01 | Summary cards: unit counts, sales totals, rent, expenses, purchases, cash, receivables/payables | §24 | All modules | `GET /api/v1/dashboard/summary` | `/dashboard` | — | ⬜ |
| DASH-02 | Charts: sales receipts over time, rental income, expenses by category, unit status, money in/out | §24 | — | `GET /api/v1/dashboard/charts` | `/dashboard` | — | ⬜ |
| DASH-03 | Lists: recent receipts, recent sales, recent rentals, late rent, ending-soon contracts, unpaid customers/suppliers, locked users, backup status | §24 | — | `GET /api/v1/dashboard/lists` | `/dashboard` | — | ⬜ |
| DASH-04 | All dashboard values link to filtered detail pages | §24 | — | — | `/dashboard` | — | ⬜ |
| DASH-05 | All values calculated from source transactions (not manual counters) | §24 | — | — | — | T-28 | ⬜ |
| DASH-06 | Last successful backup shown on dashboard | §24, §29 | `backup_history` | — | `/dashboard` | — | ⬜ |

---

## 19. REPORTS (Master Prompt §25)

| Req ID | Report Name | Source | API | Frontend | Filters | Export | Status |
|--------|-------------|--------|-----|----------|---------|--------|--------|
| REP-01 | Project Summary | §25 | `GET /api/v1/reports/project-summary` | `/reports/project-summary` | project, layout version | Print, PDF, Excel | ⬜ |
| REP-02 | Unit Availability / Map | §25 | `GET /api/v1/reports/unit-availability` | `/reports/unit-map` | block, floor, type | Print | ⬜ |
| REP-03 | Sales Report | §25 | `GET /api/v1/reports/sales` | `/reports/sales` | date, block, floor, type, customer, status, currency | Print, PDF, Excel | ⬜ |
| REP-04 | Rental Report | §25 | `GET /api/v1/reports/rental` | `/reports/rental` | date, project, block, unit, tenant | Print, PDF, Excel | ⬜ |
| REP-05 | Purchases Report | §25 | `GET /api/v1/reports/purchases` | `/reports/purchases` | supplier, item, project, date, currency | Print, PDF, Excel | ⬜ |
| REP-06 | Expenses Report | §25 | `GET /api/v1/reports/expenses` | `/reports/expenses` | category, project, date range | Print, PDF, Excel | ⬜ |
| REP-07 | Journal / Cash Report | §25 | `GET /api/v1/reports/journal` | `/reports/journal` | date, cash account, direction, currency | Print, PDF, Excel | ⬜ |
| REP-08 | Customer/Party Aging | §25 | `GET /api/v1/reports/aging` | `/reports/aging` | party type, currency | Print, PDF, Excel | ⬜ |
| REP-09 | Employee Report | §25 | `GET /api/v1/reports/employees` | `/reports/employees` | employee, date, status | Print, PDF, Excel | ⬜ |
| REP-10 | Exchange Dealer Report | §25 | `GET /api/v1/reports/exchange` | `/reports/exchange` | dealer, currency, date | Print, PDF, Excel | ⬜ |
| REP-11 | Partner Report | §25 | `GET /api/v1/reports/partners` | `/reports/partners` | partner, project, currency | Print, PDF, Excel | ⬜ |
| REP-12 | General Company Report (all modules combined) | §25, System-Req-PDF | `GET /api/v1/reports/general` | `/reports/general` | date range, period type | Print, PDF, Excel | ⬜ |

---

## 20. PRINT / PDF / EXCEL (Master Prompt §26)

| Req ID | Printable Document | Source | Status |
|--------|-------------------|--------|--------|
| PRINT-01 | Daily journal (Money In + Out) | §26 | ⬜ |
| PRINT-02 | Expense ledger | §26 | ⬜ |
| PRINT-03 | Customer ledger | §26 | ⬜ |
| PRINT-04 | Supplier ledger | §26, Purchase-Ledger-PDF | ⬜ |
| PRINT-05 | Exchange dealer ledger | §26 | ⬜ |
| PRINT-06 | Employee ledger | §26 | ⬜ |
| PRINT-07 | Haji/Partner ledger | §26 | ⬜ |
| PRINT-08 | Sale contract | §26, Sales-Ledger-PDF | ⬜ |
| PRINT-09 | Sale receipt (A4 and half-A4) | §26 | ⬜ |
| PRINT-10 | Installment receipt | §26 | ⬜ |
| PRINT-11 | Rental contract | §26 | ⬜ |
| PRINT-12 | Rent receipt | §26 | ⬜ |
| PRINT-13 | Purchase invoice/ledger | §26 | ⬜ |
| PRINT-14 | Purchase return bill | §26, System-Req-PDF | ⬜ |
| PRINT-15 | Project summary | §26 | ⬜ |
| PRINT-16 | Unit availability map | §26 | ⬜ |
| PRINT-17 | General company report | §26 | ⬜ |

**All prints must have:** A4/half-A4, logo + company header, contact footer, print timestamp (Jalali + Gregorian), page number, RTL columns, no browser navigation, Beheij Zar font.  
**Excel:** Real structured workbook (not screenshot), numeric cells, date/currency columns, totals, filters.  
**PDF:** Open-source server-side or reliable print-to-PDF.

---

## 21. AUDIT LOG (Master Prompt §28)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Status |
|--------|-------------|--------|-----------|-----|----------|--------|
| AUD-01 | Audit all sensitive actions: login, failed login, lock/unlock, create, update, post, approve, payment, reverse, delete draft, restore, backup, setting change, export | §28 | `audit_logs` | — (internal) | `/settings/audit` | ⬜ |
| AUD-02 | Audit entry fields: user, action, entity type, entity ID, before JSON, after JSON, IP/device/session, datetime, reason | §28 | `audit_logs` | `GET /api/v1/audit-logs` | `/settings/audit` | ⬜ |
| AUD-03 | Audit log read-only to normal users | §28 | — | Authorization middleware | — | ⬜ |

---

## 22. BACKUP, RESTORE & RECOVERY (Master Prompt §29)

| Req ID | Requirement | Source | DB Tables | API | Frontend | Status |
|--------|-------------|--------|-----------|-----|----------|--------|
| BAK-01 | Manual backup button | §29 | `backup_history` | `POST /api/v1/backup` | `/settings/backup` | ⬜ |
| BAK-02 | Automatic daily backup with configurable retention | §29 | `settings` | — (cron job) | `/settings/backup` | ⬜ |
| BAK-03 | Backup history, download/copy | §29 | `backup_history` | `GET /api/v1/backup/history` | `/settings/backup` | ⬜ |
| BAK-04 | Restore workflow with confirmation + pre-restore safety backup | §29 | — | `POST /api/v1/backup/restore` | `/settings/backup/restore` | T-30 | ⬜ |
| BAK-05 | Integrity check after restore | §29 | — | — | — | T-30 | ⬜ |
| BAK-06 | SQLite: safe checkpoint/copy; MySQL: dump/restore docs | §29 | — | — | `RUNBOOK_BACKUP_RESTORE.md` | ⬜ |

---

## 23. CALENDAR, DATE, AND TIMEZONE (Master Prompt §6)

| Req ID | Requirement | Source | Status |
|--------|-------------|--------|--------|
| DATE-01 | Business timezone: Asia/Kabul | §6 | ⬜ |
| DATE-02 | Primary displayed calendar: Solar Hijri / Jalali | §6 | ⬜ |
| DATE-03 | Print documents: both Jalali and Gregorian dates | §6, Party-Ledger-System-Req-PDF | ⬜ |
| DATE-04 | Date-only fields stored without UTC shift | §6 | ⬜ |
| DATE-05 | Date-range filtering in Jalali UI | §6 | ⬜ |
| DATE-06 | Configurable fiscal-year numbering | §6 | ⬜ |

---

## 24. REQUIRED DELIVERABLES CHECKLIST (Master Prompt §33)

| Deliverable | Status |
|-------------|--------|
| Source code (complete) | ⬜ |
| Database migrations | ⬜ |
| Seeders (demo seed separate from production) | ⬜ |
| `.env.example` | ⬜ |
| `README.md` | ⬜ |
| `LOCAL_INSTALL_WINDOWS.md` | ⬜ |
| `LOCAL_INSTALL_LINUX.md` | ⬜ |
| `DEPLOYMENT.md` | ⬜ |
| `RUNBOOK_BACKUP_RESTORE.md` | ⬜ |
| `RUNBOOK_RELEASE_ROLLBACK.md` | ⬜ |
| `RUNBOOK_AUTH_RECOVERY.md` | ⬜ |
| `REQUIREMENTS_TRACEABILITY.md` | ✅ (this file) |
| `ASSUMPTIONS.md` | ✅ |
| `ACCEPTANCE_TESTS.md` | ⬜ |
| `API_REFERENCE.md` | ⬜ |
| `DATABASE_SCHEMA.md` | ⬜ |
| `PROJECT_STATUS.md` | ⬜ |

---

## 25. AUTOMATED TESTS (Master Prompt §31)

| Test ID | Description | Module | Status |
|---------|-------------|--------|--------|
| T-01 | 3 failed login attempts lock account | AUTH | ⬜ |
| T-02 | Password reset/recovery path | AUTH | ⬜ |
| T-03 | Draft layout can change before publication | PROJ | ⬜ |
| T-04 | Published unit with transaction cannot be structurally deleted | PROJ | ⬜ |
| T-05 | 14 floors × 13 units generates 182 residential units | PROJ | ⬜ |
| T-06 | Two-level shop = one legal unit with two parts | PROJ/SHOP | ⬜ |
| T-07 | Same unit cannot be sold twice | SALE | ⬜ |
| T-08 | Sold unit cannot be rented | SALE/RENT | ⬜ |
| T-09 | Rental periods cannot overlap | RENT | ⬜ |
| T-10 | Sale payment recalculates remaining balance | SALE | ⬜ |
| T-11 | Overpayment rejected unless authorized | SALE | ⬜ |
| T-12 | Authorized overpayment becomes customer credit | SALE | ⬜ |
| T-13 | Reversing a receipt recalculates balance | SALE | ⬜ |
| T-14 | Rent payment allocates to selected month | RENT | ⬜ |
| T-15 | Early rental termination calculates used days and payable amount | RENT | ⬜ |
| T-16 | Purchase increases stock | PUR | ⬜ |
| T-17 | Purchase return decreases stock and supplier payable | PUR | ⬜ |
| T-18 | Return above available quantity is rejected | PUR | ⬜ |
| T-19 | Supplier ledger updates automatically | PUR | ⬜ |
| T-20 | Expense posts once to journal | EXP/ACCT | ⬜ |
| T-21 | Duplicate request/idempotency key does not duplicate transaction | ACCT | ⬜ |
| T-22 | Attendance cannot duplicate employee/date | EMP | ⬜ |
| T-23 | Absent daily worker earns zero (not negative) | EMP | ⬜ |
| T-24 | Employee overpayment becomes employee debt | EMP | ⬜ |
| T-25 | Separate currencies never added together | CUR | ⬜ |
| T-26 | Exchange transaction creates correct two-currency legs | EXC | ⬜ |
| T-27 | Partner percentages validate to 100% | PART | ⬜ |
| T-28 | General report matches module and journal totals | REP | ⬜ |
| T-29 | Posted transaction cannot be silently hard-deleted | ACCT | ⬜ |
| T-30 | Backup can be created and restore validation succeeds | BAK | ⬜ |
| T-31 | Print route renders without clipped RTL text | PRINT | ⬜ |
| T-32 | Role permission denies unauthorized action | AUTH | ⬜ |

---

## 26. ACCEPTANCE SCENARIOS (Master Prompt §32)

| Scenario | Description | Status |
|----------|-------------|--------|
| A | Configure project: 1 block, 1 commercial floor, 14 residential floors, 13 apartments each (182 total), 1-level + 2-level shops, publish layout | ⬜ |
| B | Sell apartment by installments: register customer → sale → first payment → receipts → Fully Paid → ledger and journal match | ⬜ |
| C | Rent shop: register tenant → contract → schedule → payment → end early → calculate balance → release unit | ⬜ |
| D | Purchase and return material: supplier → purchase → inventory up → payable → pay part → return part → return bill → everything reconciles | ⬜ |
| E | Employee: register → mark attendance → earn wages only for present days → advance → balance → close month → print ledger | ⬜ |
| F | Partner: two partners → contributions → profit split → withdrawals → cash+accrual reports → approve distribution → print statements | ⬜ |

---

*This document must be updated after each implementation phase. See `PROJECT_STATUS.md` for current phase progress.*
