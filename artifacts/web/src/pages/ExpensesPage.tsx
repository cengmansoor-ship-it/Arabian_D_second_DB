import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Undo2 } from "lucide-react";
import { api, type Expense, type ExpenseCategory } from "../lib/api";
import FilterBar from "../components/FilterBar";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  kitchen: "پخلنځی", office: "دفتر", transport: "ترانسپورت", utilities: "خدمتونه (برېښنا/اوبه)",
  salaries: "معاشونه", maintenance: "ترمیم", other: "نور",
};

interface NewExpenseForm {
  category: ExpenseCategory;
  expenseDate: string;
  description: string;
  amount: string;
  currencyCode: string;
  payeeName: string;
}

function emptyForm(): NewExpenseForm {
  return { category: "office", expenseDate: new Date().toISOString().slice(0, 10), description: "", amount: "", currencyCode: "AFN", payeeName: "" };
}

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewExpenseForm>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ startDate: "", endDate: "", q: "" });

  const handleSearch = () => setApplied({ startDate, endDate, q });
  const handleClear = () => { setStartDate(""); setEndDate(""); setQ(""); setApplied({ startDate: "", endDate: "", q: "" }); };

  const { data: expenses } = useQuery({
    queryKey: ["expenses", categoryFilter, applied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (categoryFilter) p.set("category", categoryFilter);
      if (applied.startDate) p.set("startDate", applied.startDate);
      if (applied.endDate) p.set("endDate", applied.endDate);
      if (applied.q) p.set("q", applied.q);
      return api.get<Expense[]>(`/expenses?${p}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Expense>("/expenses", {
        category: form.category,
        expenseDate: form.expenseDate,
        description: form.description,
        amount: form.amount,
        currencyCode: form.currencyCode,
        payeeName: form.payeeName || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
      setForm(emptyForm());
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.post(`/expenses/${id}/void`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p className="page-title" style={{ margin: 0 }}>لګښتونه</p>
          <p className="page-sub">د شرکت ورځنیو لګښتونو ثبتول</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوی لګښت
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
        <button className={`btn btn-sm ${categoryFilter === "" ? "btn-primary" : "btn-outline"}`} onClick={() => setCategoryFilter("")}>ټول</button>
        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${categoryFilter === v ? "btn-primary" : "btn-outline"}`} onClick={() => setCategoryFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>د لګښت شمېره</th><th>ډول</th><th>تشریح</th><th>مستحق</th>
              <th>مبلغ</th><th>نېټه</th><th>حالت</th><th></th>
            </tr>
          </thead>
          <tbody>
            {expenses?.map((e) => (
              <tr key={e.id} style={{ opacity: e.voidedAt ? 0.5 : 1 }}>
                <td style={{ fontWeight: 600 }}>{e.expenseNumber}</td>
                <td><span className="badge badge-muted">{CATEGORY_LABELS[e.category]}</span></td>
                <td>{e.description}</td>
                <td>{e.payeeParty?.name ?? e.payeeName ?? "—"}</td>
                <td>{e.amount} {e.currencyCode}</td>
                <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{e.expenseDate}</td>
                <td>{e.voidedAt ? <span className="badge badge-danger">لغوه شوی</span> : <span className="badge badge-success">فعال</span>}</td>
                <td>
                  {!e.voidedAt && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const reason = window.prompt("د لغوه کولو دلیل ولیکئ:");
                        if (reason) voidMutation.mutate({ id: e.id, reason });
                      }}
                    >
                      <Undo2 size={12} /> لغوه
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!expenses?.length && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هېڅ لګښت نشته.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 480, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوی لګښت ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">ډول</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">تشریح</label>
                <input className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">مبلغ</label>
                  <input className="form-input" type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">اسعار</label>
                  <select className="form-input" value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}>
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">نېټه</label>
                <input className="form-input" type="date" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">مستحق (اختیاري)</label>
                <input className="form-input" value={form.payeeName} onChange={(e) => setForm((f) => ({ ...f, payeeName: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!form.description || !form.amount || createMutation.isPending} onClick={() => createMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
