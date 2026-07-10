import { useQuery } from "@tanstack/react-query";
import { api, type AuditLogEntry } from "../lib/api";

export default function AuditLogPage() {
  const { data } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.get<{ total: number; items: AuditLogEntry[] }>("/audit-logs?limit=100"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">د بدلونونو راپور</h1>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] text-right">
            <tr>
              <th className="px-4 py-2">نیټه</th>
              <th className="px-4 py-2">کارن</th>
              <th className="px-4 py-2">کړنه</th>
              <th className="px-4 py-2">ډول</th>
              <th className="px-4 py-2">شمېره</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2 text-xs text-[var(--muted)]">{new Date(e.createdAt).toLocaleString("en-GB")}</td>
                <td className="px-4 py-2">{e.username ?? "—"}</td>
                <td className="px-4 py-2">{e.action}</td>
                <td className="px-4 py-2">{e.entityType}</td>
                <td className="px-4 py-2 text-xs text-[var(--muted)]">{e.entityId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
