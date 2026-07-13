import Decimal from "decimal.js";
import { sequelize } from "./connection";
import { ExchangeTransaction, Party, Account, CashAccount } from "./models";
import { postJournal, PostingError } from "./posting";
import { nextDocumentNumber } from "./numbering";

const CLEARING_ACCOUNT_CODE = "3100";
const FEE_EXPENSE_ACCOUNT_CODE = "5200";

/**
 * Cash account used to move money for a given currency when the exchange module needs to touch
 * the general cash position for that currency (falls back to the base 1000 Cash account when no
 * dedicated per-currency cash box exists yet).
 */
async function resolveCashLedgerAccount(currencyCode: string, transaction: import("sequelize").Transaction) {
  const cashAccount = await CashAccount.findOne({ where: { currencyCode, isActive: true }, transaction });
  if (cashAccount) {
    const account = await Account.findByPk(cashAccount.accountId, { transaction });
    if (account) return account;
  }
  return Account.findOne({ where: { code: "1000" }, transaction });
}

export interface CreateExchangeTransactionInput {
  partyId: number;
  exchangeDate: string;
  currencyGiven: string;
  amountGiven: string | number;
  currencyReceived: string;
  amountReceived: string | number;
  rate: string | number;
  fee?: string | number;
  reference?: string | null;
  notes?: string | null;
  createdByUserId?: number | null;
}

/**
 * Records a two-currency exchange (Sarafi) transaction with an exchange dealer party.
 *
 * DESIGN DECISION (documented, not invented business rule): modeled as an immediately settled
 * spot exchange — the company hands over `amountGiven` (+ `fee`) in `currencyGiven` and receives
 * `amountReceived` in `currencyReceived` in the same transaction. Each currency's journal lines
 * balance independently (required by postJournal) via a shared "Exchange Clearing" account
 * (3100) that carries the dealer's party reference on both legs, so the dealer's per-currency
 * ledger still shows both sides of the deal for audit history even though the transaction nets
 * to zero immediately. A running/credit-based dealer relationship was not assumed since the PDF
 * source documents are not available in this remediation environment; this is called out in the
 * checkpoint report rather than silently invented.
 */
export async function createExchangeTransaction(input: CreateExchangeTransactionInput): Promise<ExchangeTransaction> {
  const amountGiven = new Decimal(input.amountGiven);
  const amountReceived = new Decimal(input.amountReceived);
  const rate = new Decimal(input.rate);
  const fee = new Decimal(input.fee ?? 0);
  if (amountGiven.lessThanOrEqualTo(0)) throw new PostingError("Amount given must be greater than zero");
  if (amountReceived.lessThanOrEqualTo(0)) throw new PostingError("Amount received must be greater than zero");
  if (rate.lessThanOrEqualTo(0)) throw new PostingError("Exchange rate must be greater than zero");
  if (fee.lessThan(0)) throw new PostingError("Fee cannot be negative");
  if (input.currencyGiven === input.currencyReceived) {
    throw new PostingError("Currency given and currency received must differ for an exchange transaction");
  }

  const party = await Party.findByPk(input.partyId);
  if (!party) throw new PostingError("Exchange party not found");

  return sequelize.transaction(async (t) => {
    const exchangeNumber = await nextDocumentNumber("exchange", t);
    const exchange = await ExchangeTransaction.create(
      {
        exchangeNumber,
        partyId: input.partyId,
        exchangeDate: input.exchangeDate,
        currencyGiven: input.currencyGiven,
        amountGiven: amountGiven.toFixed(4),
        currencyReceived: input.currencyReceived,
        amountReceived: amountReceived.toFixed(4),
        rate: rate.toFixed(8),
        fee: fee.toFixed(4),
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    const clearingAccount = await Account.findOne({ where: { code: CLEARING_ACCOUNT_CODE }, transaction: t });
    const feeAccount = await Account.findOne({ where: { code: FEE_EXPENSE_ACCOUNT_CODE }, transaction: t });
    const cashGivenAccount = await resolveCashLedgerAccount(input.currencyGiven, t);
    const cashReceivedAccount = await resolveCashLedgerAccount(input.currencyReceived, t);
    if (!clearingAccount || !feeAccount || !cashGivenAccount || !cashReceivedAccount) {
      throw new PostingError("Core accounts are missing");
    }

    const lines = [
      {
        accountId: clearingAccount.id,
        currencyCode: input.currencyGiven,
        direction: "debit" as const,
        amount: amountGiven.toFixed(4),
        partyType: "exchange_dealer" as const,
        partyId: input.partyId,
        description: `Exchange ${exchangeNumber} given to ${party.name}`,
      },
      {
        accountId: cashGivenAccount.id,
        currencyCode: input.currencyGiven,
        direction: "credit" as const,
        amount: fee.greaterThan(0) ? amountGiven.plus(fee).toFixed(4) : amountGiven.toFixed(4),
        description: `Exchange ${exchangeNumber} — cash paid out`,
      },
      {
        accountId: cashReceivedAccount.id,
        currencyCode: input.currencyReceived,
        direction: "debit" as const,
        amount: amountReceived.toFixed(4),
        description: `Exchange ${exchangeNumber} — cash received`,
      },
      {
        accountId: clearingAccount.id,
        currencyCode: input.currencyReceived,
        direction: "credit" as const,
        amount: amountReceived.toFixed(4),
        partyType: "exchange_dealer" as const,
        partyId: input.partyId,
        description: `Exchange ${exchangeNumber} received from ${party.name}`,
      },
    ];
    if (fee.greaterThan(0)) {
      lines.push({
        accountId: feeAccount.id,
        currencyCode: input.currencyGiven,
        direction: "debit" as const,
        amount: fee.toFixed(4),
        description: `Exchange ${exchangeNumber} — dealer fee`,
      });
    }

    await postJournal(
      {
        transactionDate: input.exchangeDate,
        memo: `Exchange ${exchangeNumber}: ${amountGiven.toFixed(4)} ${input.currencyGiven} -> ${amountReceived.toFixed(4)} ${input.currencyReceived}`,
        isManual: false,
        createdByUserId: input.createdByUserId ?? null,
        source: { module: "exchange", sourceId: exchange.id, postingType: "exchange_creation" },
        lines,
      },
      t,
    );

    return exchange;
  });
}
