import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type CompanySettings, type Currency } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<CompanySettings>("/settings"),
  });
  const { data: currencies } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => api.get<Currency[]>("/settings/currencies"),
  });

  const [form, setForm] = useState<Partial<CompanySettings>>({});
  const [savedMsg, setSavedMsg] = useState(false);
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => api.put<CompanySettings>("/settings", form),
    onSuccess: (updated) => {
      qc.setQueryData(["settings"], updated);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const [newCurrency, setNewCurrency] = useState({ code: "", name: "" });
  const addCurrencyMutation = useMutation({
    mutationFn: () => api.post<Currency>("/settings/currencies", newCurrency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currencies"] });
      setNewCurrency({ code: "", name: "" });
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">تنظیمات</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">د شرکت معلومات</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">د شرکت نوم</label>
            <input
              disabled={!canManage}
              value={form.companyName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">اصلي پیسه</label>
            <select
              disabled={!canManage}
              value={form.baseCurrencyCode ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, baseCurrencyCode: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:bg-gray-50"
            >
              {currencies?.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">د مالي کال پیل میاشت</label>
            <input
              disabled={!canManage}
              type="number"
              min={1}
              max={12}
              value={form.fiscalYearStartMonth ?? 1}
              onChange={(e) => setForm((f) => ({ ...f, fiscalYearStartMonth: Number(e.target.value) }))}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] disabled:bg-gray-50"
            />
          </div>
          {canManage && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-60"
              >
                {saveMutation.isPending ? "..." : "خوندي کول"}
              </button>
              {savedMsg && <span className="text-sm text-[var(--primary)]">خوندي شو</span>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">پیسې</h2>
        <ul className="mb-4 space-y-2">
          {currencies?.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2 text-sm">
              <span>
                {c.code} — {c.name}
              </span>
              {c.isBase && <span className="text-xs font-medium text-[var(--primary)]">اصلي</span>}
            </li>
          ))}
        </ul>
        {canManage && (
          <div className="flex gap-2">
            <input
              placeholder="کوډ (مثال USD)"
              value={newCurrency.code}
              onChange={(e) => setNewCurrency((c) => ({ ...c, code: e.target.value }))}
              className="w-28 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
            <input
              placeholder="نوم"
              value={newCurrency.name}
              onChange={(e) => setNewCurrency((c) => ({ ...c, name: e.target.value }))}
              className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
            />
            <button
              onClick={() => addCurrencyMutation.mutate()}
              disabled={!newCurrency.code || !newCurrency.name || addCurrencyMutation.isPending}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              زیاتول
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
