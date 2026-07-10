import { useQuery } from "@tanstack/react-query";
import { api, type CompanySettings } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Eye, ShoppingCart, ShoppingBag, Users, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const areaData = [
  { name: 'Sep', sales: 40, revenue: 24 },
  { name: 'Oct', sales: 30, revenue: 13 },
  { name: 'Nov', sales: 20, revenue: 98 },
  { name: 'Dec', sales: 27, revenue: 39 },
  { name: 'Jan', sales: 18, revenue: 48 },
  { name: 'Feb', sales: 23, revenue: 38 },
  { name: 'Mar', sales: 34, revenue: 43 },
  { name: 'Apr', sales: 44, revenue: 53 },
  { name: 'May', sales: 55, revenue: 43 },
  { name: 'Jun', sales: 65, revenue: 53 },
  { name: 'Jul', sales: 75, revenue: 63 },
  { name: 'Aug', sales: 85, revenue: 73 },
];

const barData = [
  { name: 'M', sales: 40, revenue: 24 },
  { name: 'T', sales: 30, revenue: 13 },
  { name: 'W', sales: 20, revenue: 98 },
  { name: 'T', sales: 27, revenue: 39 },
  { name: 'F', sales: 18, revenue: 48 },
  { name: 'S', sales: 23, revenue: 38 },
  { name: 'S', sales: 34, revenue: 43 },
];

const pieData = [
  { name: 'Desktop', value: 65 },
  { name: 'Tablet', value: 34 },
  { name: 'Mobile', value: 12 },
  { name: 'Unknown', value: 56 },
];

const COLORS = ['#3C50E0', '#6577F3', '#8FD0EF', '#0FADCF'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<CompanySettings>("/settings"),
  });

  const cards = [
    {
      label: "ټول لیدنې",
      value: "$3.456K",
      icon: Eye,
      color: "var(--primary)",
      bg: "var(--surface-2)",
      trend: "0.43%",
      up: true,
    },
    {
      label: "ټولې ګټې",
      value: "$45.2K",
      icon: ShoppingCart,
      color: "var(--primary)",
      bg: "var(--surface-2)",
      trend: "4.35%",
      up: true,
    },
    {
      label: "ټول محصولات",
      value: "2,450",
      icon: ShoppingBag,
      color: "var(--primary)",
      bg: "var(--surface-2)",
      trend: "2.59%",
      up: true,
    },
    {
      label: "ټول کاروونکي",
      value: "3,456",
      icon: Users,
      color: "var(--primary)",
      bg: "var(--surface-2)",
      trend: "0.95%",
      up: false,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">کورپاڼه</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
          <span>/</span>
          <span>سوداګري</span>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 28,
          marginBottom: 28,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            className="card"
            style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <c.icon size={22} color={c.color} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>{c.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: c.up ? "var(--success)" : "var(--info)", fontSize: 14, fontWeight: 500 }}>
                {c.trend} {c.up ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28, marginBottom: 28 }}>
        <div className="card">
          <div className="card-header">
            <div>عواید</div>
            <div style={{ display: "flex", background: "var(--surface-2)", padding: 4, borderRadius: 6 }}>
              <button style={{ padding: "6px 12px", border: "none", background: "var(--surface)", borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontSize: 13, fontWeight: 500, color: "var(--text)", cursor: "pointer" }}>ورځ</button>
              <button style={{ padding: "6px 12px", border: "none", background: "transparent", fontSize: 13, fontWeight: 500, color: "var(--muted)", cursor: "pointer" }}>اونۍ</button>
              <button style={{ padding: "6px 12px", border: "none", background: "transparent", fontSize: 13, fontWeight: 500, color: "var(--muted)", cursor: "pointer" }}>میاشت</button>
            </div>
          </div>
          <div className="card-body" style={{ height: 350 }}>
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)' }}
                  itemStyle={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="revenue" stroke="var(--info)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>د دې اونۍ ګټه</div>
          </div>
          <div className="card-body" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'var(--surface-2)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)' }}
                />
                <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="revenue" fill="var(--info)" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 28 }}>
        <div className="card">
          <div className="card-header">
            <div>لیدونکي تحلیل</div>
          </div>
          <div className="card-body" style={{ height: 350, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", height: 220 }}>
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: "16px 24px", justifyContent: "center", marginTop: 24 }}>
              {pieData.map((item, i) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS[i] }}></div>
                  {item.name} 
                  <span style={{ color: "var(--text)" }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
           <div className="card-header">
            <div>سیمې نقشه</div>
          </div>
          <div className="card-body" style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--muted)", opacity: 0.6 }}>
               <div style={{ width: 120, height: 120, border: "2px dashed var(--border-dark)", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  د نقشې ځای پرځای کونکی
               </div>
               د نقشې ډیټا به دلته ښکاره شي
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
