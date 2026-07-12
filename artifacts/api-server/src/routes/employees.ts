import { Router, type IRouter } from "express";
import {
  Employee,
  Attendance,
  EmployeePayment,
  createEmployee,
  recordAttendance,
  addEmployeePayment,
  getEmployeeBalance,
  PostingError,
  type EmployeeWageType,
  type AttendanceStatus,
} from "@workspace/db-sequelize";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { requirePermission } from "../middlewares/requirePermission";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const where: Record<string, unknown> = {};
  if (status) where["status"] = status;
  const employees = await Employee.findAll({ where, order: [["id", "DESC"]] });
  const withBalances = await Promise.all(
    employees.map(async (e) => ({ ...e.toJSON(), balance: await getEmployeeBalance(e) })),
  );
  res.json(withBalances);
});

router.get("/:id", requireAuth, async (req, res) => {
  const employee = await Employee.findByPk(Number(req.params.id), {
    include: [
      { model: Attendance, as: "attendances" as const },
      { model: EmployeePayment, as: "payments" as const },
    ],
  });
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  const balance = await getEmployeeBalance(employee);
  res.json({ ...employee.toJSON(), balance });
});

router.post("/", requireAuth, requirePermission("hr.manage"), async (req: AuthedRequest, res) => {
  const { name, fatherName, phone, position, wageType, wageAmount, currencyCode, startDate, notes } = req.body ?? {};
  if (
    typeof name !== "string" ||
    typeof position !== "string" ||
    typeof wageType !== "string" ||
    wageAmount === undefined ||
    typeof currencyCode !== "string" ||
    typeof startDate !== "string"
  ) {
    res.status(400).json({ error: "name, position, wageType, wageAmount, currencyCode and startDate are required" });
    return;
  }
  try {
    const employee = await createEmployee({
      name,
      fatherName: fatherName ?? null,
      phone: phone ?? null,
      position,
      wageType: wageType as EmployeeWageType,
      wageAmount,
      currencyCode,
      startDate,
      notes: notes ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({ userId: req.auth!.userId, action: "create", entityType: "Employee", entityId: String(employee.id), details: req.body });
    res.status(201).json(employee);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/attendance", requireAuth, requirePermission("hr.manage"), async (req: AuthedRequest, res) => {
  const { date, status, notes } = req.body ?? {};
  if (typeof date !== "string" || typeof status !== "string") {
    res.status(400).json({ error: "date and status are required" });
    return;
  }
  try {
    const attendance = await recordAttendance({
      employeeId: Number(req.params.id),
      date,
      status: status as AttendanceStatus,
      notes: notes ?? null,
      createdByUserId: req.auth!.userId,
    });
    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "Attendance",
      entityId: String(attendance.id),
      details: req.body,
    });
    res.status(201).json(attendance);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/:id/payments", requireAuth, requirePermission("hr.manage"), async (req: AuthedRequest, res) => {
  const { amount, type, currencyCode, paymentDate, method, cashAccountId, note } = req.body ?? {};
  if (amount === undefined || typeof type !== "string" || typeof currencyCode !== "string" || typeof paymentDate !== "string") {
    res.status(400).json({ error: "amount, type, currencyCode and paymentDate are required" });
    return;
  }
  try {
    const payment = await addEmployeePayment({
      employeeId: Number(req.params.id),
      amount,
      type: type as "salary" | "advance",
      currencyCode,
      paymentDate,
      method,
      cashAccountId: cashAccountId ?? null,
      note: note ?? null,
      paidByUserId: req.auth!.userId,
    });
    await recordAudit({
      userId: req.auth!.userId,
      action: "create",
      entityType: "EmployeePayment",
      entityId: String(payment.id),
      details: req.body,
    });
    res.status(201).json(payment);
  } catch (err) {
    if (err instanceof PostingError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
