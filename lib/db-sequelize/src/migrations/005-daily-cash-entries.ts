import { DataTypes } from "sequelize";
import { defineMigration } from "./runner";

defineMigration({
  name: "005-daily-cash-entries",
  async up({ queryInterface }) {
    await queryInterface.createTable("daily_cash_entries", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      entryDate: { type: DataTypes.DATEONLY, allowNull: false },
      currencyCode: { type: DataTypes.STRING(8), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      partyId: { type: DataTypes.INTEGER, allowNull: true },
      amountIn: { type: DataTypes.DECIMAL(20, 4), allowNull: true },
      amountOut: { type: DataTypes.DECIMAL(20, 4), allowNull: true },
      journalTransactionId: { type: DataTypes.INTEGER, allowNull: true },
      voidedAt: { type: DataTypes.DATE, allowNull: true },
      voidReason: { type: DataTypes.TEXT, allowNull: true },
      createdByUserId: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("daily_cash_entries", ["entryDate", "currencyCode"], { name: "idx_dce_date_cur" });
  },
  async down({ queryInterface }) {
    await queryInterface.dropTable("daily_cash_entries");
  },
});
