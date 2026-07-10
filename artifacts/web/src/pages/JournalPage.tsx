import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Account, type JournalTransactionEntry, type JournalDirection } from "../lib/api";

interface LineForm {
  accountId: number;
  currencyCode: string;
  direction: JournalDirection;
  amount: string;
  description: string;
}

function emptyLine(): LineForm {
  return { accountId: 0, currencyCode: "AFN", direction: "debit", amount: "", description: "" };
}

export default function JournalPage() {
  const qc = useQueryClient();
  const { data: transactions } = useQuery({
    queryKey: ["journal"],
    queryFn: () => api.get<JournalTransactionEntry[]>("/journal"),
  });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/journal/accounts") });

  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<LineForm[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [reversingId, setReversingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/journal/manual", {
        transactionDate,
        memo: memo || null,
        lines: lines
          .filter((l) => l.accountId && l.amount)
          .map((l) => ({ ...l, description: l.description || null })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      setMemo("");
      setLines([emptyLine(), emptyLine()]);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  const reverseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.post(`/journal/${id}/reverse`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      setReversingId(null);
      setReason("");
    },
  });

  function updateLine(idx: number, patch: Partial<LineForm>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">د لیدلوري ژورنال</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">نوی لاسي ثبت</h2>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="یادداشت (اختیاري)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          {lines.map((line, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--bg)] p-2">
              <select
                value={line.accountId}
                onChange={(e) => updateLine(idx, { accountId: Number(e.target.value) })}
                className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
              >
                <option value={0}>حساب وټاکئ</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
              <select
                value={line.direction}
                onChange={(e) => updateLine(idx, { direction: e.target.value as JournalDirection })}
                className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
              >
                <option value="debit">بدهکار (Debit)</option>
                <option value="credit">بستانکار (Credit)</option>
              </select>
              <input
                placeholder="اندازه"
                value={line.amount}
                onChange={(e) => updateLine(idx, { amount: e.target.value })}
                className="w-28 rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
              />
              <select
                value={line.currencyCode}
                onChange={(e) => updateLine(idx, { currencyCode: e.target.value })}
                className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
              >
                <option value="AFN">AFN</option>
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
              </select>
              <input
                placeholder="توضیح"
                value={line.description}
                onChange={(e) => updateLine(idx, { description: e.target.value })}
                className="flex-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm outline-none"
              />
              {lines.length > 2 && (
                <button
                  onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                  className="text-xs text-[var(--danger)]"
                >
                  ړنګول
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setLines((ls) => [...ls, emptyLine()])} className="mt-2 text-xs font-medium text-[var(--primary)] hover:underline">
          + نوره کرښه
        </button>

        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="mt-3 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          ثبتول
        </button>
      </div>

      <div className="space-y-3">
        {transactions?.map((t) => (
          <div key={t.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold">#{t.id}</span>{" "}
                <span className="text-xs text-[var(--muted)]">{t.transactionDate}</span>
                {t.voidedAt && <span className="mr-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">لغوه شوی</span>}
                {t.reversalOfId && <span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">د #{t.reversalOfId} ورستنېدنه</span>}
              </div>
              {!t.voidedAt && !t.reversalOfId && (
                <button onClick={() => setReversingId(reversingId === t.id ? null : t.id)} className="text-xs font-medium text-[var(--danger)] hover:underline">
                  ورستول
                </button>
              )}
            </div>
            {t.memo && <p className="mb-2 text-sm text-[var(--muted)]">{t.memo}</p>}
            <table className="w-full text-xs">
              <thead className="text-right text-[var(--muted)]">
                <tr>
                  <th className="py-1">حساب</th>
                  <th className="py-1">بدهکار</th>
                  <th className="py-1">بستانکار</th>
                  <th className="py-1">پیسه</th>
                </tr>
              </thead>
              <tbody>
                {t.lines.map((l) => (
                  <tr key={l.id} className="border-t border-[var(--border)]">
                    <td className="py-1">{l.account?.name ?? l.accountId}</td>
                    <td className="py-1 text-green-700">{l.direction === "debit" ? l.amount : ""}</td>
                    <td className="py-1 text-red-700">{l.direction === "credit" ? l.amount : ""}</td>
                    <td className="py-1">{l.currencyCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reversingId === t.id && (
              <div className="mt-3 flex gap-2">
                <input
                  placeholder="د ورستولو دلیل"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                />
                <button
                  onClick={() => reason.trim() && reverseMutation.mutate({ id: t.id, reason: reason.trim() })}
                  disabled={!reason.trim() || reverseMutation.isPending}
                  className="rounded-lg bg-[var(--danger)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  تایید
                </button>
              </div>
            )}
          </div>
        ))}
        {transactions?.length === 0 && <p className="text-sm text-[var(--muted)]">تر اوسه هیڅ ثبت نشته.</p>}
      </div>
    </div>
  );
}
