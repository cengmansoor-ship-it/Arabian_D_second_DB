import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, X, Undo2, Printer } from "lucide-react";
import { api, type Purchase, type PurchaseStatus } from "../lib/api";
import JalaliDateInput from "../components/JalaliDateInput";
import PrintHeader from "../components/PrintHeader";
import { isoToJalaliString, todayIso } from "../lib/jalali";
import Decimal from "decimal.js";

const STATUS_LABELS: Record<PurchaseStatus, string> = { open: "پرانیستی", paid: "تادیه شوی", cancelled: "لغوه شوی" };
const STATUS_COLORS: Record<PurchaseStatus, string> = { open: "badge-warning", paid: "badge-success", cancelled: "badge-danger" };

const CURRENCY_NAMES: Record<string, string> = {
  AFN: "افغانۍ",
  USD: "ډالر",
  PKR: "کلدار",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "نغدي",
  bank_transfer: "بانکي",
  other: "نور",
};

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  // Payment form
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");

  // Return form — columns: شمیره، تاریخ، تفصیل، بیل نمبر، تعداد، قیمت، مجموع
  const [returnItem, setReturnItem] = useState("");
  const [returnQty, setReturnQty] = useState("1");
  const [returnUnitPrice, setReturnUnitPrice] = useState("");
  const [returnDate, setReturnDate] = useState(todayIso());
  const [returnReason, setReturnReason] = useState("");

  const [error, setError] = useState<string | null>(null);

  const { data: purchase } = useQuery({ queryKey: ["purchase", id], queryFn: () => api.get<Purchase>(`/purchases/${id}`) });

  const addPaymentMutation = useMutation({
    mutationFn: () =>
      api.post(`/purchases/${id}/payments`, {
        amount,
        currencyCode: purchase?.currencyCode,
        paymentDate,
        method,
        note: note || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase", id] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
      setShowPaymentForm(false);
      setAmount(""); setNote(""); setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  // Compute return total from qty * unitPrice
  const returnTotal = (() => {
    const qty = parseFloat(returnQty) || 0;
    const price = parseFloat(returnUnitPrice) || 0;
    return new Decimal(qty).times(new Decimal(price)).toString();
  })();

  const addReturnMutation = useMutation({
    mutationFn: () =>
      api.post(`/purchases/${id}/returns`, {
        returnDate,
        returnedItemName: returnItem,
        quantity: returnQty,
        amount: returnTotal,
        currencyCode: purchase?.currencyCode,
        reason: returnReason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase", id] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
      setShowReturnForm(false);
      setReturnItem(""); setReturnQty("1"); setReturnUnitPrice(""); setReturnReason(""); setError(null);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "ناکامي"),
  });

  if (!purchase) return null;

  const curName = CURRENCY_NAMES[purchase.currencyCode] ?? purchase.currencyCode;
  const totalAmt = new Decimal(purchase.totalAmount || "0");
  const balAmt = new Decimal(purchase.balance ?? "0");
  const paidAmt = totalAmt.minus(balAmt);

  // Running balance for payments
  let payRunning = new Decimal(totalAmt);
  const paymentsWithBal = (purchase.payments ?? []).map((p) => {
    payRunning = payRunning.minus(new Decimal(p.amount || "0"));
    return { ...p, runningBalance: payRunning.toString() };
  });

  return (
    <div>
      <PrintHeader title={`د خریداري کهاته — ${purchase.purchaseNumber}`} />
      <div className="no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Link to="/purchases" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
            خریداري <ArrowRight size={13} />
          </Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <span style={{ fontSize: 13 }}>{purchase.purchaseNumber}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <p className="page-title" style={{ margin: 0 }}>{purchase.itemName}</p>
            <span className={`badge ${STATUS_COLORS[purchase.status]}`}>{STATUS_LABELS[purchase.status]}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> چاپ
          </button>
        </div>
        <p className="page-sub">
          عرضه کوونکی: {purchase.supplier?.name ?? "—"} — تعداد: {purchase.quantity} {purchase.unitOfMeasure ?? ""} — نیټه: {isoToJalaliString(purchase.purchaseDate)}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, margin: "16px 0" }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>فی واحد قیمت</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{purchase.unitPrice} {curName}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>مجموع</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{purchase.totalAmount} {curName}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>رسید شوي</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--success)" }}>{paidAmt.toString()} {curName}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>الباقی</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: balAmt.gt(0) ? "var(--danger)" : "var(--success)" }}>
            {purchase.balance} {curName}
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: "flex", gap: 8, alignItems: "center" }}>
          {purchase.status !== "cancelled" && (
            <button className="btn btn-primary btn-sm" onClick={() => { setError(null); setShowPaymentForm(true); }}>
              <Plus size={14} /> رسیده پیسي
            </button>
          )}
          {purchase.status !== "cancelled" && (
            <button className="btn btn-outline btn-sm" onClick={() => { setError(null); setShowReturnForm(true); }}>
              <Undo2 size={14} /> واپسي اجناس
            </button>
          )}
        </div>
      </div>

      {/* Payments table — columns: شمیره، تاریخ، تفصیل، مجموع (رسید)، الباقی */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          رسیده پیسي
        </div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>شمیره</th>
              <th>تاریخ</th>
              <th>تفصیل/یادداشت</th>
              <th>طریقه</th>
              <th>رسید شوي</th>
              <th>الباقی</th>
            </tr>
          </thead>
          <tbody>
            {paymentsWithBal.map((p, idx) => (
              <tr key={p.id}>
                <td style={{ color: "var(--muted)" }}>{idx + 1}</td>
                <td style={{ whiteSpace: "nowrap" }}>{isoToJalaliString(p.paymentDate)}</td>
                <td>{p.note ?? "—"}</td>
                <td>{METHOD_LABELS[p.method] ?? p.method}</td>
                <td style={{ color: "var(--success)", fontWeight: 600 }}>{p.amount} {curName}</td>
                <td style={{ fontWeight: 600, color: new Decimal(p.runningBalance).gt(0) ? "var(--danger)" : "var(--success)" }}>
                  {p.runningBalance} {curName}
                </td>
              </tr>
            ))}
            {!purchase.payments?.length && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ رسیده نشته.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Returns table — columns: شمیره، تاریخ، تفصیل، بیل نمبر، تعداد، قیمت، مجموع */}
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          واپسي اجناس
        </div>
        <table className="fl-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>شمیره</th>
              <th>تاریخ</th>
              <th>تفصیل</th>
              <th>بیل نمبر</th>
              <th>تعداد</th>
              <th>قیمت</th>
              <th>مجموع</th>
            </tr>
          </thead>
          <tbody>
            {(purchase.returns ?? []).map((r, idx) => (
              <tr key={r.id}>
                <td style={{ color: "var(--muted)" }}>{idx + 1}</td>
                <td style={{ whiteSpace: "nowrap" }}>{isoToJalaliString(r.returnDate)}</td>
                <td>{r.returnedItemName}</td>
                <td style={{ color: "var(--muted)" }}>{r.returnNumber}</td>
                <td>{r.quantity}</td>
                <td>{r.reason}</td>
                <td style={{ fontWeight: 600 }}>{r.amount} {curName}</td>
              </tr>
            ))}
            {!purchase.returns?.length && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>تر اوسه هېڅ واپسي نشته.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 440, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>رسیده پیسي ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPaymentForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">مبلغ ({curName})</label>
                <input className="form-input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="form-label">نیټه</label>
                <JalaliDateInput value={paymentDate} onChange={setPaymentDate} />
              </div>
              <div>
                <label className="form-label">طریقه</label>
                <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="cash">نغدي</option>
                  <option value="bank_transfer">بانکي</option>
                  <option value="other">نور</option>
                </select>
              </div>
              <div>
                <label className="form-label">یادداشت</label>
                <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" disabled={!amount || addPaymentMutation.isPending} onClick={() => addPaymentMutation.mutate()}>ثبت کول</button>
              <button className="btn btn-outline" onClick={() => setShowPaymentForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN MODAL — شمیره، تاریخ، تفصیل، بیل نمبر، تعداد، قیمت، مجموع */}
      {showReturnForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card" style={{ width: 480, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>واپسي اجناس ثبتول</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowReturnForm(false)}><X size={14} /></button>
            </div>
            {error && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px 14px", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="form-label">تفصیل/جنس نوم</label>
                <input className="form-input" value={returnItem} onChange={(e) => setReturnItem(e.target.value)} placeholder={purchase.itemName} />
              </div>
              <div>
                <label className="form-label">نیټه</label>
                <JalaliDateInput value={returnDate} onChange={setReturnDate} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <div>
                  <label className="form-label">تعداد</label>
                  <input className="form-input" type="number" min={0} value={returnQty} onChange={(e) => setReturnQty(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">فی واحد قیمت</label>
                  <input className="form-input" type="number" min={0} value={returnUnitPrice} onChange={(e) => setReturnUnitPrice(e.target.value)} />
                </div>
              </div>
              <div style={{ background: "var(--surface-2)", padding: "10px 14px", borderRadius: 6, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>مجموع: </span>
                <strong>{returnTotal} {curName}</strong>
              </div>
              <div>
                <label className="form-label">دلیل/تفصیل</label>
                <input className="form-input" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={!returnItem || !returnQty || !returnUnitPrice || !returnReason || addReturnMutation.isPending}
                onClick={() => addReturnMutation.mutate()}
              >
                ثبت کول
              </button>
              <button className="btn btn-outline" onClick={() => setShowReturnForm(false)}>لغوه</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
