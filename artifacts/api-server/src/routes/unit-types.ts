import { Router, type IRouter } from "express";
import { UnitType } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/", requireAuth, async (_req, res) => {
  const types = await UnitType.findAll({ order: [["id", "ASC"]] });
  res.json(types);
});

router.post("/", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const { name } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const existing = await UnitType.findOne({ where: { name: name.trim() } });
  if (existing) {
    res.status(409).json({ error: "Unit type already exists" });
    return;
  }
  const unitType = await UnitType.create({ name: name.trim(), isActive: true });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "UnitType", entityId: String(unitType.id) });
  res.status(201).json(unitType);
});

export default router;
