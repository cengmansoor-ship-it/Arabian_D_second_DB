import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Project, type ProjectStatus } from "../lib/api";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "مسوده",
  active: "فعال",
  on_hold: "ځنډول شوی",
  completed: "بشپړ شوی",
  archived: "آرشیف شوی",
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<Project[]>("/projects") });

  const [form, setForm] = useState({ name: "", code: "" });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<Project>("/projects", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setForm({ name: "", code: "" });
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProjectStatus }) => api.put(`/projects/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">پروژې</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">نوې پروژه</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            placeholder="د پروژې نوم"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            placeholder="کوډ (لکه ADR)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
        <button
          onClick={() => createMutation.mutate()}
          disabled={!form.name.trim() || !form.code.trim() || createMutation.isPending}
          className="mt-3 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-60"
        >
          جوړول
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-2 flex items-center justify-between">
              <Link to={`/projects/${p.id}`} className="font-semibold text-[var(--primary)] hover:underline">
                {p.name}
              </Link>
              <span className="text-xs text-[var(--muted)]">{p.code}</span>
            </div>
            {p.description && <p className="mb-3 text-sm text-[var(--muted)]">{p.description}</p>}
            <select
              value={p.status}
              onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value as ProjectStatus })}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {projects?.length === 0 && <p className="text-sm text-[var(--muted)]">تر اوسه هیڅ پروژه نشته.</p>}
      </div>
    </div>
  );
}
