import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type CompanySettings, type Currency } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Save, Plus } from "lucide-react";

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");
  const qc = useQueryClient();

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.get<CompanySettings>("/settings") });
  const { data: currencies } = useQuery({ queryKey: ["currencies"], queryFn: () => api.get<Currency[]>("/settings/currencies") });

  const [form, setForm] = useState<Partial<CompanySettings>>({});
  const [savedMsg, setSavedMsg] = useState(false);
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => api.put<CompanySettings>("/settings", form),
    onSuccess: (updated) => {
      qc.setQueryData(["settings"], updated);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    },
  });

  const [newCurrency, setNewCurrency] = useState({ code: "", name: "" });
  const addCurrencyMutation = useMutation({
    mutationFn: () => api.post<Currency>("/settings/currencies", newCurrency),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currencies"] }); setNewCurrency({ code: "", name: "" }); },
  });

  return (
    <div style={{ maxWidth: 680 }}>
      <p className="page-title">تنظیمات</p>
      <p className="page-sub">د شرکت معلومات او پیسې</p>

      {/* Company info */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          د شرکت معلومات
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="form-label">د شرکت نوم</label>
            <input className="form-input" disabled={!canManage} value={form.companyName ?? ""} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">اصلي پیسه</label>
            <select className="form-select" disabled={!canManage} value={form.baseCurrencyCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, baseCurrencyCode: e.target.value }))}>
              {currencies?.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">د مالي کال پیل میاشت</label>
            <input className="form-input" type="number" min={1} max={12} disabled={!canManage} value={form.fiscalYearStartMonth ?? 1} onChange={(e) => setForm((f) => ({ ...f, fiscalYearStartMonth: Number(e.target.value) }))} style={{ maxWidth: 120 }} />
          </div>
          {canManage && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save size={15} />
                {saveMutation.isPending ? "..." : "خوندي کول"}
              </button>
              {savedMsg && <span style={{ color: "var(--success)", fontSize: 13 }}>✓ خوندي شو</span>}
            </div>
          )}
        </div>
      </div>

      {/* Currencies */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          پیسې
        </div>
        <div style={{ marginBottom: 16 }}>
          {currencies?.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{c.code} — {c.name}</span>
              {c.isBase && <span className="badge badge-info">اصلي</span>}
            </div>
          ))}
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: 8 }}>
            <input className="form-input" placeholder="کوډ (USD)" value={newCurrency.code} onChange={(e) => setNewCurrency((c) => ({ ...c, code: e.target.value }))} style={{ width: 110 }} />
            <input className="form-input" placeholder="نوم" value={newCurrency.name} onChange={(e) => setNewCurrency((c) => ({ ...c, name: e.target.value }))} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => addCurrencyMutation.mutate()} disabled={!newCurrency.code || !newCurrency.name || addCurrencyMutation.isPending}>
              <Plus size={15} />زیاتول
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
