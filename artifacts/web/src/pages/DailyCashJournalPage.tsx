import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Printer, Plus, Trash2, BookOpen, AlertCircle } from "lucide-react";
import PrintHeader from "../components/PrintHeader";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString } from "../lib/jalali";
import Decimal from "decimal.js";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Party { id: number; name: string; type: string; }

interface DailyCashRow {
  id: number;
  entryDate: string;
  currencyCode: string;
  description: string;
  partyId: number | null;
  partyName: string | null;
  amountIn: string | null;
  amountOut: string | null;
  balance: string;
  voidedAt: string | null;
  voidReason: string | null;
}

interface DailyCashPage {
  currencyCode: string;
  startDate: string;
  endDate: string;
  openingBalance: string;
  rows: DailyCashRow[];
  totalIn: string;
  totalOut: string;
  closingBalance: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Glossary: افغانۍ (AFN) — ډالر (USD) — کلدار (PKR)
const CURRENCIES = [
  { code: "AFN", label: "افغانۍ", symbol: "؋", flag: "🇦🇫" },
  { code: "USD", label: "ډالر",   symbol: "$",  flag: "🇺🇸" },
  { code: "PKR", label: "کلدار",  symbol: "₨",  flag: "🇵🇰" },
];

function fmt(val: string | null | undefined): string {
  if (!val) return "—";
  const d = new Decimal(val);
  return d.toFixed(4).replace(/\.?0+$/, "");
}

function balanceColor(val: string): string {
  const d = new Decimal(val);
  if (d.isNegative()) return "var(--danger)";
  return "var(--success, #10b981)";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DailyCashJournalPage() {
  const qc = useQueryClient();
  const [currency, setCurrency] = useState("AFN");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());

  // form state
  const [form, setForm] = useState({
    entryDate: today(),
    description: "",
    partyId: "",
    entryType: "in" as "in" | "out",
    amount: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const descRef = useRef<HTMLInputElement>(null);

  // ── Data queries ──────────────────────────────────────────────────────────

  const { data: page, isFetching } = useQuery<DailyCashPage>({
    queryKey: ["roznamcha", currency, startDate, endDate],
    queryFn: () => api.get(`/roznamcha?currency=${currency}&startDate=${startDate}&endDate=${endDate}`),
  });

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["parties-all"],
    queryFn: () => api.get("/parties?limit=500"),
    select: (d: any) => (Array.isArray(d) ? d : d.data ?? []),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/roznamcha", {
        entryDate: form.entryDate,
        currencyCode: currency,
        description: form.description,
        partyId: form.partyId ? Number(form.partyId) : null,
        amountIn:  form.entryType === "in"  ? form.amount : null,
        amountOut: form.entryType === "out" ? form.amount : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roznamcha"] });
      setForm({ entryDate: today(), description: "", partyId: "", entryType: "in", amount: "" });
      setFormError(null);
      descRef.current?.focus();
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "ستونزه رامنځته شوه"),
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.delete(`/roznamcha/${id}`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roznamcha"] });
      setVoidingId(null);
      setVoidReason("");
    },
  });

  // ── Currency pill ─────────────────────────────────────────────────────────
  const curInfo = CURRENCIES.find((c) => c.code === currency)!;

  return (
    <div>
      <PrintHeader title={`روزنامچه — ${curInfo.label}`} />

      {/* ── Header ── */}
      <div className="page-header no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BookOpen size={24} color="var(--primary)" />
          <h1 className="page-title" style={{ margin: 0 }}>روزنامچه</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="page-breadcrumb">
            <span>کورپاڼه</span><span>/</span><span>روزنامچه</span>
          </div>
          <button
            className="btn btn-outline no-print"
            onClick={() => window.print()}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Printer size={16} /> چاپ
          </button>
        </div>
      </div>

      {/* ── Currency Tabs ── */}
      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: `2px solid ${currency === c.code ? "var(--primary)" : "var(--border)"}`,
              background: currency === c.code ? "var(--primary)" : "var(--surface)",
              color: currency === c.code ? "#fff" : "var(--text)",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 20 }}>{c.flag}</span>
            {c.label}
            <span style={{ opacity: 0.7, fontSize: 13 }}>({c.symbol})</span>
          </button>
        ))}
      </div>

      {/* ── Date Filter ── */}
      <div className="card no-print" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="form-label">د شروع نیټه</label>
            <JalaliDateInput value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <label className="form-label">د ختم نیټه</label>
            <JalaliDateInput value={endDate} onChange={setEndDate} />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => qc.invalidateQueries({ queryKey: ["roznamcha"] })}
          >
            لټون
          </button>
        </div>
      </div>

      {/* ── Entry Form ── */}
      <div className="card no-print" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <Plus size={18} /> نوی ثبت — {curInfo.flag} {curInfo.label}
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>

            {/* Date */}
            <div style={{ minWidth: 200 }}>
              <label className="form-label">نیټه</label>
              <JalaliDateInput
                value={form.entryDate}
                onChange={(v) => setForm((f) => ({ ...f, entryDate: v }))}
              />
            </div>

            {/* Description */}
            <div style={{ flex: "3 1 200px" }}>
              <label className="form-label">تفصیل *</label>
              <input
                ref={descRef}
                className="form-input"
                placeholder="لنډ توضیح..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Party — TODO: auto-link to party ledger when implemented */}
            <div style={{ flex: "2 1 160px" }}>
              <label className="form-label">مشتری (اختیاري)</label>
              <select
                className="form-select"
                value={form.partyId}
                onChange={(e) => setForm((f) => ({ ...f, partyId: e.target.value }))}
              >
                <option value="">— مشتری وټاکئ —</option>
                {(parties ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Entry type — داخل (+) / خروج (-) per glossary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="form-label">ډول</label>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                {(["in", "out"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, entryType: t }))}
                    style={{
                      padding: "9px 18px",
                      border: "none",
                      background: form.entryType === t ? (t === "in" ? "#10b981" : "var(--danger)") : "var(--surface-2)",
                      color: form.entryType === t ? "#fff" : "var(--muted)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 14,
                      transition: "all 0.1s",
                    }}
                  >
                    {t === "in" ? "داخل ＋" : "خروج −"}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div style={{ flex: "1 1 130px" }}>
              <label className="form-label">اندازه ({curInfo.symbol})</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                style={{
                  borderColor: form.entryType === "in" ? "#10b981" : "var(--danger)",
                  fontWeight: 700,
                }}
                onKeyDown={(e) => { if (e.key === "Enter") createMutation.mutate(); }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              style={{ alignSelf: "flex-end", minWidth: 100 }}
            >
              {createMutation.isPending ? "..." : "ثبت کړئ"}
            </button>
          </div>

          {formError && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, color: "var(--danger)", alignItems: "center", fontSize: 14 }}>
              <AlertCircle size={16} /> {formError}
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {page && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "پخوانی الباقي", value: page.openingBalance, color: "var(--primary)" },
            { label: "ټول داخل (+)", value: page.totalIn, color: "#10b981" },
            { label: "ټول خروج (−)", value: page.totalOut, color: "var(--danger)" },
            { label: "اوسنی الباقي", value: page.closingBalance, color: balanceColor(page.closingBalance) },
          ].map((s) => (
            <div key={s.label} className="card" style={{ border: `1px solid var(--border)` }}>
              <div className="card-body" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, direction: "ltr", textAlign: "right" }}>
                  {curInfo.symbol} {fmt(s.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Transactions Table ── */}
      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>
            {curInfo.flag} د {curInfo.label} روزنامچه — {isoToJalaliString(startDate)} نه {isoToJalaliString(endDate)} پورې
          </div>
          {isFetching && <span style={{ fontSize: 12, color: "var(--muted)" }}>لوډ کیږي...</span>}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>شمیره</th>
                <th style={{ width: 120 }}>تاریخ</th>
                <th>تفصیل</th>
                <th style={{ width: 140 }}>مشتری</th>
                <th style={{ width: 130, color: "#10b981" }}>داخل (+)</th>
                <th style={{ width: 130, color: "var(--danger)" }}>خروج (−)</th>
                <th style={{ width: 140 }}>الباقي</th>
                <th className="no-print" style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              {page && (
                <tr style={{ background: "var(--surface-2)", fontWeight: 700 }}>
                  <td colSpan={6} style={{ textAlign: "right", color: "var(--muted)", fontSize: 13 }}>
                    د {isoToJalaliString(startDate)} نیټې نه وړاندې پخوانی الباقي
                  </td>
                  <td style={{ color: balanceColor(page.openingBalance), fontWeight: 800, direction: "ltr" }}>
                    {fmt(page.openingBalance)}
                  </td>
                  <td className="no-print" />
                </tr>
              )}

              {/* Entries */}
              {page?.rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                    د دې نیټې لپاره هیڅ ثبت نشته
                  </td>
                </tr>
              )}

              {page?.rows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    opacity: row.voidedAt ? 0.45 : 1,
                    textDecoration: row.voidedAt ? "line-through" : "none",
                    background: row.voidedAt ? "var(--surface-2)" : undefined,
                  }}
                >
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{idx + 1}</td>
                  <td style={{ fontSize: 13, whiteSpace: "nowrap" }}>{isoToJalaliString(row.entryDate)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.description}</div>
                    {row.voidedAt && (
                      <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>
                        لغوه: {row.voidReason}
                      </div>
                    )}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{row.partyName ?? "—"}</td>

                  {/* داخل (+) */}
                  <td style={{ fontWeight: 700, color: "#10b981", direction: "ltr", textAlign: "right" }}>
                    {row.amountIn ? `${curInfo.symbol} ${fmt(row.amountIn)}` : ""}
                  </td>

                  {/* خروج (−) */}
                  <td style={{ fontWeight: 700, color: "var(--danger)", direction: "ltr", textAlign: "right" }}>
                    {row.amountOut ? `${curInfo.symbol} ${fmt(row.amountOut)}` : ""}
                  </td>

                  {/* الباقي */}
                  <td style={{ fontWeight: 800, direction: "ltr", textAlign: "right", color: balanceColor(row.balance) }}>
                    {fmt(row.balance)}
                  </td>

                  {/* Actions */}
                  <td className="no-print">
                    {!row.voidedAt && (
                      <button
                        title="لغوه کول"
                        onClick={() => { setVoidingId(row.id); setVoidReason(""); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--danger)", padding: 4, borderRadius: 4,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Closing / totals row */}
              {page && page.rows.length > 0 && (
                <tr style={{ background: "var(--primary)", fontWeight: 800 }}>
                  <td colSpan={4} style={{ color: "#fff", textAlign: "right", fontSize: 14 }}>
                    ټوټل
                  </td>
                  <td style={{ color: "#fff", direction: "ltr", textAlign: "right", fontSize: 15 }}>
                    {curInfo.symbol} {fmt(page.totalIn)}
                  </td>
                  <td style={{ color: "#fca5a5", direction: "ltr", textAlign: "right", fontSize: 15 }}>
                    {curInfo.symbol} {fmt(page.totalOut)}
                  </td>
                  <td style={{ color: "#fff", direction: "ltr", textAlign: "right", fontSize: 16 }}>
                    {fmt(page.closingBalance)}
                  </td>
                  <td className="no-print" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Void Dialog ── */}
      {voidingId !== null && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setVoidingId(null); }}
        >
          <div className="card" style={{ width: 400, padding: 0 }}>
            <div className="card-header" style={{ color: "var(--danger)" }}>
              ثبت لغوه کول
            </div>
            <div className="card-body">
              <label className="form-label">د لغوي دلیل *</label>
              <input
                className="form-input"
                placeholder="لغوي دلیل ولیکئ..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{ marginBottom: 16 }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setVoidingId(null)}>لغوه</button>
                <button
                  className="btn"
                  style={{ background: "var(--danger)", color: "#fff" }}
                  disabled={!voidReason.trim() || voidMutation.isPending}
                  onClick={() => voidMutation.mutate({ id: voidingId!, reason: voidReason })}
                >
                  لغوه کول
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
