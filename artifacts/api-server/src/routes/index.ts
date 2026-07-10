import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import usersRouter from "./users";
import rolesRouter from "./roles";
import auditLogsRouter from "./audit-logs";
import projectsRouter from "./projects";
import unitsRouter from "./units";
import unitTypesRouter from "./unit-types";
import journalRouter from "./journal";
import cashAccountsRouter from "./cash-accounts";
import partiesRouter from "./parties";
import salesRouter from "./sales";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/settings", settingsRouter);
router.use("/users", usersRouter);
router.use("/roles", rolesRouter);
router.use("/audit-logs", auditLogsRouter);
router.use("/projects", projectsRouter);
router.use("/units", unitsRouter);
router.use("/unit-types", unitTypesRouter);
router.use("/journal", journalRouter);
router.use("/cash-accounts", cashAccountsRouter);
router.use("/parties", partiesRouter);
router.use("/sales", salesRouter);

export default router;
