import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Undo2, LayoutGrid, List } from "lucide-react";
import { api, type Expense, type ExpenseCategory } from "../lib/api";
import FilterBar from "../components/FilterBar";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString, todayIso } from "../lib/jalali";

// د مصرف نوعیت - exact per glossary and old system
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  kitchen:     "اشپزخانی مصرف",
  office:      "د دفتر مصرف",
  transport:   "د ترانسپورت مصرف",
  utilities:   "د خدماتو مصرف",
  salaries:    "د معاشاتو مصرف",
  maintenance: "د ترمیم مصرف",
  other:       "د کار د ساحې مصرف",
};

const CURRENCY_LABELS: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
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
  return {
    category: "office",
    expenseDate: todayIso(),
    description: "",
    amount: "",
    currencyCode: "AFN",
    payeeName: "",
  };
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
  const [viewGrid, setViewGrid] = useState(false);

  const handleSearch = () => setApplied({ startDate, endDate, q });
  const handleClear = () => {
    setStartDate(""); setEndDate(""); setQ("");
    setApplied({ startDate: "", endDate: "", q: "" });
  };

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
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/expenses/${id}/void`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p className="page-title" style={{ margin: 0 }}>مصارفات</p>
          <p className="page-sub">د شرکت ورځنیو مصارفاتو ثبتول</p>
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
            <Plus size={16} /> نوی مصرف
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        startDate={startDate} endDate={endDate} q={q}
        onStartDate={setStartDate} onEndDate={setEndDate} onQ={setQ}
        onSearch={handleSearch} onClear={handleClear}
        placeholder="لټون (تفصیل، مستحق...)"
      />

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          className={`btn btn-sm ${categoryFilter === "" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setCategoryFilter("")}
        >
          ټول
        </button>
        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
          <button
            key={v}
            className={`btn btn-sm ${categoryFilter === v ? "btn-primary" : "btn-outline"}`}
            onClick={() => setCategoryFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* List view */}
      {!viewGrid ? (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>شمیره</th>
                <th>تاریخ</th>
                <th>د مصرف نوعیت</th>
                <th>تفصیل</th>
                <th>پیسي</th>
                <th>مستحق</th>
                <th>حالت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses?.map((e) => (
                <tr key={e.id} style={{ opacity: e.voidedAt ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{e.expenseNumber}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{isoToJalaliString(e.expenseDate)}</td>
                  <td><span className="badge badge-muted">{CATEGORY_LABELS[e.category]}</span></td>
                  <td>{e.description}</td>
                  <td style={{ fontWeight: 600 }}>
                    {e.amount} {CURRENCY_LABELS[e.currencyCode] ?? e.currencyCode}
                  </td>
                  <td>{e.payeeParty?.name ?? e.payeeName ?? "—"}</td>
                  <td>
                    {e.voidedAt
                      ? <span className="badge badge-danger">لغوه شوی</span>
                      : <span className="badge badge-success">فعال</span>}
                  </td>
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
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                    تر اوسه هیڅ مصرف نشته.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid view */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {expenses?.map((e) => (
            <div key={e.id} className="card" style={{ padding: 16, opacity: e.voidedAt ? 0.55 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{e.expenseNumber}</span>
                <span className="badge badge-muted" style={{ fontSize: 11 }}>{CATEGORY_LABELS[e.category]}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {e.amount} {CURRENCY_LABELS[e.currencyCode] ?? e.currencyCode}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{e.description}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{isoToJalaliString(e.expenseDate)}</div>
              {(e.payeeParty?.name ?? e.payeeName) && (
                <div style={{ fontSize: 12, marginTop: 4 }}>مستحق: {e.payeeParty?.name ?? e.payeeName}</div>
              )}
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {e.voidedAt
                  ? <span className="badge badge-danger">لغوه شوی</span>
                  : <span className="badge badge-success">فعال</span>}
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
              </div>
            </div>
          ))}
          {!expenses?.length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--muted)" }}>
              تر اوسه هیڅ مصرف نشته.
            </div>
          )}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 500, maxHeight: "90vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوی مصرف ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">د مصرف نوعیت</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                >
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">تفصیل</label>
                <input
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">پیسي</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
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
                <label className="form-label">تاریخ</label>
                <JalaliDateInput
                  value={form.expenseDate}
                  onChange={(v) => setForm((f) => ({ ...f, expenseDate: v }))}
                />
              </div>
              <div>
                <label className="form-label">مستحق (اختیاري)</label>
                <input
                  className="form-input"
                  value={form.payeeName}
                  onChange={(e) => setForm((f) => ({ ...f, payeeName: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={!form.description || !form.amount || createMutation.isPending}
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
