import { Router, type IRouter } from "express";
import {
  Sale,
  SaleReceipt,
  Unit,
  Floor,
  Block,
  Party,
  createSale,
  addSaleReceipt,
  reverseSaleReceipt,
  getSaleBalance,
  PostingError,
} from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const saleIncludes = [
  { model: Party, as: "party" as const },
  {
    model: Unit,
    as: "unit" as const,
    include: [{ model: Floor, as: "floor" as const, include: [{ model: Block, as: "block" as const }] }],
  },
];

router.get("/", requireAuth, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const where: Record<string, unknown> = {};
  if (status) where["status"] = status;
  const sales = await Sale.findAll({ where, order: [["id", "DESC"]], include: saleIncludes });
  const withBalances = await Promise.all(
    sales.map(async (s) => ({ ...s.toJSON(), balance: await getSaleBalance(s) })),
  );
  res.json(withBalances);
});

router.get("/:id", requireAuth, async (req, res) => {
  const sale = await Sale.findByPk(Number(req.params.id), {
    include: [...saleIncludes, { model: SaleReceipt, as: "receipts" as const }],
  });
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  const balance = await getSaleBalance(sale);
  res.json({ ...sale.toJSON(), balance });
});

router.post("/", requireAuth, requirePermission("sales.manage"), async (req: AuthedRequest, res) => {
  const {
    unitId,
    partyId,
    price,
    discount,
    currencyCode,
    saleDate,
    paymentType,
    contractNumber,
    notes,
    status,
    firstReceivedAmount,
    firstReceiptMethod,
    firstReceiptCashAccountId,
    firstReceiptReference,
    firstReceiptNote,
  } = req.body ?? {};
  if (typeof unitId !== "number" || typeof partyId !== "number" || price === undefined || typeof currencyCode !== "string" || typeof saleDate !== "string") {
    res.status(400).json({ error: "unitId, partyId, price, currencyCode and saleDate are required" });
    return;
  }
  try {
    const sale = await createSale({
      unitId,
      partyId,
      price,
      discount,
      currencyCode,
      saleDate,
      paymentType: paymentType ?? null,
      contractNumber: contractNumber ?? null,
      notes: notes ?? null,
      status,
      createdByUserId: req.auth!.userId,
      firstReceivedAmount: firstReceivedAmount ?? null,
      firstReceiptMethod: firstReceiptMethod ?? undefined,
      firstReceiptCashAccountId: firstReceiptCashAccountId ?? null,
      firstReceiptReference: firstReceiptReference ?? null,
      firstReceiptNote: firstReceiptNote ?? null,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Sale", entityId: String(sale.id), details: req.body });
    res.status(201).json(sale);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/receipts", requireAuth, requirePermission("sales.manage"), async (req: AuthedRequest, res) => {
  const { amount, currencyCode, receiptDate, method, cashAccountId, reference, note, allowOverpayment } = req.body ?? {};
  if (amount === undefined || typeof currencyCode !== "string" || typeof receiptDate !== "string") {
    res.status(400).json({ error: "amount, currencyCode and receiptDate are required" });
    return;
  }
  try {
    const receipt = await addSaleReceipt({
      saleId: Number(req.params.id),
      amount,
      currencyCode,
      receiptDate,
      method,
      cashAccountId: cashAccountId ?? null,
      reference: reference ?? null,
      note: note ?? null,
      receivedByUserId: req.auth!.userId,
      allowOverpayment: Boolean(allowOverpayment),
    });
    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "SaleReceipt",
      entityId: String(receipt.id),
      details: req.body,
    });
    res.status(201).json(receipt);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/receipts/:receiptId/reverse", requireAuth, requirePermission("sales.manage"), async (req: AuthedRequest, res) => {
  const { reason } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "reason is required" });
    return;
  }
  try {
    const receipt = await reverseSaleReceipt(Number(req.params.receiptId), { userId: req.auth!.userId, reason: reason.trim() });
    await recordAudit({
      userId: req.auth!.userId,
      action: "reverse",
      entityType: "SaleReceipt",
      entityId: String(receipt.id),
      details: { reason },
    });
    res.status(201).json(receipt);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
