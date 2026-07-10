import { Router, type IRouter } from "express";
import { JournalTransaction, JournalLine, Account, postJournal, reverseJournal, PostingError } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  const direction = typeof req.query.direction === "string" ? req.query.direction : undefined;
  const transactions = await JournalTransaction.findAll({
    order: [["id", "DESC"]],
    limit: 200,
    include: [{ model: JournalLine, as: "lines", include: [{ model: Account, as: "account" }] }],
  });
  const filtered =
    direction === "in" || direction === "out"
      ? transactions.filter((t) =>
          (t.lines ?? []).some((l) =>
            direction === "in"
              ? l.account?.code === "1000" && l.direction === "debit"
              : l.account?.code === "1000" && l.direction === "credit",
          ),
        )
      : transactions;
  res.json(filtered);
});

router.get("/accounts", requireAuth, async (_req, res) => {
  const accounts = await Account.findAll({ where: { isActive: true }, order: [["code", "ASC"]] });
  res.json(accounts);
});

router.post("/manual", requireAuth, requirePermission("accounting.manage"), async (req: AuthedRequest, res) => {
  const { transactionDate, memo, lines } = req.body ?? {};
  if (typeof transactionDate !== "string" || !Array.isArray(lines) || lines.length < 2) {
    res.status(400).json({ error: "transactionDate and at least two lines are required" });
    return;
  }
  try {
    const transaction = await postJournal({
      transactionDate,
      memo: memo ?? null,
      isManual: true,
      createdByUserId: req.auth!.userId,
      lines,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "JournalTransaction", entityId: String(transaction.id) });
    res.status(201).json(transaction);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/reverse", requireAuth, requirePermission("accounting.manage"), async (req: AuthedRequest, res) => {
  const { reason } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "reason is required" });
    return;
  }
  try {
    const reversal = await reverseJournal(Number(req.params.id), { userId: req.auth!.userId, reason: reason.trim() });
    await recordAudit({
      userId: req.auth!.userId,
      action: "reverse",
      entityType: "JournalTransaction",
      entityId: String(req.params.id),
      details: { reversalId: reversal.id, reason },
    });
    res.status(201).json(reversal);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
