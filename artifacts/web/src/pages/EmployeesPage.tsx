import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, LayoutGrid, List } from "lucide-react";
import { api, type Employee, type EmployeeStatus, type EmployeeWageType } from "../lib/api";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString, todayIso } from "../lib/jalali";

const STATUS_LABELS: Record<EmployeeStatus, string> = { active: "فعال", inactive: "غیرفعال" };
const WAGE_LABELS: Record<EmployeeWageType, string> = { daily: "ورځنۍ مزد", monthly: "میاشتنۍ معاش" };

const CURRENCY_LABELS: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
};

interface NewEmployeeForm {
  name: string;
  fatherName: string;
  phone: string;
  position: string;
  wageType: EmployeeWageType;
  wageAmount: string;
  currencyCode: string;
  startDate: string;
  notes: string;
}

function emptyForm(): NewEmployeeForm {
  return {
    name: "",
    fatherName: "",
    phone: "",
    position: "",
    wageType: "daily",
    wageAmount: "",
    currencyCode: "AFN",
    startDate: todayIso(),
    notes: "",
  };
}

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewEmployeeForm>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [viewGrid, setViewGrid] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ["employees", statusFilter],
    queryFn: () =>
      api.get<Employee[]>(`/employees${statusFilter ? `?status=${statusFilter}` : ""}`),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Employee>("/employees", {
        name: form.name,
        fatherName: form.fatherName || null,
        phone: form.phone || null,
        position: form.position,
        wageType: form.wageType,
        wageAmount: form.wageAmount,
        currencyCode: form.currencyCode,
        startDate: form.startDate,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setShowForm(false);
      setForm(emptyForm());
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p className="page-title" style={{ margin: 0 }}>کارکوونکي</p>
          <p className="page-sub">د کارکوونکو، حاضري او تادیاتو مدیریت</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className={`btn btn-sm ${viewGrid ? "btn-primary" : "btn-outline"}`}
            title="ګرید لید"
            onClick={() => setViewGrid(true)}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`btn btn-sm ${!viewGrid ? "btn-primary" : "btn-outline"}`}
            title="لیست لید"
            onClick={() => setViewGrid(false)}
          >
            <List size={15} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> نوی کارکوونکی
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {(["", "active", "inactive"] as const).map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABELS[s] : "ټول"}
          </button>
        ))}
      </div>

      {/* List view */}
      {!viewGrid ? (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                {/* Per old system: شماره|آيډي، نوم، پلار نوم، وظیفه، تماس شمیره، حاضر، اضافه کاری — summary list here */}
                <th>شمیره</th>
                <th>نوم</th>
                <th>د پلار نوم</th>
                <th>وظیفه</th>
                <th>تماس شمیره</th>
                <th>مزد</th>
                <th>الباقی حساب</th>
                <th>حالت</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link
                      to={`/employees/${e.id}`}
                      style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
                    >
                      {e.employeeNumber}
                    </Link>
                  </td>
                  <td>{e.name}</td>
                  <td>{e.fatherName ?? "—"}</td>
                  <td>{e.position}</td>
                  <td>{e.phone ?? "—"}</td>
                  <td>
                    {e.wageAmount} {CURRENCY_LABELS[e.currencyCode] ?? e.currencyCode}
                    {" / "}{WAGE_LABELS[e.wageType]}
                  </td>
                  <td
                    style={{
                      color: Number(e.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)",
                      fontWeight: 600,
                    }}
                  >
                    {e.balance ?? "—"}
                  </td>
                  <td>
                    <span className={`badge ${e.status === "active" ? "badge-success" : "badge-muted"}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {!employees?.length && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                    تر اوسه هیڅ کارکوونکی نشته.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid view */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {employees?.map((e) => (
            <div key={e.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Link
                  to={`/employees/${e.id}`}
                  style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", textDecoration: "none" }}
                >
                  {e.name}
                </Link>
                <span className={`badge ${e.status === "active" ? "badge-success" : "badge-muted"}`}>
                  {STATUS_LABELS[e.status]}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{e.employeeNumber}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}>وظیفه: {e.position}</div>
              {e.fatherName && <div style={{ fontSize: 13, marginBottom: 2 }}>د پلار نوم: {e.fatherName}</div>}
              {e.phone && <div style={{ fontSize: 13, marginBottom: 2 }}>تماس: {e.phone}</div>}
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                مزد: {e.wageAmount} {CURRENCY_LABELS[e.currencyCode] ?? e.currencyCode}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: Number(e.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)",
                }}
              >
                الباقی: {e.balance ?? "—"}
              </div>
            </div>
          ))}
          {!employees?.length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--muted)" }}>
              تر اوسه هیڅ کارکوونکی نشته.
            </div>
          )}
        </div>
      )}

      {/* Add employee modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 520, maxHeight: "90vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوی کارکوونکی ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">بشپړ نوم</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">د پلار نوم</label>
                  <input
                    className="form-input"
                    value={form.fatherName}
                    onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">تماس شمیره</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">وظیفه</label>
                <input
                  className="form-input"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">د مزد ډول</label>
                  <select
                    className="form-input"
                    value={form.wageType}
                    onChange={(e) => setForm((f) => ({ ...f, wageType: e.target.value as EmployeeWageType }))}
                  >
                    <option value="daily">ورځنۍ</option>
                    <option value="monthly">میاشتنۍ</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">مزد اندازه</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    value={form.wageAmount}
                    onChange={(e) => setForm((f) => ({ ...f, wageAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">اسعار</label>
                  <select
                    className="form-input"
                    value={form.currencyCode}
                    onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}
                  >
                    <option value="AFN">افغانۍ</option>
                    <option value="USD">ډالر</option>
                    <option value="PKR">کلدار</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">د پیل نیټه</label>
                <JalaliDateInput
                  value={form.startDate}
                  onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                />
              </div>
              <div>
                <label className="form-label">یادداشتونه</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={!form.name || !form.position || !form.wageAmount || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                ثبتول
              </button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
