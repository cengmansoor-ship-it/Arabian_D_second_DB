import Decimal from "decimal.js";
import type { Transaction } from "sequelize";
import { sequelize } from "./connection";
import { Employee, Attendance, EmployeePayment, CashAccount, Account } from "./models";
import { postJournal, PostingError } from "./posting";
import { nextDocumentNumber } from "./numbering";

const SALARY_EXPENSE_ACCOUNT_CODE = "5100";

export interface CreateEmployeeInput {
  name: string;
  fatherName?: string | null;
  phone?: string | null;
  position: string;
  wageType: "daily" | "monthly";
  wageAmount: string | number;
  currencyCode: string;
  startDate: string;
  notes?: string | null;
  createdByUserId?: number | null;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const wageAmount = new Decimal(input.wageAmount);
  if (wageAmount.lessThanOrEqualTo(0)) throw new PostingError("Wage amount must be greater than zero");

  return sequelize.transaction(async (t) => {
    const employeeNumber = await nextDocumentNumber("employee", t);
    return Employee.create(
      {
        employeeNumber,
        name: input.name,
        fatherName: input.fatherName ?? null,
        phone: input.phone ?? null,
        position: input.position,
        wageType: input.wageType,
        wageAmount: wageAmount.toFixed(4),
        currencyCode: input.currencyCode,
        startDate: input.startDate,
        notes: input.notes ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );
  });
}

export interface RecordAttendanceInput {
  employeeId: number;
  date: string;
  status: "present" | "absent" | "leave" | "half_day";
  notes?: string | null;
  createdByUserId?: number | null;
}

/**
 * Records one attendance entry for an employee/date. Payable is computed from the employee's
 * wage (full wage for present, half for half_day, zero for absent/unpaid leave) but no journal
 * entry is posted here — attendance only accrues what the employee has earned; the outgoing
 * journal entry is posted when an EmployeePayment actually pays it out (cash-basis for wages,
 * matching how Expenses/Purchases are cash/AP-basis in this system).
 */
export async function recordAttendance(input: RecordAttendanceInput): Promise<Attendance> {
  const employee = await Employee.findByPk(input.employeeId);
  if (!employee) throw new PostingError("Employee not found");

  const existing = await Attendance.findOne({ where: { employeeId: input.employeeId, date: input.date } });
  if (existing) throw new PostingError(`Attendance for this employee on ${input.date} is already recorded`);

  const wage = new Decimal(employee.wageAmount);
  let payable = new Decimal(0);
  if (input.status === "present") payable = wage;
  else if (input.status === "half_day") payable = wage.dividedBy(2);

  return Attendance.create({
    employeeId: input.employeeId,
    date: input.date,
    status: input.status,
    payableAmount: payable.toFixed(4),
    currencyCode: employee.currencyCode,
    notes: input.notes ?? null,
    createdByUserId: input.createdByUserId ?? null,
  });
}

/** Balance owed to the employee = total earned from attendance - total non-voided payments made. */
async function computeBalance(employee: Employee, t?: Transaction): Promise<Decimal> {
  const attendances = await Attendance.findAll({ where: { employeeId: employee.id }, transaction: t });
  const payments = await EmployeePayment.findAll({ where: { employeeId: employee.id, voidedAt: null }, transaction: t });
  const earned = attendances.reduce((sum, a) => sum.plus(new Decimal(a.payableAmount)), new Decimal(0));
  const paid = payments.reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));
  return earned.minus(paid);
}

export async function getEmployeeBalance(employee: Employee): Promise<string> {
  const balance = await computeBalance(employee);
  return balance.toFixed(4);
}

export interface AddEmployeePaymentInput {
  employeeId: number;
  amount: string | number;
  type: "salary" | "advance";
  currencyCode: string;
  paymentDate: string;
  method?: string;
  cashAccountId?: number | null;
  note?: string | null;
  paidByUserId?: number | null;
}

export async function addEmployeePayment(input: AddEmployeePaymentInput): Promise<EmployeePayment> {
  const employee = await Employee.findByPk(input.employeeId);
  if (!employee) throw new PostingError("Employee not found");
  if (employee.currencyCode !== input.currencyCode) {
    throw new PostingError(`Employee is paid in ${employee.currencyCode}; payment must use the same currency`);
  }
  const amount = new Decimal(input.amount);
  if (amount.lessThanOrEqualTo(0)) throw new PostingError("Payment amount must be greater than zero");

  return sequelize.transaction(async (t) => {
    const balance = await computeBalance(employee, t);

    let cashAccount: CashAccount | null = null;
    if (input.cashAccountId) {
      cashAccount = await CashAccount.findByPk(input.cashAccountId, { transaction: t });
      if (!cashAccount) throw new PostingError("Cash account not found");
      if (cashAccount.currencyCode !== input.currencyCode) {
        throw new PostingError("Cash account currency does not match payment currency");
      }
    }

    const paymentNumber = await nextDocumentNumber("employee_payment", t);
    const payment = await EmployeePayment.create(
      {
        paymentNumber,
        employeeId: employee.id,
        paymentDate: input.paymentDate,
        type: input.type,
        amount: amount.toFixed(4),
        previousBalance: balance.toFixed(4),
        newBalance: balance.minus(amount).toFixed(4),
        currencyCode: input.currencyCode,
        method: input.method ?? "cash",
        cashAccountId: input.cashAccountId ?? null,
        note: input.note ?? null,
        paidByUserId: input.paidByUserId ?? null,
      },
      { transaction: t },
    );

    const salaryAccount = await Account.findOne({ where: { code: SALARY_EXPENSE_ACCOUNT_CODE }, transaction: t });
    const cashLedgerAccount =
      cashAccount != null
        ? await Account.findByPk(cashAccount.accountId, { transaction: t })
        : await Account.findOne({ where: { code: "1000" }, transaction: t });
    if (!salaryAccount || !cashLedgerAccount) throw new PostingError("Core accounts are missing");

    await postJournal(
      {
        transactionDate: input.paymentDate,
        memo: `${input.type === "advance" ? "Advance" : "Salary"} payment ${paymentNumber} to ${employee.name}`,
        isManual: false,
        createdByUserId: input.paidByUserId ?? null,
        source: { module: "employee_payment", sourceId: payment.id, postingType: "employee_payment" },
        lines: [
          {
            accountId: salaryAccount.id,
            currencyCode: input.currencyCode,
            direction: "debit",
            amount: amount.toFixed(4),
            partyType: "employee",
            partyId: employee.id,
            description: `Payment ${paymentNumber} to ${employee.name}`,
          },
          {
            accountId: cashLedgerAccount.id,
            currencyCode: input.currencyCode,
            direction: "credit",
            amount: amount.toFixed(4),
            description: `Payment ${paymentNumber} paid out`,
          },
        ],
      },
      t,
    );

    return payment;
  });
}
