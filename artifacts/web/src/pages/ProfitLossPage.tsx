import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type ProfitLossReport } from "../lib/api";

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const ROWS: { key: keyof ProfitLossReport; label: string; sign?: "pos" | "neg" }[] = [
  { key: "propertySaleIncome", label: "د ملکیت پلور عاید", sign: "pos" },
  { key: "rentalIncome", label: "د کرایې عاید", sign: "pos" },
  { key: "otherIncome", label: "نور عاید", sign: "pos" },
  { key: "totalIncome", label: "ټول عاید", sign: "pos" },
  { key: "purchases", label: "پیرودنې", sign: "neg" },
  { key: "expenses", label: "لګښتونه", sign: "neg" },
  { key: "employeeCosts", label: "د کارکوونکو لګښت", sign: "neg" },
  { key: "totalOutflow", label: "ټول لګښت", sign: "neg" },
  { key: "partnerWithdrawals", label: "د شریکانو وباسل شوي (پانګه، نه د ګټې برخه)" },
  { key: "availableBalance", label: "اوسنی نغدي پاتې" },
];

export default function ProfitLossPage() {
  const [currencyCode, setCurrencyCode] = useState("AFN");
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: report, isFetching } = useQuery({
    queryKey: ["profit-loss", currencyCode, startDate, endDate],
    queryFn: () => api.get<ProfitLossReport>(`/reports/profit-loss?currencyCode=${currencyCode}&startDate=${startDate}&endDate=${endDate}`),
  });

  return (
    <div>
      <p className="page-title" style={{ margin: 0 }}>ګټه او تاوان</p>
      <p className="page-sub">د شرکت د ګټې او تاوان راپور — د اسعارو له مخې جلا</p>

      <div className="card" style={{ padding: 18, margin: "16px 0", display: "flex", gap: 12, alignItems: "end" }}>
        <div>
          <label className="form-label">اسعار</label>
          <select className="form-input" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
            <option value="AFN">AFN</option><option value="USD">USD</option><option value="PKR">PKR</option>
          </select>
        </div>
        <div>
          <label className="form-label">د پیل نېټه</label>
          <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="form-label">د پای نېټه</label>
          <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key}>
                <td style={{ fontWeight: 600 }}>{r.label}</td>
                <td
                  style={{
                    textAlign: "left",
                    color: r.sign === "pos" ? "var(--success)" : r.sign === "neg" ? "var(--danger)" : undefined,
                    fontWeight: 600,
                  }}
                >
                  {report ? report[r.key] : "…"} {currencyCode}
                </td>
              </tr>
            ))}
            {report && (
              <>
                <tr>
                  <td style={{ fontWeight: 700 }}>ګټه</td>
                  <td style={{ textAlign: "left", fontWeight: 700, color: "var(--success)" }}>{report.profit} {currencyCode}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>تاوان</td>
                  <td style={{ textAlign: "left", fontWeight: 700, color: "var(--danger)" }}>{report.loss} {currencyCode}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        {isFetching && <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>د پروسس کولو په حال کې...</div>}
      </div>
    </div>
  );
}
