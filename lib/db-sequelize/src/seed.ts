import { sequelize } from "./connection";
import { User, Role, Permission, CompanySetting, Currency, DocumentSequence, UnitType, Account, CashAccount, Project, Block, Floor, Unit } from "./models";
import { hashPassword } from "./auth";
import { runMigrations } from "./migrations";

/**
 * Required baseline residential structure (idempotent):
 * Section A: blocks A1-A5, 6 floors each, 4 houses per floor -> 120 houses
 * Section B: blocks B1-B5, 6 floors each, 5 houses per floor -> 150 houses
 * Total: 10 blocks, 60 floors, 270 houses.
 */
async function seedResidentialStructure(): Promise<void> {
  // Reuse an existing project named "Arabian D Residence" if one already exists (e.g. created
  // manually before this seed existed) instead of creating a second, duplicate project.
  let project = await Project.findOne({ where: { name: "Arabian D Residence" } });
  if (!project) {
    project = await Project.create({
      name: "Arabian D Residence",
      code: "ARD-MAIN",
      status: "active",
      description: "Main residential complex — Sections A and B",
    });
  }

  const apartmentType = await UnitType.findOne({ where: { name: "Apartment" } });
  if (!apartmentType) return; // core unit types seed runs earlier in ensureDatabaseReady; should never happen

  const sections: { prefix: "A" | "B"; count: number; floorsPerBlock: number; unitsPerFloor: number }[] = [
    { prefix: "A", count: 5, floorsPerBlock: 6, unitsPerFloor: 4 },
    { prefix: "B", count: 5, floorsPerBlock: 6, unitsPerFloor: 5 },
  ];

  let blockOrder = 0;
  for (const section of sections) {
    for (let b = 1; b <= section.count; b++) {
      const blockCode = `${section.prefix}${b}`;
      blockOrder += 1;
      const [block] = await Block.findOrCreate({
        where: { projectId: project.id, code: blockCode },
        defaults: { projectId: project.id, code: blockCode, name: `Block ${blockCode}`, order: blockOrder },
      });

      for (let f = 1; f <= section.floorsPerBlock; f++) {
        const [floor] = await Floor.findOrCreate({
          where: { blockId: block.id, levelNumber: f },
          defaults: { blockId: block.id, levelNumber: f, name: `Floor ${f}`, floorType: "residential", order: f },
        });

        for (let u = 1; u <= section.unitsPerFloor; u++) {
          const unitNumber = `${blockCode}-${f}${String(u).padStart(2, "0")}`;
          await Unit.findOrCreate({
            where: { floorId: floor.id, unitNumber },
            defaults: {
              floorId: floor.id,
              unitTypeId: apartmentType.id,
              unitNumber,
              status: "available",
              purpose: "for_sale",
            },
          });
        }
      }
    }
  }
}

const CORE_PERMISSIONS = [
  "users.manage",
  "roles.manage",
  "settings.manage",
  "accounting.manage",
  "projects.manage",
  "sales.manage",
  "rentals.manage",
  "purchases.manage",
  "hr.manage",
  "reports.view",
  "parties.manage",
];

const CORE_UNIT_TYPES = [
  "Apartment",
  "Shop",
  "Parking",
  "Restaurant",
  "Clinic",
  "Supermarket",
  "Mosque",
  "Office",
  "Storage",
  "Other",
  "Other Commercial",
];

const CORE_DOCUMENT_SEQUENCES = [
  { documentType: "sales_contract", prefix: "SC-" },
  { documentType: "rental_contract", prefix: "RC-" },
  { documentType: "receipt", prefix: "RCPT-" },
  { documentType: "purchase_invoice", prefix: "PINV-" },
  { documentType: "expense_voucher", prefix: "EXP-" },
  { documentType: "journal_entry", prefix: "JE-" },
];

/**
 * Ensures the database schema exists and seeds the minimum data required for
 * the system to be usable on first run: an admin role/user, base permissions,
 * base currency, company settings, and document numbering sequences.
 */
export async function ensureDatabaseReady(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
  await runMigrations();

  const [adminRole] = await Role.findOrCreate({
    where: { name: "admin" },
    defaults: { name: "admin", description: "Full system access" },
  });

  for (const key of CORE_PERMISSIONS) {
    const [permission] = await Permission.findOrCreate({ where: { key }, defaults: { key } });
    const existing = await adminRole.hasPermission(permission);
    if (!existing) {
      await adminRole.addPermission(permission);
    }
  }

  await CompanySetting.findOrCreate({
    where: { id: 1 },
    defaults: { companyName: "Arabian D Residence", baseCurrencyCode: "AFN", fiscalYearStartMonth: 1, locale: "ps" },
  });

  await Currency.findOrCreate({ where: { code: "AFN" }, defaults: { code: "AFN", name: "Afghani", isBase: true } });
  await Currency.findOrCreate({ where: { code: "USD" }, defaults: { code: "USD", name: "US Dollar", isBase: false } });
  await Currency.findOrCreate({ where: { code: "PKR" }, defaults: { code: "PKR", name: "Pakistani Rupee", isBase: false } });

  for (const seq of CORE_DOCUMENT_SEQUENCES) {
    await DocumentSequence.findOrCreate({ where: { documentType: seq.documentType }, defaults: { ...seq, nextNumber: 1 } });
  }

  for (const name of CORE_UNIT_TYPES) {
    await UnitType.findOrCreate({ where: { name }, defaults: { name, isActive: true } });
  }

  const coreAccounts: { code: string; name: string; type: "asset" | "liability" | "equity" | "income" | "expense" }[] = [
    { code: "1000", name: "Cash on Hand", type: "asset" },
    { code: "1100", name: "Accounts Receivable", type: "asset" },
    { code: "2000", name: "Accounts Payable", type: "liability" },
    { code: "3000", name: "Owner's Equity", type: "equity" },
    { code: "4000", name: "Sales Revenue", type: "income" },
    { code: "4100", name: "Rental Revenue", type: "income" },
    { code: "5000", name: "General Expenses", type: "expense" },
  ];
  for (const acc of coreAccounts) {
    await Account.findOrCreate({ where: { code: acc.code }, defaults: { ...acc, isSystem: true, isActive: true } });
  }

  const cashAccount = await Account.findOne({ where: { code: "1000" } });
  if (cashAccount) {
    await CashAccount.findOrCreate({
      where: { name: "Main Cash Box (AFN)" },
      defaults: { name: "Main Cash Box (AFN)", currencyCode: "AFN", accountId: cashAccount.id, isActive: true },
    });
  }

  const anyUserExists = (await User.count()) > 0;
  if (!anyUserExists) {
    const isProduction = process.env["NODE_ENV"] === "production";
    const adminUsername = process.env["ADMIN_USERNAME"] || "admin";
    const adminPassword = process.env["ADMIN_PASSWORD"];

    if (!adminPassword && isProduction) {
      throw new Error(
        "No users exist yet and ADMIN_PASSWORD is not set. Set ADMIN_USERNAME/ADMIN_PASSWORD " +
          "environment variables to create the first admin account on boot.",
      );
    }

    if (!adminPassword) {
      // eslint-disable-next-line no-console
      console.warn(
        "[seed] ADMIN_PASSWORD not set — using default admin/admin123 for local development only. " +
          "Set ADMIN_USERNAME/ADMIN_PASSWORD before deploying.",
      );
    }

    const admin = await User.create({
      username: adminUsername,
      fullName: "System Administrator",
      passwordHash: await hashPassword(adminPassword || "admin123"),
      isActive: true,
    });
    await admin.addRole(adminRole);
  }

  await seedResidentialStructure();
}
