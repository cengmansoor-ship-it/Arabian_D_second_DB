# TEMPLATE USAGE REPORT

## What "the template" is, per the project's own records

`ASSUMPTIONS.md` (§A-1) documents that the originally-uploaded template (`02_TEMPLATE/Tenplate.zip`) was the **FlareLine Flutter/Dart Admin Dashboard** — a different framework than the required React stack. The recorded decision was: **discard the Flutter code entirely**, and instead build a clean React frontend using FlareLine's **visual language only** (sidebar layout, card styles, table patterns, badge styles, color system) as a non-code reference. No FlareLine source files, assets, or components were ever copied into `artifacts/web`.

Separately (in an earlier, unrelated task in this same project's history, not part of this audit's PDF-driven scope), the visual styling was further updated to reference a second uploaded project ("KW" — a Kandahar University WMS built on the TailAdmin React/Tailwind template), by re-deriving the CSS custom-property palette and rebuilding the Login page and sidebar shell to match TailAdmin's visual patterns. This, too, was a **visual-language port**, not a code/component import — no TailAdmin or KW source files were copied into `artifacts/web` either.

**Conclusion: there is no template whose actual code is reused.** "Template usage" in this project has only ever meant "visual language reference," which is a legitimate, documented decision (§A-1), not an omission — but it also means questions like "which template files were used" have no applicable literal answer; the evaluation below instead looks at **visual/structural consistency**, since that's what the recorded decision promised to deliver.

## Evidence of visual consistency across the app

- **Design tokens are centralized**: `artifacts/web/src/index.css` defines CSS custom properties for the full palette (primary blue, navy sidebar background, gray scale, status colors), border radii, and shared utility classes (`.card`, `.btn`, `.form-input`, `.form-select`, `.fl-table`).
- **Grep confirms only one hardcoded old-palette hex reference remained** outside these tokens (a chart `COLORS` array in `DashboardPage.tsx`), which has since been corrected to reference the current palette. No other hardcoded hex colors bypassing the token system were found in the 12 page files.
- All 12 existing pages (Dashboard, Settings, Projects, ProjectDetail, UnitTypes, Parties, PartyDetail, Journal, CashAccounts, Users, Roles, AuditLog) consume the shared `.card`/`.btn`/`.form-input`/`.fl-table` classes rather than page-specific styling, so they inherit the same look automatically.
- **Sidebar and Login page** were explicitly rebuilt to mirror the TailAdmin-style patterns (circular logo badge, pill-shaped nav items, split-screen branded login) — confirmed by reading the current source of `AppShell.tsx` and `LoginPage.tsx`.
- **RTL layout**: confirmed present (`dir="rtl"` on the root layout and Pashto hardcoded strings throughout) and consistent across all pages, since it's applied once at the shell/App level, not per-page.
- **Mobile/responsive layout**: not deeply audited (out of scope for the PDF-driven audit and not explicitly requested); a quick pass during the UI click-through test used a standard desktop viewport only. **NOT TESTED at other breakpoints.**

## Estimated template-usage percentage

Since no literal template code exists to "use," the more meaningful metric is: **of the 12 existing pages, what fraction visually and structurally follows the single shared design system (tokens + shared components) rather than ad hoc styling?**

- **~100% of existing pages** consume the shared CSS variables and utility classes (verified by the earlier grep sweep + component review) — no page was found hand-rolling its own competing style system.
- This is a narrow claim: it says the *existing* 12 pages are internally consistent with each other, **not** that they match any specific external template pixel-for-pixel, and **not** that the still-missing modules (Sales, Rentals, Purchases, Expenses, Exchange, HR, Partners, Reports — see `REMAINING_WORK.md`) follow it, since those pages don't exist yet to evaluate.

## Explicit file-level evidence

| Claim | File(s) | Evidence |
|---|---|---|
| Palette/tokens centralized | `artifacts/web/src/index.css` | CSS custom properties for brand/gray/status colors, radii |
| Shared component classes reused everywhere | all 12 page files under `artifacts/web/src/pages/` | grep for `.card`/`.btn`/`.form-input`/`.fl-table` usage across pages |
| Sidebar matches TailAdmin visual pattern | `artifacts/web/src/components/AppShell.tsx` | circular logo, pill nav items, translucent active/hover states |
| Login matches TailAdmin visual pattern | `artifacts/web/src/pages/LoginPage.tsx` | split-screen RTL layout, branded panel, show/hide password toggle |
| Original Flutter template explicitly discarded | `ASSUMPTIONS.md` §A-1 | recorded decision, dated 2026-07-10 |
