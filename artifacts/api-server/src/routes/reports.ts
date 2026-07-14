import { Router, type IRouter } from "express";
import { getProfitAndLoss, getDashboardSummary, getGeneralReport, getMonthlyTrends } from "@workspace/db-sequelize";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";

const router: IRouter = Router();

router.get("/profit-loss", requireAuth, requirePermission("reports.view"), async (req, res) => {
  const { currencyCode, startDate, endDate } = req.query;
  if (typeof currencyCode !== "string" || typeof startDate !== "string" || typeof endDate !== "string") {
    res.status(400).json({ error: "currencyCode, startDate and endDate query parameters are required" });
    return;
  }
  const report = await getProfitAndLoss({ currencyCode, startDate, endDate });
  res.json(report);
});

router.get("/dashboard", requireAuth, async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const summary = await getDashboardSummary(today);
  res.json(summary);
});

router.get("/monthly-trends", requireAuth, async (req, res) => {
  const { currencyCode = "AFN", months } = req.query;
  const n = typeof months === "string" ? Math.min(24, Math.max(3, Number(months))) : 12;
  const report = await getMonthlyTrends(typeof currencyCode === "string" ? currencyCode : "AFN", n);
  res.json(report);
});

router.get("/general", requireAuth, requirePermission("reports.view"), async (req, res) => {
  const { currencyCode, startDate, endDate } = req.query;
  if (typeof currencyCode !== "string" || typeof startDate !== "string" || typeof endDate !== "string") {
    res.status(400).json({ error: "currencyCode, startDate and endDate query parameters are required" });
    return;
  }
  const report = await getGeneralReport({ currencyCode, startDate, endDate });
  res.json(report);
});

export default router;
