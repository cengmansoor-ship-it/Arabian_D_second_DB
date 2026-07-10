import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type UnitType } from "../lib/api";
import { Tags, Plus } from "lucide-react";

export default function UnitTypesPage() {
  const qc = useQueryClient();
  const { data: types } = useQuery({ queryKey: ["unit-types"], queryFn: () => api.get<UnitType[]>("/unit-types") });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<UnitType>("/unit-types", { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["unit-types"] }); setName(""); setError(null); },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  return (
    <div>
      <p className="page-title">د واحدونو ډولونه</p>
      <p className="page-sub">د ملکیت واحدونو ډول مالیکانه لیست</p>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} />نوی ډول
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="form-input" placeholder="لکه: Studio، 1-Bedroom، Shop" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && createMutation.mutate()} style={{ flex: 1, maxWidth: 340 }} />
          <button className="btn btn-primary" onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
            <Plus size={15} />زیاتول
          </button>
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Tags size={15} />ثبت شوي ډولونه ({types?.length ?? 0})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {types?.map((t) => (
            <span key={t.id} style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 14, color: "var(--text)" }}>
              {t.name}
            </span>
          ))}
          {types?.length === 0 && <span style={{ color: "var(--muted)", fontSize: 13 }}>هیڅ ډول نشته.</span>}
        </div>
      </div>
    </div>
  );
}
