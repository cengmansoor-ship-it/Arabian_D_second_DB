import { Router, type IRouter } from "express";
import { Project, BlockGroup, Block, Floor, Unit, UnitType } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();
const PROJECT_STATUSES = ["draft", "active", "on_hold", "completed", "archived"];

router.get("/", requireAuth, async (_req, res) => {
  const projects = await Project.findAll({ order: [["id", "ASC"]] });
  res.json(projects);
});

router.get("/:id", requireAuth, async (req, res) => {
  const project = await Project.findByPk(Number(req.params.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.post("/", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const { name, code, description, status } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "name and code are required" });
    return;
  }
  const existing = await Project.findOne({ where: { code: code.trim() } });
  if (existing) {
    res.status(409).json({ error: "Project code already exists" });
    return;
  }
  const project = await Project.create({
    name: name.trim(),
    code: code.trim(),
    description: description ?? null,
    status: PROJECT_STATUSES.includes(status) ? status : "draft",
  });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Project", entityId: String(project.id) });
  res.status(201).json(project);
});

router.put("/:id", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const project = await Project.findByPk(Number(req.params.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { name, description, status } = req.body ?? {};
  if (typeof name === "string" && name.trim()) project.name = name.trim();
  if (typeof description === "string") project.description = description;
  if (PROJECT_STATUSES.includes(status)) project.status = status;
  await project.save();
  await recordAudit({ userId: req.auth!.userId, action: "update", entityType: "Project", entityId: String(project.id), details: req.body });
  res.json(project);
});

// ---- Block groups ----
router.get("/:id/block-groups", requireAuth, async (req, res) => {
  const groups = await BlockGroup.findAll({ where: { projectId: Number(req.params.id) }, order: [["order", "ASC"]] });
  res.json(groups);
});

router.post("/:id/block-groups", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const { name, order } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const group = await BlockGroup.create({ projectId: Number(req.params.id), name: name.trim(), order: order ?? 0 });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "BlockGroup", entityId: String(group.id) });
  res.status(201).json(group);
});

// ---- Blocks ----
router.get("/:id/blocks", requireAuth, async (req, res) => {
  const blocks = await Block.findAll({ where: { projectId: Number(req.params.id) }, order: [["order", "ASC"]] });
  res.json(blocks);
});

router.post("/:id/blocks", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const { name, code, blockGroupId, order, notes } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof code !== "string" || !code.trim()) {
    res.status(400).json({ error: "name and code are required" });
    return;
  }
  const projectId = Number(req.params.id);
  const existing = await Block.findOne({ where: { projectId, code: code.trim() } });
  if (existing) {
    res.status(409).json({ error: "Block code already exists in this project" });
    return;
  }
  const block = await Block.create({
    projectId,
    blockGroupId: blockGroupId ?? null,
    name: name.trim(),
    code: code.trim(),
    order: order ?? 0,
    notes: notes ?? null,
  });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Block", entityId: String(block.id) });
  res.status(201).json(block);
});

router.put("/:id/blocks/:blockId", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const block = await Block.findOne({ where: { id: Number(req.params.blockId), projectId: Number(req.params.id) } });
  if (!block) {
    res.status(404).json({ error: "Block not found" });
    return;
  }
  const { name, order, notes, blockGroupId } = req.body ?? {};
  if (typeof name === "string" && name.trim()) block.name = name.trim();
  if (typeof order === "number") block.order = order;
  if (typeof notes === "string") block.notes = notes;
  if (blockGroupId !== undefined) block.blockGroupId = blockGroupId;
  await block.save();
  await recordAudit({ userId: req.auth!.userId, action: "update", entityType: "Block", entityId: String(block.id) });
  res.json(block);
});

// ---- Floors ----
router.get("/:id/blocks/:blockId/floors", requireAuth, async (req, res) => {
  const floors = await Floor.findAll({ where: { blockId: Number(req.params.blockId) }, order: [["order", "ASC"]] });
  res.json(floors);
});

router.post("/:id/blocks/:blockId/floors", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const { name, levelNumber, floorType, order } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof levelNumber !== "number") {
    res.status(400).json({ error: "name and levelNumber are required" });
    return;
  }
  const blockId = Number(req.params.blockId);
  const existing = await Floor.findOne({ where: { blockId, levelNumber } });
  if (existing) {
    res.status(409).json({ error: "A floor with this level number already exists in this block" });
    return;
  }
  const floor = await Floor.create({
    blockId,
    name: name.trim(),
    levelNumber,
    floorType: floorType ?? "residential",
    order: order ?? levelNumber,
  });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Floor", entityId: String(floor.id) });
  res.status(201).json(floor);
});

// ---- Units ----
router.get("/:id/unit-map", requireAuth, async (req, res) => {
  const projectId = Number(req.params.id);
  const blocks = await Block.findAll({
    where: { projectId },
    order: [["order", "ASC"]],
    include: [
      {
        model: Floor,
        as: "floors",
        include: [{ model: Unit, as: "units", include: [{ model: UnitType, as: "unitType" }] }],
      },
    ],
  });
  res.json(blocks);
});

router.post("/:id/blocks/:blockId/floors/:floorId/units", requireAuth, requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  const { unitNumber, unitTypeId, purpose, areaSqm, notes } = req.body ?? {};
  if (typeof unitNumber !== "string" || !unitNumber.trim() || typeof unitTypeId !== "number") {
    res.status(400).json({ error: "unitNumber and unitTypeId are required" });
    return;
  }
  const floorId = Number(req.params.floorId);
  const existing = await Unit.findOne({ where: { floorId, unitNumber: unitNumber.trim() } });
  if (existing) {
    res.status(409).json({ error: "A unit with this number already exists on this floor" });
    return;
  }
  const unit = await Unit.create({
    floorId,
    unitTypeId,
    unitNumber: unitNumber.trim(),
    purpose: purpose ?? "not_available",
    areaSqm: areaSqm ?? null,
    notes: notes ?? null,
  });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Unit", entityId: String(unit.id) });
  res.status(201).json(unit);
});

export default router;
