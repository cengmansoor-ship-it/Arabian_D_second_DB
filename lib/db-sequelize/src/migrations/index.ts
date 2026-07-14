import { defineMigration } from "./runner";
import "./001-user-lockout-fields";
import "./002-sale-credit-void-fields";
import "./003-sale-receipt-balance-fields";
import "./004-company-settings-contact-fields";
import "./005-daily-cash-entries";

export { runMigrations } from "./runner";
export { defineMigration };
