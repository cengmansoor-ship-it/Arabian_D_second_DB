import { useQuery } from "@tanstack/react-query";
import { api, type AuditLogEntry } from "../lib/api";
import { ScrollText } from "lucide-react";

const ACTION_BADGE: Record<string, string> = {
  create: "badge-success",
  update: "badge-info",
  delete: "badge-danger",
};

export default function AuditLogPage() {
  const { data } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.get<{ total: number; items: AuditLogEntry[] }>("/audit-logs?limit=100"),
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">د بدلونونو راپور</h1>
        <div className="page-breadcrumb">
          <span>کورپاڼه</span>
          <span>/</span>
          <span>راپورونه</span>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-header">
           <div>د سیسټم ټولې کړنې — {data?.total ?? "..."} ثبتونه</div>
        </div>
        <table className="fl-table">
          <thead>
            <tr>
              <th>نیټه / وخت</th>
              <th>کارن</th>
              <th>کړنه</th>
              <th>ډول</th>
              <th>شمېره</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id}>
                <td style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {new Date(e.createdAt).toLocaleString("en-GB")}
                </td>
                <td style={{ fontWeight: 500 }}>{e.username ?? "—"}</td>
                <td>
                  <span className={`badge ${ACTION_BADGE[e.action] ?? "badge-muted"}`}>
                    {e.action}
                  </span>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 14 }}>{e.entityType}</td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>{e.entityId ?? "—"}</td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                  <ScrollText size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  هیڅ راپور ونه موندل شو.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
