import { useQuery } from "@tanstack/react-query";
import { api, type CompanySettings } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Building2, Coins, UserCircle, Activity } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<CompanySettings>("/settings"),
  });

  const cards = [
    {
      label: "د شرکت نوم",
      value: settings?.companyName ?? "—",
      icon: Building2,
      color: "var(--primary)",
      bg: "var(--primary-light)",
    },
    {
      label: "اصلي پیسه",
      value: settings?.baseCurrencyCode ?? "—",
      icon: Coins,
      color: "var(--success)",
      bg: "var(--success-light)",
    },
    {
      label: "ستاسو رول",
      value: user?.roles.join("، ") ?? "—",
      icon: UserCircle,
      color: "var(--warning)",
      bg: "var(--warning-light)",
    },
    {
      label: "د سیسټم حالت",
      value: "فعال",
      icon: Activity,
      color: "var(--info)",
      bg: "var(--info-light)",
    },
  ];

  return (
    <div>
      <p className="page-title">کورپاڼه</p>
      <p className="page-sub">ښه راغلاست، {user?.fullName} — {settings?.companyName ?? "..."}</p>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            className="card"
            style={{ padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 14 }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <c.icon size={22} color={c.color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder panel */}
      <div
        className="card"
        style={{
          padding: "28px 24px",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 13,
          borderStyle: "dashed",
        }}
      >
        <Activity size={32} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
        د پروژو، پلورنې، کرایې، پیرودنې او نورو مالي ماډیولونو معلومات به دلته وروسته له جوړېدو ښکاره شي.
      </div>
    </div>
  );
}
