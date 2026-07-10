import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ManagedUser, type RoleWithPermissions } from "../lib/api";
import { UserPlus } from "lucide-react";

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => api.get<ManagedUser[]>("/users") });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<RoleWithPermissions[]>("/roles") });

  const [form, setForm] = useState({ username: "", fullName: "", password: "", roleNames: [] as string[] });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<ManagedUser>("/users", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setForm({ username: "", fullName: "", password: "", roleNames: [] }); setError(null); },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api.put(`/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  function toggleRole(role: string) {
    setForm((f) => ({ ...f, roleNames: f.roleNames.includes(role) ? f.roleNames.filter((r) => r !== role) : [...f.roleNames, role] }));
  }

  return (
    <div>
      <p className="page-title">کاروونکي</p>
      <p className="page-sub">د سیسټم کاروونکو اداره</p>

      {/* Create form */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <UserPlus size={17} />نوی کاروونکی
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
          <div><label className="form-label">کارن نوم</label><input className="form-input" placeholder="admin" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
          <div><label className="form-label">بشپړ نوم</label><input className="form-input" placeholder="احمد خان" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
          <div><label className="form-label">پټنوم</label><input className="form-input" type="password" placeholder="لږ تر لږه ۶ توري" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {roles?.map((r) => (
            <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 4, border: `1px solid ${form.roleNames.includes(r.name) ? "var(--primary)" : "var(--border)"}`, background: form.roleNames.includes(r.name) ? "var(--primary-light)" : "transparent", cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={form.roleNames.includes(r.name)} onChange={() => toggleRole(r.name)} style={{ accentColor: "var(--primary)" }} />
              {r.name}
            </label>
          ))}
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={!form.username || !form.fullName || form.password.length < 6 || createMutation.isPending}>
          {createMutation.isPending ? "..." : "جوړول"}
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="fl-table">
          <thead>
            <tr>
              <th>کارن نوم</th><th>بشپړ نوم</th><th>رولونه</th><th>حالت</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.username}</td>
                <td>{u.fullName}</td>
                <td>{u.roles.join("، ")}</td>
                <td>
                  <span className={`badge ${u.isActive ? "badge-success" : "badge-danger"}`}>
                    {u.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })}>
                    {u.isActive ? "غیرفعالول" : "فعالول"}
                  </button>
                </td>
              </tr>
            ))}
            {users?.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>هیڅ کاروونکی ونه موندل شو.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
