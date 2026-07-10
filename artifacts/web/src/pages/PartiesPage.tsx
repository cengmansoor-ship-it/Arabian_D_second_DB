import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Party, type PartyType } from "../lib/api";

const TYPE_LABELS: Record<PartyType, string> = {
  individual_customer: "انفرادي پیرودونکی",
  market_customer: "بازار پیرودونکی",
  supplier: "عرضه کوونکی",
  sales_customer: "د پلورنې پیرودونکی",
  tenant: "کرایه‌دار",
  exchange_dealer: "صرافی",
  employee: "کارمند",
  partner: "شریک/پانګه‌وال",
  other: "نور",
};

function emptyForm() {
  return {
    type: "sales_customer" as PartyType,
    name: "",
    fatherName: "",
    grandfatherName: "",
    tazkiraNumber: "",
    taxRegNumber: "",
    phone1: "",
    phone2: "",
    address: "",
    notes: "",
  };
}

export default function PartiesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data: parties } = useQuery({
    queryKey: ["parties", q, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (typeFilter) params.set("type", typeFilter);
      const qs = params.toString();
      return api.get<Party[]>(`/parties${qs ? `?${qs}` : ""}`);
    },
  });

  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Party[]>([]);

  const checkDuplicates = async (name: string) => {
    if (!name.trim()) {
      setDuplicates([]);
      return;
    }
    const params = new URLSearchParams({ name: name.trim() });
    const matches = await api.get<Party[]>(`/parties/duplicate-check?${params.toString()}`);
    setDuplicates(matches);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Party>("/parties", {
        ...form,
        fatherName: form.fatherName || null,
        grandfatherName: form.grandfatherName || null,
        tazkiraNumber: form.tazkiraNumber || null,
        taxRegNumber: form.taxRegNumber || null,
        phone1: form.phone1 || null,
        phone2: form.phone2 || null,
        address: form.address || null,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties"] });
      setForm(emptyForm());
      setDuplicates([]);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "ستونزه رامنځته شوه"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">اشخاص او پیرودونکي</h1>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">نوی شخص</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PartyType }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            placeholder="نوم"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={(e) => checkDuplicates(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="د پلار نوم"
            value={form.fatherName}
            onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="د نیکه نوم"
            value={form.grandfatherName}
            onChange={(e) => setForm((f) => ({ ...f, grandfatherName: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="تذکره شمېره"
            value={form.tazkiraNumber}
            onChange={(e) => setForm((f) => ({ ...f, tazkiraNumber: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="د مالیې/راجستر شمېره"
            value={form.taxRegNumber}
            onChange={(e) => setForm((f) => ({ ...f, taxRegNumber: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="تلیفون ۱"
            value={form.phone1}
            onChange={(e) => setForm((f) => ({ ...f, phone1: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="تلیفون ۲"
            value={form.phone2}
            onChange={(e) => setForm((f) => ({ ...f, phone2: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder="آدرس"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none sm:col-span-3"
          />
          <textarea
            placeholder="یادداشتونه"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none sm:col-span-3"
          />
        </div>

        {duplicates.length > 0 && (
          <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            ⚠ ورته اشخاص وموندل شول: {duplicates.map((d) => d.name).join("، ")}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

        <button
          onClick={() => createMutation.mutate()}
          disabled={!form.name.trim() || createMutation.isPending}
          className="mt-3 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          جوړول
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="لټون (نوم، تذکره، تلیفون)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
        >
          <option value="">ټول ډولونه</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] text-right">
            <tr>
              <th className="px-4 py-2">نوم</th>
              <th className="px-4 py-2">ډول</th>
              <th className="px-4 py-2">تذکره</th>
              <th className="px-4 py-2">تلیفون</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {parties?.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2">{TYPE_LABELS[p.type]}</td>
                <td className="px-4 py-2">{p.tazkiraNumber ?? "—"}</td>
                <td className="px-4 py-2">{p.phone1 ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link to={`/parties/${p.id}`} className="text-[var(--primary)] hover:underline">
                    لیدل
                  </Link>
                </td>
              </tr>
            ))}
            {parties?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                  هیڅ شخص ونه موندل شو.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
