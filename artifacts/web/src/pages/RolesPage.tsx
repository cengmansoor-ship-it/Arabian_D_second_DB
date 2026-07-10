import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Permission, type RoleWithPermissions } from "../lib/api";
import { ShieldPlus } from "lucide-react";

export default function RolesPage() {
  const qc = useQueryClient();
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<RoleWithPermissions[]>("/roles") });
  const { data: permissions } = useQuery({ queryKey: ["permissions"], queryFn: () => api.get<Permission[]>("/roles/permissions") });

  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const createRoleMutation = useMutation({
    mutationFn: () => api.post("/roles", newRole),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setNewRole({ name: "", description: "" }); },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionKeys }: { roleId: number; permissionKeys: string[] }) =>
      api.put(`/roles/${roleId}/permissions`, { permissionKeys }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  function togglePermission(role: RoleWithPermissions, key: string) {
    const next = role.permissions.includes(key) ? role.permissions.filter((p) => p !== key) : [...role.permissions, key];
    updatePermissionsMutation.mutate({ roleId: role.id, permissionKeys: next });
  }

  return (
    <div>
      <p className="page-title">رولونه او واکونه</p>
      <p className="page-sub">د کاروونکو واکونه اداره کړئ</p>

      {/* Create role */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldPlus size={17} />نوی رول
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: "0 0 160px" }}>
            <label className="form-label">نوم</label>
            <input className="form-input" placeholder="manager" value={newRole.name} onChange={(e) => setNewRole((r) => ({ ...r, name: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">تشریح</label>
            <input className="form-input" placeholder="د رول تشریح" value={newRole.description} onChange={(e) => setNewRole((r) => ({ ...r, description: e.target.value }))} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => createRoleMutation.mutate()} disabled={!newRole.name || createRoleMutation.isPending}>
              جوړول
            </button>
          </div>
        </div>
      </div>

      {/* Roles list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {roles?.map((role) => (
          <div key={role.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{role.name}</div>
                {role.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{role.description}</div>}
              </div>
              <span className="badge badge-muted">{role.permissions.length} واک</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {permissions?.map((p) => {
                const active = role.permissions.includes(p.key);
                return (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 4, border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, background: active ? "var(--primary-light)" : "var(--surface-2)", cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "var(--primary)" : "var(--muted)" }}>
                    <input type="checkbox" checked={active} onChange={() => togglePermission(role, p.key)} style={{ accentColor: "var(--primary)" }} />
                    {p.key}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
