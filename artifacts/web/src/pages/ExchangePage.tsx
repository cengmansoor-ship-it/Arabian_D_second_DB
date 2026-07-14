import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api, type ExchangeTransaction, type Party } from "../lib/api";
import FilterBar from "../components/FilterBar";

interface NewExchangeForm {
  partyId: number | null;
  exchangeDate: string;
  currencyGiven: string;
  amountGiven: string;
  currencyReceived: string;
  amountReceived: string;
  rate: string;
  fee: string;
  notes: string;
}

function emptyForm(): NewExchangeForm {
  return { partyId: null, exchangeDate: new Date().toISOString().slice(0, 10), currencyGiven: "AFN", amountGiven: "", currencyReceived: "USD", amountReceived: "", rate: "", fee: "0", notes: "" };
}

export default function ExchangePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewExchangeForm>(emptyForm());
  const [partyQuery, setPartyQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ startDate: "", endDate: "", q: "" });

  const handleSearch = () => setApplied({ startDate, endDate, q });
  const handleClear = () => { setStartDate(""); setEndDate(""); setQ(""); setApplied({ startDate: "", endDate: "", q: "" }); };

  const { data: exchanges } = useQuery({
    queryKey: ["exchanges", applied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (applied.startDate) p.set("startDate", applied.startDate);
      if (applied.endDate) p.set("endDate", applied.endDate);
      if (applied.q) p.set("q", applied.q);
      return api.get<ExchangeTransaction[]>(`/exchange?${p}`);
    },
  });

  const { data: dealers } = useQuery({
    queryKey: ["parties-search-exchange_dealer", partyQuery],
    queryFn: () => api.get<Party[]>(`/parties?type=exchange_dealer${partyQuery ? `&q=${encodeURIComponent(partyQuery)}` : ""}`),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<ExchangeTransaction>("/exchange", {
        partyId: form.partyId,
        exchangeDate: form.exchangeDate,
        currencyGiven: form.currencyGiven,
        amountGiven: form.amountGiven,
        currencyReceived: form.currencyReceived,
        amountReceived: form.amountReceived,
        rate: form.rate,
        fee: form.fee || 0,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchanges"] });
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
          <p className="page-title" style={{ margin: 0 }}>صرافي</p>
          <p className="page-sub">د اسعارو تبادله له صرافانو سره</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوې تبادله
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto", marginTop: 16 }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr><th>شمېره</th><th>صراف</th><th>نېټه</th><th>ورکړل شوی</th><th>ترلاسه شوی</th><th>نرخ</th><th>فیس</th></tr>
          </thead>
          <tbody>
            {exchanges?.map((x) => (
              <tr key={x.id}>
                <td style={{ fontWeight: 600 }}>{x.exchangeNumber}</td>
                <td>{x.party?.name ?? "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>{x.exchangeDate}</td>
                <td style={{ color: "var(--danger)" }}>{x.amountGiven} {x.currencyGiven}</td>
                <td style={{ color: "var(--success)" }}>{x.amountReceived} {x.currencyReceived}</td>
                <td>{x.rate}</td>
                <td>{x.fee}</td>
              </tr>
            ))}
            {!exchanges?.length && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هېڅ تبادله نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 560, maxHeight: "88vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوې د اسعارو تبادله</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">صراف (نوم لټون)</label>
                <input className="form-input" value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.partyId ?? ""} onChange={(e) => setForm((f) => ({ ...f, partyId: Number(e.target.value) || null }))}>
                  <option value="">-- صراف وټاکئ --</option>
                  {dealers?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">ورکړل شوې اسعار</label>
                  <select className="form-input" value={form.currencyGiven} onChange={(e) => setForm((f) => ({ ...f, currencyGiven: e.target.value }))}>
                    <option value="AFN">AFN</option><option value="USD">USD</option><option value="PKR">PKR</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">ورکړل شوې اندازه</label>
                  <input className="form-input" type="number" min={0} value={form.amountGiven} onChange={(e) => setForm((f) => ({ ...f, amountGiven: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">ترلاسه شوې اسعار</label>
                  <select className="form-input" value={form.currencyReceived} onChange={(e) => setForm((f) => ({ ...f, currencyReceived: e.target.value }))}>
                    <option value="AFN">AFN</option><option value="USD">USD</option><option value="PKR">PKR</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">ترلاسه شوې اندازه</label>
                  <input className="form-input" type="number" min={0} value={form.amountReceived} onChange={(e) => setForm((f) => ({ ...f, amountReceived: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label className="form-label">نرخ</label>
                  <input className="form-input" type="number" min={0} step="0.00000001" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">فیس (اختیاري)</label>
                  <input className="form-input" type="number" min={0} value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">نېټه</label>
                  <input className="form-input" type="date" value={form.exchangeDate} onChange={(e) => setForm((f) => ({ ...f, exchangeDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!form.partyId || !form.amountGiven || !form.amountReceived || !form.rate || createMutation.isPending} onClick={() => createMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
