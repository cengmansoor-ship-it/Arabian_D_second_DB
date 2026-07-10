import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ManagedUser, type RoleWithPermissions } from "../lib/api";

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => api.get<ManagedUser[]>("/users") });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<RoleWithPermissions[]>("/roles") });

  const [form, setForm] = useState({ username: "", fullName: "", password: "", roleNames: [] as string[] });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<ManagedUser>("/users", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm({ username: "", fullName: "", password: "", roleNames: [] });
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api.put(`/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      roleNames: f.roleNames.includes(role) ? f.roleNames.filter((r) => r !== role) : [...f.roleNames, role],
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">کاروونکي</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">نوی کاروونکی</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            placeholder="کارن نوم"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            placeholder="بشپړ نوم"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            placeholder="پټنوم (لږ تر لږه ۶ توري)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles?.map((r) => (
            <label key={r.id} className="flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs">
              <input type="checkbox" checked={form.roleNames.includes(r.name)} onChange={() => toggleRole(r.name)} />
              {r.name}
            </label>
          ))}
        </div>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
        <button
          onClick={() => createMutation.mutate()}
          disabled={!form.username || !form.fullName || form.password.length < 6 || createMutation.isPending}
          className="mt-3 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-60"
        >
          جوړول
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] text-right">
            <tr>
              <th className="px-4 py-2">کارن نوم</th>
              <th className="px-4 py-2">بشپړ نوم</th>
              <th className="px-4 py-2">رولونه</th>
              <th className="px-4 py-2">حالت</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.fullName}</td>
                <td className="px-4 py-2">{u.roles.join("، ")}</td>
                <td className="px-4 py-2">
                  <span className={u.isActive ? "text-[var(--primary)]" : "text-[var(--danger)]"}>
                    {u.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })}
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    {u.isActive ? "غیرفعالول" : "فعالول"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
