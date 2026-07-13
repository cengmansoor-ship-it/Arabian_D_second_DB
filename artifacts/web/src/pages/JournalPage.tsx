import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Account, type JournalTransactionEntry, type JournalDirection } from "../lib/api";
import { Plus, Minus, BookText, Printer } from "lucide-react";
import PrintHeader from "../components/PrintHeader";

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
      <PrintHeader title="د لیدلوري ژورنال" />
      <div className="page-header no-print">
        <h1 className="page-title">د لیدلوري ژورنال</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="page-breadcrumb">
            <span>کورپاڼه</span>
            <span>/</span>
            <span>مالیه</span>
            <span>/</span>
            <span>ژورنال</span>
          </div>
          <button className="btn btn-outline" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={16} /> چاپ
          </button>
        </div>
      </div>

      {/* Entry form */}
      <div className="card no-print" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookText size={18} /> نوی لاسي ثبت
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
            <div>
              <label className="form-label">نیټه</label>
              <input className="form-input" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} style={{ width: 180 }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">یادداشت</label>
              <input className="form-input" placeholder="اختیاري" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 16, background: "var(--surface-2)", borderRadius: 6, alignItems: "center", border: "1px solid var(--border)" }}>
                <select className="form-select" value={line.accountId} onChange={(e) => updateLine(idx, { accountId: Number(e.target.value) })} style={{ flex: "2 1 180px" }}>
                  <option value={0}>حساب وټاکئ</option>
                  {accounts?.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
                <select className="form-select" value={line.direction} onChange={(e) => updateLine(idx, { direction: e.target.value as JournalDirection })} style={{ width: 160 }}>
                  <option value="debit">بدهکار (Dr)</option>
                  <option value="credit">بستانکار (Cr)</option>
                </select>
                <input className="form-input" placeholder="اندازه" value={line.amount} onChange={(e) => updateLine(idx, { amount: e.target.value })} style={{ width: 130 }} />
                <select className="form-select" value={line.currencyCode} onChange={(e) => updateLine(idx, { currencyCode: e.target.value })} style={{ width: 90 }}>
                  <option value="AFN">AFN</option><option value="USD">USD</option><option value="PKR">PKR</option>
                </select>
                <input className="form-input" placeholder="توضیح" value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} style={{ flex: "3 1 160px" }} />
                {lines.length > 2 && (
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", flexShrink: 0, height: 46 }} onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}>
                    <Minus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-outline btn-sm" style={{ color: "var(--primary)", borderColor: "var(--primary)", marginBottom: 24 }} onClick={() => setLines((ls) => [...ls, emptyLine()])}>
            <Plus size={16} /> نوره کرښه
          </button>

          {error && <div style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</div>}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
            <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "..." : "ثبتول"}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "8px 0" }}>وروستي ثبتونه</h2>
        {transactions?.map((t) => (
          <div key={t.id} className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>#{t.id}</span>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{t.transactionDate}</span>
                {t.voidedAt && <span className="badge badge-danger">لغوه شوی</span>}
                {t.reversalOfId && <span className="badge badge-muted">د #{t.reversalOfId} ورستنه</span>}
              </div>
              {!t.voidedAt && !t.reversalOfId && (
                <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => setReversingId(reversingId === t.id ? null : t.id)}>
                  ورستول
                </button>
              )}
            </div>
            <div className="card-body">
              {t.memo && <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 16 }}>{t.memo}</p>}
              <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                <table className="fl-table">
                  <thead><tr><th>حساب</th><th>بدهکار</th><th>بستانکار</th><th>پیسه</th></tr></thead>
                  <tbody>
                    {t.lines.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>{l.account?.name ?? l.accountId}</td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>{l.direction === "debit" ? l.amount : ""}</td>
                        <td style={{ color: "var(--danger)", fontWeight: 600 }}>{l.direction === "credit" ? l.amount : ""}</td>
                        <td style={{ color: "var(--muted)" }}>{l.currencyCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reversingId === t.id && (
                <div style={{ display: "flex", gap: 12, marginTop: 20, background: "var(--danger-light)", padding: 16, borderRadius: 6 }}>
                  <input className="form-input" placeholder="د ورستولو دلیل" value={reason} onChange={(e) => setReason(e.target.value)} style={{ flex: 1, borderColor: "var(--danger)", background: "#fff" }} />
                  <button className="btn btn-danger" onClick={() => reason.trim() && reverseMutation.mutate({ id: t.id, reason: reason.trim() })} disabled={!reason.trim() || reverseMutation.isPending}>تایید</button>
                  <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setReversingId(null)}>لغوه</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {transactions?.length === 0 && <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>تر اوسه هیڅ ثبت نشته.</div>}
      </div>
    </div>
  );
}
