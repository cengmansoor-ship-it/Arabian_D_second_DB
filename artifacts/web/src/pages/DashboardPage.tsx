import { useQuery } from "@tanstack/react-query";
import { api, type DashboardSummary } from "../lib/api";
import { Building2, Layers, Home, Users, Wallet, AlertTriangle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  available: "خالي",
  reserved: "ساتل شوی",
  sold: "پلورل شوی",
  rented: "کرایه شوی",
  blocked: "بندیز شوی",
  cancelled: "لغوه شوی",
  inactive: "غیر فعال",
  draft: "پلان",
};

function formatCurrencyMap(map: Record<string, string>): string {
  const entries = Object.entries(map).filter(([, v]) => Number(v) !== 0);
  if (entries.length === 0) return "0";
  return entries.map(([c, v]) => `${Number(v).toLocaleString()} ${c}`).join(" · ");
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/reports/dashboard"),
    refetchInterval: 60_000,
  });

  const cards = data
    ? [
        { label: "ټول بلاکونه", value: String(data.totalBlocks), icon: Building2 },
        { label: "ټولې پوړۍ", value: String(data.totalFloors), icon: Layers },
        { label: "ټولې پروپرتي", value: String(data.totalProperties), icon: Home },
        { label: "ټول پیرودونکي", value: String(data.totalCustomers), icon: Users },
        { label: "فعالې کرایې", value: String(data.activeRentals), icon: Home },
      ]
    : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">کورپاڼه</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>په بارېدو کې...</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
              marginBottom: 28,
            }}
          >
            {cards.map((c) => (
              <div key={c.label} className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: "50%", background: "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <c.icon size={20} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{c.value}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 28 }}>
            <div className="card">
              <div className="card-header"><div>د پروپرتیو حالت</div></div>
              <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 20 }}>
                {Object.entries(data.unitsByStatus).map(([status, count]) => (
                  <div key={status} style={{ minWidth: 100 }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{count}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{STATUS_LABELS[status] ?? status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div>د نن ورځې د حاضرۍ لنډیز</div></div>
              <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 20 }}>
                <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.attendanceToday.present}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>حاضر</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.attendanceToday.absent}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>غیرحاضر</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.attendanceToday.halfDay}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>نیمه ورځ</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.attendanceToday.leave}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>رخصتي</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.attendanceToday.notRecorded}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>نا ثبت شوی</div></div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 28 }}>
            <div className="card">
              <div className="card-header"><div><Wallet size={16} style={{ display: "inline", marginLeft: 6 }} /> د پیسو لنډیز</div></div>
              <div className="card-body" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <Row label="ټولې پلورنې" value={formatCurrencyMap(data.salesTotalsByCurrency)} />
                <Row label="ترلاسه شوي" value={formatCurrencyMap(data.receivedTotalsByCurrency)} />
                <Row label="نوسانتوونکي (پور)" value={formatCurrencyMap(data.outstandingTotalsByCurrency)} />
                <Row label="د نن ورځې راتلونکي" value={formatCurrencyMap(data.todayIncomingByCurrency)} />
                <Row label="د نن ورځې ورکړل شوي" value={formatCurrencyMap(data.todayOutgoingByCurrency)} />
                <Row label="د شرکت اخيستنې (Receivable)" value={formatCurrencyMap(data.companyReceivablesByCurrency)} />
                <Row label="د شرکت ورکړې (Payable)" value={formatCurrencyMap(data.companyPayablesByCurrency)} />
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div>وروستي معاملات</div></div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="fl-table">
                  <tbody>
                    {data.recentTransactions.length === 0 ? (
                      <tr><td style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>هیڅ معامله نشته</td></tr>
                    ) : (
                      data.recentTransactions.map((t) => (
                        <tr key={t.id}>
                          <td style={{ padding: "10px 16px" }}>{t.date}</td>
                          <td style={{ padding: "10px 16px" }}>{t.memo ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {data.alerts.length > 0 ? (
            <div className="card" style={{ padding: 20, borderRight: "4px solid var(--warning, #f59e0b)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 10 }}>
                <AlertTriangle size={18} color="#f59e0b" /> مهمې خبرداری
              </div>
              <ul style={{ margin: 0, paddingRight: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {data.alerts.map((a, i) => (
                  <li key={i} style={{ fontSize: 14, color: "var(--text)" }}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
