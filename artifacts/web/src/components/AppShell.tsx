import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Settings, Users, ShieldCheck, ScrollText,
  LogOut, Building2, Layers, Tags, BookText, Wallet, Contact,
  Menu, X, ChevronLeft,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const navGroups = [
  {
    label: "اصلي مینو",
    items: [
      { to: "/", label: "کورپاڼه", icon: LayoutDashboard, end: true },
      { to: "/projects", label: "پروژې", icon: Layers, end: false },
      { to: "/unit-types", label: "د واحدونو ډولونه", icon: Tags, end: false },
      { to: "/parties", label: "اشخاص / پیرودونکي", icon: Contact, end: false },
    ],
  },
  {
    label: "مالیه",
    adminOnly: true,
    items: [
      { to: "/journal", label: "د لیدلوري ژورنال", icon: BookText, end: false, adminOnly: true },
      { to: "/cash-accounts", label: "د کیش حسابونه", icon: Wallet, end: false, adminOnly: true },
    ],
  },
  {
    label: "اداره",
    items: [
      { to: "/settings", label: "تنظیمات", icon: Settings, end: false },
      { to: "/users", label: "کاروونکي", icon: Users, end: false, adminOnly: true },
      { to: "/roles", label: "رولونه", icon: ShieldCheck, end: false, adminOnly: true },
      { to: "/audit-log", label: "د بدلونونو راپور", icon: ScrollText, end: false, adminOnly: true },
    ],
  },
];

export default function AppShell() {
  const { user, logout, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = hasRole("admin");

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarOpen ? "var(--sidebar-width)" : "0",
          minWidth: sidebarOpen ? "var(--sidebar-width)" : "0",
          background: "var(--sidebar-bg)",
          transition: "width 0.2s ease, min-width 0.2s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--sidebar-border)",
            minWidth: "var(--sidebar-width)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={20} color="#fff" />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.3, whiteSpace: "nowrap" }}>
              اربین ډي
            </div>
            <div style={{ color: "var(--sidebar-muted)", fontSize: 11, whiteSpace: "nowrap" }}>
              د مدیریت سیسټم
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 12px", minWidth: "var(--sidebar-width)" }}>
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    color: "var(--sidebar-muted)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "0 10px",
                    marginBottom: 6,
                  }}
                >
                  {group.label}
                </div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 6,
                      marginBottom: 2,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#fff" : "var(--sidebar-text)",
                      background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                      borderRight: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                      transition: "background 0.15s",
                    })}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      if (!el.style.borderRight.includes("var(--primary)")) {
                        el.style.background = "var(--sidebar-hover-bg)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      if (!el.style.borderRight.includes("var(--primary)")) {
                        el.style.background = "transparent";
                      }
                    }}
                  >
                    <item.icon size={17} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div
          style={{
            borderTop: "1px solid var(--sidebar-border)",
            padding: "12px 16px",
            minWidth: "var(--sidebar-width)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user?.fullName?.[0] ?? "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName}
              </div>
              <div style={{ color: "var(--sidebar-muted)", fontSize: 11 }}>
                {user?.roles.join("، ")}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 10px",
              borderRadius: 5,
              border: "none",
              background: "transparent",
              color: "#FB5454",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            وتل
          </button>
        </div>
      </aside>

      {/* ── Main column ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header
          style={{
            height: "var(--topbar-height)",
            background: "var(--topbar-bg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "transparent",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {user?.fullName?.[0] ?? "A"}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
