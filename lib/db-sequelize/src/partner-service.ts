import Decimal from "decimal.js";
import type { Transaction } from "sequelize";
import { sequelize } from "./connection";
import { Partner, PartnerTransaction, Party, Account, CashAccount } from "./models";
import { postJournal, PostingError } from "./posting";
import { nextDocumentNumber } from "./numbering";

const EQUITY_ACCOUNT_CODE = "3000";

export interface CreatePartnerInput {
  partyId: number;
  initialInvestment: string | number;
  currencyCode: string;
  ownershipPercent?: string | number | null;
  joinDate: string;
  notes?: string | null;
  createdByUserId?: number | null;
}

export async function createPartner(input: CreatePartnerInput): Promise<Partner> {
  const party = await Party.findByPk(input.partyId);
  if (!party) throw new PostingError("Party not found");
  const existing = await Partner.findOne({ where: { partyId: input.partyId } });
  if (existing) throw new PostingError("This party is already registered as a partner");

  const initialInvestment = new Decimal(input.initialInvestment);
  if (initialInvestment.lessThan(0)) throw new PostingError("Initial investment cannot be negative");

  return sequelize.transaction(async (t) => {
    const partnerNumber = await nextDocumentNumber("partner", t);
    const partner = await Partner.create(
      {
        partnerNumber,
        partyId: input.partyId,
        initialInvestment: initialInvestment.toFixed(4),
        currencyCode: input.currencyCode,
        ownershipPercent: input.ownershipPercent != null ? new Decimal(input.ownershipPercent).toFixed(3) : null,
        joinDate: input.joinDate,
        notes: input.notes ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    if (initialInvestment.greaterThan(0)) {
      const equityAccount = await Account.findOne({ where: { code: EQUITY_ACCOUNT_CODE }, transaction: t });
      const cashAccount = await Account.findOne({ where: { code: "1000" }, transaction: t });
      if (!equityAccount || !cashAccount) throw new PostingError("Core accounts are missing");

      await postJournal(
        {
          transactionDate: input.joinDate,
          memo: `Initial investment by ${party.name}`,
          isManual: false,
          createdByUserId: input.createdByUserId ?? null,
          source: { module: "partner", sourceId: partner.id, postingType: "partner_initial_investment" },
          lines: [
            {
              accountId: cashAccount.id,
              currencyCode: input.currencyCode,
              direction: "debit",
              amount: initialInvestment.toFixed(4),
              description: `Initial investment by ${party.name} received`,
            },
            {
              accountId: equityAccount.id,
              currencyCode: input.currencyCode,
              direction: "credit",
              amount: initialInvestment.toFixed(4),
              partyType: "partner",
              partyId: partner.id,
              description: `Initial investment by ${party.name}`,
            },
          ],
        },
        t,
      );
    }

    return partner;
  });
}

/** Partner capital balance = initial investment + investments - withdrawals. */
async function computeBalance(partner: Partner, t?: Transaction): Promise<Decimal> {
  const transactions = await PartnerTransaction.findAll({ where: { partnerId: partner.id }, transaction: t });
  let balance = new Decimal(partner.initialInvestment);
  for (const tx of transactions) {
    const amount = new Decimal(tx.amount);
    balance = tx.type === "investment" ? balance.plus(amount) : balance.minus(amount);
  }
  return balance;
}

export async function getPartnerBalance(partner: Partner): Promise<string> {
  const balance = await computeBalance(partner);
  return balance.toFixed(4);
}

export interface AddPartnerTransactionInput {
  partnerId: number;
  type: "investment" | "withdrawal";
  amount: string | number;
  currencyCode: string;
  transactionDate: string;
  cashAccountId?: number | null;
  note?: string | null;
  createdByUserId?: number | null;
}

export async function addPartnerTransaction(input: AddPartnerTransactionInput): Promise<PartnerTransaction> {
  const partner = await Partner.findByPk(input.partnerId, { include: [{ model: Party, as: "party" }] });
  if (!partner) throw new PostingError("Partner not found");
  if (partner.currencyCode !== input.currencyCode) {
    throw new PostingError(`Partner capital is tracked in ${partner.currencyCode}; transaction must use the same currency`);
  }
  const amount = new Decimal(input.amount);
  if (amount.lessThanOrEqualTo(0)) throw new PostingError("Amount must be greater than zero");

  return sequelize.transaction(async (t) => {
    const balance = await computeBalance(partner, t);
    if (input.type === "withdrawal" && amount.greaterThan(balance)) {
      throw new PostingError(`Withdrawal of ${amount.toFixed(4)} exceeds partner capital balance of ${balance.toFixed(4)}`);
    }

    let cashAccount: CashAccount | null = null;
    if (input.cashAccountId) {
      cashAccount = await CashAccount.findByPk(input.cashAccountId, { transaction: t });
      if (!cashAccount) throw new PostingError("Cash account not found");
      if (cashAccount.currencyCode !== input.currencyCode) {
        throw new PostingError("Cash account currency does not match transaction currency");
      }
    }

    const transactionNumber = await nextDocumentNumber("partner_transaction", t);
    const newBalance = input.type === "investment" ? balance.plus(amount) : balance.minus(amount);
    const tx = await PartnerTransaction.create(
      {
        transactionNumber,
        partnerId: partner.id,
        transactionDate: input.transactionDate,
        type: input.type,
        amount: amount.toFixed(4),
        previousBalance: balance.toFixed(4),
        newBalance: newBalance.toFixed(4),
        currencyCode: input.currencyCode,
        note: input.note ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    const equityAccount = await Account.findOne({ where: { code: EQUITY_ACCOUNT_CODE }, transaction: t });
    const cashLedgerAccount =
      cashAccount != null
        ? await Account.findByPk(cashAccount.accountId, { transaction: t })
        : await Account.findOne({ where: { code: "1000" }, transaction: t });
    if (!equityAccount || !cashLedgerAccount) throw new PostingError("Core accounts are missing");

    const partnerName = (partner as unknown as { party?: { name?: string } }).party?.name ?? `Partner #${partner.id}`;
    const lines =
      input.type === "investment"
        ? [
            {
              accountId: cashLedgerAccount.id,
              currencyCode: input.currencyCode,
              direction: "debit" as const,
              amount: amount.toFixed(4),
              description: `Investment ${transactionNumber} by ${partnerName}`,
            },
            {
              accountId: equityAccount.id,
              currencyCode: input.currencyCode,
              direction: "credit" as const,
              amount: amount.toFixed(4),
              partyType: "partner" as const,
              partyId: partner.id,
              description: `Investment ${transactionNumber} by ${partnerName}`,
            },
          ]
        : [
            {
              accountId: equityAccount.id,
              currencyCode: input.currencyCode,
              direction: "debit" as const,
              amount: amount.toFixed(4),
              partyType: "partner" as const,
              partyId: partner.id,
              description: `Withdrawal ${transactionNumber} by ${partnerName}`,
            },
            {
              accountId: cashLedgerAccount.id,
              currencyCode: input.currencyCode,
              direction: "credit" as const,
              amount: amount.toFixed(4),
              description: `Withdrawal ${transactionNumber} by ${partnerName}`,
            },
          ];

    await postJournal(
      {
        transactionDate: input.transactionDate,
        memo: `${input.type === "investment" ? "Investment" : "Withdrawal"} ${transactionNumber} — ${partnerName}`,
        isManual: false,
        createdByUserId: input.createdByUserId ?? null,
        source: { module: "partner_transaction", sourceId: tx.id, postingType: "partner_transaction" },
        lines,
      },
      t,
    );

    return tx;
  });
}
