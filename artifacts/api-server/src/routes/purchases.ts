import { Router, type IRouter } from "express";
import {
  Purchase,
  PurchasePayment,
  PurchaseReturn,
  Party,
  createPurchase,
  addPurchasePayment,
  createPurchaseReturn,
  getPurchaseBalance,
  PostingError,
} from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const purchaseIncludes = [{ model: Party, as: "supplier" as const }];

router.get("/", requireAuth, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const where: Record<string, unknown> = {};
  if (status) where["status"] = status;
  const purchases = await Purchase.findAll({ where, order: [["id", "DESC"]], include: purchaseIncludes });
  const withBalances = await Promise.all(
    purchases.map(async (p) => ({ ...p.toJSON(), balance: await getPurchaseBalance(p) })),
  );
  res.json(withBalances);
});

router.get("/:id", requireAuth, async (req, res) => {
  const purchase = await Purchase.findByPk(Number(req.params.id), {
    include: [
      ...purchaseIncludes,
      { model: PurchasePayment, as: "payments" as const },
      { model: PurchaseReturn, as: "returns" as const },
    ],
  });
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }
  const balance = await getPurchaseBalance(purchase);
  res.json({ ...purchase.toJSON(), balance });
});

router.post("/", requireAuth, requirePermission("purchases.manage"), async (req: AuthedRequest, res) => {
  const { supplierPartyId, purchaseDate, itemName, quantity, unitOfMeasure, unitPrice, currencyCode, notes } = req.body ?? {};
  if (
    typeof supplierPartyId !== "number" ||
    typeof purchaseDate !== "string" ||
    typeof itemName !== "string" ||
    quantity === undefined ||
    unitPrice === undefined ||
    typeof currencyCode !== "string"
  ) {
    res.status(400).json({ error: "supplierPartyId, purchaseDate, itemName, quantity, unitPrice and currencyCode are required" });
    return;
  }
  try {
    const purchase = await createPurchase({
      supplierPartyId,
      purchaseDate,
      itemName,
      quantity,
      unitOfMeasure: unitOfMeasure ?? null,
      unitPrice,
      currencyCode,
      notes: notes ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Purchase", entityId: String(purchase.id), details: req.body });
    res.status(201).json(purchase);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/payments", requireAuth, requirePermission("purchases.manage"), async (req: AuthedRequest, res) => {
  const { amount, currencyCode, paymentDate, method, cashAccountId, reference, note } = req.body ?? {};
  if (amount === undefined || typeof currencyCode !== "string" || typeof paymentDate !== "string") {
    res.status(400).json({ error: "amount, currencyCode and paymentDate are required" });
    return;
  }
  try {
    const payment = await addPurchasePayment({
      purchaseId: Number(req.params.id),
      amount,
      currencyCode,
      paymentDate,
      method,
      cashAccountId: cashAccountId ?? null,
      reference: reference ?? null,
      note: note ?? null,
      paidByUserId: req.auth!.userId,
    });
    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "PurchasePayment",
      entityId: String(payment.id),
      details: req.body,
    });
    res.status(201).json(payment);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/returns", requireAuth, requirePermission("purchases.manage"), async (req: AuthedRequest, res) => {
  const { returnDate, returnedItemName, quantity, amount, currencyCode, reason } = req.body ?? {};
  if (
    typeof returnDate !== "string" ||
    typeof returnedItemName !== "string" ||
    quantity === undefined ||
    amount === undefined ||
    typeof currencyCode !== "string" ||
    typeof reason !== "string"
  ) {
    res.status(400).json({ error: "returnDate, returnedItemName, quantity, amount, currencyCode and reason are required" });
    return;
  }
  try {
    const ret = await createPurchaseReturn({
      purchaseId: Number(req.params.id),
      returnDate,
      returnedItemName,
      quantity,
      amount,
      currencyCode,
      reason,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "PurchaseReturn", entityId: String(ret.id), details: req.body });
    res.status(201).json(ret);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
