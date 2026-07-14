import { Router, type IRouter } from "express";
import { Op } from "sequelize";
import { Party, PartyRole, JournalLine, JournalTransaction, Account, type PartyType } from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

const PARTY_TYPES: PartyType[] = [
  "individual_customer",
  "market_customer",
  "supplier",
  "sales_customer",
  "tenant",
  "exchange_dealer",
  "employee",
  "partner",
  "other",
];

/** Maps the broader Party master types to the narrower journal_lines.partyType enum for ledger lookups. */
function toJournalPartyType(type: PartyType): string {
  switch (type) {
    case "individual_customer":
    case "market_customer":
    case "sales_customer":
      return "customer";
    case "supplier":
      return "supplier";
    case "tenant":
      return "tenant";
    case "exchange_dealer":
      return "exchange_dealer";
    case "employee":
      return "employee";
    case "partner":
      return "partner";
    default:
      return "customer";
  }
}

router.get("/", requireAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const where: Record<string | symbol, unknown> = {};
  if (type) where["type"] = type;
  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { tazkiraNumber: { [Op.like]: `%${q}%` } },
      { phone1: { [Op.like]: `%${q}%` } },
      { phone2: { [Op.like]: `%${q}%` } },
    ];
  }
  const parties = await Party.findAll({ where, order: [["name", "ASC"]], limit: 200 });
  res.json(parties);
});

router.get("/duplicate-check", requireAuth, async (req, res) => {
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
  const tazkiraNumber = typeof req.query.tazkiraNumber === "string" ? req.query.tazkiraNumber.trim() : "";
  if (!name && !tazkiraNumber) {
    res.json([]);
    return;
  }
  const orClauses: Record<string, unknown>[] = [];
  if (name) orClauses.push({ name: { [Op.like]: `%${name}%` } });
  if (tazkiraNumber) orClauses.push({ tazkiraNumber });
  const where: Record<symbol, unknown> = { [Op.or]: orClauses };
  const matches = await Party.findAll({ where, limit: 10 });
  res.json(matches);
});

router.get("/:id", requireAuth, async (req, res) => {
  const party = await Party.findByPk(Number(req.params.id), { include: [{ model: PartyRole, as: "roles" }] });
  if (!party) {
    res.status(404).json({ error: "Party not found" });
    return;
  }
  res.json(party);
});

router.post("/", requireAuth, requirePermission("parties.manage"), async (req: AuthedRequest, res) => {
  const { type, name, fatherName, grandfatherName, tazkiraNumber, taxRegNumber, phone1, phone2, address, notes, photoUrl } =
    req.body ?? {};
  if (typeof type !== "string" || !PARTY_TYPES.includes(type as PartyType) || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "type and name are required" });
    return;
  }
  const party = await Party.create({
    type: type as PartyType,
    name: name.trim(),
    fatherName: fatherName || null,
    grandfatherName: grandfatherName || null,
    tazkiraNumber: tazkiraNumber || null,
    taxRegNumber: taxRegNumber || null,
    phone1: phone1 || null,
    phone2: phone2 || null,
    address: address || null,
    notes: notes || null,
    photoUrl: photoUrl || null,
  });
  await PartyRole.findOrCreate({ where: { partyId: party.id, role: type as PartyType }, defaults: { partyId: party.id, role: type as PartyType } });
  await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Party", entityId: String(party.id), details: req.body });
  res.status(201).json(party);
});

router.put("/:id", requireAuth, requirePermission("parties.manage"), async (req: AuthedRequest, res) => {
  const party = await Party.findByPk(Number(req.params.id));
  if (!party) {
    res.status(404).json({ error: "Party not found" });
    return;
  }
  const { type, name, fatherName, grandfatherName, tazkiraNumber, taxRegNumber, phone1, phone2, address, notes, photoUrl, isActive } =
    req.body ?? {};
  if (typeof type === "string" && PARTY_TYPES.includes(type as PartyType)) {
    party.type = type as PartyType;
    await PartyRole.findOrCreate({ where: { partyId: party.id, role: type as PartyType }, defaults: { partyId: party.id, role: type as PartyType } });
  }
  if (typeof name === "string" && name.trim()) party.name = name.trim();
  if (fatherName !== undefined) party.fatherName = fatherName || null;
  if (grandfatherName !== undefined) party.grandfatherName = grandfatherName || null;
  if (tazkiraNumber !== undefined) party.tazkiraNumber = tazkiraNumber || null;
  if (taxRegNumber !== undefined) party.taxRegNumber = taxRegNumber || null;
  if (phone1 !== undefined) party.phone1 = phone1 || null;
  if (phone2 !== undefined) party.phone2 = phone2 || null;
  if (address !== undefined) party.address = address || null;
  if (notes !== undefined) party.notes = notes || null;
  if (photoUrl !== undefined) party.photoUrl = photoUrl || null;
  if (typeof isActive === "boolean") party.isActive = isActive;
  await party.save();
  await recordAudit({ userId: req.auth!.userId, action: "update", entityType: "Party", entityId: String(party.id), details: req.body });
  res.json(party);
});

router.get("/:id/ledger", requireAuth, async (req, res) => {
  const party = await Party.findByPk(Number(req.params.id));
  if (!party) {
    res.status(404).json({ error: "Party not found" });
    return;
  }
  const currencyCode = typeof req.query.currency === "string" ? req.query.currency : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const journalPartyType = toJournalPartyType(party.type);
  const lineWhere: Record<string | symbol, unknown> = { partyType: journalPartyType, partyId: party.id };
  if (currencyCode) lineWhere["currencyCode"] = currencyCode;
  if (q) lineWhere[Op.or] = [{ description: { [Op.like]: `%${q}%` } }];

  const txWhere: Record<string, unknown> = {};
  if (startDate || endDate) {
    const df: Record<symbol, string> = {};
    if (startDate) df[Op.gte] = startDate;
    if (endDate) df[Op.lte] = endDate;
    txWhere["transactionDate"] = df;
  }
  const hasDateFilter = Object.keys(txWhere).length > 0;

  const lines = await JournalLine.findAll({
    where: lineWhere,
    include: [
      {
        model: JournalTransaction,
        as: "transaction",
        ...(hasDateFilter ? { where: txWhere, required: true } : {}),
      },
      { model: Account, as: "account" },
    ],
    order: [[{ model: JournalTransaction, as: "transaction" }, "transactionDate", "ASC"]],
  });

  const balances = new Map<string, { debit: string; credit: string }>();
  for (const line of lines) {
    const bucket = balances.get(line.currencyCode) ?? { debit: "0", credit: "0" };
    if (line.direction === "debit") bucket.debit = (Number(bucket.debit) + Number(line.amount)).toFixed(4);
    else bucket.credit = (Number(bucket.credit) + Number(line.amount)).toFixed(4);
    balances.set(line.currencyCode, bucket);
  }

  res.json({
    party,
    lines,
    balances: Object.fromEntries(
      Array.from(balances.entries()).map(([code, b]) => [
        code,
        { debit: b.debit, credit: b.credit, net: (Number(b.debit) - Number(b.credit)).toFixed(4) },
      ]),
    ),
  });
});

export default router;
