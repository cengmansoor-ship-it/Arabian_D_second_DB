import { Router, type IRouter } from "express";
import { User, Role, hashPassword } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

async function serializeUser(user: User) {
  const roles = await user.getRoles();
  const isLocked = !!(user.lockedUntil && user.lockedUntil.getTime() > Date.now());
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: roles.map((r) => r.name),
    createdAt: user.createdAt,
    failedLoginAttempts: user.failedLoginAttempts,
    isLocked,
    lockedUntil: user.lockedUntil,
  };
}

router.get("/", requireAuth, requirePermission("users.manage"), async (_req, res) => {
  const users = await User.findAll({ order: [["id", "ASC"]] });
  res.json(await Promise.all(users.map(serializeUser)));
});

router.post("/", requireAuth, requirePermission("users.manage"), async (req: AuthedRequest, res) => {
  const { username, fullName, password, roleNames } = req.body ?? {};
  if (typeof username !== "string" || !username.trim() || typeof fullName !== "string" || !fullName.trim() || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "username, fullName and password (min 6 chars) are required" });
    return;
  }
  const existing = await User.findOne({ where: { username: username.trim() } });
  if (existing) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }
  const user = await User.create({
    username: username.trim(),
    fullName: fullName.trim(),
    passwordHash: await hashPassword(password),
    isActive: true,
  });
  if (Array.isArray(roleNames) && roleNames.length > 0) {
    const roles = await Role.findAll({ where: { name: roleNames } });
    await user.setRoles(roles);
  }
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "User", entityId: String(user.id) });
  res.status(201).json(await serializeUser(user));
});

router.put("/:id", requireAuth, requirePermission("users.manage"), async (req: AuthedRequest, res) => {
  const user = await User.findByPk(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { fullName, isActive, password, roleNames } = req.body ?? {};
  if (typeof fullName === "string" && fullName.trim()) user.fullName = fullName.trim();
  if (typeof isActive === "boolean") user.isActive = isActive;
  if (typeof password === "string" && password.length >= 6) user.passwordHash = await hashPassword(password);
  await user.save();
  if (Array.isArray(roleNames)) {
    const roles = await Role.findAll({ where: { name: roleNames } });
    await user.setRoles(roles);
  }
  await recordAudit({
    userId: req.auth!.userId,
    action: "update",
    entityType: "User",
    entityId: String(user.id),
    details: { fullName, isActive, roleNames },
  });
  res.json(await serializeUser(user));
});

/** Administrator-only: unlock an account that was locked after repeated failed logins. */
router.post("/:id/unlock", requireAuth, requirePermission("users.manage"), async (req: AuthedRequest, res) => {
  const user = await User.findByPk(Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await user.update({ failedLoginAttempts: 0, lockedUntil: null });
  await recordAudit({
    userId: req.auth!.userId,
    action: "account_unlocked",
    entityType: "User",
    entityId: String(user.id),
  });
  res.json(await serializeUser(user));
});

export default router;
