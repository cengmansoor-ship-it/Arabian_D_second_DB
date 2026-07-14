import { Router, type IRouter } from "express";
import { Op } from "sequelize";
import { Expense, Party, Project, createExpense, voidExpense, PostingError, type ExpenseCategory } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const expenseIncludes = [
  { model: Party, as: "payeeParty" as const },
  { model: Project, as: "project" as const },
];

router.get("/", requireAuth, async (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const where: Record<string | symbol, unknown> = {};
  if (category) where["category"] = category;
  if (startDate || endDate) {
    const df: Record<symbol, string> = {};
    if (startDate) df[Op.gte] = startDate;
    if (endDate) df[Op.lte] = endDate;
    where["expenseDate"] = df;
  }
  if (q) {
    where[Op.or] = [
      { description: { [Op.like]: `%${q}%` } },
      { payeeName: { [Op.like]: `%${q}%` } },
    ];
  }
  const expenses = await Expense.findAll({ where, order: [["id", "DESC"]], include: expenseIncludes });
  res.json(expenses);
});

router.get("/:id", requireAuth, async (req, res) => {
  const expense = await Expense.findByPk(Number(req.params.id), { include: expenseIncludes });
  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json(expense);
});

router.post("/", requireAuth, requirePermission("expenses.manage"), async (req: AuthedRequest, res) => {
  const { category, expenseDate, description, amount, currencyCode, payeePartyId, payeeName, projectId, cashAccountId } = req.body ?? {};
  if (
    typeof category !== "string" ||
    typeof expenseDate !== "string" ||
    typeof description !== "string" ||
    amount === undefined ||
    typeof currencyCode !== "string"
  ) {
    res.status(400).json({ error: "category, expenseDate, description, amount and currencyCode are required" });
    return;
  }
  try {
    const expense = await createExpense({
      category: category as ExpenseCategory,
      expenseDate,
      description,
      amount,
      currencyCode,
      payeePartyId: payeePartyId ?? null,
      payeeName: payeeName ?? null,
      projectId: projectId ?? null,
      cashAccountId: cashAccountId ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Expense", entityId: String(expense.id), details: req.body });
    res.status(201).json(expense);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/void", requireAuth, requirePermission("expenses.manage"), async (req: AuthedRequest, res) => {
  const { reason } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "reason is required" });
    return;
  }
  try {
    const expense = await voidExpense(Number(req.params.id), { userId: req.auth!.userId, reason: reason.trim() });
    await recordAudit({ userId: req.auth!.userId, action: "reverse", entityType: "Expense", entityId: String(expense.id), details: { reason } });
    res.json(expense);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
