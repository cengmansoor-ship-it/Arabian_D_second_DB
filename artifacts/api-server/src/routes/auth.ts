import { Router, type IRouter } from "express";
import { User, Role, hashPassword, verifyPassword, signAuthToken } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

const COOKIE_NAME = "auth_token";
const isProduction = process.env["NODE_ENV"] === "production";

router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const user = await User.findOne({ where: { username } });
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signAuthToken({ userId: user.id, username: user.username });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const roles = await user.getRoles();
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    roles: roles.map((r) => r.name),
  });
});

router.post("/logout", (_req, res) => {
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

export default router;
export { COOKIE_NAME };
