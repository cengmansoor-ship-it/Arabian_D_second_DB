import { Router, type IRouter } from "express";
import { Op } from "sequelize";
import { ExchangeTransaction, Party, createExchangeTransaction, PostingError } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  const partyId = typeof req.query.partyId === "string" ? Number(req.query.partyId) || undefined : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const where: Record<string | symbol, unknown> = {};
  if (partyId) where["partyId"] = partyId;
  if (startDate || endDate) {
    const df: Record<symbol, string> = {};
    if (startDate) df[Op.gte] = startDate;
    if (endDate) df[Op.lte] = endDate;
    where["exchangeDate"] = df;
  }
  if (q) {
    where[Op.or] = [
      { reference: { [Op.like]: `%${q}%` } },
      { notes: { [Op.like]: `%${q}%` } },
    ];
  }
  const exchanges = await ExchangeTransaction.findAll({
    where,
    order: [["id", "DESC"]],
    include: [{ model: Party, as: "party" as const }],
  });
  res.json(exchanges);
});

router.get("/:id", requireAuth, async (req, res) => {
  const exchange = await ExchangeTransaction.findByPk(Number(req.params.id), {
    include: [{ model: Party, as: "party" as const }],
  });
  if (!exchange) {
    res.status(404).json({ error: "Exchange transaction not found" });
    return;
  }
  res.json(exchange);
});

router.post("/", requireAuth, requirePermission("exchange.manage"), async (req: AuthedRequest, res) => {
  const { partyId, exchangeDate, currencyGiven, amountGiven, currencyReceived, amountReceived, rate, fee, reference, notes } =
    req.body ?? {};
  if (
    typeof partyId !== "number" ||
    typeof exchangeDate !== "string" ||
    typeof currencyGiven !== "string" ||
    amountGiven === undefined ||
    typeof currencyReceived !== "string" ||
    amountReceived === undefined ||
    rate === undefined
  ) {
    res.status(400).json({
      error: "partyId, exchangeDate, currencyGiven, amountGiven, currencyReceived, amountReceived and rate are required",
    });
    return;
  }
  try {
    const exchange = await createExchangeTransaction({
      partyId,
      exchangeDate,
      currencyGiven,
      amountGiven,
      currencyReceived,
      amountReceived,
      rate,
      fee: fee ?? 0,
      reference: reference ?? null,
      notes: notes ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "ExchangeTransaction",
      entityId: String(exchange.id),
      details: req.body,
    });
    res.status(201).json(exchange);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
