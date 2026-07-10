import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Account, type JournalTransactionEntry, type JournalDirection } from "../lib/api";
import { Plus, Minus, BookText } from "lucide-react";

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
  const { data: transactions } = useQuery({ queryKey: ["journal"], queryFn: () => api.get<JournalTransactionEntry[]>("/journal") });
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/journal/accounts") });

  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<LineForm[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [reversingId, setReversingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const createMutation = useMutation({
    mutationFn: () => api.post("/journal/manual", { transactionDate, memo: memo || null, lines: lines.filter((l) => l.accountId && l.amount).map((l) => ({ ...l, description: l.description || null })) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal"] }); setMemo(""); setLines([emptyLine(), emptyLine()]); setError(null); },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  const reverseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.post(`/journal/${id}/reverse`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal"] }); setReversingId(null); setReason(""); },
  });

  function updateLine(idx: number, patch: Partial<LineForm>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  return (
    <div>
      <p className="page-title">د لیدلوري ژورنال</p>
      <p className="page-sub">لاسي ژورنال ثبتونه</p>

      {/* Entry form */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <BookText size={16} />نوی لاسي ثبت
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <label className="form-label">نیټه</label>
            <input className="form-input" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} style={{ width: 160 }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">یادداشت</label>
            <input className="form-input" placeholder="اختیاري" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 10, background: "var(--surface-2)", borderRadius: 4, alignItems: "center" }}>
              <select className="form-select" value={line.accountId} onChange={(e) => updateLine(idx, { accountId: Number(e.target.value) })} style={{ flex: "2 1 160px" }}>
                <option value={0}>حساب وټاکئ</option>
                {accounts?.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
              <select className="form-select" value={line.direction} onChange={(e) => updateLine(idx, { direction: e.target.value as JournalDirection })} style={{ width: 150 }}>
                <option value="debit">بدهکار (Dr)</option>
                <option value="credit">بستانکار (Cr)</option>
              </select>
              <input className="form-input" placeholder="اندازه" value={line.amount} onChange={(e) => updateLine(idx, { amount: e.target.value })} style={{ width: 110 }} />
              <select className="form-select" value={line.currencyCode} onChange={(e) => updateLine(idx, { currencyCode: e.target.value })} style={{ width: 80 }}>
                <option value="AFN">AFN</option><option value="USD">USD</option><option value="PKR">PKR</option>
              </select>
              <input className="form-input" placeholder="توضیح" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} style={{ flex: "3 1 140px" }} />
              {lines.length > 2 && (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", flexShrink: 0 }} onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}>
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-sm" style={{ color: "var(--primary)", marginBottom: 12 }} onClick={() => setLines((ls) => [...ls, emptyLine()])}>
          <Plus size={14} />نوره کرښه
        </button>

        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? "..." : "ثبتول"}
        </button>
      </div>

      {/* Transactions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {transactions?.map((t) => (
          <div key={t.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>#{t.id}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{t.transactionDate}</span>
                {t.voidedAt && <span className="badge badge-danger">لغوه شوی</span>}
                {t.reversalOfId && <span className="badge badge-muted">د #{t.reversalOfId} ورستنه</span>}
              </div>
              {!t.voidedAt && !t.reversalOfId && (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setReversingId(reversingId === t.id ? null : t.id)}>
                  ورستول
                </button>
              )}
            </div>
            {t.memo && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>{t.memo}</p>}
            <table className="fl-table" style={{ fontSize: 13 }}>
              <thead><tr><th>حساب</th><th>بدهکار</th><th>بستانکار</th><th>پیسه</th></tr></thead>
              <tbody>
                {t.lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.account?.name ?? l.accountId}</td>
                    <td style={{ color: "var(--success)", fontWeight: 500 }}>{l.direction === "debit" ? l.amount : ""}</td>
                    <td style={{ color: "var(--danger)", fontWeight: 500 }}>{l.direction === "credit" ? l.amount : ""}</td>
                    <td style={{ color: "var(--muted)" }}>{l.currencyCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reversingId === t.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input className="form-input" placeholder="د ورستولو دلیل" value={reason} onChange={(e) => setReason(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-danger btn-sm" onClick={() => reason.trim() && reverseMutation.mutate({ id: t.id, reason: reason.trim() })} disabled={!reason.trim() || reverseMutation.isPending}>تایید</button>
                <button className="btn btn-outline btn-sm" onClick={() => setReversingId(null)}>لغوه</button>
              </div>
            )}
          </div>
        ))}
        {transactions?.length === 0 && <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>تر اوسه هیڅ ثبت نشته.</div>}
      </div>
    </div>
  );
}
