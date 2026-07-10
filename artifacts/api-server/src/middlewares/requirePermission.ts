import type { NextFunction, Response } from "express";
import { User } from "@workspace/db-sequelize";
import type { AuthedRequest } from "./requireAuth";

export function requirePermission(permissionKey: string) {
  return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const user = await User.findByPk(req.auth.userId);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const roles = await user.getRoles();
    for (const role of roles) {
      const permissions = await role.getPermissions?.();
      if (permissions?.some((p) => p.key === permissionKey)) {
        next();
        return;
      }
    }
    res.status(403).json({ error: "Forbidden — missing permission: " + permissionKey });
  };
}
