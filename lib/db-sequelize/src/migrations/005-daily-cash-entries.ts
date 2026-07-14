import { DataTypes } from "sequelize";
import { defineMigration } from "./runner";

defineMigration({
  name: "005-daily-cash-entries",
  async up({ queryInterface }) {
    await queryInterface.createTable("daily_cash_entries", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      entryDate: { type: DataTypes.DATEONLY, allowNull: false, field: "entry_date" },
      currencyCode: { type: DataTypes.STRING(8), allowNull: false, field: "currency_code" },
      description: { type: DataTypes.TEXT, allowNull: false },
      partyId: { type: DataTypes.INTEGER, allowNull: true, field: "party_id" },
      amountIn: { type: DataTypes.DECIMAL(20, 4), allowNull: true, field: "amount_in" },
      amountOut: { type: DataTypes.DECIMAL(20, 4), allowNull: true, field: "amount_out" },
      journalTransactionId: { type: DataTypes.INTEGER, allowNull: true, field: "journal_transaction_id" },
      voidedAt: { type: DataTypes.DATE, allowNull: true, field: "voided_at" },
      voidReason: { type: DataTypes.TEXT, allowNull: true, field: "void_reason" },
      createdByUserId: { type: DataTypes.INTEGER, allowNull: true, field: "created_by_user_id" },
      createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
      updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" },
    });
    await queryInterface.addIndex("daily_cash_entries", ["entry_date", "currency_code"], { name: "idx_dce_date_cur" });
  },
  async down({ queryInterface }) {
    await queryInterface.dropTable("daily_cash_entries");
  },
});
