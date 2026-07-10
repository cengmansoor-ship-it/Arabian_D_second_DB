import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type BelongsToManyAddAssociationMixin,
  type BelongsToManyGetAssociationsMixin,
} from "sequelize";
import { sequelize } from "../connection";
import type { Role } from "./Role";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare fullName: string;
  declare passwordHash: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare addRole: BelongsToManyAddAssociationMixin<Role, number>;
  declare getRoles: BelongsToManyGetAssociationsMixin<Role>;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(128), allowNull: false },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "User", tableName: "users" },
);
