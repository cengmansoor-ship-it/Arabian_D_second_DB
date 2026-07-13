import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, X, Undo2 } from "lucide-react";
import { api, type Purchase, type PurchaseStatus } from "../lib/api";

const STATUS_LABELS: Record<PurchaseStatus, string> = { open: "پرانیستی", paid: "تادیه شوی", cancelled: "لغوه شوی" };

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [returnItem, setReturnItem] = useState("");
  const [returnQty, setReturnQty] = useState("1");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: purchase } = useQuery({ queryKey: ["purchase", id], queryFn: () => api.get<Purchase>(`/purchases/${id}`) });

  const addPaymentMutation = useMutation({
    mutationFn: () =>
      api.post(`/purchases/${id}/payments`, { amount, currencyCode: purchase?.currencyCode, paymentDate, method, note: note || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase", id] });
      setShowPaymentForm(false);
      setAmount(""); setNote(""); setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  const addReturnMutation = useMutation({
    mutationFn: () =>
      api.post(`/purchases/${id}/returns`, {
        returnDate: new Date().toISOString().slice(0, 10),
        returnedItemName: returnItem,
        quantity: returnQty,
        amount: returnAmount,
        currencyCode: purchase?.currencyCode,
        reason: returnReason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase", id] });
      setShowReturnForm(false);
      setReturnItem(""); setReturnQty("1"); setReturnAmount(""); setReturnReason(""); setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  if (!purchase) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link to="/purchases" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          پیرودنې <ArrowRight size={13} />
        </Link>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ fontSize: 13 }}>{purchase.purchaseNumber}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <p className="page-title" style={{ margin: 0 }}>{purchase.purchaseNumber}</p>
        <span className="badge badge-info">{STATUS_LABELS[purchase.status]}</span>
      </div>
      <p className="page-sub">عرضه کوونکی: {purchase.supplier?.name} — توکی: {purchase.itemName} ({purchase.quantity} {purchase.unitOfMeasure ?? ""})</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0" }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>ټول مبلغ</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{purchase.totalAmount} {purchase.currencyCode}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>پاتې حساب</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: Number(purchase.balance ?? 0) > 0 ? "var(--danger)" : "var(--success)" }}>{purchase.balance}</div>
        </div>
        <div className="card" style={{ padding: 16, display: "flex", gap: 8, alignItems: "center" }}>
          {purchase.status !== "cancelled" && Number(purchase.balance ?? 0) !== 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentForm(true)}><Plus size={14} /> تادیه</button>
          )}
          {purchase.status !== "cancelled" && Number(purchase.balance ?? 0) > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowReturnForm(true)}><Undo2 size={14} /> بېرته ورکول</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>تادیات</div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead><tr><th>د تادیې شمېره</th><th>نېټه</th><th>مبلغ</th><th>طریقه</th></tr></thead>
          <tbody>
            {purchase.payments?.map((p) => (
              <tr key={p.id}><td>{p.paymentNumber}</td><td>{p.paymentDate}</td><td>{p.amount}</td><td>{p.method}</td></tr>
            ))}
            {!purchase.payments?.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ تادیه نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>بېرته شوي توکي</div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead><tr><th>د بېرته شمېره</th><th>نېټه</th><th>توکی</th><th>مقدار</th><th>مبلغ</th><th>دلیل</th></tr></thead>
          <tbody>
            {purchase.returns?.map((r) => (
              <tr key={r.id}><td>{r.returnNumber}</td><td>{r.returnDate}</td><td>{r.returnedItemName}</td><td>{r.quantity}</td><td>{r.amount}</td><td>{r.reason}</td></tr>
            ))}
            {!purchase.returns?.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ بېرته شوی توکی نشته.</td></tr>}
          </tbody>
        </table>
      </div>

      {showPaymentForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 420, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>نوې تادیه</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPaymentForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div><label className="form-label">مبلغ</label><input className="form-input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              <div><label className="form-label">نېټه</label><input className="form-input" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></div>
              <div>
                <label className="form-label">طریقه</label>
                <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="cash">نغدي</option>
                  <option value="bank_transfer">بانکي</option>
                </select>
              </div>
              <div><label className="form-label">یادداشت</label><input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!amount || addPaymentMutation.isPending} onClick={() => addPaymentMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowPaymentForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}

      {showReturnForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 420, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>د توکي بېرته ورکول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowReturnForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div><label className="form-label">توکی</label><input className="form-input" value={returnItem} onChange={(e) => setReturnItem(e.target.value)} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div><label className="form-label">مقدار</label><input className="form-input" type="number" min={0} value={returnQty} onChange={(e) => setReturnQty(e.target.value)} /></div>
                <div><label className="form-label">مبلغ</label><input className="form-input" type="number" min={0} value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} /></div>
              </div>
              <div><label className="form-label">دلیل</label><input className="form-input" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!returnItem || !returnQty || !returnAmount || !returnReason || addReturnMutation.isPending} onClick={() => addReturnMutation.mutate()}>ثبتول</button>
              <button className="btn btn-outline" onClick={() => setShowReturnForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
