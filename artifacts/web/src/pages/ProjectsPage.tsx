import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Project, type ProjectStatus } from "../lib/api";
import { FolderPlus } from "lucide-react";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "مسوده",
  active: "فعال",
  on_hold: "ځنډول شوی",
  completed: "بشپړ شوی",
  archived: "آرشیف شوی",
};

const STATUS_BADGE: Record<ProjectStatus, string> = {
  draft: "badge-muted",
  active: "badge-success",
  on_hold: "badge-warning",
  completed: "badge-info",
  archived: "badge-muted",
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<Project[]>("/projects") });

  const [form, setForm] = useState({ name: "", code: "" });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<Project>("/projects", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setForm({ name: "", code: "" }); setError(null); },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProjectStatus }) => api.put(`/projects/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div>
      <p className="page-title">پروژې</p>
      <p className="page-sub">د ملکیتي پروژو اداره</p>

      {/* Create */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <FolderPlus size={17} />نوې پروژه
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">د پروژې نوم</label>
            <input className="form-input" placeholder="اربین ډي ریزیډنس" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ width: 140 }}>
            <label className="form-label">کوډ</label>
            <input className="form-input" placeholder="ADR" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={!form.name.trim() || !form.code.trim() || createMutation.isPending}>
              جوړول
            </button>
          </div>
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 18 }}>
        {projects?.map((p) => (
          <div key={p.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <Link to={`/projects/${p.id}`} style={{ fontWeight: 700, fontSize: 15, color: "var(--primary)", textDecoration: "none" }}>
                {p.name}
              </Link>
              <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABELS[p.status]}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>کوډ: {p.code}</div>
            {p.description && <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{p.description}</div>}
            <select
              className="form-select"
              value={p.status}
              onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value as ProjectStatus })}
              style={{ fontSize: 13 }}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        ))}
        {projects?.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--muted)", padding: "48px 0", fontSize: 14 }}>
            تر اوسه هیڅ پروژه نشته.
          </div>
        )}
      </div>
    </div>
  );
}
