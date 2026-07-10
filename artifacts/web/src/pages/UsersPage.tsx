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
      <div className="page-header">
        <h1 className="page-title">کاروونکي</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
          <span>/</span>
          <span>کاروونکي</span>
        </div>
      </div>

      {/* Create form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={18} /> نوی کاروونکی
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 20, marginBottom: 20 }}>
            <div><label className="form-label">کارن نوم</label><input className="form-input" placeholder="admin" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
            <div><label className="form-label">بشپړ نوم</label><input className="form-input" placeholder="احمد خان" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
            <div><label className="form-label">پټنوم</label><input className="form-input" type="password" placeholder="لږ تر لږه ۶ توري" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">رولونه</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {roles?.map((r) => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 6, border: `1px solid ${form.roleNames.includes(r.name) ? "var(--primary)" : "var(--border)"}`, background: form.roleNames.includes(r.name) ? "var(--primary-light)" : "transparent", cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={form.roleNames.includes(r.name)} onChange={() => toggleRole(r.name)} style={{ accentColor: "var(--primary)", width: 16, height: 16 }} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          {error && <div style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</div>}
          <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={!form.username || !form.fullName || form.password.length < 6 || createMutation.isPending}>
            {createMutation.isPending ? "..." : "جوړول"}
          </button>
        </div>
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
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>هیڅ کاروونکی ونه موندل شو.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
