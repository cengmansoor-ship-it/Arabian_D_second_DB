import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Permission, type RoleWithPermissions } from "../lib/api";

export default function RolesPage() {
  const qc = useQueryClient();
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<RoleWithPermissions[]>("/roles") });
  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get<Permission[]>("/roles/permissions"),
  });

  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const createRoleMutation = useMutation({
    mutationFn: () => api.post("/roles", newRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setNewRole({ name: "", description: "" });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionKeys }: { roleId: number; permissionKeys: string[] }) =>
      api.put(`/roles/${roleId}/permissions`, { permissionKeys }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  function togglePermission(role: RoleWithPermissions, key: string) {
    const next = role.permissions.includes(key)
      ? role.permissions.filter((p) => p !== key)
      : [...role.permissions, key];
    updatePermissionsMutation.mutate({ roleId: role.id, permissionKeys: next });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">رولونه او واکونه</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">نوی رول</h2>
        <div className="flex gap-2">
          <input
            placeholder="نوم"
            value={newRole.name}
            onChange={(e) => setNewRole((r) => ({ ...r, name: e.target.value }))}
            className="w-40 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            placeholder="تشریح"
            value={newRole.description}
            onChange={(e) => setNewRole((r) => ({ ...r, description: e.target.value }))}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={() => createRoleMutation.mutate()}
            disabled={!newRole.name || createRoleMutation.isPending}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-60"
          >
            جوړول
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {roles?.map((role) => (
          <div key={role.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{role.name}</div>
                {role.description && <div className="text-xs text-[var(--muted)]">{role.description}</div>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {permissions?.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={role.permissions.includes(p.key)}
                    onChange={() => togglePermission(role, p.key)}
                  />
                  {p.key}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
