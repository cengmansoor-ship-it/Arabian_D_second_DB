# MASTER BUILD PROMPT — ARABIAN D RESIDENCE
## One-shot prompt for Replit Agent

You are the lead software architect, senior full-stack engineer, database engineer, accountant-systems analyst, QA engineer, and UI/UX engineer for this project.

Build a complete, production-quality, local-first Real Estate, Construction Accounting, Sales, Rental, Purchasing, Workforce, Partner Investment, and Reporting System for **Arabian D Residence**.

Do not produce only a prototype, mockup, static UI, or incomplete scaffold. Build a working end-to-end system with database migrations, backend APIs, frontend screens, validations, calculations, printable documents, reports, tests, backup/restore, and documentation.

Do not stop after creating the dashboard or database. Continue through every phase in this prompt. Do not wait for confirmation between phases. If a minor detail is unclear, choose the safest configurable implementation, record the assumption in `ASSUMPTIONS.md`, and continue. Never hardcode an uncertain architectural layout.

---

# 1. SOURCE FILES AND REQUIREMENT PRIORITY

First inspect every uploaded requirement file and visual example in the repository or Replit attached-assets area, especially:

1. `د سیستم مهمی ټکی باید چیک سی.pdf`
2. `طرحه 01.docx`
3. `Pasted text(57).txt`
4. `خریداری کهاته.pdf`
5. `دوکانونو برخه په جلابټن او د پروژی په برخه کی وی(1).pdf`
6. `فروشاتو کهاته(1).pdf`
7. `دپروژي طرحه(1).pdf`
8. `General- A- Block.(1).pdf`
9. `General- B- Block(1).pdf`
10. `A Blocks(1).pdf`
11. `B- Block(1).pdf`

Use the documents as business-process and print-layout references. Use this master prompt as the implementation contract.

When requirements conflict, use this priority:

1. Protect financial accuracy and existing data.
2. Keep project structure dynamic and configurable.
3. Use the latest project facts in this prompt.
4. Treat older A/B block drawings and 10-block/270-apartment examples as reference examples, not hardcoded production data.
5. Do not silently guess an unresolved count. Store it as a draft assumption and make it editable in the setup wizard.

Create `REQUIREMENTS_TRACEABILITY.md` mapping every major requirement in this prompt and the uploaded documents to:
- database tables,
- backend endpoints/services,
- frontend pages,
- tests,
- completion status.

---

# 2. CURRENT PROJECT FACTS AND SAFE INTERPRETATION

The current architectural map is not final. It is approximately 70% complete. Therefore, the system must support layout revisions without rewriting code.

Current provisional information:

- A building/block can have **15 total levels**.
- The lowest/ground level is commercial.
- The remaining **14 residential floors** can contain **13 homes/apartments per floor**.
- This produces **182 residential units per applicable block**: 14 × 13 = 182.
- The commercial level may include:
  - shops,
  - one large restaurant,
  - clinic,
  - supermarket,
  - parking or other commercial spaces.
- The current shop statement is not fully confirmed:
  - 28 one-level shops,
  - 28 two-level shops,
  - the notes mention a total of 84 commercial level-parts/spaces.
- Do not hardcode “84 legal shops.”
- Model a legal commercial unit separately from the physical levels/parts it occupies.
- A two-level shop is one legal shop unit with two unit parts/levels.
- Reports must separately show:
  - legal shop count,
  - single-level shop count,
  - multi-level shop count,
  - total occupied commercial level-parts.
- Blocks are not yet confirmed.
- Some blocks may have shops; other blocks may not.
- Some blocks may contain parking, mosque, restaurant, clinic, supermarket, or other facilities.
- Shops must support both sale and rental, according to their configured purpose and current status.

Create a **Draft Layout Setup Wizard**. Do not activate a project layout until an authorized user publishes a layout version.

---

# 3. NON-NEGOTIABLE PRODUCT PRINCIPLES

1. **Accuracy before decoration.**
2. **No duplicate financial posting.**
3. **No duplicate unit sale.**
4. **No overlapping active rental contract for the same unit and period.**
5. **No manual report totals.** Reports must calculate from source transactions and journal postings.
6. **No floating-point money calculations.**
7. **No destructive edits that corrupt financial history.**
8. **No hardcoded block, floor, apartment, shop, project, currency, or company counts.**
9. **No demo pages, fake charts, lorem ipsum, template branding, or unused template components in the final build.**
10. **No paid API or paid external service is required for the core system.**
11. **The system must work without internet when installed on the office computer.**
12. **The same codebase must be deployable later through environment configuration.**
13. **Pashto RTL is the primary interface.**
14. **All important pages must support print, PDF, and Excel where applicable.**
15. **Every financial action must be auditable.**

---

# 4. REQUIRED TECHNOLOGY AND ARCHITECTURE

Use a monorepo.

## Frontend
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod validation
- A stable table library such as TanStack Table
- A stable chart library
- RTL-first responsive layout
- PWA application shell
- No external web font dependency

## Backend
- Node.js
- Express.js
- TypeScript
- Zod or equivalent request validation
- Service/repository architecture
- REST API
- Central error handling
- Structured logging

## Database
Use **Sequelize** with a dialect configuration so the same codebase can run:

- default local/offline mode: SQLite,
- future hosted mode: MySQL.

Environment examples:

```env
DB_DIALECT=sqlite
SQLITE_PATH=./data/arabian-d.sqlite
```

or:

```env
DB_DIALECT=mysql
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Do not fork the business logic for each database. Keep one model and service layer. Add dialect-aware transaction handling only where necessary.

## Numeric precision
- Money: `DECIMAL(20,4)`
- Quantity: `DECIMAL(20,6)`
- Exchange rate: `DECIMAL(20,8)`
- Never use JavaScript floating-point arithmetic for money.
- Use `decimal.js` or another decimal-safe library in services and reports.

## Local-first meaning
The application must run on one office computer without internet:
- backend,
- frontend,
- SQLite database,
- uploaded documents,
- backups.

Do not introduce a risky offline multi-device write queue in version 1. The local server itself is the offline system. The PWA may cache the application shell, but financial writes require a connection to the local or hosted backend.

## Hosting readiness
- no hardcoded localhost in frontend code,
- configurable API base URL,
- environment validation,
- production build,
- CORS configuration,
- secure cookie/JWT configuration,
- file-storage adapter,
- database adapter,
- deployment documentation.

## Project structure

```text
/
  apps/
    api/
      src/
        config/
        controllers/
        routes/
        middleware/
        models/
        migrations/
        seeders/
        repositories/
        services/
        accounting/
        reports/
        print/
        utils/
        tests/
    web/
      src/
        app/
        assets/
        components/
        features/
        hooks/
        layouts/
        pages/
        services/
        stores/
        styles/
        types/
        utils/
  packages/
    shared/
  data/
  backups/
  uploads/
  scripts/
  docs/
```

---

# 5. TEMPLATE AND BRANDING RULES

A downloaded React template may be uploaded.

If a template exists:
- inspect it first,
- preserve only useful layout primitives and components,
- remove all demo routes,
- remove all sample data,
- remove original branding,
- remove unrelated widgets and pages,
- remove unused dependencies,
- rebuild navigation for this system,
- verify no dead links remain.

If no template exists, create a clean professional dashboard.

Brand requirements:
- Company/project brand: Arabian D Residence.
- Company profile must be editable from Settings.
- Company logo, name, phone numbers, email, website, Facebook/address fields must be configurable.
- Use the supplied **Beheij Zar** font through local `@font-face`.
- Use the font throughout the interface and print layouts.
- Do not fetch fonts from Google Fonts or another external source.
- Add a clean RTL sidebar, top bar, breadcrumbs, cards, status badges, tables, forms, modals, and printable pages.
- Avoid excessive animation. Use smooth, fast, purposeful transitions.
- Desktop-first, fully responsive for mobile and tablet.
- Primary UI language: Pashto.
- Prepare translation keys for Dari and English.
- Keep user-entered text in its original language.

---

# 6. DATE, TIME, AND CALENDAR RULES

- Business timezone: `Asia/Kabul`.
- Primary displayed calendar: Solar Hijri/Jalali.
- Print documents must show both:
  - Jalali date,
  - Gregorian date.
- Store reliable canonical dates/timestamps in the database.
- Date-only business fields must not shift because of UTC conversion.
- Every printed ledger and receipt must include exact print date and time.
- Support date-range filtering in Jalali UI.
- Fiscal-year numbering must be configurable.

---

# 7. AUTHENTICATION, SECURITY, AND USER MANAGEMENT

Create:

- Login page with company logo/name.
- Username field with user/person icon.
- Password field with lock icon.
- Show/hide password.
- “Forgot password” workflow.
- Password change screen.
- Session logout.
- User status: active, disabled, locked.
- Last login.
- Failed login count.
- Audit of login and security events.

After three incorrect password attempts:
- lock the account for a configurable period, default 15 minutes,
- show a clear message,
- allow Super Admin to unlock it,
- do not permanently lock the entire application.

Password recovery:
- if email is configured, support reset token email,
- because local/offline mode may have no email, also provide a secure local Super Admin recovery command documented in `RUNBOOK_AUTH_RECOVERY.md`,
- never store plaintext passwords.

Security:
- password hashing with Argon2 or bcrypt,
- secure JWT or secure session cookies,
- CSRF protection if cookies are used,
- rate limiting,
- validation and sanitization,
- upload type/size validation,
- authorization middleware,
- secure headers,
- no secrets in source code,
- `.env.example`,
- no default production password.

Roles:
- Super Admin
- Admin
- Accountant
- Project Manager
- Sales Manager
- Rental Manager
- Purchase/Inventory Officer
- HR/Attendance Officer
- Viewer/Auditor

Create granular permissions:
- view,
- create,
- update,
- post,
- approve,
- receive/payment,
- void/reverse,
- hard-delete draft,
- export,
- print,
- backup,
- restore,
- unlock user,
- manage settings.

Super Admin can assign permissions per role.

---

# 8. WELCOME SCREEN

After successful login:
- show a welcome/splash page for 3 seconds,
- allow Enter or a Continue button to skip,
- show logo and company name,
- show configurable Pashto and English slogans such as:
  - “د ښه هوساینې تجربه زموږ سره”
  - “باور ستاسو، کیفیت زموږ”
  - “د ښه معیار او کیفیت سمبول”
- then open the dashboard.

The welcome screen must be configurable and may be disabled in Settings.

---

# 9. CENTRAL ACCOUNTING AND POSTING ENGINE

Do not build isolated module totals that can disagree.

Create a centralized accounting/posting engine.

## User-facing behavior
Users see simple terms:
- راغلي پیسې / Money In
- تللي پیسې / Money Out
- رسید
- پیسې
- الباقي
- طلب
- پور

## Accounting data model
Create:
- `accounts`
- `cash_accounts`
- `journal_transactions`
- `journal_lines`
- `posting_links`
- `fiscal_periods`
- `document_sequences`

Every posted business transaction creates one journal transaction and balanced journal lines.

Examples:
- sale receipt,
- rent receipt,
- purchase,
- payment to supplier,
- expense,
- employee wage payment,
- employee repayment to company,
- exchange transaction,
- investor contribution,
- investor withdrawal,
- purchase return,
- manual cash entry.

Each posting must include:
- UUID/idempotency key,
- source module,
- source record ID,
- document number,
- transaction date,
- currency,
- description,
- created by,
- posted by,
- created time,
- reversal link if reversed.

Enforce:
- total debit equals total credit per transaction and currency,
- source transaction is posted only once,
- unique source-module/source-ID/posting-type constraint,
- reports calculate from posted transactions.

## Correct debt terminology
Use these consistent business meanings:

- **طلب / Receivable:** the customer or other party owes money to the company.
- **پور / Payable:** the company owes money to the customer, supplier, employee, exchange dealer, or investor.

Do not infer debt only from a minus sign. Store direction clearly and display the correct label.

Color rules:
- receipts/received amounts: green,
- outstanding balances/debt alerts: red,
- sold unit description/base sale information: black,
- neutral totals: standard text.

## Editing and deletion
Financial accuracy is more important than silent deletion.

- Draft/unposted records may be edited or hard-deleted by authorized users.
- Posted financial records may not be silently overwritten or hard-deleted.
- Use `Void` or `Reverse` with:
  - reason,
  - timestamp,
  - user,
  - reversal transaction.
- A corrected replacement may be created after reversal.
- The UI should make the reversed item disappear from normal operational totals while preserving it in audit history.
- Super Admin hard-delete is allowed only for an unposted draft with no dependent records.

## Duplicate protection
- client-generated UUID,
- idempotency header/key,
- unique document number,
- disabled submit button while saving,
- server-side duplicate check,
- database transaction,
- retry-safe API behavior.

---

# 10. MULTI-CURRENCY

Base currencies:
- AFN / Afghani
- USD / Dollar
- PKR / Kaldar

Settings must allow additional currencies.

Rules:
- Every ledger exists separately per currency.
- Never add AFN, USD, and PKR into one meaningless total.
- Reports show separate totals by currency.
- A converted/base-currency report is optional and must require an explicit exchange rate and show that rate.
- Exchange rates must be stored with date, source, and user.
- Money records store currency ID.
- Receipts cannot be applied to an invoice/sale in another currency unless an explicit exchange transaction is recorded.

---

# 11. COMPANY SETUP AND SETTINGS

Create a first-run setup wizard:

1. Company name
2. Logo
3. Address
4. Phone numbers
5. WhatsApp
6. Email
7. Website
8. Facebook/social links
9. Primary language
10. Timezone
11. Currencies
12. Document prefixes
13. Fiscal year
14. Backup folder
15. Default print paper sizes
16. Welcome slogans
17. Local admin account
18. Project draft

Settings modules:
- company profile,
- users and roles,
- currencies,
- exchange-rate policy,
- numbering sequences,
- calendar,
- workweek,
- attendance policy,
- rental proration policy,
- file storage,
- backup,
- print templates,
- project defaults,
- audit viewer.

---

# 12. DYNAMIC PROJECT AND PROPERTY LAYOUT MANAGEMENT

Create hierarchy:

```text
Project
  -> Layout Version
    -> Section/Block Group (optional: A, B, Phase 1, Phase 2)
      -> Block
        -> Floor/Level
          -> Unit
            -> Unit Parts/Occupied Levels (optional)
```

## Project
Fields:
- name,
- code/prefix,
- description,
- location,
- start date,
- status,
- progress percentage,
- documents,
- notes.

Project statuses:
- Draft
- Active
- On Hold
- Completed
- Archived

## Layout versioning
Create `project_layout_versions`:
- version number,
- status: Draft, Published, Archived,
- effective date,
- notes,
- created by,
- published by.

Rules:
- sales/rentals only use published units,
- a draft layout may be edited freely,
- after a unit has a sale, rental, reservation, or financial transaction, it cannot be structurally deleted,
- use deactivate, merge, split, renumber, or migrate actions with audit history,
- publishing a new layout version must validate all unit identifiers and relationships.

## Block
Fields:
- project,
- group/section,
- block name,
- block code,
- order,
- number of floors,
- notes,
- active status.

## Floor
Fields:
- block,
- level number,
- display name,
- floor type:
  - basement,
  - ground,
  - mezzanine,
  - residential,
  - commercial,
  - parking,
  - roof,
  - other,
- order,
- active.

## Unit types
Dynamic master list with defaults:
- Apartment/House
- Shop
- Parking
- Restaurant
- Clinic
- Supermarket
- Mosque
- Office
- Storage
- Other Commercial Unit
- Other

## Unit
Fields:
- project,
- layout version,
- block,
- floor,
- unit code,
- display number,
- unit type,
- room count,
- area,
- area unit,
- legal title/reference,
- purpose:
  - For Sale
  - For Rent
  - Both Sale and Rent
  - Not Available
- status:
  - Draft
  - Available
  - Reserved
  - Sold
  - Rented
  - Blocked
  - Cancelled
  - Inactive
- default sale price,
- default rent price,
- currency,
- notes,
- documents.

## Multi-level commercial units
Create:
- `unit_parts` or `unit_occupied_levels`,
- one legal unit can occupy multiple floors/levels,
- each part records floor, label, area, order.

This must support:
- one-level shop,
- two-level shop,
- restaurant occupying several spaces,
- supermarket occupying several spaces.

## Layout generation wizard
Admin can:
- create blocks manually,
- bulk-generate floors,
- bulk-generate units,
- choose different unit counts per floor,
- set numbering start,
- set prefix,
- configure exceptions,
- preview before save,
- edit generated draft,
- publish after validation.

Example numbering:
`ADR-A1-03-012`

Numbering rules must be configurable.

## Unit map
Create visual:
- project -> block -> floor -> unit cards,
- status colors,
- click unit for details,
- filters,
- print view.

Do not calculate “available” by a manually maintained counter. Calculate from unit records and active contracts/reservations.

---

# 13. PARTY AND CUSTOMER MASTER

Use a shared `parties` master so one person/company can have several roles without duplicate identity records.

Party types/roles:
- Individual/Market Customer
- Supplier/Material Vendor
- Sales Customer
- Tenant
- Exchange Dealer
- Employee
- Partner/Investor/Haji
- Other

Fields:
- party type,
- person or organization,
- name,
- father name,
- grandfather name,
- company/shop name,
- Tazkira/ID number,
- tax/registration number,
- phone,
- alternate phone,
- address,
- notes,
- active status,
- photo,
- documents.

Features:
- fast search,
- filters,
- duplicate identity warning,
- editable profile,
- full activity timeline,
- separate ledger per currency,
- date-range ledger,
- print/PDF,
- company header/footer,
- Jalali and Gregorian print dates.

The registration list must show:
- name,
- phone,
- balances by currency,
- receivable/payable label,
- open ledger action,
- edit action,
- active/inactive status.

When opening a ledger with an outstanding debt:
- show a 5-second warning,
- identify whether it is `طلب` or `پور`,
- show amount and currency.

---

# 14. DAILY JOURNAL / CASHBOOK (ROZNAMCHA)

Create two primary views:
- Money In / راغلي پیسې
- Money Out / تللي پیسې

The journal must automatically receive postings from:
- sale receipts,
- rent receipts,
- supplier payments,
- purchases paid in cash,
- expenses,
- exchange transactions,
- employee payments,
- employee repayments,
- partner contributions,
- partner withdrawals,
- Haji transactions,
- purchase returns/refunds,
- approved manual entries.

Fields:
- document number,
- date,
- exact time,
- direction,
- currency,
- amount,
- cash account,
- party/reference,
- source module,
- description,
- project,
- user,
- status.

Features:
- today opens by default,
- next day automatically uses current business date,
- date navigation,
- search,
- filters,
- totals separated by currency and direction,
- edit draft,
- reverse posted item,
- print/PDF/Excel,
- company header/footer.

Manual journal entry:
- permission-controlled,
- requires category and explanation,
- cannot duplicate an automatic source posting.

---

# 15. EXPENSE MANAGEMENT

Create dynamic expense categories, for example:
- Office
- Kitchen
- Project Site
- Transport
- Utilities
- Equipment
- Salary-related
- Maintenance
- Other

Expense fields:
- expense number,
- category,
- project optional,
- party optional,
- description,
- amount,
- currency,
- date,
- payment method/cash account,
- attachment,
- notes,
- created by,
- approval status.

Features:
- category ledger,
- daily/weekly/monthly/yearly reports,
- multiple-category combined report,
- date range,
- project filter,
- totals by currency,
- print/PDF/Excel,
- automatic Money Out posting,
- audit log.

---

# 16. MATERIAL PURCHASES, SUPPLIER LEDGERS, INVENTORY, AND RETURNS

## Item master
Fields:
- item name,
- category,
- specification/grade,
- default unit,
- alternate units,
- active status.

Units may include:
- piece,
- brick,
- kilogram,
- ton,
- meter,
- square meter,
- cubic meter,
- truck,
- parcel,
- bundle,
- bag,
- liter,
- custom.

Do not sum incompatible units without a defined conversion.

## Purchase
Fields:
- purchase number,
- supplier,
- project,
- date,
- supplier bill number,
- item,
- specification,
- quantity,
- unit,
- unit price,
- line total,
- currency,
- discount,
- total,
- paid amount,
- remaining amount,
- payment status,
- notes,
- documents.

A purchase can contain multiple lines.

Rules:
- line total = quantity × unit price,
- supplier ledger updates automatically,
- inventory increases when purchase is received,
- paid cash creates Money Out posting,
- unpaid balance creates payable,
- totals by item and unit,
- reports by supplier, item, project, date, and currency.

## Supplier ledger
Columns:
- serial,
- date,
- description,
- bill number,
- quantity/unit,
- unit price,
- total,
- payment,
- balance.

At the bottom:
- total purchased,
- total paid,
- outstanding balance,
- total quantities grouped by item and compatible unit,
- receivable/payable label,
- company contact information.

## Purchase returns / Return bill
Purchase return is linked only to purchasing/inventory, not sales.

Flow:
1. Select original purchase.
2. Select returned lines.
3. Enter returned quantity.
4. Validate return quantity does not exceed available received quantity minus previous returns.
5. Decrease stock.
6. Decrease supplier payable or create supplier receivable/refund.
7. Create a return bill automatically.
8. Update supplier ledger.
9. Post accounting reversal/refund.
10. Audit everything.

Return bill:
- company logo and title,
- all company contact details,
- automatic sequential number with configurable company prefix,
- original purchase reference,
- supplier,
- returned item lines,
- quantity/unit,
- unit price,
- total,
- date,
- reason,
- signatures,
- print/PDF.

---

# 17. EXCHANGE DEALER / SARAFI MODULE

Create exchange dealer registration:
- dealer name,
- exchange business name,
- market/address,
- shop number,
- phone,
- notes,
- documents.

Each exchange dealer has separate AFN, USD, and PKR ledgers.

Transactions:
- company gives money to exchange dealer,
- exchange dealer gives money to company,
- investor/customer payment through exchange dealer,
- exchange between two currencies,
- fee/commission,
- reference party and project.

For currency exchange:
- source currency,
- source amount,
- destination currency,
- destination amount,
- exchange rate,
- fee,
- date,
- reference.

Create two balanced currency legs and never merge currencies into one ledger total.

Reports:
- dealer ledger,
- company owed by dealer,
- company owes dealer,
- totals per currency,
- date range,
- print/PDF/Excel.

---

# 18. SALES MODULE

Sales apply to:
- apartments/houses,
- shops,
- parking,
- restaurant,
- clinic,
- supermarket,
- other configured saleable units.

## Customer fields
Use party profile plus:
- name,
- father name,
- grandfather name,
- Tazkira number,
- phone,
- address,
- documents,
- notes.

## Sale fields
- sale number,
- contract number,
- project,
- layout version,
- block,
- floor,
- unit,
- unit type,
- room count,
- original price,
- discount,
- final price,
- currency,
- sale date,
- payment type:
  - full payment,
  - installment,
- initial payment,
- status:
  - Draft
  - Reserved
  - Active
  - Fully Paid
  - Cancelled
  - Reversed
- documents,
- notes.

## Sale creation rules
Inside one database transaction:
1. Validate the unit is published and saleable.
2. Validate status allows sale.
3. Lock/check the unit.
4. Prevent duplicate active sale.
5. Create sale.
6. Record initial payment if any.
7. Post journal entries.
8. Set unit status to Sold or Reserved according to workflow.
9. Generate receipt/contract number.
10. Save audit log.

A sold unit cannot be sold or rented again unless the original transaction is formally cancelled/reversed by an authorized user and the unit status is released.

## Installments and receipts
Fields:
- receipt number,
- sale,
- receipt date,
- amount,
- currency,
- payment method,
- cash account,
- reference,
- note,
- received by,
- created by.

Rules:
- remaining = final price − valid posted receipts,
- calculate from payment rows, not manually typed balance,
- prevent overpayment,
- an Admin may explicitly confirm overpayment; record it as customer credit, not negative sale balance,
- when balance is zero, status becomes Fully Paid,
- every receipt creates Money In and journal posting,
- receipt is stored and printable,
- receipts appear in customer ledger,
- reversal recalculates balance and status.

## Sales customer ledger
Show:
- customer identity,
- project,
- block,
- floor,
- unit number,
- room count,
- sale price,
- each receipt date,
- each receipt amount,
- running remaining balance,
- total received,
- total remaining,
- documents,
- print date/time.

Use the uploaded sales-ledger image as a visual reference, but create a clean responsive version.

## Sale documents
Create:
- sale contract,
- first-payment receipt,
- installment receipt,
- half-A4 receipt option,
- A4 customer ledger,
- cancellation/reversal document.

Header/footer:
- logo,
- company name,
- slogans,
- phone,
- email,
- website,
- address.

---

# 19. SHOP AND COMMERCIAL UNIT SALE/RENT CHOICE

A shop/commercial unit can be configured as:
- For Sale
- For Rent
- Both
- Not Available

Admin chooses the transaction type at the time of use, subject to status.

Rules:
- Sold unit is unavailable for rental.
- Active rented unit is unavailable for sale unless the rental is ended/cancelled first.
- Reserved unit cannot be rented or sold to another party.
- Multi-level shop parts move together with the legal unit.
- Reports show legal unit status, not duplicate each level as a separate shop sale.

Provide a dedicated **Shops & Commercial Units** menu, but keep it connected to the Project, Sales, and Rental modules.

---

# 20. RENTAL MODULE

Rental applies to shops and any rentable configured unit.

## Tenant
Use party profile with:
- name,
- father name,
- grandfather name,
- Tazkira,
- phone,
- address,
- documents,
- notes.

## Rental contract fields
- contract number,
- project,
- block,
- floor,
- unit,
- monthly rent,
- currency,
- daily-rate policy,
- calculated daily rate,
- contract start date,
- expected end date,
- actual end date,
- security deposit,
- status:
  - Draft
  - Active
  - Ended
  - Cancelled
- documents,
- notes.

## Proration policy
Make configurable:
- 30-day commercial month, default,
- or actual calendar days.

Clearly document whether end date is inclusive. Default: start date inclusive, actual end date inclusive.

## Rental schedule
Generate rent periods:
- period/month label,
- period start,
- period end,
- days,
- rent due,
- due date,
- paid,
- remaining,
- status:
  - Upcoming
  - Due
  - Partial
  - Paid
  - Late
  - Waived.

## Rental payment
Fields:
- receipt number,
- payment date,
- amount,
- currency,
- payment method,
- cash account,
- note,
- created by.

Payments must be allocated to exact period(s):
- one month,
- multiple months,
- part of a month,
- advance credit.

Allocation order:
- user may select periods,
- otherwise oldest unpaid period first,
- show allocation before confirmation.

## Contract ending
When actual end date is entered:
- calculate total used days,
- calculate full months and remaining days according to policy,
- calculate payable rent,
- include approved adjustments,
- compare paid amount,
- calculate remaining balance or tenant credit,
- handle security deposit settlement,
- end contract,
- release unit to Available only if it is not sold, blocked, or reserved.

## Rental reports
- active tenants,
- monthly expected rent,
- monthly received rent,
- unpaid/late rent,
- advance balance,
- expired contracts,
- contracts ending soon,
- tenant ledger,
- unit rental history,
- daily/monthly/yearly income,
- date/project/block/unit filters,
- print/PDF/Excel.

---

# 21. EMPLOYEE, ATTENDANCE, WAGE, AND EMPLOYEE LEDGER

## Employee
Fields:
- automatic ID with company prefix, e.g. `ADR-EMP-0001`,
- name,
- father name,
- Tazkira,
- phone,
- job title,
- pay mode:
  - daily wage,
  - monthly salary,
- daily wage,
- monthly salary,
- start date,
- status:
  - active,
  - inactive,
- photo,
- Tazkira scan,
- other documents,
- notes.

Create employment periods so a returning employee can be reactivated with a new start date without losing history.

## Attendance
Default view opens on current Jalali date.

Fields:
- employee,
- date,
- Present,
- Absent,
- Leave,
- Holiday,
- note,
- recorded by.

Rules:
- present daily-wage employee earns daily wage,
- absence does not create a negative wage; it creates no daily earning,
- monthly-salary policy is configurable,
- prevent duplicate attendance for employee/date,
- allow correction with audit,
- bulk attendance screen,
- search/filter.

Friday rule from the requirement:
- provide a configurable option allowing Friday attendance to be backfilled on Saturday,
- do not hardcode it permanently,
- record the actual attendance date separately from entry timestamp.

## Employee ledger
Transactions:
- wage earned,
- payment to employee,
- repayment from employee to company,
- advance,
- adjustment,
- opening balance.

Show:
- daily attendance earnings,
- payments,
- repayments,
- running balance,
- previous-month balance,
- current-month activity,
- total present days,
- total absent days,
- total received,
- remaining balance.

If employee received more than earned:
- create employee debt to company (`طلب` from company perspective),
- show red warning until settled.

Monthly closing:
- each month can be closed,
- old-month amounts remain in history,
- carry only the closing balance,
- reopening requires authorized permission and reason.

Features:
- active/inactive,
- PDF,
- print,
- Excel,
- date range,
- documents.

---

# 22. PARTNER / INVESTOR / HAJI MODULE

## Partner master
Fields:
- party,
- project,
- contribution type:
  - cash,
  - land,
  - in-kind,
  - mixed,
- stated contribution value,
- currency,
- ownership/share percentage,
- profit split percentage,
- loss split percentage,
- effective date,
- agreement documents,
- notes.

Allow:
- equal split,
- percentage split,
- fixed custom split,
- project-specific partnership.

Validate total active distribution percentage equals 100% for a calculation set.

## Partner transactions
- capital contribution,
- additional contribution,
- withdrawal,
- distribution paid,
- expense paid personally for project,
- reimbursement,
- adjustment.

## Haji/Investor ledger
Separate ledger per currency:
- serial,
- date,
- description,
- money from investor,
- money paid to investor,
- balance,
- notes.

Balance must clearly show:
- company owes investor,
- investor owes company,
- no ambiguous negative-only display.

## Profit/loss
Provide two report views:

1. Cash basis:
   - cash receipts from sales,
   - rent receipts,
   - other received income,
   - minus paid purchases,
   - expenses,
   - wages,
   - refunds,
   - other cash outflows.

2. Accrual/contract basis:
   - recognized sale/rental income,
   - minus recognized costs and expenses.

Do not automatically pay/distribute profit. Calculate a proposed distribution, show basis, and require authorized approval.

Partner report:
- invested amount,
- withdrawals,
- allocated profit/loss,
- amount paid,
- amount remaining,
- project/date/currency filters,
- printable statement.

---

# 23. DOCUMENTS AND FILES

Create generic document attachment support for:
- customers,
- suppliers,
- sales,
- receipts,
- tenants,
- rental contracts,
- purchases,
- purchase returns,
- employees,
- partners,
- projects,
- units.

Features:
- image/PDF upload,
- type,
- description,
- date,
- uploaded by,
- preview,
- download,
- replace with history,
- soft delete,
- file hash,
- maximum size setting.

Store local files under a configurable uploads path. Prepare a storage adapter for future hosted object storage.

---

# 24. DASHBOARD

Create an accurate, modern dashboard.

Cards:
- total active projects,
- total blocks,
- total floors,
- total legal units,
- total apartments,
- total legal shops,
- multi-level shops,
- available,
- reserved,
- sold,
- rented,
- blocked,
- total sales by currency,
- total sale receipts by currency,
- sale receivables by currency,
- monthly rent due,
- monthly rent received,
- rent outstanding,
- expenses,
- purchases,
- cash in,
- cash out,
- cash balance,
- supplier payables,
- customer receivables,
- employee liabilities,
- partner balances.

Charts:
- sales receipts over time,
- rental income over time,
- expenses by category,
- purchase cost by item/category,
- unit status,
- money in/out by currency.

Lists:
- recent receipts,
- recent sales,
- recent rentals,
- late rent,
- contracts ending soon,
- unpaid customers,
- unpaid suppliers,
- locked users,
- backup status.

All dashboard values must link to filtered detail pages.

---

# 25. REPORTS

Every report must support relevant filters:
- start date,
- end date,
- project,
- layout version,
- block,
- floor,
- unit,
- unit type,
- party/customer,
- status,
- currency,
- user,
- document number.

Required reports:

## Project summary
- total block groups,
- blocks,
- floors,
- apartments,
- legal shops,
- shop level-parts,
- parking,
- restaurant,
- clinic,
- supermarket,
- mosque,
- other units,
- sold,
- available,
- rented,
- reserved,
- blocked.

## Unit availability
- block-wise map,
- floor-wise map,
- unit status colors,
- legal shop versus unit parts,
- printable.

## Sales
- units sold,
- units remaining,
- sold by block/floor/type,
- total contract value,
- received,
- remaining,
- fully paid,
- outstanding customers,
- customer ledger,
- installments,
- cancellations,
- date range.

## Rental
- active contracts,
- expected rent,
- received,
- outstanding,
- late periods,
- advance credits,
- ended contracts,
- ending soon,
- tenant ledger.

## Purchases
- supplier,
- item,
- quantity/unit,
- total,
- paid,
- outstanding,
- returns,
- stock balance.

## Expenses
- category,
- project,
- daily/weekly/monthly/yearly,
- combined categories.

## Journal/cash
- Money In,
- Money Out,
- balance by cash account,
- separate currency totals,
- source-module breakdown.

## Customer/party aging
- receivables,
- payables,
- aging buckets,
- party type,
- currency.

## Employees
- attendance,
- wages earned,
- payments,
- employee debt,
- company payable,
- active/inactive.

## Exchange
- each dealer,
- each currency,
- exchanges,
- rates,
- fees,
- balances.

## Partners
- contribution,
- withdrawal,
- profit/loss,
- distribution,
- remaining entitlement.

## General company report
This is the main report and must combine:
- purchases,
- expenses,
- individual/market customer activity,
- supplier activity,
- exchange activity,
- sales,
- shop sales,
- rental,
- employees,
- projects,
- partners/investors,
- all Money In,
- all Money Out,
- balance by currency,
- receivables,
- payables,
- sold/remaining unit summary.

Support:
- daily,
- weekly,
- monthly,
- annual,
- custom period,
- print,
- PDF,
- Excel.

---

# 26. PRINTING, PDF, AND EXCEL

Create print layouts that work in RTL and use Beheij Zar.

Required printable documents:
- daily journal,
- expense ledger,
- customer ledger,
- supplier ledger,
- exchange ledger,
- employee ledger,
- Haji/partner ledger,
- sale contract,
- sale receipt,
- installment receipt,
- rental contract,
- rent receipt,
- purchase invoice/ledger,
- purchase return bill,
- project summary,
- unit availability,
- general company report.

Requirements:
- A4 and half-A4 where appropriate,
- logo and company title,
- company contact information at footer,
- exact print timestamp,
- Jalali and Gregorian dates,
- page number,
- repeat table headers on new pages,
- proper RTL columns,
- no clipped text,
- no browser navigation in print,
- predictable margins.

PDF:
- generate a reliable printable/PDF view.
- If server-side PDF is used, use an open-source solution.
- Do not depend on a paid service.

Excel:
- real structured workbook,
- numeric cells remain numeric,
- date and currency columns,
- totals,
- filters,
- sheet title,
- no screenshot-based export.

---

# 27. API AND DATA-INTEGRITY RULES

Create versioned routes, e.g. `/api/v1`.

Use:
- controllers,
- services,
- repositories,
- validators,
- transaction boundaries,
- authorization policies.

Important constraints:
- unique project/block/floor/unit code within scope,
- one active sale per unit,
- rental date overlap constraint enforced in service and transaction,
- one attendance row per employee/date,
- one posting per source action,
- receipt number unique,
- contract number unique,
- return quantity cannot exceed returnable quantity,
- payment amount positive,
- balance calculated, not trusted from client,
- unit status derived and synchronized safely,
- cannot delete referenced master data,
- closing periods prevent unauthorized backdated changes,
- all reversals linked.

Use database migrations. Do not rely on automatic schema sync in production.

---

# 28. AUDIT LOG

Audit:
- login,
- failed login,
- user lock/unlock,
- create,
- update,
- post,
- approve,
- payment,
- reverse,
- delete draft,
- restore,
- backup,
- setting change,
- export of sensitive report.

Audit entry:
- user,
- action,
- entity type,
- entity ID,
- before JSON,
- after JSON,
- IP/device/session if available,
- date/time,
- reason.

Audit log is read-only to normal users.

---

# 29. BACKUP, RESTORE, AND RECOVERY

Create:
- manual backup button,
- automatic daily backup,
- configurable retention,
- backup history,
- download/copy backup,
- restore workflow,
- restore confirmation,
- pre-restore safety backup,
- integrity check after restore.

For SQLite:
- use safe database checkpoint/copy procedure,
- include uploads manifest.

For MySQL:
- document dump/restore commands.

Create:
- `RUNBOOK_BACKUP_RESTORE.md`
- `RUNBOOK_RELEASE_ROLLBACK.md`
- `RUNBOOK_AUTH_RECOVERY.md`

Show last successful backup on dashboard.

---

# 30. PERFORMANCE AND QUALITY

Target:
- normal list/filter response under 2 seconds for expected office data,
- pagination,
- indexed search columns,
- no N+1 report queries,
- lazy-loaded routes,
- error boundaries,
- skeleton/loading states,
- clear empty states,
- accessible labels,
- keyboard navigation,
- stable RTL layout.

Use:
- linting,
- formatting,
- strict TypeScript,
- no `any` unless justified,
- centralized constants/enums,
- reusable calculations,
- unit tests,
- integration tests.

---

# 31. REQUIRED TESTS

Create automated tests for at least:

1. Three failed login attempts lock the account.
2. Password reset/recovery path.
3. Project layout draft can change before publication.
4. Published unit cannot be structurally deleted after transaction.
5. 14 floors × 13 units generates 182 residential units.
6. A two-level shop remains one legal unit with two parts.
7. Same unit cannot be sold twice.
8. Sold unit cannot be rented.
9. Rental periods cannot overlap.
10. Sale payment recalculates remaining balance.
11. Overpayment is rejected unless authorized.
12. Authorized overpayment becomes customer credit.
13. Reversing a receipt recalculates balance.
14. Rent payment allocates to selected month.
15. Early rental termination calculates used days and payable amount.
16. Purchase increases stock.
17. Purchase return decreases stock and supplier payable.
18. Return above available quantity is rejected.
19. Supplier ledger updates automatically.
20. Expense posts once to journal.
21. Duplicate request/idempotency key does not duplicate transaction.
22. Attendance cannot duplicate employee/date.
23. Absent daily worker earns zero for that day, not a negative wage.
24. Employee overpayment becomes employee debt.
25. Separate currencies are never added together.
26. Exchange transaction creates correct two-currency legs.
27. Partner percentages validate to 100%.
28. General report matches module and journal totals.
29. Posted transaction cannot be silently hard-deleted.
30. Backup can be created and restore validation succeeds.
31. Print route renders without clipped RTL text.
32. Role permission denies unauthorized action.

---

# 32. ACCEPTANCE SCENARIOS

Implement and verify these user journeys:

## Scenario A — Configure project
- Create project.
- Create draft layout.
- Add a block.
- Generate ground commercial level.
- Generate 14 residential floors.
- Generate 13 apartments on each residential floor.
- Confirm 182 residential units.
- Add one-level and two-level shops.
- Publish layout.

## Scenario B — Sell apartment by installments
- Register customer.
- Select available apartment.
- Create sale.
- Record first payment.
- Unit becomes Sold.
- Receipt prints.
- Customer ledger shows remaining.
- Record second and final payments.
- Sale becomes Fully Paid.
- General report and journal match.

## Scenario C — Rent shop
- Register tenant.
- Select rentable shop.
- Create contract.
- Generate rent schedule.
- Receive payment for a selected month.
- Show next unpaid month.
- End contract early.
- Calculate days/months/payable/paid/balance.
- Release unit correctly.

## Scenario D — Purchase and return material
- Register supplier.
- Purchase cement and steel.
- Inventory increases.
- Supplier payable appears.
- Pay part of supplier balance.
- Return part of material.
- Return bill prints.
- Inventory, supplier ledger, journal, and reports update once.

## Scenario E — Employee
- Register daily worker.
- Add documents.
- Mark present/absent.
- Earn wages only for present days.
- Pay advance.
- Show employee/company balance.
- Close month.
- Print ledger.

## Scenario F — Partner
- Register two partners.
- Record land/cash contributions.
- Configure profit split.
- Record withdrawals.
- Run cash-basis and accrual-basis reports.
- Approve a proposed distribution.
- Print partner statements.

---

# 33. REQUIRED DELIVERABLES

Create and keep current:

- complete source code,
- database migrations,
- seeders,
- optional demo seed command separate from production,
- `.env.example`,
- `README.md`,
- `LOCAL_INSTALL_WINDOWS.md`,
- `LOCAL_INSTALL_LINUX.md`,
- `DEPLOYMENT.md`,
- `RUNBOOK_BACKUP_RESTORE.md`,
- `RUNBOOK_RELEASE_ROLLBACK.md`,
- `RUNBOOK_AUTH_RECOVERY.md`,
- `REQUIREMENTS_TRACEABILITY.md`,
- `ASSUMPTIONS.md`,
- `ACCEPTANCE_TESTS.md`,
- `API_REFERENCE.md`,
- `DATABASE_SCHEMA.md`,
- `PROJECT_STATUS.md`.

Scripts:
- install,
- dev,
- build,
- start,
- migrate,
- seed-admin,
- test,
- lint,
- backup,
- restore,
- create-release.

Provide a first-run command that creates the first Super Admin securely.

---

# 34. IMPLEMENTATION ORDER

Execute these phases without waiting for confirmation:

1. Inspect files/template and write requirements traceability.
2. Establish monorepo and environment validation.
3. Design database and migrations.
4. Implement authentication, roles, permissions, and audit.
5. Implement settings/company/currency/numbering.
6. Implement central posting engine.
7. Implement parties and documents.
8. Implement project layout versioning and unit map.
9. Implement purchases, inventory, supplier ledger, and returns.
10. Implement expenses and daily journal.
11. Implement sales and receipts.
12. Implement shops/commercial unit workflow.
13. Implement rental and schedules.
14. Implement exchange dealer module.
15. Implement employee attendance and ledger.
16. Implement partners/Haji ledgers and profit/loss.
17. Implement dashboard and all reports.
18. Implement print/PDF/Excel.
19. Implement backup/restore.
20. Add automated tests.
21. Remove template demo code and dead dependencies.
22. Run migrations, tests, lint, and production build.
23. Fix all errors.
24. Update documentation and final status.

After each phase update `PROJECT_STATUS.md` with:
- completed,
- remaining,
- known issue,
- test result.

Do not mark a module complete if it is only a UI mockup.

---

# 35. DEFINITION OF DONE

The project is complete only when:

- the app starts successfully,
- the database migrates cleanly,
- first Super Admin can be created,
- all navigation routes work,
- all modules in this prompt are functional,
- all calculations are server-validated,
- all financial modules post to the central journal,
- duplicate sale/payment/posting protections work,
- project layout is dynamic,
- current provisional 15-level/182-unit configuration can be created through the UI,
- one-level and multi-level shops work,
- sale and rental conflict rules work,
- supplier returns work,
- employee and partner ledgers work,
- reports reconcile,
- print/PDF/Excel work,
- backup and restore work,
- role permissions work,
- audit logs work,
- no fake data remains,
- no template demo pages remain,
- lint passes,
- tests pass,
- production build passes,
- documentation is complete.

At the end, provide a concise final report containing:
- architecture,
- completed modules,
- database status,
- default local startup steps,
- admin creation command,
- test results,
- known assumptions,
- known limitations,
- exact next command to run.

Begin now by inspecting the uploaded files and existing repository. Then implement the entire system according to this contract.