import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, X } from "lucide-react";
import { api, type Employee, type Attendance, type EmployeePayment, type AttendanceStatus, type EmployeePaymentType } from "../lib/api";

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = { present: "حاضر", absent: "غیرحاضر", leave: "رخصتي", half_day: "نیم ورځ" };

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState<AttendanceStatus>("present");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<EmployeePaymentType>("salary");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const { data: employee } = useQuery({ queryKey: ["employee", id], queryFn: () => api.get<Employee>(`/employees/${id}`) });

  const attendanceMutation = useMutation({
    mutationFn: () => api.post<Attendance>(`/employees/${id}/attendance`, { date: attDate, status: attStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee", id] });
      setShowAttendanceForm(false);
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      api.post<EmployeePayment>(`/employees/${id}/payments`, {
        amount: payAmount, type: payType, currencyCode: employee?.currencyCode, paymentDate: payDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee", id] });
      setShowPaymentForm(false);
      setPayAmount("");
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  if (!employee) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link to="/employees" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          کارکوونکي <ArrowRight size={13} />
        </Link>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ fontSize: 13 }}>{employee.employeeNumber}</span>
      </div>
      <p className="page-title" style={{ margin: 0 }}>{employee.name}</p>
      <p className="page-sub">دنده: {employee.position} — مزد: {employee.wageAmount} {employee.currencyCode}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0" }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>د پیل نېټه</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{employee.startDate}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>پاتې حساب (د شرکت له خوا)</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: Number(employee.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)" }}>{employee.balance}</div>
        </div>
        <div className="card" style={{ padding: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAttendanceForm(true)}><Plus size={12} /> حاضري</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentForm(true)}><Plus size={12} /> تادیه</button>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>د حاضري ریکارډ</div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead><tr><th>نېټه</th><th>حالت</th><th>د ورځې مزد</th></tr></thead>
          <tbody>
            {employee.attendances?.map((a) => (
              <tr key={a.id}><td>{a.date}</td><td>{ATTENDANCE_LABELS[a.status]}</td><td>{a.payableAmount}</td></tr>
            ))}
            {!employee.attendances?.length && <tr><td colSpan={3} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ حاضري نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>تادیات</div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead><tr><th>شمېره</th><th>نېټه</th><th>ډول</th><th>اندازه</th><th>پخوانی پاتې</th><th>نوی پاتې</th></tr></thead>
          <tbody>
            {employee.payments?.map((p) => (
              <tr key={p.id}>
                <td>{p.paymentNumber}</td><td>{p.paymentDate}</td>
                <td>{p.type === "advance" ? "پیشکي" : "معاش"}</td>
                <td style={{ color: "var(--success)", fontWeight: 600 }}>{p.amount}</td>
                <td>{p.previousBalance}</td><td>{p.newBalance}</td>
              </tr>
            ))}
            {!employee.payments?.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ تادیه نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAttendanceForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 380, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>حاضري ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAttendanceForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">نېټه</label>
                <input className="form-input" type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">حالت</label>
                <select className="form-input" value={attStatus} onChange={(e) => setAttStatus(e.target.value as AttendanceStatus)}>
                  <option value="present">حاضر</option>
                  <option value="absent">غیرحاضر</option>
                  <option value="leave">رخصتي</option>
                  <option value="half_day">نیم ورځ</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={attendanceMutation.isPending} onClick={() => attendanceMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowAttendanceForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 380, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>تادیه</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPaymentForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">ډول</label>
                <select className="form-input" value={payType} onChange={(e) => setPayType(e.target.value as EmployeePaymentType)}>
                  <option value="salary">معاش</option>
                  <option value="advance">پیشکي</option>
                </select>
              </div>
              <div>
                <label className="form-label">اندازه</label>
                <input className="form-input" type="number" min={0} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div>
                <label className="form-label">نېټه</label>
                <input className="form-input" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!payAmount || paymentMutation.isPending} onClick={() => paymentMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowPaymentForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
