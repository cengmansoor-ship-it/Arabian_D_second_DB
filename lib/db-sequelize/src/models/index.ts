import { User } from "./User";
import { Role } from "./Role";
import { Permission } from "./Permission";
import { RolePermission } from "./RolePermission";
import { UserRole } from "./UserRole";
import { AuditLog } from "./AuditLog";
import { Currency } from "./Currency";
import { CompanySetting } from "./CompanySetting";
import { DocumentSequence } from "./DocumentSequence";
import { Project } from "./Project";
import { BlockGroup } from "./BlockGroup";
import { Block } from "./Block";
import { Floor } from "./Floor";
import { UnitType } from "./UnitType";
import { Unit, MANUALLY_SETTABLE_UNIT_STATUSES } from "./Unit";
import { Account } from "./Account";
import { CashAccount } from "./CashAccount";
import { JournalTransaction } from "./JournalTransaction";
import { JournalLine } from "./JournalLine";
import { PostingLink } from "./PostingLink";
import { FiscalPeriod } from "./FiscalPeriod";
import { Party } from "./Party";
import { PartyRole } from "./PartyRole";
import { Sale } from "./Sale";
import { SaleReceipt } from "./SaleReceipt";
import { SaleCredit } from "./SaleCredit";
export type { UnitStatus, UnitPurpose } from "./Unit";
export type { ProjectStatus } from "./Project";
export type { FloorType } from "./Floor";
export type { AccountType } from "./Account";
export type { JournalDirection, PartyType as JournalPartyType } from "./JournalLine";
export type { PartyType } from "./Party";
export type { SaleStatus } from "./Sale";

// Associations
User.belongsToMany(Role, { through: UserRole, foreignKey: "userId", otherKey: "roleId", as: "roles" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId", otherKey: "userId", as: "users" });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: "roleId", otherKey: "permissionId", as: "permissions" });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: "permissionId", otherKey: "roleId", as: "roles" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

Project.hasMany(BlockGroup, { foreignKey: "projectId", as: "blockGroups" });
Project.hasMany(Block, { foreignKey: "projectId", as: "blocks" });
BlockGroup.belongsTo(Project, { foreignKey: "projectId", as: "project" });
BlockGroup.hasMany(Block, { foreignKey: "blockGroupId", as: "blocks" });
Block.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Block.belongsTo(BlockGroup, { foreignKey: "blockGroupId", as: "blockGroup" });
Block.hasMany(Floor, { foreignKey: "blockId", as: "floors" });
Floor.belongsTo(Block, { foreignKey: "blockId", as: "block" });
Floor.hasMany(Unit, { foreignKey: "floorId", as: "units" });
Unit.belongsTo(Floor, { foreignKey: "floorId", as: "floor" });
Unit.belongsTo(UnitType, { foreignKey: "unitTypeId", as: "unitType" });
UnitType.hasMany(Unit, { foreignKey: "unitTypeId", as: "units" });

JournalTransaction.hasMany(JournalLine, { foreignKey: "transactionId", as: "lines" });
JournalLine.belongsTo(JournalTransaction, { foreignKey: "transactionId", as: "transaction" });
JournalLine.belongsTo(Account, { foreignKey: "accountId", as: "account" });
Account.hasMany(JournalLine, { foreignKey: "accountId", as: "lines" });
CashAccount.belongsTo(Account, { foreignKey: "accountId", as: "account" });
PostingLink.belongsTo(JournalTransaction, { foreignKey: "transactionId", as: "transaction" });
JournalTransaction.belongsTo(JournalTransaction, { foreignKey: "reversalOfId", as: "reversalOf" });

Party.hasMany(PartyRole, { foreignKey: "partyId", as: "roles" });
PartyRole.belongsTo(Party, { foreignKey: "partyId", as: "party" });

Sale.belongsTo(Unit, { foreignKey: "unitId", as: "unit" });
Sale.belongsTo(Party, { foreignKey: "partyId", as: "party" });
Unit.hasMany(Sale, { foreignKey: "unitId", as: "sales" });
Party.hasMany(Sale, { foreignKey: "partyId", as: "sales" });
Sale.hasMany(SaleReceipt, { foreignKey: "saleId", as: "receipts" });
SaleReceipt.belongsTo(Sale, { foreignKey: "saleId", as: "sale" });
SaleReceipt.belongsTo(CashAccount, { foreignKey: "cashAccountId", as: "cashAccount" });
SaleCredit.belongsTo(Party, { foreignKey: "partyId", as: "party" });
SaleCredit.belongsTo(Sale, { foreignKey: "sourceSaleId", as: "sourceSale" });

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
  Project,
  BlockGroup,
  Block,
  Floor,
  UnitType,
  Unit,
  MANUALLY_SETTABLE_UNIT_STATUSES,
  Account,
  CashAccount,
  JournalTransaction,
  JournalLine,
  PostingLink,
  FiscalPeriod,
  Party,
  PartyRole,
  Sale,
  SaleReceipt,
  SaleCredit,
};
