import { Router, type IRouter } from "express";
import { Partner, PartnerTransaction, Party, createPartner, addPartnerTransaction, getPartnerBalance, PostingError } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const partnerIncludes = [{ model: Party, as: "party" as const }];

router.get("/", requireAuth, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const where: Record<string, unknown> = {};
  if (status) where["status"] = status;
  const partners = await Partner.findAll({ where, order: [["id", "DESC"]], include: partnerIncludes });
  const withBalances = await Promise.all(
    partners.map(async (p) => ({ ...p.toJSON(), balance: await getPartnerBalance(p) })),
  );
  res.json(withBalances);
});

router.get("/:id", requireAuth, async (req, res) => {
  const partner = await Partner.findByPk(Number(req.params.id), {
    include: [...partnerIncludes, { model: PartnerTransaction, as: "transactions" as const }],
  });
  if (!partner) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }
  const balance = await getPartnerBalance(partner);
  res.json({ ...partner.toJSON(), balance });
});

router.post("/", requireAuth, requirePermission("partners.manage"), async (req: AuthedRequest, res) => {
  const { partyId, initialInvestment, currencyCode, ownershipPercent, joinDate, notes } = req.body ?? {};
  if (typeof partyId !== "number" || initialInvestment === undefined || typeof currencyCode !== "string" || typeof joinDate !== "string") {
    res.status(400).json({ error: "partyId, initialInvestment, currencyCode and joinDate are required" });
    return;
  }
  try {
    const partner = await createPartner({
      partyId,
      initialInvestment,
      currencyCode,
      ownershipPercent: ownershipPercent ?? null,
      joinDate,
      notes: notes ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Partner", entityId: String(partner.id), details: req.body });
    res.status(201).json(partner);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/transactions", requireAuth, requirePermission("partners.manage"), async (req: AuthedRequest, res) => {
  const { type, amount, currencyCode, transactionDate, cashAccountId, note } = req.body ?? {};
  if (typeof type !== "string" || amount === undefined || typeof currencyCode !== "string" || typeof transactionDate !== "string") {
    res.status(400).json({ error: "type, amount, currencyCode and transactionDate are required" });
    return;
  }
  try {
    const tx = await addPartnerTransaction({
      partnerId: Number(req.params.id),
      type: type as "investment" | "withdrawal",
      amount,
      currencyCode,
      transactionDate,
      cashAccountId: cashAccountId ?? null,
      note: note ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "PartnerTransaction",
      entityId: String(tx.id),
      details: req.body,
    });
    res.status(201).json(tx);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
