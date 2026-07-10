import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2, Mail, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? "کارن نوم یا پټنوم سم نه دی" : "د سرور سره وصل کیدل ونشول");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 900,
          display: "flex",
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Left side - Branded panel */}
        <div
          style={{
            flex: 1,
            background: "var(--sidebar-bg)",
            padding: "48px 40px",
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
          className="md:flex"
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Building2 size={40} color="#fff" />
          </div>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>اربین ډي استوګنځای</h1>
          <p style={{ color: "var(--sidebar-muted)", fontSize: 16, lineHeight: 1.6, maxWidth: 300 }}>
            د مدیریت سیسټم ته ښه راغلاست. د خپلو چارو د اداره کولو لپاره خپل حساب ته ننوځئ.
          </p>
        </div>

        {/* Right side - Form */}
        <div style={{ flex: 1, padding: "60px 48px", background: "var(--surface)" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>ننوتل</h2>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>مهرباني وکړئ خپل معلومات دننه کړئ.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">کارن نوم</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
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
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingRight: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "var(--danger-light)",
                  color: "var(--danger)",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 20,
                  border: "1px solid var(--danger)",
                  opacity: 0.8
                }}
              >
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", height: 50, fontSize: 16, borderRadius: 6, fontWeight: 600 }}
            >
              {submitting ? "..." : "سیسټم ته ننوتل"}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
