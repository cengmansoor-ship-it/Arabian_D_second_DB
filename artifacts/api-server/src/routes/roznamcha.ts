import { Router, type IRouter } from "express";
import { createDailyCashEntry, voidDailyCashEntry, getDailyCashPage, PostingError } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

// GET /api/roznamcha?currency=AFN&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/", requireAuth, async (req, res) => {
  const currencyCode = typeof req.query.currency === "string" ? req.query.currency : "AFN";
  const today = new Date().toISOString().slice(0, 10);
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : today;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : today;

  const page = await getDailyCashPage({ currencyCode, startDate, endDate });
  res.json(page);
});

// POST /api/roznamcha
router.post("/", requireAuth, requirePermission("accounting.manage"), async (req: AuthedRequest, res) => {
  const { entryDate, currencyCode, description, partyId, amountIn, amountOut } = req.body ?? {};

  if (!entryDate || !currencyCode || !description) {
    res.status(400).json({ error: "entryDate, currencyCode, and description are required" });
    return;
  }

  try {
    const entry = await createDailyCashEntry({
      entryDate,
      currencyCode,
      description,
      partyId: partyId ?? null,
      amountIn: amountIn ?? null,
      amountOut: amountOut ?? null,
      createdByUserId: req.auth!.userId,
    });

    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "DailyCashEntry",
      entityId: String(entry.id),
      details: { currencyCode, description, amountIn, amountOut },
    });

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// DELETE /api/roznamcha/:id  (void)
router.delete("/:id", requireAuth, requirePermission("accounting.manage"), async (req: AuthedRequest, res) => {
  const { reason } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "reason is required" });
    return;
  }
  try {
    const entry = await voidDailyCashEntry(Number(req.params.id), { userId: req.auth!.userId, reason: reason.trim() });
    await recordAudit({
      userId: req.auth!.userId,
      action: "void",
      entityType: "DailyCashEntry",
      entityId: String(entry.id),
      details: { reason },
    });
    res.json(entry);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
