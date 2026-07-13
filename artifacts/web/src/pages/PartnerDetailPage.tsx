import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, X } from "lucide-react";
import { api, type Partner, type PartnerTransaction, type PartnerTransactionType } from "../lib/api";

export default function PartnerDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<PartnerTransactionType>("investment");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: partner } = useQuery({ queryKey: ["partner", id], queryFn: () => api.get<Partner>(`/partners/${id}`) });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<PartnerTransaction>(`/partners/${id}/transactions`, {
        type, amount, currencyCode: partner?.currencyCode, transactionDate, note: note || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner", id] });
      setShowForm(false);
      setAmount("");
      setNote("");
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  if (!partner) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link to="/partners" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          شریکان <ArrowRight size={13} />
        </Link>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ fontSize: 13 }}>{partner.partnerNumber}</span>
      </div>
      <p className="page-title" style={{ margin: 0 }}>{partner.party?.name}</p>
      <p className="page-sub">لومړنی پانګه‌اچونه: {partner.initialInvestment} {partner.currencyCode}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0" }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>اوسنی د پانګې پاتې</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{partner.balance} {partner.currencyCode}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>د پانګې فیصدي</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{partner.ownershipPercent ?? "—"}</div>
        </div>
        <div className="card" style={{ padding: 16, display: "flex", alignItems: "center" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={12} /> نوې راکړه/ورکړه</button>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>پانګه‌اچونه او وباسل</div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead><tr><th>شمېره</th><th>نېټه</th><th>ډول</th><th>اندازه</th><th>پخوانی پاتې</th><th>نوی پاتې</th></tr></thead>
          <tbody>
            {partner.transactions?.map((t) => (
              <tr key={t.id}>
                <td>{t.transactionNumber}</td><td>{t.transactionDate}</td>
                <td>{t.type === "investment" ? "پانګه‌اچونه" : "وباسل"}</td>
                <td style={{ color: t.type === "investment" ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{t.amount}</td>
                <td>{t.previousBalance}</td><td>{t.newBalance}</td>
              </tr>
            ))}
            {!partner.transactions?.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ راکړه/ورکړه نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوې راکړه/ورکړه</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">ډول</label>
                <select className="form-input" value={type} onChange={(e) => setType(e.target.value as PartnerTransactionType)}>
                  <option value="investment">پانګه‌اچونه</option>
                  <option value="withdrawal">وباسل</option>
                </select>
              </div>
              <div>
                <label className="form-label">اندازه</label>
                <input className="form-input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="form-label">نېټه</label>
                <input className="form-input" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">یادداشت</label>
                <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!amount || createMutation.isPending} onClick={() => createMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
