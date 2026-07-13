import { Router, type IRouter } from "express";
import {
  Unit,
  Floor,
  Block,
  UnitType,
  MANUALLY_SETTABLE_UNIT_STATUSES,
  type UnitStatus,
  type UnitPurpose,
} from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

/** Flat unit search across all projects — used by the sale/rental creation forms to pick a unit. */
router.get("/", requireAuth, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const purpose = typeof req.query.purpose === "string" ? req.query.purpose : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const where: Record<string, unknown> = {};
  if (status) where["status"] = status;
  if (purpose) where["purpose"] = purpose;

  const units = await Unit.findAll({
    where,
    include: [
      { model: UnitType, as: "unitType" as const },
      { model: Floor, as: "floor" as const, include: [{ model: Block, as: "block" as const }] },
    ],
    order: [["id", "DESC"]],
    limit: 500,
  });

  const filtered = q
    ? units.filter((u) => u.unitNumber.toLowerCase().includes(q.toLowerCase()))
    : units;

  res.json(filtered);
});

router.put("/:id", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const unit = await Unit.findByPk(Number(req.params.id));
  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }
  const { status, purpose, areaSqm, notes } = req.body ?? {};
  if (status !== undefined) {
    if (!MANUALLY_SETTABLE_UNIT_STATUSES.includes(status as UnitStatus)) {
      res.status(400).json({
        error: `Status "${status}" cannot be set manually — it is only changed automatically by sales/rental contracts.`,
      });
      return;
    }
    unit.status = status as UnitStatus;
  }
  if (typeof purpose === "string") unit.purpose = purpose as UnitPurpose;
  if (areaSqm !== undefined) unit.areaSqm = areaSqm;
  if (typeof notes === "string") unit.notes = notes;
  await unit.save();
  await recordAudit({ userId: req.auth!.userId, action: "update", entityType: "Unit", entityId: String(unit.id), details: req.body });
  res.json(unit);
});

export default router;
