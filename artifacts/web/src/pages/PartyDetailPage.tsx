import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Party, type PartyLedgerResponse, type PartyType } from "../lib/api";
import { ArrowRight, Edit2, Save, X, Printer, Plus } from "lucide-react";
import PrintHeader from "../components/PrintHeader";
import JalaliDateInput from "../components/JalaliDateInput";
import { isoToJalaliString, todayIso } from "../lib/jalali";
import Decimal from "decimal.js";

const TYPE_LABELS: Record<PartyType, string> = {
  individual_customer: "انفرادي مشتري",
  market_customer: "بازاري مشتري",
  supplier: "عرضه کوونکی",
  sales_customer: "د پلورنې مشتري",
  tenant: "کرایه‌دار",
  exchange_dealer: "صراف",
  employee: "کارمند",
  partner: "شریک/پانګه‌وال",
  other: "نور",
};

const CURRENCY_NAMES: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value ?? "—"}</span>
    </div>
  );
}

interface LedgerEntryForm {
  date: string;
  description: string;
  amount: string;
  currencyCode: string;
  direction: "debit" | "credit";
}

function emptyEntryForm(): LedgerEntryForm {
  return { date: todayIso(), description: "", amount: "", currencyCode: "AFN", direction: "debit" };
}

export default function PartyDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: party } = useQuery({ queryKey: ["party", id], queryFn: () => api.get<Party>(`/parties/${id}`) });

  // Ledger filter state
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerCurrency, setLedgerCurrency] = useState("");
  const [ledgerApplied, setLedgerApplied] = useState({ startDate: "", endDate: "", q: "", currency: "" });

  const handleLedgerSearch = () => setLedgerApplied({ startDate: ledgerStartDate, endDate: ledgerEndDate, q: ledgerQ, currency: ledgerCurrency });
  const handleLedgerClear = () => {
    setLedgerStartDate(""); setLedgerEndDate(""); setLedgerQ(""); setLedgerCurrency("");
    setLedgerApplied({ startDate: "", endDate: "", q: "", currency: "" });
  };

  const { data: ledger } = useQuery({
    queryKey: ["party-ledger", id, ledgerApplied],
    queryFn: () => {
      const p = new URLSearchParams();
      if (ledgerApplied.currency) p.set("currency", ledgerApplied.currency);
      if (ledgerApplied.startDate) p.set("startDate", ledgerApplied.startDate);
      if (ledgerApplied.endDate) p.set("endDate", ledgerApplied.endDate);
      if (ledgerApplied.q) p.set("q", ledgerApplied.q);
      return api.get<PartyLedgerResponse>(`/parties/${id}/ledger?${p}`);
    },
  });

  const [editForm, setEditForm] = useState<Partial<Party> | null>(null);
  const updateMutation = useMutation({
    mutationFn: () => api.put(`/parties/${id}`, editForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["party", id] }); setEditForm(null); },
  });

  if (!party) return null;

  // Compute running balance per currency for the ledger table
  // شمیره، تاریخ، تفصیل، پیسي، رسید، الباقی حساب
  const runningBalances: Record<string, Decimal> = {};
  const linesWithBalance = (ledger?.lines ?? []).map((l) => {
    const cur = l.currencyCode;
    if (!runningBalances[cur]) runningBalances[cur] = new Decimal(0);
    const amt = new Decimal(l.amount ?? "0");
    if (l.direction === "debit") {
      runningBalances[cur] = runningBalances[cur].plus(amt);
    } else {
      runningBalances[cur] = runningBalances[cur].minus(amt);
    }
    return { ...l, runningBalance: runningBalances[cur].toString() };
  });

  // Summary totals
  const balanceSummary = ledger?.balances ?? {};
  const totalDebit: Record<string, string> = {};
  const totalCredit: Record<string, string> = {};
  const totalNet: Record<string, string> = {};
  for (const [code, b] of Object.entries(balanceSummary)) {
    totalDebit[code] = b.debit;
    totalCredit[code] = b.credit;
    totalNet[code] = b.net;
  }

  return (
    <div>
      <PrintHeader title={`د حساب کهاته — ${party.name}`} />
      <div className="no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Link to="/parties" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
            مشتریان <ArrowRight size={13} />
          </Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <span style={{ fontSize: 13 }}>{party.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <p className="page-title" style={{ margin: 0 }}>{party.name}</p>
            <span className="badge badge-muted">{TYPE_LABELS[party.type]}</span>
          </div>
          <button className="btn btn-outline" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={16} /> چاپ
          </button>
        </div>
        <p className="page-sub">د مشتري معلومات او د حساب کهاته</p>
      </div>

      {/* Info card */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>معلومات</div>
          {!editForm && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditForm({})}>
              <Edit2 size={13} /> سمول
            </button>
          )}
        </div>

        {editForm ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
              {(
                [
                  { key: "name",      label: "نوم",          get: (p: Party) => p.name },
                  { key: "fatherName",label: "د پلار نوم",   get: (p: Party) => p.fatherName ?? "" },
                  { key: "phone1",    label: "موبایل شمیره", get: (p: Party) => p.phone1 ?? "" },
                  { key: "phone2",    label: "تلیفون ۲",     get: (p: Party) => p.phone2 ?? "" },
                ] as { key: keyof Party; label: string; get: (p: Party) => string }[]
              ).map(({ key, label, get }) => (
                <div key={String(key)}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" value={(editForm?.[key] as string | undefined) ?? get(party)} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">آدرس</label>
                <input className="form-input" value={editForm.address ?? party.address ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Save size={14} /> ساتل</button>
              <button className="btn btn-outline" onClick={() => setEditForm(null)}><X size={14} /> لغوه</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
            <InfoRow label="ای‌ډي" value={String(party.id)} />
            <InfoRow label="نوم" value={party.name} />
            <InfoRow label="د پلار نوم" value={party.fatherName} />
            <InfoRow label="د نیکه نوم" value={party.grandfatherName} />
            <InfoRow label="تذکره شمېره" value={party.tazkiraNumber} />
            <InfoRow label="د مالیې شمېره" value={party.taxRegNumber} />
            <InfoRow label="موبایل شمیره" value={party.phone1} />
            <InfoRow label="تلیفون ۲" value={party.phone2} />
            <div style={{ gridColumn: "1/-1" }}>
              <InfoRow label="آدرس" value={party.address} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <InfoRow label="یادداشتونه" value={party.notes} />
            </div>
          </div>
        )}
      </div>

      {/* Ledger filters */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }} id="ledger-section">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          د حساب کهاته
        </div>

        {/* Date range filter */}
        <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>د شروع نیټه</label>
            <JalaliDateInput value={ledgerStartDate} onChange={setLedgerStartDate} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>د ختم نیټه</label>
            <JalaliDateInput value={ledgerEndDate} onChange={setLedgerEndDate} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>اسعار</label>
            <select className="form-select" value={ledgerCurrency} onChange={(e) => setLedgerCurrency(e.target.value)} style={{ minWidth: 120 }}>
              <option value="">ټول</option>
              <option value="AFN">افغانۍ</option>
              <option value="USD">ډالر</option>
              <option value="PKR">کلدار</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>لټون</label>
            <input className="form-input" placeholder="تفصیل لټون..." value={ledgerQ} onChange={(e) => setLedgerQ(e.target.value)} style={{ minWidth: 160 }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleLedgerSearch}>لټون</button>
            <button className="btn btn-outline btn-sm" onClick={handleLedgerClear}>پاک کول</button>
          </div>
        </div>

        {/* Ledger table — columns: شمیره، تاریخ، تفصیل، پیسي، رسید، الباقی حساب */}
        <div style={{ overflow: "auto" }}>
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>شمیره</th>
                <th>تاریخ</th>
                <th>تفصیل</th>
                <th style={{ color: "var(--danger)" }}>پیسي (طلب)</th>
                <th style={{ color: "var(--success)" }}>رسید (پور)</th>
                <th>اسعار</th>
                <th>الباقی حساب</th>
              </tr>
            </thead>
            <tbody>
              {linesWithBalance.map((l, idx) => {
                const isDebit = l.direction === "debit";
                const bal = new Decimal(l.runningBalance);
                return (
                  <tr key={l.id}>
                    <td style={{ color: "var(--muted)" }}>{idx + 1}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{isoToJalaliString(l.transaction?.transactionDate)}</td>
                    <td>{l.description ?? l.transaction?.memo ?? "—"}</td>
                    <td style={{ color: "var(--danger)", fontWeight: 500 }}>{isDebit ? l.amount : ""}</td>
                    <td style={{ color: "var(--success)", fontWeight: 500 }}>{!isDebit ? l.amount : ""}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{CURRENCY_NAMES[l.currencyCode] ?? l.currencyCode}</td>
                    <td style={{ fontWeight: 600, color: bal.gt(0) ? "var(--danger)" : bal.lt(0) ? "var(--success)" : "var(--muted)" }}>
                      {bal.abs().toString()}
                    </td>
                  </tr>
                );
              })}
              {linesWithBalance.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>هیڅ ثبت ونه موندل شو.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary block: ټول طلب، ټول پور، خالص الباقی */}
        {Object.keys(balanceSummary).length > 0 && (
          <div style={{ marginTop: 24, borderTop: "2px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>د حساب لنډیز</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {Object.entries(balanceSummary).map(([code, b]) => {
                const net = new Decimal(b.net);
                const curName = CURRENCY_NAMES[code] ?? code;
                return (
                  <div key={code} style={{ minWidth: 220, padding: "14px 18px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>{curName}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>ټول طلب</div>
                        <div style={{ fontWeight: 600, color: "var(--danger)" }}>{b.debit}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>ټول رسید</div>
                        <div style={{ fontWeight: 600, color: "var(--success)" }}>{b.credit}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>خالص الباقی</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: net.gt(0) ? "var(--danger)" : net.lt(0) ? "var(--success)" : "var(--muted)" }}>
                        {net.gt(0) ? `پور: ${net.toString()}` : net.lt(0) ? `طلب: ${net.abs().toString()}` : "متوازن"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
