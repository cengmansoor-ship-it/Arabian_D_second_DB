import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, X, LayoutGrid, List } from "lucide-react";
import { api, type Employee, type Attendance, type EmployeePayment, type AttendanceStatus, type EmployeePaymentType } from "../lib/api";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString, todayIso } from "../lib/jalali";

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غیرحاضر",
  leave: "رخصتي",
  half_day: "نیم ورځ",
};

const CURRENCY_LABELS: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attDate, setAttDate] = useState(todayIso());
  const [attStatus, setAttStatus] = useState<AttendanceStatus>("present");
  const [attNotes, setAttNotes] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<EmployeePaymentType>("salary");
  const [payDate, setPayDate] = useState(todayIso());
  const [payNote, setPayNote] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [attViewGrid, setAttViewGrid] = useState(false);
  const [payViewGrid, setPayViewGrid] = useState(false);

  const { data: employee } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get<Employee>(`/employees/${id}`),
  });

  const attendanceMutation = useMutation({
    mutationFn: () =>
      api.post<Attendance>(`/employees/${id}/attendance`, {
        date: attDate,
        status: attStatus,
        notes: attNotes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee", id] });
      setShowAttendanceForm(false);
      setAttNotes("");
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      api.post<EmployeePayment>(`/employees/${id}/payments`, {
        amount: payAmount,
        type: payType,
        currencyCode: employee?.currencyCode,
        paymentDate: payDate,
        note: payNote || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee", id] });
      setShowPaymentForm(false);
      setPayAmount("");
      setPayNote("");
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  if (!employee) return null;

  const cur = CURRENCY_LABELS[employee.currencyCode] ?? employee.currencyCode;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link
          to="/employees"
          style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
        >
          کارکوونکي <ArrowRight size={13} />
        </Link>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ fontSize: 13 }}>{employee.employeeNumber}</span>
      </div>
      <p className="page-title" style={{ margin: 0 }}>{employee.name}</p>
      <p className="page-sub">
        وظیفه: {employee.position} | مزد: {employee.wageAmount} {cur} | د پیل نیټه: {isoToJalaliString(employee.startDate)}
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0" }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>د پلار نوم</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{employee.fatherName ?? "—"}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>الباقی حساب</div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: Number(employee.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)",
            }}
          >
            {employee.balance} {cur}
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setError(null); setShowAttendanceForm(true); }}>
            <Plus size={12} /> حاضري ثبتول
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setError(null); setShowPaymentForm(true); }}>
            <Plus size={12} /> تادیه
          </button>
        </div>
      </div>

      {/* Attendance section
          Columns per old system (Attendance.php/AttendM.php):
          شمیره | آيډي، نوم، پلار نوم، وظیفه، تماس شمیره، حاضر، اضافه کاري
          In the detail page: تاریخ، تفصیل، د ورځو تعداد، اضافه کاري، رسیده معاش، الباقی حساب
      */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>د حاضري ریکارډ</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={`btn btn-sm ${attViewGrid ? "btn-primary" : "btn-outline"}`}
              onClick={() => setAttViewGrid(true)}
              title="ګرید لید"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={`btn btn-sm ${!attViewGrid ? "btn-primary" : "btn-outline"}`}
              onClick={() => setAttViewGrid(false)}
              title="لیست لید"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {!attViewGrid ? (
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>حالت</th>
                <th>د ورځي مزد</th>
                <th>اسعار</th>
                <th>یادداشت</th>
              </tr>
            </thead>
            <tbody>
              {employee.attendances?.map((a) => (
                <tr key={a.id}>
                  <td>{isoToJalaliString(a.date)}</td>
                  <td>
                    <span
                      className={`badge ${a.status === "present" ? "badge-success" : a.status === "absent" ? "badge-danger" : "badge-muted"}`}
                    >
                      {ATTENDANCE_LABELS[a.status]}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.payableAmount}</td>
                  <td>{CURRENCY_LABELS[a.currencyCode] ?? a.currencyCode}</td>
                  <td>{a.notes ?? "—"}</td>
                </tr>
              ))}
              {!employee.attendances?.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>
                    تر اوسه هیڅ حاضري نشته.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {employee.attendances?.map((a) => (
              <div key={a.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{isoToJalaliString(a.date)}</div>
                <span
                  className={`badge ${a.status === "present" ? "badge-success" : a.status === "absent" ? "badge-danger" : "badge-muted"}`}
                >
                  {ATTENDANCE_LABELS[a.status]}
                </span>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  مزد: {a.payableAmount} {CURRENCY_LABELS[a.currencyCode] ?? a.currencyCode}
                </div>
              </div>
            ))}
            {!employee.attendances?.length && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: "var(--muted)" }}>
                تر اوسه هیڅ حاضري نشته.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payments (Employee ledger / کهاته)
          Columns per glossary and Emp_Rep.php:
          تاریخ، تفصیل، حاضري پیسي، غیر حاضري پیسي، رسیده پیسي، د ورځي تعداد، الباقی حساب
          Payment table: شمیره، نیټه، ډول، اندازه، پخوانی الباقی، نوی الباقی
      */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>تادیات (د کارکوونکي کهاته)</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={`btn btn-sm ${payViewGrid ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPayViewGrid(true)}
              title="ګرید لید"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={`btn btn-sm ${!payViewGrid ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPayViewGrid(false)}
              title="لیست لید"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {!payViewGrid ? (
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>شمیره</th>
                <th>تاریخ</th>
                <th>ډول</th>
                <th>رسیده معاش</th>
                <th>تیر الباقی</th>
                <th>نوی الباقی</th>
              </tr>
            </thead>
            <tbody>
              {employee.payments?.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.paymentNumber}</td>
                  <td>{isoToJalaliString(p.paymentDate)}</td>
                  <td>{p.type === "advance" ? "پیشکي" : "معاش"}</td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>
                    {p.amount} {CURRENCY_LABELS[p.currencyCode] ?? p.currencyCode}
                  </td>
                  <td>{p.previousBalance ?? "—"}</td>
                  <td style={{ fontWeight: 600 }}>{p.newBalance ?? "—"}</td>
                </tr>
              ))}
              {!employee.payments?.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>
                    تر اوسه هیڅ تادیه نشته.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {employee.payments?.map((p) => (
              <div key={p.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.paymentNumber}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{isoToJalaliString(p.paymentDate)}</div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>{p.type === "advance" ? "پیشکي" : "معاش"}</div>
                <div style={{ fontWeight: 700, color: "var(--success)", fontSize: 15 }}>
                  {p.amount} {CURRENCY_LABELS[p.currencyCode] ?? p.currencyCode}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  الباقی: {p.newBalance ?? "—"}
                </div>
              </div>
            ))}
            {!employee.payments?.length && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: "var(--muted)" }}>
                تر اوسه هیڅ تادیه نشته.
              </div>
            )}
          </div>
        )}

        {/* Monthly footer summary per glossary */}
        {(employee.payments?.length ?? 0) > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "var(--surface-alt, #f5f5f5)",
              borderRadius: 6,
              fontSize: 13,
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <span style={{ color: "var(--muted)" }}>موجوده الباقی: </span>
              <span
                style={{
                  fontWeight: 700,
                  color: Number(employee.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)",
                }}
              >
                {employee.balance} {cur}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance modal */}
      {showAttendanceForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>حاضري ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAttendanceForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">تاریخ</label>
                <JalaliDateInput value={attDate} onChange={setAttDate} />
              </div>
              <div>
                <label className="form-label">حالت</label>
                <select
                  className="form-input"
                  value={attStatus}
                  onChange={(e) => setAttStatus(e.target.value as AttendanceStatus)}
                >
                  <option value="present">حاضر</option>
                  <option value="absent">غیرحاضر</option>
                  <option value="leave">رخصتي</option>
                  <option value="half_day">نیم ورځ</option>
                </select>
              </div>
              <div>
                <label className="form-label">یادداشت (اختیاري)</label>
                <input
                  className="form-input"
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={attendanceMutation.isPending}
                onClick={() => attendanceMutation.mutate()}
              >
                ثبتول
              </button>
              <button className="btn btn-outline" onClick={() => setShowAttendanceForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPaymentForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>تادیه ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPaymentForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">ډول</label>
                <select
                  className="form-input"
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as EmployeePaymentType)}
                >
                  <option value="salary">معاش</option>
                  <option value="advance">پیشکي</option>
                </select>
              </div>
              <div>
                <label className="form-label">رسیده معاش (اندازه)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">تاریخ</label>
                <JalaliDateInput value={payDate} onChange={setPayDate} />
              </div>
              <div>
                <label className="form-label">یادداشت (اختیاري)</label>
                <input
                  className="form-input"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={!payAmount || paymentMutation.isPending}
                onClick={() => paymentMutation.mutate()}
              >
                ثبتول
              </button>
              <button className="btn btn-outline" onClick={() => setShowPaymentForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
