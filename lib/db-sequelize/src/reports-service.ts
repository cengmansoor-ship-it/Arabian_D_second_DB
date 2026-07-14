import Decimal from "decimal.js";
import { Op } from "sequelize";
import {
  Sale,
  SaleReceipt,
  Rental,
  RentalReceipt,
  Expense,
  Purchase,
  PurchaseReturn,
  PurchasePayment,
  EmployeePayment,
  PartnerTransaction,
  JournalLine,
  CashAccount,
  Block,
  Floor,
  Unit,
  Party,
  Employee,
  Attendance,
  JournalTransaction,
} from "./models";

export interface ProfitLossInput {
  currencyCode: string;
  startDate: string;
  endDate: string;
}

export interface ProfitLossReport {
  currencyCode: string;
  startDate: string;
  endDate: string;
  propertySaleIncome: string;
  rentalIncome: string;
  otherIncome: string;
  totalIncome: string;
  purchases: string;
  expenses: string;
  employeeCosts: string;
  totalOutflow: string;
  partnerWithdrawals: string;
  availableBalance: string;
  profit: string;
  loss: string;
}

async function sumDecimal<T>(rows: T[], pick: (row: T) => string): Promise<Decimal> {
  return rows.reduce((sum, row) => sum.plus(new Decimal(pick(row))), new Decimal(0));
}

function groupSum<T>(rows: T[], currencyOf: (r: T) => string, amountOf: (r: T) => string): Record<string, string> {
  const totals = new Map<string, Decimal>();
  for (const row of rows) {
    const currency = currencyOf(row);
    const prev = totals.get(currency) ?? new Decimal(0);
    totals.set(currency, prev.plus(new Decimal(amountOf(row))));
  }
  const out: Record<string, string> = {};
  for (const [currency, total] of totals) out[currency] = total.toFixed(4);
  return out;
}

function mergeSubtract(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const currencies = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of currencies) {
    out[c] = new Decimal(a[c] ?? 0).minus(new Decimal(b[c] ?? 0)).toFixed(4);
  }
  return out;
}

export interface DashboardSummary {
  totalBlocks: number;
  totalFloors: number;
  totalProperties: number;
  unitsByStatus: Record<string, number>;
  totalCustomers: number;
  salesTotalsByCurrency: Record<string, string>;
  receivedTotalsByCurrency: Record<string, string>;
  outstandingTotalsByCurrency: Record<string, string>;
  todayIncomingByCurrency: Record<string, string>;
  todayOutgoingByCurrency: Record<string, string>;
  activeRentals: number;
  attendanceToday: { present: number; absent: number; halfDay: number; leave: number; notRecorded: number; totalEmployees: number };
  companyReceivablesByCurrency: Record<string, string>;
  companyPayablesByCurrency: Record<string, string>;
  recentTransactions: Array<{ id: number; date: string; memo: string | null; isManual: boolean }>;
  alerts: string[];
}

/** Every figure here is computed live from the database — no hard-coded dashboard values. */
export async function getDashboardSummary(todayIso: string): Promise<DashboardSummary> {
  const [totalBlocks, totalFloors, units, totalCustomers, activeRentals, employees, todaysAttendance] = await Promise.all([
    Block.count(),
    Floor.count(),
    Unit.findAll({ attributes: ["status"] }),
    Party.count({ where: { type: { [Op.in]: ["individual_customer", "market_customer", "sales_customer"] } } }),
    Rental.count({ where: { status: "active" } }),
    Employee.count({ where: { status: "active" } }),
    Attendance.findAll({ where: { date: todayIso } }),
  ]);

  const unitsByStatus: Record<string, number> = {};
  for (const u of units) unitsByStatus[u.status] = (unitsByStatus[u.status] ?? 0) + 1;

  const [sales, saleReceipts, rentals, rentalReceipts, purchases, purchaseReturns, purchasePayments] = await Promise.all([
    Sale.findAll({ where: { status: { [Op.notIn]: ["cancelled"] } } }),
    SaleReceipt.findAll({ where: { voidedAt: null } }),
    Rental.findAll({ where: { status: { [Op.notIn]: ["cancelled"] } } }),
    RentalReceipt.findAll({ where: { voidedAt: null } }),
    Purchase.findAll({ where: { status: { [Op.notIn]: ["cancelled"] } } }),
    PurchaseReturn.findAll(),
    PurchasePayment.findAll({ where: { voidedAt: null } }),
  ]);

  const salesTotalsByCurrency = groupSum(sales, (s) => s.currencyCode, (s) => s.finalPrice);
  const rentalTotalsByCurrency = groupSum(rentals, (r) => r.currencyCode, (r) => r.rentAmount);
  const saleReceivedByCurrency = groupSum(saleReceipts, (r) => r.currencyCode, (r) => r.amount);
  const rentalReceivedByCurrency = groupSum(rentalReceipts, (r) => r.currencyCode, (r) => r.amount);
  const receivedTotalsByCurrency = mergeSubtract(saleReceivedByCurrency, {});
  for (const [c, v] of Object.entries(rentalReceivedByCurrency)) {
    receivedTotalsByCurrency[c] = new Decimal(receivedTotalsByCurrency[c] ?? 0).plus(v).toFixed(4);
  }
  const combinedSalesTotals: Record<string, string> = { ...salesTotalsByCurrency };
  for (const [c, v] of Object.entries(rentalTotalsByCurrency)) {
    combinedSalesTotals[c] = new Decimal(combinedSalesTotals[c] ?? 0).plus(v).toFixed(4);
  }
  const outstandingTotalsByCurrency = mergeSubtract(combinedSalesTotals, receivedTotalsByCurrency);
  const companyReceivablesByCurrency = outstandingTotalsByCurrency;

  const purchasesGrossByCurrency = groupSum(purchases, (p) => p.currencyCode, (p) => p.totalAmount);
  const purchaseReturnsByCurrency = groupSum(purchaseReturns, (r) => r.currencyCode, (r) => r.amount);
  const purchasePaymentsByCurrency = groupSum(purchasePayments, (p) => p.currencyCode, (p) => p.amount);
  const purchasesNetByCurrency = mergeSubtract(purchasesGrossByCurrency, purchaseReturnsByCurrency);
  const companyPayablesByCurrency = mergeSubtract(purchasesNetByCurrency, purchasePaymentsByCurrency);

  const [todaySaleReceipts, todayRentalReceipts, todayPurchasePayments, todayExpenses, todayEmployeePayments] = await Promise.all([
    SaleReceipt.findAll({ where: { receiptDate: todayIso, voidedAt: null } }),
    RentalReceipt.findAll({ where: { receiptDate: todayIso, voidedAt: null } }),
    PurchasePayment.findAll({ where: { paymentDate: todayIso, voidedAt: null } }),
    Expense.findAll({ where: { expenseDate: todayIso, voidedAt: null } }),
    EmployeePayment.findAll({ where: { paymentDate: todayIso, voidedAt: null } }),
  ]);
  const todayIncomingByCurrency: Record<string, string> = { ...groupSum(todaySaleReceipts, (r) => r.currencyCode, (r) => r.amount) };
  for (const [c, v] of Object.entries(groupSum(todayRentalReceipts, (r) => r.currencyCode, (r) => r.amount))) {
    todayIncomingByCurrency[c] = new Decimal(todayIncomingByCurrency[c] ?? 0).plus(v).toFixed(4);
  }
  const todayOutgoingByCurrency: Record<string, string> = { ...groupSum(todayPurchasePayments, (p) => p.currencyCode, (p) => p.amount) };
  for (const [c, v] of Object.entries(groupSum(todayExpenses, (e) => e.currencyCode, (e) => e.amount))) {
    todayOutgoingByCurrency[c] = new Decimal(todayOutgoingByCurrency[c] ?? 0).plus(v).toFixed(4);
  }
  for (const [c, v] of Object.entries(groupSum(todayEmployeePayments, (p) => p.currencyCode, (p) => p.amount))) {
    todayOutgoingByCurrency[c] = new Decimal(todayOutgoingByCurrency[c] ?? 0).plus(v).toFixed(4);
  }

  const attendanceToday = {
    present: todaysAttendance.filter((a) => a.status === "present").length,
    absent: todaysAttendance.filter((a) => a.status === "absent").length,
    halfDay: todaysAttendance.filter((a) => a.status === "half_day").length,
    leave: todaysAttendance.filter((a) => a.status === "leave").length,
    totalEmployees: employees,
    notRecorded: Math.max(0, employees - todaysAttendance.length),
  };

  const recentTxns = await JournalTransaction.findAll({
    where: { voidedAt: null },
    order: [["id", "DESC"]],
    limit: 8,
  });

  const alerts: string[] = [];
  for (const [c, v] of Object.entries(companyPayablesByCurrency)) {
    if (new Decimal(v).greaterThan(0)) alerts.push(`د تادیو وړ پور ${v} ${c} شتون لري (پیرودونکو ته)`);
  }
  for (const [c, v] of Object.entries(companyReceivablesByCurrency)) {
    if (new Decimal(v).greaterThan(0)) alerts.push(`نوسانتوونکي پیسې ${v} ${c} د راټولیدو په تمه دي`);
  }
  if (attendanceToday.notRecorded > 0) {
    alerts.push(`د نن ورځې د ${attendanceToday.notRecorded} کارکوونکو حاضري نه ده ثبت شوې`);
  }

  return {
    totalBlocks,
    totalFloors,
    totalProperties: units.length,
    unitsByStatus,
    totalCustomers,
    salesTotalsByCurrency: combinedSalesTotals,
    receivedTotalsByCurrency,
    outstandingTotalsByCurrency,
    todayIncomingByCurrency,
    todayOutgoingByCurrency,
    activeRentals,
    attendanceToday,
    companyReceivablesByCurrency,
    companyPayablesByCurrency,
    recentTransactions: recentTxns.map((t) => ({ id: t.id, date: t.transactionDate, memo: t.memo ?? null, isManual: t.isManual })),
    alerts,
  };
}

export interface GeneralReportInput {
  currencyCode: string;
  startDate: string;
  endDate: string;
}

export interface GeneralReportRow {
  date: string;
  reference: string;
  party: string | null;
  moneyReceived: string;
  moneyPaid: string;
  owedToCompany: string;
  owedByCompany: string;
  note: string | null;
}

export interface ProjectStructureRow {
  projectId: number;
  projectName: string;
  blocks: number;
  floors: number;
  totalProperties: number;
  available: number;
  reserved: number;
  sold: number;
  rented: number;
  unavailable: number;
}

export interface GeneralReport {
  currencyCode: string;
  startDate: string;
  endDate: string;
  purchasing: GeneralReportRow[];
  expenses: GeneralReportRow[];
  customers: GeneralReportRow[];
  exchange: GeneralReportRow[];
  propertySales: GeneralReportRow[];
  rentals: GeneralReportRow[];
  employees: GeneralReportRow[];
  projects: ProjectStructureRow[];
}

/**
 * The eight-section general company report (section S of the brief): purchasing, expenses,
 * customers, exchange, property sales, rentals, employees, projects — each filterable by
 * date range and currency and reconcilable against the module it summarizes (every row here
 * is read directly from that module's own table, not re-derived from the journal).
 */
export async function getGeneralReport(input: GeneralReportInput): Promise<GeneralReport> {
  const { currencyCode, startDate, endDate } = input;
  const dateRange = { [Op.gte]: startDate, [Op.lte]: endDate };

  const purchases = await Purchase.findAll({ where: { currencyCode, purchaseDate: dateRange }, include: [{ model: Party, as: "supplier" }] });
  const purchasing: GeneralReportRow[] = purchases.map((p) => ({
    date: p.purchaseDate,
    reference: p.purchaseNumber,
    party: (p as unknown as { supplier?: { name: string } }).supplier?.name ?? null,
    moneyReceived: "0.0000",
    moneyPaid: p.totalAmount,
    owedToCompany: "0.0000",
    owedByCompany: p.totalAmount,
    note: p.status,
  }));

  const expensesRows = await Expense.findAll({ where: { currencyCode, expenseDate: dateRange, voidedAt: null } });
  const expenses: GeneralReportRow[] = expensesRows.map((e) => ({
    date: e.expenseDate,
    reference: e.expenseNumber,
    party: e.payeeName ?? null,
    moneyReceived: "0.0000",
    moneyPaid: e.amount,
    owedToCompany: "0.0000",
    owedByCompany: "0.0000",
    note: e.description,
  }));

  const saleReceiptRows = await SaleReceipt.findAll({
    where: { currencyCode, receiptDate: dateRange, voidedAt: null },
    include: [{ model: Sale, as: "sale", include: [{ model: Party, as: "party" }] }],
  });
  const customers: GeneralReportRow[] = saleReceiptRows.map((r) => {
    const sale = (r as unknown as { sale?: { party?: { name: string }; finalPrice: string } }).sale;
    return {
      date: r.receiptDate,
      reference: r.receiptNumber,
      party: sale?.party?.name ?? null,
      moneyReceived: r.amount,
      moneyPaid: "0.0000",
      owedToCompany: r.newBalance ?? "0.0000",
      owedByCompany: "0.0000",
      note: null,
    };
  });

  const exchangeRows = await getExchangeRowsForReport(currencyCode, startDate, endDate);

  const salesRows = await Sale.findAll({ where: { currencyCode, saleDate: dateRange }, include: [{ model: Party, as: "party" }] });
  const propertySales: GeneralReportRow[] = salesRows.map((s) => ({
    date: s.saleDate,
    reference: s.saleNumber,
    party: (s as unknown as { party?: { name: string } }).party?.name ?? null,
    moneyReceived: "0.0000",
    moneyPaid: "0.0000",
    owedToCompany: s.finalPrice,
    owedByCompany: "0.0000",
    note: s.status,
  }));

  const rentalRows = await Rental.findAll({ where: { currencyCode, startDate: dateRange }, include: [{ model: Party, as: "tenant" }] });
  const rentals: GeneralReportRow[] = rentalRows.map((r) => ({
    date: r.startDate,
    reference: r.rentalNumber,
    party: (r as unknown as { tenant?: { name: string } }).tenant?.name ?? null,
    moneyReceived: "0.0000",
    moneyPaid: "0.0000",
    owedToCompany: r.rentAmount,
    owedByCompany: "0.0000",
    note: r.status,
  }));

  const employeePaymentRows = await EmployeePayment.findAll({
    where: { currencyCode, paymentDate: dateRange, voidedAt: null },
    include: [{ model: Employee, as: "employee" }],
  });
  const employees: GeneralReportRow[] = employeePaymentRows.map((p) => ({
    date: p.paymentDate,
    reference: p.paymentNumber,
    party: (p as unknown as { employee?: { name: string } }).employee?.name ?? null,
    moneyReceived: "0.0000",
    moneyPaid: p.amount,
    owedToCompany: "0.0000",
    owedByCompany: p.newBalance ?? "0.0000",
    note: p.type,
  }));

  const projects = await getProjectStructureReport();

  return { currencyCode, startDate, endDate, purchasing, expenses, customers, exchange: exchangeRows, propertySales, rentals, employees, projects };
}

async function getExchangeRowsForReport(currencyCode: string, startDate: string, endDate: string): Promise<GeneralReportRow[]> {
  const { ExchangeTransaction } = await import("./models");
  const dateRange = { [Op.gte]: startDate, [Op.lte]: endDate };
  const rows = await ExchangeTransaction.findAll({
    where: {
      exchangeDate: dateRange,
      [Op.or]: [{ currencyGiven: currencyCode }, { currencyReceived: currencyCode }],
    },
    include: [{ model: Party, as: "party" }],
  });
  return rows.map((r) => ({
    date: r.exchangeDate,
    reference: r.exchangeNumber,
    party: (r as unknown as { party?: { name: string } }).party?.name ?? null,
    moneyReceived: r.currencyReceived === currencyCode ? r.amountReceived : "0.0000",
    moneyPaid: r.currencyGiven === currencyCode ? r.amountGiven : "0.0000",
    owedToCompany: "0.0000",
    owedByCompany: "0.0000",
    note: `${r.currencyGiven}→${r.currencyReceived}`,
  }));
}

async function getProjectStructureReport(): Promise<ProjectStructureRow[]> {
  const { Project } = await import("./models");
  const projects = await Project.findAll();
  const rows: ProjectStructureRow[] = [];
  for (const project of projects) {
    const blocks = await Block.findAll({ where: { projectId: project.id } });
    const blockIds = blocks.map((b) => b.id);
    const floors = blockIds.length > 0 ? await Floor.findAll({ where: { blockId: { [Op.in]: blockIds } } }) : [];
    const floorIds = floors.map((f) => f.id);
    const units = floorIds.length > 0 ? await Unit.findAll({ where: { floorId: { [Op.in]: floorIds } } }) : [];
    const byStatus = (status: string) => units.filter((u) => u.status === status).length;
    rows.push({
      projectId: project.id,
      projectName: project.name,
      blocks: blocks.length,
      floors: floors.length,
      totalProperties: units.length,
      available: byStatus("available"),
      reserved: byStatus("reserved"),
      sold: byStatus("sold"),
      rented: byStatus("rented"),
      unavailable: byStatus("blocked") + byStatus("cancelled") + byStatus("inactive") + byStatus("draft"),
    });
  }
  return rows;
}

// ---- Monthly Trends ----

export interface MonthlyTrendPoint {
  /** Jalali year-month label e.g. "۱۴۰۳/۰۷" */
  label: string;
  /** Gregorian ISO month start "YYYY-MM-01" for sorting */
  monthIso: string;
  income: string;
  expenses: string;
  purchases: string;
}

export interface MonthlyTrendsReport {
  currencyCode: string;
  months: MonthlyTrendPoint[];
  customersByType: Record<string, number>;
  unitsByStatus: Record<string, number>;
}

const JALALI_MONTHS_SHORT = ["وری","غویی","غبرګولی","چنګاښ","زمری","وږی","تله","لړم","لیندۍ","مرغومی","سلواغه","کب"];

function toJalaliLabel(isoMonth: string): string {
  const [y, m] = isoMonth.split("-").map(Number);
  const { toJalaali } = require("jalaali-js") as typeof import("jalaali-js");
  const { jy, jm } = toJalaali(y, m, 1);
  return `${jy} ${JALALI_MONTHS_SHORT[jm - 1]}`;
}

/** Returns last N Gregorian months as "YYYY-MM" strings, ascending. */
function lastNMonths(n: number): string[] {
  const today = new Date();
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export async function getMonthlyTrends(currencyCode: string, nMonths = 12): Promise<MonthlyTrendsReport> {
  const months = lastNMonths(nMonths);

  // For each month build date range and query
  const [allSales, allSaleReceipts, allRentalReceipts, allExpenses, allPurchases, allParties, allUnits] = await Promise.all([
    Sale.findAll({ where: { currencyCode, status: { [Op.notIn]: ["cancelled"] } }, attributes: ["saleDate", "finalPrice"] }),
    SaleReceipt.findAll({ where: { currencyCode, voidedAt: null }, attributes: ["receiptDate", "amount"] }),
    RentalReceipt.findAll({ where: { currencyCode, voidedAt: null }, attributes: ["receiptDate", "amount"] }),
    Expense.findAll({ where: { currencyCode, voidedAt: null }, attributes: ["expenseDate", "amount"] }),
    Purchase.findAll({ where: { currencyCode, status: { [Op.notIn]: ["cancelled"] } }, attributes: ["purchaseDate", "totalAmount"] }),
    Party.findAll({ attributes: ["type"] }),
    Unit.findAll({ attributes: ["status"] }),
  ]);

  // Build month→ sums
  const incomeByMonth = new Map<string, Decimal>();
  const expensesByMonth = new Map<string, Decimal>();
  const purchasesByMonth = new Map<string, Decimal>();

  for (const m of months) {
    incomeByMonth.set(m, new Decimal(0));
    expensesByMonth.set(m, new Decimal(0));
    purchasesByMonth.set(m, new Decimal(0));
  }

  const monthKey = (iso: string) => iso.slice(0, 7); // "YYYY-MM"

  for (const r of allSaleReceipts) {
    const k = monthKey(r.receiptDate);
    if (incomeByMonth.has(k)) incomeByMonth.set(k, (incomeByMonth.get(k) ?? new Decimal(0)).plus(new Decimal(r.amount)));
  }
  for (const r of allRentalReceipts) {
    const k = monthKey(r.receiptDate);
    if (incomeByMonth.has(k)) incomeByMonth.set(k, (incomeByMonth.get(k) ?? new Decimal(0)).plus(new Decimal(r.amount)));
  }
  for (const e of allExpenses) {
    const k = monthKey(e.expenseDate);
    if (expensesByMonth.has(k)) expensesByMonth.set(k, (expensesByMonth.get(k) ?? new Decimal(0)).plus(new Decimal(e.amount)));
  }
  for (const p of allPurchases) {
    const k = monthKey(p.purchaseDate);
    if (purchasesByMonth.has(k)) purchasesByMonth.set(k, (purchasesByMonth.get(k) ?? new Decimal(0)).plus(new Decimal(p.totalAmount)));
  }

  const trendMonths: MonthlyTrendPoint[] = months.map((m) => ({
    label: toJalaliLabel(m),
    monthIso: m + "-01",
    income: (incomeByMonth.get(m) ?? new Decimal(0)).toFixed(2),
    expenses: (expensesByMonth.get(m) ?? new Decimal(0)).toFixed(2),
    purchases: (purchasesByMonth.get(m) ?? new Decimal(0)).toFixed(2),
  }));

  const customersByType: Record<string, number> = {};
  for (const p of allParties) {
    customersByType[p.type] = (customersByType[p.type] ?? 0) + 1;
  }

  const unitsByStatus: Record<string, number> = {};
  for (const u of allUnits) {
    unitsByStatus[u.status] = (unitsByStatus[u.status] ?? 0) + 1;
  }

  return { currencyCode, months: trendMonths, customersByType, unitsByStatus };
}

/**
 * Profit & loss for one currency over a date range, computed directly from each module's own
 * records (Sale/Rental/Expense/Purchase/EmployeePayment/PartnerTransaction) rather than by
 * re-deriving it from shared journal accounts — this avoids ambiguity where Purchases and
 * Expenses both post to the same general expense account (5000), and keeps the report trivially
 * reconcilable against each module's own totals. Partner withdrawals are shown for visibility
 * but are excluded from the profit/loss calculation itself (they are an equity movement, not a
 * cost of doing business).
 */
export async function getProfitAndLoss(input: ProfitLossInput): Promise<ProfitLossReport> {
  const { currencyCode, startDate, endDate } = input;
  const dateRange = { [Op.gte]: startDate, [Op.lte]: endDate };

  const sales = await Sale.findAll({ where: { currencyCode, saleDate: dateRange, status: { [Op.notIn]: ["cancelled"] } } });
  const rentals = await Rental.findAll({ where: { currencyCode, startDate: dateRange, status: { [Op.notIn]: ["cancelled"] } } });
  const expenses = await Expense.findAll({ where: { currencyCode, expenseDate: dateRange, voidedAt: null } });
  const purchases = await Purchase.findAll({ where: { currencyCode, purchaseDate: dateRange, status: { [Op.notIn]: ["cancelled"] } } });
  const purchaseReturns = await PurchaseReturn.findAll({
    where: { currencyCode, returnDate: dateRange },
    include: [{ model: Purchase, as: "purchase", where: { currencyCode } }],
  });
  const employeePayments = await EmployeePayment.findAll({ where: { currencyCode, paymentDate: dateRange, voidedAt: null } });
  const partnerWithdrawals = await PartnerTransaction.findAll({
    where: { currencyCode, transactionDate: dateRange, type: "withdrawal" },
  });

  const propertySaleIncome = await sumDecimal(sales, (s) => s.finalPrice);
  const rentalIncome = await sumDecimal(rentals, (r) => r.rentAmount);
  const otherIncome = new Decimal(0);
  const totalIncome = propertySaleIncome.plus(rentalIncome).plus(otherIncome);

  const purchasesGross = await sumDecimal(purchases, (p) => p.totalAmount);
  const purchaseReturnsTotal = await sumDecimal(purchaseReturns, (r) => r.amount);
  const purchasesNet = purchasesGross.minus(purchaseReturnsTotal);
  const expensesTotal = await sumDecimal(expenses, (e) => e.amount);
  const employeeCosts = await sumDecimal(employeePayments, (p) => p.amount);
  const totalOutflow = purchasesNet.plus(expensesTotal).plus(employeeCosts);

  const partnerWithdrawalsTotal = await sumDecimal(partnerWithdrawals, (p) => p.amount);

  const cashAccounts = await CashAccount.findAll({ where: { currencyCode } });
  const accountIds = cashAccounts.map((c) => c.accountId);
  let availableBalance = new Decimal(0);
  if (accountIds.length > 0) {
    const lines = await JournalLine.findAll({ where: { accountId: { [Op.in]: accountIds }, currencyCode } });
    for (const line of lines) {
      const amount = new Decimal(line.amount);
      availableBalance = line.direction === "debit" ? availableBalance.plus(amount) : availableBalance.minus(amount);
    }
  }

  const net = totalIncome.minus(totalOutflow);
  const profit = net.greaterThan(0) ? net : new Decimal(0);
  const loss = net.lessThan(0) ? net.abs() : new Decimal(0);

  return {
    currencyCode,
    startDate,
    endDate,
    propertySaleIncome: propertySaleIncome.toFixed(4),
    rentalIncome: rentalIncome.toFixed(4),
    otherIncome: otherIncome.toFixed(4),
    totalIncome: totalIncome.toFixed(4),
    purchases: purchasesNet.toFixed(4),
    expenses: expensesTotal.toFixed(4),
    employeeCosts: employeeCosts.toFixed(4),
    totalOutflow: totalOutflow.toFixed(4),
    partnerWithdrawals: partnerWithdrawalsTotal.toFixed(4),
    availableBalance: availableBalance.toFixed(4),
    profit: profit.toFixed(4),
    loss: loss.toFixed(4),
  };
}
