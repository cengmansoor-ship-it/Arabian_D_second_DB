# Template Visual Mapping — Project / Block / Floor / Unit Hierarchy

Maps the required residential structure (Section A/B, 10 blocks / 60 floors / 270 houses) to the
actual database records and UI screens that expose it.

## Database → UI mapping

| Concept | Table | Key fields | UI screen | Notes |
|---|---|---|---|---|
| Project | `projects` | `id`, `name`, `code`, `status` | `/projects` (ProjectsPage), `/projects/:id` (ProjectDetailPage) | "Arabian D Residence" (code `ARB`) is the seeded main project. |
| Block | `blocks` | `id`, `projectId`, `code`, `name`, `order` | `/projects/:id` — "New Block" form + block cards | Unique on `(projectId, code)`. |
| Floor | `floors` | `id`, `blockId`, `levelNumber`, `name`, `floorType` | Inline "+ Floor" form inside each block card | Unique on `(blockId, levelNumber)`. |
| Unit (house/shop/etc.) | `units` | `id`, `floorId`, `unitTypeId`, `unitNumber`, `status`, `purpose`, `areaSqm` | Inline "+ Unit" form inside each floor row; unit buttons open an edit modal | Unique on `(floorId, unitNumber)`. `unitTypeId` selects Apartment/Shop/Parking/Mosque/Supermarket/Office/etc. from `unit_types`. |
| Unit type catalogue | `unit_types` | `id`, `name`, `isActive` | `/unit-types` (UnitTypesPage) | Seeded with Apartment, Shop, Parking, Restaurant, Clinic, Supermarket, Mosque, Office, Storage, Other, Other Commercial — admins can add more, which immediately become selectable when creating a unit. |

## Required seed structure (idempotent, `lib/db-sequelize/src/seed.ts::seedResidentialStructure`)

- Section A: blocks `A1`–`A5`, 6 floors each, 4 units/floor → 120 units.
- Section B: blocks `B1`–`B5`, 6 floors each, 5 units/floor → 150 units.
- Total: **10 blocks, 60 floors, 270 units** — verified against the running dev DB via `PRAGMA`/`SELECT COUNT(*)` after two consecutive app boots (second boot produced no new rows, confirming idempotency).
- Unit numbering pattern: `<blockCode>-<floor><seq2>`, e.g. `A1-101` = Block A1, Floor 1, unit 01.

## Dynamic CRUD (not hardcoded)

All levels are created/edited through the same generic API + UI, so administrators can add
**future** projects, blocks, floors, and any unit type (houses, shops, parking, mosques,
supermarkets, or other facilities) without code changes:

- `POST /api/projects`, `PUT /api/projects/:id`
- `POST /api/projects/:id/blocks`, `PUT /api/projects/:id/blocks/:blockId`
- `POST /api/projects/:id/blocks/:blockId/floors`
- `POST /api/projects/:id/blocks/:blockId/floors/:floorId/units`, `PUT /api/units/:id`
- `GET /api/projects/:id/unit-map` — nested Block → Floor → Unit tree consumed by `ProjectDetailPage.tsx`.

All write routes require the `projects.manage` permission (RBAC via `requirePermission`).

## Responsive / RTL

The app is `dir="rtl"` end-to-end (Pashto-first UI). `ProjectDetailPage` block/floor/unit cards use
CSS grid with `auto-fill`/`minmax` sizing so they reflow to a single column on narrow (mobile)
viewports instead of overflowing; verified visually at desktop and mobile widths.
