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

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

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
    <div className="flex h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Building2 className="h-10 w-10 text-[var(--primary)]" />
          <h1 className="text-lg font-bold">اربین ډي استوګنځای</h1>
          <p className="text-sm text-[var(--muted)]">د مدیریت سیسټم ته ننوتل</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">کارن نوم</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">پټنوم</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--primary)] py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-60"
          >
            {submitting ? "..." : "ننوتل"}
          </button>
        </form>
      </div>
    </div>
  );
}
