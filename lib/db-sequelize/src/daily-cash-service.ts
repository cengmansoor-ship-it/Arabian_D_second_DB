import Decimal from "decimal.js";
import { Op } from "sequelize";
import { sequelize } from "./connection";
import { DailyCashEntry, Account, Party } from "./models";
import { postJournal, reverseJournal, PostingError } from "./posting";

export interface CreateDailyCashInput {
  entryDate: string; // YYYY-MM-DD
  currencyCode: string; // AFN | USD | PKR
  description: string;
  partyId?: number | null;
  amountIn?: string | number | null; // جمع
  amountOut?: string | number | null; // رسیدګی
  createdByUserId?: number | null;
}

export interface DailyCashRow {
  id: number;
  entryDate: string;
  currencyCode: string;
  description: string;
  partyId: number | null;
  partyName: string | null;
  amountIn: string | null;
  amountOut: string | null;
  balance: string; // running balance الباقی
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
}

export interface DailyCashPage {
  currencyCode: string;
  startDate: string;
  endDate: string;
  openingBalance: string; // balance before startDate
  rows: DailyCashRow[];
  totalIn: string;
  totalOut: string;
  closingBalance: string;
}

export async function createDailyCashEntry(input: CreateDailyCashInput): Promise<DailyCashEntry> {
  const hasIn = input.amountIn != null && String(input.amountIn).trim() !== "";
  const hasOut = input.amountOut != null && String(input.amountOut).trim() !== "";

  if (!hasIn && !hasOut) throw new PostingError("جمع یا رسیدګی باید ولري (at least one of amountIn or amountOut)");
  if (hasIn && hasOut) throw new PostingError("جمع او رسیدګی دواړه نه شي ثبتیدی — یو ثبت کړئ");
  if (!input.description?.trim()) throw new PostingError("تفصیل لازمي دي");
  if (!input.entryDate) throw new PostingError("نیټه لازمي ده");

  const amt = new Decimal(hasIn ? String(input.amountIn) : String(input.amountOut));
  if (amt.lessThanOrEqualTo(0)) throw new PostingError("اندازه باید له صفر ډیره وي");

  return sequelize.transaction(async (t) => {
    // Cash account (1000) and AR/AP accounts
    const cashAccount = await Account.findOne({ where: { code: "1000" }, transaction: t });
    const arAccount = await Account.findOne({ where: { code: "1100" }, transaction: t }); // AR
    const apAccount = await Account.findOne({ where: { code: "2000" }, transaction: t }); // AP
    if (!cashAccount || !arAccount || !apAccount) throw new PostingError("د حساب معلومات ناقص دي");

    const entry = await DailyCashEntry.create(
      {
        entryDate: input.entryDate,
        currencyCode: input.currencyCode,
        description: input.description.trim(),
        partyId: input.partyId ?? null,
        amountIn: hasIn ? amt.toFixed(4) : null,
        amountOut: hasOut ? amt.toFixed(4) : null,
        createdByUserId: input.createdByUserId ?? null,
      },
      { transaction: t },
    );

    // Post to journal
    const lines = hasIn
      ? [
          // Cash received: Dr Cash → Cr AR (tagged to party)
          { accountId: cashAccount.id, currencyCode: input.currencyCode, direction: "debit" as const, amount: amt.toFixed(4), description: `روزنامچه جمع: ${input.description}` },
          { accountId: arAccount.id, currencyCode: input.currencyCode, direction: "credit" as const, amount: amt.toFixed(4), partyId: input.partyId ?? null, description: `روزنامچه: ${input.description}` },
        ]
      : [
          // Cash paid: Dr AP (tagged to party) → Cr Cash
          { accountId: apAccount.id, currencyCode: input.currencyCode, direction: "debit" as const, amount: amt.toFixed(4), partyId: input.partyId ?? null, description: `روزنامچه: ${input.description}` },
          { accountId: cashAccount.id, currencyCode: input.currencyCode, direction: "credit" as const, amount: amt.toFixed(4), description: `روزنامچه رسیدګی: ${input.description}` },
        ];

    const tx = await postJournal(
      {
        transactionDate: input.entryDate,
        memo: `روزنامچه: ${input.description}`,
        isManual: false,
        createdByUserId: input.createdByUserId ?? null,
        source: { module: "daily_cash", sourceId: entry.id, postingType: "daily_cash" },
        lines,
      },
      t,
    );

    entry.journalTransactionId = tx.id;
    await entry.save({ transaction: t });

    return entry;
  });
}

export async function voidDailyCashEntry(id: number, params: { userId: number; reason: string }): Promise<DailyCashEntry> {
  const entry = await DailyCashEntry.findByPk(id);
  if (!entry) throw new PostingError("ثبت ونه موندل سو");
  if (entry.voidedAt) throw new PostingError("دا ثبت دمخه لغوه سوی دی");
  if (!entry.journalTransactionId) throw new PostingError("د دی ثبت لپاره پوسټنګ ونه موندل سو");

  return sequelize.transaction(async (t) => {
    await reverseJournal(entry.journalTransactionId!, params, t);
    entry.voidedAt = new Date();
    entry.voidReason = params.reason;
    await entry.save({ transaction: t });
    return entry;
  });
}

export async function getDailyCashPage(params: {
  currencyCode: string;
  startDate: string;
  endDate: string;
}): Promise<DailyCashPage> {
  const { currencyCode, startDate, endDate } = params;

  // Opening balance = sum of (amountIn - amountOut) for non-voided entries BEFORE startDate
  const prevEntries = await DailyCashEntry.findAll({
    where: {
      currencyCode,
      entryDate: { [Op.lt]: startDate },
      voidedAt: null,
    },
    attributes: ["amountIn", "amountOut"],
  });

  let openingBalance = new Decimal(0);
  for (const e of prevEntries) {
    if (e.amountIn) openingBalance = openingBalance.plus(e.amountIn);
    if (e.amountOut) openingBalance = openingBalance.minus(e.amountOut);
  }

  // Entries for the selected date range
  const entries = await DailyCashEntry.findAll({
    where: {
      currencyCode,
      entryDate: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    order: [["entryDate", "ASC"], ["id", "ASC"]],
    include: [{ model: Party, as: "party", attributes: ["id", "name"] }],
  });

  let running = new Decimal(openingBalance);
  let totalIn = new Decimal(0);
  let totalOut = new Decimal(0);

  const rows: DailyCashRow[] = entries.map((e) => {
    const party = (e as any).party as { id: number; name: string } | null;
    if (!e.voidedAt) {
      if (e.amountIn) { running = running.plus(e.amountIn); totalIn = totalIn.plus(e.amountIn); }
      if (e.amountOut) { running = running.minus(e.amountOut); totalOut = totalOut.plus(e.amountOut); }
    }
    return {
      id: e.id,
      entryDate: e.entryDate,
      currencyCode: e.currencyCode,
      description: e.description,
      partyId: e.partyId ?? null,
      partyName: party?.name ?? null,
      amountIn: e.amountIn ?? null,
      amountOut: e.amountOut ?? null,
      balance: running.toFixed(4),
      voidedAt: e.voidedAt ? e.voidedAt.toISOString() : null,
      voidReason: e.voidReason ?? null,
      createdAt: e.createdAt!.toISOString(),
    };
  });

  return {
    currencyCode,
    startDate,
    endDate,
    openingBalance: openingBalance.toFixed(4),
    rows,
    totalIn: totalIn.toFixed(4),
    totalOut: totalOut.toFixed(4),
    closingBalance: running.toFixed(4),
  };
}
