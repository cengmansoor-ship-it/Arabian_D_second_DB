import Decimal from "decimal.js";
import type { Transaction } from "sequelize";
import { sequelize } from "./connection";
import { Purchase, PurchasePayment, PurchaseReturn, CashAccount, Account, PostingLink } from "./models";
import { postJournal, reverseJournal, PostingError } from "./posting";
import { nextDocumentNumber } from "./numbering";

const AP_ACCOUNT_CODE = "2000";
const EXPENSE_ACCOUNT_CODE = "5000";

export interface CreatePurchaseInput {
  supplierPartyId: number;
  purchaseDate: string;
  itemName: string;
  quantity: string | number;
  unitOfMeasure?: string | null;
  unitPrice: string | number;
  currencyCode: string;
  notes?: string | null;
  createdByUserId?: number | null;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const quantity = new Decimal(input.quantity);
  const unitPrice = new Decimal(input.unitPrice);
  if (quantity.lessThanOrEqualTo(0)) throw new PostingError("Quantity must be greater than zero");
  if (unitPrice.lessThanOrEqualTo(0)) throw new PostingError("Unit price must be greater than zero");
  const totalAmount = quantity.times(unitPrice);

  return sequelize.transaction(async (t) => {
    const purchaseNumber = await nextDocumentNumber("purchase_invoice", t);
    const purchase = await Purchase.create(
      {
        purchaseNumber,
        supplierPartyId: input.supplierPartyId,
        purchaseDate: input.purchaseDate,
        itemName: input.itemName,
        quantity: quantity.toFixed(4),
        unitOfMeasure: input.unitOfMeasure ?? null,
        unitPrice: unitPrice.toFixed(4),
        totalAmount: totalAmount.toFixed(4),
        currencyCode: input.currencyCode,
        notes: input.notes ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    const expenseAccount = await Account.findOne({ where: { code: EXPENSE_ACCOUNT_CODE }, transaction: t });
    const apAccount = await Account.findOne({ where: { code: AP_ACCOUNT_CODE }, transaction: t });
    if (!expenseAccount || !apAccount) throw new PostingError("Core accounts are missing");

    await postJournal(
      {
        transactionDate: input.purchaseDate,
        memo: `Purchase ${purchaseNumber}: ${input.itemName}`,
        isManual: false,
        createdByUserId: input.createdByUserId ?? null,
        source: { module: "purchase", sourceId: purchase.id, postingType: "purchase_creation" },
        lines: [
          {
            accountId: expenseAccount.id,
            currencyCode: input.currencyCode,
            direction: "debit",
            amount: totalAmount.toFixed(4),
            description: `Purchase ${purchaseNumber} — ${input.itemName} x${quantity.toFixed(2)}`,
          },
          {
            accountId: apAccount.id,
            currencyCode: input.currencyCode,
            direction: "credit",
            amount: totalAmount.toFixed(4),
            partyType: "supplier",
            partyId: input.supplierPartyId,
            description: `Purchase ${purchaseNumber} payable`,
          },
        ],
      },
      t,
    );

    return purchase;
  });
}

/**
 * Remaining balance owed to the supplier = total - payments received back to the purchase in
 * cash-out (payments) + returns (which reduce what is owed), all threaded through the caller's
 * transaction when supplied — see memory note on Sequelize/SQLite mid-transaction reads.
 */
async function computeBalance(purchase: Purchase, t?: Transaction): Promise<Decimal> {
  const payments = await PurchasePayment.findAll({ where: { purchaseId: purchase.id, voidedAt: null }, transaction: t });
  const returns = await PurchaseReturn.findAll({ where: { purchaseId: purchase.id }, transaction: t });
  const paid = payments.reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));
  const returned = returns.reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));
  return new Decimal(purchase.totalAmount).minus(paid).minus(returned);
}

export interface AddPurchasePaymentInput {
  purchaseId: number;
  amount: string | number;
  currencyCode: string;
  paymentDate: string;
  method?: string;
  cashAccountId?: number | null;
  reference?: string | null;
  note?: string | null;
  paidByUserId?: number | null;
}

export async function addPurchasePayment(input: AddPurchasePaymentInput): Promise<PurchasePayment> {
  const purchase = await Purchase.findByPk(input.purchaseId);
  if (!purchase) throw new PostingError("Purchase not found");
  if (purchase.status === "cancelled") throw new PostingError("Cannot pay a cancelled purchase");
  if (purchase.currencyCode !== input.currencyCode) {
    throw new PostingError(`Purchase is in ${purchase.currencyCode}; payment must use the same currency`);
  }

  const amount = new Decimal(input.amount);
  if (amount.lessThanOrEqualTo(0)) throw new PostingError("Payment amount must be greater than zero");

  return sequelize.transaction(async (t) => {
    const balance = await computeBalance(purchase, t);
    if (amount.greaterThan(balance)) {
      throw new PostingError(`Payment of ${amount.toFixed(4)} exceeds remaining balance of ${balance.toFixed(4)}`);
    }

    let cashAccount: CashAccount | null = null;
    if (input.cashAccountId) {
      cashAccount = await CashAccount.findByPk(input.cashAccountId, { transaction: t });
      if (!cashAccount) throw new PostingError("Cash account not found");
      if (cashAccount.currencyCode !== input.currencyCode) {
        throw new PostingError("Cash account currency does not match payment currency");
      }
    }

    const paymentNumber = await nextDocumentNumber("purchase_payment", t);
    const payment = await PurchasePayment.create(
      {
        paymentNumber,
        purchaseId: purchase.id,
        paymentDate: input.paymentDate,
        amount: amount.toFixed(4),
        previousBalance: balance.toFixed(4),
        newBalance: balance.minus(amount).toFixed(4),
        currencyCode: input.currencyCode,
        method: input.method ?? "cash",
        cashAccountId: input.cashAccountId ?? null,
        reference: input.reference ?? null,
        note: input.note ?? null,
        paidByUserId: input.paidByUserId ?? null,
      },
      { transaction: t },
    );

    const apAccount = await Account.findOne({ where: { code: AP_ACCOUNT_CODE }, transaction: t });
    const cashLedgerAccount =
      cashAccount != null
        ? await Account.findByPk(cashAccount.accountId, { transaction: t })
        : await Account.findOne({ where: { code: "1000" }, transaction: t });
    if (!apAccount || !cashLedgerAccount) throw new PostingError("Core accounts are missing");

    await postJournal(
      {
        transactionDate: input.paymentDate,
        memo: `Payment ${paymentNumber} for purchase ${purchase.purchaseNumber}`,
        isManual: false,
        createdByUserId: input.paidByUserId ?? null,
        source: { module: "purchase_payment", sourceId: payment.id, postingType: "purchase_payment" },
        lines: [
          {
            accountId: apAccount.id,
            currencyCode: input.currencyCode,
            direction: "debit",
            amount: amount.toFixed(4),
            partyType: "supplier",
            partyId: purchase.supplierPartyId,
            description: `Payment ${paymentNumber} applied to purchase ${purchase.purchaseNumber}`,
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

    const newBalance = balance.minus(amount);
    purchase.status = newBalance.lessThanOrEqualTo(0) ? "paid" : "open";
    await purchase.save({ transaction: t });

    return payment;
  });
}

export interface CreatePurchaseReturnInput {
  purchaseId: number;
  returnDate: string;
  returnedItemName: string;
  quantity: string | number;
  amount: string | number;
  currencyCode: string;
  reason: string;
  createdByUserId?: number | null;
}

/** A purchase return reduces the amount owed to the supplier (debits AP, credits the expense account back). */
export async function createPurchaseReturn(input: CreatePurchaseReturnInput): Promise<PurchaseReturn> {
  const purchase = await Purchase.findByPk(input.purchaseId);
  if (!purchase) throw new PostingError("Purchase not found");
  if (purchase.currencyCode !== input.currencyCode) {
    throw new PostingError(`Purchase is in ${purchase.currencyCode}; return must use the same currency`);
  }
  const quantity = new Decimal(input.quantity);
  const amount = new Decimal(input.amount);
  if (quantity.lessThanOrEqualTo(0)) throw new PostingError("Returned quantity must be greater than zero");
  if (amount.lessThanOrEqualTo(0)) throw new PostingError("Return amount must be greater than zero");
  if (!input.reason?.trim()) throw new PostingError("A reason is required for a purchase return");

  return sequelize.transaction(async (t) => {
    const balance = await computeBalance(purchase, t);
    if (amount.greaterThan(balance)) {
      throw new PostingError(`Return amount of ${amount.toFixed(4)} exceeds remaining balance of ${balance.toFixed(4)}`);
    }

    const returnNumber = await nextDocumentNumber("purchase_return", t);
    const ret = await PurchaseReturn.create(
      {
        returnNumber,
        purchaseId: purchase.id,
        returnDate: input.returnDate,
        returnedItemName: input.returnedItemName,
        quantity: quantity.toFixed(4),
        amount: amount.toFixed(4),
        currencyCode: input.currencyCode,
        reason: input.reason.trim(),
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    const apAccount = await Account.findOne({ where: { code: AP_ACCOUNT_CODE }, transaction: t });
    const expenseAccount = await Account.findOne({ where: { code: EXPENSE_ACCOUNT_CODE }, transaction: t });
    if (!apAccount || !expenseAccount) throw new PostingError("Core accounts are missing");

    await postJournal(
      {
        transactionDate: input.returnDate,
        memo: `Return ${returnNumber} for purchase ${purchase.purchaseNumber}: ${input.reason}`,
        isManual: false,
        createdByUserId: input.createdByUserId ?? null,
        source: { module: "purchase_return", sourceId: ret.id, postingType: "purchase_return" },
        lines: [
          {
            accountId: apAccount.id,
            currencyCode: input.currencyCode,
            direction: "debit",
            amount: amount.toFixed(4),
            partyType: "supplier",
            partyId: purchase.supplierPartyId,
            description: `Return ${returnNumber} reduces amount owed`,
          },
          {
            accountId: expenseAccount.id,
            currencyCode: input.currencyCode,
            direction: "credit",
            amount: amount.toFixed(4),
            description: `Return ${returnNumber} — ${input.returnedItemName} x${quantity.toFixed(2)}`,
          },
        ],
      },
      t,
    );

    const newBalance = balance.minus(amount);
    if (newBalance.lessThanOrEqualTo(0)) {
      purchase.status = "paid";
      await purchase.save({ transaction: t });
    }

    return ret;
  });
}

export async function getPurchaseBalance(purchase: Purchase): Promise<string> {
  const balance = await computeBalance(purchase);
  return balance.toFixed(4);
}
