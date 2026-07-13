import { Router, type IRouter } from "express";
import { User, Role, hashPassword, verifyPassword, signAuthToken } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const COOKIE_NAME = "auth_token";
const isProduction = process.env["NODE_ENV"] === "production";
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const user = await User.findOne({ where: { username } });

  if (!user) {
    // Do not reveal whether the username exists.
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await recordAudit({
      userId: user.id,
      action: "login_blocked_locked",
      entityType: "User",
      entityId: String(user.id),
      details: { lockedUntil: user.lockedUntil },
    });
    res.status(423).json({
      error: "Account is locked due to repeated failed login attempts. Contact an administrator to unlock it.",
      lockedUntil: user.lockedUntil,
    });
    return;
  }

  if (!user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    if (user.isActive) {
      const attempts = user.failedLoginAttempts + 1;
      const patch: { failedLoginAttempts: number; lockedUntil?: Date } = { failedLoginAttempts: attempts };
      let locked = false;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        patch.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        locked = true;
      }
      await user.update(patch);
      await recordAudit({
        userId: user.id,
        action: locked ? "account_locked" : "login_failed",
        entityType: "User",
        entityId: String(user.id),
        details: { failedLoginAttempts: attempts },
      });
    }
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await user.update({ failedLoginAttempts: 0, lockedUntil: null });
  }

  const token = signAuthToken({ userId: user.id, username: user.username });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await recordAudit({ userId: user.id, action: "login", entityType: "User", entityId: String(user.id) });

  const roles = await user.getRoles();
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    roles: roles.map((r) => r.name),
  });
});

router.post("/logout", async (req: AuthedRequest, res) => {
  if (req.auth) {
    await recordAudit({ userId: req.auth.userId, action: "logout", entityType: "User", entityId: String(req.auth.userId) });
  }
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await User.findByPk(req.auth!.userId);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const roles = await user.getRoles();
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    roles: roles.map((r: Role) => r.name),
  });
});

router.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "currentPassword and a newPassword of at least 6 characters are required" });
    return;
  }
  const user = await User.findByPk(req.auth!.userId);
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  await user.update({ passwordHash: await hashPassword(newPassword) });
  await recordAudit({ userId: user.id, action: "password_change", entityType: "User", entityId: String(user.id) });
  res.status(204).send();
});

export default router;
export { COOKIE_NAME };
