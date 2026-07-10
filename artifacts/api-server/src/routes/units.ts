import { Router, type IRouter } from "express";
import { Unit, MANUALLY_SETTABLE_UNIT_STATUSES, type UnitStatus, type UnitPurpose } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

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
