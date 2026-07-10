const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, (data && data.error) || res.statusText);
  }

  return data as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
};

export interface CurrentUser {
  id: number;
  username: string;
  fullName: string;
  roles: string[];
}

export interface CompanySettings {
  id: number;
  companyName: string;
  baseCurrencyCode: string;
  fiscalYearStartMonth: number;
  locale: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  isBase: boolean;
}

export interface ManagedUser {
  id: number;
  username: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface Permission {
  id: number;
  key: string;
  description: string | null;
}

export interface AuditLogEntry {
  id: number;
  username: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export type ProjectStatus = "draft" | "active" | "on_hold" | "completed" | "archived";

export interface Project {
  id: number;
  name: string;
  code: string;
  status: ProjectStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockGroup {
  id: number;
  projectId: number;
  name: string;
  order: number;
}

export interface Block {
  id: number;
  projectId: number;
  blockGroupId: number | null;
  name: string;
  code: string;
  order: number;
  notes: string | null;
}

export type FloorType = "basement" | "ground" | "mezzanine" | "residential" | "commercial" | "parking" | "roof" | "other";

export interface Floor {
  id: number;
  blockId: number;
  name: string;
  levelNumber: number;
  floorType: FloorType;
  order: number;
}

export type UnitStatus = "draft" | "available" | "reserved" | "sold" | "rented" | "blocked" | "cancelled" | "inactive";
export type UnitPurpose = "for_sale" | "for_rent" | "both" | "not_available";

export interface UnitType {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Unit {
  id: number;
  floorId: number;
  unitTypeId: number;
  unitNumber: string;
  status: UnitStatus;
  purpose: UnitPurpose;
  areaSqm: number | null;
  notes: string | null;
  unitType?: UnitType;
}

export interface FloorWithUnits extends Floor {
  units: Unit[];
}

export interface BlockWithFloors extends Block {
  floors: FloorWithUnits[];
}

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
  isActive: boolean;
}

export interface CashAccountEntry {
  id: number;
  name: string;
  currencyCode: string;
  accountId: number;
  isActive: boolean;
  account?: Account;
}

export type JournalDirection = "debit" | "credit";

export interface JournalLineEntry {
  id: number;
  transactionId: number;
  accountId: number;
  currencyCode: string;
  direction: JournalDirection;
  amount: string;
  description: string | null;
  account?: Account;
  transaction?: JournalTransactionEntry;
}

export interface JournalTransactionEntry {
  id: number;
  idempotencyKey: string;
  transactionDate: string;
  memo: string | null;
  isManual: boolean;
  voidedAt: string | null;
  voidReason: string | null;
  reversalOfId: number | null;
  createdAt: string;
  lines: JournalLineEntry[];
}

export type PartyType =
  | "individual_customer"
  | "market_customer"
  | "supplier"
  | "sales_customer"
  | "tenant"
  | "exchange_dealer"
  | "employee"
  | "partner"
  | "other";

export interface Party {
  id: number;
  type: PartyType;
  name: string;
  fatherName: string | null;
  grandfatherName: string | null;
  tazkiraNumber: string | null;
  taxRegNumber: string | null;
  phone1: string | null;
  phone2: string | null;
  address: string | null;
  notes: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartyLedgerResponse {
  party: Party;
  lines: JournalLineEntry[];
  balances: Record<string, { debit: string; credit: string; net: string }>;
}
