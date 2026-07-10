import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "../connection";

/** Records an overpayment on a sale as standing credit for the party, usable for future receipts. */
export class SaleCredit extends Model<InferAttributes<SaleCredit>, InferCreationAttributes<SaleCredit>> {
  declare id: CreationOptional<number>;
  declare partyId: number;
  declare sourceSaleId: number;
  declare currencyCode: string;
  declare amount: string;
  declare notes: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

SaleCredit.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    partyId: { type: DataTypes.INTEGER, allowNull: false },
    sourceSaleId: { type: DataTypes.INTEGER, allowNull: false },
    currencyCode: { type: DataTypes.STRING(8), allowNull: false },
    amount: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  { sequelize, modelName: "SaleCredit", tableName: "sale_credits", timestamps: true, updatedAt: false },
);
