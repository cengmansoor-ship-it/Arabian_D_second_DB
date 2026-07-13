import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api, type Employee, type EmployeeStatus, type EmployeeWageType } from "../lib/api";

const STATUS_LABELS: Record<EmployeeStatus, string> = { active: "فعال", inactive: "غیرفعال" };
const WAGE_LABELS: Record<EmployeeWageType, string> = { daily: "ورځنۍ مزد", monthly: "میاشتنۍ معاش" };

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
  return { name: "", fatherName: "", phone: "", position: "", wageType: "daily", wageAmount: "", currencyCode: "AFN", startDate: new Date().toISOString().slice(0, 10), notes: "" };
}

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewEmployeeForm>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const { data: employees } = useQuery({
    queryKey: ["employees", statusFilter],
    queryFn: () => api.get<Employee[]>(`/employees${statusFilter ? `?status=${statusFilter}` : ""}`),
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p className="page-title" style={{ margin: 0 }}>کارکوونکي</p>
          <p className="page-sub">د کارکوونکو، حاضري او تادیاتو مدیریت</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوی کارکوونکی
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {["", "active", "inactive"].map((s) => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`} onClick={() => setStatusFilter(s)}>
            {s ? STATUS_LABELS[s as EmployeeStatus] : "ټول"}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>شمېره</th><th>نوم</th><th>دنده</th><th>مزد</th><th>پاتې حساب</th><th>حالت</th>
            </tr>
          </thead>
          <tbody>
            {employees?.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link to={`/employees/${e.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                    {e.employeeNumber}
                  </Link>
                </td>
                <td>{e.name}</td>
                <td>{e.position}</td>
                <td>{e.wageAmount} {e.currencyCode} / {WAGE_LABELS[e.wageType]}</td>
                <td style={{ color: Number(e.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>{e.balance ?? "—"}</td>
                <td><span className={`badge ${e.status === "active" ? "badge-success" : "badge-muted"}`}>{STATUS_LABELS[e.status]}</span></td>
              </tr>
            ))}
            {!employees?.length && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هېڅ کارکوونکی نشته.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 500, maxHeight: "88vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوی کارکوونکی</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">بشپړ نوم</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">د پلار نوم</label>
                  <input className="form-input" value={form.fatherName} onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">ټیلیفون</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">دنده</label>
                <input className="form-input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">د مزد ډول</label>
                  <select className="form-input" value={form.wageType} onChange={(e) => setForm((f) => ({ ...f, wageType: e.target.value as EmployeeWageType }))}>
                    <option value="daily">ورځنۍ</option>
                    <option value="monthly">میاشتنۍ</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">مزد اندازه</label>
                  <input className="form-input" type="number" min={0} value={form.wageAmount} onChange={(e) => setForm((f) => ({ ...f, wageAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">اسعار</label>
                  <select className="form-input" value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}>
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                    <option value="PKR">PKR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">د پیل نېټه</label>
                <input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!form.name || !form.position || !form.wageAmount || createMutation.isPending} onClick={() => createMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
