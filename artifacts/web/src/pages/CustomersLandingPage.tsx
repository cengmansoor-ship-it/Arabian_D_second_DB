import { useNavigate } from "react-router-dom";
import { ShoppingCart, TrendingUp, ArrowLeftRight, Users } from "lucide-react";

const customerTypes = [
  {
    type: "supplier",
    label: "د اجناسو خرید مشتریان",
    sublabel: "تعمیراتي مواد، سیخ، سیمنټ، جغل...",
    icon: ShoppingCart,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
  },
  {
    type: "sales_customer",
    label: "د فروش مشتریان",
    sublabel: "د کورونو او واحدونو پیرودونکي",
    icon: TrendingUp,
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
  {
    type: "exchange_dealer",
    label: "صرافي مشتریان",
    sublabel: "صرافان او د پیسو لیږد",
    icon: ArrowLeftRight,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  {
    type: "individual_customer",
    label: "بازار / انفرادي مشتریان",
    sublabel: "موقتي کاروبار، غالب کار، ماشینري...",
    icon: Users,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
  },
];

export default function CustomersLandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header no-print">
        <h1 className="page-title">د مشتریانو برخه</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span><span>/</span><span>مشتریان</span>
        </div>
      </div>

      <p style={{ color: "var(--muted)", marginBottom: 32, fontSize: 15 }}>
        د لاندې بکسونو یوه ډول وټاکئ ترڅو د هغه مشتریانو کهاته ته لاس رسی پیدا کړئ
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        {customerTypes.map((ct) => {
          const Icon = ct.icon;
          return (
            <button
              key={ct.type}
              onClick={() => navigate(`/parties?type=${ct.type}`)}
              style={{
                background: "var(--surface)",
                border: `1.5px solid ${ct.border}`,
                borderRadius: 16,
                padding: "32px 24px",
                cursor: "pointer",
                textAlign: "right",
                transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 8px 32px ${ct.border}`;
                e.currentTarget.style.background = ct.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: ct.bg,
                  border: `1.5px solid ${ct.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={26} color={ct.color} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  {ct.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                  {ct.sublabel}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: ct.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                کهاته وګورئ ←
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
