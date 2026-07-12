import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/welcome" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 423) {
        setError("ستاسو حساب د ناسمو هڅو له امله بند شوی دی. مهرباني وکړئ له اداره کوونکي سره اړیکه ونیسئ.");
      } else if (err instanceof ApiError) {
        setError("کارن نوم یا پټنوم سم نه دی");
      } else {
        setError("د سرور سره وصل کیدل ونشول");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", background: "var(--surface)" }}>
      {/* Right side (form) — first in RTL reading order */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
              اربین ډي استوګنځای
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
              د مدیریت سیسټم ته ننوتل — خپل کارن نوم او پټنوم دننه کړئ.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "var(--danger-light)",
                color: "var(--danger)",
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 20,
                border: "1px solid var(--danger)",
                opacity: 0.9,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">کارن نوم</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)" }}>
                  <Mail size={18} />
                </div>
                <input
                  className="form-input"
                  style={{ paddingRight: 44 }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                  placeholder="admin"
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">پټنوم</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)" }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  style={{ paddingRight: 44, paddingLeft: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <div
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", height: 50, fontSize: 16, borderRadius: 8, fontWeight: 600 }}
            >
              {submitting ? "لطفاً انتظار وکړئ..." : "سیسټم ته ننوتل"}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              borderRadius: 8,
              background: "var(--surface-2)",
              padding: 14,
              textAlign: "center",
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            د نوي حساب جوړول یوازې د اداره کوونکي له لارې کیږي.
          </div>
        </div>
      </div>

      {/* Left side — branded dark panel with decorative grid */}
      <div
        className="login-brand-panel"
        style={{
          flex: 1,
          background: "var(--sidebar-bg)",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="540"
          height="540"
          viewBox="0 0 540 540"
          fill="none"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.06 }}
        >
          <defs>
            <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="540" height="540" fill="url(#grid)" />
        </svg>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 340, textAlign: "center", padding: "0 32px" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
            }}
          >
            <Building2 size={44} color="#fff" />
          </div>
          <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, marginBottom: 16 }}>اربین ډي استوګنځای</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.8 }}>
            د پروژو، پلورنو، کرایې، تدارکاتو، کارکوونکو او مالي حسابونو بشپړ مدیریت — ټول په یو ځای کې.
          </p>
        </div>
      </div>

      <style>{`
        .login-brand-panel { display: none; }
        @media (min-width: 1024px) {
          .login-brand-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
