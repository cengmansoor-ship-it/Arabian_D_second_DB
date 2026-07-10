import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Party, type PartyLedgerResponse, type PartyType } from "../lib/api";
import { ArrowRight, Edit2, Save, X } from "lucide-react";

const TYPE_LABELS: Record<PartyType, string> = {
  individual_customer: "انفرادي پیرودونکی", market_customer: "بازار پیرودونکی",
  supplier: "عرضه کوونکی", sales_customer: "د پلورنې پیرودونکی",
  tenant: "کرایه‌دار", exchange_dealer: "صرافی",
  employee: "کارمند", partner: "شریک/پانګه‌وال", other: "نور",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value ?? "—"}</span>
    </div>
  );
}

export default function PartyDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: party } = useQuery({ queryKey: ["party", id], queryFn: () => api.get<Party>(`/parties/${id}`) });
  const { data: ledger } = useQuery({ queryKey: ["party-ledger", id], queryFn: () => api.get<PartyLedgerResponse>(`/parties/${id}/ledger`) });

  const [editForm, setEditForm] = useState<Partial<Party> | null>(null);
  const updateMutation = useMutation({
    mutationFn: () => api.put(`/parties/${id}`, editForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["party", id] }); setEditForm(null); },
  });

  if (!party) return null;
  const showDebtWarning = Object.values(ledger?.balances ?? {}).some((b) => Number(b.net) > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link to="/parties" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          اشخاص <ArrowRight size={13} />
        </Link>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ fontSize: 13 }}>{party.name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <p className="page-title" style={{ margin: 0 }}>{party.name}</p>
        <span className="badge badge-muted">{TYPE_LABELS[party.type]}</span>
      </div>
      <p className="page-sub">د شخص معلومات او د حساب کتاب</p>

      {showDebtWarning && (
        <div style={{ background: "var(--warning-light)", border: "1px solid #FCD34D", borderRadius: 6, padding: "12px 16px", marginBottom: 20, fontSize: 13, fontWeight: 600, color: "#92400E" }}>
          ⚠ دا شخص پور (طلب) لري — لاندې پاتې حسابونه وګورئ.
        </div>
      )}

      {/* Info card */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>معلومات</div>
          {!editForm && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditForm({})}>
              <Edit2 size={13} />سمول
            </button>
          )}
        </div>

        {editForm ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
              {(
                [
                  { key: "name",   label: "نوم",      get: (p: Party) => p.name         },
                  { key: "phone1", label: "تلیفون ۱", get: (p: Party) => p.phone1 ?? "" },
                  { key: "phone2", label: "تلیفون ۲", get: (p: Party) => p.phone2 ?? "" },
                ] as { key: keyof Party; label: string; get: (p: Party) => string }[]
              ).map(({ key, label, get }) => (
                <div key={String(key)}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" value={(editForm?.[key] as string | undefined) ?? get(party)} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">آدرس</label>
                <input className="form-input" value={editForm.address ?? party.address ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Save size={14} />ساتل</button>
              <button className="btn btn-outline" onClick={() => setEditForm(null)}><X size={14} />لغوه</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
            <InfoRow label="د پلار نوم" value={party.fatherName} />
            <InfoRow label="د نیکه نوم" value={party.grandfatherName} />
            <InfoRow label="تذکره" value={party.tazkiraNumber} />
            <InfoRow label="د مالیې شمېره" value={party.taxRegNumber} />
            <InfoRow label="تلیفون ۱" value={party.phone1} />
            <InfoRow label="تلیفون ۲" value={party.phone2} />
            <div style={{ gridColumn: "1/-1" }}>
              <InfoRow label="آدرس" value={party.address} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <InfoRow label="یادداشتونه" value={party.notes} />
            </div>
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          د حساب کتاب (لیجر)
        </div>

        {/* Balances */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          {Object.entries(ledger?.balances ?? {}).map(([code, b]) => {
            const net = Number(b.net);
            return (
              <div key={code} style={{ padding: "10px 16px", borderRadius: 6, background: net > 0 ? "var(--danger-light)" : net < 0 ? "var(--success-light)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{code}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: net > 0 ? "var(--danger)" : net < 0 ? "var(--success)" : "var(--muted)" }}>
                  {net > 0 ? `پور: ${b.net}` : net < 0 ? `طلب: ${Math.abs(net)}` : "متوازن"}
                </div>
              </div>
            );
          })}
          {Object.keys(ledger?.balances ?? {}).length === 0 && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>تر اوسه هیڅ ثبت نشته.</span>
          )}
        </div>

        {/* Lines table */}
        <div style={{ overflow: "auto" }}>
          <table className="fl-table" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>نیټه</th><th>توضیح</th><th>حساب</th><th>بدهکار</th><th>بستانکار</th><th>پیسه</th></tr>
            </thead>
            <tbody>
              {ledger?.lines.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{l.transaction?.transactionDate}</td>
                  <td style={{ color: "var(--muted)" }}>{l.description ?? l.transaction?.memo ?? "—"}</td>
                  <td>{l.account?.name}</td>
                  <td style={{ color: "var(--success)", fontWeight: 500 }}>{l.direction === "debit" ? l.amount : ""}</td>
                  <td style={{ color: "var(--danger)", fontWeight: 500 }}>{l.direction === "credit" ? l.amount : ""}</td>
                  <td style={{ color: "var(--muted)" }}>{l.currencyCode}</td>
                </tr>
              ))}
              {!ledger?.lines.length && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>هیڅ کرښه نشته.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
