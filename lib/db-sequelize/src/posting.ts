import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { sequelize } from "./connection";
import { JournalTransaction, JournalLine, PostingLink, Account } from "./models";

export interface PostingLineInput {
  accountId: number;
  currencyCode: string;
  direction: "debit" | "credit";
  amount: string | number;
  partyType?: "customer" | "supplier" | "tenant" | "employee" | "partner" | "exchange_dealer" | null;
  partyId?: number | null;
  description?: string | null;
}

export interface PostJournalInput {
  transactionDate: string;
  memo?: string | null;
  isManual?: boolean;
  createdByUserId?: number | null;
  idempotencyKey?: string;
  lines: PostingLineInput[];
  /** When provided, guarantees this source record posts under this postingType exactly once. */
  source?: { module: string; sourceId: number; postingType: string };
}

export class PostingError extends Error {}

/**
 * The single entry point for every financial posting in the system (ACCT-01..05).
 * Enforces: debit === credit per currency, idempotency, and one-posting-per-source-per-type.
 */
export async function postJournal(input: PostJournalInput): Promise<JournalTransaction> {
  if (input.lines.length < 2) {
    throw new PostingError("A journal transaction requires at least two lines");
  }

  const totalsByCurrency = new Map<string, { debit: Decimal; credit: Decimal }>();
  for (const line of input.lines) {
    const amount = new Decimal(line.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new PostingError("Journal line amounts must be greater than zero");
    }
    const bucket = totalsByCurrency.get(line.currencyCode) ?? { debit: new Decimal(0), credit: new Decimal(0) };
    if (line.direction === "debit") bucket.debit = bucket.debit.plus(amount);
    else bucket.credit = bucket.credit.plus(amount);
    totalsByCurrency.set(line.currencyCode, bucket);
  }
  for (const [currencyCode, totals] of totalsByCurrency) {
    if (!totals.debit.equals(totals.credit)) {
      throw new PostingError(
        `Unbalanced posting in ${currencyCode}: debit ${totals.debit.toFixed(4)} != credit ${totals.credit.toFixed(4)}`,
      );
    }
  }

  return sequelize.transaction(async (t) => {
    if (input.source) {
      const existing = await PostingLink.findOne({
        where: { sourceModule: input.source.module, sourceId: input.source.sourceId, postingType: input.source.postingType },
        transaction: t,
      });
      if (existing) {
        throw new PostingError(
          `Source ${input.source.module}#${input.source.sourceId} was already posted for "${input.source.postingType}"`,
        );
      }
    }

    const transaction = await JournalTransaction.create(
      {
        idempotencyKey: input.idempotencyKey ?? randomUUID(),
        transactionDate: input.transactionDate,
        memo: input.memo ?? null,
        isManual: input.isManual ?? false,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    for (const line of input.lines) {
      const account = await Account.findByPk(line.accountId, { transaction: t });
      if (!account) throw new PostingError(`Account ${line.accountId} not found`);
      await JournalLine.create(
        {
          transactionId: transaction.id,
          accountId: line.accountId,
          currencyCode: line.currencyCode,
          direction: line.direction,
          amount: new Decimal(line.amount).toFixed(4),
          partyType: line.partyType ?? null,
          partyId: line.partyId ?? null,
          description: line.description ?? null,
        },
        { transaction: t },
      );
    }

    if (input.source) {
      await PostingLink.create(
        {
          sourceModule: input.source.module,
          sourceId: input.source.sourceId,
          postingType: input.source.postingType,
          transactionId: transaction.id,
        },
        { transaction: t },
      );
    }

    return transaction;
  });
}

export async function reverseJournal(
  transactionId: number,
  params: { userId: number; reason: string },
): Promise<JournalTransaction> {
  const original = await JournalTransaction.findByPk(transactionId, { include: [{ model: JournalLine, as: "lines" }] });
  if (!original) throw new PostingError("Transaction not found");
  if (original.voidedAt) throw new PostingError("Transaction is already voided");

  const lines = await JournalLine.findAll({ where: { transactionId } });
  const reversedLines: PostingLineInput[] = lines.map((l) => ({
    accountId: l.accountId,
    currencyCode: l.currencyCode,
    direction: l.direction === "debit" ? "credit" : "debit",
    amount: l.amount,
    partyType: l.partyType,
    partyId: l.partyId,
    description: l.description ? `Reversal: ${l.description}` : "Reversal",
  }));

  return sequelize.transaction(async (t) => {
    original.voidedAt = new Date();
    original.voidedByUserId = params.userId;
    original.voidReason = params.reason;
    await original.save({ transaction: t });

    const reversal = await JournalTransaction.create(
      {
        idempotencyKey: randomUUID(),
        transactionDate: new Date().toISOString().slice(0, 10),
        memo: `Reversal of #${original.id}: ${params.reason}`,
        isManual: true,
        createdByUserId: params.userId,
        reversalOfId: original.id,
      },
      { transaction: t },
    );

    for (const line of reversedLines) {
      await JournalLine.create(
        {
          transactionId: reversal.id,
          accountId: line.accountId,
          currencyCode: line.currencyCode,
          direction: line.direction,
          amount: new Decimal(line.amount).toFixed(4),
          partyType: line.partyType ?? null,
          partyId: line.partyId ?? null,
          description: line.description ?? null,
        },
        { transaction: t },
      );
    }

    return reversal;
  });
}
