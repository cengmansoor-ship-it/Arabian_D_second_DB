import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Party, type PartyLedgerResponse, type PartyType } from "../lib/api";

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

export default function PartyDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: party } = useQuery({ queryKey: ["party", id], queryFn: () => api.get<Party>(`/parties/${id}`) });
  const { data: ledger } = useQuery({
    queryKey: ["party-ledger", id],
    queryFn: () => api.get<PartyLedgerResponse>(`/parties/${id}/ledger`),
  });

  const [editForm, setEditForm] = useState<Partial<Party> | null>(null);
  const updateMutation = useMutation({
    mutationFn: () => api.put(`/parties/${id}`, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["party", id] });
      setEditForm(null);
    },
  });

  if (!party) return null;
  const showDebtWarning = Object.values(ledger?.balances ?? {}).some((b) => Number(b.net) > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{party.name}</h1>
        <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs">{TYPE_LABELS[party.type]}</span>
      </div>

      {showDebtWarning && (
        <div className="animate-pulse rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm font-semibold text-yellow-800">
          ⚠ دا شخص پور (طلب) لري — لاندې پاتې حسابونه وګورئ.
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-semibold">معلومات</h2>
        {editForm ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              placeholder="نوم"
              value={editForm.name ?? party.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
            />
            <input
              placeholder="تلیفون ۱"
              value={editForm.phone1 ?? party.phone1 ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, phone1: e.target.value }))}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
            />
            <input
              placeholder="تلیفون ۲"
              value={editForm.phone2 ?? party.phone2 ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, phone2: e.target.value }))}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
            />
            <input
              placeholder="آدرس"
              value={editForm.address ?? party.address ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none sm:col-span-3"
            />
            <div className="flex gap-2 sm:col-span-3">
              <button
                onClick={() => updateMutation.mutate()}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                ساتل
              </button>
              <button onClick={() => setEditForm(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">
                لغوه کول
              </button>
            </div>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted)]">د پلار نوم</dt>
                <dd>{party.fatherName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">د نیکه نوم</dt>
                <dd>{party.grandfatherName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">تذکره</dt>
                <dd>{party.tazkiraNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">د مالیې شمېره</dt>
                <dd>{party.taxRegNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">تلیفون ۱</dt>
                <dd>{party.phone1 ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">تلیفون ۲</dt>
                <dd>{party.phone2 ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted)]">آدرس</dt>
                <dd>{party.address ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted)]">یادداشتونه</dt>
                <dd>{party.notes ?? "—"}</dd>
              </div>
            </dl>
            <button onClick={() => setEditForm({})} className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline">
              سمول
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-semibold">د حساب کتاب (لیجر)</h2>
        <div className="mb-4 flex flex-wrap gap-4">
          {Object.entries(ledger?.balances ?? {}).map(([code, b]) => (
            <div key={code} className="rounded-lg bg-[var(--bg)] px-4 py-2 text-sm">
              <span className="font-semibold">{code}</span>{" "}
              <span className={Number(b.net) > 0 ? "text-[var(--danger)]" : "text-green-700"}>
                {Number(b.net) > 0 ? `پور: ${b.net}` : Number(b.net) < 0 ? `طلب: ${Math.abs(Number(b.net))}` : "متوازن"}
              </span>
            </div>
          ))}
          {Object.keys(ledger?.balances ?? {}).length === 0 && (
            <p className="text-sm text-[var(--muted)]">تر اوسه هیڅ ثبت نشته.</p>
          )}
        </div>
        <table className="w-full text-xs">
          <thead className="text-right text-[var(--muted)]">
            <tr>
              <th className="py-1">نېټه</th>
              <th className="py-1">توضیح</th>
              <th className="py-1">حساب</th>
              <th className="py-1">بدهکار</th>
              <th className="py-1">بستانکار</th>
              <th className="py-1">پیسه</th>
            </tr>
          </thead>
          <tbody>
            {ledger?.lines.map((l) => (
              <tr key={l.id} className="border-t border-[var(--border)]">
                <td className="py-1">{l.transaction?.transactionDate}</td>
                <td className="py-1">{l.description ?? l.transaction?.memo ?? "—"}</td>
                <td className="py-1">{l.account?.name}</td>
                <td className="py-1 text-green-700">{l.direction === "debit" ? l.amount : ""}</td>
                <td className="py-1 text-red-700">{l.direction === "credit" ? l.amount : ""}</td>
                <td className="py-1">{l.currencyCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
