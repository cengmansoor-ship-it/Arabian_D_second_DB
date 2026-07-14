import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { api, type Party, type PartyType } from "../lib/api";
import { UserPlus, Search, LayoutList, LayoutGrid } from "lucide-react";
import JalaliDateInput from "../components/JalaliDateInput";
import { todayIso } from "../lib/jalali";

const TYPE_LABELS: Record<PartyType, string> = {
  individual_customer: "انفرادي مشتري",
  market_customer: "بازاري مشتري",
  supplier: "عرضه کوونکی",
  sales_customer: "د پلورنې مشتري",
  tenant: "کرایه‌دار",
  exchange_dealer: "صراف",
  employee: "کارمند",
  partner: "شریک/پانګه‌وال",
  other: "نور",
};

function emptyForm() {
  return {
    type: "individual_customer" as PartyType,
    name: "",
    fatherName: "",
    phone1: "",
    phone2: "",
    address: "",
    notes: "",
    tazkiraNumber: "",
    taxRegNumber: "",
    grandfatherName: "",
    joinDate: todayIso(),
  };
}

export default function PartiesPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") ?? "");
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data: parties } = useQuery({
    queryKey: ["parties", q, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (typeFilter) params.set("type", typeFilter);
      return api.get<Party[]>(`/parties?${params}`);
    },
  });

  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);

  const checkDuplicates = async (name: string) => {
    if (!name.trim()) { setDuplicates([]); return; }
    const matches = await api.get<Party[]>(`/parties/duplicate-check?name=${encodeURIComponent(name.trim())}`);
    setDuplicates(matches);
  };

  const createMutation = useMutation({
    mutationFn: () => api.post<Party>("/parties", {
      type: form.type,
      name: form.name,
      fatherName: form.fatherName || null,
      grandfatherName: form.grandfatherName || null,
      tazkiraNumber: form.tazkiraNumber || null,
      taxRegNumber: form.taxRegNumber || null,
      phone1: form.phone1 || null,
      phone2: form.phone2 || null,
      address: form.address || null,
      notes: form.notes || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties"] });
      setForm(emptyForm());
      setDuplicates([]);
      setError(null);
      setShowForm(false);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">مشتریان او اشخاص</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
          <span>/</span>
          <span>مشتریان</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, fontWeight: 500 }}>{parties?.length ?? "..."} اشخاص</p>
        <div style={{ display: "flex", gap: 8 }}>
          {/* List/Grid toggle */}
          <button
            className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setViewMode("list")}
            title="د لیست لید"
          >
            <LayoutList size={16} />
          </button>
          <button
            className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setViewMode("grid")}
            title="د ګریډ لید"
          >
            <LayoutGrid size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <UserPlus size={18} /> نوی مشتري
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <div>د نوي مشتري معلومات</div>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 20, marginBottom: 20 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">ډول</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartyType }))}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {[
                { key: "name", label: "نوم", required: true },
                { key: "fatherName", label: "د پلار نوم" },
                { key: "grandfatherName", label: "د نیکه نوم" },
                { key: "tazkiraNumber", label: "تذکره شمېره" },
                { key: "taxRegNumber", label: "د مالیې شمېره" },
                { key: "phone1", label: "موبایل شمیره" },
                { key: "phone2", label: "تلیفون ۲" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    placeholder={label}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    onBlur={key === "name" ? (e) => checkDuplicates(e.target.value) : undefined}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">آدرس</label>
                <input className="form-input" placeholder="آدرس" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" placeholder="یادداشتونه" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ height: 80, padding: "10px 16px", resize: "vertical" }} />
              </div>
            </div>
            {duplicates.length > 0 && (
              <div style={{ background: "var(--warning-light)", color: "#92400E", padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
                ⚠ ورته اشخاص وموندل شول: {duplicates.map((d) => d.name).join("، ")}
              </div>
            )}
            {error && <div style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}>ثبت کول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}

      {/* Search / filter */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative", maxWidth: 400 }}>
          <Search size={18} style={{ position: "absolute", top: "50%", right: 16, transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input className="form-input" placeholder="لټون (نوم، تذکره، موبایل)" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingRight: 44 }} />
        </div>
        <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 220 }}>
          <option value="">ټول ډولونه</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="fl-table">
            <thead>
              <tr>
                <th>ای‌ډي</th>
                <th>نوم</th>
                <th>د پلار نوم</th>
                <th>ډول</th>
                <th>موبایل شمیره</th>
                <th>تذکره</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parties?.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: "var(--muted)" }}>{p.fatherName ?? "—"}</td>
                  <td><span className="badge badge-muted">{TYPE_LABELS[p.type]}</span></td>
                  <td style={{ color: "var(--muted)", fontSize: 14 }}>{p.phone1 ?? "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: 14 }}>{p.tazkiraNumber ?? "—"}</td>
                  <td>
                    <Link to={`/parties/${p.id}`} style={{ color: "var(--primary)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>کهاته</Link>
                  </td>
                </tr>
              ))}
              {parties?.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>هیڅ مشتري ونه موندل شو.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {parties?.map((p) => (
            <div key={p.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  {p.fatherName && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>د پلار: {p.fatherName}</div>}
                </div>
                <span className="badge badge-muted">{TYPE_LABELS[p.type]}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                {p.phone1 && <div>☎ {p.phone1}</div>}
                {p.tazkiraNumber && <div>📋 {p.tazkiraNumber}</div>}
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 8 }}>
                <Link to={`/parties/${p.id}`} style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>کهاته ولیدئ ←</Link>
              </div>
            </div>
          ))}
          {parties?.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--muted)" }}>هیڅ مشتري ونه موندل شو.</div>
          )}
        </div>
      )}
    </div>
  );
}
