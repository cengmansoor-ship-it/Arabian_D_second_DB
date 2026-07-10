import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type UnitType } from "../lib/api";

export default function UnitTypesPage() {
  const qc = useQueryClient();
  const { data: types } = useQuery({ queryKey: ["unit-types"], queryFn: () => api.get<UnitType[]>("/unit-types") });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<UnitType>("/unit-types", { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-types"] });
      setName("");
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">د واحدونو ډولونه</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex gap-3">
          <input
            placeholder="نوی ډول (لکه Studio)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            زیاتول
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {types?.map((t) => (
          <span key={t.id} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm">
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}
