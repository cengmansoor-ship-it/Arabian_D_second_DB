import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Settings, Users, ShieldCheck, ScrollText,
  LogOut, Building2, Layers, Tags, BookText, Wallet, Contact,
  Menu, ChevronRight, Search, Bell, MessageSquare, ChevronDown, ReceiptText,
  KeyRound, Receipt, ShoppingCart, UserRound, ArrowLeftRight, Handshake, TrendingUp
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
      { to: "/sales", label: "پلورنې", icon: ReceiptText, end: false },
      { to: "/rentals", label: "کرایې", icon: KeyRound, end: false },
      { to: "/purchases", label: "پیرودنې", icon: ShoppingCart, end: false },
      { to: "/expenses", label: "لګښتونه", icon: Receipt, end: false },
      { to: "/employees", label: "کارکوونکي", icon: UserRound, end: false },
      { to: "/exchange", label: "صرافي", icon: ArrowLeftRight, end: false },
      { to: "/partners", label: "شریکان", icon: Handshake, end: false },
    ],
  },
  {
    label: "مالیه",
    adminOnly: false,
    items: [
      { to: "/reports/profit-loss", label: "ګټه او تاوان", icon: TrendingUp, end: false },
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
          boxShadow: sidebarOpen ? "1px 0 10px rgba(0,0,0,0.1)" : "none",
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "22px 24px",
            minWidth: "var(--sidebar-width)",
            borderBottom: "1px solid var(--sidebar-border)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={22} color="#fff" />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3, whiteSpace: "nowrap" }}>
              اربین ډي استوګنځای
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "0 16px", minWidth: "var(--sidebar-width)" }}>
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    color: "var(--sidebar-muted)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    padding: "0 12px",
                    marginBottom: 10,
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      style={({ isActive }) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 500,
                        color: isActive ? "#fff" : "var(--sidebar-text)",
                        background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                        transition: "background 0.15s, color 0.15s",
                      })}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        if (el.style.background === "transparent" || el.style.background === "") {
                          el.style.background = "var(--sidebar-hover-bg)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        if (!el.classList.contains("active")) {
                          el.style.background = "transparent";
                        }
                      }}
                      className={({ isActive }) => (isActive ? "active" : "")}
                    >
                      <item.icon size={19} style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          style={{
            padding: "16px",
            minWidth: "var(--sidebar-width)",
            borderTop: "1px solid var(--sidebar-border)",
          }}
        >
          <button
            onClick={() => logout()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--sidebar-text)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--sidebar-hover-bg)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--sidebar-text)";
            }}
          >
            <LogOut size={19} />
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
            padding: "0 32px",
            gap: 24,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            zIndex: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                cursor: "pointer",
                color: "var(--text)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {sidebarOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
            </button>

            <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
              <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)" }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="د لټون لپاره دلته ولیکئ..."
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 9999,
                  background: "var(--surface-2)",
                  border: "none",
                  padding: "0 44px 0 20px",
                  fontSize: 14,
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--surface-2)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={20} />
              <div style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: "50%", background: "var(--danger)", border: "2px solid var(--surface-2)" }} />
            </button>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--surface-2)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <MessageSquare size={20} />
            </button>
            
            <div style={{ width: 1, height: 32, background: "var(--border)", margin: "0 8px" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{user?.fullName}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{user?.roles.join("، ")}</span>
              </div>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                  fontSize: 18,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user?.fullName?.[0] ?? "A"}
              </div>
              <ChevronDown size={16} color="var(--muted)" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
