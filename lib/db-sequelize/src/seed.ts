import { sequelize } from "./connection";
import { User, Role, Permission, CompanySetting, Currency, DocumentSequence } from "./models";
import { hashPassword } from "./auth";

const CORE_PERMISSIONS = [
  "users.manage",
  "roles.manage",
  "settings.manage",
  "accounting.manage",
  "sales.manage",
  "rentals.manage",
  "purchases.manage",
  "hr.manage",
  "reports.view",
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
}
