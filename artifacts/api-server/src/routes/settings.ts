import { Router, type IRouter } from "express";
import { CompanySetting, Currency } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/", requireAuth, async (_req, res) => {
  const settings = await CompanySetting.findByPk(1);
  res.json(settings);
});

router.put("/", requireAuth, requirePermission("settings.manage"), async (req: AuthedRequest, res) => {
  const { companyName, baseCurrencyCode, fiscalYearStartMonth, locale, logoUrl, address, phone, whatsapp, email, website } = req.body ?? {};
  const settings = await CompanySetting.findByPk(1);
  if (!settings) {
    res.status(404).json({ error: "Company settings not found" });
    return;
  }
  if (typeof companyName === "string" && companyName.trim()) settings.companyName = companyName.trim();
  if (typeof baseCurrencyCode === "string" && baseCurrencyCode.trim()) settings.baseCurrencyCode = baseCurrencyCode.trim().toUpperCase();
  if (typeof fiscalYearStartMonth === "number" && fiscalYearStartMonth >= 1 && fiscalYearStartMonth <= 12) {
    settings.fiscalYearStartMonth = fiscalYearStartMonth;
  }
  if (typeof locale === "string" && locale.trim()) settings.locale = locale.trim();
  if (typeof logoUrl === "string" || logoUrl === null) settings.logoUrl = logoUrl;
  if (typeof address === "string" || address === null) settings.address = address;
  if (typeof phone === "string" || phone === null) settings.phone = phone;
  if (typeof whatsapp === "string" || whatsapp === null) settings.whatsapp = whatsapp;
  if (typeof email === "string" || email === null) settings.email = email;
  if (typeof website === "string" || website === null) settings.website = website;
  await settings.save();
  await recordAudit({
    userId: req.auth!.userId,
    action: "update",
    entityType: "CompanySetting",
    entityId: "1",
    details: req.body,
  });
  res.json(settings);
});

router.get("/currencies", requireAuth, async (_req, res) => {
  const currencies = await Currency.findAll({ order: [["id", "ASC"]] });
  res.json(currencies);
});

router.post("/currencies", requireAuth, requirePermission("settings.manage"), async (req: AuthedRequest, res) => {
  const { code, name } = req.body ?? {};
  if (typeof code !== "string" || !code.trim() || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "code and name are required" });
    return;
  }
  const existing = await Currency.findOne({ where: { code: code.trim().toUpperCase() } });
  if (existing) {
    res.status(409).json({ error: "Currency code already exists" });
    return;
  }
  const currency = await Currency.create({ code: code.trim().toUpperCase(), name: name.trim(), isBase: false });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Currency", entityId: String(currency.id) });
  res.status(201).json(currency);
});

export default router;
