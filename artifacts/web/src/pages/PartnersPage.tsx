import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, LayoutGrid, List } from "lucide-react";
import { api, type Partner, type Party } from "../lib/api";
import FilterBar from "../components/FilterBar";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString, todayIso } from "../lib/jalali";

const CURRENCY_LABELS: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
};

interface NewPartnerForm {
  partyId: number | null;
  initialInvestment: string;
  currencyCode: string;
  ownershipPercent: string;
  joinDate: string;
  notes: string;
}

function emptyForm(): NewPartnerForm {
  return {
    partyId: null,
    initialInvestment: "",
    currencyCode: "AFN",
    ownershipPercent: "",
    joinDate: todayIso(),
    notes: "",
  };
}

export default function PartnersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPartnerForm>(emptyForm());
  const [partyQuery, setPartyQuery] = useState("");
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

  const { data: partners } = useQuery({
    queryKey: ["partners", applied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (applied.startDate) p.set("startDate", applied.startDate);
      if (applied.endDate) p.set("endDate", applied.endDate);
      if (applied.q) p.set("q", applied.q);
      return api.get<Partner[]>(`/partners?${p}`);
    },
  });

  const { data: candidates } = useQuery({
    queryKey: ["parties-search-partner", partyQuery],
    queryFn: () =>
      api.get<Party[]>(`/parties?type=partner${partyQuery ? `&q=${encodeURIComponent(partyQuery)}` : ""}`),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Partner>("/partners", {
        partyId: form.partyId,
        initialInvestment: form.initialInvestment || 0,
        currencyCode: form.currencyCode,
        ownershipPercent: form.ownershipPercent || null,
        joinDate: form.joinDate,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
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
          <p className="page-title" style={{ margin: 0 }}>شریکان (حاجي صاحب)</p>
          <p className="page-sub">د پانګه‌وړونکو شریکانو حسابونه او د ګډون کهاته</p>
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
            <Plus size={16} /> نوی شریک
          </button>
        </div>
      </div>

      {/* Filter */}
      <FilterBar
        startDate={startDate} endDate={endDate} q={q}
        onStartDate={setStartDate} onEndDate={setEndDate} onQ={setQ}
        onSearch={handleSearch} onClear={handleClear}
        placeholder="لټون (نوم، شمیره...)"
      />

      {/* List view
          Columns per glossary د حاجي صاحب کهاته: شمیره، تاریخ، تفصیل، پیسي، رسید، الباقی، ملاحظات
          Summary list: شمیره، نوم، لومړنی پانګه‌اچونه، د پانګې فیصدي، اوسنی الباقی، حالت
      */}
      {!viewGrid ? (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>شمیره</th>
                <th>نوم</th>
                <th>لومړنی پانګه‌اچونه</th>
                <th>د پانګې فیصدي</th>
                <th>د ګډون نیټه</th>
                <th>الباقی</th>
                <th>حالت</th>
              </tr>
            </thead>
            <tbody>
              {partners?.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      to={`/partners/${p.id}`}
                      style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
                    >
                      {p.partnerNumber}
                    </Link>
                  </td>
                  <td>{p.party?.name ?? "—"}</td>
                  <td>
                    {p.initialInvestment} {CURRENCY_LABELS[p.currencyCode] ?? p.currencyCode}
                  </td>
                  <td>{p.ownershipPercent ? `${p.ownershipPercent}%` : "—"}</td>
                  <td>{isoToJalaliString(p.joinDate)}</td>
                  <td style={{ fontWeight: 600 }}>
                    {p.balance} {CURRENCY_LABELS[p.currencyCode] ?? p.currencyCode}
                  </td>
                  <td>
                    <span className={`badge ${p.status === "active" ? "badge-success" : "badge-muted"}`}>
                      {p.status === "active" ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                </tr>
              ))}
              {!partners?.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                    تر اوسه هیڅ شریک نشته.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid view */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
          {partners?.map((p) => (
            <div key={p.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Link
                  to={`/partners/${p.id}`}
                  style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)", textDecoration: "none" }}
                >
                  {p.party?.name ?? p.partnerNumber}
                </Link>
                <span className={`badge ${p.status === "active" ? "badge-success" : "badge-muted"}`}>
                  {p.status === "active" ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{p.partnerNumber}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}>
                لومړنی پانګه: {p.initialInvestment} {CURRENCY_LABELS[p.currencyCode] ?? p.currencyCode}
              </div>
              {p.ownershipPercent && (
                <div style={{ fontSize: 13, marginBottom: 2 }}>فیصدي: {p.ownershipPercent}%</div>
              )}
              <div style={{ fontSize: 13, marginBottom: 4, color: "var(--muted)" }}>
                د ګډون نیټه: {isoToJalaliString(p.joinDate)}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                الباقی: {p.balance} {CURRENCY_LABELS[p.currencyCode] ?? p.currencyCode}
              </div>
            </div>
          ))}
          {!partners?.length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--muted)" }}>
              تر اوسه هیڅ شریک نشته.
            </div>
          )}
        </div>
      )}

      {/* Add partner modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 500, maxHeight: "90vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوی شریک ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">شریک (نوم لټون)</label>
                <input
                  className="form-input"
                  placeholder="نوم ولیکئ..."
                  value={partyQuery}
                  onChange={(e) => setPartyQuery(e.target.value)}
                />
                <select
                  className="form-input"
                  style={{ marginTop: 6 }}
                  value={form.partyId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, partyId: Number(e.target.value) || null }))}
                >
                  <option value="">-- شریک وټاکئ --</option>
                  {candidates?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">لومړنی پانګه‌اچونه</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    value={form.initialInvestment}
                    onChange={(e) => setForm((f) => ({ ...f, initialInvestment: e.target.value }))}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">د پانګې فیصدي (اختیاري)</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={form.ownershipPercent}
                    onChange={(e) => setForm((f) => ({ ...f, ownershipPercent: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">د ګډون نیټه</label>
                  <JalaliDateInput
                    value={form.joinDate}
                    onChange={(v) => setForm((f) => ({ ...f, joinDate: v }))}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">ملاحظات</label>
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
                disabled={!form.partyId || createMutation.isPending}
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
