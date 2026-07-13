import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api, type Partner, type Party } from "../lib/api";

interface NewPartnerForm {
  partyId: number | null;
  initialInvestment: string;
  currencyCode: string;
  ownershipPercent: string;
  joinDate: string;
  notes: string;
}

function emptyForm(): NewPartnerForm {
  return { partyId: null, initialInvestment: "", currencyCode: "AFN", ownershipPercent: "", joinDate: new Date().toISOString().slice(0, 10), notes: "" };
}

export default function PartnersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPartnerForm>(emptyForm());
  const [partyQuery, setPartyQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: partners } = useQuery({ queryKey: ["partners"], queryFn: () => api.get<Partner[]>("/partners") });

  const { data: candidates } = useQuery({
    queryKey: ["parties-search-partner", partyQuery],
    queryFn: () => api.get<Party[]>(`/parties?type=partner${partyQuery ? `&q=${encodeURIComponent(partyQuery)}` : ""}`),
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p className="page-title" style={{ margin: 0 }}>شریکان</p>
          <p className="page-sub">د پانګه‌وړونکو شریکانو حسابونه، پانګه او د ګټې/تاوان راپور</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوی شریک
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto", marginTop: 16 }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr><th>شمېره</th><th>نوم</th><th>لومړنی پانګه‌اچونه</th><th>د پانګې فیصدي</th><th>اوسنی پاتې</th><th>حالت</th></tr>
          </thead>
          <tbody>
            {partners?.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/partners/${p.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>{p.partnerNumber}</Link>
                </td>
                <td>{p.party?.name ?? "—"}</td>
                <td>{p.initialInvestment} {p.currencyCode}</td>
                <td>{p.ownershipPercent ?? "—"}</td>
                <td style={{ fontWeight: 600 }}>{p.balance}</td>
                <td><span className={`badge ${p.status === "active" ? "badge-success" : "badge-muted"}`}>{p.status === "active" ? "فعال" : "غیرفعال"}</span></td>
              </tr>
            ))}
            {!partners?.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هېڅ شریک نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 480, maxHeight: "88vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوی شریک</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">شریک (نوم لټون)</label>
                <input className="form-input" value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.partyId ?? ""} onChange={(e) => setForm((f) => ({ ...f, partyId: Number(e.target.value) || null }))}>
                  <option value="">-- شریک وټاکئ --</option>
                  {candidates?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">لومړنی پانګه‌اچونه</label>
                  <input className="form-input" type="number" min={0} value={form.initialInvestment} onChange={(e) => setForm((f) => ({ ...f, initialInvestment: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">اسعار</label>
                  <select className="form-input" value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}>
                    <option value="AFN">AFN</option><option value="USD">USD</option><option value="PKR">PKR</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">د پانګې فیصدي (اختیاري)</label>
                  <input className="form-input" type="number" min={0} max={100} value={form.ownershipPercent} onChange={(e) => setForm((f) => ({ ...f, ownershipPercent: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">د ګډون نېټه</label>
                  <input className="form-input" type="date" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!form.partyId || createMutation.isPending} onClick={() => createMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
