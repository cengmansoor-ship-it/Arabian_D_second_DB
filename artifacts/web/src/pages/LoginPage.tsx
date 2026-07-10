import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2 } from "lucide-react";
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
        background: "var(--sidebar-bg)",
        padding: 16,
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface)",
          borderRadius: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: "var(--primary)",
            padding: "28px 32px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Building2 size={28} color="#fff" />
          </div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            اربین ډي استوګنځای
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            د مدیریت سیسټم ته ننوتل
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "28px 32px" }}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">کارن نوم</label>
            <input
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              placeholder="admin"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">پټنوم</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div
              style={{
                background: "var(--danger-light)",
                color: "var(--danger)",
                padding: "8px 12px",
                borderRadius: 4,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", height: 42, fontSize: 15 }}
          >
            {submitting ? "..." : "ننوتل"}
          </button>
        </form>
      </div>
    </div>
  );
}
