# ASSUMPTIONS AND DECISIONS
## Arabian D Residence — Real Estate Management System

**Last updated:** 2026-07-10  
**Status:** Pre-implementation (Phase 0)

All assumptions recorded here are either:
- **SAFE** — the safest configurable default, can be changed by admin without code changes, or
- **REQUIRES CONFIRMATION** — flagged for owner review before that module is built.

---

## A. TEMPLATE / TECHNOLOGY MISMATCH

### A-1 — Uploaded template is Flutter/Dart, not React
**Finding:** The uploaded `02_TEMPLATE/Tenplate.zip` contains the **FlareLine Flutter Admin Dashboard** (Dart/Flutter framework). This is incompatible with the Master Prompt requirement of React + TypeScript + Vite.

**Decision (SAFE):** Discard the Flutter template entirely. Build a clean React + TypeScript + Vite frontend from scratch, using the FlareLine design language (sidebar layout, card styles, table patterns, badge styles, color system) as a **visual reference only**, not as code.

**Reasoning:** The Master Prompt states "If a template exists: preserve only useful layout primitives and components … rebuild navigation for this system." Since the template is in a completely different language, zero code can be reused. The visual patterns are still a valid design reference.

**Action required:** None — proceeding with clean React build. If owner wants a different template, they may upload a React-based one before Phase 2 begins.

---

## B. PROJECT LAYOUT — PROVISIONAL STRUCTURE

### B-1 — Current block/floor/unit counts are provisional (≈70% final)
**Finding:** Master Prompt §2 states the architectural map is approximately 70% complete. The documents describe a provisional structure of:
- 1 building/block → 15 total levels
- Ground level: commercial (shops/restaurant/clinic/supermarket/parking)
- 14 residential floors × 13 apartments = **182 residential units per applicable block**

The older reference documents (A Blocks, B Blocks) show a different layout:
- 10 blocks (A1–A5, B1–B5), 6 floors each, A blocks = 4 per floor, B blocks = 5 per floor → 270 apartments total

**Decision (SAFE):** These older documents are treated as **reference examples only**. The system stores no hardcoded layout. The first-run setup wizard allows the admin to create any project structure. The provisional 15-level/182-unit example will be used as the Acceptance Scenario A test case.

### B-2 — Shop/commercial space count is unconfirmed
**Finding:** The documents mention 28 one-level shops, 28 two-level shops, and a note about 84 commercial level-parts/spaces, but state this is "not fully confirmed."

**Decision (SAFE):** Do not hardcode any shop count. The system models:
- Legal commercial unit (one shop, one restaurant, one clinic, etc.)
- Unit parts (one-level or multi-level, each part records floor, label, area)

Reports will show: legal shop count, single-level count, multi-level count, total occupied commercial level-parts. The admin configures all of this through the layout wizard.

### B-3 — Which blocks have shops vs. not
**Finding:** "Some blocks may have shops; other blocks may not. Some blocks may contain parking, mosque, restaurant, clinic, supermarket, or other facilities."

**Decision (SAFE):** Each block has its own set of floors. Each floor has its own floor type (commercial, residential, parking, etc.). The admin assigns floor types during layout creation. No block is assumed to have or not have shops at code level.

---

## C. DATABASE TECHNOLOGY

### C-1 — Primary database: SQLite (local/offline), future: MySQL
**Master Prompt requirement:** Use Sequelize ORM with dialect configuration.

**Decision (SAFE):** Implement with Sequelize supporting both `sqlite` and `mysql` dialects. Default for development and local office deployment is SQLite. All money fields use `DECIMAL(20,4)`. All quantity fields use `DECIMAL(20,6)`. Exchange rates use `DECIMAL(20,8)`. Never use JavaScript `number` type for money arithmetic — use `decimal.js`.

**Environment variables:**
```
DB_DIALECT=sqlite          # or mysql
SQLITE_PATH=./data/arabian-d.sqlite
# MySQL alternatives:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=arabian_d
DB_USER=
DB_PASSWORD=
```

### C-2 — Existing workspace uses Drizzle ORM with PostgreSQL
**Finding:** The existing monorepo workspace (`lib/db`) is configured with Drizzle ORM and PostgreSQL (not Sequelize/SQLite). The Master Prompt specifies Sequelize with SQLite/MySQL.

**Decision (REQUIRES CONFIRMATION — proceeding with safe default):** The Arabian D Residence application will be built as a **new artifact** in the monorepo. It will NOT reuse the existing `lib/db` PostgreSQL/Drizzle setup. The new API artifact will use its own Sequelize + SQLite setup, consistent with the Master Prompt's local-first, offline-first requirement.

**Reasoning:** The local office computer cannot reliably run PostgreSQL. SQLite meets the offline-first requirement. MySQL is the specified future hosted target. PostgreSQL was not mentioned in any uploaded document.

**If owner later wants PostgreSQL:** The Sequelize dialect can be changed to `postgres` with minimal code change, since business logic is isolated from the ORM layer.

---

## D. AUTHENTICATION

### D-1 — JWT vs. session cookies
**Decision (SAFE):** Use stateless JWT tokens stored in `httpOnly` secure cookies (not `localStorage`). CSRF protection via SameSite=Strict cookie attribute plus CSRF token for state-changing requests. This satisfies both the offline and future hosted requirements.

### D-2 — Password hashing algorithm
**Decision (SAFE):** Use **bcrypt** (cost factor 12) as default. Argon2 is preferred if the runtime supports it without native module issues in the Replit environment. Will attempt Argon2 first; fall back to bcrypt if build fails.

### D-3 — "Forgot password" in offline mode
**Finding:** Local/offline mode may have no email configured.

**Decision (SAFE):** The system will support two recovery paths:
1. Email token reset (when email is configured in Settings)
2. CLI command `node scripts/reset-admin-password.js` documented in `RUNBOOK_AUTH_RECOVERY.md` (for offline/local mode)

The Super Admin can also unlock any user through the Settings → Users screen.

---

## E. CALENDAR & DATES

### E-1 — Jalali date library
**Decision (SAFE):** Use the `jalaali-js` npm package for Jalali ↔ Gregorian conversion. This is a pure JS library with no external API dependency, consistent with the offline-first requirement.

### E-2 — Database date storage
**Decision (SAFE):** All dates stored in the database as Gregorian ISO-8601 strings (not Unix timestamps, not UTC-shifted). Date-only business fields (sale date, contract date, attendance date) stored as `DATEONLY` (YYYY-MM-DD) to prevent timezone shift. Displayed as Jalali in the UI, printed as both Jalali and Gregorian.

### E-3 — Timezone
**Decision (SAFE):** Backend sets `process.env.TZ = 'Asia/Kabul'` at startup and validates it. All `new Date()` calls in business logic use the server timezone. This means the local office computer must also be set to Asia/Kabul timezone — documented in `LOCAL_INSTALL_WINDOWS.md`.

---

## F. BEHEIJ ZAR FONT

### F-1 — Font files not yet uploaded
**Finding:** The `05_FONTS/UPLOAD_FONTS_SEPARATELY.txt` file confirms that `BAHIJ ZAR-REGULAR.TTF` and `BAHIJ ZAR-BOLD.TTF` are separate from the ZIP and must be uploaded independently. They are not present in the repository as of 2026-07-10.

**Decision (SAFE):** The frontend will include a `@font-face` declaration pointing to `assets/fonts/BahijZar-Regular.ttf` and `assets/fonts/BahijZar-Bold.ttf`. Until the owner uploads the actual font files, the system will fall back to `system-ui, Arial, sans-serif` with RTL direction preserved. Once the font files are uploaded to `artifacts/web/public/fonts/`, they will be served without any external request.

**Action required:** Owner must upload `BAHIJ ZAR-REGULAR.TTF` and `BAHIJ ZAR-BOLD.TTF` to the repository. The font files will be placed at `artifacts/web/public/fonts/`.

---

## G. MULTI-CURRENCY

### G-1 — Three default currencies
**Decision (SAFE):** System seeds AFN (Afghani), USD (Dollar), PKR (Pakistani Rupee / Kaldar) as the default currencies. Additional currencies can be added through Settings → Currencies. Each is an independent ledger — totals are never mixed unless a converted-base report is explicitly requested with a stated exchange rate.

### G-2 — Exchange rate storage
**Decision (SAFE):** Exchange rates are stored manually by authorized users. No automatic fetch from external exchange rate APIs. This keeps the system fully offline-capable.

---

## H. COMMERCIAL UNIT NUMBERING

### H-1 — Configurable unit code format
**Decision (SAFE):** Default unit code format: `{PROJECT_CODE}-{BLOCK_CODE}-{FLOOR_NUMBER}-{UNIT_NUMBER}` padded to digits. Example: `ADR-A1-03-012`. The format, separators, padding, and prefix are all configurable per project through Settings → Sequences.

---

## I. PRINT / PDF

### I-1 — PDF generation approach
**Decision (SAFE):** Use the browser's native `window.print()` with CSS `@media print` rules as the primary PDF mechanism. This avoids paid external APIs and works fully offline. Print styles will use RTL-compatible CSS, Beheij Zar font, proper A4 and half-A4 margins, and company header/footer.

Optional server-side PDF can be added later using `puppeteer` (headless Chromium) if needed for batch PDF generation. This will be documented as a future enhancement.

### I-2 — Excel export
**Decision (SAFE):** Use the `exceljs` npm package for server-side Excel workbook generation. Numeric cells remain numeric, date cells use Excel date format. No client-side screenshot export.

---

## J. PRORATION POLICY

### J-1 — Default rental proration
**Decision (SAFE):** Default proration is **30-day commercial month**. Start date inclusive, actual end date inclusive. This is configurable in Settings → Rental. The system clearly shows which policy is active on each rental contract print.

### J-2 — Partial month rent calculation
**Decision (SAFE):** `daily_rate = monthly_rent / 30` (when 30-day policy is active). Partial months at contract end: `payable = full_months × monthly_rent + remaining_days × daily_rate`. This matches the business example in the Shops PDF.

---

## K. BACKUP

### K-1 — SQLite backup method
**Decision (SAFE):** Use SQLite's `VACUUM INTO` or file copy during a write-locked checkpoint for safe hot backup. Backup includes the database file and a manifest of uploaded documents. Backup files are stored in the configured backup folder (`settings.backup_path`, default `./backups/`).

---

## L. EMPLOYEE ATTENDANCE FRIDAY RULE

### L-1 — Friday backfill
**Decision (SAFE):** The "Friday attendance may be entered on Saturday" rule is implemented as a configurable `settings.friday_backfill_allowed = true/false`. When enabled, the attendance entry screen allows selecting the previous Friday's date on Saturday. The actual attendance date is stored as-is (Friday), and the entry timestamp records when it was entered. Disabled by default; admin enables if needed.

---

## M. MONOREPO STRUCTURE

### M-1 — New artifacts vs. existing workspace
**Decision (SAFE):** The Arabian D Residence system will be two new artifacts:
- `artifacts/web` — React + TypeScript + Vite frontend (preview at `/`)
- The existing `artifacts/api-server` will be extended to serve as the backend, OR a new `artifacts/arabian-d-api` will be created if the existing API server structure conflicts.

All new packages will follow the existing `@workspace/` naming convention.

### M-2 — The existing `lib/api-spec`, `lib/api-client-react`, `lib/api-zod`, `lib/db` packages
**Decision (SAFE):** These will be used for the Arabian D system's API contract, codegen, and Zod validation. The `lib/db` package's Drizzle+PostgreSQL setup will NOT be used for the main app data store (see C-2 above), but the Zod schemas from `lib/api-zod` will be reused for request validation.

---

## N. OUTSTANDING QUESTIONS FOR OWNER

The following items require explicit owner confirmation before the relevant modules are built. Development will proceed using the safe defaults noted above. The setup wizard will surface these as configurable options.

| # | Question | Safe Default | Module Affected |
|---|----------|-------------|-----------------|
| N-1 | Exact final block count and layout? (currently ≈70% complete) | Dynamic, admin-configurable | PROJ |
| N-2 | Are there 28 one-level + 28 two-level shops, or a different count? | Dynamic, admin-configurable | SHOP |
| N-3 | Which specific blocks will have shops vs. parking vs. mosque? | Dynamic, admin-configurable | PROJ |
| N-4 | Should the Beheij Zar font files be uploaded before UI build begins? | Fall back to system font | UI |
| N-5 | Email SMTP server available for password reset? (or offline-only?) | CLI recovery only | AUTH |
| N-6 | Fiscal year: starts on what Jalali month/day? | Jalali 1/1 (Hamal 1) | ACCT |
| N-7 | Company official name in Pashto and English? | "Arabian D Residence" | BRAND |
| N-8 | Company phone numbers, email, website, address for print headers? | Placeholder, editable in Settings | BRAND |
| N-9 | Multiple projects to be managed, or only Arabian D Residence? | Multi-project supported, one active | PROJ |
| N-10 | Should the system support Dari language in addition to Pashto and English? | Translation keys prepared, Dari strings TBD | I18N |

---

*This document is updated whenever a new assumption is made. See `REQUIREMENTS_TRACEABILITY.md` for the full requirement-to-implementation mapping.*
