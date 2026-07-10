import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "../connection";

export class CompanySetting extends Model<InferAttributes<CompanySetting>, InferCreationAttributes<CompanySetting>> {
  declare id: CreationOptional<number>;
  declare companyName: string;
  declare baseCurrencyCode: CreationOptional<string>;
  declare fiscalYearStartMonth: CreationOptional<number>;
  declare locale: CreationOptional<string>;
}

CompanySetting.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "Arabian D Residence" },
    baseCurrencyCode: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "AFN" },
    fiscalYearStartMonth: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    locale: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "ps" },
  },
  { sequelize, modelName: "CompanySetting", tableName: "company_settings", timestamps: false },
);
