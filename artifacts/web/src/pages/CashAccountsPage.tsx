import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Account, type CashAccountEntry } from "../lib/api";

export default function CashAccountsPage() {
  const qc = useQueryClient();
  const { data: cashAccounts } = useQuery({ queryKey: ["cash-accounts"], queryFn: () => api.get<CashAccountEntry[]>("/cash-accounts") });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/journal/accounts") });

  const [form, setForm] = useState({ name: "", currencyCode: "AFN", accountId: 0 });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post("/cash-accounts", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-accounts"] });
      setForm({ name: "", currencyCode: "AFN", accountId: 0 });
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">د کیش حسابونه</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="نوم"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <select
            value={form.currencyCode}
            onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          >
            <option value="AFN">AFN</option>
            <option value="USD">USD</option>
            <option value="PKR">PKR</option>
          </select>
          <select
            value={form.accountId}
            onChange={(e) => setForm((f) => ({ ...f, accountId: Number(e.target.value) }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          >
            <option value={0}>حساب وټاکئ</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.name.trim() || !form.accountId || createMutation.isPending}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            جوړول
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] text-right">
            <tr>
              <th className="px-4 py-2">نوم</th>
              <th className="px-4 py-2">پیسه</th>
              <th className="px-4 py-2">حساب</th>
            </tr>
          </thead>
          <tbody>
            {cashAccounts?.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.currencyCode}</td>
                <td className="px-4 py-2">{c.account?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
