import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "../connection";

export class DailyCashEntry extends Model<InferAttributes<DailyCashEntry>, InferCreationAttributes<DailyCashEntry>> {
  declare id: CreationOptional<number>;
  declare entryDate: string; // DATEONLY YYYY-MM-DD
  declare currencyCode: string; // AFN | USD | PKR
  declare description: string;
  declare partyId: CreationOptional<number | null>;
  declare amountIn: CreationOptional<string | null>; // جمع — cash received
  declare amountOut: CreationOptional<string | null>; // رسیدګی — cash paid out
  declare journalTransactionId: CreationOptional<number | null>;
  declare voidedAt: CreationOptional<Date | null>;
  declare voidReason: CreationOptional<string | null>;
  declare createdByUserId: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DailyCashEntry.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "DailyCashEntry", tableName: "daily_cash_entries", timestamps: true },
);
