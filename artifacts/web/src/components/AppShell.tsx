import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Settings, Users, ShieldCheck, ScrollText,
  LogOut, Building2, BookText, Contact, Menu, Search, Bell,
  ChevronDown, ChevronLeft, BookOpen, Receipt, Handshake,
  BarChart3, Layers, Store,
} from "lucide-react";
import { useAuth } from "../lib/auth";

// ── Sidebar item types ────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Direct link — no sub-items */
  to?: string;
  end?: boolean;
  adminOnly?: boolean;
  /** Sub-menu items */
  children?: NavItem[];
}

// ── Nav definition ────────────────────────────────────────────────────────────

const NAV: NavGroup[] = [
  {
    id: "dashboard",
    label: "ډشبورډ",
    icon: LayoutDashboard,
    to: "/",
    end: true,
  },
  {
    id: "roznamcha",
    label: "روزنامچه",
    icon: BookOpen,
    to: "/roznamcha",
  },
  {
    id: "customers",
    label: "مشتریان",
    icon: Contact,
    to: "/customers",
  },
  {
    id: "projects",
    label: "پروژه",
    icon: Layers,
    children: [
      { to: "/projects", label: "پروژه", icon: Building2 },
      { to: "/shops", label: "دوکانونه", icon: Store },
    ],
  },
  {
    id: "expenses",
    label: "مصارفات",
    icon: Receipt,
    to: "/expenses",
  },
  {
    id: "partners",
    label: "شریکان",
    icon: Handshake,
    to: "/partners",
  },
  {
    id: "general-report",
    label: "عمومي راپور",
    icon: BarChart3,
    to: "/reports/general",
  },
  {
    id: "settings",
    label: "تنظیمات",
    icon: Settings,
    children: [
      { to: "/settings", label: "د سیستم تنظیمات", icon: Settings },
      { to: "/users", label: "کاروونکي", icon: Users, adminOnly: true },
      { to: "/roles", label: "رولونه", icon: ShieldCheck, adminOnly: true },
      { to: "/audit-log", label: "د بدلونونو راپور", icon: ScrollText, adminOnly: true },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppShell() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["settings"]));

  const isAdmin = hasRole("admin");

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
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
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "right",
  });

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className="no-print"
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
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Building2 size={22} color="#fff" />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.3, whiteSpace: "nowrap" }}>
              اربین ډي استوګنځای
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 16px", minWidth: "var(--sidebar-width)" }}>
          {NAV.map((group) => {
            if (group.adminOnly && !isAdmin) return null;

            // Simple direct link
            if (group.to) {
              return (
                <NavLink
                  key={group.id}
                  to={group.to}
                  end={group.end}
                  style={({ isActive }) => ({ ...navLinkStyle(isActive), marginBottom: 2 })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains("active"))
                      e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains("active"))
                      e.currentTarget.style.background = "transparent";
                  }}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <group.icon size={19} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", flex: 1 }}>{group.label}</span>
                </NavLink>
              );
            }

            // Expandable group
            const isOpen = openGroups.has(group.id);
            const visibleChildren = (group.children ?? []).filter((c) => !c.adminOnly || isAdmin);
            if (visibleChildren.length === 0) return null;

            return (
              <div key={group.id} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    ...navLinkStyle(false),
                    justifyContent: "flex-start",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover-bg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <group.icon size={19} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", flex: 1 }}>{group.label}</span>
                  <span style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(-90deg)" : "rotate(0)" }}>
                    <ChevronLeft size={15} color="var(--sidebar-muted)" />
                  </span>
                </button>

                {/* Children */}
                <div
                  style={{
                    maxHeight: isOpen ? `${visibleChildren.length * 48}px` : "0",
                    overflow: "hidden",
                    transition: "max-height 0.2s ease",
                    paddingRight: 12,
                  }}
                >
                  {visibleChildren.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.end}
                      style={({ isActive }) => ({
                        ...navLinkStyle(isActive),
                        fontSize: 13,
                        paddingRight: 16,
                        marginTop: 2,
                      })}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.classList.contains("active"))
                          e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.classList.contains("active"))
                          e.currentTarget.style.background = "transparent";
                      }}
                      className={({ isActive }) => (isActive ? "active" : "")}
                    >
                      <child.icon size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span style={{ whiteSpace: "nowrap" }}>{child.label}</span>
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
              ...navLinkStyle(false),
              gap: 12, width: "100%", justifyContent: "flex-start",
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
          className="no-print"
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
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40, borderRadius: "50%",
                border: "1px solid var(--border)", background: "var(--surface)",
                cursor: "pointer", color: "var(--text)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <Menu size={20} />
            </button>

            <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
              <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)" }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="د لټون لپاره دلته ولیکئ..."
                style={{
                  width: "100%", height: 44, borderRadius: 9999,
                  background: "var(--surface-2)", border: "none",
                  padding: "0 44px 0 20px", fontSize: 14, color: "var(--text)", outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "var(--surface-2)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--muted)", cursor: "pointer", position: "relative",
              }}
            >
              <Bell size={20} />
              <div style={{
                position: "absolute", top: 10, right: 10,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--danger)", border: "2px solid var(--surface-2)",
              }} />
            </button>

            <div style={{ width: 1, height: 32, background: "var(--border)", margin: "0 8px" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{user?.fullName}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{user?.roles.join("، ")}</span>
              </div>
              <div
                style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: "var(--primary-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--primary)", fontSize: 18, fontWeight: 700, flexShrink: 0,
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
