import { useQuery } from "@tanstack/react-query";
import { api, type CompanySettings } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<CompanySettings>("/settings"),
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">کورپاڼه</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        ښه راغلاست، {user?.fullName} — {settings?.companyName ?? "..."}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm text-[var(--muted)]">اصلي پیسه</div>
          <div className="mt-1 text-2xl font-bold">{settings?.baseCurrencyCode ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm text-[var(--muted)]">ستاسو رول</div>
          <div className="mt-1 text-2xl font-bold">{user?.roles.join("، ")}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm text-[var(--muted)]">د سیسټم حالت</div>
          <div className="mt-1 text-2xl font-bold text-[var(--primary)]">فعال</div>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        د پروژو، پلورنې، کرایې، پیرودنې او نورو مالي ماډیولونو معلومات به دلته وروسته له جوړېدو ښکاره شي.
      </div>
    </div>
  );
}
