import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Party, type PartyType } from "../lib/api";
import { UserPlus, Search } from "lucide-react";

const TYPE_LABELS: Record<PartyType, string> = {
  individual_customer: "انفرادي پیرودونکی",
  market_customer: "بازار پیرودونکی",
  supplier: "عرضه کوونکی",
  sales_customer: "د پلورنې پیرودونکی",
  tenant: "کرایه‌دار",
  exchange_dealer: "صرافی",
  employee: "کارمند",
  partner: "شریک/پانګه‌وال",
  other: "نور",
};

function emptyForm() {
  return { type: "sales_customer" as PartyType, name: "", fatherName: "", grandfatherName: "", tazkiraNumber: "", taxRegNumber: "", phone1: "", phone2: "", address: "", notes: "" };
}

export default function PartiesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data: parties } = useQuery({
    queryKey: ["parties", q, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (typeFilter) params.set("type", typeFilter);
      const qs = params.toString();
      return api.get<Party[]>(`/parties${qs ? `?${qs}` : ""}`);
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
    mutationFn: () => api.post<Party>("/parties", { ...form, fatherName: form.fatherName || null, grandfatherName: form.grandfatherName || null, tazkiraNumber: form.tazkiraNumber || null, taxRegNumber: form.taxRegNumber || null, phone1: form.phone1 || null, phone2: form.phone2 || null, address: form.address || null, notes: form.notes || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); setForm(emptyForm()); setDuplicates([]); setError(null); setShowForm(false); },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">اشخاص او پیرودونکي</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
          <span>/</span>
          <span>اشخاص</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, fontWeight: 500 }}>{parties?.length ?? "..."} اشخاص</p>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <UserPlus size={18} /> نوی شخص
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <div>د نوي شخص معلومات</div>
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
                { key: "phone1", label: "تلیفون ۱" },
                { key: "phone2", label: "تلیفون ۲" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" placeholder={label} value={(form as Record<string, string>)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} onBlur={key === "name" ? (e) => checkDuplicates(e.target.value) : undefined} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">آدرس</label>
                <input className="form-input" placeholder="آدرس" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" placeholder="یادداشتونه" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ height: 100, padding: "12px 16px", resize: "vertical" }} />
              </div>
            </div>
            {duplicates.length > 0 && (
              <div style={{ background: "var(--warning-light)", color: "#92400E", padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
                ⚠ ورته اشخاص وموندل شول: {duplicates.map((d) => d.name).join("، ")}
              </div>
            )}
            {error && <div style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
              <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending}>جوړول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}

      {/* Search / filter */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative", maxWidth: 400 }}>
          <Search size={18} style={{ position: "absolute", top: "50%", right: 16, transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input className="form-input" placeholder="لټون (نوم، تذکره، تلیفون)" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingRight: 44 }} />
        </div>
        <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 220 }}>
          <option value="">ټول ډولونه</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="fl-table">
          <thead>
            <tr><th>نوم</th><th>ډول</th><th>تذکره</th><th>تلیفون</th><th></th></tr>
          </thead>
          <tbody>
            {parties?.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td><span className="badge badge-muted">{TYPE_LABELS[p.type]}</span></td>
                <td style={{ color: "var(--muted)", fontSize: 14 }}>{p.tazkiraNumber ?? "—"}</td>
                <td style={{ color: "var(--muted)", fontSize: 14 }}>{p.phone1 ?? "—"}</td>
                <td><Link to={`/parties/${p.id}`} style={{ color: "var(--primary)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>لیدل</Link></td>
              </tr>
            ))}
            {parties?.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>هیڅ شخص ونه موندل شو.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
