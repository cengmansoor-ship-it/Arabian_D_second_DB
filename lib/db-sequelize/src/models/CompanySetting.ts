import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "../connection";

export class CompanySetting extends Model<InferAttributes<CompanySetting>, InferCreationAttributes<CompanySetting>> {
  declare id: CreationOptional<number>;
  declare companyName: string;
  declare baseCurrencyCode: CreationOptional<string>;
  declare fiscalYearStartMonth: CreationOptional<number>;
  declare locale: CreationOptional<string>;
  declare logoUrl: CreationOptional<string | null>;
  declare address: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare whatsapp: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare website: CreationOptional<string | null>;
}

CompanySetting.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: { type: DataTypes.STRING(128), allowNull: false, defaultValue: "Arabian D Residence" },
    baseCurrencyCode: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "AFN" },
    fiscalYearStartMonth: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    locale: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "ps" },
    logoUrl: { type: DataTypes.STRING(512), allowNull: true },
    address: { type: DataTypes.STRING(512), allowNull: true },
    phone: { type: DataTypes.STRING(64), allowNull: true },
    whatsapp: { type: DataTypes.STRING(64), allowNull: true },
    email: { type: DataTypes.STRING(128), allowNull: true },
    website: { type: DataTypes.STRING(256), allowNull: true },
  },
  { sequelize, modelName: "CompanySetting", tableName: "company_settings", timestamps: false },
);
