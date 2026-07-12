import Decimal from "decimal.js";
import { Op } from "sequelize";
import { Sale, Rental, Expense, Purchase, PurchaseReturn, EmployeePayment, PartnerTransaction, JournalLine, CashAccount } from "./models";

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
