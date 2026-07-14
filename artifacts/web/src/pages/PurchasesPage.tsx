import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api, type Purchase, type PurchaseStatus, type Party } from "../lib/api";
import FilterBar from "../components/FilterBar";

const STATUS_LABELS: Record<PurchaseStatus, string> = { open: "پرانیستی", paid: "تادیه شوی", cancelled: "لغوه شوی" };
const STATUS_COLORS: Record<PurchaseStatus, string> = { open: "badge-warning", paid: "badge-success", cancelled: "badge-danger" };

interface NewPurchaseForm {
  supplierPartyId: number | null;
  purchaseDate: string;
  itemName: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  currencyCode: string;
  notes: string;
}

function emptyForm(): NewPurchaseForm {
  return {
    supplierPartyId: null, purchaseDate: new Date().toISOString().slice(0, 10),
    itemName: "", quantity: "1", unitOfMeasure: "", unitPrice: "", currencyCode: "AFN", notes: "",
  };
}

export default function PurchasesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPurchaseForm>(emptyForm());
  const [partyQuery, setPartyQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ startDate: "", endDate: "", q: "" });

  const handleSearch = () => setApplied({ startDate, endDate, q });
  const handleClear = () => { setStartDate(""); setEndDate(""); setQ(""); setApplied({ startDate: "", endDate: "", q: "" }); };

  const { data: purchases } = useQuery({
    queryKey: ["purchases", statusFilter, applied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      if (applied.startDate) p.set("startDate", applied.startDate);
      if (applied.endDate) p.set("endDate", applied.endDate);
      if (applied.q) p.set("q", applied.q);
      return api.get<Purchase[]>(`/purchases?${p}`);
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["parties-search-supplier", partyQuery],
    queryFn: () => api.get<Party[]>(`/parties?type=supplier${partyQuery ? `&q=${encodeURIComponent(partyQuery)}` : ""}`),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Purchase>("/purchases", {
        supplierPartyId: form.supplierPartyId,
        purchaseDate: form.purchaseDate,
        itemName: form.itemName,
        quantity: form.quantity,
        unitOfMeasure: form.unitOfMeasure || null,
        unitPrice: form.unitPrice,
        currencyCode: form.currencyCode,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
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
          <p className="page-title" style={{ margin: 0 }}>پیرودنې</p>
          <p className="page-sub">د توکو پیرودل او د عرضه کوونکو حسابونه</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوې پیرودنه
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {["", "open", "paid", "cancelled"].map((s) => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`} onClick={() => setStatusFilter(s)}>
            {s ? STATUS_LABELS[s as PurchaseStatus] : "ټول"}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>د پیرودنې شمېره</th><th>عرضه کوونکی</th><th>توکی</th><th>مقدار</th>
              <th>ټول مبلغ</th><th>پاتې</th><th>حالت</th><th>نېټه</th>
            </tr>
          </thead>
          <tbody>
            {purchases?.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/purchases/${p.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                    {p.purchaseNumber}
                  </Link>
                </td>
                <td>{p.supplier?.name ?? "—"}</td>
                <td>{p.itemName}</td>
                <td>{p.quantity} {p.unitOfMeasure ?? ""}</td>
                <td>{p.totalAmount} {p.currencyCode}</td>
                <td style={{ color: Number(p.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>{p.balance ?? "—"}</td>
                <td><span className={`badge ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span></td>
                <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{p.purchaseDate}</td>
              </tr>
            ))}
            {!purchases?.length && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هېڅ پیرودنه نشته.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 520, maxHeight: "88vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوې پیرودنه ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">عرضه کوونکی (نوم لټون)</label>
                <input className="form-input" placeholder="نوم ولیکئ..." value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.supplierPartyId ?? ""} onChange={(e) => setForm((f) => ({ ...f, supplierPartyId: Number(e.target.value) || null }))}>
                  <option value="">-- عرضه کوونکی وټاکئ --</option>
                  {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">توکی</label>
                <input className="form-input" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">مقدار</label>
                  <input className="form-input" type="number" min={0} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">واحد</label>
                  <input className="form-input" placeholder="دانه، کیلو..." value={form.unitOfMeasure} onChange={(e) => setForm((f) => ({ ...f, unitOfMeasure: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">فی واحد نرخ</label>
                  <input className="form-input" type="number" min={0} value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">نېټه</label>
                  <input className="form-input" type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
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
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!form.supplierPartyId || !form.itemName || !form.quantity || !form.unitPrice || createMutation.isPending} onClick={() => createMutation.mutate()}>
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
