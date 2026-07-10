import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Settings, Users, ShieldCheck, ScrollText, LogOut, Building2, Layers, Tags, BookText, Wallet, Contact } from "lucide-react";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "کورپاڼه", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "پروژې", icon: Layers, end: false },
  { to: "/unit-types", label: "د واحدونو ډولونه", icon: Tags, end: false },
  { to: "/parties", label: "اشخاص او پیرودونکي", icon: Contact, end: false },
  { to: "/journal", label: "د لیدلوري ژورنال", icon: BookText, end: false, adminOnly: true },
  { to: "/cash-accounts", label: "د کیش حسابونه", icon: Wallet, end: false, adminOnly: true },
  { to: "/settings", label: "تنظیمات", icon: Settings, end: false },
  { to: "/users", label: "کاروونکي", icon: Users, end: false, adminOnly: true },
  { to: "/roles", label: "رولونه", icon: ShieldCheck, end: false, adminOnly: true },
  { to: "/audit-log", label: "د بدلونونو راپور", icon: ScrollText, end: false, adminOnly: true },
];

export default function AppShell() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="flex h-screen w-full bg-[var(--bg)]">
      <aside className="flex w-64 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
          <Building2 className="h-6 w-6 text-[var(--primary)]" />
          <div>
            <div className="text-sm font-bold leading-tight">اربین ډي استوګنځای</div>
            <div className="text-xs text-[var(--muted)]">د مدیریت سیسټم</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => !item.adminOnly || hasRole("admin"))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text)] hover:bg-[var(--bg)]"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <div className="mb-2 px-2 text-sm">
            <div className="font-semibold">{user?.fullName}</div>
            <div className="text-xs text-[var(--muted)]">{user?.roles.join("، ")}</div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            وتل
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
