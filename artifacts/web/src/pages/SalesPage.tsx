import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api, type Sale, type SaleStatus, type Party, type UnitWithLocation } from "../lib/api";
import FilterBar from "../components/FilterBar";

const STATUS_LABELS: Record<SaleStatus, string> = {
  draft: "مسوده", reserved: "بکل شوی", active: "فعال",
  fully_paid: "بشپړ تادیه شوی", cancelled: "لغوه شوی", reversed: "بېرته شوی",
};

const STATUS_COLORS: Record<SaleStatus, string> = {
  draft: "badge-muted", reserved: "badge-warning", active: "badge-info",
  fully_paid: "badge-success", cancelled: "badge-danger", reversed: "badge-danger",
};

interface NewSaleForm {
  unitId: number | null;
  partyId: number | null;
  price: string;
  discount: string;
  currencyCode: string;
  saleDate: string;
  paymentType: string;
  contractNumber: string;
  notes: string;
  status: "draft" | "reserved" | "active";
  firstReceivedAmount: string;
}

function emptyForm(): NewSaleForm {
  return {
    unitId: null, partyId: null, price: "", discount: "0", currencyCode: "AFN",
    saleDate: new Date().toISOString().slice(0, 10), paymentType: "cash",
    contractNumber: "", notes: "", status: "active", firstReceivedAmount: "",
  };
}

export default function SalesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewSaleForm>(emptyForm());
  const [unitQuery, setUnitQuery] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ startDate: "", endDate: "", q: "" });

  const handleSearch = () => setApplied({ startDate, endDate, q });
  const handleClear = () => { setStartDate(""); setEndDate(""); setQ(""); setApplied({ startDate: "", endDate: "", q: "" }); };

  const { data: sales } = useQuery({
    queryKey: ["sales", statusFilter, applied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      if (applied.startDate) p.set("startDate", applied.startDate);
      if (applied.endDate) p.set("endDate", applied.endDate);
      if (applied.q) p.set("q", applied.q);
      return api.get<Sale[]>(`/sales?${p}`);
    },
  });

  const { data: availableUnits } = useQuery({
    queryKey: ["units-available", unitQuery],
    queryFn: () => api.get<UnitWithLocation[]>(`/units?status=available&purpose=for_sale${unitQuery ? `&q=${encodeURIComponent(unitQuery)}` : ""}`),
    enabled: showForm,
  });

  const { data: parties } = useQuery({
    queryKey: ["parties-search-sales", partyQuery],
    queryFn: () => api.get<Party[]>(`/parties?type=sales_customer${partyQuery ? `&q=${encodeURIComponent(partyQuery)}` : ""}`),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Sale>("/sales", {
        unitId: form.unitId,
        partyId: form.partyId,
        price: form.price,
        discount: form.discount,
        currencyCode: form.currencyCode,
        saleDate: form.saleDate,
        paymentType: form.paymentType || null,
        contractNumber: form.contractNumber || null,
        notes: form.notes || null,
        status: form.status,
        firstReceivedAmount: form.firstReceivedAmount ? form.firstReceivedAmount : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      setShowForm(false);
      setForm(emptyForm());
      setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  const selectedUnit = useMemo(() => availableUnits?.find((u) => u.id === form.unitId), [availableUnits, form.unitId]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <p className="page-title" style={{ margin: 0 }}>پلورنې</p>
          <p className="page-sub">د ملکیتونو پلورنه، تادیات او د پیرودونکو حسابونه</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوې پلورنه
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {["", "active", "reserved", "fully_paid", "cancelled"].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatusFilter(s)}
          >
            {s ? STATUS_LABELS[s as SaleStatus] : "ټول"}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>د پلورنې شمېره</th><th>پیرودونکی</th><th>ملکیت</th><th>نرخ</th>
              <th>پاتې</th><th>حالت</th><th>نېټه</th>
            </tr>
          </thead>
          <tbody>
            {sales?.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/sales/${s.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                    {s.saleNumber}
                  </Link>
                </td>
                <td>{s.party?.name ?? "—"}</td>
                <td>
                  {s.unit ? `${s.unit.floor?.block?.name ?? ""} / ${s.unit.unitNumber}` : "—"}
                </td>
                <td>{s.finalPrice} {s.currencyCode}</td>
                <td style={{ color: Number(s.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                  {s.balance ?? "—"}
                </td>
                <td><span className={`badge ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span></td>
                <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{s.saleDate}</td>
              </tr>
            ))}
            {!sales?.length && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هېڅ پلورنه نشته.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 640, maxHeight: "88vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوې پلورنه ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>

            {error && (
              <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">ملکیت (نمرې لټون)</label>
                <input className="form-input" placeholder="د واحد شمېره ولیکئ..." value={unitQuery} onChange={(e) => setUnitQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.unitId ?? ""} onChange={(e) => setForm((f) => ({ ...f, unitId: Number(e.target.value) || null }))}>
                  <option value="">-- ملکیت وټاکئ --</option>
                  {availableUnits?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.floor?.block?.name ?? ""} / {u.unitNumber} ({u.unitType?.name ?? ""})
                    </option>
                  ))}
                </select>
                {selectedUnit && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>حالت: {selectedUnit.status}</div>}
              </div>

              <div>
                <label className="form-label">پیرودونکی (نوم لټون)</label>
                <input className="form-input" placeholder="نوم ولیکئ..." value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.partyId ?? ""} onChange={(e) => setForm((f) => ({ ...f, partyId: Number(e.target.value) || null }))}>
                  <option value="">-- پیرودونکی وټاکئ --</option>
                  {parties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">نرخ</label>
                  <input className="form-input" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">تخفیف</label>
                  <input className="form-input" type="number" min={0} value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">اسعار</label>
                  <select className="form-input" value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}>
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">د تړون نېټه</label>
                  <input className="form-input" type="date" value={form.saleDate} onChange={(e) => setForm((f) => ({ ...f, saleDate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">د تادیې طریقه</label>
                  <select className="form-input" value={form.paymentType} onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}>
                    <option value="cash">نغدي</option>
                    <option value="installment">قسط وار</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">لومړنۍ ترلاسه شوې پیسه (اختیاري)</label>
                <input className="form-input" type="number" min={0} value={form.firstReceivedAmount} onChange={(e) => setForm((f) => ({ ...f, firstReceivedAmount: e.target.value }))} />
              </div>

              <div>
                <label className="form-label">د تړون شمېره (اختیاري)</label>
                <input className="form-input" value={form.contractNumber} onChange={(e) => setForm((f) => ({ ...f, contractNumber: e.target.value }))} />
              </div>

              <div>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={!form.unitId || !form.partyId || !form.price || createMutation.isPending}
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
