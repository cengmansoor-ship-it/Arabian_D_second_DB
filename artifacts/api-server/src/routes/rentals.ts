import { Router, type IRouter } from "express";
import {
  Rental,
  RentalReceipt,
  Unit,
  Floor,
  Block,
  Party,
  createRental,
  addRentalReceipt,
  reverseRentalReceipt,
  endRental,
  getRentalBalance,
  PostingError,
  type RentalFrequency,
} from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const rentalIncludes = [
  { model: Party, as: "tenant" as const },
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
  const rentals = await Rental.findAll({ where, order: [["id", "DESC"]], include: rentalIncludes });
  const withBalances = await Promise.all(
    rentals.map(async (r) => ({ ...r.toJSON(), balance: await getRentalBalance(r) })),
  );
  res.json(withBalances);
});

router.get("/:id", requireAuth, async (req, res) => {
  const rental = await Rental.findByPk(Number(req.params.id), {
    include: [...rentalIncludes, { model: RentalReceipt, as: "receipts" as const }],
  });
  if (!rental) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }
  const balance = await getRentalBalance(rental);
  res.json({ ...rental.toJSON(), balance });
});

router.post("/", requireAuth, requirePermission("rentals.manage"), async (req: AuthedRequest, res) => {
  const {
    unitId,
    tenantPartyId,
    startDate,
    endDate,
    rentAmount,
    frequency,
    depositAmount,
    currencyCode,
    notes,
    firstReceivedAmount,
    firstReceiptMethod,
    firstReceiptCashAccountId,
    firstReceiptReference,
    firstReceiptNote,
  } = req.body ?? {};
  if (
    typeof unitId !== "number" ||
    typeof tenantPartyId !== "number" ||
    typeof startDate !== "string" ||
    rentAmount === undefined ||
    typeof frequency !== "string" ||
    typeof currencyCode !== "string"
  ) {
    res.status(400).json({ error: "unitId, tenantPartyId, startDate, rentAmount, frequency and currencyCode are required" });
    return;
  }
  try {
    const rental = await createRental({
      unitId,
      tenantPartyId,
      startDate,
      endDate: endDate ?? null,
      rentAmount,
      frequency: frequency as RentalFrequency,
      depositAmount: depositAmount ?? 0,
      currencyCode,
      notes: notes ?? null,
      createdByUserId: req.auth!.userId,
      firstReceivedAmount: firstReceivedAmount ?? null,
      firstReceiptMethod: firstReceiptMethod ?? undefined,
      firstReceiptCashAccountId: firstReceiptCashAccountId ?? null,
      firstReceiptReference: firstReceiptReference ?? null,
      firstReceiptNote: firstReceiptNote ?? null,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Rental", entityId: String(rental.id), details: req.body });
    res.status(201).json(rental);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/receipts", requireAuth, requirePermission("rentals.manage"), async (req: AuthedRequest, res) => {
  const { amount, currencyCode, receiptDate, method, cashAccountId, reference, note, allowOverpayment } = req.body ?? {};
  if (amount === undefined || typeof currencyCode !== "string" || typeof receiptDate !== "string") {
    res.status(400).json({ error: "amount, currencyCode and receiptDate are required" });
    return;
  }
  try {
    const receipt = await addRentalReceipt({
      rentalId: Number(req.params.id),
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
      entityType: "RentalReceipt",
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

router.post("/:id/receipts/:receiptId/reverse", requireAuth, requirePermission("rentals.manage"), async (req: AuthedRequest, res) => {
  const { reason } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({ error: "reason is required" });
    return;
  }
  try {
    const receipt = await reverseRentalReceipt(Number(req.params.receiptId), { userId: req.auth!.userId, reason: reason.trim() });
    await recordAudit({
      userId: req.auth!.userId,
      action: "reverse",
      entityType: "RentalReceipt",
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

router.post("/:id/end", requireAuth, requirePermission("rentals.manage"), async (req: AuthedRequest, res) => {
  const { endDate } = req.body ?? {};
  if (typeof endDate !== "string") {
    res.status(400).json({ error: "endDate is required" });
    return;
  }
  try {
    const rental = await endRental(Number(req.params.id), { userId: req.auth!.userId, endDate });
    await recordAudit({ userId: req.auth!.userId, action: "update", entityType: "Rental", entityId: String(rental.id), details: { endDate } });
    res.json(rental);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
