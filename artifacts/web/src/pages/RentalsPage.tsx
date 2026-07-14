import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, LayoutGrid, List } from "lucide-react";
import { api, type Rental, type RentalStatus, type RentalFrequency, type Party, type UnitWithLocation } from "../lib/api";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString, todayIso } from "../lib/jalali";

const STATUS_LABELS: Record<RentalStatus, string> = { active: "فعال", ended: "پای ته رسېدلی", cancelled: "لغوه شوی" };
const STATUS_COLORS: Record<RentalStatus, string> = { active: "badge-info", ended: "badge-muted", cancelled: "badge-danger" };
const FREQUENCY_LABELS: Record<RentalFrequency, string> = { monthly: "میاشتنی", quarterly: "ربعوار", yearly: "کلنی" };
const CURRENCY_LABELS: Record<string, string> = { AFN: "افغانۍ", USD: "ډالر", PKR: "کلدار" };

interface NewRentalForm {
  unitId: number | null;
  tenantPartyId: number | null;
  startDate: string;
  rentAmount: string;
  frequency: RentalFrequency;
  depositAmount: string;
  currencyCode: string;
  notes: string;
  firstReceivedAmount: string;
}

function emptyForm(): NewRentalForm {
  return {
    unitId: null, tenantPartyId: null, startDate: todayIso(),
    rentAmount: "", frequency: "monthly", depositAmount: "0", currencyCode: "AFN",
    notes: "", firstReceivedAmount: "",
  };
}

export default function RentalsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRentalForm>(emptyForm());
  const [unitQuery, setUnitQuery] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ startDate: "", endDate: "", q: "" });
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const handleSearch = () => setApplied({ startDate, endDate, q });
  const handleClear = () => { setStartDate(todayIso()); setEndDate(todayIso()); setQ(""); setApplied({ startDate: "", endDate: "", q: "" }); };

  const { data: rentals } = useQuery({
    queryKey: ["rentals", statusFilter, applied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      if (applied.startDate) p.set("startDate", applied.startDate);
      if (applied.endDate) p.set("endDate", applied.endDate);
      if (applied.q) p.set("q", applied.q);
      return api.get<Rental[]>(`/rentals?${p}`);
    },
  });

  const { data: availableUnits } = useQuery({
    queryKey: ["units-available-rent", unitQuery],
    queryFn: () => api.get<UnitWithLocation[]>(`/units?status=available&purpose=for_rent${unitQuery ? `&q=${encodeURIComponent(unitQuery)}` : ""}`),
    enabled: showForm,
  });

  const { data: parties } = useQuery({
    queryKey: ["parties-search-tenant", partyQuery],
    queryFn: () => api.get<Party[]>(`/parties?type=tenant${partyQuery ? `&q=${encodeURIComponent(partyQuery)}` : ""}`),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Rental>("/rentals", {
        unitId: form.unitId,
        tenantPartyId: form.tenantPartyId,
        startDate: form.startDate,
        rentAmount: form.rentAmount,
        frequency: form.frequency,
        depositAmount: form.depositAmount || 0,
        currencyCode: form.currencyCode,
        notes: form.notes || null,
        firstReceivedAmount: form.firstReceivedAmount ? form.firstReceivedAmount : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rentals"] });
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
          <p className="page-title" style={{ margin: 0 }}>کرایې</p>
          <p className="page-sub">د واحدونو کرایه، رسیدونه او د کرایه‌دارانو حسابونه</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> نوې کرایه
        </button>
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>د پیل نیټه</div>
          <JalaliDateInput value={startDate} onChange={setStartDate} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>د ختم نیټه</div>
          <JalaliDateInput value={endDate} onChange={setEndDate} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>لټون</div>
          <input className="form-input" placeholder="د کرایې شمیره..." value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 180 }} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>لټول</button>
        <button className="btn btn-outline btn-sm" onClick={handleClear}>پاکول</button>
      </div>

      {/* Status filter + view toggle */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["", "active", "ended", "cancelled"].map((s) => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`} onClick={() => setStatusFilter(s)}>
              {s ? STATUS_LABELS[s as RentalStatus] : "ټول"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-outline"}`} onClick={() => setViewMode("list")} title="لیست"><List size={15} /></button>
          <button className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline"}`} onClick={() => setViewMode("grid")} title="ګرید"><LayoutGrid size={15} /></button>
        </div>
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>شمیره</th><th>کرایه‌دار</th><th>ملکیت</th><th>میاشتنی کرایه</th>
                <th>الباقی</th><th>حالت</th><th>د تړون نیټه</th>
              </tr>
            </thead>
            <tbody>
              {rentals?.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/rentals/${r.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                      {r.rentalNumber}
                    </Link>
                  </td>
                  <td>{r.tenant?.name ?? "—"}</td>
                  <td>{r.unit ? `${r.unit.floor?.block?.name ?? ""} / ${r.unit.unitNumber}` : "—"}</td>
                  <td>{r.rentAmount} {CURRENCY_LABELS[r.currencyCode] ?? r.currencyCode} / {FREQUENCY_LABELS[r.frequency]}</td>
                  <td style={{ color: Number(r.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>{r.balance ?? "—"}</td>
                  <td><span className={`badge ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--muted)" }}>{isoToJalaliString(r.startDate)}</td>
                </tr>
              ))}
              {!rentals?.length && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>تر اوسه هیڅ کرایه نشته.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {rentals?.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Link to={`/rentals/${r.id}`} style={{ fontWeight: 700, color: "var(--primary)", textDecoration: "none", fontSize: 14 }}>
                  {r.rentalNumber}
                </Link>
                <span className={`badge ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>{r.tenant?.name ?? "—"}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                {r.unit?.floor?.block?.name ?? ""} / {r.unit?.unitNumber ?? ""}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{r.rentAmount} {CURRENCY_LABELS[r.currencyCode] ?? r.currencyCode} / {FREQUENCY_LABELS[r.frequency]}</span>
                <span style={{ color: Number(r.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                  الباقی: {r.balance ?? "—"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{isoToJalaliString(r.startDate)}</div>
            </div>
          ))}
          {!rentals?.length && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>تر اوسه هیڅ کرایه نشته.</div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 640, maxHeight: "90vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوې کرایه ثبتول</div>
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
                <input className="form-input" placeholder="د واحد شمیره ولیکئ..." value={unitQuery} onChange={(e) => setUnitQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.unitId ?? ""} onChange={(e) => setForm((f) => ({ ...f, unitId: Number(e.target.value) || null }))}>
                  <option value="">-- ملکیت وټاکئ --</option>
                  {availableUnits?.map((u) => (
                    <option key={u.id} value={u.id}>{u.floor?.block?.name ?? ""} / {u.unitNumber} ({u.unitType?.name ?? ""})</option>
                  ))}
                </select>
                {selectedUnit && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>حالت: {selectedUnit.status}</div>}
              </div>

              <div>
                <label className="form-label">کرایه‌دار (نوم لټون)</label>
                <input className="form-input" placeholder="نوم ولیکئ..." value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} />
                <select className="form-input" style={{ marginTop: 6 }} value={form.tenantPartyId ?? ""} onChange={(e) => setForm((f) => ({ ...f, tenantPartyId: Number(e.target.value) || null }))}>
                  <option value="">-- کرایه‌دار وټاکئ --</option>
                  {parties?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">میاشتنی کرایه</label>
                  <input className="form-input" type="number" min={0} value={form.rentAmount} onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">تکرار</label>
                  <select className="form-input" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as RentalFrequency }))}>
                    <option value="monthly">میاشتنی</option>
                    <option value="quarterly">ربعوار</option>
                    <option value="yearly">کلنی</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">اسعار</label>
                  <select className="form-input" value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}>
                    <option value="AFN">افغانۍ</option>
                    <option value="USD">ډالر</option>
                    <option value="PKR">کلدار</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">د تړون نیټه</label>
                  <JalaliDateInput value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
                </div>
                <div>
                  <label className="form-label">امانت (اختیاري)</label>
                  <input className="form-input" type="number" min={0} value={form.depositAmount} onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="form-label">لومړنی وصول (اختیاري)</label>
                <input className="form-input" type="number" min={0} value={form.firstReceivedAmount} onChange={(e) => setForm((f) => ({ ...f, firstReceivedAmount: e.target.value }))} />
              </div>

              <div>
                <label className="form-label">یادداشتونه</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!form.unitId || !form.tenantPartyId || !form.rentAmount || createMutation.isPending} onClick={() => createMutation.mutate()}>
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
