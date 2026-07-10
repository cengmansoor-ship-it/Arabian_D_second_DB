import { User } from "./User";
import { Role } from "./Role";
import { Permission } from "./Permission";
import { RolePermission } from "./RolePermission";
import { UserRole } from "./UserRole";
import { AuditLog } from "./AuditLog";
import { Currency } from "./Currency";
import { CompanySetting } from "./CompanySetting";
import { DocumentSequence } from "./DocumentSequence";

// Associations
User.belongsToMany(Role, { through: UserRole, foreignKey: "userId", otherKey: "roleId", as: "roles" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId", otherKey: "userId", as: "users" });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: "roleId", otherKey: "permissionId", as: "permissions" });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: "permissionId", otherKey: "roleId", as: "roles" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  AuditLog,
  Currency,
  CompanySetting,
  DocumentSequence,
};
