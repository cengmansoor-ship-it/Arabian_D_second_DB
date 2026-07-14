import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, type DashboardSummary, type MonthlyTrendsReport } from "../lib/api";
import { Building2, Layers, Home, Users, Wallet, AlertTriangle, ShoppingCart, TrendingUp, ArrowLeftRight } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { isoToJalaliString } from "../lib/jalali";

const CURRENCY_NAMES: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
};

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

const PARTY_TYPE_LABELS: Record<string, string> = {
  supplier: "د اجناسو خرید",
  sales_customer: "د فروش مشتري",
  exchange_dealer: "صرافي",
  individual_customer: "انفرادي",
  market_customer: "بازاري",
  tenant: "کرایه وال",
  employee: "کارکوونکی",
  partner: "شریک",
  other: "نور",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

function formatAmount(v: string | number): string {
  const n = Number(v);
  if (isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatCurrencyMap(map: Record<string, string>): string {
  const entries = Object.entries(map).filter(([, v]) => Number(v) !== 0);
  if (entries.length === 0) return "0";
  return entries
    .map(([c, v]) => `${Number(v).toLocaleString("fa-AF")} ${CURRENCY_NAMES[c] ?? c}`)
    .join(" · ");
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatAmount(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/reports/dashboard"),
    refetchInterval: 60_000,
  });

  const { data: trends } = useQuery({
    queryKey: ["dashboard-trends", "AFN"],
    queryFn: () => api.get<MonthlyTrendsReport>("/reports/monthly-trends?currencyCode=AFN&months=12"),
    refetchInterval: 120_000,
  });

  const cards = data
    ? [
        { label: "ټول بلاکونه", value: String(data.totalBlocks), icon: Building2, link: "/projects" },
        { label: "ټولې پوړۍ", value: String(data.totalFloors), icon: Layers, link: "/projects" },
        { label: "ټولې پروپرتي", value: String(data.totalProperties), icon: Home, link: "/projects" },
        { label: "ټول مشتریان", value: String(data.totalCustomers), icon: Users, link: "/customers" },
        { label: "فعالې کرایې", value: String(data.activeRentals), icon: Home, link: "/rentals" },
      ]
    : [];

  // Prepare pie data for units by status
  const unitsPieData = trends
    ? Object.entries(trends.unitsByStatus)
        .filter(([, v]) => v > 0)
        .map(([status, count]) => ({ name: STATUS_LABELS[status] ?? status, value: count }))
    : [];

  // Prepare pie data for customers by type
  const customersPieData = trends
    ? Object.entries(trends.customersByType)
        .filter(([, v]) => v > 0)
        .map(([type, count]) => ({ name: PARTY_TYPE_LABELS[type] ?? type, value: count }))
    : [];

  // Monthly trend chart data
  const trendData = trends?.months.map((m) => ({
    name: m.label,
    عوائد: Number(m.income),
    مصارف: Number(m.expenses),
    خریداري: Number(m.purchases),
  })) ?? [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">کورپاڼه</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
          په بارېدو کې...
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {cards.map((c) => (
              <button
                key={c.label}
                onClick={() => navigate(c.link)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
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
              </button>
            ))}
          </div>

          {/* Monthly income/expense trend chart */}
          <div className="card" style={{ marginBottom: 28 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>د میاشتنیو عوایدو او مصارفو بهیر (افغانۍ)</div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => navigate("/reports/profit-loss")}
              >
                ګټه-تاوان ←
              </button>
            </div>
            <div className="card-body" style={{ padding: "20px 0 8px" }}>
              {trendData.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>ډیټا شتون نلري</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData} onClick={() => navigate("/roznamcha")} style={{ cursor: "pointer" }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Line type="monotone" dataKey="عوائد" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="مصارف" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="خریداري" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Two charts side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            {/* Units by status — pie chart */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>د پروپرتیو حالت</div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate("/projects")}>پروژې ←</button>
              </div>
              <div className="card-body" style={{ padding: "16px 0" }}>
                {unitsPieData.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ډیټا شتون نلري</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart onClick={() => navigate("/projects")} style={{ cursor: "pointer" }}>
                      <Pie
                        data={unitsPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {unitsPieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Customers by type — bar chart */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>د مشتریانو ډولونه</div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate("/customers")}>مشتریان ←</button>
              </div>
              <div className="card-body" style={{ padding: "16px 0" }}>
                {customersPieData.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>ډیټا شتون نلري</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={customersPieData} onClick={() => navigate("/customers")} style={{ cursor: "pointer" }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <Tooltip />
                      <Bar dataKey="value" name="شمیر" radius={[4, 4, 0, 0]}>
                        {customersPieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Financial summary + recent transactions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div className="card">
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Wallet size={16} color="var(--primary)" /> د پیسو لنډیز
                </div>
              </div>
              <div className="card-body" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <Row label="ټولې پلورنې" value={formatCurrencyMap(data.salesTotalsByCurrency)} />
                <Row label="ترلاسه شوي" value={formatCurrencyMap(data.receivedTotalsByCurrency)} />
                <Row label="د نن ورځ راتلونکي" value={formatCurrencyMap(data.todayIncomingByCurrency)} />
                <Row label="د نن ورځ ورکړل شوي" value={formatCurrencyMap(data.todayOutgoingByCurrency)} />
                <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "4px 0" }} />
                <Row label="طلب (شرکت طلبکار)" value={formatCurrencyMap(data.companyReceivablesByCurrency)} bold />
                <Row label="پور (شرکت پور لري)" value={formatCurrencyMap(data.companyPayablesByCurrency)} bold />
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>وروستي معاملات</div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate("/roznamcha")}>روزنامچه ←</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="fl-table">
                  <tbody>
                    {data.recentTransactions.length === 0 ? (
                      <tr>
                        <td style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>هیڅ معامله نشته</td>
                      </tr>
                    ) : (
                      data.recentTransactions.map((t) => (
                        <tr
                          key={t.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate("/roznamcha")}
                        >
                          <td style={{ padding: "10px 16px", color: "var(--muted)", fontSize: 13 }}>
                            {isoToJalaliString(t.date)}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 13 }}>{t.memo ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Attendance summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>د نن ورځې حاضري</div>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate("/employees")}>کارکوونکي ←</button>
              </div>
              <div className="card-body" style={{ padding: "16px 20px" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={[
                      { name: "حاضر", value: data.attendanceToday.present },
                      { name: "غیرحاضر", value: data.attendanceToday.absent },
                      { name: "نیمه ورځ", value: data.attendanceToday.halfDay },
                      { name: "رخصتي", value: data.attendanceToday.leave },
                      { name: "نا ثبت", value: data.attendanceToday.notRecorded },
                    ]}
                    onClick={() => navigate("/employees")}
                    style={{ cursor: "pointer" }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <Tooltip />
                    <Bar dataKey="value" name="شمیر" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick links to customer types */}
            <div className="card">
              <div className="card-header">د مشتریانو ډولونه — ګړندي لاس رسی</div>
              <div className="card-body" style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "د اجناسو خرید", icon: ShoppingCart, color: "#3b82f6", type: "supplier" },
                  { label: "د فروش مشتریان", icon: TrendingUp, color: "#10b981", type: "sales_customer" },
                  { label: "صرافي مشتریان", icon: ArrowLeftRight, color: "#f59e0b", type: "exchange_dealer" },
                  { label: "بازار / انفرادي", icon: Users, color: "#8b5cf6", type: "individual_customer" },
                ].map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.type}
                      onClick={() => navigate(`/parties?type=${ct.type}`)}
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "12px 10px",
                        cursor: "pointer",
                        textAlign: "right",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 8,
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <Icon size={18} color={ct.color} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{ct.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="card" style={{ padding: 20, borderRight: "4px solid #f59e0b", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 10 }}>
                <AlertTriangle size={18} color="#f59e0b" /> مهمې خبرداری
              </div>
              <ul style={{ margin: 0, paddingRight: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {data.alerts.map((a, i) => (
                  <li key={i} style={{ fontSize: 14, color: "var(--text)" }}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}
