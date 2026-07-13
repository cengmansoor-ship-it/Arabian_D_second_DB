import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type GeneralReport, type GeneralReportRow } from "../lib/api";
import PrintHeader from "../components/PrintHeader";
import { exportCsv } from "../lib/exportCsv";
import { Printer, Download } from "lucide-react";

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const SECTIONS: { key: keyof GeneralReport; label: string }[] = [
  { key: "purchasing", label: "١. پیرودنې" },
  { key: "expenses", label: "٢. لګښتونه" },
  { key: "customers", label: "٣. انفرادي او بازار پیرودونکي" },
  { key: "exchange", label: "٤. صرافي" },
  { key: "propertySales", label: "٥. د ملکیت او دوکان پلورنه" },
  { key: "rentals", label: "٦. کرایې" },
  { key: "employees", label: "٧. کارکوونکي" },
];

function RowsTable({ rows, search }: { rows: GeneralReportRow[]; search: string }) {
  const filtered = search.trim()
    ? rows.filter((r) => `${r.reference} ${r.party ?? ""} ${r.note ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    : rows;
  if (filtered.length === 0) {
    return <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>هیڅ ثبت نشته</div>;
  }
  return (
    <table className="fl-table" style={{ fontSize: 13 }}>
      <thead>
        <tr>
          <th>نېټه</th><th>شماره</th><th>شخص</th><th>ترلاسه شوی</th><th>ورکړل شوی</th><th>د شرکت اخيستنه</th><th>د شرکت ورکړه</th><th>یادونه</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((r, i) => (
          <tr key={i}>
            <td>{r.date}</td>
            <td>{r.reference}</td>
            <td>{r.party ?? "—"}</td>
            <td>{r.moneyReceived}</td>
            <td>{r.moneyPaid}</td>
            <td>{r.owedToCompany}</td>
            <td>{r.owedByCompany}</td>
            <td>{r.note ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function GeneralReportPage() {
  const [currencyCode, setCurrencyCode] = useState("AFN");
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [search, setSearch] = useState("");

  const { data: report, isFetching } = useQuery({
    queryKey: ["general-report", currencyCode, startDate, endDate],
    queryFn: () => api.get<GeneralReport>(`/reports/general?currencyCode=${currencyCode}&startDate=${startDate}&endDate=${endDate}`),
  });

  function exportSection(key: keyof GeneralReport, label: string) {
    if (!report) return;
    const rows = report[key] as GeneralReportRow[];
    exportCsv(`${label}-${startDate}-${endDate}`, rows.map((r) => ({
      date: r.date, reference: r.reference, party: r.party ?? "", moneyReceived: r.moneyReceived,
      moneyPaid: r.moneyPaid, owedToCompany: r.owedToCompany, owedByCompany: r.owedByCompany, note: r.note ?? "",
    })));
  }

  return (
    <div>
      <PrintHeader title="د شرکت عمومي راپور" rangeLabel={`${startDate} تر ${endDate} — ${currencyCode}`} />
      <div className="page-header no-print">
        <div>
          <p className="page-title" style={{ margin: 0 }}>عمومي راپور</p>
          <p className="page-sub">پیرودنې، لګښتونه، پیرودونکي، صرافي، پلورنه، کرایه، کارکوونکي او پروژې</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Printer size={16} /> چاپ
        </button>
      </div>

      <div className="card no-print" style={{ padding: 18, margin: "16px 0", display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
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
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">لټون</label>
          <input className="form-input" placeholder="د شخص، شمېره یا یادونې له مخې..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isFetching || !report ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>په بارېدو کې...</div>
      ) : (
        <>
          {SECTIONS.map((s) => (
            <div className="card" key={s.key} style={{ marginBottom: 20, overflow: "auto" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{s.label}</div>
                <button className="btn btn-ghost btn-sm no-print" onClick={() => exportSection(s.key, s.label)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <RowsTable rows={report[s.key] as GeneralReportRow[]} search={search} />
            </div>
          ))}

          <div className="card" style={{ marginBottom: 20, overflow: "auto" }}>
            <div className="card-header"><div>٨. پروژې — د بلاکونو، پوړیو او پروپرتیو جدول</div></div>
            <table className="fl-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>پروژه</th><th>بلاکونه</th><th>پوړۍ</th><th>ټول</th><th>خالي</th><th>ساتل شوی</th><th>پلورل شوی</th><th>کرایه شوی</th><th>نا شتون</th>
                </tr>
              </thead>
              <tbody>
                {report.projects.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--muted)" }}>هیڅ پروژه نشته</td></tr>
                ) : (
                  report.projects.map((p) => (
                    <tr key={p.projectId}>
                      <td>{p.projectName}</td>
                      <td>{p.blocks}</td>
                      <td>{p.floors}</td>
                      <td>{p.totalProperties}</td>
                      <td>{p.available}</td>
                      <td>{p.reserved}</td>
                      <td>{p.sold}</td>
                      <td>{p.rented}</td>
                      <td>{p.unavailable}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
